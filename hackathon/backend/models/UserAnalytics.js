const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserAnalytics = sequelize.define('UserAnalytics', {
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    // Daily Metrics
    tasksCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    tasksCreated: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    studyTimeMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    focusTimeMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    breakTimeMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Subject-specific data
    subjectBreakdown: {
      type: DataTypes.JSONB,
      defaultValue: {} // {subject: {time: minutes, tasks: count, difficulty: avg}}
    },
    // Productivity metrics
    productivityScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
      validate: {
        min: 0.0,
        max: 10.0
      }
    },
    consistencyScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
      validate: {
        min: 0.0,
        max: 10.0
      }
    },
    // Time patterns
    mostActiveHour: {
      type: DataTypes.INTEGER,
      defaultValue: 14,
      validate: {
        min: 0,
        max: 23
      }
    },
    sessionPatterns: {
      type: DataTypes.JSONB,
      defaultValue: {
        shortSessions: 0, // < 30 min
        mediumSessions: 0, // 30-60 min
        longSessions: 0, // > 60 min
        averageSessionLength: 0
      }
    },
    // Engagement metrics
    engagementLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    motivationFactors: {
      type: DataTypes.JSONB,
      defaultValue: {
        rewards: 0,
        social: 0,
        achievement: 0,
        learning: 0
      }
    },
    // AI Insights
    aiInsights: {
      type: DataTypes.JSONB,
      defaultValue: {
        strengths: [],
        improvements: [],
        recommendations: [],
        patterns: []
      }
    },
    // Mood and wellness
    moodRating: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 10
      }
    },
    stressLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 5
      }
    },
    // Gamification data
    xpEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    coinsEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    achievementsUnlocked: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Enhanced analytics
    assignmentsCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    assignmentsSubmitted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    averageScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    studyRoomsJoined: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    messagesInStudyRooms: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    shopPurchases: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    coinsSpent: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    petInteractions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    themeChanges: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'user_analytics',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['date']
      },
      {
        unique: true,
        fields: ['userId', 'date']
      }
    ]
  });

  // Instance methods
  UserAnalytics.prototype.calculateProductivityScore = function() {
    const tasksWeight = Math.min(this.tasksCompleted * 2, 40);
    const timeWeight = Math.min(this.studyTimeMinutes / 30, 40);
    const focusWeight = this.focusTimeMinutes > 0 ? 
      Math.min((this.focusTimeMinutes / this.studyTimeMinutes) * 20, 20) : 0;
    
    this.productivityScore = (tasksWeight + timeWeight + focusWeight) / 10;
  };

  UserAnalytics.prototype.updateEngagementLevel = function() {
    const score = this.productivityScore;
    if (score >= 7) this.engagementLevel = 'high';
    else if (score >= 4) this.engagementLevel = 'medium';
    else this.engagementLevel = 'low';
  };

  // Associations
  UserAnalytics.associate = (models) => {
    // UserAnalytics belongs to User
    UserAnalytics.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return UserAnalytics;
};
