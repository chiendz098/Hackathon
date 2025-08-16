const express = require('express');
const router = express.Router();
const { Notification, User } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { 
      limit = 20, 
      offset = 0, 
      unreadOnly = false, 
      type = null,
      priority = null 
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
      type,
      priority
    };

    const notifications = await Notification.getUserNotifications(userId, options);

    res.json({
      success: true,
      notifications,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: notifications.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get unread notifications count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const count = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      notification,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Mark notification as unread
router.put('/:notificationId/unread', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsUnread();

    res.json({
      success: true,
      notification,
      message: 'Notification marked as unread'
    });

  } catch (error) {
    console.error('Error marking notification as unread:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const userId = req.userId;

    await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Delete notification
router.delete('/:notificationId', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Track notification click
router.post('/:notificationId/click', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.incrementClick();

    // Mark as read if not already read
    if (!notification.isRead) {
      await notification.markAsRead();
    }

    res.json({
      success: true,
      notification,
      message: 'Click tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking notification click:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Create notification (admin/system use)
router.post('/', auth, async (req, res) => {
  try {
    const {
      userId: targetUserId,
      type,
      title,
      message,
      data = {},
      priority = 'normal',
      deliveryMethod = { inApp: true },
      scheduledFor = null,
      actions = [],
      groupKey = null,
      expiresAt = null,
      relatedEntityType = null,
      relatedEntityId = null,
      icon = null,
      color = null,
      image = null
    } = req.body;

    // Validate required fields
    if (!targetUserId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, type, title, message'
      });
    }

    // Check if target user exists
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    const notification = await Notification.createNotification({
      userId: targetUserId,
      type,
      title,
      message,
      data,
      priority,
      deliveryMethod,
      scheduledFor,
      actions,
      groupKey,
      expiresAt,
      relatedEntityType,
      relatedEntityId,
      senderId: req.userId,
      icon,
      color,
      image
    });

    res.status(201).json({
      success: true,
      notification,
      message: 'Notification created successfully'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get notification statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { timeframe = '7d' } = req.query;

    const stats = await Notification.getNotificationStats(userId, timeframe);

    // Calculate summary statistics
    const totalNotifications = stats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0);
    const totalClicks = stats.reduce((sum, stat) => sum + parseInt(stat.dataValues.totalClicks || 0), 0);
    const clickRate = totalNotifications > 0 ? (totalClicks / totalNotifications * 100).toFixed(2) : 0;

    const summary = {
      totalNotifications,
      totalClicks,
      clickRate: parseFloat(clickRate),
      typeBreakdown: stats.map(stat => ({
        type: stat.type,
        count: parseInt(stat.dataValues.count),
        clicks: parseInt(stat.dataValues.totalClicks || 0)
      }))
    };

    res.json({
      success: true,
      stats: summary,
      timeframe
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get notification preferences (placeholder for user preferences)
router.get('/preferences', auth, async (req, res) => {
  try {
    // This would typically fetch from a UserPreferences model
    // For now, return default preferences
    const preferences = {
      email: {
        achievement_earned: true,
        level_up: true,
        friend_request: true,
        study_reminder: true,
        weekly_report: true
      },
      push: {
        achievement_earned: true,
        level_up: true,
        friend_request: true,
        study_reminder: true,
        task_deadline: true
      },
      inApp: {
        achievement_earned: true,
        level_up: true,
        friend_request: true,
        message_received: true,
        forum_mention: true,
        study_reminder: true,
        task_deadline: true
      }
    };

    res.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update notification preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { preferences } = req.body;

    // This would typically update a UserPreferences model
    // For now, just return success
    
    res.json({
      success: true,
      preferences,
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
