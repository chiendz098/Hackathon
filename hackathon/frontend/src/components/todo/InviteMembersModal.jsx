import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  UserPlus, 
  Search, 
  Users, 
  Mail, 
  Copy,
  CheckCircle,
  AlertCircle,
  Send,
  User,
  Crown,
  Shield,
  Star,
  Clock
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

const InviteMembersModal = ({ isOpen, onClose, group }) => {
  const groupId = group?.id;
  const { get, post } = useApi();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && groupId) {
      loadAvailableUsers();
      loadPendingInvites();
    }
  }, [isOpen, groupId]);

  const loadAvailableUsers = async () => {
    try {
      setLoading(true);
      // Get users who are not in the group
      const response = await get(`/groups/${groupId}/available-users${searchQuery ? `?search=${searchQuery}` : ''}`);
      if (response && response.data) {
        console.log('🔍 Debug: Raw available users response:', response.data);
        // Filter out users with null or undefined username/email to prevent errors
        const validUsers = response.data.filter(user => {
          const isValid = user && user.username && user.email && 
            typeof user.username === 'string' && 
            typeof user.email === 'string';
          if (!isValid) {
            console.warn('⚠️ Warning: Skipping invalid user:', user);
          }
          return isValid;
        });
        console.log('🔍 Debug: Filtered valid users:', validUsers);
        setAvailableUsers(validUsers);
      }
    } catch (error) {
      console.error('Error loading available users:', error);
      setAvailableUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvites = async () => {
    try {
      // Get pending invites for the group
      const response = await get(`/groups/${groupId}/invitations`);
      if (response && response.data) {
        console.log('🔍 Debug: Raw pending invites response:', response.data);
        // Filter out invites with null or undefined required fields
        const validInvites = response.data.filter(invite => {
          const isValid = invite && invite.id && invite.status;
          if (!isValid) {
            console.warn('⚠️ Warning: Skipping invalid invite:', invite);
          }
          return isValid;
        });
        console.log('🔍 Debug: Filtered valid invites:', validInvites);
        setPendingInvites(validInvites);
      }
    } catch (error) {
      console.error('Error loading pending invites:', error);
      setPendingInvites([]);
    }
  };

  const handleInviteByEmail = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail.trim() || !groupId) return;
    
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await post(`/groups/${groupId}/invite`, {
        emails: [inviteEmail],
        role: inviteRole,
        message: inviteMessage
      });
      
      if (response && response.data) {
        setPendingInvites(prev => [response.data.invite, ...prev]);
        setInviteEmail('');
        setInviteMessage('');
        setSuccessMessage(`Invite sent to ${inviteEmail}`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      setErrorMessage(error.message || 'Failed to send invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteUser = async (userId, role) => {
    try {
      const response = await post(`/groups/${groupId}/invite`, {
        userIds: [userId],
        role: role
      });
      
      if (response && response.data) {
        setPendingInvites(prev => [response.data.invite, ...prev]);
        setAvailableUsers(prev => prev.filter(user => user.id !== userId));
        setSuccessMessage('User invited successfully');
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      setErrorMessage(error.message || 'Failed to invite user');
    }
  };

  const handleCancelInvite = async (inviteId) => {
    try {
      await post(`/groups/${groupId}/invites/${inviteId}/cancel`);
      setPendingInvites(prev => prev.filter(invite => invite.id !== inviteId));
      setSuccessMessage('Invite cancelled successfully');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error cancelling invite:', error);
      setErrorMessage(error.message || 'Failed to cancel invite');
    }
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/groups/${groupId}/join`;
    navigator.clipboard.writeText(inviteLink);
    setSuccessMessage('Invite link copied to clipboard!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const filteredUsers = availableUsers.filter(user => {
    const searchLower = (searchQuery || '').toLowerCase();
    return (user?.username?.toLowerCase() || '').includes(searchLower) ||
           (user?.email?.toLowerCase() || '').includes(searchLower);
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Invite Members
                </h3>
                <p className="text-sm text-gray-600">
                  Add new members to your group
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800">{successMessage}</span>
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Invite by Email */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                Invite by Email
              </h4>
              
              <form onSubmit={handleInviteByEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="member">Member</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a personal message to your invitation..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending Invite...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Invite
                    </>
                  )}
                </button>
              </form>

              {/* Invite Link */}
              <div className="pt-4 border-t">
                <h5 className="font-medium text-gray-900 mb-3">Or Share Invite Link</h5>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/groups/${groupId}/join`}
                    readOnly
                    className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Available Users & Pending Invites */}
            <div className="space-y-6">
              {/* Available Users */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-green-500" />
                  Available Users
                </h4>
                
                <div className="mb-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No available users found</p>
                  ) : (
                    filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.username}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleInviteUser(user.id, 'member')}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Invite
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pending Invites */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  Pending Invites
                </h4>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {pendingInvites.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No pending invites</p>
                  ) : (
                    pendingInvites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{invite.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              invite.role === 'admin' ? 'bg-red-100 text-red-800' :
                              invite.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {invite.role}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(invite.sent_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelInvite(invite.id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InviteMembersModal; 