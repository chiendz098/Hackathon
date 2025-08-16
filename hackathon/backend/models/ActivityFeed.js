const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityFeed = sequelize.define('ActivityFeed', {
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
        key: 'id',
      },
    },
    
    // Activity details
    activityType: {
      type: DataTypes.ENUM(
        'task_completed',
        'level_up',
        'achievement_earned',
        'streak_milestone',
        'study_session_completed',
        'friend_added',
        
        'shared_resource',
        'posted_comment',
        'liked_post',
        'profile_updated',
        'badge_earned',
        'goal_achieved',
        'challenge_completed',
        'mentor_session',
        'course_completed',
        'quiz_passed',
        'note_shared',
        'study_group_joined'
      ),
      allowNull: false,
    },
    
    // Activity content
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    // Activity metadata
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      // Examples:
      // { taskId: 123, taskTitle: "Complete Math Homework", xpEarned: 25 }
      // { achievementId: 456, achievementName: "First Week Streak", badgeIcon: "🔥" }
      // { levelFrom: 5, levelTo: 6, xpRequired: 1000 }
    },
    
    // Visibility and privacy
    visibility: {
      type: DataTypes.ENUM('public', 'friends', 'private'),
      defaultValue: 'friends',
    },
    
    // Engagement metrics
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    comments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    shares: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    
    // Activity context
    contextType: {
      type: DataTypes.ENUM('individual', 'group', 'challenge', 'course'),
      defaultValue: 'individual',
    },
    contextId: {
      type: DataTypes.INTEGER,
      allowNull: true, // ID of study room, group, challenge, etc.
    },
    
    // Related entities
    relatedUserId: {
      type: DataTypes.INTEGER,
      allowNull: true, // For activities involving other users
      references: {
        model: 'users',
        key: 'id',
      },
    },
    relatedEntityType: {
      type: DataTypes.STRING,
      allowNull: true, // 'todo', 'achievement', etc.
    },
    relatedEntityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    
    // Activity importance and priority
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'milestone'),
      defaultValue: 'normal',
    },
    
    // Gamification elements
    xpAwarded: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    badgesEarned: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    
    // Activity tags for filtering
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    
    // Location data (optional)
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    
    // Activity status
    isHighlighted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    
    // Expiration for temporary activities
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
  }, {
    tableName: 'activity_feeds',
    timestamps: true,
    // Remove redundant timestamp configuration since it's now global
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['activityType']
      },
      {
        fields: ['visibility']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['contextType', 'contextId']
      }
    ]
  });

  // Instance methods
  ActivityFeed.prototype.incrementLikes = function() {
    this.likes += 1;
    return this.save();
  };

  ActivityFeed.prototype.decrementLikes = function() {
    this.likes = Math.max(0, this.likes - 1);
    return this.save();
  };

  ActivityFeed.prototype.incrementComments = function() {
    this.comments += 1;
    return this.save();
  };

  ActivityFeed.prototype.incrementShares = function() {
    this.shares += 1;
    return this.save();
  };

  ActivityFeed.prototype.highlight = function() {
    this.isHighlighted = true;
    return this.save();
  };

  ActivityFeed.prototype.pin = function() {
    this.isPinned = true;
    return this.save();
  };

  ActivityFeed.prototype.archive = function() {
    this.isArchived = true;
    return this.save();
  };

  ActivityFeed.prototype.addTag = function(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      return this.save();
    }
    return Promise.resolve(this);
  };

  ActivityFeed.prototype.removeTag = function(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    return this.save();
  };

  // Class methods
  ActivityFeed.createActivity = function(activityData) {
    return this.create({
      userId: activityData.userId,
      activityType: activityData.type,
      title: activityData.title,
      description: activityData.description,
      metadata: activityData.metadata || {},
      visibility: activityData.visibility || 'friends',
      priority: activityData.priority || 'normal',
      contextType: activityData.contextType || 'individual',
      contextId: activityData.contextId,
      relatedUserId: activityData.relatedUserId,
      relatedEntityType: activityData.relatedEntityType,
      relatedEntityId: activityData.relatedEntityId,
      xpAwarded: activityData.xpAwarded || 0,
      badgesEarned: activityData.badgesEarned || [],
      tags: activityData.tags || [],
      location: activityData.location
    });
  };

  ActivityFeed.getUserFeed = function(userId, limit = 20, offset = 0) {
    return this.findAll({
      where: {
        userId,
        isArchived: false
      },
      order: [
        ['isPinned', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit,
      offset,
      include: [
        {
          model: require('./User')(sequelize),
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: require('./User')(sequelize),
          as: 'relatedUser',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        }
      ]
    });
  };

  ActivityFeed.getFriendsFeed = function(userId, friendIds, limit = 50, offset = 0) {
    return this.findAll({
      where: {
        userId: {
          [require('sequelize').Op.in]: friendIds
        },
        visibility: {
          [require('sequelize').Op.in]: ['public', 'friends']
        },
        isArchived: false
      },
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit,
      offset,
      include: [
        {
          model: require('./User')(sequelize),
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
  };

  ActivityFeed.getPublicFeed = function(limit = 30, offset = 0) {
    return this.findAll({
      where: {
        visibility: 'public',
        isArchived: false
      },
      order: [
        ['priority', 'DESC'],
        ['likes', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit,
      offset,
      include: [
        {
          model: require('./User')(sequelize),
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
  };

  ActivityFeed.getActivityByType = function(activityType, limit = 20) {
    return this.findAll({
      where: {
        activityType,
        visibility: {
          [require('sequelize').Op.in]: ['public', 'friends']
        },
        isArchived: false
      },
      order: [['createdAt', 'DESC']],
      limit,
      include: [
        {
          model: require('./User')(sequelize),
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
  };

  ActivityFeed.getTrendingActivities = function(timeframe = '24h', limit = 10) {
    const timeMap = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    };
    
    const hoursAgo = timeMap[timeframe] || 24;
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    
    return this.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: since
        },
        visibility: 'public',
        isArchived: false
      },
      order: [
        [require('sequelize').literal('(likes + comments * 2 + shares * 3)'), 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit,
      include: [
        {
          model: require('./User')(sequelize),
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
  };

  ActivityFeed.cleanupExpiredActivities = function() {
    return this.destroy({
      where: {
        expiresAt: {
          [require('sequelize').Op.lt]: new Date()
        }
      }
    });
  };

  // Associations
  ActivityFeed.associate = function(models) {
    ActivityFeed.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    ActivityFeed.belongsTo(models.User, {
      foreignKey: 'relatedUserId',
      as: 'relatedUser'
    });

    // Add Todo association
    ActivityFeed.belongsTo(models.Todo, {
      foreignKey: 'relatedEntityId',
      as: 'todo',
      constraints: false,
      scope: {
        relatedEntityType: 'todo'
      }
    });
  };

  return ActivityFeed;
};
