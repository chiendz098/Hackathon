import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Trophy, 
  RefreshCw,
  TrendingUp,
  Activity
} from 'lucide-react';

const RealTimeStatistics = () => {
  const [stats, setStats] = useState({
    activeStudents: 0,
    studySessions: 0,
    tasksCompleted: 0,
    achievements: 0,
    lastUpdated: null
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);

  // Fetch initial statistics
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/analytics/statistics');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        setIsConnected(true);
      } else {
        throw new Error(data.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Start polling for updates
  const startPolling = () => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 30 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/analytics/statistics');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data);
            setIsConnected(true);
            setError(null);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
        setIsConnected(false);
        setError('Connection lost. Retrying...');
      }
    }, 30000); // 30 seconds
  };

  // Manual refresh
  const handleRefresh = async () => {
    await fetchStats();
  };

  // Force refresh via API
  const handleForceRefresh = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/analytics/statistics/refresh', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh statistics');
      }
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error forcing refresh:', err);
      setError(err.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial statistics
    fetchStats();
    
    // Start polling for updates
    startPolling();

    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Format number with commas
  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading && !stats.activeStudents) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-400" />
          <p className="text-gray-300">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Real-Time Statistics</h2>
          <p className="text-gray-300">
            Live updates from your learning platform
            {isConnected && (
              <span className="ml-2 inline-flex items-center text-green-400">
                <Activity className="h-4 w-4 mr-1" />
                Live
              </span>
            )}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-all duration-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 inline ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={handleForceRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm rounded-lg transition-all duration-300 disabled:opacity-50"
          >
            <TrendingUp className="h-4 w-4 mr-2 inline" />
            Force Update
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-6">
          <p className="text-red-200 text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Students */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300">
          <div className="flex items-center mb-3">
            <Users className="h-6 w-6 mr-2 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Active Students</h3>
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            {formatNumber(stats.activeStudents)}
          </div>
          <p className="text-blue-200 text-sm">
            Currently enrolled learners
          </p>
        </div>

        {/* Study Sessions */}
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30 hover:border-green-400/50 transition-all duration-300">
          <div className="flex items-center mb-3">
            <BookOpen className="h-6 w-6 mr-2 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Study Sessions</h3>
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            {formatNumber(stats.studySessions)}
          </div>
          <p className="text-green-200 text-sm">

          </p>
        </div>

        {/* Tasks Completed */}
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300">
          <div className="flex items-center mb-3">
            <CheckCircle className="h-6 w-6 mr-2 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Tasks Completed</h3>
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            {formatNumber(stats.tasksCompleted)}
          </div>
          <p className="text-purple-200 text-sm">
            Finished assignments
          </p>
        </div>

        {/* Achievements */}
        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300">
          <div className="flex items-center mb-3">
            <Trophy className="h-6 w-6 mr-2 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Achievements</h3>
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            {formatNumber(stats.achievements)}
          </div>
          <p className="text-yellow-200 text-sm">
            Total earned badges
          </p>
        </div>
      </div>

      {/* Connection Status & Last Updated */}
      <div className="flex items-center justify-between text-sm text-gray-400 mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center space-x-4">
          <span className={`flex items-center ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          
          {stats.lastUpdated && (
            <span className="text-gray-300">
              Last updated: {formatTimestamp(stats.lastUpdated)}
            </span>
          )}
        </div>

        <div className="text-xs text-gray-400">
          Updates every 30 seconds via polling
        </div>
      </div>
    </div>
  );
};

export default RealTimeStatistics; 