import React, { useState } from 'react';
import { X, RefreshCw, Check, FileDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { PreviewHTML } from './PreviewHTML';

interface Question {
  id: string;
  question_title: string;
  level: string;
  subject: string;
  marks: string;
  question_body: string;
  markscheme_body: string | null;
}

interface WorksheetGeneratorProps {
  subjects: string[];
  questionTitles: string[];
  onClose: () => void;
  onGenerateWorksheet: (questions: Question[]) => void;
}

interface GeneratorForm {
  subject: string;
  questionTitle: string;
  level: string;
  count: number;
}

const LEVELS = ['HL', 'SL'];
const MAX_QUESTIONS = 15;

export function WorksheetGenerator({ 
  subjects, 
  questionTitles, 
  onClose,
  onGenerateWorksheet 
}: WorksheetGeneratorProps) {
  const [form, setForm] = useState<GeneratorForm>({
    subject: '',
    questionTitle: '',
    level: '',
    count: 5
  });

  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [acceptedQuestions, setAcceptedQuestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!form.subject || !form.questionTitle || !form.level || !form.count) {
      toast.error('Please fill in all fields');
      return;
    }

    if (form.count > MAX_QUESTIONS) {
      toast.error(`Maximum ${MAX_QUESTIONS} questions allowed`);
      return;
    }

    setLoading(true);

    try {
      // Get questions matching the criteria, excluding already accepted questions
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject', form.subject)
        .eq('level', form.level)
        .ilike('question_title', `%${form.questionTitle}%`)
        .not('id', 'in', `(${Array.from(acceptedQuestions).join(',')})`)
        .limit(form.count - acceptedQuestions.size);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('No questions found matching the criteria');
        return;
      }

      // Combine new questions with previously accepted ones
      const acceptedQuestionsArray = generatedQuestions.filter(q => 
        acceptedQuestions.has(q.id)
      );

      setGeneratedQuestions([...acceptedQuestionsArray, ...data]);
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Error generating questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (questionId: string) => {
    setAcceptedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.add(questionId);
      return newSet;
    });
  };

  const handleRegenerate = (questionId: string) => {
    setGeneratedQuestions(prev => 
      prev.filter(q => q.id !== questionId)
    );
    handleGenerate();
  };

  const handleCreateWorksheet = () => {
    if (acceptedQuestions.size === 0) {
      toast.error('Please accept at least one question');
      return;
    }

    const selectedQuestions = generatedQuestions.filter(q => 
      acceptedQuestions.has(q.id)
    );

    onGenerateWorksheet(selectedQuestions);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Worksheet Generator</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Generator Form */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full pl-3 pr-10 py-2 border rounded-lg"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic
              </label>
              <select
                value={form.questionTitle}
                onChange={(e) => setForm({ ...form, questionTitle: e.target.value })}
                className="w-full pl-3 pr-10 py-2 border rounded-lg"
              >
                <option value="">Select Topic</option>
                {questionTitles.map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="w-full pl-3 pr-10 py-2 border rounded-lg"
              >
                <option value="">Select Level</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions (max {MAX_QUESTIONS})
              </label>
              <input
                type="number"
                min="1"
                max={MAX_QUESTIONS}
                value={form.count}
                onChange={(e) => setForm({ ...form, count: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                <RefreshCw size={20} />
              )}
              Generate Questions
            </button>
          </div>

          {/* Generated Questions */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Generated Questions ({acceptedQuestions.size}/{form.count})
                </h3>
                <button
                  onClick={handleCreateWorksheet}
                  disabled={acceptedQuestions.size === 0}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg ${
                    acceptedQuestions.size === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <FileDown size={20} />
                  Create Worksheet
                </button>
              </div>

              <div className="space-y-4">
                {generatedQuestions.map((question) => (
                  <div 
                    key={question.id}
                    className={`border rounded-lg p-4 ${
                      acceptedQuestions.has(question.id)
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-sm text-gray-600">
                        {question.level} | {question.subject} | {question.marks} marks
                      </div>
                      <div className="flex gap-2">
                        {!acceptedQuestions.has(question.id) && (
                          <>
                            <button
                              onClick={() => handleAccept(question.id)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Accept Question"
                            >
                              <Check size={20} />
                            </button>
                            <button
                              onClick={() => handleRegenerate(question.id)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Regenerate Question"
                            >
                              <RefreshCw size={20} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <PreviewHTML 
                      html={question.question_body}
                      className="prose max-w-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}