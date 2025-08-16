import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import NotionStyleTodoDetail from '../components/todo/NotionStyleTodoDetail';

const TodoDetailPage = () => {
  const { groupId, todoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const api = useApi();
  
  const [todo, setTodo] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (groupId && todoId) {
      fetchTodoData();
      fetchGroupData();
      fetchMembers();
    }
  }, [groupId, todoId]);

  const fetchTodoData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/todos/${todoId}`);
      if (response.success) {
        setTodo(response.todo);
      }
    } catch (error) {
      console.error('Error fetching todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupData = async () => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      if (response.success) {
        setGroup(response.group);
      }
    } catch (error) {
      console.error('Error fetching group:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/groups/${groupId}/members`);
      if (response.success) {
        setMembers(response.members);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleUpdate = async (todoId, updates) => {
    try {
      const response = await api.put(`/todos/${todoId}`, updates);
      if (response.success) {
        setTodo(prev => ({ ...prev, ...updates }));
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDelete = async (todoId) => {
    try {
      const response = await api.delete(`/todos/${todoId}`);
      if (response.success) {
        navigate(`/groups/${groupId}/todos`);
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleClose = () => {
    navigate(`/groups/${groupId}/todos`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!todo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Todo not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The todo you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate(`/groups/${groupId}/todos`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Group
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{group?.name?.charAt(0) || 'G'}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {group?.name || 'Group'} • {todo.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Todo Details
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? '🌞' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <NotionStyleTodoDetail
            todo={todo}
            onClose={handleClose}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            members={members}
            darkMode={darkMode}
            fullPage={true}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default TodoDetailPage; 