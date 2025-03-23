import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface ManageTitlesModalProps {
  title: string;
  items: string[];
  onSave: (items: string[]) => void;
  onClose: () => void;
  isQuestionTitles?: boolean;
  subjects?: string[];
}

export function ManageTitlesModal({ 
  title, 
  items, 
  onSave, 
  onClose,
  isQuestionTitles = false,
  subjects = []
}: ManageTitlesModalProps) {
  const [editedItems, setEditedItems] = useState<string[]>(items);
  const [newItem, setNewItem] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load existing topics when managing question titles
  useEffect(() => {
    const loadTopics = async () => {
      if (isQuestionTitles) {
        try {
          const { data, error } = await supabase
            .from('subject_topics')
            .select('topic')
            .order('topic');

          if (error) throw error;

          setEditedItems(data.map(item => item.topic));
        } catch (error) {
          console.error('Error loading topics:', error);
          toast.error('Error loading topics');
        }
      }
    };

    loadTopics();
  }, [isQuestionTitles]);

  const handleAdd = async () => {
    if (!newItem.trim()) {
      toast.error('Please enter a value');
      return;
    }

    if (editedItems.includes(newItem.trim())) {
      toast.error('This item already exists');
      return;
    }

    if (isQuestionTitles && !selectedSubject) {
      toast.error('Please select a subject');
      return;
    }

    setLoading(true);

    try {
      if (isQuestionTitles) {
        const { error } = await supabase
          .from('subject_topics')
          .insert([{
            subject: selectedSubject,
            topic: newItem.trim()
          }]);

        if (error) throw error;
      }

      setEditedItems([...editedItems, newItem.trim()]);
      setNewItem('');
      setSelectedSubject('');
      toast.success('Topic added successfully');
    } catch (error) {
      console.error('Error adding topic:', error);
      toast.error('Error adding topic');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    const itemToDelete = editedItems[index];
    setLoading(true);

    try {
      if (isQuestionTitles) {
        const { error } = await supabase
          .from('subject_topics')
          .delete()
          .eq('topic', itemToDelete);

        if (error) throw error;
      }

      setEditedItems(editedItems.filter((_, i) => i !== index));
      toast.success('Topic deleted successfully');
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error('Error deleting topic');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSave(editedItems);
    toast.success(`${title} updated successfully`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Manage {title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex gap-2">
            {isQuestionTitles && (
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
                disabled={loading}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder={`Enter new ${title.toLowerCase()}`}
              className="flex-1 px-3 py-2 border rounded-lg"
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              disabled={loading}
            />
            <button
              onClick={handleAdd}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Plus size={20} />
              Add
            </button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">{title}</th>
                  <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {editedItems.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{item}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleDelete(index)}
                        disabled={loading}
                        className={`text-red-600 hover:text-red-800 ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Save size={20} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}