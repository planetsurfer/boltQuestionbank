import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Save, X, Edit, Trash2, Upload, Search, Settings, FileDown, Check, Wand2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { getQuestionTitles, saveQuestionTitles, getSubjects, saveSubjects, getLevels, saveLevels } from './lib/constants';
import Papa from 'papaparse';
import { EditField } from './components/EditField';
import { PreviewHTML } from './components/PreviewHTML';
import { ManageTitlesModal } from './components/ManageTitlesModal';
import { WorksheetPDF } from './components/WorksheetPDF';
import { WorksheetGenerator } from './components/WorksheetGenerator';

// 10MB size limit for CSV files
const MAX_CSV_SIZE = 25 * 1024 * 1024;
const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 300;

interface Question {
  id: string;
  question_title: string;
  level: string;
  subject: string;
  marks: string;
  paper: string | null;
  question_number: string | null;
  reference_code: string | null;
  timezone: string | null;
  adapted_from: string | null;
  question_diagram: string | null;
  markscheme_image: string | null;
  question_body: string;
  markscheme_body: string | null;
  examiner_report: string | null;
  published_date: string | null;
  question_html: string | null;
  created_at: string;
  updated_at: string;
}

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Question>>({});
  const [uploading, setUploading] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showTitlesModal, setShowTitlesModal] = useState(false);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [questionTitles, setQuestionTitles] = useState<string[]>(getQuestionTitles());
  const [subjects, setSubjects] = useState<string[]>(getSubjects());
  const [levels, setLevels] = useState<string[]>(getLevels());
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [showPDF, setShowPDF] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  // Debounced search
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSearchQuery(value);
        setCurrentPage(1); // Reset to first page on new search
      }, DEBOUNCE_DELAY);
    };
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [currentPage, selectedSubject, selectedLevel, selectedTitle, searchQuery]);

  useEffect(() => {
    setTotalPages(Math.ceil(totalCount / ITEMS_PER_PAGE));
  }, [totalCount]);

  // Fetch topics for selected subject
  useEffect(() => {
    const fetchTopics = async () => {
      if (selectedSubject) {
        try {
          const { data, error } = await supabase
            .from('subject_topics')
            .select('topic')
            .eq('subject', selectedSubject);

          if (error) throw error;

          setAvailableTopics(data.map(item => item.topic));
        } catch (error) {
          console.error('Error fetching topics:', error);
          toast.error('Error fetching topics');
        }
      } else {
        setAvailableTopics([]);
      }
    };

    fetchTopics();
  }, [selectedSubject]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('questions')
        .select('*', { count: 'exact' });

      if (selectedSubject) {
        query = query.eq('subject', selectedSubject);
      }
      if (selectedLevel) {
        query = query.eq('level', selectedLevel);
      }
      if (selectedTitle) {
        query = query.ilike('question_title', `%${selectedTitle}%`);
      }
      if (searchQuery) {
        query = query.or(`question_body.ilike.%${searchQuery}%,reference_code.ilike.%${searchQuery}%`);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      setQuestions(data || []);
      setFilteredQuestions(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      toast.error('Error fetching questions');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Question deleted successfully');
      setQuestions(questions.filter(q => q.id !== id));
      setSelectedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      toast.error('Error deleting question');
      console.error('Error:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingId(question.id);
    setEditForm(question);
  };

  const handleCreate = () => {
    setEditingId('new');
    setEditForm({
      question_title: '',
      level: '',
      subject: '',
      marks: '',
      question_body: ''
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_CSV_SIZE) {
      toast.error(`File size must be less than ${MAX_CSV_SIZE / 1024 / 1024}MB`);
      event.target.value = '';
      return;
    }

    setUploading(true);
    const loadingToast = toast.loading('Uploading CSV file...');

    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const transformedData = results.data.map((row: any) => ({
              question_title: row.question_title || row.Question_title || '',
              level: row.level || row.Level || '',
              subject: row.subject || row.Subject || '',
              marks: row.marks || row.Marks || '',
              paper: row.paper || row.Paper || null,
              question_number: row.question_number || row.Question_number || null,
              reference_code: row.reference_code || row.Reference_code || null,
              timezone: row.timezone || row.Timezone || null,
              adapted_from: row.adapted_from || row.Adapted_from || null,
              question_diagram: row.question_diagram || row.Question_diagram || null,
              markscheme_image: row.markscheme_image || row.Markscheme_image || null,
              question_body: row.question_body || row.Question_body || '',
              markscheme_body: row.markscheme_body || row.Markscheme_body || null,
              examiner_report: row.examiner_report || row.Examiner_report || null,
              published_date: row.published_date || row.Published_date || null,
              question_html: row.question_html || row.Question_html || null
            }));

            const { error } = await supabase
              .from('questions')
              .insert(transformedData);

            if (error) throw error;

            toast.success(`Successfully uploaded ${transformedData.length} questions`);
            fetchQuestions();
          } catch (error) {
            console.error('Error processing CSV:', error);
            toast.error('Error processing CSV file');
          }
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          toast.error('Error parsing CSV file');
        }
      });
    } catch (error) {
      console.error('File reading error:', error);
      toast.error('Error reading CSV file');
    } finally {
      toast.dismiss(loadingToast);
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (!editForm.question_title || !editForm.level || !editForm.subject || !editForm.marks || !editForm.question_body) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (editingId === 'new') {
        const { error } = await supabase
          .from('questions')
          .insert([editForm]);
        if (error) throw error;
        toast.success('Question created successfully');
      } else {
        const { error } = await supabase
          .from('questions')
          .update(editForm)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Question updated successfully');
      }
      
      setEditingId(null);
      fetchQuestions();
    } catch (error) {
      toast.error('Error saving question');
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitlesSave = (titles: string[]) => {
    setQuestionTitles(titles);
    saveQuestionTitles(titles);
    setSelectedTitle('');
  };

  const handleSubjectsSave = (newSubjects: string[]) => {
    setSubjects(newSubjects);
    saveSubjects(newSubjects);
    setSelectedSubject('');
  };

  const handleLevelsSave = (newLevels: string[]) => {
    setLevels(newLevels);
    saveLevels(newLevels);
    setSelectedLevel('');
  };

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCreateWorksheet = () => {
    if (selectedQuestions.size === 0) {
      toast.error('Please select at least one question');
      return;
    }
    setShowPDF(true);
  };

  const handleGenerateWorksheet = (generatedQuestions: Question[]) => {
    setShowGenerator(false);
    setSelectedQuestions(new Set(generatedQuestions.map(q => q.id)));
    setShowPDF(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const selectedQuestionsList = questions.filter(q => selectedQuestions.has(q.id));

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Question Bank</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGenerator(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Wand2 size={20} />
                Generate Worksheet
              </button>
              <label className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload size={20} />
                Upload CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={20} />
                Add Question
              </button>
              <button
                onClick={handleCreateWorksheet}
                disabled={selectedQuestions.size === 0}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg ${
                  selectedQuestions.size === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <FileDown size={20} />
                Create Worksheet ({selectedQuestions.size})
              </button>
            </div>
          </div>

          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4">
              {/* Subject Filter */}
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Subject
                </label>
                <div className="relative flex gap-2">
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setSelectedTitle('');
                      setCurrentPage(1);
                    }}
                    className="w-full pl-3 pr-10 py-2 border rounded-lg appearance-none bg-white"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowSubjectsModal(true)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 border rounded-lg"
                    title="Manage Subjects"
                  >
                    <Settings size={20} />
                  </button>
                </div>
              </div>

              {/* Level Filter */}
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Level
                </label>
                <div className="relative flex gap-2">
                  <select
                    value={selectedLevel}
                    onChange={(e) => {
                      setSelectedLevel(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-3 pr-10 py-2 border rounded-lg appearance-none bg-white"
                  >
                    <option value="">All Levels</option>
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowLevelsModal(true)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 border rounded-lg"
                    title="Manage Levels"
                  >
                    <Settings size={20} />
                  </button>
                </div>
              </div>

              {/* Question Title Filter */}
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Question Title
                </label>
                <div className="relative flex gap-2">
                  <select
                    value={selectedTitle}
                    onChange={(e) => {
                      setSelectedTitle(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-3 pr-10 py-2 border rounded-lg appearance-none bg-white"
                  >
                    <option value="">All Questions</option>
                    {availableTopics.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowTitlesModal(true)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 border rounded-lg"
                    title="Manage Titles"
                  >
                    <Settings size={20} />
                  </button>
                </div>
              </div>

              {/* Search Box */}
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Questions
                </label>
                <div className="relative">
                  <input
                    type="text"
                    onChange={(e) => debouncedSearch(e.target.value)}
                    placeholder="Search question body or reference code..."
                    className="w-full pl-10 pr-3 py-2 border rounded-lg"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin h-8 w-8 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-600">Loading questions...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Select</th>
                      <th className="px-4 py-2 text-left">Level</th>
                      <th className="px-4 py-2 text-left">Subject</th>
                      <th className="px-4 py-2 text-left">Question</th>
                      <th className="px-4 py-2 text-left">Markscheme</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((question) => (
                      <tr key={question.id} className="border-t">
                        <td className="px-4 py-2">
                          <button
                            onClick={() => toggleQuestionSelection(question.id)}
                            className={`p-1 rounded ${
                              selectedQuestions.has(question.id)
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Check size={18} />
                          </button>
                        </td>
                        <td className="px-4 py-2">{question.level}</td>
                        <td className="px-4 py-2">{question.subject}</td>
                        <td className="px-4 py-2">
                          <PreviewHTML 
                            html={question.question_body}
                            className="max-h-24 overflow-y-auto"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <PreviewHTML 
                            html={question.markscheme_body || ''}
                            className="max-h-24 overflow-y-auto"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(question)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(question.id)}
                              disabled={isDeleting === question.id}
                              className={`p-1 ${
                                isDeleting === question.id
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-red-600 hover:text-red-800'
                              }`}
                            >
                              {isDeleting === question.id ? (
                                <Loader2 className="animate-spin" size={18} />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)}</span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
                        </span>{' '}
                        of <span className="font-medium">{totalCount}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                            currentPage === 1 ? 'cursor-not-allowed' : 'hover:text-gray-500'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              page === currentPage
                                ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                            currentPage === totalPages ? 'cursor-not-allowed' : 'hover:text-gray-500'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showTitlesModal && (
        <ManageTitlesModal
          title="Question Titles"
          items={questionTitles}
          onSave={handleTitlesSave}
          onClose={() => setShowTitlesModal(false)}
          isQuestionTitles={true}
          subjects={subjects}
        />
      )}

      {showSubjectsModal && (
        <ManageTitlesModal
          title="Subjects"
          items={subjects}
          onSave={handleSubjectsSave}
          onClose={() => setShowSubjectsModal(false)}
        />
      )}

      {showLevelsModal && (
        <ManageTitlesModal
          title="Levels"
          items={levels}
          onSave={handleLevelsSave}
          onClose={() => setShowLevelsModal(false)}
        />
      )}

      {showGenerator && (
        <WorksheetGenerator
          subjects={subjects}
          questionTitles={questionTitles}
          onClose={() => setShowGenerator(false)}
          onGenerateWorksheet={handleGenerateWorksheet}
        />
      )}

      {showPDF && (
        <WorksheetPDF
          questions={selectedQuestionsList}
          onClose={() => setShowPDF(false)}
        />
      )}

      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingId === 'new' ? 'Add New Question' : 'Edit Question'}
              </h2>
              <button
                onClick={() => setEditingId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <EditField
                  label="Question Title"
                  value={editForm.question_title || ''}
                  onChange={(value) => setEditForm({ ...editForm, question_title: value })}
                  required
                />
                <EditField
                  label="Level"
                  value={editForm.level || ''}
                  onChange={(value) => setEditForm({ ...editForm, level: value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <EditField
                  label="Subject"
                  value={editForm.subject || ''}
                  onChange={(value) => setEditForm({ ...editForm, subject: value })}
                  required
                />
                <EditField
                  label="Marks"
                  value={editForm.marks || ''}
                  onChange={(value) => setEditForm({ ...editForm, marks: value })}
                  required
                />
              </div>

              <EditField
                label="Question Body"
                value={editForm.question_body || ''}
                onChange={(value) => setEditForm({ ...editForm, question_body: value })}
                type="html"
                required
              />

              <EditField
                label="Markscheme Body"
                value={editForm.markscheme_body || ''}
                onChange={(value) => setEditForm({ ...editForm, markscheme_body: value })}
                type="html"
              />

              <div className="grid grid-cols-2 gap-4">
                <EditField
                  label="Paper"
                  value={editForm.paper || ''}
                  onChange={(value) => setEditForm({ ...editForm, paper: value })}
                />
                <EditField
                  label="Question Number"
                  value={editForm.question_number || ''}
                  onChange={(value) => setEditForm({ ...editForm, question_number: value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <EditField
                  label="Reference Code"
                  value={editForm.reference_code || ''}
                  onChange={(value) => setEditForm({ ...editForm, reference_code: value })}
                />
                <EditField
                  label="Timezone"
                  value={editForm.timezone || ''}
                  onChange={(value) => setEditForm({ ...editForm, timezone: value })}
                />
              </div>

              <EditField
                label="Adapted From"
                value={editForm.adapted_from || ''}
                onChange={(value) => setEditForm({ ...editForm, adapted_from: value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <EditField
                  label="Question Diagram URL"
                  value={editForm.question_diagram || ''}
                  onChange={(value) => setEditForm({ ...editForm, question_diagram: value })}
                  type="url"
                />
                <EditField
                  label="Markscheme Image URL"
                  value={editForm.markscheme_image || ''}
                  onChange={(value) => setEditForm({ ...editForm, markscheme_image: value })}
                  type="url"
                />
              </div>

              <EditField
                label="Examiner Report"
                value={editForm.examiner_report || ''}
                onChange={(value) => setEditForm({ ...editForm, examiner_report: value })}
                type="html"
              />

              <EditField
                label="Published Date"
                value={editForm.published_date || ''}
                onChange={(value) => setEditForm({ ...editForm, published_date: value })}
              />

              <EditField
                label="Question HTML"
                value={editForm.question_html || ''}
                onChange={(value) => setEditForm({ ...editForm, question_html: value })}
                type="html"
              />
              
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Save size={20} />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;