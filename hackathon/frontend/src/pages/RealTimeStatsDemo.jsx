import React from 'react';
import RealTimeStatistics from '../components/RealTimeStatistics';

const RealTimeStatsDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📊 Real-Time Statistics Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch the platform statistics update in real-time without refreshing the page. 
            Data is automatically synchronized every 30 seconds via WebSocket connection.
          </p>
        </div>

        {/* Real-time Statistics Component */}
        <div className="mb-12">
          <RealTimeStatistics />
        </div>

        {/* Features Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-3xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">WebSocket Connection</h3>
            <p className="text-gray-600">
              Establishes a persistent connection to receive real-time updates from the server.
              Automatically reconnects if the connection is lost.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto-Update</h3>
            <p className="text-gray-600">
              Statistics are automatically updated every 30 seconds from the database.
              Only broadcasts changes when data actually differs from the previous state.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-3xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Fallback Support</h3>
            <p className="text-gray-600">
              If WebSocket fails, automatically falls back to HTTP API calls.
              Ensures statistics are always displayed even in offline scenarios.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Responsive Design</h3>
            <p className="text-gray-600">
              Beautiful, responsive interface that works on all devices.
              Smooth animations and hover effects for better user experience.
            </p>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🛠️ Technical Implementation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Backend (Node.js + Socket.IO)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• StatisticsBroadcaster service</li>
                <li>• Database queries with fallback handling</li>
                <li>• Change detection to avoid unnecessary broadcasts</li>
                <li>• Configurable update intervals</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Frontend (React + Socket.IO Client)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time WebSocket connection</li>
                <li>• Automatic reconnection handling</li>
                <li>• HTTP fallback for initial data</li>
                <li>• Connection status indicators</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="bg-white rounded-xl p-6 shadow-lg mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Data Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">👥</div>
              <h4 className="font-medium text-gray-900">Active Students</h4>
              <p className="text-sm text-gray-600">Users with role 'student' and isactive=true</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">🏫</div>
              <h4 className="font-medium text-gray-900">Study Sessions</h4>
              <p className="text-sm text-gray-600">Active classrooms from classrooms table</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">✅</div>
              <h4 className="font-medium text-gray-900">Tasks Completed</h4>
              <p className="text-sm text-gray-600">Todos with status 'completed' or 'done'</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl mb-2">🏅</div>
              <h4 className="font-medium text-gray-900">Achievements</h4>
              <p className="text-sm text-gray-600">Total achievements unlocked by all users</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeStatsDemo; 