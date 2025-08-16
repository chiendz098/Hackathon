import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Users, 
  Calendar,
  Tag,
  FileText,
  CheckCircle,
  Clock,
  Target,
  AlertCircle
} from 'lucide-react';

const GroupTodoForm = ({ groupId, members, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'study',
    priority: 'medium',
    deadline: '',
    estimatedTime: '',
    assignedMembers: [],
    subtasks: [],
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'study', label: 'Study', icon: '📚', color: 'bg-blue-100 text-blue-800' },
    { value: 'project', label: 'Project', icon: '🚀', color: 'bg-purple-100 text-purple-800' },
    { value: 'work', label: 'Work', icon: '💼', color: 'bg-green-100 text-green-800' },
    { value: 'hobby', label: 'Hobby', icon: '🎨', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'personal', label: 'Personal', icon: '👤', color: 'bg-gray-100 text-gray-800' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Todo title is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
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
      console.log('🔍 Debug: Submitting form data:', formData);
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: 'study',
      priority: 'medium',
      deadline: '',
      estimatedTime: '',
      assignedMembers: [],
      subtasks: [],
      notes: ''
    });
    setErrors({});
    onCancel();
  };

  const addSubtask = () => {
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: Date.now(), text: '', completed: false }]
    }));
  };

  const removeSubtask = (id) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(subtask => subtask.id !== id)
    }));
  };

  const updateSubtask = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(subtask => 
        subtask.id === id ? { ...subtask, [field]: value } : subtask
      )
    }));
  };

  const toggleMemberAssignment = (userId) => {
    setFormData(prev => {
      const isAlreadyAssigned = prev.assignedMembers.some(member => 
        typeof member === 'object' ? member.userId === userId : member === userId
      );
      
      if (isAlreadyAssigned) {
        return {
          ...prev,
          assignedMembers: prev.assignedMembers.filter(member => 
            typeof member === 'object' ? member.userId !== userId : member !== userId
          )
        };
      } else {
        return {
          ...prev,
          assignedMembers: [...prev.assignedMembers, { userId: userId, role: 'member' }]
        };
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Todo Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter todo title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the todo..."
        />
      </div>

      {/* Category and Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.icon} {category.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority *
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.priority ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {priorities.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
          )}
        </div>
      </div>

      {/* Deadline and Estimated Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deadline
          </label>
          <input
            type="datetime-local"
            value={formData.deadline}
            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Time (minutes)
          </label>
          <input
            type="number"
            value={formData.estimatedTime}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="30"
            min="1"
          />
        </div>
      </div>

      {/* Assigned Members */}
      {members && members.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign to Members
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {members.map(member => (
              <label key={member.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.assignedMembers.some(assignedMember => 
                    typeof assignedMember === 'object' ? assignedMember.userId === member.user_id : assignedMember === member.user_id
                  )}
                  onChange={() => toggleMemberAssignment(member.user_id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{member.name || member.username}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Subtasks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Subtasks
          </label>
          <button
            type="button"
            onClick={addSubtask}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Subtask
          </button>
        </div>
        
        <div className="space-y-2">
          {formData.subtasks.map((subtask, index) => (
            <div key={subtask.id} className="flex items-center space-x-2">
              <input
                type="text"
                value={subtask.text}
                onChange={(e) => updateSubtask(subtask.id, 'text', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Subtask ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeSubtask(subtask.id)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional notes..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Todo'}
        </button>
      </div>
    </form>
  );
};

export default GroupTodoForm; 