// Migration: Đổi kiểu userId từ INTEGER sang UUID cho user_pets và todos
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Đổi kiểu userId ở user_pets
    await queryInterface.changeColumn('user_pets', 'userId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    });
    // Đổi kiểu userId ở todos
    await queryInterface.changeColumn('todos', 'userId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Quay lại INTEGER nếu rollback
    await queryInterface.changeColumn('user_pets', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    });
    await queryInterface.changeColumn('todos', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    });
  }
}; 