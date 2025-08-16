import React, { useState, useEffect } from 'react';
import { 
  useTodos, 
  useTodoActions, 
  useGamificationApi, 
  useAI, 

  useNotifications,
  useProfile,
  useApiCall
} from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../api';

const ApiUsageExample = () => {
  const [activeTab, setActiveTab] = useState('todos');
  const [formData, setFormData] = useState({});

  // ===== HOOKS USAGE =====
  const { user, loading: authLoading, login, register } = useAuth();
  const { data: todos, loading: todosLoading, refetch: refetchTodos } = useTodos();
  const { addTodo, updateTodo, deleteTodo, completeTodo, loading: todoActionsLoading } = useTodoActions();
  const { progress, achievements, leaderboard, awardXP, spinDailyWheel, loading: gamificationLoading } = useGamificationApi();
  const { askGemini, generateEnhancedTodos, generateLearningPlan, loading: aiLoading } = useAI();

  const { notifications, markRead, loading: notificationsLoading } = useNotifications();
  const { profile, updateProfile, loading: profileLoading } = useProfile();

  // ===== DIRECT API CALLS =====
  const handleDirectApiCall = async () => {
    try {
      // Example of direct API call with error handling
      const result = await api.getStatistics();
      console.log('Statistics:', result);
    } catch (error) {
      const errorData = api.handleApiError(error);
      console.error('API Error:', errorData);
    }
  };

  // ===== TODO EXAMPLES =====
  const handleAddTodo = async () => {
    try {
      const newTodo = {
        title: 'New Todo from API',
        description: 'Created using API functions',
        priority: 'medium',
        deadline: new Date().toISOString(),
        category: 'study'
      };

      await addTodo(newTodo);
      refetchTodos(); // Refresh the todos list
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const handleCompleteTodo = async (todoId) => {
    try {
      await completeTodo(todoId, {
        completionTime: new Date().toISOString(),
        notes: 'Completed via API'
      });
      refetchTodos();
    } catch (error) {
      console.error('Error completing todo:', error);
    }
  };

  // ===== GAMIFICATION EXAMPLES =====
  const handleAwardXP = async () => {
    try {
      await awardXP(50, 'manual_award', null);
      console.log('XP awarded successfully');
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  };

  const handleSpinWheel = async () => {
    try {
      const result = await spinDailyWheel();
      console.log('Spin result:', result);
    } catch (error) {
      console.error('Error spinning wheel:', error);
    }
  };

  // ===== AI EXAMPLES =====
  const handleAskAI = async () => {
    try {
      const response = await askGemini('What is the best way to study for exams?');
      console.log('AI Response:', response);
    } catch (error) {
      console.error('Error asking AI:', error);
    }
  };

  const handleGenerateTodos = async () => {
    try {
      const result = await generateEnhancedTodos(
        'Study for math exam next week',
        { subject: 'math', timeframe: '1 week' }
      );
      console.log('Generated todos:', result);
    } catch (error) {
      console.error('Error generating todos:', error);
    }
  };

  const handleGenerateLearningPlan = async () => {
    try {
      const plan = await generateLearningPlan(
        'Learn React in 2 weeks',
        '2 weeks',
        'beginner',
        { preferredTime: 'morning', studyHours: 2 }
      );
      console.log('Learning plan:', plan);
    } catch (error) {
      console.error('Error generating learning plan:', error);
    }
  };



  // ===== NOTIFICATIONS EXAMPLES =====
  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await markRead(notificationId);
      console.log('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  // ===== PROFILE EXAMPLES =====
  const handleUpdateProfile = async () => {
    try {
      const updatedData = {
        name: 'Updated Name',
        bio: 'Updated bio from API',
        preferences: {
          theme: 'dark',
          notifications: true
        }
      };

      await updateProfile(updatedData);
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // ===== FILE UPLOAD EXAMPLE =====
  const handleFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await api.uploadFile(formData);
      console.log('File uploaded:', result);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // ===== WEBSOCKET EXAMPLE =====
  const handleWebSocketConnection = () => {
    const wsUrl = api.getWebSocketUrl();
    console.log('WebSocket URL:', wsUrl);
    
    // This would be used in a real component with the useWebSocket hook
    // const { socket, isConnected, sendMessage } = useWebSocket(wsUrl);
  };

  // ===== BULK OPERATIONS EXAMPLE =====
  const handleBulkCompleteTodos = async (todoIds) => {
    try {
      await api.bulkUpdateTodos('complete', todoIds, {
        completionTime: new Date().toISOString()
      });
      refetchTodos();
      console.log('Bulk completion successful');
    } catch (error) {
      console.error('Error bulk completing todos:', error);
    }
  };

  // ===== CACHE EXAMPLE =====
  const handleCacheExample = () => {
    // Example of using cache helpers
    const cacheKey = 'user_preferences';
    const cacheData = { theme: 'dark', language: 'en' };
    
    // Store in cache
    localStorage.setItem(`cache_${cacheKey}`, JSON.stringify({
      data: cacheData,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5 minutes
    }));
    
    // Retrieve from cache
    const cached = localStorage.getItem(`cache_${cacheKey}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log('Cached data:', parsed.data);
    }
  };

  // ===== ERROR HANDLING EXAMPLES =====
  const handleErrorExample = async () => {
    try {
      // This will fail intentionally
      await api.getTodos({ invalidParam: 'test' });
    } catch (error) {
      const errorData = api.handleApiError(error);
      console.log('Handled error:', errorData);
      
      // Create custom error response
      const customError = api.createErrorResponse('Custom error message', 400);
      console.log('Custom error:', customError);
    }
  };

  // ===== RESPONSE HELPERS EXAMPLE =====
  const handleResponseHelpers = () => {
    // Create success response
    const successResponse = api.createSuccessResponse(
      { message: 'Operation successful' },
      'Data saved successfully'
    );
    console.log('Success response:', successResponse);
    
    // Create error response
    const errorResponse = api.createErrorResponse('Something went wrong', 500);
    console.log('Error response:', errorResponse);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">API Usage Examples</h1>
      
      {/* Loading States */}
      {(authLoading || todosLoading || gamificationLoading || aiLoading) && (
        <div className="bg-blue-100 p-4 rounded-lg mb-4">
          <p className="text-blue-800">Loading data...</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        {['todos', 'gamification', 'ai', 'notifications', 'profile', 'examples'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg ${
              activeTab === tab 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {activeTab === 'todos' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Todo Management</h2>
            <div className="space-y-4">
              <button
                onClick={handleAddTodo}
                disabled={todoActionsLoading}
                className="bg-green-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {todoActionsLoading ? 'Adding...' : 'Add Sample Todo'}
              </button>
              
              {todos && todos.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Current Todos:</h3>
                  {todos.map(todo => (
                    <div key={todo.id} className="border p-3 rounded-lg">
                      <h4 className="font-medium">{todo.title}</h4>
                      <p className="text-gray-600">{todo.description}</p>
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => handleCompleteTodo(todo.id)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'gamification' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Gamification</h2>
            <div className="space-y-4">
              <button
                onClick={handleAwardXP}
                disabled={gamificationLoading}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Award 50 XP
              </button>
              
              <button
                onClick={handleSpinWheel}
                disabled={gamificationLoading}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Spin Daily Wheel
              </button>
              
              {progress && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium">User Progress:</h3>
                  <p>Level: {progress.currentLevel}</p>
                  <p>XP: {progress.totalXP}</p>
                  <p>Coins: {progress.coins}</p>
                  <p>Gems: {progress.gems}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">AI Features</h2>
            <div className="space-y-4">
              <button
                onClick={handleAskAI}
                disabled={aiLoading}
                className="bg-indigo-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Ask AI Question
              </button>
              
              <button
                onClick={handleGenerateTodos}
                disabled={aiLoading}
                className="bg-green-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Generate Enhanced Todos
              </button>
              
              <button
                onClick={handleGenerateLearningPlan}
                disabled={aiLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Generate Learning Plan
              </button>
            </div>
          </div>
        )}



        {activeTab === 'notifications' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
            <div className="space-y-4">
              {notifications && notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.map(notification => (
                    <div key={notification.id} className="border p-3 rounded-lg">
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-gray-600">{notification.message}</p>
                      <button
                        onClick={() => handleMarkNotificationRead(notification.id)}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-sm mt-2"
                      >
                        Mark Read
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No notifications</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Profile Management</h2>
            <div className="space-y-4">
              <button
                onClick={handleUpdateProfile}
                disabled={profileLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Update Profile
              </button>
              
              {profile && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium">Current Profile:</h3>
                  <p>Name: {profile.name}</p>
                  <p>Email: {profile.email}</p>
                  <p>Bio: {profile.bio || 'No bio'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'examples' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Advanced Examples</h2>
            <div className="space-y-4">
              <button
                onClick={handleDirectApiCall}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Direct API Call
              </button>
              
              <button
                onClick={handleErrorExample}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Error Handling Example
              </button>
              
              <button
                onClick={handleResponseHelpers}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg"
              >
                Response Helpers
              </button>
              
              <button
                onClick={handleWebSocketConnection}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg"
              >
                WebSocket Connection
              </button>
              
              <button
                onClick={handleCacheExample}
                className="bg-teal-500 text-white px-4 py-2 rounded-lg"
              >
                Cache Example
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Console Output */}
      <div className="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Console Output:</h3>
        <p className="text-sm">Check browser console for API responses and errors</p>
      </div>
    </div>
  );
};

export default ApiUsageExample; 