import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const ManualTodoForm = ({ onTodoCreated, onClose }) => {
  const { theme, currentTheme } = useTheme();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    subject: '',
    priority: 'medium',
    difficulty: 3,
    deadline: '',
    dueTime: '',
    estimatedTime: 60,
    tags: [],
    isRecurring: false,
    recurringPattern: 'daily',
    location: '',
    attachments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTag, setCurrentTag] = useState('');

  const categories = [
    { value: 'personal', label: 'Personal', icon: '👤', color: 'blue' },
    { value: 'work', label: 'Work', icon: '💼', color: 'gray' },
    { value: 'study', label: 'Study', icon: '📚', color: 'green' },
    { value: 'health', label: 'Health', icon: '🏥', color: 'red' },
    { value: 'finance', label: 'Finance', icon: '💰', color: 'yellow' },
    { value: 'social', label: 'Social', icon: '👥', color: 'pink' },
    { value: 'hobby', label: 'Hobby', icon: '🎨', color: 'purple' },
    { value: 'travel', label: 'Travel', icon: '✈️', color: 'cyan' },
    { value: 'shopping', label: 'Shopping', icon: '🛒', color: 'orange' },
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', color: 'emerald' },
    { value: 'career', label: 'Career', icon: '🚀', color: 'indigo' },
    { value: 'learning', label: 'Learning', icon: '🧠', color: 'violet' },
    { value: 'exercise', label: 'Exercise', icon: '💪', color: 'lime' },
    { value: 'reading', label: 'Reading', icon: '📖', color: 'amber' },
    { value: 'coding', label: 'Coding', icon: '💻', color: 'slate' },
    { value: 'design', label: 'Design', icon: '🎨', color: 'rose' },
    { value: 'writing', label: 'Writing', icon: '✍️', color: 'teal' },
    { value: 'other', label: 'Other', icon: '📝', color: 'neutral' }
  ];

  const subjects = [
    'Math', 'Physics', 'Chemistry', 'Biology', 'Literature', 'History',
    'Geography', 'Programming', 'English', 'Art', 'Music', 'Other'
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'green', emoji: '🟢' },
    { value: 'medium', label: 'Medium', color: 'yellow', emoji: '🟡' },
    { value: 'high', label: 'High', color: 'orange', emoji: '🟠' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const todoData = {
        ...formData,
        creationMethod: 'manual',
        deadline: formData.deadline && formData.dueTime
          ? new Date(`${formData.deadline}T${formData.dueTime}`)
          : formData.deadline
            ? new Date(formData.deadline)
            : null
      };

      const response = await fetch('/api/todo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(todoData)
      });

      const data = await response.json();
      if (data.success) {
        onTodoCreated(data.todo);
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: 'personal',
          subject: '',
          priority: 'medium',
          difficulty: 3,
          deadline: '',
          dueTime: '',
          estimatedTime: 60,
          tags: [],
          isRecurring: false,
          recurringPattern: 'daily',
          location: '',
          attachments: []
        });
      }
    } catch (error) {
      console.error('Error creating todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
          }`}>
            Task Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="What do you need to do?"
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
              currentTheme === 'neon'
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
          }`}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Add more details about this task..."
            rows={3}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 resize-none ${
              currentTheme === 'neon'
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>

        {/* Category */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
          }`}>
            Category *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map(category => (
              <motion.button
                key={category.value}
                type="button"
                onClick={() => handleInputChange('category', category.value)}
                className={`p-3 rounded-lg border-2 transition-all duration-300 flex flex-col items-center space-y-1 ${
                  formData.category === category.value
                    ? currentTheme === 'neon'
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                      : 'border-blue-500 bg-blue-50 text-blue-700'
                    : currentTheme === 'neon'
                      ? 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg">{category.icon}</span>
                <span className="text-xs font-medium">{category.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Subject and Priority Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
            }`}>
              Subject
            </label>
            <select
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                currentTheme === 'neon'
                  ? 'bg-gray-800 border-gray-600 text-white focus:border-cyan-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="">Select subject</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
            }`}>
              Priority
            </label>
            <div className="grid grid-cols-2 gap-2">
              {priorities.map(priority => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => handleInputChange('priority', priority.value)}
                  className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                    formData.priority === priority.value
                      ? currentTheme === 'neon'
                        ? 'border-cyan-500 bg-cyan-500/20 text-white'
                        : `border-${priority.color}-500 bg-${priority.color}-50 text-${priority.color}-700`
                      : currentTheme === 'neon'
                        ? 'border-gray-600 text-gray-300 hover:border-gray-500'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <span className="text-sm">{priority.emoji} {priority.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Difficulty and Estimated Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
            }`}>
              Difficulty: {formData.difficulty}/5
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.difficulty}
              onChange={(e) => handleInputChange('difficulty', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Easy</span>
              <span>Hard</span>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
            }`}>
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              value={formData.estimatedTime}
              onChange={(e) => handleInputChange('estimatedTime', parseInt(e.target.value))}
              min="15"
              step="15"
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                currentTheme === 'neon'
                  ? 'bg-gray-800 border-gray-600 text-white focus:border-cyan-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
        </div>

        {/* Due Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
            }`}>
              Due Date
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => handleInputChange('deadline', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                currentTheme === 'neon'
                  ? 'bg-gray-800 border-gray-600 text-white focus:border-cyan-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
            }`}>
              Due Time
            </label>
            <input
              type="time"
              value={formData.dueTime}
              onChange={(e) => handleInputChange('dueTime', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                currentTheme === 'neon'
                  ? 'bg-gray-800 border-gray-600 text-white focus:border-cyan-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
          }`}>
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Where will you do this task?"
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
              currentTheme === 'neon'
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>

        {/* Tags */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
          }`}>
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add a tag..."
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
                currentTheme === 'neon'
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                  currentTheme === 'neon'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {onClose && (
            <motion.button
              type="button"
              onClick={onClose}
              className={`flex-1 py-4 rounded-lg font-semibold transition-all duration-300 ${
                currentTheme === 'neon'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
          )}
          <motion.button
            type="submit"
            disabled={isSubmitting || !formData.title.trim()}
            className={`flex-1 py-4 rounded-lg font-semibold transition-all duration-300 ${
              isSubmitting || !formData.title.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : currentTheme === 'neon'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
            } shadow-lg hover:shadow-xl`}
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Task...
              </div>
            ) : (
              '✨ Create Task'
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default ManualTodoForm;
