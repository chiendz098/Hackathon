const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MessageRead = sequelize.define('MessageRead', {
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'message_reads',
    timestamps: false,
    indexes: [
      {
        fields: ['messageId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['readAt']
      },
      {
        unique: true,
        fields: ['messageId', 'userId']
      }
    ]
  });

  MessageRead.associate = (models) => {
    MessageRead.belongsTo(models.ChatMessage, {
      foreignKey: 'messageId',
      as: 'message'
    });

    MessageRead.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return MessageRead;
}; 