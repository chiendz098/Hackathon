const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatbotMessage = sequelize.define('ChatbotMessage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    conversationId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'conversation_id',
      references: {
        model: 'chatbot_conversations',
        key: 'id'
      }
    },
    message: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  }, {
    tableName: 'chatbot_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updated_at column
    indexes: [
      {
        fields: ['conversation_id']
      }
    ]
  });

  ChatbotMessage.associate = (models) => {
    ChatbotMessage.belongsTo(models.ChatbotConversation, {
      foreignKey: 'conversationId',
      as: 'conversation'
    });
  };

  return ChatbotMessage;
}; 