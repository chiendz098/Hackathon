import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useApi from '../../hooks/useApi';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, Smile, Mic, Video, Phone, MoreVertical, 
  Search, Edit3, Trash2, Reply, MessageSquare, Pin, Star, Forward,
  Clock, Eye, EyeOff, Download, Play, Pause, Volume2, VolumeX, MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import './RealTimeChat.css';
import './EnhancedChatFeatures.css';
import EnhancedChatFeatures from './EnhancedChatFeatures';
import useAutoScroll from '../../hooks/useAutoScroll';

const RealTimeChat = ({ 
  todoId, 
  groupId, 
  groupMembers = [], 
  initialMessages = [], 
  onMessageSent, 
  onTyping, 
  typingUsers: externalTypingUsers = [], 
  onlineUsers: externalOnlineUsers = [] 
}) => {
  const { user } = useAuth();
  const { get, post, put, delete: del } = useApi();
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(externalTypingUsers);
  const [onlineUsers, setOnlineUsers] = useState(externalOnlineUsers);
  const [showChat, setShowChat] = useState(true); // Always show for todo integration
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [fileUpload, setFileUpload] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callData, setCallData] = useState(null);
  
  // Advanced features state
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [threadMessage, setThreadMessage] = useState(null);
  const [showThread, setShowThread] = useState(false);
  const [threadMessages, setThreadMessages] = useState([]);
  const [scheduledTime, setScheduledTime] = useState('');
  const [selfDestructTime, setSelfDestructTime] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [starredMessages, setStarredMessages] = useState([]);
  
  // Enhanced features state
  const [moderators, setModerators] = useState([]);
  const [isModerator, setIsModerator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messageReactions, setMessageReactions] = useState({});
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(true);
  
  // Refs
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Auto-scroll hook
  const { messagesEndRef, messagesContainerRef, scrollToBottom, forceScrollToBottom, handleScroll } = useAutoScroll(messages, {
    enabled: true,
    smooth: true,
    scrollOnMount: true,
    scrollOnNewMessage: true,
    delay: 100
  });

  // Initialize WebSocket connection with enhanced features
  useEffect(() => {
    if (!user) return;

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'https://ai-learning-backend.loca.lt', {
      auth: {
        token: localStorage.getItem('token')
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    newSocket.on('connect', () => {
      console.log('🚀 Connected to enhanced chat server');
      newSocket.emit('authenticate', { 
        token: localStorage.getItem('token'),
        status: user.status || 'online',
        customStatus: user.customStatus
      });
    });

    newSocket.on('authenticated', (data) => {
      console.log('✅ Chat authenticated:', data);
      loadChatRooms();
      loadOnlineUsers();
    });

    // Enhanced message events
    newSocket.on('new_message', (data) => {
      if (data.groupId === groupId || data.roomId === currentRoom?.id || data.todoId === todoId) {
        // Add sender info if not present
        const messageWithSender = {
          ...data,
          sender: data.sender || data.user || {
            id: data.senderId || data.userId,
            name: user?.name || 'Unknown User',
            avatar: user?.avatar || '/default-avatar.png'
          }
        };
        setMessages(prev => [...prev, messageWithSender]);
        scrollToBottom();
      }
      updateRoomLastMessage(data.roomId || data.groupId || data.todoId, data);
    });

    newSocket.on('message_edited', (data) => {
      if (data.roomId === currentRoom?.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.message.id ? data.message : msg
        ));
      }
    });

    newSocket.on('message_deleted', (data) => {
      if (data.roomId === currentRoom?.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId ? { ...msg, isDeleted: true, content: '[Message deleted]' } : msg
        ));
      }
    });

    newSocket.on('message_self_destructed', (data) => {
      if (data.roomId === currentRoom?.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId ? { ...msg, isDeleted: true, content: '[Message expired]' } : msg
        ));
      }
    });

    // Enhanced typing indicators
    newSocket.on('user_typing', (data) => {
      if (data.groupId === groupId || data.roomId === currentRoom?.id || data.todoId === todoId) {
        setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
      }
    });

    newSocket.on('user_stopped_typing', (data) => {
      if (data.groupId === groupId || data.roomId === currentRoom?.id || data.todoId === todoId) {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      }
    });
    
    // Todo typing indicators from GroupTodoSocket
    newSocket.on('user-typing', (data) => {
      if (data.todoId === todoId) {
        setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), {
          userId: data.userId,
          name: data.userName || 'Someone',
          roomId: data.todoId
        }]);
      }
    });

    newSocket.on('user-typing', (data) => {
      if (data.todoId === todoId) {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      }
    });

    // Presence events
    newSocket.on('user_online', (data) => {
      setOnlineUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
    });

    newSocket.on('user_offline', (data) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    newSocket.on('presence:joined', (data) => {
      console.log('👋 User joined:', data);
      // Update online users list
      setOnlineUsers(prev => [...prev.filter(u => u.userId !== data.userId), {
        userId: data.userId,
        name: data.name,
        status: 'online'
      }]);
    });

    newSocket.on('presence:left', (data) => {
      console.log('👋 User left:', data);
      // Update online users list
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    newSocket.on('presence_changed', (data) => {
      if (data.roomId === currentRoom?.id) {
        setOnlineUsers(prev => prev.map(u => 
          u.userId === data.userId ? { ...u, status: data.status, customStatus: data.customStatus } : u
        ));
      }
    });

    // Message reactions
    newSocket.on('reaction_added', (data) => {
      if (data.roomId === currentRoom?.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, reactions: { ...msg.reactions, [data.reaction.emoji]: [...(msg.reactions[data.reaction.emoji] || []), data.reaction] } }
            : msg
        ));
      }
    });

    newSocket.on('reaction_removed', (data) => {
      if (data.roomId === currentRoom?.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.messageId 
            ? { 
                ...msg, 
                reactions: { 
                  ...msg.reactions, 
                  [data.emoji]: (msg.reactions[data.emoji] || []).filter(r => r.userId !== data.userId)
                }
              }
            : msg
        ));
      }
    });

    // Read receipts
    newSocket.on('messages_read', (data) => {
      if (data.roomId === currentRoom?.id) {
        setMessages(prev => prev.map(msg => 
          data.messageIds.includes(msg.id) 
            ? { ...msg, readAt: new Date() }
            : msg
        ));
      }
    });

    // Enhanced call events
    newSocket.on('call_offer', (data) => {
      handleIncomingCall(data);
    });

    newSocket.on('call_answer', (data) => {
      handleCallAnswer(data);
    });

    newSocket.on('call_ice', (data) => {
      handleCallIce(data);
    });

    newSocket.on('call_end', (data) => {
      handleCallEnd(data);
    });

    // Notifications
    newSocket.on('notification', (notification) => {
      toast(notification.message, {
        icon: notification.type === 'mention' ? '@' : '🔔',
        duration: 4000
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Initialize with todo data if provided
  useEffect(() => {
    if (todoId && groupId) {
      // Create a virtual room for the todo
      const todoRoom = {
        id: `todo_${todoId}`,
        name: `Task Discussion`,
        type: 'todo',
        todoId,
        groupId,
        participants: groupMembers,
        lastMessage: null
      };
      setCurrentRoom(todoRoom);
      setRooms([todoRoom]);
      
      // Set initial messages
      if (initialMessages.length > 0) {
        setMessages(initialMessages);
      }
      
      // Set online users from group members
      if (groupMembers.length > 0) {
        setOnlineUsers(groupMembers.map(member => ({
          userId: member.id,
          name: member.name,
          avatar: member.avatar,
          status: 'online',
          customStatus: ''
        })));
      }
      
      // Join the group room via socket
      if (socket && groupId) {
        socket.emit('joinGroup', groupId);
        console.log('🔌 Joined group room:', groupId);
      }
      
      // Join todo chat room via socket
      if (socket && todoId) {
        socket.emit('join-todo-chat', { todoId, groupId });
        console.log('🔌 Joined todo chat room:', todoId);
      }
    }
  }, [todoId, groupId, groupMembers, initialMessages, socket]);

  // Load chat rooms with enhanced data
  const loadChatRooms = async () => {
    try {
      const response = await get('/chat/rooms');
      if (response.success) {
        setRooms(response.rooms || []);
      }
    } catch (error) {
      console.error('❌ Error loading chat rooms:', error);
    }
  };

  // Load online users with enhanced status
  const loadOnlineUsers = async () => {
    try {
      const response = await get('/chat/users/online');
      if (response.success) {
        setOnlineUsers(response.users.map(user => ({
          ...user,
          status: user.status || 'online',
          customStatus: user.customStatus || '',
          lastSeen: user.lastSeen ? new Date(user.lastSeen) : null
        })));
      }
    } catch (error) {
      console.error('❌ Error loading online users:', error);
    }
  };

  // Enhanced presence management
  const updateUserStatus = async (status, customStatus = '') => {
    try {
      const response = await put('/chat/users/status', { status, customStatus });
      if (response.success) {
        socket?.emit('presence_update', { status, customStatus });
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
    }
  };

  // Load messages with advanced features
  const loadMessages = async (roomId, page = 1, threadId = null) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      });
      
      if (threadId) {
        params.append('threadId', threadId);
      }

      const response = await get(`/chat/rooms/${roomId}/messages?${params}`);
      if (response.success) {
        if (page === 1) {
          setMessages(response.messages || []);
        } else {
          setMessages(prev => [...response.messages || [], ...prev]);
        }
        scrollToBottom();
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    }
  };

  // Enhanced message sending with todo integration
  const sendMessage = async () => {
    if (!socket || !currentRoom || (!newMessage.trim() && !fileUpload && !recordingBlob)) return;

    try {
      const messageData = {
        groupId: groupId, // Use groupId instead of roomId
        content: newMessage.trim(),
        type: 'text',
        replyTo: replyToMessage?.id,
        scheduledAt: scheduledTime || null,
        selfDestructAt: selfDestructTime ? new Date(Date.now() + parseInt(selfDestructTime) * 60000) : null,
        mentions: extractMentions(newMessage.trim()),
        todoId: todoId, // Add todo ID for todo-specific messages
        roomId: currentRoom.id // Keep roomId for reference
      };

      if (fileUpload) {
        messageData.type = getFileType(fileUpload.type);
        messageData.attachments = [fileUpload];
        messageData.fileName = fileUpload.name;
      }

      if (recordingBlob) {
        messageData.type = 'voice';
        messageData.attachments = [recordingBlob];
        messageData.voiceDuration = Math.ceil(recordingBlob.size / 16000);
      }

      // Optimistic message
      const optimisticMessage = {
        id: `temp_${Date.now()}`,
        content: messageData.content,
        type: messageData.type,
        senderId: user.id,
        sender: { id: user.id, name: user.name, avatar: user.avatar },
        roomId: currentRoom.id,
        groupId: groupId, // Add groupId for consistency
        createdAt: new Date(),
        isOptimistic: true,
        replyTo: replyToMessage,
        attachments: messageData.attachments,
        fileName: messageData.fileName,
        voiceDuration: messageData.voiceDuration,
        todoId: todoId
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      setFileUpload(null);
      setRecordingBlob(null);
      setReplyToMessage(null);
      setScheduledTime('');
      setSelfDestructTime('');
      scrollToBottom();

      // Send via socket
      if (todoId) {
        // Send via GroupTodoSocket for todo messages
        socket.emit('todoMessage', {
          todoId: todoId,
          content: messageData.content,
          messageType: messageData.type,
          metadata: {
            replyTo: replyToMessage?.id,
            mentions: messageData.mentions,
            attachments: messageData.attachments
          }
        });
      } else {
        // Send via main namespace for group messages
        socket.emit('chat:message', messageData);
      }

      // Call parent callback if provided
      if (onMessageSent) {
        onMessageSent(messageData);
      }

      // Clear typing indicator
      setIsTyping(false);
      
      if (todoId) {
        // Send stop typing event to GroupTodoSocket
        socket.emit('todoStopTyping', { todoId: todoId });
      } else if (groupId) {
        // Send stop typing event to main namespace
        socket.emit('stopTyping', { groupId: groupId });
      }

      toast.success('💬 Message sent!');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Extract mentions from message
  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const user = onlineUsers.find(u => u.name?.toLowerCase().includes(username.toLowerCase()));
      if (user) {
        mentions.push(user.userId || user.id);
      }
    }
    
    return mentions;
  };

  // Get file type
  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  };

  // Enhanced typing indicators with better UX
  const handleTyping = useCallback(() => {
    if (!socket || (!groupId && !todoId)) return;

    setIsTyping(true);
    
    if (todoId) {
      // Send typing event to GroupTodoSocket
      socket.emit('todoTyping', { todoId: todoId });
    } else if (groupId) {
      // Send typing event to main namespace
      socket.emit('typing', { groupId: groupId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      
      if (todoId) {
        // Send stop typing event to GroupTodoSocket
        socket.emit('todoStopTyping', { todoId: todoId });
      } else if (groupId) {
        // Send stop typing event to main namespace
        socket.emit('stopTyping', { groupId: groupId });
      }
    }, 1500); // Increased timeout for better UX
  }, [socket, groupId, todoId]);

  // Voice recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordingBlob(event.data);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      toast.success('🎤 Recording started');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast.success('🎤 Recording stopped');
    }
  };

  // Message reactions
  const addReaction = async (messageId, emoji) => {
    try {
      const response = await post(`/chat/messages/${messageId}/reactions`, { emoji });
      if (response.success) {
        toast.success(`Added ${emoji} reaction`);
      }
    } catch (error) {
      console.error('❌ Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const removeReaction = async (messageId, emoji) => {
    try {
      const response = await del(`/chat/messages/${messageId}/reactions/${emoji}`);
      if (response.success) {
        toast.success(`Removed ${emoji} reaction`);
      }
    } catch (error) {
      console.error('❌ Error removing reaction:', error);
      toast.error('Failed to remove reaction');
    }
  };

  // Message actions
  const handleReply = (message) => {
    setReplyToMessage(message);
    const senderName = (message.sender || message.user)?.name || 'Unknown User';
    setNewMessage(`@${senderName} `);
    searchInputRef.current?.focus();
  };

  const handleThread = async (message) => {
    setThreadMessage(message);
    setShowThread(true);
    
    try {
      const response = await get(`/chat/messages/${message.id}/thread`);
      if (response.success) {
        setThreadMessages(response.messages || []);
      }
    } catch (error) {
      console.error('❌ Error loading thread:', error);
    }
  };

  const handleEdit = async (messageId, newContent) => {
    try {
      const response = await put(`/chat/messages/${messageId}`, { content: newContent });
      if (response.success) {
        toast.success('Message edited successfully');
      }
    } catch (error) {
      console.error('❌ Error editing message:', error);
      toast.error('Failed to edit message');
    }
  };

  const handleDelete = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        const response = await del(`/chat/messages/${messageId}`);
        if (response.success) {
          toast.success('Message deleted successfully');
        }
      } catch (error) {
        console.error('❌ Error deleting message:', error);
        toast.error('Failed to delete message');
      }
    }
  };

  // Enhanced video call functionality
  const startCall = async (callType = 'video') => {
    if (!socket || !currentRoom) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: callType === 'video', 
        audio: true 
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

      setCallData({
        peerConnection,
        stream,
        callType,
        isInitiator: true
      });

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Add ICE candidate handling
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('call_ice_candidate', {
            toUserId: currentRoom.participants.find(p => (p.userId || p.id) !== user.id)?.userId || currentRoom.participants.find(p => (p.userId || p.id) !== user.id)?.id,
            candidate: event.candidate,
            roomId: currentRoom.id
          });
        }
      };

      socket.emit('call_offer', {
        toUserId: currentRoom.participants.find(p => (p.userId || p.id) !== user.id)?.userId || currentRoom.participants.find(p => (p.userId || p.id) !== user.id)?.id,
        offer: peerConnection.localDescription,
        roomId: currentRoom.id,
        callType
      });

      setIsInCall(true);
      toast.success(`📞 Starting ${callType} call...`);
    } catch (error) {
      console.error('❌ Error starting call:', error);
      toast.error('Failed to start call');
    }
  };

  const handleIncomingCall = (data) => {
    const accept = window.confirm(`${data.fromName} is calling you. Accept?`);
    
    if (accept) {
      // Handle call acceptance
      navigator.mediaDevices.getUserMedia({ 
        video: data.callType === 'video', 
        audio: true 
      }).then(stream => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        // Add ICE candidate handling
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('call_ice_candidate', {
              toUserId: data.fromUserId,
              candidate: event.candidate,
              sessionId: data.sessionId
            });
          }
        };

        setCallData({
          peerConnection,
          stream,
          callType: data.callType,
          isInitiator: false
        });

        peerConnection.setRemoteDescription(data.offer)
          .then(() => peerConnection.createAnswer())
          .then(answer => peerConnection.setLocalDescription(answer))
          .then(() => {
            socket.emit('call_answer', {
              toUserId: data.fromUserId,
              answer: peerConnection.localDescription,
              sessionId: data.sessionId
            });
          });

        setIsInCall(true);
      });
    } else {
      // Reject call
      socket.emit('call_end', { sessionId: data.sessionId });
    }
  };

  const handleCallAnswer = (data) => {
    if (callData?.peerConnection) {
      callData.peerConnection.setRemoteDescription(data.answer);
    }
  };

  const handleCallIce = (data) => {
    if (callData?.peerConnection) {
      callData.peerConnection.addIceCandidate(data.candidate);
    }
  };

  const handleCallEnd = () => {
    if (callData?.stream) {
      callData.stream.getTracks().forEach(track => track.stop());
    }
    if (callData?.peerConnection) {
      callData.peerConnection.close();
    }
    setCallData(null);
    setIsInCall(false);
    toast.success('📞 Call ended');
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

  const updateRoomLastMessage = (roomId, message) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, lastMessage: message, lastActivity: new Date() }
        : room
    ));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File size must be less than 20MB');
        return;
      }
      setFileUpload(file);
    }
  };

  const removeFile = () => {
    setFileUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Search functionality
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await get(`/chat/search?query=${encodeURIComponent(query)}`);
      if (response.success) {
        setSearchResults(response.messages || []);
      }
    } catch (error) {
      console.error('❌ Error searching messages:', error);
    }
  };

  // Emoji picker
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '👺', '👹', '👿', '😈', '🤡', '👹', '👺', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬', '🗨️', '🗯️', '💭', '💤'];
  
  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // GIF search functionality
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifResults, setGifResults] = useState([]);
  const [showGifSearch, setShowGifSearch] = useState(false);

  const searchGifs = async (query) => {
    if (!query.trim()) return;
    
    try {
      // You can integrate with GIPHY API here
      // For now, we'll use a mock response
      const mockGifs = [
        { id: 1, url: 'https://media.giphy.com/media/example1.gif', title: 'Funny GIF 1' },
        { id: 2, url: 'https://media.giphy.com/media/example2.gif', title: 'Funny GIF 2' },
        { id: 3, url: 'https://media.giphy.com/media/example3.gif', title: 'Funny GIF 3' },
      ];
      setGifResults(mockGifs);
    } catch (error) {
      console.error('❌ Error searching GIFs:', error);
    }
  };

  const selectGif = (gif) => {
    setNewMessage(prev => prev + ` [GIF: ${gif.title}]`);
    setShowGifSearch(false);
    setGifSearchQuery('');
  };

  // Message reactions
  const toggleReaction = async (messageId, emoji) => {
    try {
      const response = await post(`/chat/messages/${messageId}/reactions/${emoji}`);
      if (response.success) {
        toast.success(`Added ${emoji} reaction`);
      }
    } catch (error) {
      console.error('❌ Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  // Message pinning
  const togglePin = async (messageId) => {
    try {
      const response = await post(`/chat/messages/${messageId}/pin`);
      if (response.success) {
        toast.success('Message pinned!');
        setPinnedMessages(prev => [...prev, messageId]);
      }
    } catch (error) {
      console.error('❌ Error pinning message:', error);
      toast.error('Failed to pin message');
    }
  };

  // Message starring
  const toggleStar = async (messageId) => {
    try {
      const response = await post(`/chat/messages/${messageId}/star`);
      if (response.success) {
        toast.success('Message starred!');
        setStarredMessages(prev => [...prev, messageId]);
      }
    } catch (error) {
      console.error('❌ Error starring message:', error);
      toast.error('Failed to star message');
    }
  };

  // Message forwarding
  const handleForward = async (message) => {
    const forwardMessage = prompt('Enter message to forward:', message.content);
    if (forwardMessage) {
      try {
        const response = await post(`/chat/messages/${message.id}/forward`, { content: forwardMessage });
        if (response.success) {
          toast.success('Message forwarded!');
          loadMessages(currentRoom.id); // Reload messages to show forwarded message
        }
      } catch (error) {
        console.error('❌ Error forwarding message:', error);
        toast.error('Failed to forward message');
      }
    }
  };

  // Download file
  const downloadFile = async (url, filename) => {
    try {
      const response = await get(url);
      if (response.success) {
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('File downloaded!');
      }
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  // Advanced Chat Feature Handlers
  const handleReaction = async (messageId, reaction) => {
    try {
      const response = await post(`/advanced-chat/messages/${messageId}/reactions`, { reaction });
      if (response.success) {
        // Update local message reactions
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            const updatedReactions = { ...msg.reactions } || {};
            if (!updatedReactions[reaction]) {
              updatedReactions[reaction] = [];
            }
            const existingReaction = updatedReactions[reaction].find(r => r.userId === user.id);
            if (existingReaction) {
              updatedReactions[reaction] = updatedReactions[reaction].filter(r => r.userId !== user.id);
            } else {
              updatedReactions[reaction].push({ userId: user.id, userName: user.name });
            }
            return { ...msg, reactions: updatedReactions };
          }
          return msg;
        }));
        toast.success(existingReaction ? 'Reaction removed!' : 'Reaction added!');
      }
    } catch (error) {
      console.error('❌ Error handling reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const handleSchedule = async (content, scheduledTime) => {
    try {
      const response = await post('/advanced-chat/messages/schedule', {
        content,
        scheduledTime,
        roomId: currentRoom?.id
      });
      if (response.success) {
        setScheduledTime('');
        toast.success('Message scheduled!');
      }
    } catch (error) {
      console.error('❌ Error scheduling message:', error);
      toast.error('Failed to schedule message');
    }
  };

  const handleMention = (content) => {
    // Extract mentions from content and notify mentioned users
    const mentions = content.match(/@(\w+)/g);
    if (mentions) {
      mentions.forEach(mention => {
        const username = mention.substring(1);
        // Notify mentioned user
        socket?.emit('mention', { username, roomId: currentRoom?.id });
      });
    }
  };

  const handleModeratorAction = async (action, targetUserId, roomId) => {
    try {
      const response = await post(`/advanced-chat/moderator/${action}`, {
        targetUserId,
        roomId
      });
      if (response.success) {
        toast.success(`${action} action completed!`);
        // Refresh room members or update UI accordingly
      }
    } catch (error) {
      console.error(`❌ Error performing ${action}:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  // Additional handlers for EnhancedChatFeatures
  const handlePin = async (messageId) => {
    try {
      const response = await post(`/advanced-chat/messages/${messageId}/pin`);
      if (response.success) {
        setPinnedMessages(prev => [...prev, messageId]);
        toast.success('Message pinned!');
      }
    } catch (error) {
      console.error('❌ Error pinning message:', error);
      toast.error('Failed to pin message');
    }
  };



  // Enhanced message rendering with all features
  const renderMessage = (message) => {
    // Handle different message structures (todo vs regular chat)
    const sender = message.sender || message.user;
    const senderName = sender?.name || 'Unknown User';
    const senderAvatar = sender?.avatar || '/default-avatar.png';
    const senderId = message.senderId || message.userId;
    
    const isOwnMessage = senderId === user.id;
    const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;
    const isEdited = message.editedAt;
    const isDeleted = message.isDeleted;
    const isPinned = message.isPinned;
    const isStarred = message.isStarred;

    return (
      <motion.div
        key={message.id}
        className={`message ${isOwnMessage ? 'own' : ''} ${isDeleted ? 'deleted' : ''} ${isPinned ? 'pinned' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        layout
      >
        {/* Pin indicator */}
        {isPinned && (
          <div className="pin-indicator">
            📌 Pinned message
          </div>
        )}

        {/* Star indicator */}
        {isStarred && (
          <div className="star-indicator">
            ⭐ Starred
          </div>
        )}

        <div className="message-content">
          <div className="message-header">
            <div className="sender-info">
              <img 
                src={senderAvatar}
                alt={senderName}
                className="sender-avatar"
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              <span className="sender-name">{senderName}</span>
              
              {/* Online status indicator */}
              <span className={`status-indicator ${onlineUsers.find(u => (u.userId || u.id) === senderId)?.status || 'offline'}`}>
                {onlineUsers.find(u => (u.userId || u.id) === senderId)?.status === 'online' ? '🟢' : '⚫'}
              </span>
            </div>
            
            <div className="message-meta">
              <span className="message-time">
                {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'Just now'}
              </span>
              {isEdited && (
                <span className="edited-indicator">✏️ edited</span>
              )}
              {isDeleted && (
                <span className="deleted-indicator">🗑️ deleted</span>
              )}
            </div>
          </div>
          
          {/* Reply to message */}
          {message.replyTo && (
            <div className="reply-to">
              <span className="reply-label">
                ↩️ Replying to {message.replyTo.sender?.name || message.replyTo.user?.name || 'Unknown User'}
              </span>
              <span className="reply-content">{message.replyTo.content}</span>
            </div>
          )}
          
          {/* Message content based on type */}
          {!isDeleted && (
            <>
              {message.type === 'text' && (
                <div className="message-text">
                  {message.content}
                  {/* Mention highlighting */}
                  {message.mentions && message.mentions.map(mention => (
                    <span key={mention} className="mention">@{mention}</span>
                  ))}
                </div>
              )}
              
              {message.type === 'image' && (
                <div className="message-image">
                  <img src={message.attachments?.[0]} alt="Image" />
                </div>
              )}
              
              {message.type === 'voice' && (
                <div className="message-voice">
                  <audio controls className="voice-player">
                    <source src={message.attachments?.[0]} type="audio/webm" />
                  </audio>
                  <span className="duration">{message.voiceDuration || 0}s</span>
                </div>
              )}
              
              {message.type === 'file' && (
                <div className="message-file">
                  <a href={message.attachments?.[0]} target="_blank" rel="noopener noreferrer" className="file-link">
                    📎 {message.fileName || 'File'}
                  </a>
                  <button className="download-btn" onClick={() => downloadFile(message.attachments?.[0], message.fileName)}>
                    <Download size={14} />
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* Message reactions */}
          {hasReactions && (
            <div className="message-reactions">
              {Object.entries(message.reactions).map(([emoji, reactions]) => (
                <button
                  key={emoji}
                  className={`reaction-btn ${reactions.find(r => (r.userId || r.id) === user.id) ? 'active' : ''}`}
                  onClick={() => toggleReaction(message.id, emoji)}
                  title={`${reactions.length} ${emoji}`}
                >
                  {emoji} <span className="reaction-count">{reactions.length}</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Enhanced Chat Features */}
          {showAdvancedFeatures && (
            <EnhancedChatFeatures
              message={message}
              roomId={currentRoom?.id}
              isOwnMessage={isOwnMessage}
              isModerator={isModerator}
              isAdmin={isAdmin}
              onReaction={handleReaction}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
              onForward={handleForward}
              onSchedule={handleSchedule}
              onMention={handleMention}
              onModeratorAction={handleModeratorAction}
              onSearch={handleSearch}
            />
          )}
          
          {/* Message actions */}
          <div className="message-actions">
            <button 
              className="action-btn"
              onClick={() => toggleReaction(message.id, '👍')}
              title="Like"
            >
              👍
            </button>
            <button 
              className="action-btn"
              onClick={() => toggleReaction(message.id, '❤️')}
              title="Love"
            >
              ❤️
            </button>
            <button 
              className="action-btn"
              onClick={() => handleReply(message)}
              title="Reply"
            >
              <Reply size={14} />
            </button>
            <button 
              className="action-btn"
              onClick={() => handleThread(message)}
              title="Thread"
            >
              <MessageSquare size={14} />
            </button>
            <button 
              className="action-btn"
              onClick={() => handleForward(message)}
              title="Forward"
            >
              <Forward size={14} />
            </button>
            <button 
              className="action-btn"
              onClick={() => togglePin(message.id)}
              title={isPinned ? "Unpin" : "Pin"}
            >
              <Pin size={14} />
            </button>
            <button 
              className="action-btn"
              onClick={() => toggleStar(message.id)}
              title={isStarred ? "Unstar" : "Star"}
            >
              <Star size={14} />
            </button>
            
            {senderId === user.id && (
              <>
                <button 
                  className="action-btn"
                  onClick={() => handleEdit(message.id, prompt('Edit message:', message.content))}
                  title="Edit"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  className="action-btn"
                  onClick={() => handleDelete(message.id)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
          
          {/* Read receipts */}
          {isOwnMessage && (
            <div className="read-receipts">
              {message.readAt ? (
                <span className="read-indicator" title={`Read at ${new Date(message.readAt).toLocaleTimeString()}`}>
                  ✓✓ Read
                </span>
              ) : (
                <span className="delivered-indicator">
                  ✓ Delivered
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Enhanced message input with GIF support
  const renderMessageInput = () => (
    <div className="message-input">
                          {/* Reply preview */}
                    {replyToMessage && (
                      <div className="reply-preview">
                        <div className="reply-info">
                          <span className="reply-label">↩️ Replying to {(replyToMessage.sender || replyToMessage.user)?.name || 'Unknown User'}</span>
                          <span className="reply-content">{replyToMessage.content.substring(0, 50)}...</span>
                        </div>
                        <button 
                          className="remove-reply-btn"
                          onClick={() => setReplyToMessage(null)}
                          title="Remove reply"
                        >
                          ✕
                        </button>
                      </div>
                    )}

      {/* Scheduled message preview */}
      {scheduledTime && (
        <div className="scheduled-preview">
          <span>📅 Scheduled for {new Date(scheduledTime).toLocaleString()}</span>
          <button onClick={() => setScheduledTime('')}>✕</button>
        </div>
      )}

      {/* Self-destruct preview */}
      {selfDestructTime && (
        <div className="self-destruct-preview">
          <span>⏰ Self-destruct after {selfDestructTime} minutes</span>
          <button onClick={() => setSelfDestructTime('')}>✕</button>
        </div>
      )}

      <div className="input-row">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            if (e.target.value.trim()) {
              handleTyping();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          onKeyUp={(e) => {
            if (!e.target.value.trim()) {
              setIsTyping(false);
              
              if (todoId) {
                // Send stop typing event to GroupTodoSocket
                socket?.emit('todoStopTyping', { todoId: todoId });
              } else if (groupId) {
                // Send stop typing event to main namespace
                socket?.emit('stopTyping', { groupId: groupId });
              }
            }
          }}
          className="message-text-input"
        />
        
        {/* Enhanced action buttons */}
        <div className="input-actions">
          <button 
            className="action-btn emoji-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add emoji"
          >
            <Smile size={16} />
          </button>
          
          <button 
            className="action-btn gif-btn"
            onClick={() => setShowGifSearch(!showGifSearch)}
            title="Search GIFs"
          >
            🎬
          </button>
          
          <button 
            className="action-btn file-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            <Paperclip size={16} />
          </button>
          
          <button 
            className={`action-btn voice-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? 'Stop recording' : 'Voice message'}
          >
            <Mic size={16} />
          </button>
          
          <button 
            className="action-btn schedule-btn"
            onClick={() => setScheduledTime(prompt('Schedule for (YYYY-MM-DD HH:MM):'))}
            title="Schedule message"
          >
            <Clock size={14} />
          </button>
          
          <button 
            className="action-btn destruct-btn"
            onClick={() => setSelfDestructTime(prompt('Self-destruct after (minutes):'))}
            title="Self-destruct message"
          >
            <Eye size={14} />
          </button>
          
          <button 
            className="action-btn send-btn"
            onClick={sendMessage}
            disabled={!newMessage.trim() && !fileUpload && !recordingBlob}
            title="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="emoji-picker">
          {emojis.map(emoji => (
            <button
              key={emoji}
              className="emoji-btn"
              onClick={() => addEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* GIF search */}
      {showGifSearch && (
        <div className="gif-search">
          <div className="gif-search-input">
            <input
              type="text"
              placeholder="Search GIFs..."
              value={gifSearchQuery}
              onChange={(e) => setGifSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchGifs(gifSearchQuery);
                }
              }}
            />
            <button onClick={() => searchGifs(gifSearchQuery)}>Search</button>
          </div>
          <div className="gif-results">
            {gifResults.map(gif => (
              <div key={gif.id} className="gif-item" onClick={() => selectGif(gif)}>
                <img src={gif.url} alt={gif.title} />
                <span>{gif.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />
      
      {/* File preview */}
      {fileUpload && (
        <div className="file-preview">
          <span>{fileUpload.name}</span>
          <button onClick={removeFile}>✕</button>
        </div>
      )}

      {/* Recording preview */}
      {recordingBlob && (
        <div className="recording-preview">
          <span>🎤 Voice message recorded</span>
          <button onClick={() => setRecordingBlob(null)}>✕</button>
        </div>
      )}

      {/* Advanced options */}
      <div className="advanced-options">
        <button 
          className="option-btn"
          onClick={() => setScheduledTime(prompt('Schedule for (YYYY-MM-DD HH:MM):'))}
          title="Schedule message"
        >
          <Clock size={14} />
        </button>
        <button 
          className="option-btn"
          onClick={() => setSelfDestructTime(prompt('Self-destruct after (minutes):'))}
          title="Self-destruct message"
        >
          <Eye size={14} />
        </button>
      </div>
    </div>
  );

  // Render todo-specific chat interface
  if (todoId && groupId) {
    return (
      <div className="todo-chat-container h-full flex flex-col">
        {/* Todo Chat Header */}
        <div className="todo-chat-header bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Task Discussion</h3>
              <p className="text-sm text-gray-600">
                {onlineUsers.length} member{onlineUsers.length !== 1 ? 's' : ''} online
                {messages.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {messages.length} message{messages.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {typingUsers.length > 0 && (
                <div className="text-sm text-gray-500 italic">
                  {typingUsers.map(user => user.name).join(', ')} is typing...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Messages Container */}
        <div 
          className="flex-1 overflow-y-auto bg-gray-50 p-4"
          ref={messagesContainerRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h4>
              <p className="text-gray-600">Start the conversation by sending a message!</p>
            </div>
          ) : (
            messages.map((message) => renderMessage(message))
          )}
          
          {/* Enhanced typing indicators */}
          {typingUsers.length > 0 && (
            <motion.div 
              className="typing-indicator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="typing-dots">
                {typingUsers.map(user => (
                  <span key={user.userId} className="typing-user">
                    {user.name || 'Someone'} is typing...
                  </span>
                ))}
              </div>
              <div className="typing-animation">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Message Input */}
        {renderMessageInput()}
      </div>
    );
  }

  return (
    <div className="enhanced-real-time-chat">
      {/* Chat Toggle Button */}
      <motion.button 
        className="chat-toggle-btn"
        onClick={() => setShowChat(!showChat)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        💬
        {rooms.some(room => room.unreadCount > 0) && (
          <span className="unread-badge">
            {rooms.reduce((sum, room) => sum + room.unreadCount, 0)}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showChat && (
          <motion.div 
            className="chat-container"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3 }}
          >
            {/* Enhanced Chat Header */}
            <div className="chat-header">
              <h3>🚀 Enhanced Chat</h3>
              <div className="header-actions">
                <button 
                  className="action-btn"
                  onClick={() => setShowSearch(!showSearch)}
                  title="Search messages"
                >
                  🔍
                </button>
                <button 
                  className="action-btn"
                  onClick={() => setShowCreateRoom(!showCreateRoom)}
                  title="Create new chat"
                >
                  ➕
                </button>
                <button 
                  className="action-btn"
                  onClick={() => setShowChat(false)}
                  title="Close chat"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
              <motion.div 
                className="search-bar"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                />
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(message => (
                      <div 
                        key={message.id} 
                        className="search-result-item"
                        onClick={() => {
                          setCurrentRoom({ id: message.room.id, name: message.room.name });
                          loadMessages(message.room.id);
                          setShowSearch(false);
                        }}
                      >
                        <span className="sender">{message.sender.name}</span>
                        <span className="content">{message.content}</span>
                        <span className="room">{message.room.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Create Room Modal */}
            {showCreateRoom && (
              <div className="create-room-modal">
                <div className="modal-content">
                  <h4>Create New Chat</h4>
                  
                  <div className="search-section">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        // Implement user search
                      }}
                    />
                    
                    {searchResults.length > 0 && (
                      <div className="search-results">
                        {searchResults.map(user => (
                          <div 
                            key={user.id} 
                            className="search-result-item"
                            onClick={() => {
                              // Create private chat
                              setShowCreateRoom(false);
                            }}
                          >
                            <img src={user.avatar} alt={user.name} />
                            <span>{user.name}</span>
                            <span className={`status ${user.online ? 'online' : 'offline'}`}>
                              {user.online ? '🟢' : '⚫'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    className="close-modal-btn"
                    onClick={() => setShowCreateRoom(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            <div className="chat-content">
              {/* Enhanced Rooms List */}
              <div className="rooms-list">
                <h4>💬 Conversations</h4>
                {rooms.map(room => (
                  <motion.div 
                    key={room.id}
                    className={`room-item ${currentRoom?.id === room.id ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentRoom(room);
                      loadMessages(room.id);
                      loadOnlineUsers();
                    }}
                    whileHover={{ backgroundColor: '#f0f0f0' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="room-avatar">
                      {room.type === 'private' ? '👤' : '👥'}
                    </div>
                    <div className="room-info">
                      <div className="room-name">{room.name}</div>
                      <div className="room-last-message">
                        {room.lastMessage?.content || 'No messages yet'}
                      </div>
                      <div className="room-meta">
                        <span className="participants">{room.participants?.length || 0} members</span>
                        {room.lastMessage && (
                          <span className="last-activity">
                            {new Date(room.lastMessage.createdAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {room.unreadCount > 0 && (
                      <span className="unread-count">{room.unreadCount}</span>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Enhanced Messages Area */}
              {currentRoom && (
                <div className="messages-area">
                  {/* Enhanced Room Header */}
                  <div className="room-header">
                    <div className="room-info">
                      <h4>{currentRoom.name}</h4>
                      <div className="room-status">
                        <span className="online-count">
                          {onlineUsers.length} online
                        </span>
                        {currentRoom.type === 'private' && (
                          <span className={`user-status ${onlineUsers[0]?.status || 'offline'}`}>
                            {onlineUsers[0]?.status || 'offline'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="room-actions">
                      {currentRoom.type === 'private' && (
                        <>
                          <button 
                            className="action-btn"
                            onClick={() => startCall('audio')}
                            title="Voice call"
                          >
                            <Phone size={16} />
                          </button>
                          <button 
                            className="action-btn"
                            onClick={() => startCall('video')}
                            title="Video call"
                          >
                            <Video size={16} />
                          </button>
                        </>
                      )}
                      <button 
                        className="action-btn"
                        onClick={() => setCurrentRoom(null)}
                        title="Close room"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Online Users Bar */}
                  <div className="online-users-bar">
                    {onlineUsers.map(user => (
                      <div key={user.userId || user.id} className="online-user">
                        <img src={user.avatar} alt={user.name} />
                        <span className="name">{user.name}</span>
                        <span className={`status-indicator ${user.status}`}></span>
                      </div>
                    ))}
                  </div>

                  {/* Enhanced Messages Container */}
                  <div 
                    className="messages-container"
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                  >
                    {messages.map(message => renderMessage(message))}
                    
                    {/* Typing indicators */}
                    {typingUsers.length > 0 && (
                      <motion.div 
                        className="typing-indicator"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <div className="typing-dots">
                          {typingUsers.map(user => (
                            <span key={user.userId} className="typing-user">
                              {user.name || 'Someone'} is typing...
                            </span>
                          ))}
                        </div>
                        <div className="typing-animation">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Enhanced Message Input with all features */}
                  {renderMessageInput()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Video Call Modal */}
      {isInCall && (
        <div className="video-call-modal">
          <div className="video-container">
            <video ref={localVideoRef} autoPlay muted className="local-video" />
            <video ref={remoteVideoRef} autoPlay className="remote-video" />
            <div className="call-controls">
              <button className="control-btn mute" onClick={() => {}}>
                <Volume2 size={20} />
              </button>
              <button className="control-btn end-call" onClick={handleCallEnd}>
                📞 End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thread Modal */}
      {showThread && threadMessage && (
        <div className="thread-modal">
          <div className="thread-header">
            <h4>Thread: {threadMessage.content.substring(0, 50)}...</h4>
            <button onClick={() => setShowThread(false)}>✕</button>
          </div>
          <div className="thread-messages">
            {threadMessages.map(message => (
              <div key={message.id} className="thread-message">
                <span className="sender">{(message.sender || message.user)?.name || 'Unknown User'}</span>
                <span className="content">{message.content}</span>
                <span className="time">{message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'Just now'}</span>
              </div>
            ))}
          </div>
          <div className="thread-input">
            <input
              type="text"
              placeholder="Reply to thread..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Send thread reply
                  setShowThread(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeChat; 