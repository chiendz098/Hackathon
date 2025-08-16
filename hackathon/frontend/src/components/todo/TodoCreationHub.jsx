import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import ManualTodoForm from './ManualTodoForm';
import AIChatTodoCreator from './AIChatTodoCreator';
import TeacherAssignmentView from './TeacherAssignmentView';

const TodoCreationHub = ({ isOpen, onTodoCreated, onClose }) => {
  const { theme, currentTheme } = useTheme();
  const [activeMethod, setActiveMethod] = useState('manual');

  // Don't render if not open
  if (!isOpen) return null;

  const creationMethods = [
    {
      id: 'manual',
      name: 'Manual Creation',
      icon: '✏️',
      description: 'Create tasks manually with detailed options',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'ai-chat',
      name: 'AI Assistant',
      icon: '🤖',
      description: 'Tell AI what you need to do in natural language',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 'teacher',
      name: 'Teacher Assignments',
      icon: '👨‍🏫',
      description: 'View and accept assignments from teachers',
      color: 'green',
      gradient: 'from-green-500 to-green-600'
    }
  ];

  const renderActiveComponent = () => {
    switch (activeMethod) {
      case 'manual':
        return <ManualTodoForm onTodoCreated={onTodoCreated} onClose={onClose} />;
      case 'ai-chat':
        return <AIChatTodoCreator onTodoCreated={onTodoCreated} onClose={onClose} />;
      case 'teacher':
        return <TeacherAssignmentView onTodoCreated={onTodoCreated} onClose={onClose} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
          currentTheme === 'neon' 
            ? 'bg-gray-900 border border-cyan-500/30' 
            : currentTheme === 'minimal'
              ? 'bg-white border border-gray-200'
              : 'bg-white/95 backdrop-blur-md'
        }`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${
          currentTheme === 'neon' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                Create New Task
              </h2>
              <p className={`mt-1 ${
                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Choose how you'd like to create your task
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                currentTheme === 'neon' 
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Method Selector */}
          <div className={`w-80 p-6 border-r ${
            currentTheme === 'neon' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
            }`}>
              Creation Methods
            </h3>
            
            <div className="space-y-3">
              {creationMethods.map((method) => (
                <motion.button
                  key={method.id}
                  onClick={() => setActiveMethod(method.id)}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${
                    activeMethod === method.id
                      ? currentTheme === 'neon'
                        ? 'bg-cyan-500/20 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                        : `bg-${method.color}-50 border-2 border-${method.color}-200 shadow-lg`
                      : currentTheme === 'neon'
                        ? 'bg-gray-700/50 border-2 border-gray-600 hover:border-gray-500'
                        : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`text-2xl p-2 rounded-lg ${
                      activeMethod === method.id
                        ? `bg-gradient-to-r ${method.gradient} text-white`
                        : currentTheme === 'neon'
                          ? 'bg-gray-600 text-gray-300'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${
                        currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {method.name}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {method.description}
                      </p>
                    </div>
                  </div>
                  
                  {activeMethod === method.id && (
                    <motion.div
                      className={`mt-3 p-2 rounded-lg bg-gradient-to-r ${method.gradient} text-white text-sm font-medium text-center`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      ✨ Active
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Quick Stats */}
            <div className={`mt-6 p-4 rounded-xl ${
              currentTheme === 'neon' 
                ? 'bg-gray-700/50 border border-gray-600' 
                : 'bg-white border border-gray-200'
            }`}>
              <h4 className={`font-semibold mb-3 ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                📊 Quick Stats
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-sm ${
                    currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Tasks Today
                  </span>
                  <span className={`text-sm font-medium ${
                    currentTheme === 'neon' ? 'text-cyan-400' : 'text-blue-600'
                  }`}>
                    5
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${
                    currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Completed
                  </span>
                  <span className={`text-sm font-medium ${
                    currentTheme === 'neon' ? 'text-green-400' : 'text-green-600'
                  }`}>
                    3/5
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${
                    currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Streak
                  </span>
                  <span className={`text-sm font-medium ${
                    currentTheme === 'neon' ? 'text-yellow-400' : 'text-yellow-600'
                  }`}>
                    7 days 🔥
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMethod}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {renderActiveComponent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TodoCreationHub;
