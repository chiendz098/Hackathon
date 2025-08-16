import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import useApi from '../../hooks/useApi';
import { Users, MessageCircle, Edit3, Eye, Save, Send, MoreVertical, User, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useAutoScroll from '../../hooks/useAutoScroll';

const RealTimeCollaboration = ({ todo, groupId }) => {
  const { user } = useAuth();
  const { get, post } = useApi();
  const [activeUsers, setActiveUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [collaborationMode, setCollaborationMode] = useState('view'); // view, edit, comment
  const [presenceData, setPresenceData] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  
  // Auto-scroll hook
  const { messagesEndRef, messagesContainerRef, scrollToBottom, forceScrollToBottom, handleScroll } = useAutoScroll(messages, {
    enabled: true,
    smooth: true,
    scrollOnMount: true,
    scrollOnNewMessage: true,
    delay: 100
  });

  useEffect(() => {
    if (todo) {
      setEditContent(todo.description || '');
      fetchCollaborationData();
      setupRealTimeConnection();
    }
  }, [todo, groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCollaborationData = async () => {
    try {
      const [usersResponse, messagesResponse] = await Promise.all([
        get(`/api/groupTodo/groups/${groupId}/todos/${todo.id}/active-users`),
        get(`/api/groupTodo/groups/${groupId}/todos/${todo.id}/messages`)
      ]);

      if (usersResponse.success) setActiveUsers(usersResponse.users);
      if (messagesResponse.success) setMessages(messagesResponse.messages);
    } catch (error) {
      console.error('Error fetching collaboration data:', error);
    }
  };

  const setupRealTimeConnection = () => {
    // Simulate real-time updates for demo
    const interval = setInterval(() => {
      // Update presence data
      setPresenceData(prev => ({
        ...prev,
        [user.id]: {
          lastSeen: new Date(),
          status: 'online',
          currentAction: isEditing ? 'editing' : 'viewing'
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
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

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await post(`/api/groupTodo/groups/${groupId}/todos/${todo.id}/messages`, {
        content: newMessage,
        type: 'message'
      });

      if (response.success) {
        setMessages(prev => [...prev, response.message]);
        setNewMessage('');
        toast.success('Message sent!');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setCollaborationMode('edit');
    setEditContent(todo.description || '');
    
    // Notify other users
    setPresenceData(prev => ({
      ...prev,
      [user.id]: {
        ...prev[user.id],
        currentAction: 'editing'
      }
    }));
  };

  const handleSaveEdit = async () => {
    try {
      const response = await post(`/api/groupTodo/groups/${groupId}/todos/${todo.id}`, {
        description: editContent
      });

      if (response.success) {
        setIsEditing(false);
        setCollaborationMode('view');
        toast.success('Changes saved!');
        
        // Notify other users
        setPresenceData(prev => ({
          ...prev,
          [user.id]: {
            ...prev[user.id],
            currentAction: 'viewing'
          }
        }));
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCollaborationMode('view');
    setEditContent(todo.description || '');
    
    setPresenceData(prev => ({
      ...prev,
      [user.id]: {
        ...prev[user.id],
        currentAction: 'viewing'
      }
    }));
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setTypingUsers(prev => {
      if (!prev.includes(user.id)) {
        return [...prev, user.id];
      }
      return prev;
    });

    typingTimeoutRef.current = setTimeout(() => {
      setTypingUsers(prev => prev.filter(id => id !== user.id));
    }, 3000);
  };

  const getPresenceColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'editing': return <Edit3 className="w-4 h-4 text-blue-500" />;
      case 'viewing': return <Eye className="w-4 h-4 text-green-500" />;
      case 'commenting': return <MessageCircle className="w-4 h-4 text-purple-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Real-Time Collaboration</h3>
              <p className="text-sm text-gray-600">Work together in real-time</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {activeUsers.length} active users
            </span>
            <div className="flex -space-x-2">
              {activeUsers.slice(0, 3).map((activeUser, index) => (
                <div
                  key={activeUser.id}
                  className="relative w-8 h-8 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center"
                >
                  <span className="text-xs font-medium text-gray-700">
                    {activeUser.username?.charAt(0).toUpperCase()}
                  </span>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getPresenceColor(activeUser.status)}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Main Content Area */}
        <div className="lg:col-span-2 p-4 border-r border-gray-200">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Todo Content</h4>
              <div className="flex items-center space-x-2">
                {collaborationMode === 'edit' ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleStartEditing}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  handleTyping();
                }}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Edit todo description..."
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[8rem]">
                {todo.description || 'No description available'}
              </div>
            )}
          </div>

          {/* Active Users Status */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h5 className="font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Active Users</span>
            </h5>
            <div className="space-y-2">
              {Object.entries(presenceData).map(([userId, data]) => {
                const userData = activeUsers.find(u => u.id === parseInt(userId));
                if (!userData) return null;
                
                return (
                  <div key={userId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getPresenceColor(data.status)}`} />
                      <span className="font-medium text-gray-900">
                        {userData.username}
                      </span>
                      {getActionIcon(data.currentAction)}
                    </div>
                    <span className="text-gray-500 text-xs">
                      {new Date(data.lastSeen).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="p-4">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Live Chat</span>
            </h4>
            
            {/* Messages */}
            <div 
              className="h-64 overflow-y-auto space-y-3 mb-3"
              ref={messagesContainerRef}
              onScroll={handleScroll}
            >
              {messages.map((message, index) => {
                // Handle both user_id and userId field names from backend
                const messageUserId = message.user_id || message.userId;
                
                return (
                  <motion.div
                    key={message.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${messageUserId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${messageUserId === user?.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-3 py-2`}>
                      <div className="text-xs opacity-75 mb-1">
                        {messageUserId === user?.id ? 'You' : message.username}
                      </div>
                      <div className="text-sm">{message.content}</div>
                    </div>
                  </motion.div>
                );
              })}
              
              {typingUsers.length > 0 && (
                <div className="text-xs text-gray-500 italic">
                  {typingUsers.length === 1 ? 'Someone is typing...' : 'Multiple people are typing...'}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeCollaboration; 