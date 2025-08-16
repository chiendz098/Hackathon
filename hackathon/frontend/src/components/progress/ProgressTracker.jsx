import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  Award, 
  Calendar, 
  Clock, 
  BookOpen,
  Zap,
  Trophy,
  Star,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Target as TargetIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useTheme } from '../../contexts/ThemeContext';

const ProgressTracker = () => {
  const { user } = useAuth();
  const { userProgress, achievements } = useGamification();
  const { currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeFrame, setTimeFrame] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProgress) {
      setLoading(false);
    }
  }, [userProgress]);

  const timeFrames = [
    { id: 'week', label: 'This Week', days: 7 },
    { id: 'month', label: 'This Month', days: 30 },
    { id: 'quarter', label: 'This Quarter', days: 90 },
    { id: 'year', label: 'This Year', days: 365 }
  ];

  const progressCategories = [
    {
      id: 'tasks',
      name: 'Tasks Completed',
      icon: CheckCircle,
      color: 'green',
      current: userProgress?.tasksCompleted || 0,
      target: userProgress?.weeklyGoals?.tasksPerWeek || 10,
      unit: 'tasks'
    },
    {
      id: 'study_time',
      name: 'Study Time',
      icon: Clock,
      color: 'blue',
      current: userProgress?.totalStudyTime || 0,
      target: userProgress?.weeklyGoals?.studyHoursPerWeek * 60 || 1200,
      unit: 'minutes'
    },
    {
      id: 'streak',
      name: 'Current Streak',
      icon: Flame,
      color: 'orange',
      current: userProgress?.streak || 0,
      target: 7,
      unit: 'days'
    },
    {
      id: 'xp',
      name: 'Experience Points',
      icon: Zap,
      color: 'purple',
      current: userProgress?.xp || 0,
      target: userProgress?.level * 1000 || 1000,
      unit: 'XP'
    }
  ];

  const localAchievements = [
    {
      id: 'first_task',
      name: 'First Step',
      description: 'Complete your first task',
      icon: '🎯',
      unlocked: userProgress?.tasksCompleted > 0,
      progress: userProgress?.tasksCompleted > 0 ? 100 : 0,
      reward: '10 XP'
    },
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      unlocked: userProgress?.streak >= 7,
      progress: Math.min((userProgress?.streak || 0) / 7 * 100, 100),
      reward: '50 XP'
    },
    {
      id: 'study_master',
      name: 'Study Master',
      description: 'Study for 10 hours in a week',
      icon: '📚',
      unlocked: (userProgress?.totalStudyTime || 0) >= 600,
      progress: Math.min(((userProgress?.totalStudyTime || 0) / 600) * 100, 100),
      reward: '100 XP'
    },
    {
      id: 'task_master',
      name: 'Task Master',
      description: 'Complete 100 tasks',
      icon: '🏆',
      unlocked: (userProgress?.tasksCompleted || 0) >= 100,
      progress: Math.min(((userProgress?.tasksCompleted || 0) / 100) * 100, 100),
      reward: '500 XP'
    }
  ];

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    if (percentage >= 40) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };

  const formatValue = (value, unit) => {
    switch (unit) {
      case 'minutes':
        const hours = Math.floor(value / 60);
        const minutes = value % 60;
        return `${hours}h ${minutes}m`;
      case 'XP':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Progress Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {timeFrames.map((frame) => (
                  <option key={frame.id} value={frame.id}>
                    {frame.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'achievements', label: 'Achievements', icon: Trophy },
              { id: 'analytics', label: 'Analytics', icon: LineChart },
              { id: 'goals', label: 'Goals', icon: Target }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {progressCategories.map((category) => {
                const Icon = category.icon;
                const percentage = getProgressPercentage(category.current, category.target);
                const progressColor = getProgressColor(percentage);
                
                return (
                  <motion.div
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${progressColor}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatValue(category.current, category.unit)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {category.name}
                    </h3>
                    
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(percentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Target: {formatValue(category.target, category.unit)}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* Level Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Level Progress
              </h2>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    Level {userProgress?.level || 1}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {userProgress?.xp || 0} / {(userProgress?.level || 1) * 1000} XP
                  </div>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${getProgressPercentage(userProgress?.xp || 0, (userProgress?.level || 1) * 1000)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {userProgress?.recentActivity?.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`p-2 rounded-lg ${getProgressColor(activity.progress || 0)}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.points || 0} XP
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localAchievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.02 }}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-2 ${
                    achievement.unlocked 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`text-4xl ${achievement.unlocked ? 'filter-none' : 'filter grayscale opacity-50'}`}>
                      {achievement.icon}
                    </div>
                    {achievement.unlocked && (
                      <div className="p-2 bg-green-500 rounded-full">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className={`text-lg font-semibold mb-2 ${
                    achievement.unlocked 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {achievement.name}
                  </h3>
                  
                  <p className={`text-sm mb-4 ${
                    achievement.unlocked 
                      ? 'text-gray-600 dark:text-gray-300' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {achievement.description}
                  </p>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(achievement.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          achievement.unlocked 
                            ? 'bg-green-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${achievement.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {typeof achievement.reward === 'object' 
                        ? `${achievement.reward.xp || 0} XP + ${achievement.reward.coins || 0} Coins`
                        : achievement.reward
                      }
                    </span>
                    {achievement.unlocked && (
                      <span className="text-xs text-green-500 font-medium">
                        UNLOCKED
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Study Time Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Study Time Trends
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <LineChart className="w-12 h-12 mx-auto mb-2" />
                    <p>Study time analytics will be displayed here</p>
                  </div>
                </div>
              </div>

              {/* Task Completion Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Task Completion Rate
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 mx-auto mb-2" />
                    <p>Task completion analytics will be displayed here</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Learning Goals
              </h2>
              <div className="space-y-4">
                {userProgress?.goals?.map((goal, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {goal.title}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        goal.completed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {goal.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {goal.description}
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span>Progress: {goal.progress || 0}%</span>
                      <span>Target: {goal.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker; 