import React, { useState } from 'react';
import { login } from '../api';
import { useAuth } from '../contexts/AuthContext';

const TestLogin = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const { user, login: authLogin } = useAuth();

  const testLogin = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const response = await login('admin@fpt.edu.vn', 'admin123');
      console.log('Login response:', response);
      
      if (response.data && response.data.user && response.data.token) {
        authLogin(response.data.user, response.data.token);
        setResult('Login successful! User: ' + response.data.user.name);
      } else {
        setResult('Login failed: Invalid response structure');
      }
    } catch (error) {
      console.error('Login error:', error);
      setResult('Login failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const testAPI = async () => {
    if (!user) {
      setResult('Please login first');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      // Test statistics endpoint
      const statsResponse = await fetch('/api/statistics');
      const statsData = await statsResponse.json();
      console.log('Statistics response:', statsData);

      // Test todo endpoint (should require auth)
      const todoResponse = await fetch('/api/todo', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const todoData = await todoResponse.json();
      console.log('Todo response:', todoData);

      setResult('API test successful! Check console for details.');
    } catch (error) {
      console.error('API test error:', error);
      setResult('API test failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">API Test</h2>
          <p className="text-gray-600 mt-2">Test authentication and API endpoints</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Login'}
          </button>

          <button
            onClick={testAPI}
            disabled={loading || !user}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test API Endpoints'}
          </button>

          {user && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="font-semibold text-green-800">Logged in as:</h3>
              <p className="text-green-700">{user.name || user.email}</p>
            </div>
          )}

          {result && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-semibold text-blue-800">Result:</h3>
              <p className="text-blue-700">{result}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestLogin; 