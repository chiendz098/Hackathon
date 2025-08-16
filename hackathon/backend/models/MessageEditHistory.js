const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MessageEditHistory = sequelize.define('MessageEditHistory', {
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
    editedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    previousContent: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'message_edit_history',
    timestamps: false,
    indexes: [
      {
        fields: ['messageId']
      },
      {
        fields: ['editedBy']
      },
      {
        fields: ['editedAt']
      }
    ]
  });

  MessageEditHistory.associate = (models) => {
    MessageEditHistory.belongsTo(models.ChatMessage, {
      foreignKey: 'messageId',
      as: 'message'
    });

    MessageEditHistory.belongsTo(models.User, {
      foreignKey: 'editedBy',
      as: 'editor'
    });
  };

  return MessageEditHistory;
}; 