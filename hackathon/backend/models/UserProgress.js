const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserProgress = sequelize.define('UserProgress', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'userId'
    },
    // Experience Points System
    totalXP: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    currentLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    xpToNextLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 100, // XP needed for next level
    },
    
    // Virtual Currency
    coins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    gems: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Premium currency
    },
    
    // Study Statistics
    totalStudyTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // in minutes
    },
    tasksCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    currentStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // days
    },
    longestStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // days
    },
    lastStudyDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    // Forest System
    treesPlanted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    forestLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    ecosystemHealth: {
      type: DataTypes.FLOAT,
      defaultValue: 100.0, // 0-100%
    },
    
    // Pet System
    petType: {
      type: DataTypes.STRING,
      defaultValue: 'cat', // cat, dog, dragon, phoenix, etc.
    },
    petName: {
      type: DataTypes.STRING,
      defaultValue: 'Buddy',
    },
    petLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    petHappiness: {
      type: DataTypes.FLOAT,
      defaultValue: 100.0, // 0-100%
    },
    petEnergy: {
      type: DataTypes.FLOAT,
      defaultValue: 100.0, // 0-100%
    },
    lastPetInteraction: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    // Spin wheel system
    lastSpinDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    spinTokens: {
      type: DataTypes.INTEGER,
      defaultValue: 1, // Daily spin token
    },
    
    // Customization
    unlockedThemes: {
      type: DataTypes.JSON,
      defaultValue: ['default'], // Array of theme names
    },
    currentTheme: {
      type: DataTypes.STRING,
      defaultValue: 'default',
    },
    unlockedAvatars: {
      type: DataTypes.JSON,
      defaultValue: ['default'], // Array of avatar IDs
    },
    currentAvatar: {
      type: DataTypes.STRING,
      defaultValue: 'default',
    },
    
    // Achievements
    unlockedBadges: {
      type: DataTypes.JSON,
      defaultValue: [], // Array of badge IDs
    },
    featuredBadges: {
      type: DataTypes.JSON,
      defaultValue: [], // Array of badge IDs to display
    },
    
    // Daily/Weekly Progress
    dailyGoalProgress: {
      type: DataTypes.JSON,
      defaultValue: {
        tasksCompleted: 0,
        studyTime: 0,
        goal: 3, // daily task goal
        lastReset: new Date().toISOString().split('T')[0]
      },
    },
    weeklyGoalProgress: {
      type: DataTypes.JSON,
      defaultValue: {
        tasksCompleted: 0,
        studyTime: 0,
        goal: 20, // weekly task goal
        lastReset: new Date().toISOString()
      },
    },
    
    // Learning Analytics
    subjectMastery: {
      type: DataTypes.JSON,
      defaultValue: {}, // { "math": 75, "science": 60, ... }
    },
    learningStyle: {
      type: DataTypes.STRING,
      defaultValue: 'balanced', // visual, auditory, kinesthetic, reading, balanced
    },
    preferredStudyTime: {
      type: DataTypes.STRING,
      defaultValue: 'morning', // morning, afternoon, evening, night
    },
    
    // Special Events
    eventParticipation: {
      type: DataTypes.JSON,
      defaultValue: {}, // Track participation in special events
    },
    seasonalProgress: {
      type: DataTypes.JSON,
      defaultValue: {}, // Track seasonal challenges and rewards
    },
  }, {
    tableName: 'user_progress',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // Associations
  UserProgress.associate = (models) => {
    // UserProgress belongs to User
    UserProgress.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  // Instance methods
  UserProgress.prototype.addXP = function(amount, reason = 'task_completion') {
    this.totalXP += amount;
    
    // Check for level up
    while (this.totalXP >= this.xpToNextLevel) {
      this.totalXP -= this.xpToNextLevel;
      this.currentLevel += 1;
      this.xpToNextLevel = this.calculateXPForNextLevel();
      
      // Award level up rewards
      this.coins += this.currentLevel * 10; // More coins for higher levels
      if (this.currentLevel % 5 === 0) {
        this.gems += 1; // Gem every 5 levels
      }
    }
    
    return this.save();
  };

  UserProgress.prototype.calculateXPForNextLevel = function() {
    // Exponential growth: 100 * 1.2^(level-1)
    return Math.floor(100 * Math.pow(1.2, this.currentLevel - 1));
  };

  UserProgress.prototype.addCoins = function(amount, reason = 'task_completion') {
    this.coins += amount;
    return this.save();
  };

  UserProgress.prototype.spendCoins = async function(amount) {
    if (this.coins >= amount) {
      this.coins -= amount;
      await this.save();
      return true;
    }
    return false;
  };

  UserProgress.prototype.updateStreak = function() {
    const today = new Date().toISOString().split('T')[0];
    const lastStudy = this.lastStudyDate ? this.lastStudyDate.toISOString().split('T')[0] : null;
    
    if (lastStudy === today) {
      // Already studied today
      return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastStudy === yesterdayStr) {
      // Continuing streak
      this.currentStreak += 1;
    } else if (lastStudy !== today) {
      // Streak broken
      this.currentStreak = 1;
    }
    
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
    
    this.lastStudyDate = new Date();
    return this.save();
  };

  UserProgress.prototype.plantTree = function() {
    this.treesPlanted += 1;
    
    // Every 10 trees increases forest level
    if (this.treesPlanted % 10 === 0) {
      this.forestLevel += 1;
    }
    
    // Improve ecosystem health
    this.ecosystemHealth = Math.min(100, this.ecosystemHealth + 2);
    
    return this.save();
  };

  UserProgress.prototype.feedPet = function() {
    this.petHappiness = Math.min(100, this.petHappiness + 10);
    this.petEnergy = Math.min(100, this.petEnergy + 5);
    this.lastPetInteraction = new Date();
    
    // Pet levels up based on interactions
    const interactionCount = Math.floor(this.petHappiness / 10);
    this.petLevel = Math.max(1, Math.floor(interactionCount / 10) + 1);
    
    return this.save();
  };

  return UserProgress;
};
