import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, CheckCircle, Clock, AlertCircle, Edit, Trash2, MessageCircle, FileText } from 'lucide-react';
import * as api from '../../api';

const TodoTestComponent = ({ groupId }) => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Test fetch todos
  const testFetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🧪 Testing fetch todos for groupId:', groupId);
      console.log('🧪 Token exists:', !!localStorage.getItem('token'));
      
      const response = await api.fetchGroupTodos(groupId);
      console.log('🧪 Fetch response:', response);
      
      if (response && response.success) {
        setTodos(response.todos || []);
        console.log('🧪 Todos set successfully:', response.todos);
      } else {
        setError('Failed to fetch todos');
        console.error('🧪 Failed to fetch todos:', response);
      }
    } catch (err) {
      setError(err.message);
      console.error('🧪 Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Test create todo
  const testCreateTodo = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🧪 Testing create todo for groupId:', groupId);
      
      const todoData = {
        title: 'Test Todo ' + new Date().toLocaleTimeString(),
        description: 'This is a test todo',
        category: 'study',
        priority: 'medium',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: 60,
        assignedMembers: []
      };
      
      console.log('🧪 Todo data:', todoData);
      
      const response = await api.createGroupTodo(groupId, todoData);
      console.log('🧪 Create response:', response);
      
      if (response && response.success) {
        console.log('🧪 Todo created successfully');
        // Refresh todos
        await testFetchTodos();
      } else {
        setError('Failed to create todo');
        console.error('🧪 Failed to create todo:', response);
      }
    } catch (err) {
      setError(err.message);
      console.error('🧪 Error creating todo:', err);
    } finally {
      setLoading(false);
    }
  };

  // Test direct fetch without useApi
  const testDirectFetch = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🧪 Testing direct fetch');
      
      const token = localStorage.getItem('token');
      console.log('🧪 Token:', token ? 'exists' : 'missing');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://ai-learning-backend.loca.lt'}/api/groupTodo/groups/${groupId}/todos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('🧪 Direct fetch response:', data);
      
      if (data.success) {
        setTodos(data.todos || []);
      } else {
        setError(data.message || 'Failed to fetch');
      }
    } catch (err) {
      setError(err.message);
      console.error('🧪 Direct fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      testFetchTodos();
    }
  }, [groupId]);

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-bold mb-4">🧪 Todo Test Component</h3>
      
      <div className="space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={testFetchTodos}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Fetch Todos'}
          </button>
          
          <button
            onClick={testCreateTodo}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Create Todo'}
          </button>
          
          <button
            onClick={testDirectFetch}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Direct Fetch'}
          </button>
        </div>
        
        {error && (
          <div className="text-red-600 bg-red-100 p-2 rounded">
            Error: {error}
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <div>Group ID: {groupId}</div>
          <div>Token exists: {localStorage.getItem('token') ? 'Yes' : 'No'}</div>
          <div>Todos count: {todos.length}</div>
        </div>
        
        {todos.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Todos:</h4>
            {todos.map(todo => (
              <div key={todo.id} className="p-2 bg-white border rounded">
                <div className="font-medium">{todo.title}</div>
                <div className="text-sm text-gray-600">{todo.description}</div>
                <div className="text-xs text-gray-500">
                  Status: {todo.status}, Priority: {todo.priority}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoTestComponent; 