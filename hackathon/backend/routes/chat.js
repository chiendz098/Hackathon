const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { ChatRoom, ChatParticipant, ChatMessage, MessageReaction, MessageRead, CallSession, User } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const crypto = require('crypto');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/chat';
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
    fileSize: 20 * 1024 * 1024, // 20MB limit
    files: 5 // Max 5 files per message
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mpeg', 'audio/ogg', 'audio/wav',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// ===== CHAT ROOM MANAGEMENT =====

// Create a new chat room
router.post('/rooms', auth, async (req, res) => {
  try {
    const { name, type = 'group', participantIds = [], isPrivate = false, description = '' } = req.body;
    
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

    // Create room
    const room = await ChatRoom.create({
      name,
      type,
      isPrivate,
      description,
      createdBy: req.user.id,
      lastActivity: new Date()
    });

    // Add participants
    const participants = participantIds.map(userId => ({
      roomId: room.id,
      userId,
      role: userId === req.user.id ? 'admin' : 'participant',
      joinedAt: new Date(),
      isActive: true
    }));

    await ChatParticipant.bulkCreate(participants);

    // Get room with participants
    const roomWithParticipants = await ChatRoom.findByPk(room.id, {
      include: [
        {
          model: ChatParticipant,
          as: 'participants',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar', 'online', 'status'] }]
        }
      ]
    });

    res.json({
      success: true,
      room: roomWithParticipants
    });
  } catch (error) {
    console.error('❌ Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chat room'
    });
  }
});

// Get user's chat rooms
router.get('/rooms', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // First get the room IDs where user is a participant
    const userParticipations = await ChatParticipant.findAll({
      where: { 
        userId: req.user.id, 
        isActive: true 
      },
      attributes: ['roomId']
    });

    const roomIds = userParticipations.map(p => p.roomId);

    if (roomIds.length === 0) {
      return res.json({
        success: true,
        rooms: [],
        total: 0,
        page: parseInt(page),
        totalPages: 0
      });
    }

    const whereClause = {
      id: { [Op.in]: roomIds }
    };

    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    const rooms = await ChatRoom.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ChatParticipant,
          as: 'participants',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar', 'online', 'status'] }]
        }
      ],
      order: [['lastActivity', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get last message and unread count for each room
    const roomsWithStats = await Promise.all(
      rooms.rows.map(async (room) => {
        const lastMessage = await ChatMessage.findOne({
          where: { roomId: room.id, isDeleted: false },
          order: [['createdAt', 'DESC']],
          include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] }]
        });

        const unreadCount = await MessageRead.count({
          where: {
            messageId: {
              [Op.in]: await ChatMessage.findAll({
                where: { roomId: room.id, isDeleted: false },
                attributes: ['id']
              }).then(messages => messages.map(m => m.id))
            },
            userId: req.user.id
          }
        });

        return {
          ...room.toJSON(),
          lastMessage,
          unreadCount
        };
      })
    );

    res.json({
      success: true,
      rooms: roomsWithStats,
      total: rooms.count,
      page: parseInt(page),
      totalPages: Math.ceil(rooms.count / limit)
    });
  } catch (error) {
    console.error('❌ Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat rooms'
    });
  }
});

// Get specific chat room
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
        message: 'Access denied'
      });
    }

    const room = await ChatRoom.findByPk(roomId, {
      include: [
        {
          model: ChatParticipant,
          as: 'participants',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar', 'online', 'status', 'customStatus'] }]
        }
      ]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('❌ Get room error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat room'
    });
  }
});

// ===== MESSAGE MANAGEMENT =====

// Get messages for a room with pagination and advanced filtering
router.get('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50, beforeId, afterId, threadId, search } = req.query;

    // Handle virtual todo rooms
    if (roomId.startsWith('todo_')) {
      const todoId = roomId.replace('todo_', '');
      
      // Redirect to todo chat endpoint
      const { Pool } = require('pg');
      const config = require('../config');
      const pool = new Pool({
        connectionString: config.DB_URI,
        ssl: { rejectUnauthorized: false }
      });

      try {
        // Get todo chat messages
        const query = `
          SELECT 
            gtc.*,
            u.name as user_name,
            u.avatar as user_avatar,
            u.email as user_email
          FROM group_todo_chat gtc
          LEFT JOIN users u ON gtc.user_id = u.id
          WHERE gtc.todo_id = $1 AND gtc.is_deleted = false
          ORDER BY gtc.created_at ASC
          LIMIT $2 OFFSET $3
        `;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const result = await pool.query(query, [parseInt(todoId), parseInt(limit), offset]);
        
        const messages = result.rows.map(row => ({
          id: row.id,
          content: row.content,
          messageType: row.message_type,
          createdAt: row.created_at,
          sender: {
            id: row.user_id,
            name: row.user_name,
            avatar: row.user_avatar,
            email: row.user_email
          }
        }));

        // Get total count
        const countQuery = `
          SELECT COUNT(*) as total
          FROM group_todo_chat gtc
          WHERE gtc.todo_id = $1 AND gtc.is_deleted = false
        `;
        const countResult = await pool.query(countQuery, [parseInt(todoId)]);
        const total = parseInt(countResult.rows[0].total);

        res.json({
          success: true,
          messages,
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit))
        });

        await pool.end();
        return;
      } catch (error) {
        console.error('❌ Todo chat error:', error);
        await pool.end();
        return res.status(500).json({
          success: false,
          message: 'Error fetching todo chat messages'
        });
      }
    }

    // Regular chat room logic
    // Check if user is participant
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId: req.user.id, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const offset = (page - 1) * limit;
    const whereClause = {
      roomId,
      isDeleted: false
    };

    // Handle thread filtering
    if (threadId) {
      whereClause.threadId = threadId;
    } else {
      whereClause.threadId = null; // Only main messages
    }

    // Handle search
    if (search) {
      whereClause.content = { [Op.iLike]: `%${search}%` };
    }

    // Handle pagination
    if (beforeId) {
      whereClause.id = { [Op.lt]: beforeId };
    } else if (afterId) {
      whereClause.id = { [Op.gt]: afterId };
    }

    const messages = await ChatMessage.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar', 'status'] },
        { model: ChatMessage, as: 'replyTo', attributes: ['id', 'content', 'senderId'], include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }] },
        { model: MessageReaction, as: 'messageReactions', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get read receipts for messages
    const messageIds = messages.rows.map(m => m.id);
    const readReceipts = await MessageRead.findAll({
      where: { messageId: { [Op.in]: messageIds } },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }]
    });

    // Group read receipts by message
    const readReceiptsMap = readReceipts.reduce((acc, receipt) => {
      if (!acc[receipt.messageId]) acc[receipt.messageId] = [];
      acc[receipt.messageId].push(receipt);
      return acc;
    }, {});

    // Add read receipts to messages
    const messagesWithReads = messages.rows.map(message => ({
      ...message.toJSON(),
      readReceipts: readReceiptsMap[message.id] || []
    }));

    res.json({
      success: true,
      messages: messagesWithReads,
      total: messages.count,
      page: parseInt(page),
      totalPages: Math.ceil(messages.count / limit)
    });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
});

// Send a message with file upload support
router.post('/rooms/:roomId/messages', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const { roomId } = req.params;
    const { 
      content, 
      type = 'text', 
      replyToId, 
      threadId,
      scheduledAt,
      selfDestructAt,
      mentions = []
    } = req.body;

    // Handle virtual todo rooms
    if (roomId.startsWith('todo_')) {
      const todoId = roomId.replace('todo_', '');
      
      // Insert message into group_todo_chat table
      const { Pool } = require('pg');
      const config = require('../config');
      const pool = new Pool({
        connectionString: config.DB_URI,
        ssl: { rejectUnauthorized: false }
      });

      try {
        const messageQuery = `
          INSERT INTO group_todo_chat (todo_id, user_id, content, message_type, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING *
        `;
        
        const result = await pool.query(messageQuery, [
          parseInt(todoId), req.user.id, content, type
        ]);
        
        const message = result.rows[0];
        
        // Get user details
        const userQuery = `
          SELECT name, avatar, email FROM users WHERE id = $1
        `;
        
        const userResult = await pool.query(userQuery, [req.user.id]);
        const user = userResult.rows[0];
        
        const responseData = {
          success: true,
          message: {
            id: message.id,
            content: message.content,
            messageType: message.message_type,
            createdAt: message.created_at,
            sender: {
              id: message.user_id,
              name: user.name,
              avatar: user.avatar,
              email: user.email
            }
          }
        };

        await pool.end();
        return res.json(responseData);
      } catch (error) {
        console.error('❌ Todo chat message error:', error);
        await pool.end();
        return res.status(500).json({
          success: false,
          message: 'Error sending todo chat message'
        });
      }
    }

    // Regular chat room logic
    // Check if user is participant
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId: req.user.id, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Handle file uploads
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/chat/${path.basename(file.path)}`
      }));
    }

    // Create message
    const message = await ChatMessage.create({
      roomId,
      senderId: req.user.id,
      content: content || '',
      type,
      replyToId: replyToId || null,
      threadId: threadId || null,
      attachments,
      mentions: mentions.length > 0 ? JSON.parse(mentions) : [],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      selfDestructAt: selfDestructAt ? new Date(selfDestructAt) : null,
      sentAt: new Date(),
      encryptionKey: crypto.randomBytes(32).toString('hex')
    });

    // Get message with sender info
    const messageWithSender = await ChatMessage.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar', 'status'] },
        { model: ChatMessage, as: 'replyTo', attributes: ['id', 'content', 'senderId'], include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }] }
      ]
    });

    // Update room's last activity
    await ChatRoom.update(
      { lastActivity: new Date() },
      { where: { id: roomId } }
    );

    // Increment unread count for other participants
    await ChatParticipant.increment('unreadCount', {
      where: { 
        roomId, 
        userId: { [Op.ne]: req.user.id }
      }
    });

    res.json({
      success: true,
      message: messageWithSender
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
});

// Edit a message
router.put('/messages/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Get message and check ownership
    const message = await ChatMessage.findByPk(messageId);
    if (!message || message.senderId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit this message'
      });
    }

    // Update message
    await message.update({
      content,
      editedAt: new Date()
    });

    // Get updated message with sender info
    const updatedMessage = await ChatMessage.findByPk(messageId, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] }]
    });

    res.json({
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    console.error('❌ Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error editing message'
    });
  }
});

// Delete a message
router.delete('/messages/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Get message and check permissions
    const message = await ChatMessage.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user can delete (sender or admin)
    const participant = await ChatParticipant.findOne({
      where: { userId: req.user.id, roomId: message.roomId }
    });

    if (message.senderId !== req.user.id && participant.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete this message'
      });
    }

    // Soft delete message
    await message.update({
      isDeleted: true,
      content: '[Message deleted]',
      attachments: []
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
});

// ===== MESSAGE REACTIONS =====

// Add reaction to message
router.post('/messages/:messageId/reactions', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    // Check if reaction already exists
    const existingReaction = await MessageReaction.findOne({
      where: { messageId, userId: req.user.id, emoji }
    });

    if (existingReaction) {
      return res.status(400).json({
        success: false,
        message: 'Reaction already exists'
      });
    }

    // Create reaction
    const reaction = await MessageReaction.create({
      messageId,
      userId: req.user.id,
      emoji
    });

    // Get reaction with user info
    const reactionWithUser = await MessageReaction.findByPk(reaction.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }]
    });

    res.json({
      success: true,
      reaction: reactionWithUser
    });
  } catch (error) {
    console.error('❌ Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reaction'
    });
  }
});

// Remove reaction from message
router.delete('/messages/:messageId/reactions/:emoji', auth, async (req, res) => {
  try {
    const { messageId, emoji } = req.params;

    // Remove reaction
    const deleted = await MessageReaction.destroy({
      where: { messageId, userId: req.user.id, emoji }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Reaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Reaction removed successfully'
    });
  } catch (error) {
    console.error('❌ Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing reaction'
    });
  }
});

// ===== MESSAGE READ RECEIPTS =====

// Mark messages as read
router.post('/messages/read', auth, async (req, res) => {
  try {
    const { messageIds, roomId } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs array is required'
      });
    }

    // Check if user is participant in the room
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId: req.user.id, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark messages as read
    await MessageRead.bulkCreate(
      messageIds.map(messageId => ({
        messageId,
        userId: req.user.id,
        readAt: new Date()
      })),
      { ignoreDuplicates: true }
    );

    // Update unread count
    await ChatParticipant.update(
      { unreadCount: 0 },
      { where: { userId: req.user.id, roomId } }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('❌ Mark read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read'
    });
  }
});

// ===== THREAD MANAGEMENT =====

// Get thread messages
router.get('/messages/:messageId/thread', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if message exists and get room info
    const parentMessage = await ChatMessage.findByPk(messageId);
    if (!parentMessage) {
      return res.status(404).json({
        success: false,
        message: 'Parent message not found'
      });
    }

    // Check if user is participant in the room
    const participant = await ChatParticipant.findOne({
      where: { roomId: parentMessage.roomId, userId: req.user.id, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const offset = (page - 1) * limit;

    // Get thread messages
    const threadMessages = await ChatMessage.findAndCountAll({
      where: { threadId: messageId, isDeleted: false },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] },
        { model: MessageReaction, as: 'messageReactions', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }] }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      messages: threadMessages.rows,
      total: threadMessages.count,
      page: parseInt(page),
      totalPages: Math.ceil(threadMessages.count / limit)
    });
  } catch (error) {
    console.error('❌ Get thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching thread messages'
    });
  }
});

// ===== CALL MANAGEMENT =====

// Get call history for a room
router.get('/rooms/:roomId/calls', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if user is participant
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId: req.user.id, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const offset = (page - 1) * limit;

    const calls = await CallSession.findAndCountAll({
      where: { roomId },
      include: [
        { model: User, as: 'initiator', attributes: ['id', 'name', 'avatar'] }
      ],
      order: [['startedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      calls: calls.rows,
      total: calls.count,
      page: parseInt(page),
      totalPages: Math.ceil(calls.count / limit)
    });
  } catch (error) {
    console.error('❌ Get calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching call history'
    });
  }
});

// ===== SEARCH FUNCTIONALITY =====

// Search messages across all user's rooms
router.get('/search', auth, async (req, res) => {
  try {
    const { query, roomId = null, type = null, fromDate = null, toDate = null, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const offset = (page - 1) * limit;
    const whereClause = {
      content: { [Op.iLike]: `%${query}%` },
      isDeleted: false
    };

    // Filter by room if specified
    if (roomId) {
      whereClause.roomId = roomId;
    }

    // Filter by message type
    if (type) {
      whereClause.type = type;
    }

    // Filter by date range
    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) whereClause.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) whereClause.createdAt[Op.lte] = new Date(toDate);
    }

    // Get user's rooms for access control
    const userRooms = await ChatParticipant.findAll({
      where: { userId: req.user.id, isActive: true },
      attributes: ['roomId']
    });

    const roomIds = userRooms.map(p => p.roomId);
    whereClause.roomId = { [Op.in]: roomIds };

    const messages = await ChatMessage.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] },
        { model: ChatRoom, as: 'room', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      messages: messages.rows,
      total: messages.count,
      page: parseInt(page),
      totalPages: Math.ceil(messages.count / limit)
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching messages'
    });
  }
});

// ===== PRESENCE & STATUS =====

// Get all online users
router.get('/users/online', auth, async (req, res) => {
  try {
    // Get all online users
    const onlineUsers = await User.findAll({
      where: { online: true },
      attributes: ['id', 'name', 'avatar', 'online', 'status', 'customStatus', 'lastSeen'],
      order: [['lastSeen', 'DESC']]
    });

    res.json({
      success: true,
      users: onlineUsers
    });
  } catch (error) {
    console.error('❌ Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching online users'
    });
  }
});

// Get online users in a room
router.get('/rooms/:roomId/online-users', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check if user is participant
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId: req.user.id, isActive: true }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get room participants with online status
    const participants = await ChatParticipant.findAll({
      where: { roomId, isActive: true },
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['id', 'name', 'avatar', 'online', 'status', 'customStatus', 'lastSeen'] 
        }
      ]
    });

    const onlineUsers = participants
      .filter(p => p.user.online)
      .map(p => ({
        id: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar,
        status: p.user.status,
        customStatus: p.user.customStatus,
        lastSeen: p.user.lastSeen,
        role: p.role
      }));

    res.json({
      success: true,
      onlineUsers
    });
  } catch (error) {
    console.error('❌ Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching online users'
    });
  }
});

// Update user status
router.put('/users/status', auth, async (req, res) => {
  try {
    const { status, customStatus } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Update user status
    await User.update(
      { status, customStatus },
      { where: { id: req.user.id } }
    );

    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('❌ Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status'
    });
  }
});

// Update user status (legacy endpoint)
router.put('/status', auth, async (req, res) => {
  try {
    const { status, customStatus } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Update user status
    await User.update(
      { status, customStatus },
      { where: { id: req.user.id } }
    );

    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('❌ Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status'
    });
  }
});

module.exports = router; 