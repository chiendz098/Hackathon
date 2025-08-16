'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create chatbot_conversations table
    await queryInterface.createTable('chatbot_conversations', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Cuộc trò chuyện mới'
      },
      messageCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      lastMessageAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for chatbot_conversations
    await queryInterface.addIndex('chatbot_conversations', ['userId']);
    await queryInterface.addIndex('chatbot_conversations', ['lastMessageAt']);

    // Create chatbot_messages table
    await queryInterface.createTable('chatbot_messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      conversationId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'chatbot_conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('user', 'bot'),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      agent: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for chatbot_messages
    await queryInterface.addIndex('chatbot_messages', ['conversationId']);
    await queryInterface.addIndex('chatbot_messages', ['type']);
    await queryInterface.addIndex('chatbot_messages', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop chatbot_messages table first (due to foreign key constraint)
    await queryInterface.dropTable('chatbot_messages');
    
    // Drop chatbot_conversations table
    await queryInterface.dropTable('chatbot_conversations');
  }
}; 