const express = require('express');
const router = express.Router();
const { User, Todo, Achievement, UserAchievement, ActivityFeed } = require('../models');
const { auth } = require('../middleware/auth');

// Get user activity feed
router.get('/feed', auth, async (req, res) => {
  try {
    const activities = await ActivityFeed.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.activityType,
      description: activity.description,
      timestamp: activity.createdAt,
      title: activity.title,
      metadata: activity.metadata
    }));

    res.json({
      success: true,
      activities: formattedActivities
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity feed'
    });
  }
});

// Get recent activities for dashboard
router.get('/recent', auth, async (req, res) => {
  try {
    const activities = await ActivityFeed.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.activityType,
      description: activity.description,
      timestamp: activity.createdAt,
      title: activity.title,
      metadata: activity.metadata
    }));

    res.json({
      success: true,
      activities: formattedActivities
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities'
    });
  }
});

// Create activity entry
router.post('/', auth, async (req, res) => {
  try {
    const { type, description, todoId } = req.body;

    const activityData = {
      userId: req.userId,
      activityType: type, // Fixed: map type to activityType
      description,
      relatedEntityType: todoId ? 'todo' : null,
      relatedEntityId: todoId
    };

    const activity = await ActivityFeed.create(activityData);

    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating activity'
    });
  }
});

module.exports = router; 