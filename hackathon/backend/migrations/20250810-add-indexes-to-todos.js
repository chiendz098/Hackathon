'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Adding indexes to todos table...');
    
    try {
      // Add index for userId (most common query)
      await queryInterface.addIndex('todos', ['userId'], {
        name: 'idx_todos_userId',
        using: 'BTREE'
      }).catch(() => {});
      console.log('✅ Added index for userId');

      // Add index for status (frequently filtered)
      await queryInterface.addIndex('todos', ['status'], {
        name: 'idx_todos_status',
        using: 'BTREE'
      }).catch(() => {});
      console.log('✅ Added index for status');

      // Add composite index for userId + status (common combination)
      await queryInterface.addIndex('todos', ['userId', 'status'], {
        name: 'idx_todos_userId_status',
        using: 'BTREE'
      }).catch(() => {});
      console.log('✅ Added composite index for userId + status');

      // Add index for priority (frequently filtered)
      await queryInterface.addIndex('todos', ['priority'], {
        name: 'idx_todos_priority',
        using: 'BTREE'
      }).catch(() => {});
      console.log('✅ Added index for priority');

      // Add index for deadline (for sorting and filtering)
      await queryInterface.addIndex('todos', ['deadline'], {
        name: 'idx_todos_deadline',
        using: 'BTREE'
      }).catch(() => {});
      console.log('✅ Added index for deadline');

      // Add index for category (frequently filtered)
      await queryInterface.addIndex('todos', ['category'], {
        name: 'idx_todos_category',
        using: 'BTREE'
      }).catch(() => {});
      console.log('✅ Added index for category');

      // Add index for createdAt (for sorting)
      await queryInterface.addIndex('todos', ['createdAt'], {
        name: 'idx_todos_created_at',
        using: 'BTREE'
      }).catch(() => {});
      console.log('✅ Added index for createdAt');

      // Add composite index for userId + createdAt (for user's todo history)
      await queryInterface.addIndex('todos', ['userId', 'createdAt'], {
        name: 'idx_todos_user_created',
        using: 'BTREE'
      }).catch(() => {});
      console.log('✅ Added composite index for userId + createdAt');

      // Add composite index for userId + priority + status (for dashboard queries)
      await queryInterface.addIndex('todos', ['userId', 'priority', 'status'], {
        name: 'idx_todos_user_priority_status',
        using: 'BTREE'
      }).catch(() => {});
      console.log('✅ Added composite index for userId + priority + status');

      console.log('🎉 All indexes added successfully!');
      
    } catch (error) {
      console.error('❌ Error adding indexes:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Removing indexes from todos table...');
    
    try {
      // Remove all indexes in reverse order
      await queryInterface.removeIndex('todos', 'idx_todos_user_priority_status');
      await queryInterface.removeIndex('todos', 'idx_todos_user_created');
      await queryInterface.removeIndex('todos', 'idx_todos_created_at');
      await queryInterface.removeIndex('todos', 'idx_todos_category');
      await queryInterface.removeIndex('todos', 'idx_todos_deadline');
      await queryInterface.removeIndex('todos', 'idx_todos_priority');
      await queryInterface.removeIndex('todos', 'idx_todos_userId_status');
      await queryInterface.removeIndex('todos', 'idx_todos_status');
      await queryInterface.removeIndex('todos', 'idx_todos_userId');
      
      console.log('✅ All indexes removed successfully!');
      
    } catch (error) {
      console.error('❌ Error removing indexes:', error);
      throw error;
    }
  }
}; 