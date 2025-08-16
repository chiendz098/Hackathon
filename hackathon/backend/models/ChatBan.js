const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatBan = sequelize.define('ChatBan', {
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
    bannedBy: {
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
    bannedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isPermanent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'chat_bans',
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

  ChatBan.associate = (models) => {
    ChatBan.belongsTo(models.ChatRoom, {
      foreignKey: 'roomId',
      as: 'room'
    });

    ChatBan.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    ChatBan.belongsTo(models.User, {
      foreignKey: 'bannedBy',
      as: 'banner'
    });
  };

  return ChatBan;
}; 