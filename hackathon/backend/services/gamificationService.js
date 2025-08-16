const { 
  User, 
  UserProgress, 
  Achievement, 
  UserAchievement, 
  UserAnalytics,
  ShopItem,
  UserPurchase,
  Pet,
  UserPet,
  DailyReward,
  UserDailyReward
} = require('../models');

const notificationService = require('./notificationService');

class GamificationService {
  constructor() {
    this.websocketService = require('./websocket');
  }

  // Calculate user level based on experience points
  calculateLevel(experience) {
    return Math.floor(Math.sqrt(experience / 100)) + 1;
  }

  // Calculate experience needed for next level
  calculateExperienceForLevel(level) {
    return Math.pow(level - 1, 2) * 100;
  }

  // Add experience points to user
  async addExperience(userId, points, reason = 'general') {
    try {
      const userProgress = await UserProgress.findOne({
        where: { userId }
      });

      if (!userProgress) {
        throw new Error('User progress not found');
      }

      const oldLevel = this.calculateLevel(userProgress.experience);
      const newExperience = userProgress.experience + points;
      const newLevel = this.calculateLevel(newExperience);

      await userProgress.update({
        experience: newExperience,
        level: newLevel,
        lastUpdated: new Date()
      });

      // Check for level up
      if (newLevel > oldLevel) {
        await this.handleLevelUp(userId, oldLevel, newLevel);
      }

      // Log experience gain
      await this.logExperienceGain(userId, points, reason);

      return {
        oldLevel,
        newLevel,
        experienceGained: points,
        totalExperience: newExperience,
        leveledUp: newLevel > oldLevel
      };
    } catch (error) {
      console.error('Error adding experience:', error);
      throw error;
    }
  }

  // Handle level up
  async handleLevelUp(userId, oldLevel, newLevel) {
    try {
      // Send level up notification
      await notificationService.sendLevelUpNotification(userId, {
        oldLevel,
        newLevel,
        timestamp: new Date()
      });

      // Send WebSocket notification
      this.websocketService.sendLevelUpNotification(userId, {
        oldLevel,
        newLevel,
        timestamp: new Date()
      });

      // Check for level-based achievements
      await this.checkLevelAchievements(userId, newLevel);

      console.log(`User ${userId} leveled up from ${oldLevel} to ${newLevel}`);
    } catch (error) {
      console.error('Error handling level up:', error);
    }
  }

  // Check and award achievements
  async checkAchievements(userId) {
    try {
      const userProgress = await UserProgress.findOne({
        where: { userId },
        include: [
          { model: User, as: 'user' },
          { model: UserAchievement, as: 'achievements' }
        ]
      });

      if (!userProgress) return;

      const earnedAchievements = userProgress.achievements.map(ua => ua.achievementId);
      const allAchievements = await Achievement.findAll();

      for (const achievement of allAchievements) {
        if (earnedAchievements.includes(achievement.id)) continue;

        const shouldAward = await this.evaluateAchievement(userId, achievement);
        if (shouldAward) {
          await this.awardAchievement(userId, achievement);
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  // Evaluate if user should get an achievement
  async evaluateAchievement(userId, achievement) {
    try {
      switch (achievement.type) {
        case 'level':
          const userProgress = await UserProgress.findOne({ where: { userId } });
          return userProgress && userProgress.level >= achievement.requirement;

        case 'tasks_completed':
          const { Todo } = require('../models');
          const completedTasks = await Todo.count({
            where: { userId, status: 'done' }
          });
          return completedTasks >= achievement.requirement;

        case 'study_sessions':
            const sessions = 0; // Study rooms removed
          return sessions >= achievement.requirement;

        case 'streak':
          const { UserDailyReward } = require('../models');
          const streak = await this.calculateStreak(userId);
          return streak >= achievement.requirement;

        case 'friends':
          const { Friendship } = require('../models');
          const friends = await Friendship.count({
            where: { 
              [require('sequelize').Op.or]: [
                { userId1: userId, status: 'accepted' },
                { userId2: userId, status: 'accepted' }
              ]
            }
          });
          return friends >= achievement.requirement;

        default:
          return false;
      }
    } catch (error) {
      console.error('Error evaluating achievement:', error);
      return false;
    }
  }

  // Award achievement to user
  async awardAchievement(userId, achievement) {
    try {
      // Check if already awarded
      const existing = await UserAchievement.findOne({
        where: { userId, achievementId: achievement.id }
      });

      if (existing) return;

      // Award achievement
      await UserAchievement.create({
        userId,
        achievementId: achievement.id,
        awardedAt: new Date()
      });

      // Add experience points
      await this.addExperience(userId, achievement.experienceReward, 'achievement');

      // Send notification
      await notificationService.sendAchievementNotification(userId, achievement);

      // Send WebSocket notification
      this.websocketService.sendAchievementNotification(userId, achievement);

      console.log(`Achievement "${achievement.name}" awarded to user ${userId}`);
    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  }

  // Check level-based achievements
  async checkLevelAchievements(userId, level) {
    try {
      const levelAchievements = await Achievement.findAll({
        where: { type: 'level', requirement: level }
      });

      for (const achievement of levelAchievements) {
        await this.awardAchievement(userId, achievement);
      }
    } catch (error) {
      console.error('Error checking level achievements:', error);
    }
  }

  // Calculate user streak
  async calculateStreak(userId) {
    try {
      const rewards = await UserDailyReward.findAll({
        where: { userId },
        order: [['claimedAt', 'DESC']],
        limit: 30
      });

      if (rewards.length === 0) return 0;

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < rewards.length; i++) {
        const rewardDate = new Date(rewards[i].claimedAt);
        rewardDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);

        if (rewardDate.getTime() === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  }

  // Log experience gain
  async logExperienceGain(userId, points, reason) {
    try {
      await UserAnalytics.create({
        userId,
        type: 'experience_gain',
        value: points,
        metadata: { reason },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging experience gain:', error);
    }
  }

  // Get user progress summary
  async getUserProgress(userId) {
    try {
      const userProgress = await UserProgress.findOne({
        where: { userId },
        include: [
          { model: User, as: 'user' },
          { model: UserAchievement, as: 'achievements', include: [{ model: Achievement }] }
        ]
      });

      if (!userProgress) {
        throw new Error('User progress not found');
      }

      const currentLevel = userProgress.level;
      const currentExp = userProgress.experience;
      const expForNextLevel = this.calculateExperienceForLevel(currentLevel + 1);
      const expForCurrentLevel = this.calculateExperienceForLevel(currentLevel);
      const progressToNextLevel = (currentExp - expForCurrentLevel) / (expForNextLevel - expForCurrentLevel);

      const streak = await this.calculateStreak(userId);

      return {
        level: currentLevel,
        experience: currentExp,
        experienceForNextLevel: expForNextLevel,
        progressToNextLevel: Math.min(progressToNextLevel, 1),
        streak,
        achievements: userProgress.achievements.length,
        lastUpdated: userProgress.lastUpdated
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  // Get leaderboard
  async getLeaderboard(limit = 10) {
    try {
      const leaderboard = await UserProgress.findAll({
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
        order: [['experience', 'DESC']],
        limit
      });

      return leaderboard.map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        name: entry.user.name,
        level: entry.level,
        experience: entry.experience
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Process daily reward
  async processDailyReward(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already claimed today
      const existingReward = await UserDailyReward.findOne({
        where: {
          userId,
          claimedAt: {
            [require('sequelize').Op.gte]: today
          }
        }
      });

      if (existingReward) {
        throw new Error('Daily reward already claimed today');
      }

      // Calculate streak
      const streak = await this.calculateStreak(userId);
      const newStreak = streak + 1;

      // Get reward based on streak
      const reward = await DailyReward.findOne({
        where: { day: newStreak }
      });

      if (!reward) {
        throw new Error('No reward found for this streak');
      }

      // Create reward record
      await UserDailyReward.create({
        userId,
        rewardId: reward.id,
        claimedAt: new Date(),
        streak: newStreak
      });

      // Add experience points
      await this.addExperience(userId, reward.experienceReward, 'daily_reward');

      // Add coins if applicable
      if (reward.coinReward > 0) {
        await this.addCoins(userId, reward.coinReward);
      }

      return {
        reward,
        streak: newStreak,
        experienceGained: reward.experienceReward,
        coinsGained: reward.coinReward
      };
    } catch (error) {
      console.error('Error processing daily reward:', error);
      throw error;
    }
  }

  // Add coins to user
  async addCoins(userId, amount) {
    try {
      const userProgress = await UserProgress.findOne({
        where: { userId }
      });

      if (!userProgress) {
        throw new Error('User progress not found');
      }

      await userProgress.update({
        coins: userProgress.coins + amount
      });

      return userProgress.coins + amount;
    } catch (error) {
      console.error('Error adding coins:', error);
      throw error;
    }
  }

  // Purchase item from shop
  async purchaseItem(userId, itemId) {
    try {
      const item = await ShopItem.findByPk(itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      const userProgress = await UserProgress.findOne({
        where: { userId }
      });

      if (!userProgress) {
        throw new Error('User progress not found');
      }

      if (userProgress.coins < item.price) {
        throw new Error('Insufficient coins');
      }

      // Deduct coins
      await userProgress.update({
        coins: userProgress.coins - item.price
      });

      // Create purchase record
      await UserPurchase.create({
        userId,
        itemId,
        price: item.price,
        purchasedAt: new Date()
      });

      // Handle special items
      if (item.type === 'pet') {
        await this.awardPet(userId, item);
      }

      return {
        success: true,
        remainingCoins: userProgress.coins - item.price,
        item
      };
    } catch (error) {
      console.error('Error purchasing item:', error);
      throw error;
    }
  }

  // Award pet to user
  async awardPet(userId, item) {
    try {
      const pet = await Pet.findOne({
        where: { name: item.name }
      });

      if (!pet) {
        throw new Error('Pet not found');
      }

      await UserPet.create({
        userId,
        petId: pet.id,
        acquiredAt: new Date(),
        isActive: false
      });
    } catch (error) {
      console.error('Error awarding pet:', error);
    }
  }
}

module.exports = new GamificationService(); 