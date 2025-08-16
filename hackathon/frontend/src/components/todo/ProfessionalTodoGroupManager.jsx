import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Settings, 
  UserPlus, 
  BarChart3, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Share,
  MessageSquare,
  FileText,
  Target,
  TrendingUp,
  Timer,
  X,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Filter3,
  PieChart,
  Activity,
  Zap,
  Star,
  Award,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckSquare,
  Square as SquareIcon,
  Circle,
  MinusCircle,
  PlusCircle,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  GitCompare,
  GitBranchPlus,
  GitCommitPlus,
  GitPullRequestPlus,
  GitMergePlus,
  GitComparePlus,
  GitBranchMinus,
  GitCommitMinus,
  GitPullRequestMinus,
  GitMergeMinus,
  GitCompareMinus
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import PomodoroTimer from './PomodoroTimer';

const ProfessionalTodoGroupManager = ({ group: groupProp, onTodoCreated, onClose }) => {
  const groupId = groupProp?.id;
  const { get, post, put, del } = useApi();
  const { user } = useAuth();
  
  // State management
  const [groupData, setGroupData] = useState(groupProp);
  const [todos, setTodos] = useState([]);
  const [members, setMembers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [activePomodoroTodo, setActivePomodoroTodo] = useState(null);
  
  // Advanced state management
  const [viewMode, setViewMode] = useState('kanban'); // kanban, list, calendar, gantt
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    category: 'all',
    dueDate: 'all'
  });
  const [sortBy, setSortBy] = useState({ field: 'dueDate', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTodos, setSelectedTodos] = useState([]);
  const [bulkActions, setBulkActions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Real-time collaboration state
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const [collaborationMode, setCollaborationMode] = useState('real-time');
  
  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    velocity: 0,
    burndown: [],
    cycleTime: 0,
    leadTime: 0,
    throughput: 0
  });

  useEffect(() => {
    if (groupId) {
      loadGroupData();
      initializeRealTimeCollaboration();
    }
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      
      // Load group details
      const groupResponse = await get(`/groups/${groupId}`);
      setGroupData(groupResponse.data);
      
      // Load todos with enhanced data
      const todosResponse = await get(`/groupTodo/groups/${groupId}/todos`);
      if (todosResponse && todosResponse.data) {
        setTodos(todosResponse.data.todos || []);
        setUserPermissions({
          ...todosResponse.data.groupInfo?.permissions || {},
          canStartPomodoro: true,
          canManageAssignments: true,
          canViewAnalytics: true,
          canManageGroup: true
        });
      }
      
      // Load members with enhanced info
      const membersResponse = await get(`/groups/${groupId}/members`);
      if (membersResponse && membersResponse.data) {
        setMembers(membersResponse.data || []);
      }
      
      // Load advanced analytics
      try {
        const analyticsResponse = await get(`/groupTodo/groups/${groupId}/todos/analytics`);
        if (analyticsResponse && analyticsResponse.data) {
          setAnalytics(analyticsResponse.data);
        }
      } catch (error) {
        console.log('Analytics not available:', error.message);
      }
      
      // Load performance metrics
      try {
        const performanceResponse = await get(`/groupTodo/groups/${groupId}/performance`);
        if (performanceResponse && performanceResponse.data) {
          setPerformanceMetrics(performanceResponse.data);
        }
      } catch (error) {
        console.log('Performance metrics not available:', error.message);
      }
      
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeRealTimeCollaboration = () => {
    // Initialize WebSocket connection for real-time collaboration
    // This would connect to your backend WebSocket service
    console.log('Initializing real-time collaboration...');
  };

  // Advanced filtering and sorting
  const filteredAndSortedTodos = useCallback(() => {
    let filtered = todos.filter(todo => {
      if (filters.status !== 'all' && todo.status !== filters.status) return false;
      if (filters.priority !== 'all' && todo.priority !== filters.priority) return false;
      if (filters.assignee !== 'all' && !todo.assignments?.some(a => a.assignedTo === filters.assignee)) return false;
      if (filters.category !== 'all' && todo.category !== filters.category) return false;
      if (filters.dueDate !== 'all') {
        const now = new Date();
        const dueDate = new Date(todo.deadline);
        switch (filters.dueDate) {
          case 'overdue':
            if (dueDate >= now) return false;
            break;
          case 'today':
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            if (dueDate < today || dueDate >= tomorrow) return false;
            break;
          case 'week':
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (dueDate > weekFromNow) return false;
            break;
        }
      }
      if (searchQuery && !todo.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !todo.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy.field) {
        case 'dueDate':
          aValue = new Date(a.deadline || '9999-12-31');
          bValue = new Date(b.deadline || '9999-12-31');
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'status':
          const statusOrder = { 'in_progress': 3, 'pending': 2, 'completed': 1 };
          aValue = statusOrder[a.status] || 0;
          bValue = statusOrder[b.status] || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a[sortBy.field];
          bValue = b[sortBy.field];
      }
      
      if (sortBy.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [todos, filters, sortBy, searchQuery]);

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedTodos.length === 0) return;
    
    try {
      switch (action) {
        case 'delete':
          await Promise.all(selectedTodos.map(todoId => del(`/todos/${todoId}`)));
          break;
        case 'status':
          // Update status for all selected todos
          break;
        case 'assign':
          // Bulk assign todos
          break;
        case 'export':
          // Export selected todos
          break;
      }
      
      setSelectedTodos([]);
      loadGroupData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  // Task assignment management
  const handleTaskAssignment = async (todoId, assigneeId, role = 'member') => {
    try {
      await post('/todo-assignments', {
        todoId,
        assignedTo: assigneeId,
        assignedBy: user.id,
        role,
        status: 'pending'
      });
      
      loadGroupData();
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  // Performance tracking
  const calculateVelocity = () => {
    const completedThisWeek = todos.filter(todo => {
      if (todo.status !== 'completed') return false;
      const completedDate = new Date(todo.completedAt || todo.updatedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return completedDate >= weekAgo;
    }).length;
    
    return completedThisWeek;
  };

  // Render methods
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{todos.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-orange-600">
                {todos.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {todos.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Velocity</p>
              <p className="text-2xl font-bold text-purple-600">{calculateVelocity()}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
          <div className="space-y-3">
            {['pending', 'in_progress', 'completed', 'overdue'].map(status => {
              const count = todos.filter(t => t.status === status).length;
              const percentage = todos.length > 0 ? (count / todos.length) * 100 : 0;
              const colors = {
                pending: 'bg-gray-500',
                in_progress: 'bg-blue-500',
                completed: 'bg-green-500',
                overdue: 'bg-red-500'
              };
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[status]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
          <div className="space-y-3">
            {['low', 'medium', 'high', 'urgent'].map(priority => {
              const count = todos.filter(t => t.priority === priority).length;
              const percentage = todos.length > 0 ? (count / todos.length) * 100 : 0;
              const colors = {
                low: 'bg-green-500',
                medium: 'bg-yellow-500',
                high: 'bg-orange-500',
                urgent: 'bg-red-500'
              };
              
              return (
                <div key={priority} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 capitalize">{priority}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[priority]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {todos.slice(0, 5).map(todo => (
            <div key={todo.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                todo.status === 'completed' ? 'bg-green-500' :
                todo.status === 'in_progress' ? 'bg-blue-500' :
                todo.status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{todo.title}</p>
                <p className="text-xs text-gray-500">
                  {todo.status} • {todo.priority} priority
                </p>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(todo.updatedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderKanbanBoard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Kanban Board</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            <Filter3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className={`p-2 rounded-lg border ${
              showBulkActions ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={filters.assignee}
              onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Assignees</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              <option value="study">Study</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="project">Project</option>
            </select>

            <select
              value={filters.dueDate}
              onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Due Dates</option>
              <option value="overdue">Overdue</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Bulk Actions */}
      {showBulkActions && selectedTodos.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-50 p-4 rounded-lg border border-purple-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-purple-800">
              {selectedTodos.length} tasks selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('status')}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200"
              >
                Update Status
              </button>
              <button
                onClick={() => handleBulkAction('assign')}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200"
              >
                Assign
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200"
              >
                Export
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {['pending', 'in_progress', 'review', 'completed'].map(columnStatus => {
          const columnTodos = filteredAndSortedTodos().filter(todo => {
            if (columnStatus === 'review') {
              return todo.status === 'in_progress' && todo.assignments?.some(a => a.status === 'completed');
            }
            return todo.status === columnStatus;
          });

          return (
            <div key={columnStatus} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 capitalize">
                  {columnStatus.replace('_', ' ')} ({columnTodos.length})
                </h4>
                {columnStatus === 'pending' && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {columnTodos.map(todo => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`bg-white p-3 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${
                      selectedTodos.includes(todo.id) ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => setSelectedTodo(todo)}
                  >
                    <div className="flex items-start justify-between">
                      <input
                        type="checkbox"
                        checked={selectedTodos.includes(todo.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTodos(prev => [...prev, todo.id]);
                          } else {
                            setSelectedTodos(prev => prev.filter(id => id !== todo.id));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 mr-2"
                      />
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900 mb-1">{todo.title}</h5>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{todo.description}</p>
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            todo.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            todo.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {todo.priority}
                          </span>
                          {todo.deadline && (
                            <span className="text-xs text-gray-500">
                              {new Date(todo.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {todo.assignments?.length > 0 && (
                          <div className="flex items-center space-x-1">
                            {todo.assignments.slice(0, 3).map(assignment => (
                              <div
                                key={assignment.id}
                                className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
                                title={assignment.assignee?.name}
                              >
                                <span className="text-xs text-gray-600">
                                  {assignment.assignee?.name?.charAt(0)}
                                </span>
                              </div>
                            ))}
                            {todo.assignments.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{todo.assignments.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(member => (
          <motion.div
            key={member.id}
            whileHover={{ scale: 1.02 }}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {member.name?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{member.name}</h4>
                <p className="text-sm text-gray-500">{member.role}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    onlineMembers.includes(member.id) ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-xs text-gray-500">
                    {onlineMembers.includes(member.id) ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Assigned Tasks</p>
                  <p className="font-medium text-gray-900">
                    {todos.filter(t => t.assignments?.some(a => a.assignedTo === member.id)).length}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Completed</p>
                  <p className="font-medium text-gray-900">
                    {todos.filter(t => 
                      t.status === 'completed' && 
                      t.assignments?.some(a => a.assignedTo === member.id)
                    ).length}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics</h3>
      
      {analytics ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Velocity (tasks/week)</span>
                <span className="text-2xl font-bold text-blue-600">{performanceMetrics.velocity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Cycle Time (days)</span>
                <span className="text-2xl font-bold text-green-600">{performanceMetrics.cycleTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Lead Time (days)</span>
                <span className="text-2xl font-bold text-purple-600">{performanceMetrics.leadTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Throughput (tasks/day)</span>
                <span className="text-2xl font-bold text-orange-600">{performanceMetrics.throughput}</span>
              </div>
            </div>
          </div>

          {/* Burndown Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Burndown Chart</h4>
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart visualization would go here</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Analytics data not available yet</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{groupData?.name}</h1>
              <p className="text-sm text-gray-500">{groupData?.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPomodoro(!showPomodoro)}
              className={`p-2 rounded-lg border ${
                showPomodoro ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              <Timer className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'kanban', label: 'Kanban Board', icon: GitBranch },
            { id: 'members', label: 'Team Members', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderDashboard()}
            </motion.div>
          )}

          {activeTab === 'kanban' && (
            <motion.div
              key="kanban"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderKanbanBoard()}
            </motion.div>
          )}

          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderMembers()}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderAnalytics()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pomodoro Timer */}
      {showPomodoro && (
        <div className="fixed bottom-6 right-6 z-50">
          <PomodoroTimer
            todo={activePomodoroTodo}
            onClose={() => setShowPomodoro(false)}
          />
        </div>
      )}

      {/* Modals would go here */}
      {/* CreateForm, InviteModal, etc. */}
    </div>
  );
};

export default ProfessionalTodoGroupManager; 