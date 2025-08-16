import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Users, 
  Tag,
  FileText,
  AlertCircle,
  UserPlus,
  Mail,
  Send,
  CheckCircle
} from 'lucide-react';
import useApi from '../../hooks/useApi';

const CreateGroupForm = ({ isOpen, onSubmit, onClose }) => {
  const { get } = useApi();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'study'
  });
  
  const [inviteData, setInviteData] = useState({
    emails: [''],
    role: 'member',
    message: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [emailSuggestions, setEmailSuggestions] = useState({});
  const [emailValidation, setEmailValidation] = useState({});

  const categories = [
    { value: 'study', label: 'Study', icon: '📚', color: 'bg-blue-100 text-blue-800' },
    { value: 'project', label: 'Project', icon: '🚀', color: 'bg-purple-100 text-purple-800' },
    { value: 'work', label: 'Work', icon: '💼', color: 'bg-green-100 text-green-800' },
    { value: 'hobby', label: 'Hobby', icon: '🎨', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'personal', label: 'Personal', icon: '👤', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen]);

  const loadAvailableUsers = async () => {
    try {
      const response = await get('/users');
      if (response && response.data) {
        setAvailableUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const findUserByEmail = (email) => {
    return availableUsers.find(user => 
      user.email && user.email.toLowerCase() === email.toLowerCase()
    );
  };

  const handleEmailChange = (index, value) => {
    updateEmail(index, value);
    
    // Clear previous validation
    setEmailValidation(prev => ({ ...prev, [index]: null }));
    setEmailSuggestions(prev => ({ ...prev, [index]: null }));
    
    if (value.trim()) {
      if (!validateEmail(value)) {
        setEmailValidation(prev => ({ 
          ...prev, 
          [index]: { type: 'error', message: 'Invalid email format' }
        }));
      } else {
        const user = findUserByEmail(value);
        if (user) {
          setEmailValidation(prev => ({ 
            ...prev, 
            [index]: { type: 'success', message: `Found user: ${user.name || user.username}` }
          }));
        } else {
          setEmailValidation(prev => ({ 
            ...prev, 
            [index]: { type: 'warning', message: 'Email not found in system' }
          }));
        }
      }
    }
  };

  const getEmailValidationClass = (index) => {
    const validation = emailValidation[index];
    if (!validation) return '';
    
    switch (validation.type) {
      case 'success': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      default: return '';
    }
  };

  const getEmailValidationIcon = (index) => {
    const validation = emailValidation[index];
    if (!validation) return null;
    
    switch (validation.type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    // Validate emails if invite section is shown
    if (showInviteSection) {
      const invalidEmails = inviteData.emails
        .map((email, index) => ({ email: email.trim(), index }))
        .filter(({ email }) => email && !validateEmail(email));
      
      if (invalidEmails.length > 0) {
        newErrors.emails = 'Please enter valid email addresses';
      }
      
      // Check if any emails are not found in system
      const notFoundEmails = inviteData.emails
        .map((email, index) => ({ email: email.trim(), index }))
        .filter(({ email }) => email && validateEmail(email) && !findUserByEmail(email));
      
      if (notFoundEmails.length > 0) {
        newErrors.emails = 'Some email addresses are not registered in the system';
      }
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
      // Prepare the data with invite information
      const submitData = {
        ...formData,
        invites: showInviteSection ? {
          emails: inviteData.emails.filter(email => email.trim()),
          selectedUsers: selectedUsers,
          role: inviteData.role,
          message: inviteData.message
        } : null
      };
      
      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      category: 'study'
    });
    setInviteData({
      emails: [''],
      role: 'member',
      message: ''
    });
    setSelectedUsers([]);
    setShowInviteSection(false);
    setErrors({});
    onClose();
  };

  const addEmailField = () => {
    setInviteData(prev => ({
      ...prev,
      emails: [...prev.emails, '']
    }));
  };

  const removeEmailField = (index) => {
    setInviteData(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index)
    }));
  };

  const updateEmail = (index, value) => {
    setInviteData(prev => ({
      ...prev,
      emails: prev.emails.map((email, i) => i === index ? value : email)
    }));
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Create New Group</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Information Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Group Information</h4>
            
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter group name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your group's purpose and goals"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <label
                    key={category.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.category === category.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={formData.category === category.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="sr-only"
                    />
                    <span className="text-lg mr-2">{category.icon}</span>
                    <span className="text-sm font-medium">{category.label}</span>
                  </label>
                ))}
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Invite Members Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                Invite Members
              </h4>
              <button
                type="button"
                onClick={() => setShowInviteSection(!showInviteSection)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showInviteSection ? 'Hide' : 'Show'} Invite Options
              </button>
            </div>

            {showInviteSection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Invite by Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite by Email
                  </label>
                  {errors.emails && (
                    <p className="mb-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.emails}
                    </p>
                  )}
                  {inviteData.emails.map((email, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => handleEmailChange(index, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${getEmailValidationClass(index)}`}
                            placeholder="Enter email address"
                          />
                          {emailValidation[index] && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {getEmailValidationIcon(index)}
                            </div>
                          )}
                        </div>
                        {inviteData.emails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmailField(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {emailValidation[index] && (
                        <div className={`text-xs px-2 py-1 rounded ${
                          emailValidation[index].type === 'success' ? 'text-green-700 bg-green-100' :
                          emailValidation[index].type === 'error' ? 'text-red-700 bg-red-100' :
                          'text-yellow-700 bg-yellow-100'
                        }`}>
                          {emailValidation[index].message}
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEmailField}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                  >
                    + Add another email
                  </button>
                </div>

                {/* Invite from Users List */}
                {availableUsers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invite from Users
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {availableUsers.map(user => (
                        <label key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{user.name || user.username}</span>
                          <span className="text-xs text-gray-500">({user.email})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Role and Message */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Role
                    </label>
                    <select
                      value={inviteData.role}
                      onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="member">Member</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Members can view and participate. Moderators can manage content. Admins have full control.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invitation Message (Optional)
                  </label>
                  <textarea
                    value={inviteData.message}
                    onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a personal message to your invitations..."
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Group
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateGroupForm; 