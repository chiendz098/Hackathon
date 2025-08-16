import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Timer as TimerIcon,
  Coffee,
  Target,
  CheckCircle
} from 'lucide-react';

const PomodoroTimer = ({ todo, onComplete, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4
  });
  const [showSettings, setShowSettings] = useState(false);

  // Timer logic
  useEffect(() => {
    let interval = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            // Timer finished
            handleTimerComplete();
            return 0;
          }
          return timeLeft - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = useCallback(() => {
    if (!isBreak) {
      // Work session completed
      setCompletedSessions(prev => prev + 1);
      setSessions(prev => prev + 1);
      
      // Check if it's time for a long break
      if ((sessions + 1) % settings.sessionsUntilLongBreak === 0) {
        setTimeLeft(settings.longBreakDuration * 60);
        setIsBreak(true);
      } else {
        setTimeLeft(settings.shortBreakDuration * 60);
        setIsBreak(true);
      }
    } else {
      // Break completed, start work session
      setTimeLeft(settings.workDuration * 60);
      setIsBreak(false);
    }
    
    setIsRunning(false);
    
    // Play notification sound
    playNotificationSound();
  }, [isBreak, sessions, settings]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {
        // Fallback: use browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(
            isBreak ? 'Break Time!' : 'Work Session Complete!',
            {
              body: isBreak ? 'Time to take a break!' : 'Great work! Take a short break.',
              icon: '/favicon.ico'
            }
          );
        }
      });
    } catch (error) {
      console.log('Could not play notification sound');
    }
  };

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(settings.workDuration * 60);
    setIsBreak(false);
    setSessions(0);
    setCompletedSessions(0);
  };

  const skipSession = () => {
    if (isBreak) {
      // Skip break, start work session
      setTimeLeft(settings.workDuration * 60);
      setIsBreak(false);
    } else {
      // Skip work session, start break
      if ((sessions + 1) % settings.sessionsUntilLongBreak === 0) {
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setTimeLeft(settings.shortBreakDuration * 60);
      }
      setIsBreak(true);
    }
    setIsRunning(false);
  };

  const completeSession = () => {
    const sessionData = {
      id: Date.now(),
      type: isBreak ? 'break' : 'work',
      duration: (isBreak ? 
        (sessions % settings.sessionsUntilLongBreak === 0 ? settings.longBreakDuration : settings.shortBreakDuration) 
        : settings.workDuration) * 60,
      completedAt: new Date().toISOString(),
      todoId: todo?.id
    };

    onComplete(sessionData);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalTime = isBreak ? 
      (sessions % settings.sessionsUntilLongBreak === 0 ? settings.longBreakDuration : settings.shortBreakDuration) * 60
      : settings.workDuration * 60;
    const elapsed = totalTime - timeLeft;
    return (elapsed / totalTime) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Timer Display */}
      <div className="text-center">
        <div className="relative w-48 h-48 mx-auto mb-4">
          {/* Progress Circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={isBreak ? "#10b981" : "#3b82f6"}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          {/* Timer Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-gray-900">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {isBreak ? 'Break Time' : 'Focus Time'}
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Target className="w-4 h-4 mr-1" />
            Session {sessions + 1}
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            {completedSessions} completed
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-3">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Play className="w-5 h-5 mr-2" />
            Start
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            <Pause className="w-5 h-5 mr-2" />
            Pause
          </button>
        )}
        
        <button
          onClick={resetTimer}
          className="flex items-center px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Reset
        </button>
        
        <button
          onClick={skipSession}
          className="flex items-center px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Coffee className="w-5 h-5 mr-2" />
          Skip
        </button>
      </div>

      {/* Session Complete Button */}
      {!isRunning && timeLeft === 0 && (
        <div className="text-center">
          <button
            onClick={completeSession}
            className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors mx-auto"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Complete Session
          </button>
        </div>
      )}

      {/* Settings */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4 mr-2" />
          Timer Settings
        </button>
        
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Duration (min)
                </label>
                <input
                  type="number"
                  value={settings.workDuration}
                  onChange={(e) => setSettings(prev => ({ ...prev, workDuration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Break (min)
                </label>
                <input
                  type="number"
                  value={settings.shortBreakDuration}
                  onChange={(e) => setSettings(prev => ({ ...prev, shortBreakDuration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Long Break (min)
                </label>
                <input
                  type="number"
                  value={settings.longBreakDuration}
                  onChange={(e) => setSettings(prev => ({ ...prev, longBreakDuration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sessions until Long Break
                </label>
                <input
                  type="number"
                  value={settings.sessionsUntilLongBreak}
                  onChange={(e) => setSettings(prev => ({ ...prev, sessionsUntilLongBreak: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Todo Info */}
      {todo && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Current Task:</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <h5 className="font-medium text-gray-900">{todo.title}</h5>
            {todo.description && (
              <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
            )}
            {todo.pomodoro_sessions && todo.pomodoro_sessions.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                Previous sessions: {todo.pomodoro_sessions.length}
                {todo.total_pomodoro_time && (
                  <span className="ml-2">
                    • Total time: {Math.round(todo.total_pomodoro_time / 60)}m
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer; 