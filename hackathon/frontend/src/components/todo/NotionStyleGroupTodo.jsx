import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import GroupTodoForm from './GroupTodoForm';
import TodoTestComponent from './TodoTestComponent';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  MessageSquare, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Settings,
  BarChart3,
  Grid3X3,
  List,
  Kanban,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Bell,
  Star,
  Tag,
  Flag,
  Clock3,
  CalendarDays,
  CheckSquare,
  Square,
  Circle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Paperclip,
  Smile,
  AtSign,
  Hash,
  Lock,
  Unlock,
  Crown,
  Shield,
  UserCheck,
  UserX,
  UserMinus,
  UserPlus2,
  Copy,
  Share2,
  Download,
  Upload,
  Archive,
  RefreshCw,
  Play,
  Pause,
  Stop,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Mail,
  PhoneCall,
  MessageCircle,
  HelpCircle,
  Info,
  AlertTriangle,
  Check,
  XCircle,
  Minus,
  Maximize2,
  Minimize2,
  Move,
  GripVertical,
  DragHandle,
  MousePointer,
  Hand,
  MousePointer2,
  HandPointer,
  HandMetal,
  HandHeart,
  HandCoins,
  Handshake,
  HandshakeIcon,
  Heart,
  HeartOff,
  ThumbsUp,
  ThumbsDown,
  Award,
  Trophy,
  Medal,
  Badge,
  Certificate,
  Diploma,
  GraduationCap,
  BookOpen,
  Book,
  Library,
  School,
  University,
  Building,
  Home,
  Office,
  Store,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  DollarSign,
  Coins,
  PiggyBank,
  Wallet,
  Banknote,
  Receipt,
  File,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderX,
  FolderCheck,
  FolderSearch,
  FolderHeart,
  FolderClock,
  FolderKey,
  FolderLock,
  FolderUnlock,
  FolderCog,
  FolderSettings,
  FolderGit,
  FolderGit2,
  FolderUp,
  FolderDown,
  FolderLeft,
  FolderRight,
  FolderTree,
  FolderSymlink,
  FolderArchive,
  FolderOff,
  FolderQuestion,
  FolderStar,
  FolderUser,
  FolderPlus2,
  FolderMinus2,
  FolderX2,
  FolderCheck2,
  FolderSearch2,
  FolderHeart2,
  FolderClock2,
  FolderKey2,
  FolderLock2,
  FolderUnlock2,
  FolderCog2,
  FolderSettings2,
  FolderGit2 as FolderGit3,
  FolderGit22,
  FolderUp2,
  FolderDown2,
  FolderLeft2,
  FolderRight2,
  FolderTree2,
  FolderSymlink2,
  FolderArchive2,
  FolderOff2,
  FolderQuestion2,
  FolderStar2,
  FolderUser2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import NotionStyleTodoCard from './NotionStyleTodoCard';
import NotionStyleTodoDetail from './NotionStyleTodoDetail';
import NotionStyleChatBox from './NotionStyleChatBox';
import NotionStyleKanbanBoard from './NotionStyleKanbanBoard';
import NotionStyleTimeline from './NotionStyleTimeline';
import NotionStyleAnalytics from './NotionStyleAnalytics';
import NotionStyleMemberManagement from './NotionStyleMemberManagement';
import NotionStyleFileManager from './NotionStyleFileManager';
import NotionStyleSettings from './NotionStyleSettings';
import NotionStyleAI from './NotionStyleAI';

const NotionStyleGroupTodo = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { user } = useAuth();
  const api = useApi();
  
  // State management
  const [group, setGroup] = useState(null);
  const [todos, setTodos] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // kanban, timeline, list, analytics
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    category: 'all',
    tags: [],
    dateRange: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userPresence, setUserPresence] = useState({});
  const [collaborationMode, setCollaborationMode] = useState('real-time');
  const [autoSave, setAutoSave] = useState(true);
  const [versionControl, setVersionControl] = useState(true);
  const [conflictResolution, setConflictResolution] = useState('auto');
  const [peerReview, setPeerReview] = useState(false);
  const [consensusRequired, setConsensusRequired] = useState(false);
  const [votingSystem, setVotingSystem] = useState(false);
  const [qualityCheckpoints, setQualityCheckpoints] = useState([]);
  const [feedbackLoops, setFeedbackLoops] = useState(true);
  const [fileSharing, setFileSharing] = useState({
    enabled: true,
    maxFileSize: 50,
    allowedTypes: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'png', 'gif'],
    versioning: true,
    collaboration: true
  });
  const [realTimeFeatures, setRealTimeFeatures] = useState({
    presenceIndicators: true,
    cursorTracking: true,
    changeHistory: true,
    autoSave: true,
    syncInterval: 3000,
    offlineSupport: true
  });

  // Fetch data on component mount
  useEffect(() => {
    if (groupId) {
      fetchGroupData();
      fetchTodos();
      fetchMembers();
      setupRealTimeConnection();
    }
  }, [groupId]);

  // Real-time connection setup
  const setupRealTimeConnection = useCallback(() => {
    // WebSocket connection for real-time updates
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL || 'ws://localhost:3001'}/group/${groupId}`);
    
    ws.onopen = () => {
      console.log('Connected to group real-time updates');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRealTimeUpdate(data);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('Disconnected from group real-time updates');
      // Attempt to reconnect
      setTimeout(setupRealTimeConnection, 5000);
    };
    
    return () => {
      ws.close();
    };
  }, [groupId]);

  // Handle real-time updates
  const handleRealTimeUpdate = useCallback((data) => {
    switch (data.type) {
      case 'todo_created':
        setTodos(prev => [data.todo, ...prev]);
        break;
      case 'todo_updated':
        setTodos(prev => prev.map(todo => 
          todo.id === data.todo.id ? data.todo : todo
        ));
        break;
      case 'todo_deleted':
        setTodos(prev => prev.filter(todo => todo.id !== data.todoId));
        break;
      case 'member_joined':
        setMembers(prev => [...prev, data.member]);
        break;
      case 'member_left':
        setMembers(prev => prev.filter(member => member.id !== data.memberId));
        break;
      case 'message_sent':
        // Handle new chat message
        break;
      case 'presence_update':
        setUserPresence(prev => ({
          ...prev,
          [data.userId]: data.presence
        }));
        break;
      case 'file_uploaded':
        // Handle new file upload
        break;
      default:
        break;
    }
  }, []);

  // Fetch group data
  const fetchGroupData = async () => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      if (response.success) {
        setGroup(response.group);
        setGroupSettings(response.group.todoSettings || {});
      }
    } catch (error) {
      console.error('Error fetching group:', error);
    }
  };

  // Fetch todos
  const fetchTodos = async () => {
    try {
      console.log('🔍 Debug: Starting fetchTodos for groupId:', groupId);
      console.log('🔍 Debug: Token exists:', !!localStorage.getItem('token'));
      setIsLoading(true);
      const response = await api.get(`/groupTodo/groups/${groupId}/todos`);
      console.log('🔍 Debug: fetchTodos response:', response);
      
      if (response && response.success) {
        console.log('✅ fetchTodos successful, setting todos:', response.todos);
        setTodos(response.todos || []);
        console.log('🔍 Debug: todos state updated, length:', response.todos?.length || 0);
      } else {
        console.error('❌ Error: fetchTodos response not successful:', response);
        setTodos([]);
      }
    } catch (error) {
      console.error('❌ Error fetching todos:', error);
      setTodos([]);
    } finally {
      setIsLoading(false);
      console.log('🔍 Debug: fetchTodos completed, loading state:', false);
    }
  };

  // Fetch members
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

  // Create new todo
  const createTodo = async (todoData) => {
    try {
      console.log('🔍 Debug: Creating todo with data:', todoData);
      console.log('🔍 Debug: groupId:', groupId);
      console.log('🔍 Debug: Token exists:', !!localStorage.getItem('token'));
      
      const response = await api.post(`/groupTodo/groups/${groupId}/todos`, todoData);
      console.log('🔍 Debug: createTodo response:', response);
      
      if (response && response.success) {
        console.log('✅ Todo created successfully, fetching updated list...');
        // Fetch todos again to ensure we have the latest data
        await fetchTodos();
        setShowCreateModal(false);
        console.log('✅ Modal closed and todos refreshed');
      } else {
        console.error('❌ Error: createTodo response not successful:', response);
        // Try to fetch todos anyway to see current state
        await fetchTodos();
      }
    } catch (error) {
      console.error('❌ Error creating todo:', error);
      // Try to fetch todos anyway to see current state
      await fetchTodos();
    }
  };

  // Update todo
  const updateTodo = async (todoId, updates) => {
    try {
      const response = await api.put(`/todos/${todoId}`, updates);
      if (response.success) {
        setTodos(prev => prev.map(todo => 
          todo.id === todoId ? { ...todo, ...updates } : todo
        ));
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  // Delete todo
  const deleteTodo = async (todoId) => {
    try {
      const response = await api.delete(`/todos/${todoId}`);
      if (response.success) {
        setTodos(prev => prev.filter(todo => todo.id !== todoId));
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // Filter todos based on current filters
  const filteredTodos = useMemo(() => {
    console.log('🔍 Debug: filteredTodos calculation, todos length:', todos.length);
    const filtered = todos.filter(todo => {
      // Status filter
      if (filters.status !== 'all' && todo.status !== filters.status) return false;
      
      // Priority filter
      if (filters.priority !== 'all' && todo.priority !== filters.priority) return false;
      
      // Assignee filter
      if (filters.assignee !== 'all' && !todo.assignments?.some(a => a.assignedTo === filters.assignee)) return false;
      
      // Category filter
      if (filters.category !== 'all' && todo.category !== filters.category) return false;
      
      // Tags filter
      if (filters.tags.length > 0 && !filters.tags.some(tag => todo.tags?.includes(tag))) return false;
      
      // Date range filter
      if (filters.dateRange && todo.deadline) {
        const deadline = new Date(todo.deadline);
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        if (deadline < start || deadline > end) return false;
      }
      
      // Search query
      if (searchQuery && !todo.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !todo.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      return true;
    });
    
    console.log('🔍 Debug: filteredTodos result length:', filtered.length);
    return filtered;
  }, [todos, filters, searchQuery]);

  // Group todos by status for Kanban view
  const groupedTodos = useMemo(() => {
    const groups = {
      pending: [],
      in_progress: [],
      review: [],
      completed: []
    };
    
    filteredTodos.forEach(todo => {
      if (groups[todo.status]) {
        groups[todo.status].push(todo);
      } else {
        groups.pending.push(todo);
      }
    });
    
    return groups;
  }, [filteredTodos]);

  // Handle todo selection
  const handleTodoSelect = (todo) => {
    // Chuyển sang trang todo detail riêng
    navigate(`/groups/${groupId}/todos/${todo.id}`);
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Handle todo drag and drop
  const handleTodoMove = async (todoId, newStatus, newPosition) => {
    try {
      await updateTodo(todoId, { status: newStatus });
      // Update local state immediately for optimistic UI
      setTodos(prev => prev.map(todo => 
        todo.id === todoId ? { ...todo, status: newStatus } : todo
      ));
    } catch (error) {
      console.error('Error moving todo:', error);
      // Revert on error
      fetchTodos();
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action, selectedTodoIds) => {
    try {
      switch (action) {
        case 'delete':
          await Promise.all(selectedTodoIds.map(id => deleteTodo(id)));
          break;
        case 'status':
          // Update status for all selected todos
          break;
        case 'assign':
          // Assign todos to specific user
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  // Handle member invitation
  const handleInviteMember = async (inviteData) => {
    try {
      const response = await api.post(`/groups/${groupId}/invite`, inviteData);
      if (response.success) {
        setShowInviteModal(false);
        // Show success notification
      }
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  };

  // Handle settings update
  const handleSettingsUpdate = async (newSettings) => {
    try {
      const response = await api.put(`/groups/${groupId}`, { todoSettings: newSettings });
      if (response.success) {
        setGroup(prev => ({
          ...prev,
          todoSettings: newSettings
        }));
        setShowSettings(false);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  // Handle AI optimization
  const handleAIOptimization = async (optimizationType) => {
    try {
      const response = await api.post(`/ai/optimize-group/${groupId}`, { type: optimizationType });
      if (response.success) {
        // Handle AI optimization results
        console.log('AI optimization result:', response.result);
      }
    } catch (error) {
      console.error('Error with AI optimization:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file, todoId = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (todoId) {
        formData.append('todoId', todoId);
      }
      
      const response = await api.post(`/groups/${groupId}/files`, formData);
      if (response.success) {
        // Handle successful file upload
        console.log('File uploaded successfully:', response.file);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Handle real-time collaboration
  const handleCollaborationUpdate = useCallback((update) => {
    // Handle real-time collaboration updates
    switch (update.type) {
      case 'cursor_move':
        // Update cursor position
        break;
      case 'text_change':
        // Handle text changes
        break;
      case 'selection_change':
        // Handle selection changes
        break;
      default:
        break;
    }
  }, []);

  // Handle offline/online status
  const handleConnectionChange = useCallback(() => {
    if (navigator.onLine) {
      // Back online - sync changes
      console.log('Back online, syncing changes...');
    } else {
      // Gone offline - enable offline mode
      console.log('Gone offline, enabling offline mode...');
    }
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    
    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, [handleConnectionChange]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && selectedTodo) {
      const timeoutId = setTimeout(() => {
        // Auto-save changes
        console.log('Auto-saving changes...');
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedTodo, autoSave]);

  // Version control
  const handleVersionCreate = async () => {
    try {
      const response = await api.post(`/groups/${groupId}/versions`, {
        todos: todos,
        members: members,
        settings: group?.todoSettings
      });
      if (response.success) {
        console.log('Version created successfully:', response.version);
      }
    } catch (error) {
      console.error('Error creating version:', error);
    }
  };

  // Conflict resolution
  const handleConflictResolution = async (conflict) => {
    try {
      const response = await api.post(`/groups/${groupId}/resolve-conflict`, conflict);
      if (response.success) {
        console.log('Conflict resolved successfully');
        // Refresh data
        fetchTodos();
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
    }
  };

  // Peer review system
  const handlePeerReview = async (todoId, reviewData) => {
    try {
      const response = await api.post(`/todos/${todoId}/reviews`, reviewData);
      if (response.success) {
        console.log('Peer review submitted successfully');
        // Update todo with review
        fetchTodos();
      }
    } catch (error) {
      console.error('Error submitting peer review:', error);
    }
  };

  // Voting system
  const handleVote = async (todoId, voteData) => {
    try {
      const response = await api.post(`/todos/${todoId}/votes`, voteData);
      if (response.success) {
        console.log('Vote submitted successfully');
        // Update todo with vote results
        fetchTodos();
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  };

  // Quality checkpoints
  const handleQualityCheckpoint = async (todoId, checkpointData) => {
    try {
      const response = await api.post(`/todos/${todoId}/quality-checkpoints`, checkpointData);
      if (response.success) {
        console.log('Quality checkpoint completed');
        // Update todo with checkpoint results
        fetchTodos();
      }
    } catch (error) {
      console.error('Error completing quality checkpoint:', error);
    }
  };

  // Feedback loops
  const handleFeedbackLoop = async (todoId, feedbackData) => {
    try {
      const response = await api.post(`/todos/${todoId}/feedback`, feedbackData);
      if (response.success) {
        console.log('Feedback submitted successfully');
        // Update todo with feedback
        fetchTodos();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Group not found</h2>
          <p className="text-gray-600">The group you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{group.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{members.length} members</p>
              </div>
            </div>
          </div>

          {/* Center - Search and Filters */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search todos, members, or files..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Create new */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="px-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8">
            {[
              { id: 'todos', label: 'Todos', icon: CheckSquare },
              { id: 'timeline', label: 'Timeline', icon: Calendar },
              { id: 'kanban', label: 'Kanban', icon: Grid3X3 },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'files', label: 'Files', icon: FileText },
              { id: 'chat', label: 'Chat', icon: MessageSquare },
              { id: 'ai', label: 'AI Assistant', icon: Zap }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Main content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r min-h-screen`}>
          <div className="p-4">
            {!sidebarCollapsed && (
              <div className="space-y-4">
                {/* Quick stats */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Quick Stats</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total</span>
                      <span className="font-medium text-gray-900 dark:text-white">{todos.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">In Progress</span>
                      <span className="font-medium text-blue-600">{todos.filter(t => t.status === 'in_progress').length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Completed</span>
                      <span className="font-medium text-green-600">{todos.filter(t => t.status === 'completed').length}</span>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Filters</h3>
                  <div className="space-y-2">
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                    
                    <select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                      className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Online members */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Online</h3>
                  <div className="space-y-1">
                    {onlineUsers.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'todos' && (
              <motion.div
                key="todos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* View mode selector */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewModeChange('kanban')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'kanban'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleViewModeChange('timeline')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'timeline'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Calendar className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleViewModeChange('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={fetchTodos}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Refresh
                    </button>
                    <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      Select All
                    </button>
                    <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      Bulk Actions
                    </button>
                  </div>
                </div>

                {/* Debug info */}
                <div className="text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  Debug: todos.length={todos.length}, filteredTodos.length={filteredTodos.length}, isLoading={isLoading.toString()}
                </div>

                {/* Test Component */}
                <TodoTestComponent groupId={groupId} />

                {/* Content based on view mode */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredTodos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                      <FileText className="w-full h-full" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No todos yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first group todo to get started</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Todo
                    </button>
                  </div>
                ) : (
                  <>
                    {viewMode === 'kanban' && (
                      <NotionStyleKanbanBoard
                        todos={groupedTodos}
                        onTodoSelect={handleTodoSelect}
                        onTodoMove={handleTodoMove}
                        onTodoUpdate={updateTodo}
                        onTodoDelete={deleteTodo}
                        members={members}
                        darkMode={darkMode}
                      />
                    )}

                    {viewMode === 'timeline' && (
                      <NotionStyleTimeline
                        todos={filteredTodos}
                        onTodoSelect={handleTodoSelect}
                        onTodoUpdate={updateTodo}
                        onTodoDelete={deleteTodo}
                        members={members}
                        darkMode={darkMode}
                      />
                    )}

                    {viewMode === 'list' && (
                      <div className="space-y-3">
                        {filteredTodos.map((todo) => (
                          <NotionStyleTodoCard
                            key={todo.id}
                            todo={todo}
                            onSelect={() => handleTodoSelect(todo)}
                            onUpdate={updateTodo}
                            onDelete={deleteTodo}
                            members={members}
                            darkMode={darkMode}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <NotionStyleTimeline
                  todos={filteredTodos}
                  onTodoSelect={handleTodoSelect}
                  onTodoUpdate={updateTodo}
                  onTodoDelete={deleteTodo}
                  members={members}
                  darkMode={darkMode}
                />
              </motion.div>
            )}

            {activeTab === 'kanban' && (
              <motion.div
                key="kanban"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <NotionStyleKanbanBoard
                  todos={groupedTodos}
                  onTodoSelect={handleTodoSelect}
                  onTodoMove={handleTodoMove}
                  onTodoUpdate={updateTodo}
                  onTodoDelete={deleteTodo}
                  members={members}
                  darkMode={darkMode}
                />
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <NotionStyleAnalytics
                  todos={todos}
                  members={members}
                  group={group}
                  darkMode={darkMode}
                />
              </motion.div>
            )}

            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <NotionStyleMemberManagement
                  members={members}
                  group={group}
                  onInviteMember={handleInviteMember}
                  onUpdateMember={handleSettingsUpdate}
                  darkMode={darkMode}
                />
              </motion.div>
            )}

            {activeTab === 'files' && (
              <motion.div
                key="files"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <NotionStyleFileManager
                  groupId={groupId}
                  onFileUpload={handleFileUpload}
                  darkMode={darkMode}
                />
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <NotionStyleChatBox
                  groupId={groupId}
                  members={members}
                  darkMode={darkMode}
                />
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <NotionStyleAI
                  groupId={groupId}
                  todos={todos}
                  members={members}
                  onOptimization={handleAIOptimization}
                  darkMode={darkMode}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
            >
              {/* Create todo form */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Todo</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <GroupTodoForm
                  groupId={groupId}
                  members={members}
                  onSubmit={createTodo}
                  onCancel={() => setShowCreateModal(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
            >
              <NotionStyleSettings
                group={group}
                onUpdate={handleSettingsUpdate}
                onClose={() => setShowSettings(false)}
                darkMode={darkMode}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotionStyleGroupTodo; 