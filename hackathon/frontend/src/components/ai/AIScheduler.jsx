import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIScheduler } from '../../contexts/AISchedulerContext';
import { Calendar, Clock, AlertTriangle, CheckCircle, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

const AIScheduler = ({ todos = [] }) => {
  const {
    schedule,
    conflicts,
    recommendations,
    loading,
    aiInsights,
    checkConflicts,
    autoSchedule,
    dismissRecommendation,
    applyRecommendation,
    getConflictSeverity
  } = useAIScheduler();

  const [selectedTodos, setSelectedTodos] = useState([]);
  const [preferences, setPreferences] = useState({
    preferMorning: false,
    preferEvening: false,
    maxSessionLength: 90,
    breakLength: 15,
    workdaysOnly: false
  });
  const [showConflictDetails, setShowConflictDetails] = useState(false);

  const handleTodoSelection = (todoId) => {
    setSelectedTodos(prev => 
      prev.includes(todoId) 
        ? prev.filter(id => id !== todoId)
        : [...prev, todoId]
    );
  };

  const handleAutoSchedule = async () => {
    if (selectedTodos.length === 0) {
      toast.error('Please select at least one task to schedule');
      return;
    }

    const result = await autoSchedule(selectedTodos, preferences);
    if (result) {
      setSelectedTodos([]);
      toast.success('Schedule optimized successfully!');
    }
  };

  const handleConflictCheck = async (todoId, date, duration) => {
    const result = await checkConflicts(todoId, date, duration);
    if (result.hasConflicts) {
      setShowConflictDetails(true);
    }
    return result;
  };

  const getConflictIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-8 h-8 text-purple-500" />
        <h2 className="text-2xl font-bold text-gray-900">AI Scheduler</h2>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🤖 AI Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'urgent' ? 'border-red-500 bg-red-50' :
                  rec.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                  'border-blue-500 bg-blue-50'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{rec.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => applyRecommendation(rec)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => dismissRecommendation(rec.id)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Task Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Select Tasks to Schedule
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {todos.map((todo) => (
            <motion.div
              key={todo.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedTodos.includes(todo.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTodoSelection(todo.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTodos.includes(todo.id)}
                    onChange={() => handleTodoSelection(todo.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{todo.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {todo.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(todo.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {todo.estimatedTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {todo.estimatedTime}min
                        </span>
                      )}
                      {todo.subject && (
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {todo.subject}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getConflictIcon(getConflictSeverity(conflicts.filter(c => c.todoId === todo.id)))}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    todo.priority >= 4 ? 'bg-red-100 text-red-800' :
                    todo.priority >= 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    Priority {todo.priority}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Scheduling Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.preferMorning}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  preferMorning: e.target.checked,
                  preferEvening: e.target.checked ? false : prev.preferEvening
                }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Prefer morning sessions</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.preferEvening}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  preferEvening: e.target.checked,
                  preferMorning: e.target.checked ? false : prev.preferMorning
                }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Prefer evening sessions</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.workdaysOnly}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  workdaysOnly: e.target.checked
                }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Weekdays only</span>
            </label>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Max session length (minutes)
              </label>
              <input
                type="range"
                min="30"
                max="180"
                step="15"
                value={preferences.maxSessionLength}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  maxSessionLength: parseInt(e.target.value)
                }))}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{preferences.maxSessionLength} minutes</span>
            </div>
            
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Break length (minutes)
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={preferences.breakLength}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  breakLength: parseInt(e.target.value)
                }))}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{preferences.breakLength} minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleAutoSchedule}
          disabled={loading || selectedTodos.length === 0}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Optimizing Schedule...
            </div>
          ) : (
            `🤖 Optimize Schedule (${selectedTodos.length} tasks)`
          )}
        </button>
      </div>

      {/* Generated Schedule */}
      {schedule.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            📅 Optimized Schedule
          </h3>
          <div className="space-y-3">
            {schedule.map((item, index) => (
              <motion.div
                key={item.todoId}
                className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(item.scheduledTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {item.estimatedDuration} minutes
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.suggestedPriority >= 4 ? 'bg-red-100 text-red-800' :
                    item.suggestedPriority >= 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    Priority {item.suggestedPriority}
                  </span>
                </div>
                
                {item.studyTips && item.studyTips.length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">💡 Study Tips:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {item.studyTips.slice(0, 3).map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Insights */}
      {aiInsights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🧠 AI Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(aiInsights.totalStudyTime / 60)}h
              </div>
              <div className="text-gray-600">Total Study Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {aiInsights.optimalProductivityHours?.join(', ') || 'N/A'}
              </div>
              <div className="text-gray-600">Optimal Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {aiInsights.balanceScore}/10
              </div>
              <div className="text-gray-600">Balance Score</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Conflicts Modal */}
      <AnimatePresence>
        {showConflictDetails && conflicts.length > 0 && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConflictDetails(false)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                ⚠️ Schedule Conflicts Detected
              </h3>
              
              <div className="space-y-4">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-red-600 mb-2">
                      {conflict.type === 'time_conflict' ? 'Time Conflict' : 'Workload Conflict'}
                    </h4>
                    <p className="text-gray-700 mb-3">{conflict.message}</p>
                    
                    {conflict.suggestions && conflict.suggestions.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Suggestions:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {conflict.suggestions.map((suggestion, suggestionIndex) => (
                            <li key={suggestionIndex} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowConflictDetails(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIScheduler;
