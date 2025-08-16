import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import PomodoroTimer from './PomodoroTimer';
import GroupTodoForm from './GroupTodoForm';
import InviteMembersModal from './InviteMembersModal';
import TodoDetailModal from './TodoDetailModal';

const GroupTodoManager = ({ group: groupProp, onTodoCreated, onClose }) => {
  const groupId = groupProp?.id;
  const { get, post, put, del } = useApi();
  const { user } = useAuth();
  const [groupData, setGroupData] = useState(groupProp);
  const [todos, setTodos] = useState([]);
  const [members, setMembers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todos');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [activePomodoroTodo, setActivePomodoroTodo] = useState(null);

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      
      // Load group details
      const groupResponse = await get(`/groups/${groupId}`);
      setGroupData(groupResponse.data);
      
      // Load todos - fix the response structure
      const todosResponse = await get(`/groupTodo/groups/${groupId}/todos`);
      if (todosResponse && todosResponse.data) {
        // Handle different response structures
        const todos = todosResponse.data.todos || todosResponse.data || [];
        setTodos(Array.isArray(todos) ? todos.filter(todo => todo && todo.id) : []);
        setUserPermissions({
          canCreateTodos: todosResponse.data.groupInfo?.permissions?.canCreate || true,
          canEditTodos: todosResponse.data.groupInfo?.permissions?.canEdit || true,
          canDeleteTodos: todosResponse.data.groupInfo?.permissions?.canDelete || false,
          canAssign: todosResponse.data.groupInfo?.permissions?.canAssign || false,
          canInvite: todosResponse.data.groupInfo?.permissions?.canInvite || false,
          canStartPomodoro: true, // Allow all members to start pomodoro
          hasAcceptedInvitation: todosResponse.data.groupInfo?.hasAcceptedInvitation || false,
          isMember: todosResponse.data.groupInfo?.isMember || false
        });
        
        // Log additional info for debugging
        console.log('🔍 Debug: Group info:', todosResponse.data.groupInfo);
        if (todosResponse.data.groupInfo?.hasAcceptedInvitation) {
          console.log('🔍 Debug: User has accepted invitation but not yet a member');
        }
      } else {
        setTodos([]);
        setUserPermissions({ 
          canCreateTodos: true,
          canEditTodos: true,
          canDeleteTodos: false,
          canAssign: false,
          canInvite: false,
          canStartPomodoro: true 
        });
      }
      
      // Load members
      const membersResponse = await get(`/groups/${groupId}/members`);
      if (membersResponse && membersResponse.data) {
        console.log('🔍 Debug: Members loaded:', membersResponse.data);
        setMembers(membersResponse.data || []);
      } else {
        console.log('🔍 Debug: No members data received');
        setMembers([]);
      }
      
      // Load analytics
      try {
        const analyticsResponse = await get(`/groupTodo/groups/${groupId}/todos/analytics`);
        if (analyticsResponse && analyticsResponse.data) {
          setAnalytics(analyticsResponse.data);
        }
      } catch (error) {
        console.log('Analytics not available:', error.message);
        setAnalytics(null);
      }
      
    } catch (error) {
      console.error('Error loading group data:', error);
      setTodos([]);
      setMembers([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async (todoData) => {
    try {
      const response = await post(`/groupTodo/groups/${groupId}/todos`, todoData);
      
      // Check if response exists
      if (!response) {
        console.error('No response from server');
        throw new Error('No response from server');
      }
      
      // The response is already the data object from useApi hook
      if (!response.todo) {
        console.error('No todo data in response:', response);
        throw new Error('No todo data in response');
      }
      
      setTodos(prev => [response.todo, ...prev]);
      setShowCreateForm(false);
      if (onTodoCreated) onTodoCreated(response.todo);
    } catch (error) {
      console.error('Error creating todo:', error);
      // You might want to show a user-friendly error message here
      throw error; // Re-throw to let the form handle the error
    }
  };

  const handleUpdateTodo = async (todoId, updates) => {
    try {
      const response = await put(`/groupTodo/groups/${groupId}/todos/${todoId}`, updates);
      if (response && response.todo) {
        setTodos(prev => prev.map(todo => 
          todo.id === todoId ? response.todo : todo
        ));
      } else {
        console.error('Invalid response structure for update:', response);
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      await del(`/groupTodo/groups/${groupId}/todos/${todoId}`);
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleAssignMembers = async (todoId, assignments) => {
    try {
      await post(`/groupTodo/groups/${groupId}/todos/${todoId}/assign`, { assignments });
      loadGroupData(); // Reload to get updated assignments
    } catch (error) {
      console.error('Error assigning members:', error);
    }
  };

  const handleStartPomodoro = (todo) => {
    setActivePomodoroTodo(todo);
    setShowPomodoro(true);
  };

  const handlePomodoroComplete = async (sessionData) => {
    try {
      // Update todo with pomodoro session data
      if (activePomodoroTodo) {
        await put(`/todo/${activePomodoroTodo.id}`, {
          pomodoro_sessions: [
            ...(activePomodoroTodo.pomodoro_sessions || []),
            sessionData
          ],
          total_pomodoro_time: (activePomodoroTodo.total_pomodoro_time || 0) + sessionData.duration
        });
        
        // Refresh group data to show updated information
        loadGroupData();
      }
      
      setShowPomodoro(false);
      setActivePomodoroTodo(null);
    } catch (error) {
      console.error('Error updating pomodoro session:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!groupId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">No group selected</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading group data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Users className="w-6 h-6 mr-3 text-blue-500" />
              {groupData?.name}
              {userPermissions.hasAcceptedInvitation && (
                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Invitation Accepted
                </span>
              )}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {groupData?.description}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {userPermissions.canCreateTodos && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Todo
              </button>
            )}
            {userPermissions.canInvite && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </button>
            )}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('todos')}
          className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
            activeTab === 'todos'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Todos ({todos.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
            activeTab === 'members'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
            activeTab === 'progress'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Progress
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'todos' && (
            <motion.div
              key="todos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {todos.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No todos yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Create your first group todo to get started
                  </p>
                  {userPermissions.canCreateTodos && (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Create Todo
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {(todos || []).map((todo) => (
                    todo && (
                      <GroupTodoCard
                        key={todo.id}
                        todo={todo}
                        members={members}
                        userPermissions={userPermissions}
                        onUpdate={handleUpdateTodo}
                        onDelete={handleDeleteTodo}
                        onAssign={handleAssignMembers}
                        onSelect={setSelectedTodo}
                        onStartPomodoro={handleStartPomodoro}
                      />
                    )
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(members || []).map((member) => (
                  <MemberCard key={member.id || member.user_id} member={member} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <ProgressOverview todos={todos} analytics={analytics} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateForm && (
          <GroupTodoForm
            groupId={groupId}
            members={members}
            onSubmit={handleCreateTodo}
            onClose={() => setShowCreateForm(false)}
          />
        )}

        {showInviteModal && (
          <InviteMembersModal
            groupId={groupId}
            onClose={() => setShowInviteModal(false)}
            onSuccess={loadGroupData}
          />
        )}

        {selectedTodo && (
          <TodoDetailModal
            todo={selectedTodo}
            members={members}
            userPermissions={userPermissions}
            onUpdate={handleUpdateTodo}
            onDelete={handleDeleteTodo}
            onAssign={handleAssignMembers}
            onClose={() => setSelectedTodo(null)}
          />
        )}

        {showPomodoro && activePomodoroTodo && (
          <PomodoroTimer
            todo={activePomodoroTodo}
            onComplete={handlePomodoroComplete}
            onClose={() => setShowPomodoro(false)}
          />
        )}
      </AnimatePresence>

      {/* Pomodoro Timer Modal */}
      <AnimatePresence>
        {showPomodoro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowPomodoro(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Timer className="w-5 h-5 mr-2 text-orange-500" />
                  Pomodoro Timer
                </h3>
                <button
                  onClick={() => setShowPomodoro(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <PomodoroTimer
                todo={activePomodoroTodo}
                onComplete={handlePomodoroComplete}
                onClose={() => setShowPomodoro(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Todo Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create Group Todo</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <GroupTodoForm
                groupId={groupId}
                members={members}
                onSubmit={handleCreateTodo}
                onCancel={() => setShowCreateForm(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Group Todo Card Component
const GroupTodoCard = ({ todo, members, userPermissions, onUpdate, onDelete, onAssign, onSelect, onStartPomodoro }) => {
  // Safety check for todo object
  if (!todo) {
    return null;
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <motion.div
      layout
      className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(todo)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {todo.title || 'Untitled Todo'}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(todo.status || 'pending')}`}>
              {todo.status || 'pending'}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(todo.priority || 'medium')}`}>
              {todo.priority || 'medium'}
            </span>
          </div>
          
          {todo.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              {todo.description}
            </p>
          )}

          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            {todo.deadline && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(todo.deadline).toLocaleDateString()}
              </div>
            )}
            {todo.estimatedTime && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {todo.estimatedTime} min
              </div>
            )}
            <div className="flex items-center">
              <Target className="w-4 h-4 mr-1" />
              {(todo.groupProgress || 0)}% complete
            </div>
            {/* Pomodoro Info */}
            {todo.pomodoro_sessions && todo.pomodoro_sessions.length > 0 && (
              <div className="flex items-center">
                <Timer className="w-4 h-4 mr-1" />
                {todo.pomodoro_sessions.length} sessions
                {todo.total_pomodoro_time && (
                  <span className="ml-1">
                    • {Math.round(todo.total_pomodoro_time / 60)}m
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Assigned Members */}
          {todo.assignments && todo.assignments.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Assigned to:
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {(todo.assignments || []).slice(0, 3).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full"
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                      {assignment.assignee?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {assignment.assignee?.name || 'Unknown User'}
                    </span>
                  </div>
                ))}
                {(todo.assignments || []).length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{(todo.assignments || []).length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {userPermissions.canEditTodos && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(todo);
              }}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {userPermissions.canDeleteTodos && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(todo.id);
              }}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {userPermissions.canStartPomodoro && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartPomodoro(todo);
              }}
              className="p-2 text-gray-400 hover:text-green-500 transition-colors"
            >
              <Timer className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Member Card Component
const MemberCard = ({ member }) => {
  const getRoleColor = (role) => {
    switch (role) {
      case 'leader': return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900';
      case 'admin': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case 'moderator': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case 'member': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {(member.name || member.username || 'U').charAt(0)}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {member.name || member.username || 'Unknown User'}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {member.email || 'No email'}
          </p>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getRoleColor(member.role)}`}>
            {member.role}
          </span>
        </div>
      </div>
    </div>
  );
};

// Progress Overview Component
const ProgressOverview = ({ todos, analytics }) => {
  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Todos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{analytics.totalTodos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{analytics.completedTodos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{analytics.inProgressTodos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{analytics.overdueTodos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Overall Progress
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${analytics.averageProgress}%` }}
              ></div>
            </div>
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {analytics.averageProgress}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default GroupTodoManager; 