'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔧 Fixing all group todo related foreign key constraints...');
      
      // List of tables that should reference group_todos instead of todos
      const tablesToFix = [
        'group_todo_activities',
        'group_todo_assignments', 
        'group_todo_chat',
        'group_todo_workflow',
        'group_todo_skills',
        'group_todo_notifications'
      ];
      
      for (const tableName of tablesToFix) {
        console.log(`📋 Checking table: ${tableName}`);
        
        // Check if table exists
        const [tableExists] = await queryInterface.sequelize.query(
          `SELECT table_name FROM information_schema.tables WHERE table_name = '${tableName}'`,
          { transaction }
        );
        
        if (tableExists.length === 0) {
          console.log(`⚠️ Table ${tableName} does not exist, skipping...`);
          continue;
        }
        
        // Check for todo_id foreign key constraint
        const [constraints] = await queryInterface.sequelize.query(
          `SELECT constraint_name 
           FROM information_schema.table_constraints 
           WHERE table_name = '${tableName}' 
           AND constraint_type = 'FOREIGN KEY'
           AND constraint_name LIKE '%todo_id%'`,
          { transaction }
        );
        
        for (const constraint of constraints) {
          console.log(`🔧 Dropping constraint: ${constraint.constraint_name}`);
          
          // Drop the existing constraint
          await queryInterface.sequelize.query(
            `ALTER TABLE ${tableName} DROP CONSTRAINT "${constraint.constraint_name}"`,
            { transaction }
          );
          
          // Add new constraint referencing group_todos
          const newConstraintName = `${tableName}_todo_id_fkey`;
          await queryInterface.sequelize.query(
            `ALTER TABLE ${tableName} 
             ADD CONSTRAINT "${newConstraintName}" 
             FOREIGN KEY (todo_id) REFERENCES group_todos(id) 
             ON DELETE CASCADE ON UPDATE CASCADE`,
            { transaction }
          );
          
          console.log(`✅ Fixed constraint for ${tableName}`);
        }
      }
      
      await transaction.commit();
      console.log('🎉 Successfully fixed all group todo foreign key constraints');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error fixing constraints:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔄 Reverting group todo foreign key constraints...');
      
      // This is a complex rollback - we'll just log that it's not fully reversible
      console.log('⚠️ Note: This migration rollback is not fully reversible');
      console.log('⚠️ Manual intervention may be required to restore original constraints');
      
      await transaction.commit();
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error during rollback:', error);
      throw error;
    }
  }
}; 