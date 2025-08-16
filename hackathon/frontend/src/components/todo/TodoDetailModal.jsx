import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Edit, 
  Trash2, 
  Users, 
  Calendar, 
  Clock, 
  Target, 
  CheckCircle,
  AlertCircle,
  MessageSquare,
  FileText,
  UserPlus,
  Settings
} from 'lucide-react';

const TodoDetailModal = ({ 
  todo, 
  members, 
  userPermissions, 
  onUpdate, 
  onDelete, 
  onAssign, 
  onClose 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editData, setEditData] = useState({
    title: todo.title,
    description: todo.description,
    priority: todo.priority,
    deadline: todo.deadline ? new Date(todo.deadline).toISOString().split('T')[0] : '',
    estimatedTime: todo.estimatedTime
  });

  const handleSave = () => {
    onUpdate(todo.id, {
      ...editData,
      deadline: editData.deadline ? new Date(editData.deadline).toISOString() : null
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      onDelete(todo.id);
      onClose();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressPercentage = () => {
    return todo.groupProgress || 0;
  };

  const getOverdueStatus = () => {
    if (!todo.deadline) return false;
    return new Date(todo.deadline) < new Date() && todo.status !== 'completed';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Todo Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Created by {todo.user?.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {userPermissions.canEditTodos && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {userPermissions.canDeleteTodos && (
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {todo.title}
                </h3>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                {todo.category}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                {todo.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(todo.status)}`}>
                {todo.status}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              {isEditing ? (
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              ) : (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(todo.priority)}`}>
                  {todo.priority}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Progress
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {getProgressPercentage()}%
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deadline
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.deadline}
                  onChange={(e) => setEditData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {todo.deadline ? new Date(todo.deadline).toLocaleDateString() : 'No deadline'}
                  </span>
                  {getOverdueStatus() && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estimated Time
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.estimatedTime}
                  onChange={(e) => setEditData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {todo.estimatedTime} minutes
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Created
              </label>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(todo.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Subtasks */}
          {todo.subtasks && todo.subtasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subtasks
              </label>
              <div className="space-y-2">
                {Array.isArray(todo.subtasks) && todo.subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      readOnly
                      className="rounded"
                    />
                    <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                      {subtask.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Members */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assigned Members
              </label>
              {userPermissions.canAssign && (
                <button
                  onClick={() => setShowAssignmentForm(!showAssignmentForm)}
                  className="flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  {showAssignmentForm ? 'Hide' : 'Manage'} Assignments
                </button>
              )}
            </div>

            {todo.assignments && todo.assignments.length > 0 ? (
              <div className="space-y-3">
                {Array.isArray(todo.assignments) && todo.assignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    members={members}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No members assigned yet</p>
              </div>
            )}
          </div>

          {/* Group Settings */}
          {todo.groupSettings && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Group Settings
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Member editing: {todo.groupSettings.allowMemberEditing ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Approval required: {todo.groupSettings.requireApproval ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Progress tracking: {todo.groupSettings.progressTracking ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Group chat: {todo.groupChatEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {isEditing && (
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Assignment Card Component
const AssignmentCard = ({ assignment, members }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'leader': return 'text-purple-600 bg-purple-100';
      case 'reviewer': return 'text-orange-600 bg-orange-100';
      case 'member': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {assignment.assignee?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {assignment.assignee?.name || 'Unknown User'}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(assignment.role)}`}>
                {assignment.role}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                {assignment.status}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {assignment.progress}% complete
          </div>
          {assignment.estimatedTime && (
            <div className="text-xs text-gray-400">
              Est: {assignment.estimatedTime} min
            </div>
          )}
        </div>
      </div>

      {/* Assigned Tasks */}
      {assignment.assignedTasks && assignment.assignedTasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assigned Tasks:
          </h5>
          <div className="space-y-1">
            {assignment.assignedTasks.map((task, index) => (
              <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                • {task}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {assignment.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes:
          </h5>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {assignment.notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default TodoDetailModal; 