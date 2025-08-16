import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  CheckCircle, 
  AlertCircle, 
  BarChart3,
  Play,
  Pause,
  Square,
  RotateCcw,
  Calendar,
  Timer,
  Award,
  Star,
  Zap,
  Activity,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import useApi from '../../hooks/useApi';

const AdvancedProgressTracker = ({ todo, onProgressUpdate }) => {
  const { put, get } = useApi();
  
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeEntries, setTimeEntries] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    targetDate: '',
    progress: 0
  });

  useEffect(() => {
    if (todo) {
      loadProgressData();
    }
  }, [todo]);

  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const loadProgressData = async () => {
    try {
      // Load time entries
      const timeResponse = await get(`/todos/${todo.id}/time-entries`);
      if (timeResponse?.data) {
        setTimeEntries(timeResponse.data);
      }
      
      // Load milestones
      const milestoneResponse = await get(`/todos/${todo.id}/milestones`);
      if (milestoneResponse?.data) {
        setMilestones(milestoneResponse.data);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const startTracking = () => {
    setIsTracking(true);
    setStartTime(new Date());
    setElapsedTime(0);
  };

  const pauseTracking = () => {
    setIsTracking(false);
    if (startTime) {
      const duration = Math.floor((new Date() - startTime) / 1000);
      addTimeEntry(duration);
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (startTime) {
      const duration = Math.floor((new Date() - startTime) / 1000);
      addTimeEntry(duration);
      setStartTime(null);
      setElapsedTime(0);
    }
  };

  const addTimeEntry = async (duration) => {
    try {
      const response = await put(`/todos/${todo.id}`, {
        actualTime: (todo.actualTime || 0) + duration
      });
      
      if (response.success) {
        setTimeEntries(prev => [...prev, {
          id: Date.now(),
          duration,
          startTime: startTime,
          endTime: new Date()
        }]);
        
        if (onProgressUpdate) {
          onProgressUpdate();
        }
      }
    } catch (error) {
      console.error('Error adding time entry:', error);
    }
  };

  const addMilestone = async () => {
    try {
      const response = await put(`/todos/${todo.id}/milestones`, milestoneForm);
      
      if (response.success) {
        setMilestones(prev => [...prev, { ...milestoneForm, id: Date.now() }]);
        setMilestoneForm({
          title: '',
          description: '',
          targetDate: '',
          progress: 0
        });
        setShowMilestoneForm(false);
      }
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  };

  const updateProgress = async (newProgress) => {
    try {
      const response = await put(`/todos/${todo.id}`, {
        progress: newProgress
      });
      
      if (response.success && onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-blue-600';
    if (progress >= 40) return 'text-yellow-600';
    if (progress >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Progress Tracking</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMilestoneForm(true)}
            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center space-x-2"
          >
            <Target className="h-4 w-4" />
            <span>Add Milestone</span>
          </button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Progress</p>
              <p className={`text-2xl font-bold ${getProgressColor(todo.progress || 0)}`}>
                {todo.progress || 0}%
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getProgressBarColor(todo.progress || 0)}`}
                style={{ width: `${todo.progress || 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Time Spent</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatTime(todo.actualTime || 0)}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          
          {todo.estimatedTime && (
            <p className="text-sm text-gray-500 mt-1">
              Estimated: {todo.estimatedTime}h
            </p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Milestones</p>
              <p className="text-2xl font-bold text-green-600">
                {milestones.length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-1">
            {milestones.filter(m => m.progress >= 100).length} completed
          </p>
        </div>
      </div>

      {/* Time Tracking Controls */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h4 className="text-md font-medium text-blue-900 mb-3">Time Tracking</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!isTracking ? (
              <button
                onClick={startTracking}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Start Tracking</span>
              </button>
            ) : (
              <>
                <button
                  onClick={pauseTracking}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
                >
                  <Pause className="h-4 w-4" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={stopTracking}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  <Square className="h-4 w-4" />
                  <span>Stop</span>
                </button>
              </>
            )}
          </div>
          
          {isTracking && (
            <div className="text-right">
              <p className="text-sm text-blue-600">Currently tracking</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatTime(elapsedTime)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Controls */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Update Progress</h4>
        <div className="flex items-center space-x-4">
          {[25, 50, 75, 100].map(progress => (
            <button
              key={progress}
              onClick={() => updateProgress(progress)}
              className={`px-4 py-2 rounded-lg border ${
                (todo.progress || 0) >= progress
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {progress}%
            </button>
          ))}
          
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="100"
              value={todo.progress || 0}
              onChange={(e) => updateProgress(parseInt(e.target.value) || 0)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center"
            />
            <span className="text-sm text-gray-600">%</span>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Milestones</h4>
        {milestones.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p>No milestones yet. Add milestones to track progress!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map(milestone => (
              <div key={milestone.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{milestone.title}</h5>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    milestone.progress >= 100 ? 'bg-green-100 text-green-700' :
                    milestone.progress >= 75 ? 'bg-blue-100 text-blue-700' :
                    milestone.progress >= 50 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {milestone.progress}%
                  </span>
                </div>
                
                {milestone.description && (
                  <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className={`h-2 rounded-full ${getProgressBarColor(milestone.progress)}`}
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                  
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={milestone.progress}
                    onChange={(e) => {
                      const newMilestones = milestones.map(m => 
                        m.id === milestone.id 
                          ? { ...m, progress: parseInt(e.target.value) || 0 }
                          : m
                      );
                      setMilestones(newMilestones);
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time Entries */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Time Entries</h4>
        {timeEntries.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p>No time entries yet. Start tracking time to see entries here!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {timeEntries.slice(-5).reverse().map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {entry.startTime && new Date(entry.startTime).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatTime(entry.duration)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Milestone Modal */}
      <AnimatePresence>
        {showMilestoneForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowMilestoneForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Milestone</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={milestoneForm.title}
                      onChange={(e) => setMilestoneForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Milestone title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={milestoneForm.description}
                      onChange={(e) => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Milestone description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={milestoneForm.targetDate}
                      onChange={(e) => setMilestoneForm(prev => ({ ...prev, targetDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Progress
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={milestoneForm.progress}
                      onChange={(e) => setMilestoneForm(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowMilestoneForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addMilestone}
                    disabled={!milestoneForm.title}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Milestone
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedProgressTracker; 