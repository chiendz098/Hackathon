const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');
const config = require('./config');
const { connectDB, User } = require('./models');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const todoRoutes = require('./routes/todo');
const groupTodoRoutes = require('./routes/groupTodo');
const aiOptimizationRoutes = require('./routes/aiOptimization');
const gamificationRoutes = require('./routes/gamification');
const realTimeCollaborationRoutes = require('./routes/realTimeCollaboration');

const privateChatRoutes = require('./routes/privateChat');
const classroomRoutes = require('./routes/classroom');
const assignmentRoutes = require('./routes/teacher-assignment');
const groupRoutes = require('./routes/groups');
const groupSystemRoutes = require('./routes/groupSystem');
const leaderboardRoutes = require('./routes/leaderboard');
const chatbotRoutes = require('./routes/chatbot');
const chatbotAdapterRoutes = require('./routes/chatbot-adapter');
const aiRoutes = require('./routes/ai');
const aiRagRoutes = require('./routes/ai_rag');
const postsRoutes = require('./routes/posts');
const adminRoutes = require('./routes/admin');
const statisticsRoutes = require('./routes/statistics');
const activityRoutes = require('./routes/activity');
const shopRoutes = require('./routes/shop');
// const petsRoutes = require('./routes/pets');
const aiSchedulerRoutes = require('./routes/ai-scheduler');
const dailyRewardsRoutes = require('./routes/daily-rewards');
const searchRoutes = require('./routes/search');
const focusRoomsRoutes = require('./routes/focus-rooms');
const calendarRoutes = require('./routes/calendar');
const threadRoutes = require('./routes/thread');
const chatRoutes = require('./routes/chat');
const analyticsRoutes = require('./routes/analytics');
const advancedChatRoutes = require('./routes/advancedChat');

const friendsRoutes = require('./routes/friends');
const notificationsRoutes = require('./routes/notifications');
const profileRoutes = require('./routes/profile');
const fileRoutes = require('./routes/file');

const progressRoutes = require('./routes/progress');
const feedbackRoutes = require('./routes/feedback');
const mentorRoutes = require('./routes/mentor');
const resourceRoutes = require('./routes/resource');
const examRoutes = require('./routes/exam');
const eventRoutes = require('./routes/event');

const botConfigRoutes = require('./routes/bot-config');
const trialRoutes = require('./routes/trial');
const orchestratorRoutes = require('./routes/orchestrator');
const notificationRoutes = require('./routes/notification');

// Enhanced routes
const enhancedClassroomRoutes = require('./routes/enhanced-classroom');
const todoAssignmentRoutes = require('./routes/todo-assignments');
const themesRoutes = require('./routes/themes');
// Add: teacher assignments route mounted at /api/teacher/assignments
const teacherAssignmentsRoutes = require('./routes/teacher-assignments');

// Import WebSocket handlers
const { handleChatSocket } = require('./websocket/chatSocket');
const GroupTodoSocket = require('./websocket/groupTodoSocket');

// Import Statistics Broadcaster
const StatisticsBroadcaster = require('./services/statisticsBroadcaster');

// Global chatbot process reference
let chatbotProcess = null;

// Function to start Python chatbot
function startChatbot() {
  const chatbotPath = path.join(__dirname, '..', 'chatbot_final');
  
  // Check if chatbot directory exists
  if (!fs.existsSync(chatbotPath)) {
    console.log('⚠️  chatbot_final directory not found, skipping chatbot startup');
    return null;
  }

  const requirementsPath = path.join(chatbotPath, 'requirements.txt');
  if (!fs.existsSync(requirementsPath)) {
    console.log('⚠️  requirements.txt not found in chatbot_final, skipping chatbot startup');
    return null;
  }

  console.log('🤖 Starting Python chatbot...');
  
  const chatbot = spawn('python', ['app.py'], {
    cwd: chatbotPath,
    stdio: 'pipe'
  });

  chatbot.stdout.on('data', (data) => {
    console.log(`🤖 ${data.toString().trim()}`);
  });

  chatbot.stderr.on('data', (data) => {
    console.log(`🤖 ERROR: ${data.toString().trim()}`);
  });

  chatbot.on('close', (code) => {
    console.log(`🤖 Chatbot process exited with code ${code}`);
  });

  chatbot.on('error', (error) => {
    console.error(`🤖 Failed to start chatbot: ${error.message}`);
  });

  return chatbot;
}

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: true, // Allow all origins for deployment
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'success',
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/todo', todoRoutes);
app.use('/api/groupTodo', groupTodoRoutes);
app.use('/api/ai', aiOptimizationRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/collaboration', realTimeCollaborationRoutes);

app.use('/api/private-chat', privateChatRoutes);
app.use('/api/classroom', classroomRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/teacher/assignments', teacherAssignmentsRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/group-system', groupSystemRoutes);

// Advanced Group System Routes
const advancedGroupSystemRoutes = require('./routes/advancedGroupSystem');
app.use('/api/advanced-group-system', advancedGroupSystemRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/chatbot-adapter', chatbotAdapterRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-rag', aiRagRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/admin', adminRoutes);

// Temporary route to reload User model (for testing)
app.post('/api/reload-user-model', async (req, res) => {
  try {
    console.log('🔄 Reloading User model...');
    
    // Import models to get reloadUserModel function
    const { reloadUserModel } = require('./models');
    
    // Reload User model
    const newUser = reloadUserModel();
    
    console.log('✅ User model reloaded successfully');
    
    res.json({
      success: true,
      message: 'User model reloaded successfully',
      fields: Object.keys(newUser.rawAttributes)
    });
    
  } catch (error) {
    console.error('❌ Error reloading User model:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error reloading User model: ' + error.message
    });
  }
});
app.use('/api/statistics', statisticsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/shop', shopRoutes);
// app.use('/api/pets', petsRoutes);
app.use('/api/profile-decorations', require('./routes/profile-decorations'));
app.use('/api/ai-scheduler', aiSchedulerRoutes);
app.use('/api/daily-rewards', dailyRewardsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/focus-rooms', focusRoomsRoutes);
app.use('/api/calendar', calendarRoutes);
// Thread/Chat routes
app.use('/api/thread', threadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/advanced-chat', advancedChatRoutes);

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// Enhanced API routes
app.use('/api/enhanced-classroom', enhancedClassroomRoutes);
app.use('/api/todo-assignments', todoAssignmentRoutes);
app.use('/api/themes', themesRoutes);

// Additional API routes
app.use('/api/friends', friendsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/file', fileRoutes);

app.use('/api/progress', progressRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/resource', resourceRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/event', eventRoutes);

app.use('/api/bot-config', botConfigRoutes);
app.use('/api/trial', trialRoutes);
app.use('/api/orchestrator', orchestratorRoutes);
app.use('/api/notification', notificationRoutes);

// WebSocket setup with optimized configuration
const io = new Server(server, {
  cors: { 
    origin: true, // Allow all origins for deployment
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Optimize for better performance
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  maxHttpBufferSize: 1e6, // 1MB
  allowRequest: (req, callback) => {
    // Allow all requests for now
    callback(null, true);
  }
});



// Initialize Advanced Group Todo Socket
const groupTodoSocket = new GroupTodoSocket(io);
groupTodoSocket.setupSocketHandlers();
console.log('✅ Advanced Group Todo WebSocket initialized');

// Make groupTodoSocket available to routes
app.set('groupTodoSocket', groupTodoSocket);

// Make io available to routes
app.set('io', io);

// Initialize Statistics Broadcaster
const statisticsBroadcaster = require('./services/statisticsBroadcaster');

// Initialize Scheduled Message Service
const scheduledMessageService = require('./services/scheduledMessageService');

// Make io globally available for statistics broadcaster
global.io = io;

// Main WebSocket authentication middleware (for other namespaces)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    // Allow connection without token for now (for testing)
    socket.userId = null;
    socket.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    socket.userId = decoded.id;
    socket.user = decoded;
    next();
  } catch (error) {
    console.error('WebSocket authentication error:', error);
    // Allow connection without token for now (for testing)
    socket.userId = null;
    socket.user = null;
    next();
  }
});

// Initialize Chat Socket Handler and Global WebSocket events
io.on('connection', (socket) => {
  console.log(`User ${socket.user?.name || 'Unknown'} connected to main namespace`);
  
  // Initialize chat socket handler
  handleChatSocket(io, socket);

  // Presence management
  socket.on('presence:online', () => {
    socket.data.online = true;
  });
  socket.on('presence:offline', () => {
    socket.data.online = false;
  });

  // Join/leave group chat rooms
  socket.on('joinGroup', (groupId) => {
    const room = `group:${groupId}`;
    socket.join(room);
    console.log(`🔌 User ${socket.userId} joined group room: ${groupId}`);
    socket.to(room).emit('presence:joined', { userId: socket.userId, name: socket.user?.name });
  });
  socket.on('leaveGroup', (groupId) => {
    const room = `group:${groupId}`;
    socket.leave(room);
    socket.to(room).emit('presence:left', { userId: socket.userId });
  });

  // Typing indicators
  socket.on('typing', (payload) => {
    const { groupId } = payload || {};
    if (!groupId) return;
    const room = `group:${groupId}`;
    socket.to(room).emit('user_typing', { userId: socket.userId, name: socket.user?.name, roomId: groupId });
  });
  socket.on('stopTyping', (payload) => {
    const { groupId } = payload || {};
    if (!groupId) return;
    const room = `group:${groupId}`;
    socket.to(room).emit('user_stopped_typing', { userId: socket.userId, roomId: groupId });
  });

  // Chat messages (group)
  socket.on('chat:message', async (payload) => {
    try {
      const { groupId, content, messageType = 'text', fileUrl = null, roomId } = payload || {};
      if (!groupId || !content) return;
      
      // Join the group room if not already joined
      const room = `group:${groupId}`;
      if (!socket.rooms.has(room)) {
        socket.join(room);
      }
      
      const { Message } = require('./models');
      const message = await Message.create({
        senderId: socket.userId,
        groupId,
        content,
        messageType,
        fileUrl
      });
      
      // Emit to the specific group room
      io.to(room).emit('new_message', {
        id: message.id,
        senderId: socket.userId,
        groupId,
        content,
        type: messageType, // Change messageType to type
        fileUrl,
        createdAt: message.createdAt,
        roomId: groupId // Add roomId for frontend matching
      });
    } catch (err) {
      console.error('chat:message error', err);
    }
  });

  // Direct messages
  socket.on('dm:join', (peerUserId) => {
    const room = `dm:${[socket.userId, peerUserId].sort().join(':')}`;
    socket.join(room);
  });
  socket.on('dm:message', async (payload) => {
    try {
      const { toUserId, content, messageType = 'text', fileUrl = null } = payload || {};
      if (!toUserId || !content) return;
      const room = `dm:${[socket.userId, toUserId].sort().join(':')}`;
      const { Message } = require('./models');
      const message = await Message.create({
        senderId: socket.userId,
        receiverId: toUserId,
        content,
        messageType,
        fileUrl
      });
      io.to(room).emit('dm_new_message', {
        id: message.id,
        senderId: socket.userId,
        receiverId: toUserId,
        content,
        type: messageType, // Change messageType to type
        fileUrl,
        createdAt: message.createdAt
      });
    } catch (err) {
      console.error('dm:message error', err);
    }
  });

  // WebRTC signaling for calls
  socket.on('call_offer', ({ toUserId, offer, roomId, callType }) => {
    io.emit(`call_offer_${toUserId}`, { fromUserId: socket.userId, offer, roomId, callType });
  });
  socket.on('call_answer', ({ toUserId, answer, sessionId }) => {
    io.emit(`call_answer_${toUserId}`, { fromUserId: socket.userId, answer, sessionId });
  });
  socket.on('call_ice_candidate', ({ toUserId, candidate, roomId }) => {
    io.emit(`call_ice_${toUserId}`, { fromUserId: socket.userId, candidate, roomId });
  });
  socket.on('call_end', ({ toUserId, sessionId }) => {
    io.emit(`call_end_${toUserId}`, { fromUserId: socket.userId, sessionId });
  });

  socket.on('disconnect', (reason) => {
    console.log(`User ${socket.user?.name || 'Unknown'} disconnected:`, reason);
  });

  // Heartbeat for main namespace
  socket.on('heartbeat', (data) => {
    try {
      const timestamp = data?.timestamp || Date.now();
      socket.emit('heartbeat-ack', {
        timestamp: timestamp,
        serverTime: Date.now()
      });
    } catch (error) {
      console.error('Main namespace heartbeat error:', error);
      socket.emit('heartbeat-ack', {
        timestamp: Date.now(),
        serverTime: Date.now()
      });
    }
  });
});


// WebSocket test endpoint
app.get('/ws-test', (req, res) => {
  res.json({ 
    status: 'success',
    message: 'WebSocket server is running',
    timestamp: new Date().toISOString(),
    socketIO: true
  });
});

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Apply rate limiting to all routes
app.use(apiLimiter);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize server
const initializeServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    const PORT = config.PORT || 5001;
    server.listen(PORT, '0.0.0.0', async () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`✅ API Base: http://localhost:${PORT}/api`);
      console.log(`✅ WebSocket: ws://localhost:${PORT}`);
      console.log(`✅ Study rooms: ws://localhost:${PORT}/study-rooms`);
      console.log(`✅ Database: Supabase PostgreSQL connected`);
      console.log(`✅ CORS enabled for: http://localhost:5173, http://localhost:3000, http://localhost:5001`);
      
      // Initialize and start statistics broadcasting
      await statisticsBroadcaster.initialize();
      console.log(`✅ Statistics broadcasting initialized and started`);
      
      // Start scheduled message service
      try {
        await scheduledMessageService.start();
        console.log('📅 Scheduled Message Service: ✅ Running');
      } catch (error) {
        console.error('❌ Failed to start Scheduled Message Service:', error);
      }
      
      // Start Python chatbot
      setTimeout(() => {
        chatbotProcess = startChatbot();
        if (chatbotProcess) {
          console.log('🤖 Chatbot: ✅ Starting on http://localhost:8000');
          console.log('📚 Chatbot Docs: http://localhost:8000/docs');
        }
      }, 2000); // Wait 2 seconds for backend to fully start
    });
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    process.exit(1);
  }
};

// Start the server
initializeServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (chatbotProcess) {
    console.log('🛑 Stopping chatbot...');
    chatbotProcess.kill();
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (chatbotProcess) {
    console.log('🛑 Stopping chatbot...');
    chatbotProcess.kill();
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

