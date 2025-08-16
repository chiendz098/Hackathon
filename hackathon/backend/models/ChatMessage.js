const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatMessage = sequelize.define('ChatMessage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chat_rooms',
        key: 'id'
      }
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'text',
      validate: {
        isIn: [['text', 'image', 'file', 'audio', 'video', 'location', 'sticker', 'voice', 'gif', 'system']]
      }
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    replyToId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'chat_messages',
        key: 'id'
      }
    },
    threadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'chat_messages',
        key: 'id'
      }
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isStarred: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    selfDestructAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    mentions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    reactions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    forwardFrom: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    linkPreview: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    },
    encryptionKey: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    // File-specific fields
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Voice message specific
    voiceDuration: {
      type: DataTypes.INTEGER, // in seconds
      allowNull: true
    },
    voiceTranscription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Location specific
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    locationName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // System message specific
    systemAction: {
      type: DataTypes.STRING,
      allowNull: true
    },
    systemData: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'chat_messages',
    timestamps: true,
    indexes: [
      {
        fields: ['roomId']
      },
      {
        fields: ['senderId']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['readAt']
      },
      {
        fields: ['type']
      },
      {
        fields: ['threadId']
      },
      {
        fields: ['isPinned']
      },
      {
        fields: ['scheduledAt']
      },
      {
        fields: ['sentAt']
      },
      {
        fields: ['selfDestructAt']
      },
      {
        fields: ['isDeleted']
      }
    ]
  });

  ChatMessage.associate = (models) => {
    ChatMessage.belongsTo(models.ChatRoom, {
      foreignKey: 'roomId',
      as: 'room'
    });

    ChatMessage.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender'
    });

    ChatMessage.belongsTo(models.ChatMessage, {
      foreignKey: 'replyToId',
      as: 'replyTo'
    });

    ChatMessage.belongsTo(models.ChatMessage, {
      foreignKey: 'threadId',
      as: 'thread'
    });

    ChatMessage.hasMany(models.ChatMessage, {
      foreignKey: 'replyToId',
      as: 'replies'
    });

    ChatMessage.hasMany(models.ChatMessage, {
      foreignKey: 'threadId',
      as: 'threadMessages'
    });

    ChatMessage.hasMany(models.MessageReaction, {
      foreignKey: 'messageId',
      as: 'messageReactions'
    });

    ChatMessage.hasMany(models.MessageRead, {
      foreignKey: 'messageId',
      as: 'messageReads'
    });

    // Advanced chat associations
    ChatMessage.hasMany(models.PinnedMessage, {
      foreignKey: 'messageId',
      as: 'pinnedMessages'
    });

    ChatMessage.hasMany(models.ScheduledMessage, {
      foreignKey: 'messageId',
      as: 'scheduledMessages'
    });

    ChatMessage.hasMany(models.MessageEditHistory, {
      foreignKey: 'messageId',
      as: 'editHistory'
    });
  };

  return ChatMessage;
}; 