import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Paperclip, 
  Tag, 
  AlertCircle,
  X,
  Plus,
  Upload,
  Trash2
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const EnhancedTodoForm = ({ onTodoCreated, onCancel, initialData = null }) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'personal',
    priority: initialData?.priority || 'medium',
    deadline: initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '',
    dueTime: initialData?.deadline ? new Date(initialData.deadline).toTimeString().slice(0, 5) : '',
    estimatedTime: initialData?.estimatedTime || 60,
    location: initialData?.location || '',
    tags: initialData?.tags || [],
    attachments: initialData?.attachments || [],
    subject: initialData?.subject || '',
    difficulty: initialData?.difficulty || 3,
    notes: initialData?.notes || '',
    isRecurring: initialData?.isRecurring || false,
    recurringPattern: initialData?.recurringPattern || 'daily'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [errors, setErrors] = useState({});

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

  const priorities = [
    { value: 'low', label: 'Low', color: 'green', emoji: '🟢' },
    { value: 'medium', label: 'Medium', color: 'yellow', emoji: '🟡' },
    { value: 'high', label: 'High', color: 'orange', emoji: '🟠' }
  ];

  const subjects = [
    'Math', 'Physics', 'Chemistry', 'Biology', 'Literature', 'History',
    'Geography', 'Programming', 'English', 'Art', 'Music', 'Other'
  ];

  const difficulties = [
    { value: 1, label: 'Very Easy', color: 'green' },
    { value: 2, label: 'Easy', color: 'lime' },
    { value: 3, label: 'Medium', color: 'yellow' },
    { value: 4, label: 'Hard', color: 'orange' },
    { value: 5, label: 'Very Hard', color: 'red' }
  ];

  const recurringPatterns = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      id: Date.now() + Math.random()
    }));

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const removeAttachment = (attachmentId) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== attachmentId)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.deadline && formData.dueTime) {
      const deadlineDate = new Date(`${formData.deadline}T${formData.dueTime}`);
      if (deadlineDate <= new Date()) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    if (formData.estimatedTime <= 0) {
      newErrors.estimatedTime = 'Estimated time must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

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

      // Handle file uploads first
      if (formData.attachments.length > 0) {
        const formDataWithFiles = new FormData();
        formData.attachments.forEach(attachment => {
          formDataWithFiles.append('attachments', attachment.file);
        });

        // Upload files first
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formDataWithFiles
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          todoData.attachments = uploadResult.urls;
        }
      }

      const response = await fetch('/api/todo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(todoData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          onTodoCreated(result.todo);
          // Reset form
          setFormData({
            title: '',
            description: '',
            category: 'personal',
            priority: 'medium',
            deadline: '',
            dueTime: '',
            estimatedTime: 60,
            location: '',
            tags: [],
            attachments: [],
            subject: '',
            difficulty: 3,
            notes: '',
            isRecurring: false,
            recurringPattern: 'daily'
          });
        }
      }
    } catch (error) {
      console.error('Error creating todo:', error);
      setErrors({ submit: 'Failed to create todo. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryConfig = (categoryValue) => {
    return categories.find(cat => cat.value === categoryValue) || categories[0];
  };

  const getPriorityConfig = (priorityValue) => {
    return priorities.find(pri => pri.value === priorityValue) || priorities[1];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`max-w-4xl mx-auto p-6 rounded-lg shadow-lg ${
        currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Create New Todo</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title and Category Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}
              placeholder="Enter todo title..."
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 dark:border-gray-600 ${
                currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
              }`}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 dark:border-gray-600 ${
              currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
            }`}
            placeholder="Describe your todo..."
          />
        </div>

        {/* Priority and Difficulty Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => handleInputChange('priority', priority.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.priority === priority.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg">{priority.emoji}</div>
                    <div className="text-xs font-medium">{priority.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <div className="grid grid-cols-5 gap-2">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.value}
                  type="button"
                  onClick={() => handleInputChange('difficulty', difficulty.value)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    formData.difficulty === difficulty.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium">{difficulty.value}</div>
                    <div className="text-xs">{difficulty.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Deadline and Time Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Due Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.deadline ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}
              />
            </div>
            {errors.deadline && <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Due Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="time"
                value={formData.dueTime}
                onChange={(e) => handleInputChange('dueTime', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 dark:border-gray-600 ${
                  currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Estimated Time (minutes)</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                value={formData.estimatedTime}
                onChange={(e) => handleInputChange('estimatedTime', parseInt(e.target.value))}
                min="1"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.estimatedTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}
              />
            </div>
            {errors.estimatedTime && <p className="text-red-500 text-sm mt-1">{errors.estimatedTime}</p>}
          </div>
        </div>

        {/* Subject and Location Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <select
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 dark:border-gray-600 ${
                currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
              }`}
            >
              <option value="">Select subject...</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 dark:border-gray-600 ${
                  currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
                }`}
                placeholder="Where to do this task?"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 dark:border-gray-600 ${
                currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
              }`}
              placeholder="Add a tag..."
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium mb-2">Attachments</label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              or drag and drop files here
            </p>
          </div>
          
          {formData.attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{attachment.name}</span>
                    <span className="text-xs text-gray-500">({Math.round(attachment.size / 1024)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">Additional Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 dark:border-gray-600 ${
              currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
            }`}
            placeholder="Any additional notes or reminders..."
          />
        </div>

        {/* Recurring Options */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">Recurring Task</span>
          </label>
          
          {formData.isRecurring && (
            <select
              value={formData.recurringPattern}
              onChange={(e) => handleInputChange('recurringPattern', e.target.value)}
              className={`px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 dark:border-gray-600 ${
                currentTheme === 'dark' ? 'bg-gray-700' : 'bg-white'
              }`}
            >
              {recurringPatterns.map((pattern) => (
                <option key={pattern.value} value={pattern.value}>{pattern.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 dark:text-red-300">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create Todo'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default EnhancedTodoForm; 