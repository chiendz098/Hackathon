import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Tag, Flag, CheckCircle } from 'lucide-react';

const NotionStyleTimeline = ({ todos, onTodoSelect, onTodoUpdate, onTodoDelete, members, darkMode }) => {
  const [viewMode, setViewMode] = useState('week'); // week, month, custom
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Group todos by date
  const timelineData = useMemo(() => {
    const grouped = {};
    
    todos.forEach(todo => {
      const date = new Date(todo.deadline || todo.createdAt);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(todo);
    });

    // Sort dates
    const sortedDates = Object.keys(grouped).sort();
    
    return sortedDates.map(date => ({
      date: new Date(date),
      todos: grouped[date].sort((a, b) => {
        // Sort by priority first, then by deadline
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 2;
        const bPriority = priorityOrder[b.priority] || 2;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(a.deadline || a.createdAt) - new Date(b.deadline || b.createdAt);
      })
    }));
  }, [todos]);

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-900';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900';
      case 'low': return 'border-blue-500 bg-blue-50 dark:bg-blue-900';
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Timeline View</h2>
          <p className="text-gray-600 dark:text-gray-400">Visualize your todos over time</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {timelineData.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No todos scheduled</h3>
            <p className="text-gray-600 dark:text-gray-400">Create some todos with deadlines to see them here</p>
          </div>
        ) : (
          <div className="space-y-8">
            {timelineData.map((dayData, dayIndex) => (
              <motion.div
                key={dayData.date.toISOString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.1 }}
                className="relative"
              >
                {/* Date header */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDate(dayData.date)}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {dayData.todos.length} todo{dayData.todos.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Timeline line */}
                <div className="absolute left-1 top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                {/* Todos for this day */}
                <div className="ml-6 space-y-4">
                  {dayData.todos.map((todo, todoIndex) => (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (dayIndex * 0.1) + (todoIndex * 0.05) }}
                      className="relative"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-7 top-4 w-3 h-3 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-full"></div>
                      
                      {/* Todo card */}
                      <div
                        className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          getPriorityColor(todo.priority)
                        } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                        onClick={() => onTodoSelect(todo)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getStatusIcon(todo.status)}
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {todo.title}
                              </h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                todo.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400' :
                                todo.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-400' :
                                todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400'
                              }`}>
                                <Flag className="w-3 h-3 mr-1" />
                                {todo.priority}
                              </span>
                            </div>
                            
                            {todo.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {todo.description}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              {todo.deadline && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {new Date(todo.deadline).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              )}
                              
                              {todo.assignments && todo.assignments.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-4 h-4" />
                                  <span>
                                    {members.find(m => m.id === todo.assignments[0].assignedTo)?.name || 'Unknown'}
                                  </span>
                                </div>
                              )}
                              
                              {todo.tags && todo.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Tag className="w-4 h-4" />
                                  <span>{todo.tags[0]}</span>
                                  {todo.tags.length > 1 && (
                                    <span>+{todo.tags.length - 1}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Progress indicator */}
                          <div className="ml-4 text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                              {todo.progress || 0}%
                            </div>
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${todo.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotionStyleTimeline; 