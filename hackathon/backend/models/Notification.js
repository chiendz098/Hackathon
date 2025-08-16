const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'userId', // Explicitly map to the correct column name
      references: {
        model: 'users',
        key: 'id',
      },
    },
    // Notification content
    type: {
      type: DataTypes.ENUM(
        'achievement_earned',
        'level_up',
        'streak_milestone',
        'friend_request',
        'friend_request_accepted',
        'message_received',
        'study_reminder',
        'task_deadline',
        'room_invitation',
        'forum_mention',
        'forum_reply',
        'quiz_completed',
        'goal_achieved',
        'weekly_report',
        'system_announcement',
        'maintenance_notice',
        'feature_update',
        'challenge_invitation',
        'study_session_reminder',
        'break_reminder',
        'daily_goal_reminder',
        'leaderboard_update'
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // Notification metadata
    data: {
      type: DataTypes.JSON,
      defaultValue: {},
    },

    // Sender information
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'senderId', // Explicitly map to the correct column name
      references: {
        model: 'users',
        key: 'id',
      },
    },

    // Notification status
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Priority and importance
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal',
    },

    // Notification delivery
    deliveryMethod: {
      type: DataTypes.JSON,
      defaultValue: {
        inApp: true,
        email: false,
        push: false,
        sms: false
      },
    },

    // Delivery status
    deliveryStatus: {
      type: DataTypes.JSON,
      defaultValue: {
        inApp: 'pending',
        email: 'not_sent',
        push: 'not_sent',
        sms: 'not_sent'
      },
    },

    // Scheduling
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Action buttons/links
    actions: {
      type: DataTypes.JSON,
      defaultValue: [],
    },

    // Notification grouping
    groupKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Expiration
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Related entities
    relatedEntityType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    relatedEntityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Sender information
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'senderId', // Explicitly map to the correct column name
      references: {
        model: 'users',
        key: 'id',
      },
    },

    // Notification appearance
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Interaction tracking
    clickCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastClickedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'notifications',
    timestamps: true,
    // Remove redundant timestamp configuration since it's now global
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['expiresAt']
      },
      {
        fields: ['groupKey']
      }
    ]
  });

  // Indexes
  Notification.addIndex = function() {
    // Add indexes for better performance
    sequelize.getQueryInterface().addIndex('notifications', ['userId'], {
      name: 'notifications_user_id'
    });
    
    sequelize.getQueryInterface().addIndex('notifications', ['type'], {
      name: 'notifications_type'
    });
    
    sequelize.getQueryInterface().addIndex('notifications', ['priority'], {
      name: 'notifications_priority'
    });
    
    sequelize.getQueryInterface().addIndex('notifications', ['createdAt'], {
      name: 'notifications_created_at'
    });
    
    sequelize.getQueryInterface().addIndex('notifications', ['expiresAt'], {
      name: 'notifications_expires_at'
    });
  };

  // Instance methods
  Notification.prototype.markAsRead = function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  };

  Notification.prototype.markAsUnread = function() {
    this.isRead = false;
    this.readAt = null;
    return this.save();
  };

  Notification.prototype.incrementClick = function() {
    this.clickCount += 1;
    this.lastClickedAt = new Date();
    return this.save();
  };

  Notification.prototype.updateDeliveryStatus = function(method, status) {
    this.deliveryStatus[method] = status;
    if (status === 'sent') {
      this.sentAt = new Date();
    }
    return this.save();
  };

  // Class methods
  Notification.createNotification = function(notificationData) {
    return this.create({
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || {},
      priority: notificationData.priority || 'normal',
      deliveryMethod: notificationData.deliveryMethod || { inApp: true },
      scheduledFor: notificationData.scheduledFor,
      actions: notificationData.actions || [],
      groupKey: notificationData.groupKey,
      expiresAt: notificationData.expiresAt,
      relatedEntityType: notificationData.relatedEntityType,
      relatedEntityId: notificationData.relatedEntityId,
      senderId: notificationData.senderId,
      icon: notificationData.icon,
      color: notificationData.color,
      image: notificationData.image
    });
  };

  Notification.getUserNotifications = function(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      unreadOnly = false,
      type = null,
      priority = null
    } = options;

    const whereClause = { userId };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    if (type) {
      whereClause.type = type;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    // Filter out expired notifications
    whereClause[require('sequelize').Op.or] = [
      { expiresAt: null },
      { expiresAt: { [require('sequelize').Op.gt]: new Date() } }
    ];

    return this.findAll({
      where: whereClause,
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit,
      offset,
      include: [
        {
          model: require('./User')(sequelize),
          as: 'sender',
          attributes: ['id', 'name', 'email', 'avatar'],
          required: false
        }
      ]
    });
  };

  Notification.getUnreadCount = function(userId) {
    return this.count({
      where: {
        userId,
        isRead: false,
        [require('sequelize').Op.or]: [
          { expiresAt: null },
          { expiresAt: { [require('sequelize').Op.gt]: new Date() } }
        ]
      }
    });
  };

  Notification.markAllAsRead = function(userId) {
    return this.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          userId,
          isRead: false
        }
      }
    );
  };

  // Associations
  Notification.associate = function(models) {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    Notification.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    });
  };

  return Notification;
};