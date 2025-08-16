const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'student',
      validate: {
        isIn: [['student', 'teacher', 'admin', 'moderator']],
      },
    },
    avatar: {
      type: DataTypes.TEXT,
      defaultValue: '/default-avatar.png',
    },
    avatarframe: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profilebanner: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profiledecorations: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    bio: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    studentid: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    major: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    year: {
      type: DataTypes.INTEGER,
      defaultValue: new Date().getFullYear(),
    },
    year_level: {
      type: DataTypes.INTEGER,
      defaultValue: new Date().getFullYear(),
    },
    phone: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    address: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    isactive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastlogin: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        theme: 'auto',
        language: 'en',
        notifications: {
          sms: false,
          push: true,
          email: true
        }
      },
    },
    sociallinks: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    xp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastactivity: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'online',
      validate: {
        isIn: [['online', 'away', 'busy', 'offline']],
      },
    },
    customStatus: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    lastSeen: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    coins: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
    },
    gems: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    currenttheme: {
      type: DataTypes.STRING,
      defaultValue: 'default',
    },
    unlockedthemes: {
      type: DataTypes.JSON,
      defaultValue: ['default'],
    },
    studystyle: {
      type: DataTypes.STRING,
      defaultValue: 'visual',
      validate: {
        isIn: [['visual', 'auditory', 'kinesthetic', 'reading', 'balanced']],
      },
    },
    analytics: {
      type: DataTypes.JSON,
      defaultValue: {
        weeklyGoals: {
          tasksPerWeek: 10,
          studyHoursPerWeek: 20
        },
        monthlyStats: {
          focusTime: 0,
          consistency: 0,
          improvement: 0
        },
        tasksCompleted: 0,
        totalStudyTime: 0,
        subjectEngagement: {},
        mostProductiveHour: 14,
        averageTaskCompletionTime: 0
      },
    },
    currentpet: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lastdailyreward: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dailystreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_study_time: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_focus_sessions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    achievements_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // Instance methods
  User.prototype.getPublicProfile = function() {
    const userObject = this.toJSON();
    delete userObject.password;
    return userObject;
  };

  User.prototype.addXP = function(amount) {
    this.xp += amount;
    this.last_activity = new Date();
    const newLevel = Math.floor(this.xp / 1000) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      return { leveledUp: true, newLevel };
    }
    return { leveledUp: false };
  };

  // Class methods
  User.findByEmail = function(email) {
    return this.findOne({ where: { email: email.toLowerCase() } });
  };

  User.findActive = function() {
    return this.findAll({ where: { isactive: true } });
  };

  // Associations
  User.associate = (models) => {
    // User has many Todos - align FK with DB column name used in todos
    User.hasMany(models.Todo, {
      foreignKey: 'userId',
      as: 'todos'
    });

    // Keep existing associations as-is (many tables use user_id snake_case)
    User.hasMany(models.Post, { foreignKey: 'authorId', as: 'posts' });
    User.hasMany(models.Classroom, { foreignKey: 'created_by', as: 'createdClassrooms' });
    User.hasMany(models.TodoAssignment, { foreignKey: 'assigned_by', as: 'assignedTodos' });
    User.hasMany(models.Group, { foreignKey: 'created_by', as: 'createdGroups' });
    User.hasMany(models.Message, { foreignKey: 'sender_id', as: 'sentMessages' });
    User.hasMany(models.Notification, { foreignKey: 'user_id', as: 'notifications' });
    User.hasMany(models.Comment, { foreignKey: 'userId', as: 'comments' });
    User.hasMany(models.TodoComment, { foreignKey: 'user_id', as: 'todoComments' });
    User.hasMany(models.TimeEntry, { foreignKey: 'user_id', as: 'timeEntries' });
    User.hasMany(models.ActivityFeed, { foreignKey: 'user_id', as: 'activityFeeds' });
    User.hasMany(models.Friendship, { foreignKey: 'requester_id', as: 'friendshipRequests' });
    User.hasMany(models.Friendship, { foreignKey: 'addressee_id', as: 'friendshipReceived' });
    User.hasOne(models.UserProfile, { foreignKey: 'user_id', as: 'profile' });
    User.belongsToMany(models.Group, { through: 'GroupMembers', foreignKey: 'user_id', otherKey: 'group_id', as: 'groups' });
  
    User.belongsToMany(models.Achievement, { through: models.UserAchievement, foreignKey: 'user_id', otherKey: 'achievement_id', as: 'achievements' });
    User.hasOne(models.UserProgress, { foreignKey: 'user_id', as: 'progress' });
    User.hasMany(models.UserPurchase, { foreignKey: 'user_id', as: 'purchases' });
    User.hasMany(models.UserPet, { foreignKey: 'user_id', as: 'pets' });
    User.hasMany(models.UserDailyReward, { foreignKey: 'user_id', as: 'dailyRewards' });
    User.hasMany(models.UserAnalytics, { foreignKey: 'user_id', as: 'analyticsData' });
    User.hasMany(models.FocusSession, { foreignKey: 'user_id', as: 'focusSessions' });
    User.hasMany(models.ClassroomStudent, { foreignKey: 'student_id', as: 'classroomEnrollments' });
    User.hasMany(models.TodoSubmission, { foreignKey: 'student_id', as: 'submissions' });
    User.hasMany(models.Theme, { foreignKey: 'created_by', as: 'createdThemes' });

    // Chat associations
    User.hasMany(models.ChatMessage, { foreignKey: 'senderId', as: 'sentChatMessages' });
    User.hasMany(models.ChatParticipant, { foreignKey: 'userId', as: 'chatParticipations' });
    User.hasMany(models.PinnedMessage, { foreignKey: 'pinnedBy', as: 'pinnedMessages' });
    User.hasMany(models.ScheduledMessage, { foreignKey: 'scheduledBy', as: 'scheduledMessages' });
    User.hasMany(models.ChatModerator, { foreignKey: 'userId', as: 'moderatorRoles' });
    User.hasMany(models.ChatModerator, { foreignKey: 'assignedBy', as: 'assignedModerators' });
    User.hasMany(models.ChatBan, { foreignKey: 'userId', as: 'receivedBans' });
    User.hasMany(models.ChatBan, { foreignKey: 'bannedBy', as: 'issuedBans' });
    User.hasMany(models.ChatMute, { foreignKey: 'userId', as: 'receivedMutes' });
    User.hasMany(models.ChatMute, { foreignKey: 'mutedBy', as: 'issuedMutes' });
    User.hasMany(models.MessageReaction, { foreignKey: 'userId', as: 'messageReactions' });
    User.hasMany(models.MessageEditHistory, { foreignKey: 'editedBy', as: 'messageEdits' });
  };

  return User;
};