'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('chatbot_conversations', 'title', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'Cuộc trò chuyện mới'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('chatbot_conversations', 'title');
  }
}; 