import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import { Users, Target, TrendingUp, Award, Clock, CheckCircle, Activity } from 'lucide-react';
import * as api from '../api';

const RealTimeStatistics = () => {
  const [stats, setStats] = useState({
    activeStudents: 0,
    studySessions: 0,
    tasksCompleted: 0,
    achievements: 0
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // Fetch statistics via HTTP API
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://ai-learning-backend.loca.lt'}/api/statistics`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data);
          setLastUpdated(new Date());
          console.log('📊 Fetched statistics:', data);
        }
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    console.log('🔗 Initializing WebSocket connection...');
    
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'https://ai-learning-backend.loca.lt', {
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    // Listen for real-time statistics updates from backend
    socket.on('statistics_updated', (data) => {
      console.log('📡 Received real-time statistics:', data);
      if (data.success && data.data) {
        setStats(data.data);
        setLastUpdated(new Date(data.timestamp || new Date()));
      }
    });

    socketRef.current = socket;

    const fetchStats = async () => {
      try {
        const response = await api.getStatistics();
        if (response.success) {
          setStats(response.stats);
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const statsData = [
    { 
      label: 'Active Students', 
      value: stats.activeStudents, 
      icon: '👥'
    },
    { 
      label: 'Study Sessions', 
      value: stats.studySessions, 
      icon: '🏫'
    },
    { 
      label: 'Tasks Completed', 
      value: stats.tasksCompleted, 
      icon: '✅'
    },
    { 
      label: 'Achievements', 
      value: stats.achievements, 
      icon: '🏅'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg p-4 shadow-md text-center">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {isLoading ? '...' : (stat.value?.toLocaleString() || '0')}
            </div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        {lastUpdated && (
          <div className="text-xs text-gray-500 mb-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {isConnected && <span className="ml-2 text-green-600">• Live Updates</span>}
          </div>
        )}
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>
    </div>
  );
};

export default RealTimeStatistics; 