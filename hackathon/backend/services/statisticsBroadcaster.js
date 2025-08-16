const { User, Todo, Achievement, UserAchievement, FocusSession } = require('../models');
const websocketService = require('./websocket');

class StatisticsBroadcaster {
  constructor() {
    this.stats = {
      activeStudents: 0,
      studySessions: 0,
      tasksCompleted: 0,
      achievements: 0,
      lastUpdated: null
    };
    this.broadcastInterval = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.updateStatistics();
      this.startBroadcasting();
      this.isInitialized = true;
      console.log('✅ Statistics broadcaster initialized');
    } catch (error) {
      console.error('❌ Error initializing statistics broadcaster:', error);
    }
  }

  async updateStatistics() {
    try {
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

      this.stats = {
        activeStudents,
        studySessions,
        tasksCompleted,
        achievements,
        lastUpdated: new Date().toISOString()
      };

      console.log('📊 Statistics updated:', this.stats);
      return this.stats;
    } catch (error) {
      console.error('❌ Error updating statistics:', error);
      throw error;
    }
  }

  startBroadcasting() {
    // Broadcast every 30 seconds
    this.broadcastInterval = setInterval(async () => {
      try {
        await this.updateStatistics();
        this.broadcastToAllClients();
      } catch (error) {
        console.error('❌ Error in broadcast interval:', error);
      }
    }, 30000); // 30 seconds

    console.log('🔄 Statistics broadcasting started (30s interval)');
  }

  stopBroadcasting() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
      console.log('⏹️ Statistics broadcasting stopped');
    }
  }

  broadcastToAllClients() {
    const message = {
      type: 'statistics_update',
      data: this.stats
    };

    // Use Socket.IO instead of native WebSocket
    const { io } = require('socket.io');
    if (global.io) {
      global.io.emit('statistics_updated', {
        success: true,
        data: this.stats,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Manual broadcast for immediate updates
  async broadcastUpdate() {
    await this.updateStatistics();
    this.broadcastToAllClients();
  }

  // Get current statistics
  getCurrentStats() {
    return this.stats;
  }

  // Force refresh statistics
  async refreshStatistics() {
    return await this.updateStatistics();
  }

  // Cleanup
  destroy() {
    this.stopBroadcasting();
    this.isInitialized = false;
  }
}

module.exports = new StatisticsBroadcaster(); 