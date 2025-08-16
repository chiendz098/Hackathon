const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatRoom = sequelize.define('ChatRoom', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'private',
      validate: {
        isIn: [['private', 'group']]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'chat_rooms',
    timestamps: true,
    indexes: [
      {
        fields: ['type']
      },
      {
        fields: ['lastActivity']
      },
      {
        fields: ['createdBy']
      }
    ]
  });

  ChatRoom.associate = (models) => {
    ChatRoom.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    ChatRoom.hasMany(models.ChatParticipant, {
      foreignKey: 'roomId',
      as: 'participants'
    });

    ChatRoom.hasMany(models.ChatMessage, {
      foreignKey: 'roomId',
      as: 'messages'
    });

    ChatRoom.hasOne(models.ChatMessage, {
      foreignKey: 'roomId',
      as: 'lastMessage'
    });

    // Advanced chat associations
    ChatRoom.hasMany(models.PinnedMessage, {
      foreignKey: 'roomId',
      as: 'pinnedMessages'
    });

    ChatRoom.hasMany(models.ChatModerator, {
      foreignKey: 'roomId',
      as: 'moderators'
    });

    ChatRoom.hasMany(models.ChatBan, {
      foreignKey: 'roomId',
      as: 'bans'
    });

    ChatRoom.hasMany(models.ChatMute, {
      foreignKey: 'roomId',
      as: 'mutes'
    });
  };

  return ChatRoom;
}; 