const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FocusSession = sequelize.define('FocusSession', {
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
    todoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'todos',
        key: 'id'
      }
    },

    sessionType: {
      type: DataTypes.ENUM('pomodoro', 'deep_focus', 'quick_study', 'review', 'break'),
      defaultValue: 'pomodoro'
    },
    plannedDuration: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: false
    },
    actualDuration: {
      type: DataTypes.INTEGER, // in minutes
      defaultValue: 0
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('planned', 'active', 'paused', 'completed', 'cancelled'),
      defaultValue: 'planned'
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    // Focus metrics
    focusScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0,
      validate: {
        min: 0.0,
        max: 10.0
      }
    },
    distractions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    pauseCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Session data
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mood: {
      type: DataTypes.ENUM('energetic', 'focused', 'neutral', 'tired', 'distracted'),
      defaultValue: 'neutral'
    },
    environment: {
      type: DataTypes.JSONB,
      defaultValue: {
        location: 'home',
        noise_level: 'quiet',
        lighting: 'good',
        temperature: 'comfortable'
      }
    },
    // Achievements during session
    achievements: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    // AI insights
    aiAnalysis: {
      type: DataTypes.JSONB,
      defaultValue: {
        productivity_rating: 0,
        improvement_suggestions: [],
        pattern_insights: []
      }
    },
    // Rewards earned
    xpEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    coinsEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'focus_sessions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['todoId']
      },
      {
        fields: ['studyRoomId']
      },
      {
        fields: ['startTime']
      },
      {
        fields: ['status']
      }
    ]
  });

  // Instance methods
  FocusSession.prototype.start = function() {
    this.status = 'active';
    this.startTime = new Date();
  };

  FocusSession.prototype.pause = function() {
    this.status = 'paused';
    this.pauseCount += 1;
  };

  FocusSession.prototype.resume = function() {
    this.status = 'active';
  };

  FocusSession.prototype.complete = function() {
    this.status = 'completed';
    this.endTime = new Date();
    this.actualDuration = Math.floor((this.endTime - this.startTime) / (1000 * 60));
    this.calculateFocusScore();
    this.calculateRewards();
  };

  FocusSession.prototype.calculateFocusScore = function() {
    const completionRate = this.actualDuration / this.plannedDuration;
    const distractionPenalty = Math.max(0, 1 - (this.distractions * 0.1));
    const pausePenalty = Math.max(0, 1 - (this.pauseCount * 0.05));
    
    this.focusScore = Math.min(10, completionRate * distractionPenalty * pausePenalty * 10);
  };

  FocusSession.prototype.calculateRewards = function() {
    const baseXP = Math.floor(this.actualDuration / 5); // 1 XP per 5 minutes
    const focusBonus = Math.floor(this.focusScore);
    
    this.xpEarned = baseXP + focusBonus;
    this.coinsEarned = Math.floor(this.actualDuration / 10); // 1 coin per 10 minutes
  };

  // Associations
  FocusSession.associate = (models) => {
    // FocusSession belongs to User
    FocusSession.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // FocusSession belongs to Todo (optional)
    FocusSession.belongsTo(models.Todo, {
      foreignKey: 'todoId',
      as: 'todo'
    });

    // FocusSession belongs to StudyRoom (optional) - commented out, model doesn't exist
    // FocusSession.belongsTo(models.StudyRoom, {
    //   foreignKey: 'studyRoomId',
    //   as: 'studyRoom'
    // });
  };

  return FocusSession;
};
