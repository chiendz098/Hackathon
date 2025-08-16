import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Settings,
  Timer,
  Clock,
  Coffee,
  Brain,
  Zap,
  Moon,
  Sun,
  Music,
  Bell,
  BellOff,
  Maximize2,
  Minimize2,
  Target,
  TrendingUp,
  BarChart3,
  Heart,
  Star,
  Award,
  Trophy,
  Flame,
  Sparkles,
  Rocket,
  Users,
  MessageCircle,
  Lightbulb,
  BookOpen,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Save,
  Share2,
  Download,
  Upload,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';

const StudyTimer = ({ onSessionComplete, onBreakComplete, currentTodo }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [sessions, setSessions] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [focusMode, setFocusMode] = useState('pomodoro');
  const [ambientSound, setAmbientSound] = useState('none');
  const [customTime, setCustomTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [autoStartSessions, setAutoStartSessions] = useState(false);
  const [showMotivationalMessages, setShowMotivationalMessages] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');

  const timerRef = useRef(null);
  const audioRef = useRef(null);

  const focusModes = {
    pomodoro: { name: 'Pomodoro', icon: '🍅', description: '25min work, 5min break' },
    flow: { name: 'Flow State', icon: '🌊', description: '90min deep focus sessions' },
    sprint: { name: 'Sprint Mode', icon: '⚡', description: '15min high-intensity bursts' },
    custom: { name: 'Custom', icon: '⚙️', description: 'Set your own intervals' }
  };

  const ambientSounds = {
    none: { name: 'No Sound', icon: '🔇' },
    rain: { name: 'Rain Sounds', icon: '🌧️', url: '/sounds/rain.mp3' },
    cafe: { name: 'Cafe Ambience', icon: '☕', url: '/sounds/cafe.mp3' },
    forest: { name: 'Forest Sounds', icon: '🌲', url: '/sounds/forest.mp3' },
    waves: { name: 'Ocean Waves', icon: '🌊', url: '/sounds/waves.mp3' },
    whiteNoise: { name: 'White Noise', icon: '🔊', url: '/sounds/white-noise.mp3' },
    lofi: { name: 'Lo-Fi Music', icon: '🎵', url: '/sounds/lofi.mp3' }
  };

  const motivationalMessages = [
    "You're doing great! Keep pushing forward! 💪",
    "Every minute of focus brings you closer to your goals! 🌟",
    "Your future self will thank you for this effort! ✨",
    "Stay focused, stay motivated! You've got this! 🚀",
    "Progress over perfection! Keep going! 🎯",
    "You're building amazing study habits! 🔥",
    "Focus is your superpower! Use it wisely! ⚡",
    "Small steps lead to big achievements! 📈",
    "You're stronger than any distraction! 💎",
    "Keep your eyes on the prize! 🏆"
  ];

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (showMotivationalMessages && isRunning) {
      const interval = setInterval(() => {
        const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        setCurrentMessage(randomMessage);
      }, 30000); // Change message every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isRunning, showMotivationalMessages]);

  const handleTimerComplete = () => {
    if (soundEnabled) {
      playNotificationSound();
    }
    
    if (notificationsEnabled) {
      showNotification();
    }

    if (isBreak) {
      setCompletedSessions(prev => prev + 1);
      onBreakComplete && onBreakComplete();
      
      if (autoStartSessions) {
        startSession();
      } else {
        setIsRunning(false);
        setIsBreak(false);
        setTimeLeft(getSessionTime());
        setTotalTime(getSessionTime());
      }
    } else {
      setSessions(prev => prev + 1);
      onSessionComplete && onSessionComplete();
      
      if (autoStartBreaks) {
        startBreak();
      } else {
        setIsRunning(false);
        setIsBreak(true);
        setTimeLeft(getBreakTime());
        setTotalTime(getBreakTime());
      }
    }
  };

  const getSessionTime = () => {
    switch (focusMode) {
      case 'pomodoro': return 25 * 60;
      case 'flow': return 90 * 60;
      case 'sprint': return 15 * 60;
      case 'custom': return customTime * 60;
      default: return 25 * 60;
    }
  };

  const getBreakTime = () => {
    const shouldTakeLongBreak = completedSessions > 0 && completedSessions % sessionsBeforeLongBreak === 0;
    return shouldTakeLongBreak ? longBreakTime * 60 : breakTime * 60;
  };

  const startSession = () => {
    const sessionTime = getSessionTime();
    setTimeLeft(sessionTime);
    setTotalTime(sessionTime);
    setIsBreak(false);
    setIsRunning(true);
  };

  const startBreak = () => {
    const breakDuration = getBreakTime();
    setTimeLeft(breakDuration);
    setTotalTime(breakDuration);
    setIsBreak(true);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(getSessionTime());
    setTotalTime(getSessionTime());
  };

  const skipTimer = () => {
    handleTimerComplete();
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = isBreak ? 'Break Time!' : 'Session Complete!';
      const body = isBreak 
        ? 'Time to take a well-deserved break!' 
        : 'Great job! You completed your study session!';
      
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getTimerColor = () => {
    if (isBreak) return 'text-green-600';
    if (focusMode === 'sprint') return 'text-red-600';
    if (focusMode === 'flow') return 'text-purple-600';
    return 'text-blue-600';
  };

  const getTimerBgColor = () => {
    if (isBreak) return 'bg-green-50 dark:bg-green-900/20';
    if (focusMode === 'sprint') return 'bg-red-50 dark:bg-red-900/20';
    if (focusMode === 'flow') return 'bg-purple-50 dark:bg-purple-900/20';
    return 'bg-blue-50 dark:bg-blue-900/20';
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'relative'}`}>
      <div className={`${isFullscreen ? 'h-full flex flex-col' : ''}`}>
        {/* Header */}
        <div className={`${getTimerBgColor()} p-6 rounded-xl shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                <Timer className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  Study Timer
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {focusModes[focusMode].name} - {focusModes[focusMode].description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center mb-6">
            <div className={`text-6xl font-bold ${getTimerColor()} mb-2`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isBreak ? 'Break Time' : `${focusModes[focusMode].name} Session`}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
              <motion.div
                className={`h-2 rounded-full ${
                  isBreak ? 'bg-green-500' : 'bg-blue-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={resetTimer}
              className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            
            <button
              onClick={isRunning ? pauseTimer : (isBreak ? startBreak : startSession)}
              className={`p-4 rounded-full shadow-lg transition-all ${
                isRunning
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            
            <button
              onClick={skipTimer}
              className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Session Stats */}
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Target className="w-4 h-4" />
              <span>Sessions: {sessions}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Completed: {completedSessions}</span>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <AnimatePresence>
          {showMotivationalMessages && currentMessage && isRunning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <p className="text-sm text-gray-700 dark:text-gray-300">{currentMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Timer Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Focus Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Focus Mode
                  </label>
                  <select
                    value={focusMode}
                    onChange={(e) => setFocusMode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    {Object.entries(focusModes).map(([key, mode]) => (
                      <option key={key} value={key}>
                        {mode.icon} {mode.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Time */}
                {focusMode === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Session Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={customTime}
                      onChange={(e) => setCustomTime(parseInt(e.target.value))}
                      min="1"
                      max="120"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                )}

                {/* Break Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={breakTime}
                    onChange={(e) => setBreakTime(parseInt(e.target.value))}
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>

                {/* Long Break Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Long Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={longBreakTime}
                    onChange={(e) => setLongBreakTime(parseInt(e.target.value))}
                    min="5"
                    max="60"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Auto-start breaks</span>
                  <button
                    onClick={() => setAutoStartBreaks(!autoStartBreaks)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      autoStartBreaks ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      autoStartBreaks ? 'transform translate-x-6' : 'transform translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Auto-start sessions</span>
                  <button
                    onClick={() => setAutoStartSessions(!autoStartSessions)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      autoStartSessions ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      autoStartSessions ? 'transform translate-x-6' : 'transform translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Sound notifications</span>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      soundEnabled ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      soundEnabled ? 'transform translate-x-6' : 'transform translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Desktop notifications</span>
                  <button
                    onClick={() => {
                      setNotificationsEnabled(!notificationsEnabled);
                      if (!notificationsEnabled) requestNotificationPermission();
                    }}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      notificationsEnabled ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      notificationsEnabled ? 'transform translate-x-6' : 'transform translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Panel */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Study Statistics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{sessions}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{completedSessions}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((completedSessions / Math.max(sessions, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                </div>
                
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((sessions * getSessionTime()) / 60)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Minutes Studied</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio element for notifications */}
        <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />
      </div>
    </div>
  );
};

export default StudyTimer; 