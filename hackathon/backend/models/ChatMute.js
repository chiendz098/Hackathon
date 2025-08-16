const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatMute = sequelize.define('ChatMute', {
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
    mutedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mutedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'chat_mutes',
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
        fields: ['expiresAt']
      }
    ]
  });

  ChatMute.associate = (models) => {
    ChatMute.belongsTo(models.ChatRoom, {
      foreignKey: 'roomId',
      as: 'room'
    });

    ChatMute.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    ChatMute.belongsTo(models.User, {
      foreignKey: 'mutedBy',
      as: 'muter'
    });
  };

  return ChatMute;
}; 