import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { Play, Pause, Square, Clock, Timer, Target } from 'lucide-react';

const TimeTracker = ({ todo, onUpdate }) => {
  const { currentTheme } = useTheme();
  const [isRunning, setIsRunning] = useState(todo.isTimerRunning || false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionStart, setSessionStart] = useState(null);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    // Load existing time data
    if (todo.actualTime) {
      setElapsedTime(todo.actualTime * 60); // Convert minutes to seconds
    }
  }, [todo.actualTime]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = async () => {
    try {
      const response = await fetch(`/api/todo/${todo.id}/timer/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: 'work',
          description: 'Time tracking session'
        })
      });

      const data = await response.json();
      if (data.success) {
      setIsRunning(true);
        setSessionStart(new Date());
        onUpdate(data.todo);
      }
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const pauseTimer = async () => {
    try {
      const response = await fetch(`/api/todo/${todo.id}/timer/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setIsRunning(false);
        onUpdate(data.todo);
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
    }
  };

  const stopTimer = async () => {
    try {
      const response = await fetch(`/api/todo/${todo.id}/timer/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
      setIsRunning(false);
        setSessionStart(null);
        onUpdate(data.todo);
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  const saveTime = async () => {
    try {
      const totalMinutes = Math.floor(elapsedTime / 60);
      const response = await fetch(`/api/todo/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          actualTime: totalMinutes
        })
      });

      const data = await response.json();
      if (data.success) {
        onUpdate(data.todo);
      }
    } catch (error) {
      console.error('Error saving time:', error);
    }
  };

  const getProgressPercentage = () => {
    if (!todo.estimatedTime) return 0;
    const actualMinutes = Math.floor(elapsedTime / 60);
    return Math.min((actualMinutes / todo.estimatedTime) * 100, 100);
  };

  return (
    <div className={`p-4 rounded-lg ${
      currentTheme === 'neon' ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Timer className={`w-5 h-5 ${
            currentTheme === 'neon' ? 'text-cyan-400' : 'text-blue-600'
          }`} />
          <h3 className={`font-semibold ${
            currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
          }`}>
            Time Tracker
          </h3>
        </div>
        {isRunning && (
    <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 bg-red-500 rounded-full"
          />
        )}
      </div>

      {/* Time Display */}
      <div className="text-center mb-4">
        <div className={`text-3xl font-mono font-bold ${
          currentTheme === 'neon' ? 'text-cyan-400' : 'text-blue-600'
        }`}>
          {formatTime(elapsedTime)}
        </div>
        <div className={`text-sm ${
          currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {isRunning ? 'Tracking...' : 'Paused'}
        </div>
      </div>

      {/* Progress Bar */}
        {todo.estimatedTime && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className={currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-600'}>
              Progress
            </span>
            <span className={currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-600'}>
              {Math.floor(elapsedTime / 60)}/{todo.estimatedTime} min
            </span>
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-2 ${
            currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          </div>
        )}

      {/* Controls */}
      <div className="flex space-x-2">
        {!isRunning ? (
          <motion.button
            onClick={startTimer}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-4 h-4 mr-1" />
            Start
          </motion.button>
        ) : (
          <motion.button
            onClick={pauseTimer}
            className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Pause className="w-4 h-4 mr-1" />
            Pause
          </motion.button>
        )}
        
        <motion.button
          onClick={stopTimer}
          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Square className="w-4 h-4 mr-1" />
          Stop
        </motion.button>
      </div>

      {/* Save Time Button */}
      {elapsedTime > 0 && (
        <motion.button
          onClick={saveTime}
          className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Clock className="w-4 h-4 mr-1" />
          Save Time ({Math.floor(elapsedTime / 60)} min)
        </motion.button>
      )}

      {/* Session Info */}
      {sessionStart && (
        <div className={`mt-3 p-2 rounded text-sm ${
          currentTheme === 'neon' ? 'bg-gray-700 text-gray-300' : 'bg-blue-50 text-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <span>Session started:</span>
            <span>{sessionStart.toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
