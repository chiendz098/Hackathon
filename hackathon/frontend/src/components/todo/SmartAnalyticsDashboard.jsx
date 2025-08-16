import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import useApi from '../../hooks/useApi';
import { BarChart3, TrendingUp, Target, Clock, Zap, Brain, Users, Award, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SmartAnalyticsDashboard = () => {
  const { user } = useAuth();
  const { get } = useApi();
  const [analytics, setAnalytics] = useState({
    performance: {},
    timeAnalysis: {},
    learningMetrics: {},
    behavioralPatterns: {},
    socialMetrics: {},
    goalProgress: {}
  });
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeframe, selectedCategory]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [analyticsResponse, insightsResponse, recommendationsResponse] = await Promise.all([
        get(`/api/todo/analytics?timeframe=${selectedTimeframe}&category=${selectedCategory}`),
        get('/api/ai-rag/insights'),
        get('/api/ai-rag/recommendations')
      ]);

      if (analyticsResponse.success) setAnalytics(analyticsResponse.analytics);
      if (insightsResponse.success) setInsights(insightsResponse.data?.insights || insightsResponse.insights || []);
      if (recommendationsResponse.success) setRecommendations(recommendationsResponse.data?.recommendations || recommendationsResponse.recommendations || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'productivity': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'learning': return <Brain className="w-5 h-5 text-blue-500" />;
      case 'scheduling': return <Clock className="w-5 h-5 text-green-500" />;
      case 'collaboration': return <Users className="w-5 h-5 text-purple-500" />;
      case 'motivation': return <Lightbulb className="w-5 h-5 text-orange-500" />;
      default: return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRecommendationPriority = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-red-500 bg-red-50';
      case 'medium': return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-4 border-green-500 bg-green-50';
      default: return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Smart Analytics Dashboard</h3>
            <p className="text-gray-600">AI-powered insights and recommendations</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="study">Study</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="health">Health</option>
          </select>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Completion Rate</p>
              <p className="text-2xl font-bold">{analytics.performance?.completionRate || 0}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Productivity Index</p>
              <p className="text-2xl font-bold">{analytics.performance?.productivityIndex || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Efficiency Score</p>
              <p className="text-2xl font-bold">{analytics.performance?.efficiencyScore || 0}</p>
            </div>
            <Target className="w-8 h-8 text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Quality Score</p>
              <p className="text-2xl font-bold">{analytics.performance?.qualityScore || 0}</p>
            </div>
            <Award className="w-8 h-8 text-orange-200" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <span>AI Insights</span>
          </h4>
          
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight, index) => (
              <motion.div
                key={insight.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-start space-x-2">
                  {getInsightIcon(insight.insightType)}
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm">{insight.title}</h5>
                    <p className="text-gray-600 text-xs">{insight.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                    insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {insight.priority}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Smart Recommendations */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <span>Smart Recommendations</span>
          </h4>
          
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec, index) => (
              <motion.div
                key={rec.id || index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-lg p-3 ${getRecommendationPriority(rec.priority)}`}
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm">{rec.title}</h5>
                    <p className="text-gray-600 text-xs">{rec.description}</p>
                    {rec.actions && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rec.actions.slice(0, 2).map((action, actionIndex) => (
                          <span key={actionIndex} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {action}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Analysis */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-green-500" />
            <span>Time Analysis</span>
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Time Spent</span>
              <span className="font-medium">{Math.round((analytics.timeAnalysis?.totalTimeSpent || 0) / 60)}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average per Task</span>
              <span className="font-medium">{Math.round((analytics.timeAnalysis?.averageTimePerTask || 0) / 60)}m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Peak Hours</span>
              <span className="font-medium text-sm">
                {analytics.timeAnalysis?.peakProductivityHours?.slice(0, 2).join(', ') || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Learning Metrics */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <span>Learning Progress</span>
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Knowledge Retention</span>
              <span className={`font-medium ${getPerformanceColor(analytics.learningMetrics?.knowledgeRetention || 0)}`}>
                {analytics.learningMetrics?.knowledgeRetention || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Skill Improvement</span>
              <span className={`font-medium ${getPerformanceColor(analytics.learningMetrics?.skillImprovement || 0)}`}>
                {analytics.learningMetrics?.skillImprovement || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Learning Curve</span>
              <span className="font-medium text-sm capitalize">
                {analytics.learningMetrics?.learningCurve || 'stable'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartAnalyticsDashboard; 