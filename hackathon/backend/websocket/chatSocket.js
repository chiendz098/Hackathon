const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, ChatRoom, ChatParticipant, ChatMessage, MessageReaction, MessageRead, CallSession } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Store connected users and their status
const connectedUsers = new Map();
const userRooms = new Map();
const typingUsers = new Map();
const activeCalls = new Map();

// Utility functions
const generateEncryptionKey = () => crypto.randomBytes(32).toString('hex');
const sanitizeInput = (input) => input.replace(/[<>]/g, '');

const handleChatSocket = (io, socket) => {
  console.log(`🚀 Enhanced chat socket connected: ${socket.id}`);

  // Enhanced authentication with presence management
  socket.on('authenticate', async (data) => {
    try {
      const { token, status = 'online', customStatus = null } = data;
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        socket.emit('auth_error', { message: 'User not found' });
        return;
      }

      // Update user online status and custom status
      await user.update({ 
        online: true, 
        lastSeen: new Date(),
        status: status,
        customStatus: customStatus
      });

      // Store user connection with enhanced data
      connectedUsers.set(socket.id, {
        userId: user.id,
        user: user,
        socketId: socket.id,
        status: status,
        customStatus: customStatus,
        joinedAt: new Date(),
        lastActivity: new Date()
      });

      socket.userId = user.id;
      socket.user = user;
      socket.userStatus = status;

      // Join user's chat rooms
      const userRooms = await ChatParticipant.findAll({
        where: { userId: user.id },
        include: [{ model: ChatRoom, as: 'room' }]
      });

      userRooms.forEach(participant => {
        socket.join(`room_${participant.roomId}`);
        socket.join(`presence_${participant.roomId}`);
      });

      // Notify others that user is online with status
      socket.broadcast.emit('user_online', {
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        status: status,
        customStatus: customStatus
      });

      // Emit authenticated event with user data
      socket.emit('authenticated', {
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        status: status,
        customStatus: customStatus
      });

      console.log(`✅ User ${user.name} authenticated for enhanced chat with status: ${status}`);
    } catch (error) {
      console.error('❌ Chat authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  });

  // Enhanced room management
  socket.on('join_room', async (data) => {
    try {
      const { roomId, joinAs = 'participant' } = data;
      
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Handle virtual todo rooms
      if (roomId.startsWith('todo_')) {
        const todoId = roomId.replace('todo_', '');
        
        // For todo rooms, allow joining without checking ChatParticipant
        socket.join(`room_${roomId}`);
        socket.join(`presence_${roomId}`);
        
        // Notify room members
        socket.to(`room_${roomId}`).emit('user_joined_room', {
          userId: socket.userId,
          name: socket.user.name,
          roomId,
          status: socket.userStatus,
          customStatus: socket.user.customStatus
        });

        console.log(`👥 User ${socket.user.name} joined todo room ${roomId}`);
        return;
      }

      // Regular chat room logic
      // Check if user is participant in this room
      const participant = await ChatParticipant.findOne({
        where: { userId: socket.userId, roomId }
      });

      if (!participant) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      socket.join(`room_${roomId}`);
      socket.join(`presence_${roomId}`);
      
      // Update last seen and typing status
      await participant.update({ 
        lastSeen: new Date(),
        isTyping: false
      });

      // Notify room members
      socket.to(`room_${roomId}`).emit('user_joined_room', {
        userId: socket.userId,
        name: socket.user.name,
        roomId,
        status: socket.userStatus,
        customStatus: socket.user.customStatus
      });

      console.log(`👥 User ${socket.user.name} joined room ${roomId}`);
    } catch (error) {
      console.error('❌ Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Enhanced message handling with all features
  socket.on('send_message', async (data) => {
    try {
      const { 
        roomId, 
        content, 
        type = 'text', 
        replyToId, 
        threadId,
        attachments = [],
        scheduledAt = null,
        selfDestructAt = null,
        mentions = [],
        encryptionKey = null
      } = data;
      
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Validate message
      if (!content && (!attachments || attachments.length === 0)) {
        socket.emit('error', { message: 'Message content is required' });
        return;
      }

      // Handle virtual todo rooms
      if (roomId.startsWith('todo_')) {
        const todoId = roomId.replace('todo_', '');
        
        // For todo rooms, we'll handle the message creation in the route
        // Just emit the message to the room for now
        const messageData = {
          roomId,
          senderId: socket.userId,
          content: sanitizeInput(content),
          type,
          replyToId,
          threadId,
          attachments,
          mentions,
          scheduledAt,
          selfDestructAt,
          encryptionKey: encryptionKey || generateEncryptionKey(),
          timestamp: new Date()
        };

        // Broadcast message to room
        io.to(`room_${roomId}`).emit('new_message', {
          message: messageData,
          roomId,
          timestamp: new Date()
        });

        return;
      }

      // Regular chat room logic
      // Check if user is participant in this room
      const participant = await ChatParticipant.findOne({
        where: { userId: socket.userId, roomId }
      });

      if (!participant) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Handle scheduled messages
      if (scheduledAt && new Date(scheduledAt) > new Date()) {
        // Store scheduled message
        const scheduledMessage = await ChatMessage.create({
          roomId,
          senderId: socket.userId,
          content: sanitizeInput(content),
          type,
          replyToId,
          threadId,
          attachments,
          scheduledAt: new Date(scheduledAt),
          mentions,
          encryptionKey: encryptionKey || generateEncryptionKey(),
          metadata: {
            isScheduled: true,
            originalSender: socket.userId
          }
        });

        socket.emit('message_scheduled', {
          messageId: scheduledMessage.id,
          scheduledAt: scheduledAt
        });

        // Schedule message delivery
        setTimeout(async () => {
          await deliverScheduledMessage(scheduledMessage.id, io);
        }, new Date(scheduledAt) - new Date());

        return;
      }

      // Create message with all features
      const message = await ChatMessage.create({
        roomId,
        senderId: socket.userId,
        content: sanitizeInput(content),
        type,
        replyToId,
        threadId,
        attachments,
        mentions,
        encryptionKey: encryptionKey || generateEncryptionKey(),
        selfDestructAt: selfDestructAt ? new Date(selfDestructAt) : null,
        sentAt: new Date(),
        metadata: {
          isScheduled: false,
          originalSender: socket.userId
        }
      });

      // Get message with sender info and reactions
      const messageWithSender = await ChatMessage.findByPk(message.id, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'name', 'avatar', 'status', 'customStatus'] },
          { model: ChatMessage, as: 'replyTo', attributes: ['id', 'content', 'senderId'], required: false },
          { model: ChatMessage, as: 'thread', attributes: ['id', 'content'], required: false }
        ]
      });

      // Update room's last activity (skip for virtual todo rooms)
      if (!roomId.startsWith('todo_')) {
        await ChatRoom.update(
          { lastActivity: new Date() },
          { where: { id: roomId } }
        );

        // Increment unread count for other participants
        await ChatParticipant.increment('unreadCount', {
          where: { 
            roomId, 
            userId: { [Op.ne]: socket.userId }
          }
        });
      }

      // Handle mentions and send notifications
      if (mentions.length > 0) {
        await handleMentions(mentions, message, roomId, io);
      }

      // Broadcast message to room with enhanced data
      io.to(`room_${roomId}`).emit('new_message', {
        message: messageWithSender,
        roomId,
        timestamp: new Date()
      });

      // Handle self-destruct messages
      if (selfDestructAt) {
        setTimeout(async () => {
          await handleSelfDestruct(message.id, io);
        }, new Date(selfDestructAt) - new Date());
      }

      console.log(`💬 Enhanced message sent in room ${roomId} by ${socket.user.name}`);
    } catch (error) {
      console.error('❌ Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Enhanced typing indicators with room awareness
  socket.on('typing_start', async (data) => {
    const { roomId } = data;
    
    if (!socket.userId || !roomId) return;

    try {
      // Update typing status in database (skip for virtual todo rooms)
      if (!roomId.startsWith('todo_')) {
        await ChatParticipant.update(
          { isTyping: true, lastTyping: new Date() },
          { where: { userId: socket.userId, roomId } }
        );
      }

      // Add to typing users map
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }
      typingUsers.get(roomId).add(socket.userId);

      socket.to(`room_${roomId}`).emit('user_typing', {
        userId: socket.userId,
        name: socket.user.name,
        roomId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Typing start error:', error);
    }
  });

  socket.on('typing_stop', async (data) => {
    const { roomId } = data;
    
    if (!socket.userId || !roomId) return;

    try {
      // Update typing status in database (skip for virtual todo rooms)
      if (!roomId.startsWith('todo_')) {
        await ChatParticipant.update(
          { isTyping: false },
          { where: { userId: socket.userId, roomId } }
        );
      }

      // Remove from typing users map
      if (typingUsers.has(roomId)) {
        typingUsers.get(roomId).delete(socket.userId);
        if (typingUsers.get(roomId).size === 0) {
          typingUsers.delete(roomId);
        }
      }

      socket.to(`room_${roomId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        roomId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Typing stop error:', error);
    }
  });

  // Message reactions
  socket.on('add_reaction', async (data) => {
    try {
      const { messageId, emoji } = data;
      
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Check if reaction already exists
      const existingReaction = await MessageReaction.findOne({
        where: { messageId, userId: socket.userId, emoji }
      });

      if (existingReaction) {
        socket.emit('error', { message: 'Reaction already exists' });
        return;
      }

      // Create reaction
      const reaction = await MessageReaction.create({
        messageId,
        userId: socket.userId,
        emoji
      });

      // Get reaction with user info
      const reactionWithUser = await MessageReaction.findByPk(reaction.id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }]
      });

      // Broadcast reaction to all users in the room
      const message = await ChatMessage.findByPk(messageId, { include: [{ model: ChatRoom, as: 'room' }] });
      if (message) {
        io.to(`room_${message.roomId}`).emit('reaction_added', {
          reaction: reactionWithUser,
          messageId,
          roomId: message.roomId
        });
      }

      console.log(`😀 Reaction ${emoji} added to message ${messageId} by ${socket.user.name}`);
    } catch (error) {
      console.error('❌ Add reaction error:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  socket.on('remove_reaction', async (data) => {
    try {
      const { messageId, emoji } = data;
      
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Remove reaction
      await MessageReaction.destroy({
        where: { messageId, userId: socket.userId, emoji }
      });

      // Broadcast reaction removal
      const message = await ChatMessage.findByPk(messageId, { include: [{ model: ChatRoom, as: 'room' }] });
      if (message) {
        io.to(`room_${message.roomId}`).emit('reaction_removed', {
          messageId,
          userId: socket.userId,
          emoji,
          roomId: message.roomId
        });
      }

      console.log(`😀 Reaction ${emoji} removed from message ${messageId} by ${socket.user.name}`);
    } catch (error) {
      console.error('❌ Remove reaction error:', error);
      socket.emit('error', { message: 'Failed to remove reaction' });
    }
  });

  // Enhanced message read receipts
  socket.on('mark_read', async (data) => {
    try {
      const { roomId, messageIds } = data;
      
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Mark messages as read
      await MessageRead.bulkCreate(
        messageIds.map(messageId => ({
          messageId,
          userId: socket.userId,
          readAt: new Date()
        })),
        { ignoreDuplicates: true }
      );

      // Update unread count (skip for virtual todo rooms)
      if (!roomId.startsWith('todo_')) {
        await ChatParticipant.update(
          { unreadCount: 0 },
          { where: { userId: socket.userId, roomId } }
        );
      }

      // Notify sender that messages were read
      socket.to(`room_${roomId}`).emit('messages_read', {
        readerId: socket.userId,
        readerName: socket.user.name,
        messageIds,
        roomId,
        timestamp: new Date()
      });

      console.log(`✅ Messages marked as read by ${socket.user.name} in room ${roomId}`);
    } catch (error) {
      console.error('❌ Mark read error:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  // Message editing
  socket.on('edit_message', async (data) => {
    try {
      const { messageId, newContent } = data;
      
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Get message and check ownership
      const message = await ChatMessage.findByPk(messageId);
      if (!message || message.senderId !== socket.userId) {
        socket.emit('error', { message: 'Cannot edit this message' });
        return;
      }

      // Update message
      await message.update({
        content: sanitizeInput(newContent),
        editedAt: new Date()
      });

      // Broadcast edited message
      const messageWithSender = await ChatMessage.findByPk(messageId, {
        include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] }]
      });

      io.to(`room_${message.roomId}`).emit('message_edited', {
        message: messageWithSender,
        roomId: message.roomId,
        timestamp: new Date()
      });

      console.log(`✏️ Message ${messageId} edited by ${socket.user.name}`);
    } catch (error) {
      console.error('❌ Edit message error:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // Message deletion
  socket.on('delete_message', async (data) => {
    try {
      const { messageId } = data;
      
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Get message and check permissions
      const message = await ChatMessage.findByPk(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check if user can delete (sender or admin) - skip for virtual todo rooms
      let participant = null;
      if (!message.roomId.startsWith('todo_')) {
        participant = await ChatParticipant.findOne({
          where: { userId: socket.userId, roomId: message.roomId }
        });
      }

      if (message.senderId !== socket.userId && (!participant || participant.role !== 'admin')) {
        socket.emit('error', { message: 'Cannot delete this message' });
        return;
      }

      // Soft delete message
      await message.update({
        isDeleted: true,
        content: '[Message deleted]',
        attachments: []
      });

      // Broadcast message deletion
      io.to(`room_${message.roomId}`).emit('message_deleted', {
        messageId,
        roomId: message.roomId,
        deletedBy: socket.userId,
        timestamp: new Date()
      });

      console.log(`🗑️ Message ${messageId} deleted by ${socket.user.name}`);
    } catch (error) {
      console.error('❌ Delete message error:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Enhanced video call handling
  socket.on('call_offer', async (data) => {
    try {
      const { toUserId, offer, roomId, callType = 'video' } = data;
      
      if (!socket.userId) return;

      // Create call session
      const callSession = await CallSession.create({
        roomId,
        initiatorId: socket.userId,
        callType,
        status: 'initiating',
        participants: [socket.userId, toUserId]
      });

      // Store active call
      activeCalls.set(callSession.id, {
        sessionId: callSession.id,
        roomId,
        initiatorId: socket.userId,
        callType,
        participants: [socket.userId, toUserId]
      });

      // Send offer to target user
      io.emit(`call_offer_${toUserId}`, {
        fromUserId: socket.userId,
        fromName: socket.user.name,
        offer,
        roomId,
        callType,
        sessionId: callSession.id
      });

      console.log(`📞 Call offer sent from ${socket.user.name} to user ${toUserId}`);
    } catch (error) {
      console.error('❌ Call offer error:', error);
    }
  });

  socket.on('call_answer', async (data) => {
    try {
      const { toUserId, answer, sessionId } = data;
      
      if (!socket.userId) return;

      // Update call session status
      await CallSession.update(
        { status: 'connected' },
        { where: { id: sessionId } }
      );

      // Send answer to caller
      io.emit(`call_answer_${toUserId}`, {
        fromUserId: socket.userId,
        answer,
        sessionId
      });

      console.log(`📞 Call answered by ${socket.user.name}`);
    } catch (error) {
      console.error('❌ Call answer error:', error);
    }
  });

  socket.on('call_ice_candidate', (data) => {
    const { toUserId, candidate } = data;
    
    if (!socket.userId) return;

    io.emit(`call_ice_${toUserId}`, {
      fromUserId: socket.userId,
      candidate
    });
  });

  socket.on('call_end', async (data) => {
    try {
      const { sessionId, roomId } = data;
      
      if (!socket.userId) return;

      // Update call session
      await CallSession.update(
        { 
          status: 'ended',
          endedAt: new Date(),
          duration: Math.floor((new Date() - new Date()) / 1000)
        },
        { where: { id: sessionId } }
      );

      // Remove from active calls
      activeCalls.delete(sessionId);

      // Notify all participants
      io.to(`room_${roomId}`).emit('call_ended', {
        sessionId,
        roomId,
        endedBy: socket.userId,
        timestamp: new Date()
      });

      console.log(`📞 Call ${sessionId} ended by ${socket.user.name}`);
    } catch (error) {
      console.error('❌ Call end error:', error);
    }
  });

  // Presence management
  socket.on('presence_update', async (data) => {
    try {
      const { status, customStatus } = data;
      
      if (!socket.userId) return;

      // Update user status
      await User.update(
        { status, customStatus },
        { where: { id: socket.userId } }
      );

      // Update local status
      socket.userStatus = status;
      if (connectedUsers.has(socket.id)) {
        connectedUsers.get(socket.id).status = status;
        connectedUsers.get(socket.id).customStatus = customStatus;
      }

      // Broadcast status change to all rooms user is in
      const userRooms = await ChatParticipant.findAll({
        where: { userId: socket.userId }
      });

      userRooms.forEach(participant => {
        socket.to(`presence_${participant.roomId}`).emit('presence_changed', {
          userId: socket.userId,
          name: socket.user.name,
          status,
          customStatus,
          roomId: participant.roomId,
          timestamp: new Date()
        });
      });

      console.log(`🔄 User ${socket.user.name} status updated to: ${status}`);
    } catch (error) {
      console.error('❌ Presence update error:', error);
    }
  });

  // Enhanced disconnect handling
  socket.on('disconnect', async (reason) => {
    console.log(`🔌 Enhanced chat socket disconnected: ${socket.id}, reason: ${reason}`);
    
    if (socket.userId) {
      try {
        // Update user offline status
        await User.update(
          { 
            online: false, 
            lastSeen: new Date() 
          },
          { where: { id: socket.userId } }
        );

        // Remove typing status from all rooms
        const userRooms = await ChatParticipant.findAll({
          where: { userId: socket.userId }
        });

        userRooms.forEach(participant => {
          if (typingUsers.has(participant.roomId)) {
            typingUsers.get(participant.roomId).delete(socket.userId);
            if (typingUsers.get(participant.roomId).size === 0) {
              typingUsers.delete(participant.roomId);
            }
          }

          // Notify room members
          socket.to(`room_${participant.roomId}`).emit('user_stopped_typing', {
            userId: socket.userId,
            roomId: participant.roomId
          });
        });

        // Notify others that user is offline
        socket.broadcast.emit('user_offline', {
          userId: socket.userId,
          name: socket.user?.name,
          timestamp: new Date()
        });

        console.log(`👤 User ${socket.user?.name} went offline`);
      } catch (error) {
        console.error('❌ Error updating user offline status:', error);
      }

      // Remove from connected users
      connectedUsers.delete(socket.id);
    }
  });
};

// Helper functions
const handleMentions = async (mentions, message, roomId, io) => {
  try {
    // Send notifications to mentioned users
    for (const userId of mentions) {
      const user = await User.findByPk(userId);
      if (user) {
        // Send notification to user
        io.emit(`notification_${userId}`, {
          type: 'mention',
          message: `${message.sender.name} mentioned you in a message`,
          data: {
            messageId: message.id,
            roomId,
            senderId: message.senderId,
            senderName: message.sender.name
          },
          timestamp: new Date()
        });
      }
    }
  } catch (error) {
    console.error('❌ Handle mentions error:', error);
  }
};

const handleSelfDestruct = async (messageId, io) => {
  try {
    const message = await ChatMessage.findByPk(messageId);
    if (message && !message.isDeleted) {
      await message.update({
        isDeleted: true,
        content: '[Message expired]'
      });

      io.to(`room_${message.roomId}`).emit('message_self_destructed', {
        messageId,
        roomId: message.roomId,
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('❌ Self destruct error:', error);
  }
};

const deliverScheduledMessage = async (messageId, io) => {
  try {
    const message = await ChatMessage.findByPk(messageId, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] },
        { model: ChatRoom, as: 'room' }
      ]
    });

    if (message && message.room) {
      // Mark as sent
      await message.update({
        sentAt: new Date(),
        metadata: { ...message.metadata, isScheduled: false }
      });

      // Broadcast message
      io.to(`room_${message.roomId}`).emit('new_message', {
        message,
        roomId: message.roomId,
        timestamp: new Date(),
        isScheduled: true
      });

      console.log(`⏰ Scheduled message ${messageId} delivered`);
    }
  } catch (error) {
    console.error('❌ Deliver scheduled message error:', error);
  }
};

module.exports = { 
  handleChatSocket, 
  connectedUsers, 
  typingUsers, 
  activeCalls 
}; 