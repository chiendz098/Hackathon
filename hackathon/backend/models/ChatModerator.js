const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatModerator = sequelize.define('ChatModerator', {
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
      type: DataTypes.ENUM('admin', 'moderator'),
      allowNull: false,
      defaultValue: 'moderator'
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        canDeleteMessages: true,
        canEditMessages: true,
        canPinMessages: true,
        canMuteUsers: true,
        canBanUsers: false,
        canManageModerators: false,
        canViewDeletedMessages: true,
        canViewEditHistory: true
      }
    },
    assignedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'chat_moderators',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['roomId', 'userId']
      },
      {
        fields: ['roomId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['role']
      }
    ]
  });

  ChatModerator.associate = (models) => {
    ChatModerator.belongsTo(models.ChatRoom, {
      foreignKey: 'roomId',
      as: 'room'
    });

    ChatModerator.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    ChatModerator.belongsTo(models.User, {
      foreignKey: 'assignedBy',
      as: 'assigner'
    });
  };

  return ChatModerator;
}; 