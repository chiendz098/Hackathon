import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import LoadingSpinner, { SkeletonLoader } from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import TodoCreationHub from '../components/todo/TodoCreationHub';
import StatusTodoCard from '../components/todo/StatusTodoCard';
import AssignmentSubmission from '../components/todo/AssignmentSubmission';
import TodoExportImport from '../components/todo/TodoExportImport';
import GroupTodoIntegration from '../components/todo/GroupTodoIntegration';
import TestGroupTodo from '../components/todo/TestGroupTodo';
import SmartAnalyticsDashboard from '../components/todo/SmartAnalyticsDashboard';
import PomodoroTimer from '../components/todo/PomodoroTimer';
import AdvancedGroupTodoSystem from '../components/todo/AdvancedGroupTodoSystem';
import { Plus, Filter, Search, BarChart3, Calendar, Grid, List, CheckCircle, Clock, Edit, AlertCircle, CheckSquare, Square, Timer } from 'lucide-react';
import toast from 'react-hot-toast';

const ToDo = () => {
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [editingTodo, setEditingTodo] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', dueDate: '', priority: 'medium' });
  const [analytics, setAnalytics] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0,
    completionRate: 0
  });
  const [activeTab, setActiveTab] = useState('todos');
  const [selectedTodos, setSelectedTodos] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [activePomodoroTodo, setActivePomodoroTodo] = useState(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    calculateAnalytics();
  }, [todos]);

  // Handle query parameters for automatic tab switching
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const groupIdParam = searchParams.get('groupId');
    
    if (tabParam === 'group-todos') {
      setActiveTab('group-todos');
      
      // If there's a groupId, you can use it to filter or highlight specific group
      if (groupIdParam) {
        console.log('Switching to group todos for group:', groupIdParam);
        // You can add logic here to filter todos for specific group
      }
    }
  }, [searchParams]);

  const fetchTodos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch('/api/todo/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        // Show both personal and group todos in the main todos tab
        setTodos(data.todos || []);
        console.log('📋 Personal todos loaded:', data.personalTodos?.length || 0);
        console.log('📋 Group todos loaded:', data.groupTodos?.length || 0);
        console.log('📋 Total todos loaded:', data.todos?.length || 0);
      } else {
        console.error('Failed to fetch todos:', data.message);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = () => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.status === 'done' || todo.status === 'completed').length;
    const pending = todos.filter(todo => todo.status === 'pending').length;
    const inProgress = todos.filter(todo => todo.status === 'in_progress').length;
    const overdue = todos.filter(todo => {
      if (todo.status === 'done' || todo.status === 'completed' || todo.status === 'cancelled') return false;
      return todo.deadline && new Date(todo.deadline) < new Date();
    }).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

          setAnalytics({
        total,
        completed,
        pending,
      inProgress,
      overdue,
        completionRate
      });
  };

  const handleTodoCreated = (newTodo) => {
    setTodos([newTodo, ...todos]);
    setShowCreateModal(false);
  };

  const handleTodoUpdate = (updatedTodo) => {
    setTodos(todos.map(todo =>
      todo.id === updatedTodo.id ? updatedTodo : todo
    ));
  };

  const handleTodoEdit = (todo) => {
    setEditingTodo(todo);
    setEditForm({
      title: todo.title,
      description: todo.description || '',
      dueDate: todo.dueDate ? todo.dueDate.split('T')[0] : '',
      priority: todo.priority || 'medium'
    });
  };

  const handleUpdateTodo = async (e) => {
    e.preventDefault();
    if (!editingTodo) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`/api/todo/${editingTodo.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        toast.success('Todo updated successfully!');
        setEditingTodo(null);
        setEditForm({ title: '', description: '', dueDate: '', priority: 'medium' });
        fetchTodos();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update todo');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      toast.error('Failed to update todo');
    }
  };

  const deleteTodo = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`/api/todo/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setTodos(todos.filter(todo => todo.id !== id));
        toast.success('Todo deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete todo');
    }
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedTodos.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const promises = selectedTodos.map(id => {
        const url = bulkAction === 'delete' 
          ? `/api/todo/${id}`
          : `/api/todo/${id}`;
        
        const method = bulkAction === 'delete' ? 'DELETE' : 'PUT';
        const body = bulkAction === 'delete' ? null : JSON.stringify({ status: bulkAction });

        return fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          ...(body && { body })
        });
      });

      await Promise.all(promises);
      
      // Refresh todos
      fetchTodos();
      setSelectedTodos([]);
      setBulkAction('');
      
      const actionText = bulkAction === 'delete' ? 'deleted' : `marked as ${bulkAction}`;
      toast.success(`${selectedTodos.length} todos ${actionText} successfully!`);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const toggleTodoSelection = (id) => {
    setSelectedTodos(prev => 
      prev.includes(id) 
        ? prev.filter(todoId => todoId !== id)
        : [...prev, id]
    );
  };

  const selectAllTodos = () => {
    if (selectedTodos.length === filteredTodos.length) {
      setSelectedTodos([]);
    } else {
      setSelectedTodos(filteredTodos.map(todo => todo.id));
    }
  };

  const handleImportTodos = async (importData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const promises = importData.map(todoData => 
        fetch('/api/todo/all', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(todoData)
        })
      );

      await Promise.all(promises);
      fetchTodos();
      toast.success(`${importData.length} todos imported successfully!`);
    } catch (error) {
      console.error('Error importing todos:', error);
      toast.error('Failed to import todos');
    }
  };

  const filteredTodos = todos.filter(todo => {
    const matchesFilter = filter === 'all' ||
      (filter === 'pending' && todo.status === 'pending') ||
      (filter === 'in_progress' && todo.status === 'in_progress') ||
      (filter === 'done' && todo.status === 'done') ||
      (filter === 'completed' && todo.status === 'completed') ||
      (filter === 'cancelled' && todo.status === 'cancelled') ||
      (filter === 'overdue' && todo.deadline && new Date(todo.deadline) < new Date() && 
       todo.status !== 'done' && todo.status !== 'completed' && todo.status !== 'cancelled');

    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (todo.category && todo.category.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const typeIcons = {
    personal: '👤',
    group: '👥',
    assignment: '📚'
  };

  const handleStartPomodoro = (todo) => {
    setActivePomodoroTodo(todo);
    setShowPomodoro(true);
  };

  const handlePomodoroComplete = async (sessionData) => {
    try {
      // Update todo with pomodoro session data
      if (activePomodoroTodo) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/todo/${activePomodoroTodo.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pomodoro_sessions: [
              ...(activePomodoroTodo.pomodoro_sessions || []),
              sessionData
            ],
            total_pomodoro_time: (activePomodoroTodo.total_pomodoro_time || 0) + sessionData.duration
          })
        });

        if (response.ok) {
          // Refresh todos to show updated data
          fetchTodos();
          toast.success('Pomodoro session completed!');
        }
      }
      
      setShowPomodoro(false);
      setActivePomodoroTodo(null);
    } catch (error) {
      console.error('Error updating pomodoro session:', error);
      toast.error('Failed to update pomodoro session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <LoadingSpinner type="ring" size="xlarge" text="Loading Todos..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      currentTheme === 'neon'
        ? 'bg-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Header */}
      <div className={`${
        currentTheme === 'neon' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-b sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                Todo Management
              </h1>
              <p className={`text-sm ${
                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Manage your tasks with enhanced status tracking
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Tab Navigation */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('todos')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'todos' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  My Todos
                </button>
                <button
                  onClick={() => setActiveTab('group-todos')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'group-todos' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Group Todos
                </button>
                <button
                  onClick={() => setActiveTab('smart-analytics')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'smart-analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Smart Analytics
                </button>
                {user?.role === 'student' && (
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'assignments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Assignments
                  </button>
                )}
              </div>

              {activeTab === 'todos' && (
                <div className="flex items-center space-x-4">
                  <TodoExportImport todos={todos} onImport={handleImportTodos} />
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      currentTheme === 'neon'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Task</span>
                  </button>
                  
                  <button
                    onClick={() => setShowPomodoro(true)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      currentTheme === 'neon'
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/50'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    <Timer className="w-5 h-5" />
                    <span>Pomodoro Timer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'todos' ? (
          <>
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <motion.div
                className={`p-4 rounded-lg ${
                  currentTheme === 'neon' ? 'bg-gray-800' : 'bg-white'
                } shadow-sm`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Total Tasks
                    </p>
                    <p className={`text-2xl font-bold ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {analytics.total}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className={`p-4 rounded-lg ${
                  currentTheme === 'neon' ? 'bg-gray-800' : 'bg-white'
                } shadow-sm`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Completed
                    </p>
                    <p className={`text-2xl font-bold ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {analytics.completed}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className={`p-4 rounded-lg ${
                  currentTheme === 'neon' ? 'bg-gray-800' : 'bg-white'
                } shadow-sm`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      In Progress
                    </p>
                    <p className={`text-2xl font-bold ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {analytics.inProgress}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className={`p-4 rounded-lg ${
                  currentTheme === 'neon' ? 'bg-gray-800' : 'bg-white'
                } shadow-sm`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Overdue
                    </p>
                    <p className={`text-2xl font-bold ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {analytics.overdue}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className={`p-4 rounded-lg ${
                  currentTheme === 'neon' ? 'bg-gray-800' : 'bg-white'
                } shadow-sm`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Completion Rate
                    </p>
                    <p className={`text-2xl font-bold ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {analytics.completionRate}%
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-col gap-4 mb-6">
              {/* Bulk Actions */}
              {selectedTodos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg ${
                    currentTheme === 'neon' ? 'bg-gray-800 border border-gray-700' : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className={`font-medium ${
                        currentTheme === 'neon' ? 'text-white' : 'text-blue-900'
                      }`}>
                        {selectedTodos.length} todo(s) selected
                      </span>
                      <select
                        value={bulkAction}
                        onChange={(e) => setBulkAction(e.target.value)}
                        className={`px-3 py-1 rounded border text-sm ${
                          currentTheme === 'neon'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">Select action...</option>
                        <option value="done">Mark as Done</option>
                        <option value="pending">Mark as Pending</option>
                        <option value="in_progress">Mark as In Progress</option>
                        <option value="cancelled">Mark as Cancelled</option>
                        <option value="delete">Delete</option>
                      </select>
                      <button
                        onClick={handleBulkAction}
                        disabled={!bulkAction}
                        className={`px-4 py-1 rounded text-sm font-medium ${
                          bulkAction
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Apply
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedTodos([])}
                      className={`text-sm ${
                        currentTheme === 'neon' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Clear selection
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg border ${
                      currentTheme === 'neon'
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${
                    currentTheme === 'neon'
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="all">All Tasks</option>
                  <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                    <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                    <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                </div>
              </div>
            </div>
            {/* Todo List */}
            <div className={`${
              viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'
            }`}>
              {/* Select All Checkbox */}
              {filteredTodos.length > 0 && (
                <div className="flex items-center space-x-2 mb-4">
                  <button
                    onClick={selectAllTodos}
                    className={`p-2 rounded ${
                      selectedTodos.length === filteredTodos.length 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {selectedTodos.length === filteredTodos.length ? 
                      <CheckSquare className="w-4 h-4" /> : 
                      <Square className="w-4 h-4" />
                    }
                  </button>
                  <span className={`text-sm ${
                    currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {selectedTodos.length === filteredTodos.length ? 'Deselect all' : 'Select all'}
                  </span>
                </div>
              )}

              <AnimatePresence>
                {filteredTodos.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`col-span-full text-center py-12 ${
                      currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
                    <p>Create your first task to get started!</p>
                  </motion.div>
                ) : (
                  filteredTodos.map((todo) => (
                    <StatusTodoCard
                      key={todo.id}
                      todo={todo}
                      onUpdate={handleTodoUpdate}
                      onDelete={deleteTodo}
                      onEdit={handleTodoEdit}
                      isSelected={selectedTodos.includes(todo.id)}
                      onToggleSelection={toggleTodoSelection}
                      onStartPomodoro={handleStartPomodoro}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </>
        ) : activeTab === 'group-todos' ? (
          <AdvancedGroupTodoSystem />
        ) : activeTab === 'smart-analytics' ? (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Analytics</h2>
              <p className="text-gray-600">AI-powered insights and recommendations for better productivity</p>
            </div>
            <SmartAnalyticsDashboard />
          </div>
        ) : (
          <AssignmentSubmission />
        )}
      </div>

      {/* Create Todo Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <TodoCreationHub
            isOpen={showCreateModal}
            onTodoCreated={handleTodoCreated}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Edit Todo Modal */}
      {editingTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-bold mb-4">Edit Todo</h3>
            <form onSubmit={handleUpdateTodo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Todo
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTodo(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Pomodoro Timer Modal */}
      <AnimatePresence>
        {showPomodoro && activePomodoroTodo && (
          <PomodoroTimer
            isOpen={showPomodoro}
            onClose={() => setShowPomodoro(false)}
            onComplete={handlePomodoroComplete}
            todo={activePomodoroTodo}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
export default ToDo;