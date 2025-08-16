'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔧 Fixing group_todo_activities foreign key constraint...');
      
      // Check if the constraint exists
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT constraint_name 
         FROM information_schema.table_constraints 
         WHERE table_name = 'group_todo_activities' 
         AND constraint_name = 'group_todo_activities_todo_id_fkey'`,
        { transaction }
      );
      
      if (constraints.length > 0) {
        // Drop the existing constraint
        await queryInterface.sequelize.query(
          'ALTER TABLE group_todo_activities DROP CONSTRAINT group_todo_activities_todo_id_fkey',
          { transaction }
        );
        console.log('✅ Dropped existing constraint');
      }
      
      // Add new constraint referencing group_todos table
      await queryInterface.sequelize.query(
        `ALTER TABLE group_todo_activities 
         ADD CONSTRAINT group_todo_activities_todo_id_fkey 
         FOREIGN KEY (todo_id) REFERENCES group_todos(id) 
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );
      console.log('✅ Added new constraint referencing group_todos table');
      
      await transaction.commit();
      console.log('🎉 Successfully fixed group_todo_activities foreign key constraint');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error fixing constraint:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔄 Reverting group_todo_activities foreign key constraint...');
      
      // Drop the new constraint
      await queryInterface.sequelize.query(
        'ALTER TABLE group_todo_activities DROP CONSTRAINT group_todo_activities_todo_id_fkey',
        { transaction }
      );
      
      // Re-add the old constraint (if group_todos table exists)
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE group_todo_activities 
           ADD CONSTRAINT group_todo_activities_todo_id_fkey 
           FOREIGN KEY (todo_id) REFERENCES group_todos(id) 
           ON DELETE CASCADE ON UPDATE CASCADE`,
          { transaction }
        );
      } catch (error) {
        console.log('⚠️ Could not restore old constraint - group_todos table may not exist');
      }
      
      await transaction.commit();
      console.log('✅ Reverted constraint changes');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error reverting constraint:', error);
      throw error;
    }
  }
}; 