const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Todo, User, TodoCollaboration, Group, GroupMembers } = require('../models');

// Get active users for a todo
router.get('/todos/:todoId/active-users', auth, async (req, res) => {
  try {
    const { todoId } = req.params;
    const userId = req.user.id;

    const todo = await Todo.findByPk(todoId, {
      include: [{ model: Group, as: 'group' }]
    });

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    // Check if user has access to this todo
    if (todo.groupId) {
      const groupMember = await GroupMembers.findOne({
        where: { groupId: todo.groupId, userId }
      });
      if (!groupMember) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Get active users (simulated for demo)
    const activeUsers = await getActiveUsers(todoId, todo.groupId);

    res.json({
      success: true,
      users: activeUsers
    });
  } catch (error) {
    console.error('Active users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active users' });
  }
});

// Get collaboration messages
router.get('/todos/:todoId/messages', auth, async (req, res) => {
  try {
    const { todoId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;

    const todo = await Todo.findByPk(todoId);
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    // Get collaboration messages
    const messages = await TodoCollaboration.findAll({
      where: { 
        todoId,
        actionType: ['comment', 'edit', 'assign']
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.actionData.content || msg.actionData.description || '',
      type: msg.actionType,
      userId: msg.userId,
      username: msg.user?.username || 'Unknown User',
      timestamp: msg.timestamp,
      metadata: msg.metadata
    }));

    res.json({
      success: true,
      messages: formattedMessages.reverse() // Show oldest first
    });
  } catch (error) {
    console.error('Messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// Send collaboration message
router.post('/todos/:todoId/messages', auth, async (req, res) => {
  try {
    const { todoId } = req.params;
    const { content, type = 'comment' } = req.body;
    const userId = req.user.id;

    const todo = await Todo.findByPk(todoId);
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    // Create collaboration record
    const collaboration = await TodoCollaboration.create({
      todoId,
      userId,
      actionType: type,
      actionData: {
        content,
        type,
        timestamp: new Date()
      },
      timestamp: new Date(),
      sessionId: req.sessionID || `session_${Date.now()}`,
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    });

    // Get user info for response
    const user = await User.findByPk(userId, { attributes: ['id', 'username'] });

    const message = {
      id: collaboration.id,
      content,
      type,
      userId,
      username: user.username,
      timestamp: collaboration.timestamp
    };

    res.json({
      success: true,
      message,
      messageId: collaboration.id
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Update user presence
router.post('/presence', auth, async (req, res) => {
  try {
    const { todoId, action, status = 'online' } = req.body;
    const userId = req.user.id;

    // Update or create presence record
    await TodoCollaboration.create({
      todoId,
      userId,
      actionType: 'presence',
      actionData: {
        action,
        status,
        timestamp: new Date()
      },
      timestamp: new Date(),
      sessionId: req.sessionID || `session_${Date.now()}`,
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    });

    res.json({
      success: true,
      message: 'Presence updated'
    });
  } catch (error) {
    console.error('Presence update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update presence' });
  }
});

// Get collaboration history
router.get('/todos/:todoId/history', auth, async (req, res) => {
  try {
    const { todoId } = req.params;
    const { actionType, limit = 100, offset = 0 } = req.query;
    const userId = req.user.id;

    const todo = await Todo.findByPk(todoId);
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    // Build where clause
    const whereClause = { todoId };
    if (actionType) {
      whereClause.actionType = actionType;
    }

    // Get collaboration history
    const history = await TodoCollaboration.findAll({
      where: whereClause,
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const formattedHistory = history.map(record => ({
      id: record.id,
      actionType: record.actionType,
      userId: record.userId,
      username: record.user?.username || 'Unknown User',
      timestamp: record.timestamp,
      actionData: record.actionData,
      metadata: record.metadata
    }));

    res.json({
      success: true,
      history: formattedHistory,
      total: history.length
    });
  } catch (error) {
    console.error('Collaboration history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch collaboration history' });
  }
});

// Helper functions
async function getActiveUsers(todoId, groupId) {
  // Simulate active users for demo
  // In production, this would track real-time presence
  const activeUsers = [
    {
      id: 1,
      username: 'John Doe',
      status: 'online',
      currentAction: 'viewing',
      lastSeen: new Date(),
      avatar: null
    },
    {
      id: 2,
      username: 'Jane Smith',
      status: 'online',
      currentAction: 'editing',
      lastSeen: new Date(),
      avatar: null
    },
    {
      id: 3,
      username: 'Mike Johnson',
      status: 'away',
      currentAction: 'commenting',
      lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      avatar: null
    }
  ];

  return activeUsers;
}

module.exports = router; 