import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  MoreHorizontal,
  Brain,
  Target,
  TrendingUp,
  Users,
  Award,
  Coffee,
  Music,
  Moon,
  Sun,
  Zap,
  BookOpen,
  Timer,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Share2,
  Heart,
  ThumbsUp,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Settings,
  BarChart3,
  Lightbulb,
  Rocket,
  Trophy,
  Flame,
  Sparkles
} from 'lucide-react';

const EnhancedTodoCard = ({
  todo,
  onToggleComplete,
  onDelete,
  onUpdate,
  onEdit,
  compact = false,
  isSelected = false,
  onToggleSelection = () => {},
  showSelection = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeSpent, setTimeSpent] = useState(todo.timeSpent || 0);
  const [currentMood, setCurrentMood] = useState(todo.mood || 'neutral');
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [isLiked, setIsLiked] = useState(todo.isLiked || false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [focusMode, setFocusMode] = useState('normal');
  const [energyLevel, setEnergyLevel] = useState(todo.energyLevel || 'medium');

  const moods = {
    excited: { icon: '🚀', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    happy: { icon: '😊', color: 'text-green-500', bg: 'bg-green-100' },
    neutral: { icon: '😐', color: 'text-gray-500', bg: 'bg-gray-100' },
    tired: { icon: '😴', color: 'text-blue-500', bg: 'bg-blue-100' },
    stressed: { icon: '😰', color: 'text-red-500', bg: 'bg-red-100' }
  };

  const energyLevels = {
    high: { icon: '⚡', color: 'text-yellow-500', label: 'High Energy' },
    medium: { icon: '🔥', color: 'text-orange-500', label: 'Medium Energy' },
    low: { icon: '🕯️', color: 'text-blue-500', label: 'Low Energy' }
  };

  const focusModes = {
    normal: { icon: '👁️', color: 'text-gray-500', label: 'Normal' },
    deep: { icon: '🧠', color: 'text-purple-500', label: 'Deep Focus' },
    flow: { icon: '🌊', color: 'text-blue-500', label: 'Flow State' },
    sprint: { icon: '⚡', color: 'text-yellow-500', label: 'Sprint Mode' }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    if (progress >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      easy: { color: 'bg-green-100 text-green-800', icon: '😊' },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: '😐' },
      hard: { color: 'bg-red-100 text-red-800', icon: '😰' },
      expert: { color: 'bg-purple-100 text-purple-800', icon: '🧠' }
    };
    return badges[difficulty] || badges.medium;
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    // Add timer logic here
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    // Add timer logic here
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    onUpdate(todo.id, { isLiked: !isLiked });
  };

  const updateMood = (mood) => {
    setCurrentMood(mood);
    onUpdate(todo.id, { mood });
  };

  const updateEnergyLevel = (level) => {
    setEnergyLevel(level);
    onUpdate(todo.id, { energyLevel: level });
  };

  const getMotivationalMessage = () => {
    const messages = [
      "You're doing great! Keep pushing forward! 💪",
      "Every step counts towards your goals! 🌟",
      "You've got this! Believe in yourself! ✨",
      "Progress over perfection! Keep going! 🚀",
      "Your future self will thank you! 🎯"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getStudyTip = () => {
    const tips = [
      "Take a 5-minute break every 25 minutes",
      "Use the Pomodoro technique for better focus",
      "Review your notes within 24 hours",
      "Teach someone else to reinforce learning",
      "Create mind maps for complex topics"
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className={`relative rounded-xl shadow-lg border-l-4 p-6 mb-4 transition-all duration-300 ${
        getPriorityColor(todo.priority)
      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      {/* Gamification Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {showSelection && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              className="w-4 h-4 text-blue-600 rounded"
            />
          )}
          
          <div className="flex items-center space-x-2">
            {todo.category === 'academic' && <BookOpen className="w-5 h-5 text-blue-600" />}
            {todo.category === 'project' && <Rocket className="w-5 h-6 text-purple-600" />}
            {todo.category === 'study' && <Brain className="w-5 h-5 text-green-600" />}
            {todo.category === 'collaboration' && <Users className="w-5 h-5 text-orange-600" />}
            
            <h3 className={`text-lg font-semibold ${todo.isDone ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
              {todo.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mood Tracker */}
          <div className="relative group">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`p-2 rounded-lg transition-colors ${moods[currentMood].bg} ${moods[currentMood].color}`}
            >
              <span className="text-lg">{moods[currentMood].icon}</span>
            </button>
            
            {showDetails && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-10">
                <div className="text-sm font-medium mb-2">How are you feeling?</div>
                <div className="flex space-x-1">
                  {Object.entries(moods).map(([mood, config]) => (
                    <button
                      key={mood}
                      onClick={() => updateMood(mood)}
                      className={`p-2 rounded-lg transition-colors ${config.bg} ${config.color} hover:scale-110`}
                    >
                      <span className="text-lg">{config.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Energy Level */}
          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <span className="text-sm">{energyLevels[energyLevel].icon}</span>
            <span className="text-xs text-gray-600 dark:text-gray-300">{energyLevels[energyLevel].label}</span>
          </div>

          {/* Like Button */}
          <button
            onClick={toggleLike}
            className={`p-2 rounded-lg transition-colors ${
              isLiked ? 'text-red-500 bg-red-100' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Description */}
      {!compact && todo.description && (
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
          {todo.description}
        </p>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
          <span className={`text-sm font-bold ${getProgressColor(todo.progress || 0)}`}>
            {todo.progress || 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${todo.progress || 0}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {/* Timer */}
          <button
            onClick={isTimerRunning ? stopTimer : startTimer}
            className={`p-2 rounded-lg transition-colors ${
              isTimerRunning 
                ? 'bg-red-100 text-red-600' 
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Focus Mode */}
          <div className="relative group">
            <button className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200">
              <Brain className="w-4 h-4" />
            </button>
            
            <div className="absolute left-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-xs font-medium mb-2">Focus Mode</div>
              {Object.entries(focusModes).map(([mode, config]) => (
                <button
                  key={mode}
                  onClick={() => setFocusMode(mode)}
                  className={`block w-full text-left p-1 rounded text-xs ${focusMode === mode ? 'bg-blue-100' : ''}`}
                >
                  {config.icon} {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Collaboration */}
          {todo.category === 'collaboration' && (
            <button
              onClick={() => setShowCollaboration(!showCollaboration)}
              className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200"
            >
              <Users className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Complete Button */}
          <button
            onClick={() => onToggleComplete(todo)}
            className={`p-2 rounded-lg transition-colors ${
              todo.isDone 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
            }`}
          >
            {todo.isDone ? <CheckCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(todo)}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(todo.id)}
            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2 mb-4">
        {todo.subject && (
          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            <BookOpen className="w-3 h-3 mr-1" />
            {todo.subject}
          </span>
        )}
        
        {todo.difficulty && (
          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getDifficultyBadge(todo.difficulty).color}`}>
            {getDifficultyBadge(todo.difficulty).icon} {todo.difficulty}
          </span>
        )}

        {todo.estimatedTime && (
          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            <Clock className="w-3 h-3 mr-1" />
            {todo.estimatedTime}min
          </span>
        )}

        {todo.dueDate && (
          <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(todo.dueDate).toLocaleDateString()}
          </span>
        )}

        {todo.tags && todo.tags.length > 0 && (
          <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
            <Tag className="w-3 h-3 mr-1" />
            {todo.tags.length} tags
          </span>
        )}
      </div>

      {/* Motivational Section */}
      {!compact && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivation</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {getMotivationalMessage()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            💡 Tip: {getStudyTip()}
          </p>
        </div>
      )}

      {/* Subtasks */}
      {!compact && todo.subtasks && todo.subtasks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subtasks</span>
          </div>
          <div className="space-y-1">
                          {Array.isArray(todo.subtasks) && todo.subtasks.map((subtask, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  className="w-3 h-3 text-blue-600"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">{subtask}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Preview */}
      {!compact && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Created: {new Date(todo.createdAt).toLocaleDateString()}</span>
            {todo.timeSpent > 0 && (
              <span>Time spent: {Math.round(todo.timeSpent / 60)}h {todo.timeSpent % 60}m</span>
            )}
          </div>
          
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center space-x-1 hover:text-blue-600"
          >
            <BarChart3 className="w-3 h-3" />
            <span>Analytics</span>
          </button>
        </div>
      )}

      {/* Analytics Panel */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-300">Productivity Score</div>
                <div className="text-2xl font-bold text-green-600">85%</div>
              </div>
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-300">Focus Time</div>
                <div className="text-2xl font-bold text-blue-600">2.5h</div>
              </div>
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-300">Breaks Taken</div>
                <div className="text-2xl font-bold text-orange-600">3</div>
              </div>
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-300">Efficiency</div>
                <div className="text-2xl font-bold text-purple-600">92%</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedTodoCard; 