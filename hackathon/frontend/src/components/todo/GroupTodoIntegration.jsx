import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  Calendar,
  BarChart3,
  UserPlus,
  Settings,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  MessageCircle,
  FileText,
  TrendingUp,
  Target,
  Users2,
  Crown,
  Shield,
  UserCheck,
  Timer,
  RefreshCw
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import GroupTodoManager from './GroupTodoManager';
import CreateGroupForm from './CreateGroupForm';
import InviteMembersModal from './InviteMembersModal';
import PomodoroTimer from './PomodoroTimer';

const GroupTodoIntegration = ({ onTodoCreated }) => {
  const { get, post, put, del } = useApi();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [activePomodoroTodo, setActivePomodoroTodo] = useState(null);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalMembers: 0,
    activeTodos: 0,
    completedTodos: 0
  });
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    loadUserGroups();
    loadAvailableUsers();
    
    // Listen for invitation acceptance events
    const handleInvitationAccepted = () => {
      console.log('🔄 Invitation accepted, refreshing groups...');
      loadUserGroups();
    };
    
    // Add event listener for invitation acceptance
    window.addEventListener('invitationAccepted', handleInvitationAccepted);
    
    // Cleanup
    return () => {
      window.removeEventListener('invitationAccepted', handleInvitationAccepted);
    };
  }, []);

  useEffect(() => {
    calculateStats();
  }, [groups]);

  const loadUserGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading groups...');
      
      // Get user's groups
      const response = await get('/groups/my-groups');
      console.log('📋 My groups response:', response);
      
      if (response && response.data) {
        setGroups(response.data || []);
        console.log(`✅ Loaded ${response.data.length} groups`);
      } else {
        console.log('⚠️ No groups data in response');
        setGroups([]);
      }
    } catch (error) {
      console.error('❌ Error loading groups:', error);
      setError(error.message || 'Failed to load groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await get('/users');
      if (response && response.data) {
        setAvailableUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setAvailableUsers([]);
    }
  };

  const calculateStats = () => {
    const totalGroups = groups.length;
    const totalMembers = groups.reduce((sum, group) => sum + (group.member_count || 0), 0);
    const activeTodos = groups.reduce((sum, group) => sum + (group.total_todos || 0), 0);
    const completedTodos = groups.reduce((sum, group) => sum + (group.completed_todos || 0), 0);
    
    setStats({
      totalGroups,
      totalMembers,
      activeTodos,
      completedTodos
    });
  };

  const handleCreateGroup = async (groupData) => {
    try {
      console.log('🔧 Creating group:', groupData);
      
      // Ensure all required fields are present
      if (!groupData.name || !groupData.description || !groupData.category) {
        setError('Name, description, and category are required');
        return;
      }
      
      const response = await post('/groups', {
        name: groupData.name,
        description: groupData.description,
        category: groupData.category,
        settings: groupData.settings || {}
      });
      
      if (response && response.data && response.data.group) {
        const newGroup = response.data.group;
        setGroups(prev => [newGroup, ...prev]);
        setShowCreateGroup(false);
        console.log('✅ Group created successfully');
        setError(null);
        
        // Handle invites if provided
        if (groupData.invites) {
          try {
            const { emails, selectedUsers, role, message } = groupData.invites;
            
            // Send email invites
            if (emails && emails.length > 0) {
              await inviteUsers(newGroup.id, emails, role, message);
            }
            
            // Send user invites
            if (selectedUsers && selectedUsers.length > 0) {
              // Get user emails for selected users
              const userEmails = selectedUsers.map(userId => {
                const user = availableUsers.find(u => u.id === userId);
                return user?.email;
              }).filter(Boolean);
              
              if (userEmails.length > 0) {
                await inviteUsers(newGroup.id, userEmails, role, message);
              }
            }
            
            console.log('✅ Invitations sent successfully');
          } catch (inviteError) {
            console.error('⚠️ Error sending invitations:', inviteError);
            // Don't fail the group creation if invites fail
          }
        }
      } else {
        console.log('⚠️ Unexpected response format:', response);
        setError('Unexpected response format from server');
      }
    } catch (error) {
      console.error('❌ Error creating group:', error);
      setError(error.message || 'Failed to create group');
    }
  };

  // Invite functionality functions
  const loadPendingInvitations = async (groupId) => {
    try {
      const response = await get(`/groups/${groupId}/invitations`);
      if (response && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error loading invitations:', error);
      return [];
    }
  };

  const getInviteLink = async (groupId) => {
    try {
      const response = await get(`/groups/${groupId}/invite-link`);
      if (response && response.data) {
        return response.data.inviteLink;
      }
      return '';
    } catch (error) {
      console.error('Error getting invite link:', error);
      return '';
    }
  };

  const inviteUsers = async (groupId, emails, role = 'member', message = '') => {
    try {
      const response = await post(`/groups/${groupId}/invite`, {
        emails: Array.isArray(emails) ? emails : [emails],
        role,
        message
      });
      
      if (response && response.data) {
        console.log('✅ Invitations sent successfully');
        return response.data;
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      throw error;
    }
  };

  const handleInviteMembers = (group) => {
    setSelectedGroup(group);
    setShowInviteModal(true);
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await del(`/groups/${groupId}`);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      console.log('✅ Group deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting group:', error);
      setError(error.message || 'Failed to delete group');
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
        
        // Refresh groups to show updated data
        loadUserGroups();
      }
      
      setShowPomodoro(false);
      setActivePomodoroTodo(null);
    } catch (error) {
      console.error('❌ Error updating pomodoro session:', error);
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || group.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'study', 'project', 'work', 'hobby', 'personal'];

  const getCategoryColor = (category) => {
    switch (category) {
      case 'study': return 'bg-blue-100 text-blue-800';
      case 'project': return 'bg-purple-100 text-purple-800';
      case 'work': return 'bg-green-100 text-green-800';
      case 'hobby': return 'bg-yellow-100 text-yellow-800';
      case 'personal': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'member': return <UserCheck className="w-4 h-4 text-gray-500" />;
      default: return <UserCheck className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (error && groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Groups</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadUserGroups}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-3 text-blue-500" />
            Group Todos
          </h2>
            <p className="text-gray-600 mt-1">
            Collaborate with your team on shared tasks and projects
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPomodoro(true)}
              className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Timer className="w-4 h-4 mr-2" />
              Pomodoro Timer
            </button>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalGroups}</div>
          <div className="text-sm text-blue-600">Total Groups</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.totalMembers}</div>
          <div className="text-sm text-green-600">Total Members</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.activeTodos}</div>
          <div className="text-sm text-yellow-600">Active Todos</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.completedTodos}</div>
          <div className="text-sm text-purple-600">Completed</div>
        </div>
      </div>
    </div>

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

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
              placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {/* Refresh button */}
          <button
            onClick={() => {
              console.log('🔄 Manual refresh...');
              loadUserGroups();
            }}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh groups"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Groups Display */}
      {groups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Yet</h3>
          <p className="text-gray-600 mb-6">Create your first group to start collaborating on tasks</p>
                <button
                  onClick={() => setShowCreateGroup(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
            <Plus className="w-5 h-5 mr-2" />
                  Create Your First Group
                </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          <AnimatePresence>
              {filteredGroups.map((group) => (
              <motion.div
                  key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer ${
                  viewMode === 'list' ? 'p-4' : 'p-6'
                }`}
                  onClick={() => setSelectedGroup(group)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      {getRoleIcon(group.role)}
                      {group.access_type === 'invitation' && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Invitation Accepted
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(group.category)}`}>
                        {group.category}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {group.member_count || 0} members
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{group.total_todos > 0 ? Math.round((group.completed_todos / group.total_todos) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${group.total_todos > 0 ? (group.completed_todos / group.total_todos) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {group.completed_todos} of {group.total_todos} todos completed
                      </div>
                    </div>
                  </div>
            </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(group.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGroup(group);
                      }}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    >
                      View Group
                    </button>
                    
                    {(group.role === 'leader' || group.role === 'admin') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInviteMembers(group);
                        }}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                      >
                        Invite
                      </button>
                    )}
                    
                    {group.role === 'leader' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <CreateGroupForm
            isOpen={showCreateGroup}
            onSubmit={handleCreateGroup}
            onClose={() => setShowCreateGroup(false)}
          />
        )}
      </AnimatePresence>

      {/* Invite Members Modal */}
      <AnimatePresence>
        {showInviteModal && selectedGroup && (
          <InviteMembersModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            group={selectedGroup}
          />
        )}
      </AnimatePresence>

      {/* Group Detail Modal */}
      <AnimatePresence>
        {selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900">{selectedGroup.name}</h3>
                  {getRoleIcon(selectedGroup.role)}
                  <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(selectedGroup.category)}`}>
                    {selectedGroup.category}
          </span>
        </div>
          <button
                  onClick={() => setSelectedGroup(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
          >
                  <X className="w-6 h-6" />
          </button>
        </div>

              <GroupTodoManager 
                group={selectedGroup}
                onClose={() => setSelectedGroup(null)}
                onTodoCreated={onTodoCreated}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
          </div>
  );
};

export default GroupTodoIntegration; 