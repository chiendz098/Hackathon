const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const supabase = require('../config/supabase');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.rooms = new Map(); // roomId -> Set of userIds
    this.userRooms = new Map(); // userId -> Set of roomIds
    this.typingUsers = new Map(); // roomId -> Map of userId -> typing info
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    
    console.log('WebSocket server initialized');
  }

  async verifyClient(info) {
    try {
      const url = new URL(info.req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) {
        return false;
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return false;
      }

      info.req.user = user;
      return true;
    } catch (error) {
      console.error('WebSocket verification error:', error);
      return false;
    }
  }

  handleConnection(ws, req) {
    const user = req.user;
    const userId = user.id;

    console.log(`WebSocket connected: User ${userId} (${user.name})`);

    // Add client to connections
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    // Set up message handlers
    ws.on('message', (data) => {
      this.handleMessage(ws, userId, data);
    });

    ws.on('close', () => {
      this.handleDisconnection(ws, userId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });

    // Send welcome message
    this.sendToUser(userId, {
      type: 'connection_established',
      data: {
        message: 'Connected to real-time notifications',
        timestamp: new Date().toISOString()
      }
    });

    // Send any pending notifications
    this.sendPendingNotifications(userId);
  }

  handleMessage(ws, userId, data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'join_room':
          this.joinRoom(userId, message.roomId);
          break;
          
        case 'leave_room':
          this.leaveRoom(userId, message.roomId);
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;
          
        case 'typing_start':
          this.handleTypingStart(userId, message.roomId, message.userName);
          break;
          
        case 'typing_stop':
          this.handleTypingStop(userId, message.roomId);
          break;

        case 'focus_timer_start':
          this.handleFocusTimerStart(message.roomId, message.timerData);
          break;

        case 'focus_timer_stop':
          this.handleFocusTimerStop(message.roomId);
          break;

        case 'focus_timer_update':
          this.handleFocusTimerUpdate(message.roomId, message.timerData);
          break;

        case 'screen_share_start':
          this.handleScreenShareStart(message.roomId, userId, message.userName);
          break;

        case 'screen_share_stop':
          this.handleScreenShareStop(message.roomId, userId, message.userName);
          break;

        case 'toggle_mute':
          this.handleToggleMute(message.roomId, userId, message.isMuted);
          break;

        case 'toggle_video':
          this.handleToggleVideo(message.roomId, userId, message.isVideoOff);
          break;

        case 'participant_activity':
          this.handleParticipantActivity(message.roomId, userId, message.activity);
          break;
          
        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  handleDisconnection(ws, userId) {
    console.log(`WebSocket disconnected: User ${userId}`);

    // Remove client from connections
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }

    // Remove user from all rooms
    if (this.userRooms.has(userId)) {
      const userRoomSet = this.userRooms.get(userId);
      userRoomSet.forEach(roomId => {
        this.leaveRoom(userId, roomId);
      });
    }
  }

  joinRoom(userId, roomId) {
    // Add user to room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(userId);

    // Add room to user's rooms
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId).add(roomId);

    console.log(`User ${userId} joined room ${roomId}`);

    // Notify other users in the room
    this.broadcastToRoom(roomId, {
      type: 'user_joined_room',
      data: {
        userId,
        roomId,
        timestamp: new Date().toISOString()
      }
    }, userId);

    // Confirm to the user
    this.sendToUser(userId, {
      type: 'room_joined',
      data: {
        roomId,
        timestamp: new Date().toISOString()
      }
    });

    // Update user presence in Supabase
    this.updateUserPresence(userId, roomId, 'online');
  }

  leaveRoom(userId, roomId) {
    // Remove user from room
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(userId);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }

    // Remove room from user's rooms
    if (this.userRooms.has(userId)) {
      this.userRooms.get(userId).delete(roomId);
      if (this.userRooms.get(userId).size === 0) {
        this.userRooms.delete(userId);
      }
    }

    console.log(`User ${userId} left room ${roomId}`);

    // Notify other users in the room
    this.broadcastToRoom(roomId, {
      type: 'user_left_room',
      data: {
        userId,
        roomId,
        timestamp: new Date().toISOString()
      }
    }, userId);

    // Confirm to the user
    this.sendToUser(userId, {
      type: 'room_left',
      data: {
        roomId,
        timestamp: new Date().toISOString()
      }
    });

    // Update user presence in Supabase
    this.updateUserPresence(userId, roomId, 'offline');

    // Remove typing status
    this.handleTypingStop(userId, roomId);
  }

  // Typing indicators
  handleTypingStart(userId, roomId, userName) {
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Map());
    }
    
    this.typingUsers.get(roomId).set(userId, {
      name: userName,
      timestamp: Date.now()
    });

    this.broadcastToRoom(roomId, {
      type: 'user_typing',
      data: {
        userId,
        userName,
        isTyping: true
      }
    }, userId);
  }

  handleTypingStop(userId, roomId) {
    if (this.typingUsers.has(roomId)) {
      this.typingUsers.get(roomId).delete(userId);
      if (this.typingUsers.get(roomId).size === 0) {
        this.typingUsers.delete(roomId);
      }
    }

    this.broadcastToRoom(roomId, {
      type: 'user_typing',
      data: {
        userId,
        isTyping: false
      }
    }, userId);
  }

  // Focus timer management
  handleFocusTimerStart(roomId, timerData) {
    this.broadcastToRoom(roomId, {
      type: 'focus_timer_started',
      data: {
        roomId,
        timerData,
        timestamp: new Date().toISOString()
      }
    });
  }

  handleFocusTimerStop(roomId) {
    this.broadcastToRoom(roomId, {
      type: 'focus_timer_stopped',
      data: {
        roomId,
        timestamp: new Date().toISOString()
      }
    });
  }

  handleFocusTimerUpdate(roomId, timerData) {
    this.broadcastToRoom(roomId, {
      type: 'focus_timer_update',
      data: {
        roomId,
        timerData,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Screen sharing
  handleScreenShareStart(roomId, userId, userName) {
    this.broadcastToRoom(roomId, {
      type: 'screen_share_start',
      data: {
        roomId,
        userId,
        userName,
        timestamp: new Date().toISOString()
      }
    }, userId);
  }

  handleScreenShareStop(roomId, userId, userName) {
    this.broadcastToRoom(roomId, {
      type: 'screen_share_stop',
      data: {
        roomId,
        userId,
        userName,
        timestamp: new Date().toISOString()
      }
    }, userId);
  }

  // Audio/Video controls
  handleToggleMute(roomId, userId, isMuted) {
    this.broadcastToRoom(roomId, {
      type: 'user_mute_toggled',
      data: {
        roomId,
        userId,
        isMuted,
        timestamp: new Date().toISOString()
      }
    }, userId);
  }

  handleToggleVideo(roomId, userId, isVideoOff) {
    this.broadcastToRoom(roomId, {
      type: 'user_video_toggled',
      data: {
        roomId,
        userId,
        isVideoOff,
        timestamp: new Date().toISOString()
      }
    }, userId);
  }

  // Participant activity
  handleParticipantActivity(roomId, userId, activity) {
    this.broadcastToRoom(roomId, {
      type: 'participant_activity',
      data: {
        roomId,
        userId,
        activity,
        timestamp: new Date().toISOString()
      }
    }, userId);
  }

  // Update user presence in Supabase
  async updateUserPresence(userId, roomId, status) {
    try {
      await supabase

        .update({ 
          last_seen: new Date().toISOString(),
          status: status
        })
        .eq('room_id', roomId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  }

  sendToUser(userId, message) {
    if (this.clients.has(userId)) {
      const userConnections = this.clients.get(userId);
      const messageStr = JSON.stringify(message);
      
      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }

  broadcastToRoom(roomId, message, excludeUserId = null) {
    if (this.rooms.has(roomId)) {
      const roomUsers = this.rooms.get(roomId);
      
      roomUsers.forEach(userId => {
        if (userId !== excludeUserId) {
          this.sendToUser(userId, message);
        }
      });
    }
  }

  broadcastToAll(message, excludeUserId = null) {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach((connections, userId) => {
      if (userId !== excludeUserId) {
        connections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(messageStr);
          }
        });
      }
    });
  }

  // Notification-specific methods
  sendNotification(userId, notification) {
    this.sendToUser(userId, {
      type: 'notification',
      data: notification
    });
  }

  sendAchievementNotification(userId, achievement) {
    this.sendToUser(userId, {
      type: 'achievement_earned',
      data: achievement
    });
  }

  sendLevelUpNotification(userId, levelData) {
    this.sendToUser(userId, {
      type: 'level_up',
      data: levelData
    });
  }

  sendFriendRequestNotification(userId, friendRequest) {
    this.sendToUser(userId, {
      type: 'friend_request',
      data: friendRequest
    });
  }

  sendMessageNotification(userId, messageData) {
    this.sendToUser(userId, {
      type: 'message_received',
      data: messageData
    });
  }



  // Utility methods
  getConnectedUsers() {
    return Array.from(this.clients.keys());
  }

  getUserConnectionCount(userId) {
    return this.clients.has(userId) ? this.clients.get(userId).size : 0;
  }

  getRoomParticipants(roomId) {
    return this.rooms.has(roomId) ? Array.from(this.rooms.get(roomId)) : [];
  }

  isUserOnline(userId) {
    return this.clients.has(userId) && this.clients.get(userId).size > 0;
  }

  async sendPendingNotifications(userId) {
    try {
      const { Notification } = require('../models');
      const pendingNotifications = await Notification.getUserNotifications(userId, {
        unreadOnly: true,
        limit: 10
      });

      if (pendingNotifications.length > 0) {
        this.sendToUser(userId, {
          type: 'pending_notifications',
          data: {
            notifications: pendingNotifications,
            count: pendingNotifications.length
          }
        });
      }
    } catch (error) {
      console.error('Error sending pending notifications:', error);
    }
  }

  // Health check
  healthCheck() {
    return {
      connected_users: this.clients.size,
      active_rooms: this.rooms.size,
      total_connections: Array.from(this.clients.values()).reduce((sum, connections) => sum + connections.size, 0),
      typing_users: this.typingUsers.size
    };
  }
}

module.exports = new WebSocketService();
