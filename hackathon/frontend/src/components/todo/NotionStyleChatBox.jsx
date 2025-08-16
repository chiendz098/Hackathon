import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Smile, 
  AtSign, 
  Hash, 
  MoreVertical,
  Image,
  File,
  Video,
  Mic,
  MicOff,
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
  FileText,
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
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import useAutoScroll from '../../hooks/useAutoScroll';

const NotionStyleChatBox = ({ groupId, members, darkMode }) => {
  const { user } = useAuth();
  const api = useApi();
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  
  // Auto-scroll hook
  const { messagesEndRef, messagesContainerRef, scrollToBottom, forceScrollToBottom, handleScroll } = useAutoScroll(messages, {
    enabled: chatSettings.autoScroll,
    smooth: true,
    scrollOnMount: true,
    scrollOnNewMessage: true,
    delay: 100
  });
  
  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [messageReactions, setMessageReactions] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [editMessage, setEditMessage] = useState(null);
  const [showThread, setShowThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState({});
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [bookmarkedMessages, setBookmarkedMessages] = useState([]);
  const [messageSearch, setMessageSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [chatSettings, setChatSettings] = useState({
    notifications: true,
    sound: true,
    autoScroll: true,
    showTimestamps: true,
    showUserAvatars: true,
    compactMode: false,
    theme: 'default'
  });

  // WebSocket connection
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    if (groupId) {
      const websocket = new WebSocket(`${process.env.REACT_APP_WS_URL || 'ws://localhost:3001'}/chat/${groupId}`);
      
      websocket.onopen = () => {
        console.log('Connected to chat');
        setIsConnected(true);
        // Send user presence
        websocket.send(JSON.stringify({
          type: 'presence',
          userId: user.id,
          status: 'online'
        }));
      };
      
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      websocket.onclose = () => {
        console.log('Disconnected from chat');
        setIsConnected(false);
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      setWs(websocket);
      
      return () => {
        websocket.close();
      };
    }
  }, [groupId, user.id]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'message':
        setMessages(prev => [...prev, data.message]);
        break;
      case 'typing':
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          if (data.isTyping) {
            return [...filtered, { userId: data.userId, name: data.userName }];
          }
          return filtered;
        });
        break;
      case 'presence':
        setOnlineUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          if (data.status === 'online') {
            return [...filtered, { userId: data.userId, name: data.userName, status: data.status }];
          }
          return filtered;
        });
        break;
      case 'reaction':
        setMessageReactions(prev => ({
          ...prev,
          [data.messageId]: {
            ...prev[data.messageId],
            [data.reaction]: (prev[data.messageId]?.[data.reaction] || 0) + 1
          }
        }));
        break;
      case 'thread_reply':
        setThreadMessages(prev => ({
          ...prev,
          [data.parentMessageId]: [
            ...(prev[data.parentMessageId] || []),
            data.message
          ]
        }));
        break;
      default:
        break;
    }
  }, []);

  // Fetch chat history
  useEffect(() => {
    if (groupId) {
      fetchChatHistory();
    }
  }, [groupId]);

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

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatSettings.autoScroll) {
      scrollToBottom();
    }
  }, [messages, chatSettings.autoScroll]);

  // Filter messages based on search
  useEffect(() => {
    if (messageSearch.trim()) {
      const filtered = messages.filter(message =>
        message.content.toLowerCase().includes(messageSearch.toLowerCase()) ||
        (message.userName?.toLowerCase() || '').includes(messageSearch.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [messages, messageSearch]);

  // Fetch chat history
  const fetchChatHistory = async () => {
    try {
      const response = await api.get(`/groups/${groupId}/messages`);
      if (response.success) {
        setMessages(response.messages);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    
    try {
      const messageData = {
        content: newMessage,
        attachments: attachments,
        replyTo: replyTo?.id,
        threadId: replyTo?.threadId
      };
      
      if (ws && isConnected) {
        ws.send(JSON.stringify({
          type: 'message',
          data: messageData
        }));
      }
      
      // Optimistic update
      const tempMessage = {
        id: Date.now(),
        content: newMessage,
        attachments: attachments,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        timestamp: new Date().toISOString(),
        replyTo: replyTo,
        threadId: replyTo?.threadId
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      setAttachments([]);
      setReplyTo(null);
      
      // Clear typing indicator
      if (ws && isConnected) {
        ws.send(JSON.stringify({
          type: 'typing',
          isTyping: false
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle typing
  const handleTyping = useCallback((isTyping) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({
        type: 'typing',
        isTyping: isTyping
      }));
    }
  }, [ws, isConnected]);

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  // Remove attachment
  const removeAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Handle message reaction
  const handleReaction = (messageId, reaction) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({
        type: 'reaction',
        messageId: messageId,
        reaction: reaction
      }));
    }
  };

  // Handle reply
  const handleReply = (message) => {
    setReplyTo(message);
    setShowThread(null);
  };

  // Handle edit message
  const handleEditMessage = (message) => {
    setEditMessage(message);
    setNewMessage(message.content);
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await api.delete(`/groups/${groupId}/messages/${messageId}`);
      if (response.success) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Handle thread view
  const handleThreadView = (message) => {
    setShowThread(showThread === message.id ? null : message.id);
    if (!threadMessages[message.id]) {
      fetchThreadMessages(message.id);
    }
  };

  // Fetch thread messages
  const fetchThreadMessages = async (messageId) => {
    try {
      const response = await api.get(`/groups/${groupId}/messages/${messageId}/thread`);
      if (response.success) {
        setThreadMessages(prev => ({
          ...prev,
          [messageId]: response.messages
        }));
      }
    } catch (error) {
      console.error('Error fetching thread messages:', error);
    }
  };

  // Pin message
  const handlePinMessage = async (messageId) => {
    try {
      const response = await api.post(`/groups/${groupId}/messages/${messageId}/pin`);
      if (response.success) {
        setPinnedMessages(prev => [...prev, response.message]);
      }
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  // Bookmark message
  const handleBookmarkMessage = async (messageId) => {
    try {
      const response = await api.post(`/groups/${groupId}/messages/${messageId}/bookmark`);
      if (response.success) {
        setBookmarkedMessages(prev => [...prev, response.message]);
      }
    } catch (error) {
      console.error('Error bookmarking message:', error);
    }
  };

  // Search messages
  const handleMessageSearch = async () => {
    if (!messageSearch.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await api.get(`/groups/${groupId}/messages/search?q=${encodeURIComponent(messageSearch)}`);
      if (response.success) {
        setSearchResults(response.results);
      }
    } catch (error) {
      console.error('Error searching messages:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Scroll to bottom function is now provided by useAutoScroll hook

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // Get user status
  const getUserStatus = (userId) => {
    const onlineUser = onlineUsers.find(u => u.userId === userId);
    return onlineUser ? 'online' : 'offline';
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Chat header */}
      <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Group Chat</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {onlineUsers.length} online • {members.length} members
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Connection status */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
            isConnected 
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          {/* User list toggle */}
          <button
            onClick={() => setShowUserList(!showUserList)}
            className={`p-2 rounded-lg transition-colors ${
              showUserList 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
          </button>
          
          {/* Chat settings */}
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Chat content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 flex flex-col">
          {/* Search bar */}
          <div className={`p-3 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search messages..."
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          {/* Messages */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            ref={messagesContainerRef}
            onScroll={handleScroll}
          >
            <AnimatePresence>
              {filteredMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex space-x-3 ${(message.user_id || message.userId) === user.id ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  {/* User avatar */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        {message.userAvatar ? (
                          <img 
                            src={message.userAvatar} 
                            alt={message.userName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {message.userName.charAt(0)}
                          </span>
                        )}
                      </div>
                      {/* Online status indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 ${
                        darkMode ? 'border-gray-900' : 'border-white'
                      } ${
                        getUserStatus(message.user_id || message.userId) === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                  </div>

                  {/* Message content */}
                  <div className={`flex-1 max-w-xs lg:max-w-md ${(message.user_id || message.userId) === user.id ? 'text-right' : ''}`}>
                    {/* Reply indicator */}
                    {message.replyTo && (
                      <div className={`mb-1 text-xs text-gray-500 dark:text-gray-400 ${
                        (message.user_id || message.userId) === user.id ? 'text-right' : 'text-left'
                      }`}>
                        Replying to {message.replyTo.userName}
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div className={`inline-block px-4 py-2 rounded-lg ${
                      (message.user_id || message.userId) === user.id
                        ? 'bg-blue-600 text-white'
                        : darkMode 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center space-x-2">
                              {attachment.type.startsWith('image/') ? (
                                <img 
                                  src={attachment.preview || attachment.url} 
                                  alt={attachment.name}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              ) : (
                                <div className="flex items-center space-x-2 p-2 bg-gray-200 dark:bg-gray-600 rounded">
                                  <FileText className="w-4 h-4" />
                                  <span className="text-xs">{attachment.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Message metadata */}
                    <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${
                      (message.user_id || message.userId) === user.id ? 'text-right' : 'text-left'
                    }`}>
                      <span>{message.userName}</span>
                      <span className="mx-2">•</span>
                      <span>{formatTimestamp(message.timestamp)}</span>
                      
                      {/* Message actions */}
                      <div className={`inline-flex items-center space-x-1 ml-2 ${
                        (message.user_id || message.userId) === user.id ? 'justify-end' : 'justify-start'
                      }`}>
                        <button
                          onClick={() => handleReaction(message.id, '👍')}
                          className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                        >
                          👍
                        </button>
                        <button
                          onClick={() => handleReaction(message.id, '❤️')}
                          className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                        >
                          ❤️
                        </button>
                        <button
                          onClick={() => handleReply(message)}
                          className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                        >
                          Reply
                        </button>
                        {message.userId === user.id && (
                          <>
                            <button
                              onClick={() => handleEditMessage(message)}
                              className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="hover:bg-red-200 dark:hover:bg-red-900 rounded p-1 transition-colors text-red-600 dark:text-red-400"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handlePinMessage(message.id)}
                          className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                        >
                          📌
                        </button>
                        <button
                          onClick={() => handleBookmarkMessage(message.id)}
                          className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                        >
                          🔖
                        </button>
                        <button
                          onClick={() => handleThreadView(message)}
                          className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                        >
                          💬
                        </button>
                      </div>
                    </div>
                    
                    {/* Reactions */}
                    {messageReactions[message.id] && Object.keys(messageReactions[message.id]).length > 0 && (
                      <div className={`mt-1 flex flex-wrap gap-1 ${
                        message.userId === user.id ? 'justify-end' : 'justify-start'
                      }`}>
                        {Object.entries(messageReactions[message.id]).map(([reaction, count]) => (
                          <span
                            key={reaction}
                            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs"
                          >
                            {reaction} {count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex space-x-3"
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">?</span>
                </div>
                <div className="flex-1">
                  <div className="inline-block px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {typingUsers.map(u => u.name).join(', ')} typing...
                  </p>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            {/* Reply indicator */}
            {replyTo && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Replying to {replyTo.userName}
                  </span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                  {replyTo.content}
                </p>
              </div>
            )}
            
            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="relative">
                    {attachment.type.startsWith('image/') ? (
                      <img 
                        src={attachment.preview} 
                        alt={attachment.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-16">
                      {attachment.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Input area */}
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping(e.target.value.length > 0);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                
                {/* Emoji picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 z-10">
                    <div className="grid grid-cols-8 gap-1">
                      {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() && attachments.length === 0}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            />
          </div>
        </div>

        {/* User list sidebar */}
        {showUserList && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 280 }}
            exit={{ width: 0 }}
            className={`border-l ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}
          >
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Online Members</h4>
              <div className="space-y-2">
                {members.map((member) => {
                  const isOnline = onlineUsers.some(u => u.userId === member.id);
                  return (
                    <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          {member.avatar ? (
                            <img 
                              src={member.avatar} 
                              alt={member.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {member.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 ${
                          darkMode ? 'border-gray-800' : 'border-white'
                        } ${
                          isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NotionStyleChatBox; 