const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { 
  ChatRoom, 
  ChatParticipant, 
  ChatMessage, 
  MessageReaction, 
  MessageRead, 
  MessageEditHistory,
  PinnedMessage,
  ScheduledMessage,
  ChatModerator,
  ChatBan,
  ChatMute,
  CallSession, 
  User,
  UserProfile
} = require('../models');
const { Op, Sequelize } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const crypto = require('crypto');
const { Server } = require('socket.io');

// Configure multer for advanced file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/advanced-chat';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for advanced features
    files: 10 // Max 10 files per message
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
      'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/aac',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'application/json', 'application/xml', 'text/markdown',
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// ===== ADVANCED CHAT ROOM MANAGEMENT =====

// Create advanced chat room with enhanced features
router.post('/rooms', auth, async (req, res) => {
  try {
    const { 
      name, 
      type = 'group', 
      participantIds = [], 
      isPrivate = false, 
      description = '',
      settings = {},
      tags = [],
      maxParticipants = 100,
      allowFileSharing = true,
      allowReactions = true,
      allowEditing = true,
      requireApproval = false,
      autoArchive = false,
      archiveAfterDays = 30
    } = req.body;
    
    if (!name || !participantIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Room name and participants are required'
      });
    }

    // Add creator to participants if not included
    if (!participantIds.includes(req.user.id)) {
      participantIds.push(req.user.id);
    }

    // Create room with advanced settings
    const room = await ChatRoom.create({
      name,
      type,
      isPrivate,
      description,
      createdBy: req.user.id,
      lastActivity: new Date(),
      settings: {
        maxParticipants,
        allowFileSharing,
        allowReactions,
        allowEditing,
        requireApproval,
        autoArchive,
        archiveAfterDays,
        ...settings
      },
      tags: tags,
      status: 'active'
    });

    // Add participants with roles
    const participants = participantIds.map(userId => ({
      roomId: room.id,
      userId,
      role: userId === req.user.id ? 'admin' : 'participant',
      joinedAt: new Date(),
      isActive: true,
      permissions: userId === req.user.id ? ['all'] : ['read', 'write', 'react']
    }));

    await ChatParticipant.bulkCreate(participants);

    // Create moderator entry for creator
    await ChatModerator.create({
      roomId: room.id,
      userId: req.user.id,
      role: 'admin',
      permissions: {
        ban: true,
        mute: true,
        pin: true,
        moderate: true,
        delete: true
      },
      assignedBy: req.user.id,
      assignedAt: new Date()
    });

    // Get room with full details
    const roomWithDetails = await ChatRoom.findByPk(room.id, {
      include: [
        {
          model: ChatParticipant,
          as: 'participants',
          include: [{ 
            model: User, 
            as: 'user', 
            attributes: ['id', 'name', 'avatar', 'online', 'status'],
            include: [{ model: UserProfile, as: 'profile', attributes: ['level', 'experience'] }]
          }]
        },
        {
          model: ChatModerator,
          as: 'moderators',
          include: [{ 
            model: User, 
            as: 'user', 
            attributes: ['id', 'name', 'avatar'] 
          }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Advanced chat room created successfully',
      room: roomWithDetails
    });

  } catch (error) {
    console.error('Error creating advanced chat room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create advanced chat room',
      error: error.message
    });
  }
});

// Get advanced chat room with full details
router.get('/rooms/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Check if user is participant
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId: req.user.id, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat room'
      });
    }

    const room = await ChatRoom.findByPk(roomId, {
      include: [
        {
          model: ChatParticipant,
          as: 'participants',
          include: [{ 
            model: User, 
            as: 'user', 
            attributes: ['id', 'name', 'avatar', 'online', 'status'],
            include: [{ model: UserProfile, as: 'profile', attributes: ['level', 'experience'] }]
          }]
        },
        {
          model: ChatModerator,
          as: 'moderators',
          include: [{ 
            model: User, 
            as: 'user', 
            attributes: ['id', 'name', 'avatar'] 
          }]
        },
        {
          model: PinnedMessage,
          as: 'pinnedMessages',
          include: [{ 
            model: ChatMessage, 
            as: 'message',
            include: [{ 
              model: User, 
              as: 'user', 
              attributes: ['id', 'name', 'avatar'] 
            }]
          }]
        }
      ]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    res.json({
      success: true,
      room
    });

  } catch (error) {
    console.error('Error fetching advanced chat room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat room',
      error: error.message
    });
  }
});

// ===== ADVANCED MESSAGE SYSTEM =====

// Send advanced message with rich content
router.post('/messages', auth, upload.array('attachments', 10), async (req, res) => {
  try {
    const { 
      roomId, 
      content, 
      type = 'text',
      replyTo = null,
      mentions = [],
      tags = [],
      priority = 'normal',
      isEncrypted = false,
      scheduledFor = null
    } = req.body;

    // Check if user is participant
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId: req.user.id, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat room'
      });
    }

    // Check if user is muted
    const muteCheck = await ChatMute.findOne({
      where: { 
        roomId, 
        userId: req.user.id,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (muteCheck) {
      return res.status(403).json({
        success: false,
        message: 'You are currently muted in this room'
      });
    }

    // Handle scheduled messages
    if (scheduledFor) {
      const scheduledMessage = await ScheduledMessage.create({
        roomId,
        userId: req.user.id,
        content,
        type,
        replyTo,
        mentions,
        tags,
        priority,
        isEncrypted,
        scheduledAt: new Date(scheduledFor),
        status: 'pending'
      });

      return res.json({
        success: true,
        message: 'Message scheduled successfully',
        scheduledMessage
      });
    }

    // Process attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }));
    }

    // Create message
    const message = await ChatMessage.create({
      roomId,
      userId: req.user.id,
      content,
      type,
      replyTo,
      mentions: mentions.length > 0 ? mentions : null,
      tags: tags.length > 0 ? tags : null,
      priority,
      isEncrypted,
      attachments: attachments.length > 0 ? attachments : null,
      metadata: {
        sentAt: new Date(),
        clientInfo: req.headers['user-agent'],
        ipAddress: req.ip
      }
    });

    // Update room last activity
    await ChatRoom.update(
      { lastActivity: new Date() },
      { where: { id: roomId } }
    );

    // Get message with user details
    const messageWithUser = await ChatMessage.findByPk(message.id, {
      include: [{ 
        model: User, 
        as: 'user', 
        attributes: ['id', 'name', 'avatar', 'online'] 
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      message: messageWithUser
    });

  } catch (error) {
    console.error('Error sending advanced message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Edit message with history tracking
router.put('/messages/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content, reason = 'Updated' } = req.body;

    const message = await ChatMessage.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check permissions
    if (message.userId !== req.user.id) {
      const moderator = await ChatModerator.findOne({
        where: { 
          roomId: message.roomId, 
          userId: req.user.id,
          permissions: { [Op.contains]: ['edit'] }
        }
      });

      if (!moderator) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied to edit this message'
        });
      }
    }

    // Check if editing is allowed
    const room = await ChatRoom.findByPk(message.roomId);
    if (!room.settings.allowEditing) {
      return res.status(403).json({
        success: false,
        message: 'Message editing is disabled in this room'
      });
    }

    // Create edit history
    await MessageEditHistory.create({
      messageId,
      editedBy: req.user.id,
      previousContent: message.content,
      editedAt: new Date(),
      reason
    });

    // Update message
    await message.update({
      content,
      editedAt: new Date(),
      editedBy: req.user.id,
      editCount: (message.editCount || 0) + 1
    });

    res.json({
      success: true,
      message: 'Message edited successfully',
      message
    });

  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit message',
      error: error.message
    });
  }
});

// Delete message with moderation
router.delete('/messages/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason = 'Deleted by user' } = req.body;

    const message = await ChatMessage.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check permissions
    if (message.userId !== req.user.id) {
      const moderator = await ChatModerator.findOne({
        where: { 
          roomId: message.roomId, 
          userId: req.user.id,
          permissions: { [Op.contains]: ['delete'] }
        }
      });

      if (!moderator) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied to delete this message'
        });
      }
    }

    // Soft delete message
    await message.update({
      deletedAt: new Date(),
      deletedBy: req.user.id,
      deleteReason: reason
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
});

// ===== MESSAGE REACTIONS =====

// Add reaction to message
router.post('/messages/:messageId/reactions', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reaction, customEmoji } = req.body;

    if (!reaction && !customEmoji) {
      return res.status(400).json({
        success: false,
        message: 'Reaction or custom emoji is required'
      });
    }

    const message = await ChatMessage.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user already reacted
    const existingReaction = await MessageReaction.findOne({
      where: { messageId, userId: req.user.id }
    });

    if (existingReaction) {
      // Update existing reaction
      await existingReaction.update({
        reaction: reaction || customEmoji,
        updatedAt: new Date()
      });
    } else {
      // Create new reaction
      await MessageReaction.create({
        messageId,
        userId: req.user.id,
        reaction: reaction || customEmoji,
        createdAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Reaction added successfully'
    });

  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction',
      error: error.message
    });
  }
});

// Remove reaction from message
router.delete('/messages/:messageId/reactions/:reactionId', auth, async (req, res) => {
  try {
    const { messageId, reactionId } = req.params;

    const reaction = await MessageReaction.findOne({
      where: { id: reactionId, messageId, userId: req.user.id }
    });

    if (!reaction) {
      return res.status(404).json({
        success: false,
        message: 'Reaction not found'
      });
    }

    await reaction.destroy();

    res.json({
      success: true,
      message: 'Reaction removed successfully'
    });

  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction',
      error: error.message
    });
  }
});

// ===== MESSAGE PINNING =====

// Pin message
router.post('/messages/:messageId/pin', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason = 'Important message' } = req.body;

    const message = await ChatMessage.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check moderator permissions
    const moderator = await ChatModerator.findOne({
      where: { 
        roomId: message.roomId, 
        userId: req.user.id,
        permissions: { [Op.contains]: ['pin'] }
      }
    });

    if (!moderator) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied to pin messages'
      });
    }

    // Check if already pinned
    const existingPin = await PinnedMessage.findOne({
      where: { messageId, roomId: message.roomId }
    });

    if (existingPin) {
      return res.status(400).json({
        success: false,
        message: 'Message is already pinned'
      });
    }

    // Pin message
    await PinnedMessage.create({
      messageId,
      roomId: message.roomId,
      pinnerId: req.user.id,
      pinnedAt: new Date(),
      reason
    });

    res.json({
      success: true,
      message: 'Message pinned successfully'
    });

  } catch (error) {
    console.error('Error pinning message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pin message',
      error: error.message
    });
  }
});

// Unpin message
router.delete('/messages/:messageId/pin', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const pinnedMessage = await PinnedMessage.findOne({
      where: { messageId }
    });

    if (!pinnedMessage) {
      return res.status(404).json({
        success: false,
        message: 'Pinned message not found'
      });
    }

    // Check permissions
    if (pinnedMessage.pinnerId !== req.user.id) {
      const moderator = await ChatModerator.findOne({
        where: { 
          roomId: pinnedMessage.roomId, 
          userId: req.user.id,
          permissions: { [Op.contains]: ['pin'] }
        }
      });

      if (!moderator) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied to unpin messages'
        });
      }
    }

    await pinnedMessage.destroy();

    res.json({
      success: true,
      message: 'Message unpinned successfully'
    });

  } catch (error) {
    console.error('Error unpinning message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unpin message',
      error: error.message
    });
  }
});

// ===== SCHEDULED MESSAGES =====

// Get scheduled messages for a room
router.get('/rooms/:roomId/scheduled-messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check permissions
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId: req.user.id, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat room'
      });
    }

    const scheduledMessages = await ScheduledMessage.findAll({
      where: { 
        roomId,
        userId: req.user.id,
        status: 'pending'
      },
      order: [['scheduledAt', 'ASC']]
    });

    res.json({
      success: true,
      scheduledMessages
    });

  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled messages',
      error: error.message
    });
  }
});

// Cancel scheduled message
router.delete('/scheduled-messages/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const scheduledMessage = await ScheduledMessage.findByPk(messageId);
    if (!scheduledMessage) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled message not found'
      });
    }

    // Check ownership
    if (scheduledMessage.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied to cancel this message'
      });
    }

    await scheduledMessage.update({ status: 'cancelled' });

    res.json({
      success: true,
      message: 'Scheduled message cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel scheduled message',
      error: error.message
    });
  }
});

// ===== MODERATION SYSTEM =====

// Ban user from room
router.post('/rooms/:roomId/ban', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, reason, duration, isPermanent = false } = req.body;

    // Check moderator permissions
    const moderator = await ChatModerator.findOne({
      where: { 
        roomId, 
        userId: req.user.id,
        permissions: { [Op.contains]: ['ban'] }
      }
    });

    if (!moderator) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied to ban users'
      });
    }

    // Calculate expiration
    let expiresAt = null;
    if (!isPermanent && duration) {
      expiresAt = new Date(Date.now() + duration * 60 * 1000); // duration in minutes
    }

    // Create ban
    await ChatBan.create({
      roomId,
      userId,
      bannedBy: req.user.id,
      reason,
      bannedAt: new Date(),
      expiresAt,
      isPermanent
    });

    // Remove from participants
    await ChatParticipant.update(
      { isActive: false, leftAt: new Date() },
      { where: { roomId, userId } }
    );

    res.json({
      success: true,
      message: 'User banned successfully'
    });

  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ban user',
      error: error.message
    });
  }
});

// Unban user from room
router.delete('/rooms/:roomId/ban/:userId', auth, async (req, res) => {
  try {
    const { roomId, userId } = req.params;

    // Check moderator permissions
    const moderator = await ChatModerator.findOne({
      where: { 
        roomId, 
        userId: req.user.id,
        permissions: { [Op.contains]: ['ban'] }
      }
    });

    if (!moderator) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied to unban users'
      });
    }

    // Remove ban
    await ChatBan.destroy({
      where: { roomId, userId }
    });

    res.json({
      success: true,
      message: 'User unbanned successfully'
    });

  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unban user',
      error: error.message
    });
  }
});

// Mute user in room
router.post('/rooms/:roomId/mute', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, reason, duration } = req.body;

    if (!duration) {
      return res.status(400).json({
        success: false,
        message: 'Mute duration is required'
      });
    }

    // Check moderator permissions
    const moderator = await ChatModerator.findOne({
      where: { 
        roomId, 
        userId: req.user.id,
        permissions: { [Op.contains]: ['mute'] }
      }
    });

    if (!moderator) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied to mute users'
      });
    }

    // Calculate expiration
    const expiresAt = new Date(Date.now() + duration * 60 * 1000); // duration in minutes

    // Create or update mute
    await ChatMute.upsert({
      roomId,
      userId,
      mutedBy: req.user.id,
      reason,
      mutedAt: new Date(),
      expiresAt
    });

    res.json({
      success: true,
      message: 'User muted successfully'
    });

  } catch (error) {
    console.error('Error muting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mute user',
      error: error.message
    });
  }
});

// Unmute user in room
router.delete('/rooms/:roomId/mute/:userId', auth, async (req, res) => {
  try {
    const { roomId, userId } = req.params;

    // Check moderator permissions
    const moderator = await ChatModerator.findOne({
      where: { 
        roomId, 
        userId: req.user.id,
        permissions: { [Op.contains]: ['mute'] }
      }
    });

    if (!moderator) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied to unmute users'
      });
    }

    // Remove mute
    await ChatMute.destroy({
      where: { roomId, userId }
    });

    res.json({
      success: true,
      message: 'User unmuted successfully'
    });

  } catch (error) {
    console.error('Error unmuting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unmute user',
      error: error.message
    });
  }
});

// ===== ADVANCED SEARCH AND FILTERING =====

// Search messages with advanced filters
router.get('/search', auth, async (req, res) => {
  try {
    const { 
      roomId, 
      query, 
      userId, 
      type, 
      tags, 
      dateFrom, 
      dateTo, 
      hasAttachments,
      hasReactions,
      limit = 50,
      offset = 0
    } = req.query;

    // Build search conditions
    const whereConditions = {};
    if (roomId) whereConditions.roomId = roomId;
    if (userId) whereConditions.userId = userId;
    if (type) whereConditions.type = type;
    if (hasAttachments === 'true') whereConditions.attachments = { [Op.ne]: null };
    if (hasReactions === 'true') whereConditions.id = { [Op.in]: Sequelize.literal('(SELECT DISTINCT "messageId" FROM message_reactions)') };

    // Date range filter
    if (dateFrom || dateTo) {
      whereConditions.createdAt = {};
      if (dateFrom) whereConditions.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) whereConditions.createdAt[Op.lte] = new Date(dateTo);
    }

    // Text search
    if (query) {
      whereConditions.content = { [Op.iLike]: `%${query}%` };
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      whereConditions.tags = { [Op.overlap]: tagArray };
    }

    const messages = await ChatMessage.findAndCountAll({
      where: whereConditions,
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'name', 'avatar'] 
        },
        {
          model: MessageReaction,
          as: 'reactions',
          include: [{ 
            model: User, 
            as: 'user', 
            attributes: ['id', 'name', 'avatar'] 
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      messages: messages.rows,
      total: messages.count,
      hasMore: messages.count > offset + messages.rows.length
    });

  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages',
      error: error.message
    });
  }
});

// ===== ANALYTICS AND STATISTICS =====

// Get room statistics
router.get('/rooms/:roomId/stats', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check permissions
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId: req.user.id, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat room'
      });
    }

    // Get various statistics
    const [
      totalMessages,
      totalParticipants,
      totalReactions,
      pinnedMessages,
      scheduledMessages,
      activeModerators
    ] = await Promise.all([
      ChatMessage.count({ where: { roomId } }),
      ChatParticipant.count({ where: { roomId, isActive: true } }),
      MessageReaction.count({ 
        where: { 
          messageId: { [Op.in]: Sequelize.literal('(SELECT id FROM chat_messages WHERE "roomId" = ' + roomId + ')') }
        }
      }),
      PinnedMessage.count({ where: { roomId } }),
      ScheduledMessage.count({ where: { roomId, status: 'pending' } }),
      ChatModerator.count({ where: { roomId } })
    ]);

    // Get activity over time
    const activityData = await ChatMessage.findAll({
      where: { 
        roomId,
        createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      },
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']]
    });

    res.json({
      success: true,
      stats: {
        totalMessages,
        totalParticipants,
        totalReactions,
        pinnedMessages,
        scheduledMessages,
        activeModerators,
        activityData
      }
    });

  } catch (error) {
    console.error('Error fetching room statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room statistics',
      error: error.message
    });
  }
});

// ===== FILE MANAGEMENT =====

// Get file info
router.get('/files/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('uploads/advanced-chat', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const stats = fs.statSync(filePath);
    const fileInfo = {
      filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };

    res.json({
      success: true,
      fileInfo
    });

  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file info',
      error: error.message
    });
  }
});

// Download file
router.get('/files/:filename/download', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('uploads/advanced-chat', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.download(filePath);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
});

// ===== HEALTH CHECK =====

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Advanced Chat System is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// ===== MISSING ENDPOINTS FOR FRONTEND =====

// Get pinned messages for a room
router.get('/rooms/:roomId/pinned', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Check if user is participant
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId: req.user.id }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const pinnedMessages = await PinnedMessage.findAll({
      where: { roomId },
      include: [
        {
          model: ChatMessage,
          as: 'message',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'name', 'avatar']
            }
          ]
        },
        {
          model: User,
          as: 'pinner',
          attributes: ['id', 'name']
        }
      ],
      order: [['pinnedAt', 'DESC']]
    });

    res.json({
      success: true,
      pinnedMessages: pinnedMessages.map(pm => ({
        id: pm.id,
        message: pm.message,
        pinnedBy: pm.pinner,
        pinnedAt: pm.pinnedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching pinned messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pinned messages',
      error: error.message
    });
  }
});

// Get all scheduled messages for the current user
router.get('/messages/scheduled', auth, async (req, res) => {
  try {
    const scheduledMessages = await ScheduledMessage.findAll({
      where: { 
        scheduledBy: req.user.id,
        status: 'pending'
      },
      include: [
        {
          model: ChatMessage,
          as: 'message',
          include: [
            {
              model: ChatRoom,
              as: 'room',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['scheduledAt', 'ASC']]
    });

    res.json({
      success: true,
      scheduledMessages: scheduledMessages.map(sm => ({
        id: sm.id,
        message: sm.message,
        scheduledAt: sm.scheduledAt,
        status: sm.status
      }))
    });

  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled messages',
      error: error.message
    });
  }
});

// Get moderators for a room
router.get('/rooms/:roomId/moderators', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Check if user is participant
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId: req.user.id }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const moderators = await ChatModerator.findAll({
      where: { roomId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar', 'email']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'name']
        }
      ],
      order: [['assignedAt', 'ASC']]
    });

    res.json({
      success: true,
      moderators: moderators.map(mod => ({
        id: mod.id,
        user: mod.user,
        role: mod.role,
        permissions: mod.permissions,
        assignedBy: mod.assigner,
        assignedAt: mod.assignedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching moderators:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch moderators',
      error: error.message
    });
  }
});

// Forward a message to another room
router.post('/messages/:messageId/forward', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { targetRoomId } = req.body;
    
    if (!targetRoomId) {
      return res.status(400).json({
        success: false,
        message: 'Target room ID is required'
      });
    }

    // Get original message
    const originalMessage = await ChatMessage.findByPk(messageId, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });

    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is participant in target room
    const targetParticipant = await ChatParticipant.findOne({
      where: { roomId: targetRoomId, userId: req.user.id }
    });
    
    if (!targetParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to target room'
      });
    }

    // Create forwarded message
    const forwardedMessage = await ChatMessage.create({
      roomId: targetRoomId,
      senderId: req.user.id,
      content: originalMessage.content,
      type: originalMessage.type,
      attachments: originalMessage.attachments,
      isForwarded: true,
      forwardFrom: {
        messageId: originalMessage.id,
        roomId: originalMessage.roomId,
        sender: originalMessage.sender,
        forwardedAt: new Date()
      },
      sentAt: new Date()
    });

    // Get the created message with sender info
    const messageWithSender = await ChatMessage.findByPk(forwardedMessage.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'avatar', 'status', 'customStatus']
        }
      ]
    });

    res.json({
      success: true,
      message: messageWithSender
    });

  } catch (error) {
    console.error('Error forwarding message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to forward message',
      error: error.message
    });
  }
});

// Schedule a message
router.post('/messages/schedule', auth, async (req, res) => {
  try {
    const { 
      roomId, 
      content, 
      scheduledAt, 
      type = 'text',
      attachments = [],
      replyToId = null,
      threadId = null
    } = req.body;
    
    if (!roomId || !content || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'Room ID, content, and scheduled time are required'
      });
    }

    // Check if user is participant in the room
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId: req.user.id }
    });
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate scheduled time
    const scheduledTime = new Date(scheduledAt);
    if (scheduledTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time must be in the future'
      });
    }

    // Create the message first
    const message = await ChatMessage.create({
      roomId,
      senderId: req.user.id,
      content,
      type,
      attachments,
      replyToId,
      threadId,
      scheduledAt: scheduledTime,
      sentAt: null // Will be set when actually sent
    });

    // Create scheduled message record
    const scheduledMessage = await ScheduledMessage.create({
      messageId: message.id,
      scheduledBy: req.user.id,
      scheduledAt: scheduledTime,
      status: 'pending'
    });

    res.json({
      success: true,
      message: {
        id: message.id,
        scheduledAt: scheduledTime,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error scheduling message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule message',
      error: error.message
    });
  }
});

module.exports = router; 