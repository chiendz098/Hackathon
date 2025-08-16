import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Calendar,
  Tag,
  MapPin,
  Paperclip,
  MessageCircle,
  Play,
  Pause,
  Star,
  MoreHorizontal
} from 'lucide-react';
import TimeTracker from './TimeTracker';

const AdvancedTodoCard = ({
  todo, onToggleComplete, onDelete, onUpdate, compact = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const [editProgress, setEditProgress] = useState(todo.progress || 0);

  const getPriorityColor = (priority, priorityLabel) => {
    // Use numeric priority if available, fallback to label
    const level = priority || (priorityLabel === 'high' ? 1 :
                              priorityLabel === 'medium' ? 2 :
                              priorityLabel === 'low' ? 3 : 4);

    switch (level) {
      case 1: return 'border-l-red-600 bg-red-50';
      case 2: return 'border-l-orange-500 bg-orange-50';
      case 3: return 'border-l-yellow-500 bg-yellow-50';
      case 4: return 'border-l-blue-500 bg-blue-50';
      case 5: return 'border-l-gray-400 bg-gray-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority, priorityLabel) => {
    const level = priority || (priorityLabel === 'high' ? 1 :
                              priorityLabel === 'medium' ? 2 :
                              priorityLabel === 'low' ? 3 : 4);

    switch (level) {
      case 1: return '🔴';
      case 2: return '🟠';
      case 3: return '🟡';
      case 4: return '🔵';
      case 5: return '⚪';
      default: return '⚪';
    }
  };

  const handleSave = () => {
    onUpdate(todo.id, {
      title: editTitle,
      description: editDescription,
      progress: editProgress
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setEditProgress(todo.progress || 0);
    setIsEditing(false);
  };

  const handleProgressChange = (value) => {
    setEditProgress(value);
    if (!isEditing) {
      onUpdate(todo.id, {
        progress: value
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`relative rounded-lg shadow-sm border-l-4 p-4 mb-3 ${getPriorityColor(todo.priority, todo.priorityLabel)}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
      {isEditing ? (
          <input
              type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Task title"
            />
          ) : (
            <div className="flex items-center">
                              <input
                  type="checkbox"
                  checked={!!todo.isDone}
                  onChange={() => onToggleComplete(todo)}
                  className="mr-3"
                />
              <h3 className={`text-lg font-medium ${todo.completed ? 'line-through text-gray-500' : ''}`}>
            {todo.title}
          </h3>
            </div>
          )}

          {!compact && (
            <div className="mt-2">
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Task description"
                  rows={3}
                />
              ) : (
                todo.description && (
                  <p className="text-gray-600 text-sm">
                    {todo.description}
                  </p>
                )
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!compact && (
            <>
              <button
                onClick={() => setShowTimeTracker(!showTimeTracker)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Clock className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
            </>
          )}
        </div>
      </div>

              {!compact && (
        <>
          <div className="mt-4 flex flex-wrap gap-3">
            {todo.dueDate && (
              <span className="inline-flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(todo.dueDate).toLocaleDateString()}
                </span>
              )}
            {todo.tags?.length > 0 && (
              <span className="inline-flex items-center text-sm text-gray-500">
                <Tag className="w-4 h-4 mr-1" />
                {todo.tags.join(', ')}
                </span>
              )}
              {todo.location && (
              <span className="inline-flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-1" />
                {todo.location}
                </span>
              )}
            {todo.attachments?.length > 0 && (
              <span className="inline-flex items-center text-sm text-gray-500">
                <Paperclip className="w-4 h-4 mr-1" />
                {todo.attachments.length} files
                </span>
              )}
            {todo.comments?.length > 0 && (
              <span className="inline-flex items-center text-sm text-gray-500">
                <MessageCircle className="w-4 h-4 mr-1" />
                {todo.comments.length} comments
                </span>
              )}
          </div>

          {showTimeTracker && (
            <div className="mt-4">
              <TimeTracker todo={todo} onUpdate={onUpdate} />
                </div>
              )}

          {showDetails && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Progress</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                  className="w-full mt-1"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{editProgress}%</span>
                  <span>100%</span>
                </div>
              </div>

              {isEditing ? (
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 text-sm text-blue-500 hover:text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(todo.id)}
                    className="px-3 py-1 text-sm text-red-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default AdvancedTodoCard;
