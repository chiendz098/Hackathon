const { Notification, User, UserAchievement, Friendship, StudyRoom } = require('../models');

class NotificationService {
  constructor() {
    this.websocketService = require('./websocket');
  }

  // Create a new notification
  async createNotification(data) {
    try {
      const notification = await Notification.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        isRead: false
      });

      // Send real-time notification via WebSocket
      this.websocketService.sendNotification(data.userId, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    try {
      const { limit = 20, offset = 0, unreadOnly = false } = options;
      
      const whereClause = { userId };
      if (unreadOnly) {
        whereClause.isRead = false;
      }

      const notifications = await Notification.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { id: notificationId, userId }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.update({ isRead: true });
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      await Notification.update(
        { isRead: true },
        { where: { userId, isRead: false } }
      );

      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { id: notificationId, userId }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.destroy();
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: { userId, isRead: false }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Achievement notification
  async sendAchievementNotification(userId, achievement) {
    try {
      await this.createNotification({
        userId,
        type: 'achievement_earned',
        title: 'Achievement Unlocked! 🏆',
        message: `Congratulations! You've earned the "${achievement.name}" achievement!`,
        data: { achievement }
      });
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  }

  // Friend request notification
  async sendFriendRequestNotification(userId, friendRequest) {
    try {
      await this.createNotification({
        userId,
        type: 'friend_request',
        title: 'New Friend Request 👋',
        message: `${friendRequest.senderName} sent you a friend request`,
        data: { friendRequest }
      });
    } catch (error) {
      console.error('Error sending friend request notification:', error);
    }
  }

  // Study room invitation notification
  async sendStudyRoomInvitation(userId, invitation) {
    try {
      await this.createNotification({
        userId,
        type: 'room_invitation',
        title: 'Study Room Invitation 📚',
        message: `${invitation.senderName} invited you to join "${invitation.roomName}"`,
        data: { invitation }
      });
    } catch (error) {
      console.error('Error sending study room invitation:', error);
    }
  }

  // Level up notification
  async sendLevelUpNotification(userId, levelData) {
    try {
      await this.createNotification({
        userId,
        type: 'level_up',
        title: 'Level Up! ⬆️',
        message: `Congratulations! You've reached level ${levelData.newLevel}!`,
        data: { levelData }
      });
    } catch (error) {
      console.error('Error sending level up notification:', error);
    }
  }

  // Task completion notification
  async sendTaskCompletionNotification(userId, task) {
    try {
      await this.createNotification({
        userId,
        type: 'task_completed',
        title: 'Task Completed! ✅',
        message: `Great job! You've completed "${task.title}"`,
        data: { task }
      });
    } catch (error) {
      console.error('Error sending task completion notification:', error);
    }
  }

  // Study session reminder
  async sendStudyReminder(userId, session) {
    try {
      await this.createNotification({
        userId,
        type: 'study_reminder',
        title: 'Study Session Reminder 📖',
        message: `Time to study! Your session "${session.title}" is starting soon`,
        data: { session }
      });
    } catch (error) {
      console.error('Error sending study reminder:', error);
    }
  }

  // System notification
  async sendSystemNotification(userId, title, message, data = {}) {
    try {
      await this.createNotification({
        userId,
        type: 'system',
        title,
        message,
        data
      });
    } catch (error) {
      console.error('Error sending system notification:', error);
    }
  }

  // Bulk notifications for multiple users
  async sendBulkNotifications(userIds, notificationData) {
    try {
      const notifications = [];
      
      for (const userId of userIds) {
        const notification = await this.createNotification({
          userId,
          ...notificationData
        });
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deletedCount = await Notification.destroy({
        where: {
          createdAt: {
            [require('sequelize').Op.lt]: cutoffDate
          },
          isRead: true
        }
      });

      console.log(`Cleaned up ${deletedCount} old notifications`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService(); 