const { ChatMessage, ScheduledMessage, User, ChatRoom } = require('../models');
const { Op } = require('sequelize');

class ScheduledMessageService {
  constructor() {
    this.scheduledJobs = new Map();
    this.isRunning = false;
  }

  // Start the scheduler
  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Scheduled Message Service started');
    
    // Process existing scheduled messages
    await this.processExistingScheduledMessages();
    
    // Start the scheduler loop
    this.schedulerLoop();
  }

  // Stop the scheduler
  stop() {
    this.isRunning = false;
    console.log('🛑 Scheduled Message Service stopped');
  }

  // Process existing scheduled messages that should have been sent
  async processExistingScheduledMessages() {
    try {
      const overdueMessages = await ScheduledMessage.findAll({
        where: {
          status: 'pending',
          scheduledAt: {
            [Op.lte]: new Date()
          }
        },
        include: [
          { model: ChatMessage, as: 'message' },
          { model: User, as: 'scheduler' }
        ]
      });

      console.log(`📅 Found ${overdueMessages.length} overdue scheduled messages`);

      for (const scheduled of overdueMessages) {
        await this.sendScheduledMessage(scheduled);
      }
    } catch (error) {
      console.error('Error processing existing scheduled messages:', error);
    }
  }

  // Main scheduler loop
  async schedulerLoop() {
    if (!this.isRunning) return;

    try {
      // Check for messages that need to be sent
      const messagesToSend = await ScheduledMessage.findAll({
        where: {
          status: 'pending',
          scheduledAt: {
            [Op.lte]: new Date()
          }
        },
        include: [
          { model: ChatMessage, as: 'message' },
          { model: User, as: 'scheduler' }
        ]
      });

      for (const scheduled of messagesToSend) {
        await this.sendScheduledMessage(scheduled);
      }
    } catch (error) {
      console.error('Error in scheduler loop:', error);
    }

    // Schedule next check in 30 seconds
    setTimeout(() => this.schedulerLoop(), 30000);
  }

  // Send a scheduled message
  async sendScheduledMessage(scheduled) {
    try {
      console.log(`📤 Sending scheduled message ${scheduled.messageId}`);

      // Update message status
      const message = await ChatMessage.findByPk(scheduled.messageId);
      if (!message) {
        console.error(`Message ${scheduled.messageId} not found`);
        return;
      }

      // Update message to sent status
      message.sentAt = new Date();
      message.scheduledAt = null;
      await message.save();

      // Update scheduled message status
      scheduled.status = 'sent';
      await scheduled.save();

      // Emit to socket if available
      if (global.io) {
        const roomName = `room:${message.roomId}`;
        global.io.to(roomName).emit('new_message', {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          roomId: message.roomId,
          type: message.type,
          createdAt: message.createdAt,
          isScheduled: true,
          scheduledBy: scheduled.scheduler
        });
      }

      console.log(`✅ Scheduled message ${scheduled.messageId} sent successfully`);
    } catch (error) {
      console.error(`Error sending scheduled message ${scheduled.messageId}:`, error);
      
      // Mark as failed
      scheduled.status = 'failed';
      await scheduled.save();
    }
  }

  // Schedule a new message
  async scheduleMessage(messageId, scheduledBy, scheduledAt) {
    try {
      const scheduled = await ScheduledMessage.create({
        messageId,
        scheduledBy,
        scheduledAt: new Date(scheduledAt),
        status: 'pending'
      });

      console.log(`📅 Message ${messageId} scheduled for ${scheduledAt}`);

      // If the message is scheduled for the future, set a timeout
      const timeUntilScheduled = new Date(scheduledAt) - new Date();
      if (timeUntilScheduled > 0) {
        setTimeout(() => {
          this.sendScheduledMessage(scheduled);
        }, timeUntilScheduled);
      } else {
        // Send immediately if it's in the past
        await this.sendScheduledMessage(scheduled);
      }

      return scheduled;
    } catch (error) {
      console.error('Error scheduling message:', error);
      throw error;
    }
  }

  // Cancel a scheduled message
  async cancelScheduledMessage(messageId, userId) {
    try {
      const scheduled = await ScheduledMessage.findOne({
        where: {
          messageId,
          scheduledBy: userId,
          status: 'pending'
        }
      });

      if (!scheduled) {
        throw new Error('Scheduled message not found');
      }

      scheduled.status = 'cancelled';
      await scheduled.save();

      // Remove from scheduled jobs if exists
      if (this.scheduledJobs.has(messageId)) {
        clearTimeout(this.scheduledJobs.get(messageId));
        this.scheduledJobs.delete(messageId);
      }

      console.log(`❌ Scheduled message ${messageId} cancelled`);
      return true;
    } catch (error) {
      console.error('Error cancelling scheduled message:', error);
      throw error;
    }
  }

  // Get scheduled messages for a user
  async getUserScheduledMessages(userId) {
    try {
      const scheduledMessages = await ScheduledMessage.findAll({
        where: {
          scheduledBy: userId,
          status: 'pending'
        },
        include: [
          {
            model: ChatMessage,
            as: 'message',
            include: [
              { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] },
              { model: ChatRoom, as: 'room', attributes: ['id', 'name'] }
            ]
          }
        ],
        order: [['scheduledAt', 'ASC']]
      });

      return scheduledMessages;
    } catch (error) {
      console.error('Error getting user scheduled messages:', error);
      throw error;
    }
  }

  // Get scheduled messages for a room
  async getRoomScheduledMessages(roomId) {
    try {
      const scheduledMessages = await ScheduledMessage.findAll({
        include: [
          {
            model: ChatMessage,
            as: 'message',
            where: { roomId },
            include: [
              { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] }
            ]
          }
        ],
        where: {
          status: 'pending'
        },
        order: [['scheduledAt', 'ASC']]
      });

      return scheduledMessages;
    } catch (error) {
      console.error('Error getting room scheduled messages:', error);
      throw error;
    }
  }

  // Clean up old scheduled messages
  async cleanupOldScheduledMessages() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await ScheduledMessage.destroy({
        where: {
          status: ['sent', 'cancelled', 'failed'],
          updatedAt: {
            [Op.lt]: thirtyDaysAgo
          }
        }
      });

      console.log(`🧹 Cleaned up ${deletedCount} old scheduled messages`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old scheduled messages:', error);
      throw error;
    }
  }

  // Get scheduler statistics
  async getStatistics() {
    try {
      const stats = await ScheduledMessage.findAll({
        attributes: [
          'status',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['status']
      });

      const totalScheduled = await ScheduledMessage.count({
        where: { status: 'pending' }
      });

      const upcomingScheduled = await ScheduledMessage.count({
        where: {
          status: 'pending',
          scheduledAt: {
            [Op.gt]: new Date(),
            [Op.lte]: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
          }
        }
      });

      return {
        stats: stats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        totalScheduled,
        upcomingScheduled
      };
    } catch (error) {
      console.error('Error getting scheduler statistics:', error);
      throw error;
    }
  }
}

// Create singleton instance
const scheduledMessageService = new ScheduledMessageService();

module.exports = scheduledMessageService; 