import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Brain,
  BookOpen,
  Calendar,
  Star,
  Award,
  Trophy,
  Flame,
  Zap,
  Coffee,
  Moon,
  Sun,
  Users,
  MessageCircle,
  Lightbulb,
  Sparkles,
  Rocket,
  Heart,
  Eye,
  EyeOff,
  Download,
  Share2,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  RotateCcw,
  Save,
  Filter,
  Search,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';

const StudyAnalyticsDashboard = ({ todos }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('productivity');
  const [showInsights, setShowInsights] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);

  // Calculate analytics data
  const calculateAnalytics = () => {
    const now = new Date();
    const periodStart = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'semester':
        periodStart.setMonth(now.getMonth() - 6);
        break;
      default:
        periodStart.setDate(now.getDate() - 7);
    }

    const periodTodos = todos.filter(todo => 
      new Date(todo.createdAt) >= periodStart
    );

    const completedTodos = periodTodos.filter(todo => todo.isDone);
    const totalTimeSpent = periodTodos.reduce((sum, todo) => sum + (todo.timeSpent || 0), 0);
    const averageCompletionTime = completedTodos.length > 0 
      ? totalTimeSpent / completedTodos.length 
      : 0;

    const productivityScore = completedTodos.length > 0 
      ? Math.min(100, (completedTodos.length / periodTodos.length) * 100 + 
        (totalTimeSpent > 0 ? Math.min(20, totalTimeSpent / 60) : 0))
      : 0;

    const studyStreak = calculateStudyStreak();
    const peakHours = calculatePeakHours();
    const subjectPerformance = calculateSubjectPerformance(periodTodos);
    const focusTrends = calculateFocusTrends(periodTodos);

    return {
      totalTasks: periodTodos.length,
      completedTasks: completedTodos.length,
      completionRate: periodTodos.length > 0 ? (completedTodos.length / periodTodos.length) * 100 : 0,
      totalTimeSpent,
      averageCompletionTime,
      productivityScore,
      studyStreak,
      peakHours,
      subjectPerformance,
      focusTrends
    };
  };

  const calculateStudyStreak = () => {
    // Calculate consecutive days with completed tasks
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    while (true) {
      const dayTodos = todos.filter(todo => {
        const todoDate = new Date(todo.createdAt);
        return todoDate.toDateString() === currentDate.toDateString() && todo.isDone;
      });
      
      if (dayTodos.length > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculatePeakHours = () => {
    const hourStats = Array(24).fill(0);
    
    todos.forEach(todo => {
      if (todo.createdAt) {
        const hour = new Date(todo.createdAt).getHours();
        hourStats[hour]++;
      }
    });
    
    const maxHour = hourStats.indexOf(Math.max(...hourStats));
    return {
      peakHour: maxHour,
      peakHourLabel: `${maxHour}:00`,
      hourDistribution: hourStats
    };
  };

  const calculateSubjectPerformance = (periodTodos) => {
    const subjectStats = {};
    
    periodTodos.forEach(todo => {
      const subject = todo.subject || 'General';
      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, completed: 0, timeSpent: 0 };
      }
      subjectStats[subject].total++;
      if (todo.isDone) subjectStats[subject].completed++;
      subjectStats[subject].timeSpent += todo.timeSpent || 0;
    });
    
    return Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      completionRate: (stats.completed / stats.total) * 100,
      averageTime: stats.completed > 0 ? stats.timeSpent / stats.completed : 0,
      totalTasks: stats.total
    }));
  };

  const calculateFocusTrends = (periodTodos) => {
    const focusData = periodTodos.map(todo => ({
      date: new Date(todo.createdAt).toDateString(),
      focusLevel: todo.focusLevel || 'medium',
      timeSpent: todo.timeSpent || 0,
      completed: todo.isDone
    }));
    
    return focusData;
  };

  const analytics = calculateAnalytics();

  const getProductivityLevel = (score) => {
    if (score >= 90) return { level: 'Exceptional', color: 'text-green-600', icon: '🏆' };
    if (score >= 80) return { level: 'Excellent', color: 'text-blue-600', icon: '⭐' };
    if (score >= 70) return { level: 'Good', color: 'text-yellow-600', icon: '🔥' };
    if (score >= 60) return { level: 'Fair', color: 'text-orange-600', icon: '📈' };
    return { level: 'Needs Improvement', color: 'text-red-600', icon: '💪' };
  };

  const getStudyInsights = () => {
    const insights = [];
    
    if (analytics.studyStreak >= 7) {
      insights.push({
        type: 'achievement',
        title: 'Study Streak Champion!',
        description: `You've maintained a ${analytics.studyStreak}-day study streak!`,
        icon: '🔥',
        color: 'text-red-600'
      });
    }
    
    if (analytics.completionRate >= 80) {
      insights.push({
        type: 'performance',
        title: 'High Completion Rate',
        description: `${analytics.completionRate.toFixed(1)}% task completion rate!`,
        icon: '🎯',
        color: 'text-green-600'
      });
    }
    
    if (analytics.totalTimeSpent > 300) {
      insights.push({
        type: 'dedication',
        title: 'Dedicated Learner',
        description: `${Math.round(analytics.totalTimeSpent / 60)} hours of focused study time!`,
        icon: '⏰',
        color: 'text-blue-600'
      });
    }
    
    return insights;
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (analytics.completionRate < 70) {
      recommendations.push({
        title: 'Improve Task Completion',
        description: 'Try breaking down larger tasks into smaller, manageable subtasks',
        action: 'View Task Templates',
        icon: '📋',
        color: 'bg-blue-100 text-blue-700'
      });
    }
    
    if (analytics.studyStreak < 3) {
      recommendations.push({
        title: 'Build Study Habits',
        description: 'Start with 15-minute daily study sessions to build consistency',
        action: 'Set Daily Goals',
        icon: '📅',
        color: 'bg-green-100 text-green-700'
      });
    }
    
    if (analytics.totalTimeSpent < 120) {
      recommendations.push({
        title: 'Increase Study Time',
        description: 'Aim for at least 2 hours of focused study time per day',
        action: 'Schedule Study Blocks',
        icon: '⏰',
        color: 'bg-purple-100 text-purple-700'
      });
    }
    
    return recommendations;
  };

  const productivityLevel = getProductivityLevel(analytics.productivityScore);
  const insights = getStudyInsights();
  const recommendations = getRecommendations();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Study Analytics Dashboard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track your learning progress and optimize your study habits
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="semester">Last 6 Months</option>
          </select>
          
          <button
            onClick={() => setShowDetailedView(!showDetailedView)}
            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {showDetailedView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 p-4 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Productivity Score</p>
              <p className={`text-2xl font-bold ${productivityLevel.color}`}>
                {analytics.productivityScore.toFixed(1)}%
              </p>
            </div>
            <span className="text-2xl">{productivityLevel.icon}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{productivityLevel.level}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 p-4 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Study Streak</p>
              <p className="text-2xl font-bold text-green-600">{analytics.studyStreak} days</p>
            </div>
            <Flame className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Consecutive days</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 p-4 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {analytics.completionRate.toFixed(1)}%
              </p>
            </div>
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {analytics.completedTasks}/{analytics.totalTasks} tasks
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 p-4 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Study Time</p>
              <p className="text-2xl font-bold text-orange-600">
                {Math.round(analytics.totalTimeSpent / 60)}h
              </p>
            </div>
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Total focused time</p>
        </motion.div>
      </div>

      {/* Detailed Analytics */}
      <AnimatePresence>
        {showDetailedView && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            {/* Peak Hours Chart */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Peak Study Hours
              </h3>
              <div className="flex items-end justify-between h-32">
                {analytics.peakHours.hourDistribution.map((count, hour) => (
                  <div key={hour} className="flex flex-col items-center">
                    <div
                      className={`w-4 rounded-t transition-all duration-300 ${
                        hour === analytics.peakHours.peakHour
                          ? 'bg-blue-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      style={{ height: `${Math.max(10, (count / Math.max(...analytics.peakHours.hourDistribution)) * 80)}px` }}
                    />
                    <span className="text-xs text-gray-500 mt-1">{hour}:00</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Your most productive time: <strong>{analytics.peakHours.peakHourLabel}</strong>
              </p>
            </div>

            {/* Subject Performance */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Subject Performance
              </h3>
              <div className="space-y-3">
                {analytics.subjectPerformance.map((subject) => (
                  <div key={subject.subject} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {subject.subject}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {subject.totalTasks} tasks
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {subject.completionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* AI Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              AI Insights
            </h3>
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="text-blue-600 hover:text-blue-700"
            >
              {showInsights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          <AnimatePresence>
            {showInsights && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                    <span className="text-lg">{insight.icon}</span>
                    <div>
                      <div className={`font-medium ${insight.color}`}>{insight.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{insight.description}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Recommendations
            </h3>
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="text-green-600 hover:text-green-700"
            >
              {showRecommendations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          <AnimatePresence>
            {showRecommendations && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-white dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{rec.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{rec.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.description}</div>
                        <button className={`mt-2 px-3 py-1 rounded-lg text-xs font-medium ${rec.color}`}>
                          {rec.action}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default StudyAnalyticsDashboard; 