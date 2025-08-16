import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Brain, Lightbulb, Target, TrendingUp, Users, 
  Clock, Calendar, BarChart3, MessageSquare, Sparkles 
} from 'lucide-react';

const NotionStyleAI = ({ groupId, todos, members, onOptimization, darkMode }) => {
  const [activeTab, setActiveTab] = useState('insights');
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [optimizationResults, setOptimizationResults] = useState(null);

  // AI-powered insights
  const insights = [
    {
      type: 'workload',
      title: 'Workload Distribution',
      description: 'AI detected uneven workload distribution among team members',
      suggestion: 'Consider redistributing tasks to balance workload',
      priority: 'high',
      icon: Users
    },
    {
      type: 'deadlines',
      title: 'Deadline Optimization',
      description: 'Several tasks have overlapping deadlines that may cause bottlenecks',
      suggestion: 'AI suggests spreading deadlines across the week for better flow',
      priority: 'medium',
      icon: Calendar
    },
    {
      type: 'performance',
      title: 'Performance Patterns',
      description: 'Team performance peaks in the morning hours',
      suggestion: 'Schedule high-priority tasks during peak performance hours',
      priority: 'medium',
      icon: TrendingUp
    }
  ];

  // AI optimization suggestions
  const optimizationSuggestions = [
    {
      id: 'workload_balance',
      title: 'Workload Balancing',
      description: 'Automatically redistribute tasks to balance team workload',
      benefits: ['Reduced stress', 'Better productivity', 'Fair distribution'],
      icon: Users
    },
    {
      id: 'deadline_optimization',
      title: 'Deadline Optimization',
      description: 'AI-powered deadline suggestions based on team capacity and priorities',
      benefits: ['Realistic timelines', 'Better planning', 'Reduced bottlenecks'],
      icon: Calendar
    },
    {
      id: 'task_prioritization',
      title: 'Smart Prioritization',
      description: 'Intelligent task prioritization based on impact and urgency',
      benefits: ['Focus on what matters', 'Better resource allocation', 'Improved outcomes'],
      icon: Target
    },
    {
      id: 'team_collaboration',
      title: 'Collaboration Optimization',
      description: 'Suggest optimal team pairings and collaboration opportunities',
      benefits: ['Better teamwork', 'Skill sharing', 'Improved results'],
      icon: MessageSquare
    }
  ];

  // Handle AI optimization
  const handleOptimization = async (optimizationType) => {
    setIsLoading(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const results = generateOptimizationResults(optimizationType);
      setOptimizationResults(results);
      
      if (onOptimization) {
        onOptimization(optimizationType);
      }
    } catch (error) {
      console.error('AI optimization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock optimization results
  const generateOptimizationResults = (type) => {
    switch (type) {
      case 'workload_balance':
        return {
          title: 'Workload Balancing Results',
          summary: 'AI has redistributed 15 tasks to balance workload across team members',
          changes: [
            { member: 'John Doe', before: 8, after: 5, change: -3 },
            { member: 'Jane Smith', before: 3, after: 6, change: +3 },
            { member: 'Mike Johnson', before: 7, after: 5, change: -2 },
            { member: 'Sarah Wilson', before: 2, after: 4, change: +2 }
          ],
          metrics: {
            workloadVariance: { before: 2.8, after: 0.5, improvement: '82%' },
            estimatedCompletion: { before: '2.3 weeks', after: '1.8 weeks', improvement: '22%' }
          }
        };
      
      case 'deadline_optimization':
        return {
          title: 'Deadline Optimization Results',
          summary: 'AI has suggested new deadlines for 12 tasks to improve workflow',
          changes: [
            { task: 'Design Review', before: '2025-01-20', after: '2025-01-18', reason: 'Earlier completion allows for feedback iteration' },
            { task: 'Code Implementation', before: '2025-01-25', after: '2025-01-22', reason: 'Aligned with team capacity' },
            { task: 'Testing Phase', before: '2025-01-28', after: '2025-01-25', reason: 'Optimized for quality assurance timeline' }
          ],
          metrics: {
            deadlineConflicts: { before: 3, after: 0, improvement: '100%' },
            estimatedEfficiency: { before: '75%', after: '92%', improvement: '23%' }
          }
        };
      
      default:
        return null;
    }
  };

  // Get member workload
  const getMemberWorkload = (memberId) => {
    return todos.filter(todo => 
      todo.assignments?.some(a => a.assignedTo === memberId)
    ).length;
  };

  // Get overdue tasks count
  const getOverdueTasks = () => {
    const now = new Date();
    return todos.filter(todo => {
      if (!todo.deadline) return false;
      return new Date(todo.deadline) < now && todo.status !== 'completed';
    }).length;
  };

  // Get completion rate
  const getCompletionRate = () => {
    const completed = todos.filter(t => t.status === 'completed').length;
    return todos.length > 0 ? (completed / todos.length) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h2>
          <p className="text-gray-600 dark:text-gray-400">Powered by artificial intelligence to optimize your workflow</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI Active</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
        {['insights', 'optimization', 'analytics', 'suggestions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-1 border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{members.length}</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{getCompletionRate().toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Tasks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{getOverdueTasks()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span>AI Insights</span>
              </h3>
              
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <motion.div
                    key={insight.type}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.priority === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900' :
                      insight.priority === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900' :
                      'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        {React.createElement(insight.icon, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" })}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{insight.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{insight.description}</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{insight.suggestion}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        insight.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300' :
                        insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300'
                      }`}>
                        {insight.priority}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'optimization' && (
          <motion.div
            key="optimization"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Optimization suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {optimizationSuggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  whileHover={{ y: -2 }}
                  className={`p-6 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-500'
                  }`}
                  onClick={() => handleOptimization(suggestion.id)}
                >
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      {React.createElement(suggestion.icon, { className: "w-6 h-6 text-white" })}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {suggestion.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Benefits:</p>
                    <ul className="space-y-1">
                      {suggestion.benefits.map((benefit, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Run Optimization</span>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Optimization results */}
            {optimizationResults && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                   <Sparkles className="w-5 h-5 text-purple-600" />
                   <span>{optimizationResults.title}</span>
                 </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">{optimizationResults.summary}</p>
                
                {optimizationResults.changes && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Changes Made:</h4>
                    <div className="space-y-2">
                      {optimizationResults.changes.map((change, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{change.task || change.member}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{change.before}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{change.after}</span>
                            {change.reason && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({change.reason})</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {optimizationResults.metrics && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Impact Metrics:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(optimizationResults.metrics).map(([key, metric]) => (
                        <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{metric.before}</span>
                            <span className="text-green-500">→</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{metric.after}</span>
                            <span className="text-xs text-green-600 dark:text-green-400">({metric.improvement} improvement)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI-Powered Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400">Advanced analytics coming soon...</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'suggestions' && (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Suggestions</h3>
              <p className="text-gray-600 dark:text-gray-400">Personalized suggestions coming soon...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          >
            <div className={`p-8 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} text-center`}>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Processing</h3>
              <p className="text-gray-600 dark:text-gray-400">Analyzing your data and generating optimizations...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotionStyleAI; 