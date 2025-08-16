const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatbotConversation = sequelize.define('ChatbotConversation', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'started_at',
      defaultValue: DataTypes.NOW
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'title',
      defaultValue: 'Cuộc trò chuyện mới'
    }
  }, {
    tableName: 'chatbot_conversations',
    timestamps: false, // No createdAt/updatedAt columns
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['started_at']
      }
    ]
  });

  ChatbotConversation.associate = (models) => {
    ChatbotConversation.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    ChatbotConversation.hasMany(models.ChatbotMessage, {
      foreignKey: 'conversationId',
      as: 'messages'
    });
  };

  return ChatbotConversation;
}; 