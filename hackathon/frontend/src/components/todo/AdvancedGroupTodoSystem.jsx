import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Search, Filter, CheckCircle, Clock, AlertCircle,
  UserPlus, Bell, CheckSquare, X, Edit, Trash2, MoreVertical,
  MessageCircle, FileText, Calendar, Target, BarChart3, Grid,
  List, Kanban, GitBranch, Zap, Shield, Crown, Star, Eye,
  EyeOff, Download, Upload, Settings, RefreshCw, TrendingUp
} from 'lucide-react';
import { io } from 'socket.io-client';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import TodoAssignmentManager from './TodoAssignmentManager';
import AssignmentDemo from './AssignmentDemo';
import ProfessionalTaskManager from './ProfessionalTaskManager';
import CreateTaskModal from './CreateTaskModal';

const AdvancedGroupTodoSystem = () => {
  const { get, post, put, delete: del } = useApi();
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupTodos, setGroupTodos] = useState([]);
  
  // Debug logging for groupTodos state changes
  useEffect(() => {
    console.log('🔄 GroupTodos state changed:', groupTodos.length, 'todos');
    if (groupTodos.length > 0) {
      console.log('📋 First todo:', groupTodos[0]);
    }
  }, [groupTodos]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // kanban, list, calendar, analytics
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateTodo, setShowCreateTodo] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [showAssignmentManager, setShowAssignmentManager] = useState(false);
  const [selectedTodoForAssignment, setSelectedTodoForAssignment] = useState(null);
  const [showAssignmentDemo, setShowAssignmentDemo] = useState(false);
  const [showProfessionalView, setShowProfessionalView] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [kanbanColumns, setKanbanColumns] = useState([]);
  const [dragDropData, setDragDropData] = useState(null);
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [justJoinedGroup, setJustJoinedGroup] = useState(null);

  const socketRef = useRef();
  const typingTimeoutRef = useRef();
  const emailDropdownRef = useRef();

  useEffect(() => {
    loadData();
    
    // Delay socket setup to ensure server is ready
    const socketTimer = setTimeout(() => {
      setupSocket();
    }, 1000);
    
    return () => {
      clearTimeout(socketTimer);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Handle click outside email dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emailDropdownRef.current && !emailDropdownRef.current.contains(event.target)) {
        setShowEmailSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-clear welcome message after 15 seconds
  useEffect(() => {
    if (justJoinedGroup) {
      const timer = setTimeout(() => {
        setJustJoinedGroup(null);
      }, 15000);
      
      return () => clearTimeout(timer);
    }
  }, [justJoinedGroup]);

  // Auto-refresh data when justJoinedGroup changes
  useEffect(() => {
    if (justJoinedGroup && selectedGroup) {
      // Refresh todos to ensure we have the latest data
      handleGroupSelect(selectedGroup);
    }
  }, [justJoinedGroup, selectedGroup]);

  // Add keyboard shortcuts for better UX
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            if (selectedGroup) {
              setShowCreateTodo(true);
            }
            break;
          case 'g':
            e.preventDefault();
            setShowCreateGroup(true);
            break;
          case '1':
            e.preventDefault();
            setViewMode('kanban');
            break;
          case '2':
            e.preventDefault();
            setViewMode('list');
            break;
          case '3':
            e.preventDefault();
            setViewMode('calendar');
            break;
          case '4':
            e.preventDefault();
            setViewMode('analytics');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedGroup]);

  const setupSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'https://ai-learning-backend.loca.lt', {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to GroupTodo socket');
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔌 WebSocket reconnected after', attemptNumber, 'attempts');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('🔌 WebSocket reconnection error:', error);
    });

    newSocket.on('new-chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    newSocket.on('user-typing', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      } else {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    });

    newSocket.on('todo-created', (data) => {
      console.log('🆕 New todo created:', data);
      if (selectedGroup && data.groupId === selectedGroup.id) {
        // Refresh todos for the current group
        handleGroupSelect(selectedGroup);
        toast.success('🆕 New task created!', {
          duration: 3000,
          icon: '🆕'
        });
      }
    });

    newSocket.on('todo-updated', (data) => {
      setGroupTodos(prev => prev.map(todo => 
        todo.id === data.todoId 
          ? { ...todo, ...data.updates, updated_at: data.timestamp }
          : todo
      ));
      toast.success('Todo updated in real-time!');
    });

    newSocket.on('todoCompleted', (data) => {
      console.log('🎉 Todo completed:', data);
      setGroupTodos(prev => prev.map(todo => 
        todo.id === data.todoId ? { ...todo, status: 'completed' } : todo
      ));
      
      toast.success('🎉 Todo completed by all team members!', {
        duration: 5000,
        icon: '🎉'
      });
    });

    newSocket.on('todo-status-changed', (data) => {
      setGroupTodos(prev => prev.map(todo => 
        todo.id === data.todoId 
          ? { ...todo, status: data.newStatus, updated_at: data.timestamp }
          : todo
      ));
      toast.success(`Todo status changed to ${data.newStatus}!`);
    });

    newSocket.on('file-uploaded', (data) => {
      toast.success(`File uploaded: ${data.fileName}`);
    });

    newSocket.on('notification', (notification) => {
      toast(notification.message, {
        icon: notification.type === 'mention' ? '@' : '🔔',
        duration: 4000
      });
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  // Cleanup socket listeners on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.off('todoCompleted');
        socketRef.current.off('todo-updated');
        socketRef.current.off('todo-status-changed');
        socketRef.current.off('new-chat-message');
        socketRef.current.off('user-typing');
        socketRef.current.off('file-uploaded');
        socketRef.current.off('notification');
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user's groups with stats
      try {
        const groupsResponse = await get('/advanced-group-system/groups?includeStats=true');
        if (groupsResponse?.success) {
          setGroups(groupsResponse.groups);
        }
      } catch (error) {
        console.warn('Failed to load groups:', error);
      }
      
      // Load pending invitations
      try {
        const invitationsResponse = await get('/advanced-group-system/invitations/pending');
        if (invitationsResponse?.success) {
          setPendingInvitations(invitationsResponse.invitations);
        }
      } catch (error) {
        console.warn('Failed to load invitations:', error);
        // Set empty array to avoid undefined errors
        setPendingInvitations([]);
      }
      
      // Load notifications
      try {
        const notificationsResponse = await get('/advanced-group-system/notifications?unreadOnly=true');
        if (notificationsResponse?.success) {
          setNotifications(notificationsResponse.notifications);
        }
      } catch (error) {
        console.warn('Failed to load notifications:', error);
        // Set empty array to avoid undefined errors
        setNotifications([]);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load some data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = async (group) => {
    setSelectedGroup(group);
    
    // Join group socket room for real-time updates
    if (socketRef.current) {
      socketRef.current.emit('joinGroup', { groupId: group.id });
      console.log('🔌 Joined group socket room:', group.id);
    }
    
    try {
      console.log('🔄 Loading todos for group:', group.id);
      // Remove view parameter to get all todos
      const response = await get(`/advanced-group-system/groups/${group.id}/todos`);
      console.log('📊 Raw API response:', response);
      
      if (response?.success) {
        console.log('📊 Raw todos from API:', response.todos);
        // Ensure todos have proper structure
        const processedTodos = response.todos.map(todo => ({
          ...todo,
          assignments: todo.assignments || [],
          attachments: todo.attachments || [],
          message_count: todo.message_count || 0,
          file_count: todo.file_count || 0,
          creator: todo.creator || { name: 'Unknown' },
          assignedTo: todo.assignedTo || null,
          kanban_column: todo.kanban_column || 'todo',
          status: todo.status || 'pending',
          priority: todo.priority || 'medium'
        }));
        
        console.log('✅ Processed todos:', processedTodos);
        console.log('📊 GroupTodos state will be updated with', processedTodos.length, 'todos');
        setGroupTodos(processedTodos);
        
        // Setup kanban columns
        setupKanbanColumns(group.id, processedTodos);
      } else {
        console.error('❌ API response not successful:', response);
        setGroupTodos([]);
      }
    } catch (error) {
      console.error('Error loading group todos:', error);
      toast.error('Failed to load group todos');
      setGroupTodos([]);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone and will delete all todos, members, and data associated with this group.')) {
      return;
    }

    try {
      const result = await del(`/advanced-group-system/groups/${groupId}`);
      if (result?.success) {
        toast.success(result.message || 'Group deleted successfully');
        
        // Clear selected group if it was the deleted one
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null);
          setGroupTodos([]);
          setKanbanColumns([]);
        }
        
        // Remove from groups list
        setGroups(prev => prev.filter(g => g.id !== groupId));
        
        // Refresh data
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const setupKanbanColumns = (groupId, todos) => {
    const defaultColumns = [
      { id: 'backlog', name: 'Backlog', color: '#6B7280', todos: [] },
      { id: 'todo', name: 'To Do', color: '#3B82F6', todos: [] },
      { id: 'in_progress', name: 'In Progress', color: '#F59E0B', todos: [] },
      { id: 'review', name: 'Review', color: '#8B5CF6', todos: [] },
      { id: 'completed', name: 'Completed', color: '#10B981', todos: [] }
    ];

    // Ensure todos have proper structure and filter by kanban column
    const processedTodos = todos.map(todo => ({
      ...todo,
      kanban_column: todo.kanban_column || 'todo',
      status: todo.status || 'pending',
      priority: todo.priority || 'medium',
      assignments: todo.assignments || [],
      attachments: todo.attachments || []
    }));

    // Map status to kanban columns if needed
    const statusToKanbanMap = {
      'done': 'completed',
      'pending': 'todo',
      'overdue': 'review',
      'cancelled': 'backlog'
    };

    // Group todos by kanban column, with fallback to status-based mapping
    const columnsWithTodos = defaultColumns.map(col => ({
      ...col,
      todos: processedTodos.filter(todo => {
        // First try to use kanban_column, then fallback to status mapping
        if (todo.kanban_column === col.id) return true;
        
        // Fallback mapping based on status
        if (col.id === 'completed' && (todo.status === 'done' || todo.status === 'completed')) return true;
        if (col.id === 'todo' && (todo.status === 'pending' || todo.status === 'todo')) return true;
        if (col.id === 'in_progress' && (todo.status === 'in_progress' || todo.status === 'working')) return true;
        if (col.id === 'review' && (todo.status === 'overdue' || todo.status === 'review')) return true;
        if (col.id === 'backlog' && (todo.status === 'cancelled' || todo.status === 'backlog')) return true;
        
        // Default: put in 'todo' column if no match
        if (col.id === 'todo' && !todo.kanban_column) return true;
        
        return false;
      })
    }));
    
    console.log('🎯 Kanban columns with todos:', columnsWithTodos.map(col => ({
      column: col.id,
      todoCount: col.todos.length,
      todos: col.todos.map(t => ({ id: t.id, title: t.title, kanban_column: t.kanban_column, status: t.status }))
    })));

    setKanbanColumns(columnsWithTodos);
  };

  const handleInvitationResponse = async (invitationId, response) => {
    try {
      const result = await post(`/advanced-group-system/invitations/${invitationId}/respond`, { response });
      if (result?.success) {
        setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        
        if (response === 'accept') {
          // Load updated data
          await loadData();
          
          // Emit event for other components to refresh
          window.dispatchEvent(new CustomEvent('invitationAccepted', {
            detail: { groupId: result.group?.id }
          }));
          
          // If we have group and todos data from the response, set them directly
          if (result.group && result.todos) {
            // Ensure todos have proper structure
            const processedTodos = result.todos.map(todo => ({
              ...todo,
              assignments: todo.assignments || [],
              attachments: todo.attachments || [],
              message_count: todo.message_count || 0,
              file_count: todo.file_count || 0,
              creator: { name: todo.creator_name || 'Unknown' },
              assignedTo: todo.assignedTo || null,
              kanban_column: todo.kanban_column || 'todo',
              status: todo.status || 'pending',
              priority: todo.priority || 'medium'
            }));
            
            setSelectedGroup(result.group);
            setGroupTodos(processedTodos);
            setupKanbanColumns(result.groupId, processedTodos);
            setJustJoinedGroup(result.group);
            
            // Show success message with todo count
            if (processedTodos.length > 0) {
              toast.success(`Successfully joined the group! Found ${processedTodos.length} todos to work on.`);
            } else {
              toast.success('Successfully joined the group! No todos yet, be the first to create one!');
            }
          }
        } else {
          toast.success('Invitation declined');
        }
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast.error('Failed to respond to invitation');
    }
  };

  const searchUsersByEmail = async (email) => {
    try {
      if (email.length < 2) {
        setEmailSuggestions([]);
        setShowEmailSuggestions(false);
        return;
      }
      
      const response = await get(`/advanced-group-system/users/search?email=${encodeURIComponent(email)}`);
      if (response?.success) {
        setEmailSuggestions(response.users);
        setShowEmailSuggestions(response.users.length > 0);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setEmailSuggestions([]);
      setShowEmailSuggestions(false);
    }
  };

  const selectEmailSuggestion = (user) => {
    // Find the email input and update its value
    const emailInput = document.querySelector('input[name="email"]');
    if (emailInput) {
      emailInput.value = user.email;
      // Trigger change event
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    setShowEmailSuggestions(false);
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await put(`/advanced-group-system/notifications/${notificationId}/read`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDragStart = (e, todo, columnId) => {
    setDragDropData({ todo, sourceColumn: columnId });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    
    if (!dragDropData || dragDropData.sourceColumn === targetColumnId) {
      setDragDropData(null);
      return;
    }

    try {
      const { todo } = dragDropData;
      
      // Update todo in database
      const response = await put(`/advanced-group-system/groups/${selectedGroup.id}/todos/${todo.id}`, {
        kanban_column: targetColumnId,
        status: targetColumnId === 'completed' ? 'completed' : 
                targetColumnId === 'in_progress' ? 'in_progress' : 'pending'
      });

      if (response?.success) {
        // Update local state
        setGroupTodos(prev => prev.map(t => 
          t.id === todo.id 
            ? { ...t, kanban_column: targetColumnId, status: response.todo.status }
            : t
        ));

        // Update kanban columns
        setKanbanColumns(prev => {
          const newColumns = prev.map(col => {
            if (col.id === dragDropData.sourceColumn) {
              return { ...col, todos: col.todos.filter(t => t.id !== todo.id) };
            }
            if (col.id === targetColumnId) {
              return { ...col, todos: [...col.todos, { ...todo, kanban_column: targetColumnId }] };
            }
            return col;
          });
          return newColumns;
        });

        toast.success('Todo moved successfully!');
      }
    } catch (error) {
      console.error('Error moving todo:', error);
      toast.error('Failed to move todo');
    }

    setDragDropData(null);
  };

  const joinTodoChat = (todoId) => {
    if (socket && selectedGroup) {
      socket.emit('join-todo-chat', { todoId, groupId: selectedGroup.id });
      setSelectedTodo(todoId);
    }
  };

  const leaveTodoChat = (todoId) => {
    if (socket) {
      socket.emit('leave-todo-chat', { todoId });
      setSelectedTodo(null);
      setChatMessages([]);
    }
  };

  const sendChatMessage = (content) => {
    if (socket && selectedTodo && content.trim()) {
      socket.emit('chat-message', {
        todoId: selectedTodo,
        content: content.trim(),
        messageType: 'text'
      });
    }
  };

  const handleTyping = (isTyping) => {
    if (socket && selectedTodo) {
      if (isTyping) {
        socket.emit('typing-start', { todoId: selectedTodo });
        setIsTyping(true);
      } else {
        socket.emit('typing-stop', { todoId: selectedTodo });
        setIsTyping(false);
      }
    }
  };

  const filteredTodos = groupTodos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         todo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || todo.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'all' || 
                           todo.assignments.some(a => a.userId.toString() === filterAssignee);
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advanced group system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Advanced Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Zap className="w-6 h-6 mr-3 text-blue-500" />
              Advanced Group Todo System
            </h2>
            <p className="text-gray-600 mt-1">
              Professional-grade collaboration platform with real-time features
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Members
            </button>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </button>
          </div>
        </div>

        {/* Advanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{groups.length}</div>
            <div className="text-sm text-blue-600">My Groups</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{pendingInvitations.length}</div>
            <div className="text-sm text-green-600">Pending Invitations</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{groupTodos.length}</div>
            <div className="text-sm text-yellow-600">Total Todos</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{notifications.length}</div>
            <div className="text-sm text-purple-600">Unread Notifications</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {groupTodos.filter(t => t.status === 'overdue').length}
            </div>
            <div className="text-sm text-red-600">Overdue</div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {groupTodos.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-indigo-600">Completed</div>
          </div>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-yellow-500" />
            Pending Invitations ({pendingInvitations.length})
          </h3>
          
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    Invitation to join {invitation.group_name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Invited by {invitation.inviter_name} • Role: {invitation.role}
                  </p>
                  {invitation.message && (
                    <p className="text-sm text-gray-500 mt-1">{invitation.message}</p>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleInvitationResponse(invitation.id, 'decline')}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Groups Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Groups</h3>
            
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">You haven't joined any groups yet</p>
                                      <button
                        onClick={() => setShowCreateGroup(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        title="Create new group (Ctrl+G)"
                      >
                        Create Your First Group
                      </button>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedGroup?.id === group.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleGroupSelect(group)}
                      >
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <p className="text-sm text-gray-600">{group.description}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            group.user_role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            group.user_role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {group.user_role === 'admin' ? <Crown className="w-3 h-3 mr-1" /> : 
                             group.user_role === 'moderator' ? <Shield className="w-3 h-3 mr-1" /> : 
                             <Users className="w-3 h-3 mr-1" />}
                            {group.user_role}
                          </span>
                          <span className="text-xs text-gray-500">
                            {group.member_count} members
                          </span>
                        </div>
                      </div>
                      
                      {/* Delete button for admin/owner */}
                      {(group.user_role === 'admin' || group.user_role === 'owner') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                          className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Delete Group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {!selectedGroup ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Group Selected</h4>
              <p className="text-gray-600">Select a group from the left to view its todos and start collaborating</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group Header and Controls */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedGroup.name} - Advanced Todo Management
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {selectedGroup.description} • {groupTodos.length} todos
                      {groupTodos.length > 0 && (
                        <span className="ml-2 text-sm">
                          ({groupTodos.filter(t => t.status === 'done').length} done, {groupTodos.filter(t => t.status === 'pending').length} pending)
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowCreateTaskModal(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="Create new task (Ctrl+N)"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </button>
                    
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('kanban')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Kanban Board"
                      >
                        <Kanban className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="List View"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('calendar')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Calendar View"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('analytics')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('professional')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'professional' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Professional View"
                      >
                        <Target className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Delete Group Button - Only show for admins/owners */}
                    {(selectedGroup?.user_role === 'admin' || selectedGroup?.user_role === 'owner') && (
                      <button
                        onClick={() => handleDeleteGroup(selectedGroup.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Delete Group (Admin only)"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Group
                      </button>
                    )}
                  </div>
                </div>

                {/* Welcome Message for New Members */}
                {justJoinedGroup && justJoinedGroup.id === selectedGroup.id && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-green-800">
                          Welcome to {selectedGroup.name}! 🎉
                        </h4>
                        <p className="text-sm text-green-700 mt-1">
                          {groupTodos.length === 0 
                            ? "This group doesn't have any todos yet. Be the first to create one!"
                            : `You've successfully joined the group. There are ${groupTodos.length} todos you can work on.`
                          }
                        </p>
                        {groupTodos.length > 0 && (
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-xs text-green-600">
                              💡 Tip: Use the filters above to find specific todos
                            </span>
                            <span className="text-xs text-green-600">
                              🎯 {groupTodos.filter(t => t.status === 'done').length} done, {groupTodos.filter(t => t.status === 'pending').length} pending
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-auto pl-3">
                        <button
                          onClick={() => setJustJoinedGroup(null)}
                          className="text-green-400 hover:text-green-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Filters */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search todos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Assignees</option>
                    <option value="unassigned">Unassigned</option>
                    {/* Add dynamic assignee options */}
                  </select>
                  
                  <button
                    onClick={loadData}
                    className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Based on View Mode */}
              {viewMode === 'professional' && (
                <ProfessionalTaskManager 
                  group={selectedGroup}
                  onUpdate={loadData}
                />
              )}
              
              {viewMode === 'kanban' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Kanban Board</h4>
                        <p className="text-sm text-gray-600">👥 Click to manage assignments • 💬 Chat • 📊 Track progress</p>
                      </div>
                      <button
                        onClick={() => setShowAssignmentDemo(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-lg"
                      >
                        📖 How to Use
                      </button>
                    </div>
                  </div>
                  {console.log('🎯 Kanban view - groupTodos length:', groupTodos.length)}
                  
                  {groupTodos.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Todos Yet</h4>
                      <p className="text-gray-600 mb-4">
                        {justJoinedGroup && justJoinedGroup.id === selectedGroup.id 
                          ? "This group doesn't have any todos yet. Be the first to create one!"
                          : "This group doesn't have any todos yet."
                        }
                      </p>
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowCreateTaskModal(true)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Task
                        </button>
                        <div className="text-sm text-gray-500">
                          💡 After creating todos, click the 👥 icon to assign tasks to team members!
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-4">
                    {console.log('🎨 Rendering kanban columns:', kanbanColumns.length, 'columns')}
                    {kanbanColumns.map((column) => (
                      <div
                        key={column.id}
                        className="min-h-[600px]"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column.id)}
                      >
                        <div 
                          className="p-3 rounded-lg mb-3 text-white font-medium text-center"
                          style={{ backgroundColor: column.color }}
                        >
                          {column.name}
                          <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm">
                            {column.todos.length}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {column.todos.map((todo) => (
                            <div
                              key={todo.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, todo, column.id)}
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:border-gray-300 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium text-gray-900 text-sm">{todo.title}</h5>
                                                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    setSelectedTodoForAssignment(todo);
                                    setShowAssignmentManager(true);
                                  }}
                                  className="text-gray-400 hover:text-blue-600"
                                  title="Manage Assignments"
                                >
                                  <Users className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => joinTodoChat(todo.id)}
                                  className="text-gray-400 hover:text-gray-600"
                                  title="Open Chat"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                                {todo.assignments && todo.assignments.length > 0 ? (
                                  <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                                    {todo.assignments.filter(a => a.status === 'completed').length}/{todo.assignments.length}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedTodoForAssignment(todo);
                                      setShowAssignmentManager(true);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                                    title="Quick Assign"
                                  >
                                    Assign
                                  </button>
                                )}
                              </div>
                              </div>
                              
                              {todo.description && (
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                  {todo.description}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  todo.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {todo.priority}
                                </span>
                                {todo.deadline && (
                                  <span className="text-xs text-gray-500 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(todo.deadline).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              
                              {todo.assignments && todo.assignments.length > 0 ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-1">
                                      <Users className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">
                                        {todo.assignments.length} assigned
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {todo.assignments.filter(a => a.status === 'completed').length}/{todo.assignments.length} done
                                    </div>
                                  </div>
                                  
                                  {/* Assignment Progress Bar */}
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${todo.assignments.length > 0 
                                          ? Math.round((todo.assignments.filter(a => a.status === 'completed').length / todo.assignments.length) * 100) 
                                          : 0}%` 
                                      }}
                                    ></div>
                                  </div>
                                  
                                  {/* Assignment Details */}
                                  <div className="space-y-1">
                                    {todo.assignments.slice(0, 3).map((assignment, index) => (
                                      <div key={index} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center space-x-1">
                                          <div className={`w-2 h-2 rounded-full ${
                                            assignment.status === 'completed' ? 'bg-green-500' :
                                            assignment.status === 'in_progress' ? 'bg-blue-500' :
                                            'bg-gray-400'
                                          }`}></div>
                                          <span className="text-gray-600 truncate max-w-20">
                                            {assignment.user?.name || `User ${assignment.userId}`}
                                          </span>
                                        </div>
                                        <span className={`text-xs font-medium ${
                                          assignment.status === 'completed' ? 'text-green-600' :
                                          assignment.status === 'in_progress' ? 'text-blue-600' :
                                          'text-gray-500'
                                        }`}>
                                          {assignment.status}
                                        </span>
                                      </div>
                                    ))}
                                    {todo.assignments.length > 3 && (
                                      <div className="text-xs text-gray-500 text-center">
                                        +{todo.assignments.length - 3} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-2">
                                  <div className="text-xs text-gray-500 mb-1">No assignments yet</div>
                                  <button
                                    onClick={() => {
                                      setSelectedTodoForAssignment(todo);
                                      setShowAssignmentManager(true);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                                  >
                                    👥 Assign Tasks
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}

              {viewMode === 'list' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">List View</h4>
                  {console.log('📋 List view - groupTodos length:', groupTodos.length, 'filteredTodos length:', filteredTodos.length)}
                  
                  {groupTodos.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Todos Yet</h4>
                      <p className="text-gray-600 mb-4">
                        {justJoinedGroup && justJoinedGroup.id === selectedGroup.id 
                          ? "This group doesn't have any todos yet. Be the first to create one!"
                          : "This group doesn't have any todos yet."
                        }
                      </p>
                      <button
                        onClick={() => setShowCreateTodo(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Todo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                    {filteredTodos.map((todo) => (
                      <div key={todo.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h5 className="font-medium text-gray-900">{todo.title}</h5>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                todo.status === 'done' ? 'bg-green-100 text-green-800' :
                                todo.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                todo.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {todo.status}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                todo.priority === 'high' ? 'bg-red-100 text-red-800' :
                                todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {todo.priority}
                              </span>
                            </div>
                            
                            {todo.description && (
                              <p className="text-gray-600 mb-2">{todo.description}</p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Created by {todo.creator.name}</span>
                              {todo.deadline && (
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {new Date(todo.deadline).toLocaleDateString()}
                                </span>
                              )}
                              {todo.assignments && todo.assignments.length > 0 && (
                                <span className="flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  {todo.assignments.filter(a => a.status === 'completed').length}/{todo.assignments.length} done
                                </span>
                              )}
                              <span className="flex items-center">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                {todo.message_count || 0} messages
                              </span>
                            </div>
                            
                            {/* Assignment Details for List View */}
                            {todo.assignments && todo.assignments.length > 0 && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h6 className="text-sm font-medium text-gray-700">Assignments</h6>
                                  <div className="text-xs text-gray-500">
                                    {todo.assignments.filter(a => a.status === 'completed').length}/{todo.assignments.length} completed
                                  </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: `${todo.assignments.length > 0 
                                        ? Math.round((todo.assignments.filter(a => a.status === 'completed').length / todo.assignments.length) * 100) 
                                        : 0}%` 
                                    }}
                                  ></div>
                                </div>
                                
                                {/* Assignment List */}
                                <div className="space-y-2">
                                  {todo.assignments.map((assignment, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                      <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${
                                          assignment.status === 'completed' ? 'bg-green-500' :
                                          assignment.status === 'in_progress' ? 'bg-blue-500' :
                                          'bg-gray-400'
                                        }`}></div>
                                        <span className="text-gray-700">
                                          {assignment.user?.name || `User ${assignment.userId}`}
                                        </span>
                                        {assignment.role && (
                                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                            {assignment.role}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className={`text-xs font-medium ${
                                          assignment.status === 'completed' ? 'text-green-600' :
                                          assignment.status === 'in_progress' ? 'text-blue-600' :
                                          'text-gray-500'
                                        }`}>
                                          {assignment.status}
                                        </span>
                                        {assignment.estimatedTime && (
                                          <span className="text-xs text-gray-500">
                                            {assignment.estimatedTime}h
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                                                      <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedTodoForAssignment(todo);
                                  setShowAssignmentManager(true);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600"
                                title="Manage Assignments"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => joinTodoChat(todo.id)}
                                className="p-2 text-gray-400 hover:text-gray-600"
                                title="Open Chat"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              {todo.assignments && todo.assignments.length > 0 && (
                                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {todo.assignments.filter(a => a.status === 'completed').length}/{todo.assignments.length}
                                </div>
                              )}
                              <button className="p-2 text-gray-400 hover:text-gray-600">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}

              {viewMode === 'calendar' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Calendar View</h4>
                  
                  {groupTodos.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Todos to Schedule</h4>
                      <p className="text-gray-600 mb-4">
                        {justJoinedGroup && justJoinedGroup.id === selectedGroup.id 
                          ? "This group doesn't have any todos yet. Create some todos to see them on the calendar!"
                          : "This group doesn't have any todos yet."
                        }
                      </p>
                      <button
                        onClick={() => setShowCreateTodo(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Todo
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Calendar view coming soon! For now, use Kanban or List view.</p>
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'analytics' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Analytics Dashboard</h4>
                  
                  {groupTodos.length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Data to Analyze</h4>
                      <p className="text-gray-600 mb-4">
                        {justJoinedGroup && justJoinedGroup.id === selectedGroup.id 
                          ? "This group doesn't have any todos yet. Create some todos to see analytics!"
                          : "This group doesn't have any todos yet."
                        }
                      </p>
                      <button
                        onClick={() => setShowCreateTodo(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Todo
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-2">Progress Overview</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-700">Done</span>
                          <span className="text-sm font-medium text-blue-900">
                            {groupTodos.filter(t => t.status === 'done').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-700">Pending</span>
                          <span className="text-sm font-medium text-blue-900">
                            {groupTodos.filter(t => t.status === 'pending').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-700">Overdue</span>
                          <span className="text-sm font-medium text-blue-900">
                            {groupTodos.filter(t => t.status === 'overdue').length}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-medium text-green-900 mb-2">Priority Distribution</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700">High</span>
                          <span className="text-sm font-medium text-green-900">
                            {groupTodos.filter(t => t.priority === 'high').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700">Medium</span>
                          <span className="text-sm font-medium text-green-900">
                            {groupTodos.filter(t => t.priority === 'medium').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700">Low</span>
                          <span className="text-sm font-medium text-green-900">
                            {groupTodos.filter(t => t.priority === 'low').length}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h5 className="font-medium text-purple-900 mb-2">Activity Metrics</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-700">Total Messages</span>
                          <span className="text-sm font-medium text-purple-900">
                            {groupTodos.reduce((sum, t) => sum + (t.message_count || 0), 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-700">Total Files</span>
                          <span className="text-sm font-medium text-purple-900">
                            {groupTodos.reduce((sum, t) => sum + (t.file_count || 0), 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-700">Overdue</span>
                          <span className="text-sm font-medium text-purple-900">
                            {groupTodos.filter(t => t.status === 'overdue').length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      {selectedTodo && (
        <div className="fixed bottom-0 right-0 w-96 h-96 bg-white border border-gray-200 rounded-t-lg shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <h4 className="font-medium text-gray-900">Todo Chat</h4>
            <button
              onClick={() => leaveTodoChat(selectedTodo)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-3 h-64 overflow-y-auto">
            {chatMessages.map((message, index) => (
              <div key={index} className="mb-3">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                    {message.user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{message.user.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {typingUsers.size > 0 && (
              <div className="text-sm text-gray-500 italic">
                {Array.from(typingUsers).join(', ')} is typing...
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    sendChatMessage(e.target.value);
                    e.target.value = '';
                    handleTyping(false);
                  }
                }}
                onKeyDown={() => handleTyping(true)}
                onKeyUp={() => {
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => handleTyping(false), 1000);
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Type a message..."]');
                  if (input && input.value.trim()) {
                    sendChatMessage(input.value);
                    input.value = '';
                    handleTyping(false);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Group</h3>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              try {
                const result = await post('/advanced-group-system/groups', {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  category: formData.get('category'),
                  is_private: formData.get('is_private') === 'true',
                  max_members: parseInt(formData.get('max_members'))
                });
                
                if (result?.success) {
                  setShowCreateGroup(false);
                  loadData();
                  toast.success('Group created successfully!');
                }
              } catch (error) {
                console.error('Error creating group:', error);
                toast.error('Failed to create group');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter group name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter group description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="study">Study</option>
                    <option value="work">Work</option>
                    <option value="project">Project</option>
                    <option value="social">Social</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
                  <select
                    name="is_private"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="false">Public</option>
                    <option value="true">Private</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Members</label>
                  <input
                    type="number"
                    name="max_members"
                    min="1"
                    max="100"
                    defaultValue="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Members Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite Members</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              try {
                const result = await post('/advanced-group-system/groups/invite', {
                  group_id: parseInt(formData.get('group_id')),
                  email: formData.get('email'),
                  role: formData.get('role'),
                  message: formData.get('message')
                });
                
                if (result?.success) {
                  setShowInviteModal(false);
                  toast.success('Invitation sent successfully!');
                  e.target.reset();
                  setEmailSuggestions([]);
                  setShowEmailSuggestions(false);
                }
              } catch (error) {
                console.error('Error sending invitation:', error);
                
                // Handle specific error cases
                if (error.message === 'Invitation already sent to this user') {
                  toast.success('Invitation sent successfully! (User may already have an invitation for this group)');
                } else {
                  toast.error(error.message || 'Failed to send invitation');
                }
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Group</label>
                  <select
                    name="group_id"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a group</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="relative" ref={emailDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                    onChange={(e) => searchUsersByEmail(e.target.value)}
                    onFocus={() => setShowEmailSuggestions(true)}
                  />
                  
                  {/* Email Suggestions Dropdown */}
                  {showEmailSuggestions && emailSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {emailSuggestions.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => selectEmailSuggestion(user)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    name="role"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                  <textarea
                    name="message"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a personal message"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Todo Modal */}
      {showCreateTodo && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Todo</h3>
              <button
                onClick={() => setShowCreateTodo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              try {
                const result = await post(`/advanced-group-system/groups/${selectedGroup.id}/todos`, {
                  title: formData.get('title'),
                  description: formData.get('description'),
                  category: formData.get('category'),
                  priority: formData.get('priority'),
                  deadline: formData.get('deadline'),
                  estimated_time: parseInt(formData.get('estimated_time')),
                  kanbanColumn: formData.get('kanban_column'),
                  assigned_to: formData.get('assigned_to') ? [parseInt(formData.get('assigned_to'))] : [],
                  is_public: formData.get('is_public') === 'true',
                  allow_comments: formData.get('allow_comments') === 'true',
                  allow_attachments: formData.get('allow_attachments') === 'true'
                });
                
                if (result?.success) {
                  setShowCreateTodo(false);
                  console.log('✅ Todo created successfully:', result.todo);
                  // Force refresh the group todos
                  await handleGroupSelect(selectedGroup);
                  toast.success('Todo created successfully!');
                }
              } catch (error) {
                console.error('Error creating todo:', error);
                toast.error('Failed to create todo');
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter todo title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="task">Task</option>
                    <option value="project">Project</option>
                    <option value="meeting">Meeting</option>
                    <option value="deadline">Deadline</option>
                    <option value="reminder">Reminder</option>
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="health">Health</option>
                    <option value="finance">Finance</option>
                    <option value="social">Social</option>
                    <option value="hobby">Hobby</option>
                    <option value="travel">Travel</option>
                    <option value="shopping">Shopping</option>
                    <option value="family">Family</option>
                    <option value="career">Career</option>
                    <option value="learning">Learning</option>
                    <option value="exercise">Exercise</option>
                    <option value="reading">Reading</option>
                    <option value="coding">Coding</option>
                    <option value="design">Design</option>
                    <option value="writing">Writing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="datetime-local"
                    name="deadline"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (hours)</label>
                  <input
                    type="number"
                    name="estimated_time"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter estimated hours"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
                  <select
                    name="kanban_column"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todo">To Do</option>
                    <option value="backlog">Backlog</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                  <select
                    name="assigned_to"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {/* Add group members here when available */}
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter detailed description"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_public"
                    value="true"
                    id="is_public"
                    className="mr-2"
                  />
                  <label htmlFor="is_public" className="text-sm text-gray-700">Public Todo</label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="allow_comments"
                    value="true"
                    id="allow_comments"
                    defaultChecked
                    className="mr-2"
                  />
                  <label htmlFor="allow_comments" className="text-sm text-gray-700">Allow Comments</label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="allow_attachments"
                    value="true"
                    id="allow_attachments"
                    defaultChecked
                    className="mr-2"
                  />
                  <label htmlFor="allow_attachments" className="text-sm text-gray-700">Allow Attachments</label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateTodo(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Create Todo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <h4 className="font-medium text-gray-900">Recent Notifications</h4>
          </div>
          
          <div className="p-3 space-y-2">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="flex items-start justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 text-sm">{notification.title}</h5>
                  <p className="text-xs text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                
                <button
                  onClick={() => markNotificationRead(notification.id)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Todo Assignment Manager Modal */}
      <AnimatePresence>
        {showAssignmentManager && selectedTodoForAssignment && (
          <TodoAssignmentManager
            todo={selectedTodoForAssignment}
            group={selectedGroup}
            onClose={() => {
              setShowAssignmentManager(false);
              setSelectedTodoForAssignment(null);
            }}
            onUpdate={() => {
              handleGroupSelect(selectedGroup);
            }}
          />
        )}
      </AnimatePresence>

      {/* Assignment Demo Modal */}
      {showAssignmentDemo && (
        <AssignmentDemo onClose={() => setShowAssignmentDemo(false)} />
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <CreateTaskModal
          group={selectedGroup}
          onClose={() => setShowCreateTaskModal(false)}
          onSuccess={() => {
            // Refresh todos for the current group
            if (selectedGroup) {
              handleGroupSelect(selectedGroup);
            }
            setShowCreateTaskModal(false);
          }}
        />
      )}
    </div>
  );
};

export default AdvancedGroupTodoSystem; 