import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAIScheduler } from '../../contexts/AISchedulerContext';

const ConflictResolutionPanel = ({ isOpen, onClose }) => {
  const { theme, currentTheme } = useTheme();
  const { conflicts, resolveConflict, loading } = useAIScheduler();
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [resolutionOptions, setResolutionOptions] = useState([]);

  useEffect(() => {
    if (selectedConflict) {
      generateResolutionOptions(selectedConflict);
    }
  }, [selectedConflict]);

  const generateResolutionOptions = (conflict) => {
    const options = [];
    
    switch (conflict.type) {
      case 'time_overlap':
        options.push(
          {
            id: 'reschedule_first',
            title: 'Reschedule First Task',
            description: `Move "${conflict.tasks[0].title}" to ${conflict.suggestions.alternativeSlots[0]}`,
            impact: 'Low',
            effort: 'Easy',
            icon: '📅'
          },
          {
            id: 'reschedule_second',
            title: 'Reschedule Second Task',
            description: `Move "${conflict.tasks[1].title}" to ${conflict.suggestions.alternativeSlots[1]}`,
            impact: 'Low',
            effort: 'Easy',
            icon: '📅'
          },
          {
            id: 'split_tasks',
            title: 'Split Tasks',
            description: 'Break both tasks into smaller chunks and distribute them',
            impact: 'Medium',
            effort: 'Medium',
            icon: '✂️'
          }
        );
        break;
        
      case 'workload_overload':
        options.push(
          {
            id: 'extend_deadline',
            title: 'Extend Deadline',
            description: 'Request deadline extension for less critical tasks',
            impact: 'Low',
            effort: 'Easy',
            icon: '⏰'
          },
          {
            id: 'reduce_scope',
            title: 'Reduce Task Scope',
            description: 'Focus on essential parts of overloaded tasks',
            impact: 'Medium',
            effort: 'Medium',
            icon: '🎯'
          },
          {
            id: 'delegate_tasks',
            title: 'Delegate or Collaborate',
            description: 'Find study partners or ask for help with some tasks',
            impact: 'High',
            effort: 'Hard',
            icon: '👥'
          }
        );
        break;
        
      case 'priority_conflict':
        options.push(
          {
            id: 'reprioritize',
            title: 'Reprioritize Tasks',
            description: 'Adjust task priorities based on deadlines and importance',
            impact: 'Medium',
            effort: 'Easy',
            icon: '🏆'
          },
          {
            id: 'sequential_approach',
            title: 'Sequential Approach',
            description: 'Complete high-priority tasks first, then others',
            impact: 'Low',
            effort: 'Easy',
            icon: '📋'
          }
        );
        break;
        
      default:
        options.push(
          {
            id: 'ai_optimize',
            title: 'AI Auto-Optimize',
            description: 'Let AI automatically resolve this conflict',
            impact: 'Low',
            effort: 'Easy',
            icon: '🤖'
          }
        );
    }
    
    setResolutionOptions(options);
  };

  const handleResolveConflict = async (conflictId, resolutionId) => {
    const resolution = resolutionOptions.find(opt => opt.id === resolutionId);
    if (resolution) {
      await resolveConflict(conflictId, resolution);
      setSelectedConflict(null);
    }
  };

  const getConflictSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-500 bg-blue-100 border-blue-200';
      default: return 'text-gray-500 bg-gray-100 border-gray-200';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
              : 'bg-white border border-gray-200'
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
                  ⚠️ Schedule Conflict Resolution
                </h2>
                <p className={`mt-1 ${
                  currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  AI-powered solutions for your scheduling conflicts
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
            {/* Conflicts List */}
            <div className={`w-1/2 p-6 border-r overflow-y-auto ${
              currentTheme === 'neon' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                Detected Conflicts ({conflicts.length})
              </h3>
              
              {conflicts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h4 className={`text-lg font-semibold mb-2 ${
                    currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                  }`}>
                    No Conflicts Detected
                  </h4>
                  <p className={currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'}>
                    Your schedule looks great!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conflicts.map((conflict) => (
                    <motion.div
                      key={conflict.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                        selectedConflict?.id === conflict.id
                          ? currentTheme === 'neon'
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-blue-500 bg-blue-50'
                          : currentTheme === 'neon'
                            ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedConflict(conflict)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-semibold ${
                          currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {conflict.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          getConflictSeverityColor(conflict.severity)
                        }`}>
                          {conflict.severity}
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-3 ${
                        currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {conflict.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className={`text-xs ${
                          currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Affects {conflict.affectedTasks} tasks
                        </div>
                        <div className={`text-xs font-medium ${
                          currentTheme === 'neon' ? 'text-cyan-400' : 'text-blue-600'
                        }`}>
                          {conflict.estimatedResolutionTime} to resolve
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Resolution Options */}
            <div className="w-1/2 p-6 overflow-y-auto">
              {selectedConflict ? (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Resolution Options
                  </h3>
                  
                  <div className="space-y-4">
                    {resolutionOptions.map((option) => (
                      <motion.div
                        key={option.id}
                        className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                          currentTheme === 'neon'
                            ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{option.icon}</div>
                          <div className="flex-1">
                            <h4 className={`font-semibold mb-1 ${
                              currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {option.title}
                            </h4>
                            <p className={`text-sm mb-3 ${
                              currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {option.description}
                            </p>
                            
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-4">
                                <span className={`text-xs font-medium ${getImpactColor(option.impact)}`}>
                                  Impact: {option.impact}
                                </span>
                                <span className={`text-xs ${
                                  currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  Effort: {option.effort}
                                </span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleResolveConflict(selectedConflict.id, option.id)}
                              disabled={loading}
                              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                                loading
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : currentTheme === 'neon'
                                    ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                              }`}
                            >
                              {loading ? 'Resolving...' : 'Apply Solution'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">👈</div>
                    <h4 className={`text-lg font-semibold mb-2 ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Select a Conflict
                    </h4>
                    <p className={currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'}>
                      Choose a conflict from the list to see resolution options
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConflictResolutionPanel;
