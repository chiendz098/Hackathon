import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, CheckCircle, Clock, AlertCircle, MessageCircle,
  UserPlus, Bell, Edit, Trash2, MoreVertical, FileText, 
  Calendar, Target, BarChart3, Zap, Shield, Crown, Star,
  X, Save, RotateCcw, Eye, EyeOff, Download, Upload, Send, Reply, Pin, Forward
} from 'lucide-react';
import socketManager from '../../utils/socketManager';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import RealTimeChat from '../chat/RealTimeChat';

const TodoAssignmentManager = ({ todo, group, onClose, onUpdate }) => {
  const { get, post, put, delete: del } = useApi();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  
  // Debug assignments state changes
  useEffect(() => {
    console.log('🔄 Assignments state changed:', assignments.length, 'assignments');
    if (assignments.length > 0) {
      console.log('📋 First assignment:', assignments[0]);
    }
  }, [assignments]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [activeTab, setActiveTab] = useState('assignments'); // assignments, chat, analytics
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [showMemberInfo, setShowMemberInfo] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Track received message IDs to prevent duplicates
  const receivedMessageIds = useRef(new Set());
  
  // Track processed message keys to prevent duplicates
  const processedMessageKeys = useRef(new Set());
  
  // Track current chat messages to avoid dependency issues
  const chatMessagesRef = useRef([]);
  
  // Track if socket is already set up to prevent multiple setups
  const socketSetupRef = useRef(false);
  
  // Track the current component instance to prevent stale listeners
  const componentInstanceRef = useRef(Date.now());
  
  // Cleanup function for received message IDs
  const cleanupReceivedMessageIds = useCallback(() => {
    if (receivedMessageIds.current.size > 1000) {
      console.log('🧹 Cleaning up received message IDs set (size > 1000)');
      // Keep only the last 500 message IDs
      const idsArray = Array.from(receivedMessageIds.current);
      const recentIds = idsArray.slice(-500);
      receivedMessageIds.current = new Set(recentIds);
      console.log('🧹 Kept last 500 message IDs, cleaned up', idsArray.length - 500, 'old IDs');
    }
  }, []);
  
  // Pagination state for chat messages
  const [chatPagination, setChatPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
    hasMore: false
  });
  
  const chatEndRef = useRef();
  const typingTimeoutRef = useRef();
  const messageInputRef = useRef();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load assignments
      console.log('🔄 Loading assignments for todo:', todo.id);
      const assignmentsResponse = await get(`/advanced-group-system/groups/${group.id}/todos/${todo.id}/assignments`);
      console.log('📊 Assignments response:', assignmentsResponse);
      if (assignmentsResponse?.success) {
        console.log('✅ Setting assignments:', assignmentsResponse.assignments);
        setAssignments(assignmentsResponse.assignments);
      } else {
        console.error('❌ Failed to load assignments:', assignmentsResponse);
      }
      
      // Load group members
      console.log('👥 Loading group members for group:', group.id);
      const membersResponse = await get(`/advanced-group-system/groups/${group.id}/members`);
      console.log('👥 Members response:', membersResponse);
      if (membersResponse?.success) {
        console.log('✅ Setting group members:', membersResponse.members);
        setGroupMembers(membersResponse.members);
      } else {
        console.error('❌ Failed to load group members:', membersResponse);
      }
      
      // Load recent chat messages (last 100 messages to avoid loading too many)
      console.log('💬 Loading recent chat messages for todo:', todo.id);
      const chatResponse = await get(`/advanced-group-system/groups/${group.id}/todos/${todo.id}/chat/recent?limit=100`);
      console.log('💬 Chat response:', chatResponse);
      if (chatResponse?.success) {
        console.log('✅ Setting chat messages:', chatResponse.messages);
        console.log('✅ First message user info:', chatResponse.messages[0]?.user);
        console.log('📊 Pagination info:', chatResponse.pagination);
        setChatMessages(chatResponse.messages);
        
        // Update pagination state
        if (chatResponse.pagination) {
          setChatPagination(chatResponse.pagination);
        }
        
        // Add existing message IDs to received set to prevent duplicates
        chatResponse.messages.forEach(msg => {
          receivedMessageIds.current.add(msg.id);
        });
        console.log('✅ Added existing message IDs to received set:', chatResponse.messages.length, 'messages');
      } else {
        console.error('❌ Failed to load chat messages:', chatResponse);
      }
      
    } catch (error) {
      console.error('Error loading todo assignment data:', error);
      toast.error('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  }, [todo.id, group.id, get]);

  const setupSocket = useCallback(() => {
    // Prevent multiple socket setups
    if (socketSetupRef.current) {
      console.log('🔌 Socket already set up, skipping...');
      return;
    }
    
    // Additional check: prevent setup if component is unmounting
    if (!todo || !group) {
      console.log('🔌 Todo or group not available, skipping socket setup');
      return;
    }
    
    const socket = socketManager.getSocket();
    const componentId = `todo-${todo.id}-${componentInstanceRef.current}`;
    
    console.log('🔌 Setting up socket for component:', componentId);
    
    // Remove existing listeners to prevent duplicates
    socketManager.removeComponentListeners(componentId);
    
    // Mark socket as set up
    socketSetupRef.current = true;
    
    // Join todo-specific room
    const roomData = { todoId: todo.id, groupId: group.id };
    
    // Debug user and todo info
    console.log('🔍 Debug - Current user:', user);
    console.log('🔍 Debug - Todo info:', todo);
    console.log('🔍 Debug - Group info:', group);
    console.log('🔍 Debug - Room data:', roomData);
    
    // Check if socket is still connected before joining
    if (!socket.connected) {
      socket.connect();
    }
    
    // Join the todo chat room
    console.log('🔌 Frontend - Joining todo chat room:', roomData);
    socketManager.emit('join-todo-chat', roomData);
    
    // Also join the group room
    console.log('🔌 Frontend - Joining group room:', { groupId: group.id });
    socketManager.emit('joinGroup', { groupId: group.id });
    
    // Emit online status
    console.log('🔌 Frontend - Emitting user online status:', { groupId: group.id });
    socketManager.emit('userOnline', { groupId: group.id });
      
      // Listen for assignment updates
      socketManager.on('assignmentUpdated', (data) => {
        console.log('📋 Socket event - assignmentUpdated:', data);
        if (data.todoId === todo.id) {
          setAssignments(prev => prev.map(a => 
            a.id === data.assignmentId ? { ...a, ...data.updates } : a
          ));
        }
      }, componentId);
      
      // Listen for new todo messages
      socketManager.on('newTodoMessage', (message) => {
        console.log('💬 Socket event - newTodoMessage received:', message);
        console.log('💬 Current todo ID:', todo.id);
        
        // Handle both field names from backend
        const messageTodoId = message.todo_id || message.todoId;
        const messageUserId = message.user_id || message.userId;
        const messageCreatedAt = message.created_at || message.createdAt;
        
        console.log('💬 Message todo ID:', messageTodoId);
        
        if (messageTodoId === todo.id) {
          console.log('💬 Adding new message to chat:', message);
          
          // Multiple duplicate checks
          const messageId = message.id;
          const messageContent = message.content;
          const messageUserId = message.user_id || message.userId;
          const messageTimestamp = new Date(messageCreatedAt).getTime();
          
          // Check 1: Message ID already exists in received set
          if (receivedMessageIds.current.has(messageId)) {
            console.log('💬 Message ID already received, skipping:', messageId);
            return;
          }
          
          // Check 2: Message already exists in current state
          setChatMessages(prev => {
            const messageExists = prev.some(msg => msg.id === messageId);
            if (messageExists) {
              console.log('💬 Message already exists in state, skipping:', messageId);
              return prev;
            }
            
            // Check 3: Recent duplicate with same content and user
            const fiveSecondsAgo = Date.now() - 5000;
            const recentDuplicate = prev.some(msg => 
              msg.content === messageContent && 
              (msg.user_id || msg.userId) === messageUserId &&
              Math.abs(new Date(msg.created_at || msg.createdAt).getTime() - messageTimestamp) < 5000
            );
            
            if (recentDuplicate) {
              console.log('💬 Recent duplicate message detected, skipping');
              return prev;
            }
            
            // Check 4: Exact same message (content + user + timestamp within 1 second)
            const exactDuplicate = prev.some(msg => 
              msg.content === messageContent && 
              (msg.user_id || msg.userId) === messageUserId &&
              Math.abs(new Date(msg.created_at || msg.createdAt).getTime() - messageTimestamp) < 1000
            );
            
            if (exactDuplicate) {
              console.log('💬 Exact duplicate message detected, skipping');
              return prev;
            }
            
            // Normalize message format for frontend
            const normalizedMessage = {
              id: messageId,
              todoId: messageTodoId,
              userId: messageUserId,
              content: messageContent,
              messageType: message.message_type || message.messageType,
              createdAt: messageCreatedAt,
              user: message.user,
              isEdited: message.is_edited || message.isEdited,
              editCount: message.edit_count || message.editCount,
              reactions: message.reactions || {}
            };
            
            const newMessages = [...prev, normalizedMessage];
            console.log('💬 Updated chat messages, new count:', newMessages.length);
            return newMessages;
          });
          
          // Add message ID to received set
          receivedMessageIds.current.add(messageId);
          
          console.log('💬 Message added successfully');
        } else {
          console.log('💬 Message not for current todo, ignoring');
        }
      }, componentId);

      // Listen for message edits
      socketManager.on('messageEdited', (message) => {
        console.log('✏️ Socket event - messageEdited received:', message);
        if (message.todoId === todo.id) {
          setChatMessages(prev => 
            prev.map(msg => msg.id === message.id ? message : msg)
          );
        }
      }, componentId);

      // Listen for typing indicators
      socketManager.on('todoTyping', (data) => {
        if (data.todoId === todo.id) {
          setTypingUsers(prev => new Set([...prev, data.userId]));
        }
      }, componentId);
      
      socketManager.on('todoStopTyping', (data) => {
        if (data.todoId === todo.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }
      }, componentId);
      
      // Listen for user joining todo room
      socketManager.on('userJoinedTodoRoom', (data) => {
        console.log('👥 Socket event - userJoinedTodoRoom:', data);
        console.log('👥 Current todo ID:', todo.id);
        console.log('👥 Socket connected:', socket?.connected);
        if (data.todoId === todo.id) {
          console.log(`👥 User ${data.userId} joined todo room ${todo.id}`);
        }
      }, componentId);
      
      // Listen for user joining chat (alternative event name)
      socketManager.on('user-joined-chat', (data) => {
        console.log('👥 Socket event - user-joined-chat:', data);
        if (data.todoId === todo.id) {
          console.log(`👥 User ${data.userId} joined chat for todo ${todo.id}`);
        }
      }, componentId);
      
      // Listen for online status updates
      socketManager.on('userOnline', (data) => {
        if (data.groupId === group.id) {
          setOnlineUsers(prev => new Set([...prev, data.userId]));
        }
      }, componentId);
      
      socketManager.on('userOffline', (data) => {
        if (data.groupId === group.id) {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }
      }, componentId);
      
      // Listen for online users list
      socketManager.on('onlineUsers', (data) => {
        if (data.groupId === group.id) {
          setOnlineUsers(new Set(data.userIds));
        }
      }, componentId);
      
      // Debug: Listen for any event to see if socket is working
      socketManager.on('*', (eventName, data) => {
        console.log('🔍 Debug - Received any event:', eventName, data);
      }, componentId);
      
      // Debug: Listen for specific events to verify they're working
      socketManager.on('connect', () => {
        console.log('🔌 Debug - Socket connected in TodoAssignmentManager');
      }, componentId);
      
      socketManager.on('disconnect', () => {
        console.log('🔌 Debug - Socket disconnected in TodoAssignmentManager');
      }, componentId);
      
      socketManager.on('error', (error) => {
        console.error('🔌 Debug - Socket error in TodoAssignmentManager:', error);
      }, componentId);
      
      // Debug: Listen for room join confirmation
      socketManager.on('userJoinedTodoRoom', (data) => {
        console.log('🔍 Debug - userJoinedTodoRoom event received:', data);
      }, componentId);
      
      socketManager.on('user-joined-chat', (data) => {
        console.log('🔍 Debug - user-joined-chat event received:', data);
      }, componentId);
      
      // Debug: Test if listeners are working
      console.log('🔍 Debug - Event listeners registered for component:', componentId);
      console.log('🔍 Debug - Socket manager methods:', Object.keys(socketManager));
      
      // Debug: Verify listeners are registered
      console.log('🔍 Debug - Component listeners after registration:', socketManager.getActiveListeners());
      
      // Debug: Test socket connection status
      console.log('🔍 Debug - Socket connection status:', {
        connected: socket.connected,
        id: socket.id,
        readyState: socket.readyState
      });
  }, [todo.id, group.id]);

  useEffect(() => {
    console.log('🔄 TodoAssignmentManager useEffect triggered for todo:', todo.id);
    console.log('🔄 Todo object:', todo);
    console.log('🔄 Group object:', group);
    
    // Clear received message IDs when todo changes
    receivedMessageIds.current.clear();
    console.log('🧹 Cleared received message IDs for new todo');
    
    // Reset socket setup flag
    socketSetupRef.current = false;
    
    // Generate new component instance ID
    componentInstanceRef.current = Date.now();
    
    loadData();
    
    // Small delay to ensure data is loaded before setting up socket
    setTimeout(() => {
      setupSocket();
    }, 100);
    
    return () => {
      // Cleanup socket listeners
      const componentId = `todo-${todo.id}-${componentInstanceRef.current}`;
      console.log('🔌 Cleaning up socket listeners for todo:', todo.id, 'instance:', componentInstanceRef.current);
      socketManager.emit('leave-todo-chat', { todoId: todo.id });
      socketManager.removeComponentListeners(componentId);
      
      // Clear received message IDs
      receivedMessageIds.current.clear();
      processedMessageKeys.current.clear();
      console.log('🧹 Cleared received message IDs and processed keys on cleanup');
      
      // Reset socket setup flag
      socketSetupRef.current = false;
    };
  }, [todo.id, group.id, loadData, setupSocket]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    console.log('📝 Chat messages changed, count:', chatMessages.length);
    if (chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100); // Small delay to ensure DOM is updated
    }
  }, [chatMessages.length]); // Use length for better performance

  // Force re-render when messages change
  useEffect(() => {
    console.log('🎨 Rendering chat messages:', chatMessages.length, 'messages');
    if (chatMessages.length > 0) {
      console.log('💬 First message:', chatMessages[0]);
      console.log('💬 Last message:', chatMessages[chatMessages.length - 1]);
    }
    
    // Update ref to avoid dependency issues
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  // Load older chat messages
  // Load older chat messages
  const loadOlderMessages = useCallback(async () => {
    if (!chatPagination.hasMore || loading) return;
    
    try {
      console.log('📜 Loading older messages, offset:', chatPagination.offset + chatPagination.limit);
      const olderResponse = await get(`/advanced-group-system/groups/${group.id}/todos/${todo.id}/chat?limit=${chatPagination.limit}&offset=${chatPagination.offset + chatPagination.limit}`);
      
      if (olderResponse?.success) {
        console.log('✅ Loaded older messages:', olderResponse.messages.length);
        
        // Add older messages to the beginning
        setChatMessages(prev => {
          const newMessages = [...olderResponse.messages, ...prev];
          
          // Add message IDs to received set
          olderResponse.messages.forEach(msg => {
            receivedMessageIds.current.add(msg.id);
          });
          
          return newMessages;
        });
        
        // Update pagination
        setChatPagination(prev => ({
          ...prev,
          offset: prev.offset + prev.limit,
          hasMore: olderResponse.pagination?.hasMore || false
        }));
        
        toast.success(`Loaded ${olderResponse.messages.length} older messages`);
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
      toast.error('Failed to load older messages');
    }
  }, [chatPagination.hasMore, chatPagination.offset, chatPagination.limit, loading, get, group.id, todo.id]);

  const handleAddAssignment = useCallback(async (formData) => {
    if (isAddingAssignment) return; // Prevent double submission
    
    try {
      setIsAddingAssignment(true);
      const assignedTasks = [];
      const taskTitles = formData.getAll('taskTitle');
      const taskDescriptions = formData.getAll('taskDescription');
      
      for (let i = 0; i < taskTitles.length; i++) {
        if (taskTitles[i].trim()) {
          assignedTasks.push({
            id: Date.now() + i,
            title: taskTitles[i].trim(),
            description: taskDescriptions[i]?.trim() || '',
            status: 'pending',
            estimatedTime: parseInt(formData.get('taskEstimatedTime') || '1'),
            actualTime: 0,
            createdAt: new Date().toISOString()
          });
        }
      }

      const assignmentData = {
        userId: parseInt(formData.get('userId')),
        role: formData.get('role'),
        estimatedTime: parseInt(formData.get('estimatedTime')),
        dueDate: formData.get('dueDate'),
        notes: formData.get('notes'),
        assignedTasks: assignedTasks
      };
      
      console.log('📤 Sending assignment data:', assignmentData);
      const result = await post(`/advanced-group-system/groups/${group.id}/todos/${todo.id}/assignments`, assignmentData);
      console.log('📥 Assignment result:', result);
      
      if (result?.success) {
        setShowAddAssignment(false);
        // Reset form
        const form = document.querySelector('form');
        if (form) form.reset();
        await loadData();
        toast.success('Assignment added successfully!');
      }
    } catch (error) {
      console.error('Error adding assignment:', error);
      toast.error('Failed to add assignment');
    } finally {
      setIsAddingAssignment(false);
    }
  }, [isAddingAssignment, post, group.id, todo.id, loadData]);

  const handleUpdateAssignment = useCallback(async (assignmentId, updates) => {
    try {
      const result = await put(`/advanced-group-system/groups/${group.id}/todos/${todo.id}/assignments/${assignmentId}`, updates);
      
      if (result?.success) {
        setAssignments(prev => prev.map(a => 
          a.id === assignmentId ? { ...a, ...updates } : a
        ));
        setEditingAssignment(null);
        toast.success('Assignment updated successfully!');
        
        // Show completion notification
        if (result.todoCompleted) {
          toast.success('🎉 All tasks completed! Todo is now finished!', {
            duration: 5000,
            icon: '🎉'
          });
          // Trigger parent update
          onUpdate();
        }
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Failed to update assignment');
    }
  }, [put, group.id, todo.id, onUpdate]);

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) return;
    
    try {
      const result = await del(`/advanced-group-system/groups/${group.id}/todos/${todo.id}/assignments/${assignmentId}`);
      
      if (result?.success) {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        toast.success('Assignment removed successfully!');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to remove assignment');
    }
  };

  const handleUpdateTaskStatus = async (assignmentId, taskId, newStatus) => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) return;

      const updatedTasks = assignment.assignedTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );

      await handleUpdateAssignment(assignmentId, { assignedTasks: updatedTasks });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const [isSending, setIsSending] = useState(false);
  
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    
    try {
      console.log('📤 Frontend - Sending chat message:', messageContent);
      console.log('🔌 Socket status:', window.socket ? 'exists' : 'not exists');
      console.log('🔌 Socket connected:', window.socket?.connected);
      

      
      // Send via socket for real-time
      const socket = socketManager.getSocket();
      console.log('🔌 Socket status check:', {
        exists: !!socket,
        connected: socket?.connected,
        id: socket?.id,
        readyState: socket?.readyState
      });
      
      if (socket && socket.connected) {
        const socketMessage = {
          todoId: todo.id,
          content: messageContent,
          messageType: 'text'
        };
        
        console.log('🔌 Frontend - Emitting todoMessage via socket:', socketMessage);
        
        // Emit message via socket
        socketManager.emit('todoMessage', socketMessage);
        
        // Stop typing indicator
        socketManager.emit('todoStopTyping', { todoId: todo.id });
        
        console.log('🔌 Frontend - Message sent via socket successfully');

      } else {
        console.log('⚠️ Socket not available, sending via API only');
        // Only send via API if socket is not available
        try {
          const result = await post(`/advanced-group-system/groups/${group.id}/todos/${todo.id}/chat`, {
            content: messageContent,
            messageType: 'text'
          });
          console.log('📥 Frontend - API response:', result);
        } catch (apiError) {
          console.error('API error:', apiError);
          toast.error('Failed to send message');
          setNewMessage(messageContent); // Restore message if failed
          return;
        }
      }
      
      // Focus back to input
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageContent); // Restore message if failed
    } finally {
      setIsSending(false);
    }
  }, [newMessage, isSending, todo.id, group.id, post]);

  const handleTyping = useCallback(() => {
    const socket = socketManager.getSocket();
    if (socket && socket.connected) {
      socketManager.emit('todoTyping', { todoId: todo.id });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        if (socket && socket.connected) {
          socketManager.emit('todoStopTyping', { todoId: todo.id });
        }
      }, 3000);
    }
  }, [todo.id, socketManager]);

  // Advanced chat features handlers
  const handleReplyMessage = useCallback((message) => {
    setNewMessage(`@${message.user?.name} `);
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
    toast.success(`Replying to ${message.user?.name}`);
  }, []);

  const handleEditMessage = useCallback(async (message) => {
    const newContent = prompt('Edit message:', message.content);
    if (newContent && newContent !== message.content) {
      try {
        await put(`/advanced-group-system/groups/${group.id}/todos/${todo.id}/chat/${message.id}`, {
          content: newContent
        });
        toast.success('Message edited successfully');
      } catch (error) {
        console.error('Error editing message:', error);
        toast.error('Failed to edit message');
      }
    }
  }, [group.id, todo.id, put]);

  const handlePinMessage = useCallback(async (message) => {
    try {
      await post(`/advanced-group-system/groups/${group.id}/todos/${todo.id}/chat/${message.id}/pin`);
      toast.success('Message pinned successfully');
    } catch (error) {
      console.error('Error pinning message:', error);
      toast.error('Failed to pin message');
    }
  }, [group.id, todo.id, post]);

  const handleForwardMessage = useCallback(async (message) => {
    const targetTodoId = prompt('Enter target todo ID to forward to:');
    if (targetTodoId) {
      try {
        await post(`/advanced-group-system/groups/${group.id}/todos/${todo.id}/chat/${message.id}/forward`, {
          targetTodoId: parseInt(targetTodoId)
        });
        toast.success('Message forwarded successfully');
      } catch (error) {
        console.error('Error forwarding message:', error);
        toast.error('Failed to forward message');
      }
    }
  }, [group.id, todo.id, post]);

  const handleReaction = useCallback(async (messageId, reaction) => {
    try {
      await post(`/advanced-group-system/groups/${group.id}/todos/${todo.id}/chat/${messageId}/reactions`, {
        reaction
      });
      toast.success(`Added ${reaction} reaction`);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  }, [group.id, todo.id, post]);

  const getProgressPercentage = (assignment) => {
    if (!assignment.assignedTasks || assignment.assignedTasks.length === 0) return 0;
    const completedTasks = assignment.assignedTasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / assignment.assignedTasks.length) * 100);
  };

  const getOverallProgress = () => {
    if (assignments.length === 0) return 0;
    const totalProgress = assignments.reduce((sum, assignment) => sum + getProgressPercentage(assignment), 0);
    return Math.round(totalProgress / assignments.length);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'blocked': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAnalytics = () => {
    const totalTasks = assignments.reduce((sum, a) => sum + (a.assignedTasks?.length || 0), 0);
    const completedTasks = assignments.reduce((sum, a) => 
      sum + (a.assignedTasks?.filter(t => t.status === 'completed').length || 0), 0
    );
    const inProgressTasks = assignments.reduce((sum, a) => 
      sum + (a.assignedTasks?.filter(t => t.status === 'in_progress').length || 0), 0
    );
    const pendingTasks = assignments.reduce((sum, a) => 
      sum + (a.assignedTasks?.filter(t => t.status === 'pending').length || 0), 0
    );

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  // Debug function to check for duplicates
  const debugCheckDuplicates = useCallback(() => {
    const messageIds = new Set();
    const duplicates = [];
    
    chatMessages.forEach((message, index) => {
      if (messageIds.has(message.id)) {
        duplicates.push({ message, index, duplicateOf: chatMessages.findIndex(m => m.id === message.id) });
      } else {
        messageIds.add(message.id);
      }
    });
    
    if (duplicates.length > 0) {
      console.warn('🚨 Duplicate messages detected:', duplicates);
      console.warn('🚨 Total messages:', chatMessages.length);
      console.warn('🚨 Unique message IDs:', messageIds.size);
    } else {
      console.log('✅ No duplicate messages detected');
    }
    
    return duplicates;
  }, [chatMessages]);

  // Debug effect to check for duplicates
  useEffect(() => {
    if (chatMessages.length > 0) {
      debugCheckDuplicates();
    }
  }, [chatMessages, debugCheckDuplicates]);

  // Main component render logic
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assignment manager...</p>
          </div>
        </div>
      );
    }

    const analytics = getAnalytics();

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Target className="w-6 h-6 mr-3 text-blue-500" />
              {todo.title}
            </h2>
            <p className="text-gray-600 mt-1">{todo.description}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getOverallProgress()}%</div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Chat ({chatMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="w-full flex flex-col">
              {/* Assignments Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Task Assignments</h3>
                  <button
                    onClick={() => setShowAddAssignment(true)}
                    className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Assignment
                  </button>
                </div>
              </div>

              {/* Assignments List */}
              <div className="flex-1 overflow-y-auto p-4">
                {assignments.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Assignments Yet</h4>
                    <p className="text-gray-600 mb-4">Start by assigning tasks to group members</p>
                    <button
                      onClick={() => setShowAddAssignment(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Assignment
                    </button>
                  </div>

                ) : (
                  <div className="space-y-6">
                    {/* Group assignments by user */}
                    {Object.entries(
                      assignments.reduce((groups, assignment) => {
                        const userId = assignment.userId;
                        if (!groups[userId]) {
                          groups[userId] = [];
                        }
                        groups[userId].push(assignment);
                        return groups;
                      }, {})
                    ).map(([userId, userAssignments]) => {
                      const user = userAssignments[0].user;
                      const totalTasks = userAssignments.reduce((sum, assignment) => 
                        sum + (assignment.assignedTasks?.length || 0), 0
                      );
                      const completedTasks = userAssignments.reduce((sum, assignment) => 
                        sum + (assignment.assignedTasks?.filter(task => task.status === 'completed').length || 0), 0
                      );
                      
                      return (
                        <div key={userId} className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                                {user?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
                                <p className="text-sm text-gray-600">
                                  {userAssignments.length} assignment{userAssignments.length > 1 ? 's' : ''} • 
                                  {totalTasks} task{totalTasks > 1 ? 's' : ''} • 
                                  {completedTasks}/{totalTasks} completed
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                completedTasks === totalTasks && totalTasks > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {completedTasks === totalTasks && totalTasks > 0 ? 'Completed' : 'In Progress'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {userAssignments.map((assignment) => (
                              <motion.div
                                key={assignment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                      {assignment.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900">{assignment.user?.name}</h4>
                                      <p className="text-sm text-gray-600">{assignment.role}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                                      {assignment.status}
                                    </span>
                                    <button
                                      onClick={() => setEditingAssignment(editingAssignment === assignment.id ? null : assignment.id)}
                                      className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAssignment(assignment.id)}
                                      className="p-1 text-gray-400 hover:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span>{getProgressPercentage(assignment)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${getProgressPercentage(assignment)}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Assigned Tasks */}
                                {assignment.assignedTasks && assignment.assignedTasks.length > 0 && (
                                  <div className="space-y-2">
                                    <h5 className="text-sm font-medium text-gray-700">Assigned Tasks:</h5>
                                    {assignment.assignedTasks.map((task, index) => (
                                      <div key={task.id || index} className="flex items-center justify-between p-2 bg-white rounded border">
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => handleUpdateTaskStatus(assignment.id, task.id, 
                                              task.status === 'completed' ? 'pending' : 'completed'
                                            )}
                                            className="text-gray-400 hover:text-green-600"
                                          >
                                            <CheckCircle 
                                              className={`w-4 h-4 ${
                                                task.status === 'completed' 
                                                  ? 'text-green-500' 
                                                  : 'text-gray-400'
                                              }`} 
                                            />
                                          </button>
                                          <div className="flex-1">
                                            <span className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                              {task.title}
                                            </span>
                                            {task.description && (
                                              <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <span className={`text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                                            {task.status}
                                          </span>
                                          {task.estimatedTime && (
                                            <span className="text-xs text-gray-500">
                                              {task.estimatedTime}h
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Assignment Details */}
                                {(assignment.estimatedTime || assignment.dueDate || assignment.notes) && (
                                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                                    {assignment.estimatedTime && (
                                      <div><strong>Estimated Time:</strong> {assignment.estimatedTime} hours</div>
                                    )}
                                    {assignment.dueDate && (
                                      <div><strong>Due Date:</strong> {new Date(assignment.dueDate).toLocaleDateString()}</div>
                                    )}
                                    {assignment.notes && (
                                      <div><strong>Notes:</strong> {assignment.notes}</div>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="w-full h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Task Discussion</h3>
                    <p className="text-sm text-gray-600">
                      {onlineUsers.length} members online • {chatMessages.length} messages
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {Array.from(typingUsers).length > 0 && (
                      <div className="text-sm text-gray-500">
                        {Array.from(typingUsers).map(userId => {
                          const user = groupMembers.find(m => m.id === userId);
                          return user?.name;
                        }).join(', ')} typing...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h4>
                    <p className="text-gray-600">Start the conversation by sending a message</p>
                  </div>
                ) : (
                  chatMessages.map((message, index) => {
                    // Handle both user_id and userId field names from backend
                    const messageUserId = message.user_id || message.userId;
                    const messageCreatedAt = message.created_at || message.createdAt;
                    const isOwnMessage = messageUserId === user?.id;
                    
                    return (
                      <div
                        key={message.id || index}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                            isOwnMessage
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {/* Message Header */}
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                              {message.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium">
                              {message.user?.name || 'Unknown'}
                            </span>
                            {messageCreatedAt && (
                              <span className="text-xs opacity-75">
                                {new Date(messageCreatedAt).toLocaleTimeString()}
                              </span>
                            )}
                            {message.isEdited && (
                              <span className="text-xs opacity-75">(edited)</span>
                            )}
                          </div>
                          
                          {/* Message Content */}
                          <div className="text-sm">{message.content}</div>
                          
                          {/* Message Actions - Always visible for testing */}
                          <div className="flex space-x-1 mt-2 opacity-100">
                            <button
                              onClick={() => handleReplyMessage(message)}
                              className="p-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 text-xs"
                              title="Reply"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                            {isOwnMessage && (
                              <button
                                onClick={() => handleEditMessage(message)}
                                className="p-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 text-xs"
                                title="Edit"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handlePinMessage(message)}
                              className="p-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 text-xs"
                              title="Pin"
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleForwardMessage(message)}
                              className="p-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 text-xs"
                              title="Forward"
                            >
                              <Forward className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleReaction(message.id, '👍')}
                              className="p-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 text-xs"
                              title="Like"
                            >
                              👍
                            </button>
                          </div>
                          
                          {/* Message Reactions */}
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
                          
                          {message.isOptimistic && (
                            <div className="text-xs opacity-75 mt-1 flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-1"></div>
                              Sending...
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center space-x-2">
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="w-full p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalTasks}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.completedTasks}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.inProgressTasks}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.completionRate}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${analytics.totalTasks > 0 ? (analytics.completedTasks / analytics.totalTasks) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{analytics.completedTasks}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">In Progress</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${analytics.totalTasks > 0 ? (analytics.inProgressTasks / analytics.totalTasks) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{analytics.inProgressTasks}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pending</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${analytics.totalTasks > 0 ? (analytics.pendingTasks / analytics.totalTasks) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{analytics.pendingTasks}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Performance</h3>
                  <div className="space-y-3">
                    {assignments.map((assignment) => {
                      const progress = getProgressPercentage(assignment);
                      return (
                        <div key={assignment.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {assignment.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{assignment.user?.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{progress}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Assignment Modal */}
        {showAddAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Assignment</h3>
                  <button
                    onClick={() => setShowAddAssignment(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddAssignment(new FormData(e.target));
              }} className="p-6">
                <div className="space-y-6">
                  {/* Member Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign to Member
                    </label>
                    <select
                      name="userId"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a member</option>
                      {groupMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      name="role"
                      placeholder="e.g., Developer, Designer, Reviewer"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Estimated Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Time (hours)
                    </label>
                    <input
                      type="number"
                      name="estimatedTime"
                      min="1"
                      defaultValue="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      name="dueDate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      rows="3"
                      placeholder="Additional notes or instructions..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    ></textarea>
                  </div>

                  {/* Tasks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tasks
                    </label>
                    <div id="tasks-container" className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            name="taskTitle"
                            placeholder="Task title"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            name="taskDescription"
                            placeholder="Task description (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            name="taskEstimatedTime"
                            placeholder="Hours"
                            min="1"
                            defaultValue="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const container = document.getElementById('tasks-container');
                        const newTask = document.createElement('div');
                        newTask.className = 'flex items-center space-x-3';
                        newTask.innerHTML = `
                          <div class="flex-1">
                            <input type="text" name="taskTitle" placeholder="Task title" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          </div>
                          <div class="flex-1">
                            <input type="text" name="taskDescription" placeholder="Task description (optional)" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          </div>
                          <div class="w-24">
                            <input type="number" name="taskEstimatedTime" placeholder="Hours" min="1" value="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          </div>
                          <button type="button" onclick="this.parentElement.remove()" class="p-2 text-red-500 hover:text-red-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        `;
                        container.appendChild(newTask);
                      }}
                      className="mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      + Add Another Task
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddAssignment(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingAssignment}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {isAddingAssignment ? 'Adding...' : 'Add Assignment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

return renderContent();
};

export default TodoAssignmentManager;