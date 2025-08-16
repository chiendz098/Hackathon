const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PinnedMessage = sequelize.define('PinnedMessage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chat_messages',
        key: 'id'
      }
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chat_rooms',
        key: 'id'
      }
    },
    pinnedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    pinnedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'pinned_messages',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['messageId']
      },
      {
        fields: ['roomId']
      },
      {
        fields: ['pinnedAt']
      }
    ]
  });

  PinnedMessage.associate = (models) => {
    PinnedMessage.belongsTo(models.ChatMessage, {
      foreignKey: 'messageId',
      as: 'message'
    });

    PinnedMessage.belongsTo(models.ChatRoom, {
      foreignKey: 'roomId',
      as: 'room'
    });

    PinnedMessage.belongsTo(models.User, {
      foreignKey: 'pinnedBy',
      as: 'pinner'
    });
  };

  return PinnedMessage;
}; 