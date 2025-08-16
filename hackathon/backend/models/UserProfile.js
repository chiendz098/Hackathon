const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserProfile = sequelize.define('UserProfile', {
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
    
    // Basic Profile Info
    displayName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    
    // Social Links
    socialLinks: {
      type: DataTypes.JSON,
      defaultValue: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        github: '',
        discord: ''
      },
    },
    
    // Learning Preferences
    learningStyle: {
      type: DataTypes.ENUM('visual', 'auditory', 'kinesthetic', 'reading'),
      defaultValue: 'visual',
    },
    studyGoals: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    favoriteSubjects: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    studySchedule: {
      type: DataTypes.JSON,
      defaultValue: {
        preferredTimes: [],
        dailyGoalHours: 2,
        weeklyGoalHours: 14,
        breakDuration: 15,
        sessionDuration: 45
      },
    },
    
    // Academic Info
    gpa: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 4.0
      }
    },
    academicYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    major: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    minor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    certificates: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    
    // Skills and Interests
    skills: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    interests: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    languages: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    
    // Privacy Settings
    privacySettings: {
      type: DataTypes.JSON,
      defaultValue: {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showLocation: false,
        showAcademicInfo: true,
        showSkills: true,
        showInterests: true
      },
    },
    
    // Notification Preferences
    notificationPreferences: {
      type: DataTypes.JSON,
      defaultValue: {
        email: true,
        push: true,
        sms: false,
        studyReminders: true,
        achievementNotifications: true,
        socialNotifications: true,
        academicUpdates: true
      },
    },
    
    // Theme and Customization
    theme: {
      type: DataTypes.STRING,
      defaultValue: 'default',
    },
    customColors: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    
    // Study Statistics
    studyStats: {
      type: DataTypes.JSON,
      defaultValue: {
        totalStudyTime: 0,
        averageSessionLength: 0,
        longestStreak: 0,
        favoriteStudyTime: 14,
        mostProductiveDay: 'monday'
      },
    },
    
    // Achievements and Badges
    achievements: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    badges: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    
    // Social Connections
    friends: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    followers: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    following: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    
    // Study Groups and Communities
    studyGroups: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    communities: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    
    // Preferences for AI and Features
    aiPreferences: {
      type: DataTypes.JSON,
      defaultValue: {
        enableAISuggestions: true,
        aiStudyPlanner: true,
        aiTutor: true,
        personalizedRecommendations: true
      },
    },
    
    // Accessibility Settings
    accessibility: {
      type: DataTypes.JSON,
      defaultValue: {
        highContrast: false,
        largeText: false,
        screenReader: false,
        keyboardNavigation: true
      },
    },
    
    // Last Updated
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'user_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  UserProfile.associate = (models) => {
    UserProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return UserProfile;
};
