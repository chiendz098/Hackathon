const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatParticipant = sequelize.define('ChatParticipant', {
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'member',
      validate: {
        isIn: [['member', 'admin', 'moderator']]
      }
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true
    },
    unreadCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'chat_participants',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['roomId', 'userId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['roomId']
      }
    ]
  });

  ChatParticipant.associate = (models) => {
    ChatParticipant.belongsTo(models.ChatRoom, {
      foreignKey: 'roomId',
      as: 'room'
    });

    ChatParticipant.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return ChatParticipant;
}; 