const express = require('express');
const router = express.Router();
const { User, Todo, Achievement, UserAchievement, FocusSession } = require('../models');
const statisticsBroadcaster = require('../services/statisticsBroadcaster');
const { Op } = require('sequelize');

// GET /api/analytics/statistics - Get real-time statistics
router.get('/statistics', async (req, res) => {
  try {
    console.log('📊 Fetching real-time statistics...');

    // Get Active Students (total users)
    const activeStudents = await User.count({
      where: {
        isactive: true
      }
    });

    // Get Study Sessions (total focus sessions)
    const studySessions = await FocusSession.count({
      where: {
        status: 'completed'
      }
    });

    // Get Tasks Completed (todos with status "done")
    const tasksCompleted = await Todo.count({
      where: {
        status: 'done'
      }
    });

    // Get Total Achievements earned by all students
    const achievements = await UserAchievement.count();

    const stats = {
      activeStudents,
      studySessions,
      tasksCompleted,
      achievements,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Statistics fetched successfully:', stats);

    res.json({
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// GET /api/analytics/statistics/current - Get current cached statistics
router.get('/statistics/current', (req, res) => {
  try {
    const currentStats = statisticsBroadcaster.getCurrentStats();
    
    res.json({
      success: true,
      data: currentStats,
      message: 'Current statistics retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting current statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current statistics',
      message: error.message
    });
  }
});

// POST /api/analytics/statistics/refresh - Force refresh statistics
router.post('/statistics/refresh', async (req, res) => {
  try {
    console.log('🔄 Force refreshing statistics...');
    
    const updatedStats = await statisticsBroadcaster.refreshStatistics();
    
    res.json({
      success: true,
      data: updatedStats,
      message: 'Statistics refreshed successfully'
    });
  } catch (error) {
    console.error('❌ Error refreshing statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh statistics',
      message: error.message
    });
  }
});

// GET /api/analytics/detailed - Get detailed analytics
router.get('/detailed', async (req, res) => {
  try {
    console.log('📊 Fetching detailed analytics...');

    // Get user statistics
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isactive: true } });
    const onlineUsers = await User.count({ where: { onlineStatus: 'online' } });

    // Get study room statistics
    const totalStudyRooms = await StudyRoom.count();
    const activeStudyRooms = await StudyRoom.count({ where: { isActive: true } });
    const publicStudyRooms = await StudyRoom.count({ where: { isPublic: true } });

    // Get todo statistics
    const totalTodos = await Todo.count();
    const completedTodos = await Todo.count({ where: { status: 'done' } });
    const pendingTodos = await Todo.count({ where: { status: 'pending' } });
    const inProgressTodos = await Todo.count({ where: { status: 'in_progress' } });

    // Get achievement statistics
    const totalAchievements = await Achievement.count();
    const earnedAchievements = await UserAchievement.count();
    const uniqueUsersWithAchievements = await UserAchievement.count({
      distinct: true,
      col: 'userId'
    });

    const detailedStats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        online: onlineUsers,
        offline: totalUsers - onlineUsers
      },
      studyRooms: {
        total: totalStudyRooms,
        active: activeStudyRooms,
        public: publicStudyRooms,
        private: totalStudyRooms - publicStudyRooms
      },
      todos: {
        total: totalTodos,
        completed: completedTodos,
        pending: pendingTodos,
        inProgress: inProgressTodos,
        completionRate: totalTodos > 0 ? ((completedTodos / totalTodos) * 100).toFixed(2) : 0
      },
      achievements: {
        total: totalAchievements,
        earned: earnedAchievements,
        uniqueUsers: uniqueUsersWithAchievements,
        averagePerUser: uniqueUsersWithAchievements > 0 ? (earnedAchievements / uniqueUsersWithAchievements).toFixed(2) : 0
      },
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Detailed analytics fetched successfully');

    res.json({
      success: true,
      data: detailedStats,
      message: 'Detailed analytics retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching detailed analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch detailed analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/trends - Get trends over time
router.get('/trends', async (req, res) => {
  try {
    console.log('📈 Fetching analytics trends...');

    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Get user growth trend
    const userGrowth = await User.count({
      where: {
        created_at: {
          [require('sequelize').Op.gte]: daysAgo
        }
      }
    });

    // Get todo completion trend
    const todoCompletionTrend = await Todo.count({
      where: {
        status: 'done',
        updatedAt: {
          [require('sequelize').Op.gte]: daysAgo
        }
      }
    });

    // Get achievement earning trend
    const achievementTrend = await UserAchievement.count({
      where: {
        created_at: {
          [require('sequelize').Op.gte]: daysAgo
        }
      }
    });

    const trends = {
      period: `${days} days`,
      userGrowth,
      todoCompletionTrend,
      achievementTrend,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Analytics trends fetched successfully');

    res.json({
      success: true,
      data: trends,
      message: 'Analytics trends retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching analytics trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics trends',
      message: error.message
    });
  }
});

// GET /api/analytics/insights - Get analytics insights
router.get('/insights', async (req, res) => {
  try {
    console.log('📊 Fetching analytics insights...');
    
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '365d':
        startDate.setDate(now.getDate() - 365);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get comprehensive analytics data
    const totalUsers = await User.count({ where: { isactive: true } });
    const totalTodos = await Todo.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });
    
    const completedTodos = await Todo.count({
      where: {
        status: 'done',
        updatedAt: { [Op.gte]: startDate }
      }
    });
    
    const totalSessions = await FocusSession.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });
    
    const completedSessions = await FocusSession.count({
      where: {
        status: 'completed',
        updatedAt: { [Op.gte]: startDate }
      }
    });

    // Calculate completion rates
    const todoCompletionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
    const sessionCompletionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Generate insights based on data
    const insights = [];
    
    if (todoCompletionRate >= 80) {
      insights.push({
        type: 'performance',
        title: 'Excellent Task Completion',
        description: `Task completion rate is ${Math.round(todoCompletionRate)}% - outstanding productivity!`,
        sentiment: 'positive',
        metric: todoCompletionRate
      });
    } else if (todoCompletionRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Task Completion Needs Improvement',
        description: `Task completion rate is ${Math.round(todoCompletionRate)}% - consider setting more realistic goals`,
        sentiment: 'warning',
        metric: todoCompletionRate
      });
    }

    if (sessionCompletionRate >= 80) {
      insights.push({
        type: 'achievement',
        title: 'Great Focus Sessions',
        description: `Focus session completion rate is ${Math.round(sessionCompletionRate)}% - excellent concentration!`,
        sentiment: 'positive',
        metric: sessionCompletionRate
      });
    }

    if (totalTodos > 0 && totalTodos < 10) {
      insights.push({
        type: 'recommendation',
        title: 'Increase Task Volume',
        description: 'Consider adding more tasks to build momentum and improve productivity',
        sentiment: 'neutral',
        metric: totalTodos
      });
    }

    if (totalSessions > 0 && totalSessions < 5) {
      insights.push({
        type: 'recommendation',
        title: 'More Focus Sessions',
        description: 'Try scheduling more focus sessions to improve study habits',
        sentiment: 'neutral',
        metric: totalSessions
      });
    }

    const result = {
      insights,
      summary: {
        totalUsers,
        totalTodos,
        completedTodos,
        todoCompletionRate: Math.round(todoCompletionRate),
        totalSessions,
        completedSessions,
        sessionCompletionRate: Math.round(sessionCompletionRate),
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      }
    };

    console.log('✅ Analytics insights fetched successfully');
    
    res.json({
      success: true,
      data: result,
      message: 'Analytics insights retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching analytics insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics insights',
      message: error.message
    });
  }
});

// GET /api/analytics/dashboard - Get comprehensive dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Fetching dashboard analytics...');
    
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '365d':
        startDate.setDate(now.getDate() - 365);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get comprehensive analytics data
    const totalUsers = await User.count({ where: { isactive: true } });
    const newUsers = await User.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });
    
    const totalTodos = await Todo.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });
    
    const completedTodos = await Todo.count({
      where: {
        status: 'done',
        updatedAt: { [Op.gte]: startDate }
      }
    });
    
    const pendingTodos = await Todo.count({
      where: {
        status: 'pending',
        createdAt: { [Op.gte]: startDate }
      }
    });
    
    const overdueTodos = await Todo.count({
      where: {
        status: 'pending',
        deadline: { [Op.lt]: now }
      }
    });
    
    const totalSessions = await FocusSession.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });
    
    const completedSessions = await FocusSession.count({
      where: {
        status: 'completed',
        updatedAt: { [Op.gte]: startDate }
      }
    });
    
    const totalAchievements = await UserAchievement.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });

    // Calculate metrics
    const todoCompletionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
    const sessionCompletionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const userGrowthRate = totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0;

    // Get priority distribution
    const highPriorityTodos = await Todo.count({
      where: {
        priority: 'high',
        createdAt: { [Op.gte]: startDate }
      }
    });
    
    const mediumPriorityTodos = await Todo.count({
      where: {
        priority: 'medium',
        createdAt: { [Op.gte]: startDate }
      }
    });
    
    const lowPriorityTodos = await Todo.count({
      where: {
        priority: 'low',
        createdAt: { [Op.gte]: startDate }
      }
    });

    const result = {
      overview: {
        totalUsers,
        newUsers,
        userGrowthRate: Math.round(userGrowthRate),
        totalTodos,
        completedTodos,
        pendingTodos,
        overdueTodos,
        todoCompletionRate: Math.round(todoCompletionRate),
        totalSessions,
        completedSessions,
        sessionCompletionRate: Math.round(sessionCompletionRate),
        totalAchievements
      },
      priorities: {
        high: highPriorityTodos,
        medium: mediumPriorityTodos,
        low: lowPriorityTodos
      },
      trends: {
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      }
    };

    console.log('✅ Dashboard analytics fetched successfully');
    
    res.json({
      success: true,
      data: result,
      message: 'Dashboard analytics retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard analytics',
      message: error.message
    });
  }
});

// GET /api/analytics/export - Export analytics data
router.get('/export', async (req, res) => {
  try {
    console.log('📊 Exporting analytics data...');
    
    const { timeframe = '30d', format = 'json' } = req.query;
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '365d':
        startDate.setDate(now.getDate() - 365);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get comprehensive analytics data for export
    const totalUsers = await User.count({ where: { isactive: true } });
    const newUsers = await User.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });
    
    const totalTodos = await Todo.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });
    
    const completedTodos = await Todo.count({
      where: {
        status: 'done',
        updatedAt: { [Op.gte]: startDate }
      }
    });
    
    const pendingTodos = await Todo.count({
      where: {
        status: 'pending',
        createdAt: { [Op.gte]: startDate }
      }
    });
    
    const overdueTodos = await Todo.count({
      where: {
        status: 'pending',
        deadline: { [Op.lt]: now }
      }
    });
    
    const totalSessions = await FocusSession.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });
    
    const completedSessions = await FocusSession.count({
      where: {
        status: 'completed',
        updatedAt: { [Op.gte]: startDate }
      }
    });
    
    const totalAchievements = await UserAchievement.count({
      where: {
        createdAt: { [Op.gte]: startDate }
      }
    });

    // Calculate metrics
    const todoCompletionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
    const sessionCompletionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const userGrowthRate = totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0;

    const exportData = {
      metadata: {
        exportedAt: now.toISOString(),
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      },
      overview: {
        totalUsers,
        newUsers,
        userGrowthRate: Math.round(userGrowthRate),
        totalTodos,
        completedTodos,
        pendingTodos,
        overdueTodos,
        todoCompletionRate: Math.round(todoCompletionRate),
        totalSessions,
        completedSessions,
        sessionCompletionRate: Math.round(sessionCompletionRate),
        totalAchievements
      },
      summary: {
        productivity: {
          todoCompletionRate: Math.round(todoCompletionRate),
          sessionCompletionRate: Math.round(sessionCompletionRate),
          userGrowthRate: Math.round(userGrowthRate)
        },
        engagement: {
          totalUsers,
          activeUsers: totalUsers - newUsers,
          newUsers
        },
        performance: {
          totalTodos,
          completedTodos,
          pendingTodos,
          overdueTodos
        }
      }
    };

    console.log('✅ Analytics data exported successfully');
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${timeframe}-${now.toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    } else {
      // Default JSON format
      res.json({
        success: true,
        data: exportData,
        message: 'Analytics data exported successfully'
      });
    }

  } catch (error) {
    console.error('❌ Error exporting analytics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data',
      message: error.message
    });
  }
});

// POST /api/analytics/track - Track analytics events
router.post('/track', async (req, res) => {
  try {
    console.log('📊 Tracking analytics event...');
    
    const { eventType, eventData, userId, timestamp } = req.body;
    
    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required'
      });
    }

    // Log the event for now (in production, you'd send this to an analytics service)
    console.log('📊 Analytics Event:', {
      eventType,
      eventData,
      userId,
      timestamp: timestamp || new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    // Here you could:
    // 1. Store in database
    // 2. Send to external analytics service (Google Analytics, Mixpanel, etc.)
    // 3. Process for real-time dashboards
    // 4. Trigger notifications or alerts

    res.json({
      success: true,
      message: 'Event tracked successfully',
      data: {
        eventId: Date.now().toString(),
        eventType,
        timestamp: timestamp || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error tracking analytics event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track analytics event',
      message: error.message
    });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  const flatten = (obj, prefix = '') => {
    const result = {};
    for (const key in obj) {
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(result, flatten(obj[key], `${prefix}${key}_`));
      } else {
        result[`${prefix}${key}`] = obj[key];
      }
    }
    return result;
  };

  const flattened = flatten(data);
  const headers = Object.keys(flattened);
  const csvContent = [
    headers.join(','),
    headers.map(header => `"${flattened[header]}"`).join(',')
  ].join('\n');

  return csvContent;
}

module.exports = router;
