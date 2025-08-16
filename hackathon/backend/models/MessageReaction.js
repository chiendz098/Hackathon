const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MessageReaction = sequelize.define('MessageReaction', {
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
    reaction: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🙏', '🔥', '💯', '✨', '🎉', '🤔', '👀', '💪', '🚀', '💡', '🎯', '⭐', '🏆']]
      }
    }
  }, {
    tableName: 'message_reactions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['messageId', 'userId']
      },
      {
        fields: ['messageId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['reaction']
      }
    ]
  });

  MessageReaction.associate = (models) => {
    MessageReaction.belongsTo(models.ChatMessage, {
      foreignKey: 'messageId',
      as: 'message'
    });

    MessageReaction.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return MessageReaction;
}; 