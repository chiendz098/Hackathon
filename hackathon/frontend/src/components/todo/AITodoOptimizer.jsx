import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import useApi from '../../hooks/useApi';
import { Brain, Zap, Target, TrendingUp, Clock, Lightbulb, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const AITodoOptimizer = ({ todo, onOptimize }) => {
  const { user } = useAuth();
  const { post } = useApi();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optimizationMode, setOptimizationMode] = useState('smart'); // smart, aggressive, conservative
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (todo) {
      generateInsights();
    }
  }, [todo]);

  const generateInsights = async () => {
    if (!todo || !todo.id) {
      console.error('Todo is undefined or missing ID');
      toast.error('No todo selected for optimization');
      return;
    }

    setLoading(true);
    try {
      const response = await post('/api/todo/ai/optimize', {
        todoId: todo.id,
        mode: optimizationMode,
        includeAdvanced: showAdvanced
      });

      if (response.success) {
        setInsights(response.insights || []);
        toast.success('AI insights generated successfully!');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate AI insights');
    } finally {
      setLoading(false);
    }
  };

  const applyOptimization = async (insightId) => {
    if (!todo || !todo.id) {
      console.error('Todo is undefined or missing ID');
      toast.error('No todo selected for optimization');
      return;
    }

    try {
      const response = await post('/api/todo/ai/apply', {
        todoId: todo.id,
        insightId,
        action: 'apply'
      });

      if (response.success) {
        toast.success('Optimization applied successfully!');
        onOptimize && onOptimize(response.optimizedTodo);
      }
    } catch (error) {
      console.error('Error applying optimization:', error);
      toast.error('Failed to apply optimization');
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'productivity': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'learning': return <Brain className="w-5 h-5 text-blue-500" />;
      case 'scheduling': return <Clock className="w-5 h-5 text-green-500" />;
      case 'collaboration': return <Target className="w-5 h-5 text-purple-500" />;
      case 'motivation': return <Lightbulb className="w-5 h-5 text-orange-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">AI Todo Optimizer</h3>
            <p className="text-gray-600">Smart suggestions to boost your productivity</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={optimizationMode}
            onChange={(e) => setOptimizationMode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="smart">Smart</option>
            <option value="aggressive">Aggressive</option>
            <option value="conservative">Conservative</option>
          </select>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showAdvanced ? 'Basic' : 'Advanced'}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={generateInsights}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Generating Insights...</span>
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              <span>Generate AI Insights</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h4>
            
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getInsightIcon(insight.insightType)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h5 className="font-medium text-gray-900">{insight.title}</h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(insight.priority)}`}>
                          {insight.priority}
                        </span>
                        {insight.confidence && (
                          <span className="text-xs text-gray-500">
                            {Math.round(insight.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{insight.description}</p>
                      
                      {insight.actions && insight.actions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Suggested Actions:</p>
                          <div className="flex flex-wrap gap-2">
                            {insight.actions.map((action, actionIndex) => (
                              <button
                                key={actionIndex}
                                onClick={() => applyOptimization(insight.id)}
                                className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200 transition-colors flex items-center space-x-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>{action}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <button
                      onClick={() => applyOptimization(insight.id)}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Apply</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {insights.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No insights yet</p>
          <p className="text-sm">Click "Generate AI Insights" to get started</p>
        </div>
      )}
    </div>
  );
};

export default AITodoOptimizer; 