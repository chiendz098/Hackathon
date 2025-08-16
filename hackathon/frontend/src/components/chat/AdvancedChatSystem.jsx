import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Smile, Pin, Edit, Trash2, MoreVertical, Reply, Forward,
  Clock, Search, Users, Shield, Crown, Bell, Link, Eye, EyeOff,
  Calendar, Star, MessageSquare, UserPlus, UserMinus, VolumeX,
  Volume2, Ban, UserCheck, Settings, Filter, Download, Upload
} from 'lucide-react';
import socketManager from '../../utils/socketManager';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import useAutoScroll from '../../hooks/useAutoScroll';

const AdvancedChatSystem = ({ roomId, roomName, onClose }) => {
  const { get, post, put, delete: del } = useApi();
  const { user } = useAuth();
  
  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledContent, setScheduledContent] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [participants, setParticipants] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [showModeratorPanel, setShowModeratorPanel] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [muteDuration, setMuteDuration] = useState(30);
  const [banReason, setBanReason] = useState('');
  const [isPermanentBan, setIsPermanentBan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // Refs
  const messageInputRef = useRef();
  const fileInputRef = useRef();
  
  // Auto-scroll hook
  const { messagesEndRef, messagesContainerRef, scrollToBottom, forceScrollToBottom, handleScroll } = useAutoScroll(messages, {
    enabled: true,
    smooth: true,
    scrollOnMount: true,
    scrollOnNewMessage: true,
    delay: 100
  });
  
  // Emoji reactions
  const emojiReactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🙏', '🔥', '💯', '✨', '🎉', '🤔', '👀', '💪', '🚀', '💡', '🎯', '⭐', '🏆'];

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [roomId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load messages
      const messagesResponse = await get(`/api/chat/rooms/${roomId}/messages?limit=50`);
      if (messagesResponse?.success) {
        setMessages(messagesResponse.messages);
      }
      
      // Load pinned messages
      const pinnedResponse = await get(`/api/advanced-chat/rooms/${roomId}/pinned`);
      if (pinnedResponse?.success) {
        setPinnedMessages(pinnedResponse.pinnedMessages);
      }
      
      // Load scheduled messages
      const scheduledResponse = await get('/api/advanced-chat/messages/scheduled');
      if (scheduledResponse?.success) {
        setScheduledMessages(scheduledResponse.scheduledMessages);
      }
      
      // Load participants
      const participantsResponse = await get(`/api/chat/rooms/${roomId}/participants`);
      if (participantsResponse?.success) {
        setParticipants(participantsResponse.participants);
      }
      
      // Load moderators
      const moderatorsResponse = await get(`/api/advanced-chat/rooms/${roomId}/moderators`);
      if (moderatorsResponse?.success) {
        setModerators(moderatorsResponse.moderators);
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load chat data');
    } finally {
      setLoading(false);
    }
  };

  // Force scroll to bottom when messages are first loaded
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        forceScrollToBottom();
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, forceScrollToBottom]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const messageData = {
        content: newMessage,
        replyToId: replyTo?.id,
        mentions: extractMentions(newMessage)
      };
      
      const response = await post(`/api/chat/rooms/${roomId}/messages`, messageData);
      
      if (response?.success) {
        setNewMessage('');
        setReplyTo(null);
        messageInputRef.current?.focus();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Extract mentions from text
  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  // Handle message reactions
  const handleReaction = async (messageId, reaction) => {
    try {
      const response = await post(`/api/advanced-chat/messages/${messageId}/reactions`, { reaction });
      
      if (response?.success) {
        // Update message reactions in state
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            const updatedReactions = { ...msg.reactions };
            if (response.action === 'added') {
              updatedReactions[reaction] = (updatedReactions[reaction] || 0) + 1;
            } else if (response.action === 'removed') {
              updatedReactions[reaction] = Math.max(0, (updatedReactions[reaction] || 1) - 1);
            }
            return { ...msg, reactions: updatedReactions };
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  // Edit message
  const handleEditMessage = async (messageId, newContent) => {
    try {
      const response = await put(`/api/advanced-chat/messages/${messageId}`, { content: newContent });
      
      if (response?.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: newContent, isEdited: true, editedAt: new Date() }
            : msg
        ));
        setEditingMessage(null);
        toast.success('Message updated successfully');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const response = await del(`/api/chat/rooms/${roomId}/messages/${messageId}`);
      
      if (response?.success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast.success('Message deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Pin message
  const handlePinMessage = async (messageId) => {
    try {
      const response = await post(`/api/advanced-chat/messages/${messageId}/pin`);
      
      if (response?.success) {
        toast.success('Message pinned successfully');
        loadInitialData(); // Reload pinned messages
      }
    } catch (error) {
      console.error('Error pinning message:', error);
      toast.error('Failed to pin message');
    }
  };

  // Forward message
  const handleForwardMessage = async (messageId, targetRoomId) => {
    try {
      const response = await post(`/api/advanced-chat/messages/${messageId}/forward`, { targetRoomId });
      
      if (response?.success) {
        toast.success('Message forwarded successfully');
      }
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error('Failed to forward message');
    }
  };

  // Schedule message
  const handleScheduleMessage = async () => {
    if (!scheduledContent.trim() || !scheduledTime) return;
    
    try {
      const response = await post('/api/advanced-chat/messages/schedule', {
        roomId,
        content: scheduledContent,
        scheduledAt: scheduledTime
      });
      
      if (response?.success) {
        setScheduledContent('');
        setScheduledTime('');
        setShowScheduler(false);
        toast.success('Message scheduled successfully');
        loadInitialData(); // Reload scheduled messages
      }
    } catch (error) {
      console.error('Error scheduling message:', error);
      toast.error('Failed to schedule message');
    }
  };

  // Search messages
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await get(`/api/advanced-chat/messages/search?query=${encodeURIComponent(searchQuery)}&roomId=${roomId}`);
      
      if (response?.success) {
        setSearchResults(response.messages);
      }
    } catch (error) {
      console.error('Error searching messages:', error);
      toast.error('Failed to search messages');
    }
  };

  // Moderator actions
  const handleMuteUser = async (userId) => {
    try {
      const response = await post(`/api/advanced-chat/rooms/${roomId}/mute/${userId}`, {
        reason: banReason,
        duration: muteDuration
      });
      
      if (response?.success) {
        toast.success('User muted successfully');
        setSelectedUser(null);
        setBanReason('');
      }
    } catch (error) {
      console.error('Error muting user:', error);
      toast.error('Failed to mute user');
    }
  };

  const handleBanUser = async (userId) => {
    try {
      const response = await post(`/api/advanced-chat/rooms/${roomId}/ban/${userId}`, {
        reason: banReason,
        isPermanent: isPermanentBan
      });
      
      if (response?.success) {
        toast.success('User banned successfully');
        setSelectedUser(null);
        setBanReason('');
        setIsPermanentBan(false);
      }
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const handleUnmuteUser = async (userId) => {
    try {
      const response = await del(`/api/advanced-chat/rooms/${roomId}/mute/${userId}`);
      
      if (response?.success) {
        toast.success('User unmuted successfully');
      }
    } catch (error) {
      console.error('Error unmuting user:', error);
      toast.error('Failed to unmute user');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      const response = await del(`/api/advanced-chat/rooms/${roomId}/ban/${userId}`);
      
      if (response?.success) {
        toast.success('User unbanned successfully');
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Failed to unban user');
    }
  };

  // Check if user is moderator
  const isModerator = moderators.some(mod => mod.user.id === user?.id);
  const isAdmin = moderators.some(mod => mod.user.id === user?.id && mod.role === 'admin');

  // Render message with all features
  const renderMessage = (message) => {
    const isOwnMessage = message.senderId === user?.id;
    const canEdit = isOwnMessage || isModerator;
    const canDelete = isOwnMessage || isModerator;
    const canPin = isModerator;

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${
          isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
        }`}>
          {/* Reply indicator */}
          {message.replyTo && (
            <div className="text-xs opacity-75 mb-1 border-l-2 pl-2">
              Replying to: {message.replyTo.content.substring(0, 50)}...
            </div>
          )}
          
          {/* Message content */}
          <div className="flex items-start space-x-2">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium">
                  {message.sender?.name || 'Unknown'}
                </span>
                <span className="text-xs opacity-75">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
                {message.isEdited && (
                  <span className="text-xs opacity-75">(edited)</span>
                )}
                {message.isForwarded && (
                  <span className="text-xs opacity-75">(forwarded)</span>
                )}
              </div>
              
              {editingMessage === message.id ? (
                <div className="space-y-2">
                  <textarea
                    defaultValue={message.content}
                    className="w-full p-2 text-sm border rounded bg-white text-gray-900"
                    rows="3"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleEditMessage(message.id, e.target.value);
                      }
                      if (e.key === 'Escape') {
                        setEditingMessage(null);
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditMessage(message.id, document.querySelector(`textarea[data-message-id="${message.id}"]`).value)}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMessage(null)}
                      className="text-xs bg-gray-500 text-white px-2 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              )}
              
              {/* Link preview */}
              {message.linkPreview && (
                <div className="mt-2 p-2 bg-white bg-opacity-10 rounded">
                  <div className="text-xs font-medium">{message.linkPreview.title}</div>
                  <div className="text-xs opacity-75">{message.linkPreview.description}</div>
                </div>
              )}
              
              {/* Reactions */}
              {message.reactions && Object.keys(message.reactions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(message.reactions).map(([reaction, count]) => (
                    <button
                      key={reaction}
                      onClick={() => handleReaction(message.id, reaction)}
                      className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
                    >
                      {reaction} {count}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Message actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex space-x-1">
                {canEdit && (
                  <button
                    onClick={() => setEditingMessage(message.id)}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                {canPin && (
                  <button
                    onClick={() => handlePinMessage(message.id)}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => setReplyTo(message)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <Reply className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleForwardMessage(message.id)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <Forward className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">{roomName}</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{participants.length} participants</span>
              <span>•</span>
              <span>{onlineUsers.size} online</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isModerator && (
              <button
                onClick={() => setShowModeratorPanel(!showModeratorPanel)}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowScheduler(!showScheduler)}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              <Clock className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        </div>

        {/* Pinned messages */}
        {pinnedMessages.length > 0 && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-2">
            <div className="flex items-center space-x-2 text-sm text-yellow-800">
              <Pin className="w-4 h-4" />
              <span className="font-medium">Pinned Messages:</span>
            </div>
            <div className="mt-1 space-y-1">
              {pinnedMessages.slice(0, 3).map((pinned) => (
                <div key={pinned.messageId} className="text-xs text-yellow-700 truncate">
                  {pinned.message.content}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Main chat area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4"
              ref={messagesContainerRef}
              onScroll={handleScroll}
            >
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply indicator */}
            {replyTo && (
              <div className="bg-gray-100 p-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span>Replying to: {replyTo.content.substring(0, 50)}...</span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <span className="text-xl">&times;</span>
                  </button>
                </div>
              </div>
            )}

            {/* Message input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-600 hover:text-gray-800"
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="1"
                  />
                  
                  {/* Emoji picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full mb-2 bg-white border rounded-lg shadow-lg p-2 grid grid-cols-10 gap-1">
                      {emojiReactions.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setNewMessage(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="p-1 hover:bg-gray-100 rounded text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-gray-200 flex flex-col">
            {/* Search results */}
            {showSearch && (
              <div className="p-4 border-b border-gray-200">
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search messages..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm"
                    >
                      Search
                    </button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="p-2 bg-gray-50 rounded text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            // Scroll to message
                            const messageElement = document.querySelector(`[data-message-id="${result.id}"]`);
                            messageElement?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <div className="font-medium">{result.sender?.name}</div>
                          <div className="text-gray-600 truncate">{result.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scheduled messages */}
            {showScheduler && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium mb-2">Schedule Message</h3>
                <div className="space-y-2">
                  <textarea
                    value={scheduledContent}
                    onChange={(e) => setScheduledContent(e.target.value)}
                    placeholder="Message content..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    rows="3"
                  />
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleScheduleMessage}
                    disabled={!scheduledContent.trim() || !scheduledTime}
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            )}

            {/* Moderator panel */}
            {showModeratorPanel && isModerator && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium mb-2">Moderator Panel</h3>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                          {participant.name?.charAt(0)}
                        </div>
                        <span className="text-sm">{participant.name}</span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setSelectedUser(participant)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User actions modal */}
            {selectedUser && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <div className="bg-white rounded-lg p-4 w-80">
                  <h3 className="font-medium mb-4">Actions for {selectedUser.name}</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleMuteUser(selectedUser.id)}
                      className="w-full px-3 py-2 bg-yellow-500 text-white rounded text-sm flex items-center justify-center space-x-2"
                    >
                      <VolumeX className="w-4 h-4" />
                      <span>Mute User</span>
                    </button>
                    <button
                      onClick={() => handleBanUser(selectedUser.id)}
                      className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm flex items-center justify-center space-x-2"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Ban User</span>
                    </button>
                    <button
                      onClick={() => handleUnbanUser(selectedUser.id)}
                      className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm flex items-center justify-center space-x-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Unban User</span>
                    </button>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="w-full px-3 py-2 bg-gray-500 text-white rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdvancedChatSystem; 