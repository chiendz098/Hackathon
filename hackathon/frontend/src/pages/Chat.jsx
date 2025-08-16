import { Box, Heading, Stack, Input, Button, Text, useToast } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams  } from 'react-router-dom';
import { io } from 'socket.io-client';
import useApi from '../hooks/useApi';
import useAutoScroll from '../hooks/useAutoScroll';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-learning-backend.loca.lt';

export default function Chat() {
  const { id } = useParams();
  const { get, post } = useApi();
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const toast = useToast();
  
  // Auto-scroll hook
  const { messagesEndRef, messagesContainerRef, scrollToBottom, forceScrollToBottom, handleScroll } = useAutoScroll(messages, {
    enabled: true,
    smooth: true,
    scrollOnMount: true,
    scrollOnNewMessage: true,
    delay: 100
  });

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setConnected(false);
    });

    newSocket.on('newTodoMessage', (message) => {
      console.log('💬 New message received:', message);
      setMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Join group and fetch messages when component mounts
  useEffect(() => {
    if (socket && connected && id) {
      console.log('🔌 Joining group:', id);
      
      // Extract groupId and todoId from the URL parameter
      const [groupId, todoId] = id.split('-');
      
      // Join the group room
      socket.emit('joinGroup', { groupId: parseInt(groupId) });
      
      // Join the specific todo chat room
      socket.emit('join-todo-chat', { 
        todoId: parseInt(todoId), 
        groupId: parseInt(groupId) 
      });
      
      fetchMessages();
    }
  }, [socket, connected, id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching messages for todo:', id);
      
      // Extract groupId and todoId from the URL parameter
      // Assuming the URL format is /chat/:groupId/:todoId or similar
      const [groupId, todoId] = id.split('-');
      
      const response = await get(`/advanced-group-system/groups/${groupId}/todos/${todoId}/chat/recent?limit=100`);
      
      if (response?.success) {
        console.log('✅ Messages loaded:', response.messages.length);
        setMessages(response.messages || []);
      } else {
        console.error('❌ Failed to load messages:', response);
        toast({
          title: 'Error',
          description: 'Failed to fetch messages',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch messages',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Force scroll to bottom when messages are first loaded
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        forceScrollToBottom();
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, loading, forceScrollToBottom]);

  const handleSend = async () => {
    if (!msg.trim() || !socket || !connected) return;
    
    try {
      // Extract groupId and todoId from the URL parameter
      const [groupId, todoId] = id.split('-');
      
      // Send message via WebSocket for real-time
      socket.emit('todoMessage', {
        todoId: parseInt(todoId),
        content: msg,
        messageType: 'text'
      });
      
      // Also send via API for persistence
      const response = await post(`/advanced-group-system/groups/${groupId}/todos/${todoId}/chat`, {
        content: msg,
        messageType: 'text'
      });
      
      if (response?.success) {
        console.log('✅ Message sent successfully');
        setMsg('');
      } else {
        console.error('❌ Failed to send message via API:', response);
        // Don't show error toast for API failure since WebSocket might have worked
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Don't show error toast since WebSocket might have worked
    }
  };

  const handleSummarize = async () => {
    try {
      setLoading(true);
      // Extract groupId and todoId from the URL parameter
      const [groupId, todoId] = id.split('-');
      
      const response = await post(`/advanced-group-system/groups/${groupId}/todos/${todoId}/summarize`);
      
      if (response?.success) {
        setSummary(response.summary);
        toast({ title: 'Tóm tắt thành công', status: 'success' });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to summarize',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error summarizing thread:', error);
      toast({
        title: 'Error',
        description: 'Failed to summarize thread',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Heading mb={4}>Chat nhóm</Heading>
      <Box mb={4} p={2} bg={connected ? 'green.100' : 'red.100'} borderRadius="md">
        <Text fontSize="sm">
          {connected ? '🟢 Đã kết nối' : '🔴 Đang kết nối...'}
        </Text>
      </Box>
      <Button colorScheme="purple" mb={4} onClick={handleSummarize} isLoading={loading}>Tóm tắt AI</Button>
      {summary && <Box p={4} mb={4} bg="purple.50" borderRadius="md"><Text><b>Tóm tắt AI:</b> {summary}</Text></Box>}
      <Stack 
        spacing={3} 
        mb={4} 
        maxH="300px" 
        overflowY="auto"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.map((m, i) => (
          <Box key={m.id || i} p={2} bg={i % 2 === 0 ? 'gray.100' : 'gray.50'} borderRadius="md">
            <Text><b>{m.user?.name || 'Ẩn danh'}:</b> {m.content}</Text>
            {m.createdAt && (
              <Text fontSize="xs" color="gray.500">
                {new Date(m.createdAt).toLocaleTimeString()}
              </Text>
            )}
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Stack>
      <Stack direction="row">
        <Input 
          value={msg} 
          onChange={e => setMsg(e.target.value)} 
          placeholder="Nhập tin nhắn..." 
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={!connected}
        />
        <Button colorScheme="teal" onClick={handleSend} disabled={!connected || !msg.trim()}>
          Gửi
        </Button>
      </Stack>
    </Box>
  );
} 