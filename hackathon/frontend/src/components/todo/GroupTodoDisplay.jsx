import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  UserPlus,
  Bell,
  CheckSquare,
  X,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

const GroupTodoDisplay = () => {
  const { get, post, put, del } = useApi();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupTodos, setGroupTodos] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user's groups
      const groupsResponse = await get('/group-system/groups');
      if (groupsResponse?.success) {
        setGroups(groupsResponse.groups);
      }
      
      // Load pending invitations
      const invitationsResponse = await get('/group-system/invitations/pending');
      if (invitationsResponse?.success) {
        setPendingInvitations(invitationsResponse.invitations);
      }
      
      // Load notifications
      const notificationsResponse = await get('/group-system/notifications?unreadOnly=true');
      if (notificationsResponse?.success) {
        setNotifications(notificationsResponse.notifications);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = async (group) => {
    setSelectedGroup(group);
    try {
      const response = await get(`/group-system/groups/${group.id}/todos`);
      if (response?.success) {
        setGroupTodos(response.todos);
      }
    } catch (error) {
      console.error('Error loading group todos:', error);
    }
  };

  const handleInvitationResponse = async (invitationId, response) => {
    try {
      const result = await post(`/group-system/invitations/${invitationId}/respond`, { response });
      if (result?.success) {
        // Remove from pending invitations
        setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        
        // If accepted, reload groups
        if (response === 'accept') {
          loadData();
        }
        
        // Show success message
        console.log(`Invitation ${response}ed successfully`);
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await put(`/group-system/notifications/${notificationId}/read`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const filteredTodos = groupTodos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         todo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || todo.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading group system...</p>
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
              Group Todo System
            </h2>
            <p className="text-gray-600 mt-1">
              Manage your group collaborations and tasks
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-sm text-yellow-600">Group Todos</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{notifications.length}</div>
            <div className="text-sm text-purple-600">Unread Notifications</div>
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

      {/* Groups and Todos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
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
                >
                  Create Your First Group
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => handleGroupSelect(group)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedGroup?.id === group.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <p className="text-sm text-gray-600">{group.description}</p>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            group.user_role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            group.user_role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {group.user_role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Group Todos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedGroup ? `${selectedGroup.name} - Todos` : 'Select a Group'}
              </h3>
              
              {selectedGroup && (
                <button
                  onClick={() => {/* TODO: Open create todo modal */}}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Todo
                </button>
              )}
            </div>

            {!selectedGroup ? (
              <div className="text-center py-12">
                <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Group Selected</h4>
                <p className="text-gray-600">Select a group from the left to view its todos</p>
              </div>
            ) : (
              <>
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
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
                  </div>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                {/* Todos List */}
                {filteredTodos.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No todos found in this group</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTodos.map((todo) => (
                      <div key={todo.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">{todo.title}</h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                todo.status === 'completed' ? 'bg-green-100 text-green-800' :
                                todo.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                todo.status === 'overdue' ? 'bg-red-100 text-red-800' :
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
                              {todo.assignments.length > 0 && (
                                <span className="flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  {todo.assignments.length} assigned
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-blue-500" />
            Recent Notifications ({notifications.length})
          </h3>
          
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{notification.title}</h4>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                
                <button
                  onClick={() => markNotificationRead(notification.id)}
                  className="p-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupTodoDisplay; 