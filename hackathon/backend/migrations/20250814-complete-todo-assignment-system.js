'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔧 Completing todo assignment system...');
      
      // 1. Create/update group_todo_assignments table
      console.log('📋 Creating/updating group_todo_assignments table...');
      
      const [assignmentTables] = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'group_todo_assignments'",
        { transaction }
      );
      
      if (assignmentTables.length === 0) {
        await queryInterface.createTable('group_todo_assignments', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          todo_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'group_todos',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          assigned_by: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          role: {
            type: Sequelize.STRING,
            defaultValue: 'member', // 'member', 'lead', 'reviewer'
          },
          estimated_time: {
            type: Sequelize.INTEGER, // in hours
            allowNull: true,
          },
          due_date: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          notes: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          assigned_tasks: {
            type: Sequelize.JSONB,
            defaultValue: [], // Array of {id, title, description, status, estimatedTime, actualTime}
          },
          status: {
            type: Sequelize.ENUM('assigned', 'in_progress', 'completed', 'overdue', 'cancelled'),
            defaultValue: 'assigned',
          },
          progress: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            validate: {
              min: 0,
              max: 100,
            },
          },
          actual_time: {
            type: Sequelize.INTEGER, // in hours
            allowNull: true,
          },
          started_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          completed_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });
        
        console.log('✅ group_todo_assignments table created');
      } else {
        // Add missing columns if table exists
        const columns = [
          { name: 'assigned_tasks', type: Sequelize.JSONB, defaultValue: [] },
          { name: 'progress', type: Sequelize.INTEGER, defaultValue: 0 },
          { name: 'actual_time', type: Sequelize.INTEGER, allowNull: true },
          { name: 'started_at', type: Sequelize.DATE, allowNull: true },
          { name: 'completed_at', type: Sequelize.DATE, allowNull: true },
        ];
        
        for (const column of columns) {
          try {
            await queryInterface.addColumn('group_todo_assignments', column.name, {
              type: column.type,
              defaultValue: column.defaultValue,
              allowNull: column.allowNull,
            }, { transaction });
            console.log(`✅ Added column ${column.name} to group_todo_assignments`);
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log(`ℹ️ Column ${column.name} already exists in group_todo_assignments`);
            } else {
              throw error;
            }
          }
        }
      }
      
      // 2. Create/update group_todo_chat table
      console.log('💬 Creating/updating group_todo_chat table...');
      
      const [chatTables] = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'group_todo_chat'",
        { transaction }
      );
      
      if (chatTables.length === 0) {
        await queryInterface.createTable('group_todo_chat', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          todo_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'group_todos',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          content: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          message_type: {
            type: Sequelize.STRING,
            defaultValue: 'text', // 'text', 'file', 'image', 'system'
          },
          is_deleted: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });
        
        console.log('✅ group_todo_chat table created');
      }
      
      // 3. Create/update group_todo_files table
      console.log('📁 Creating/updating group_todo_files table...');
      
      const [fileTables] = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'group_todo_files'",
        { transaction }
      );
      
      if (fileTables.length === 0) {
        await queryInterface.createTable('group_todo_files', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          todo_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'group_todos',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          filename: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          file_path: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          file_size: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          mime_type: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          uploaded_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });
        
        console.log('✅ group_todo_files table created');
      }
      
      // 4. Create/update group_todo_notifications table
      console.log('🔔 Creating/updating group_todo_notifications table...');
      
      const [notificationTables] = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'group_todo_notifications'",
        { transaction }
      );
      
      if (notificationTables.length === 0) {
        await queryInterface.createTable('group_todo_notifications', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          group_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'groups',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          todo_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'group_todos',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          notification_type: {
            type: Sequelize.STRING,
            allowNull: false, // 'todo_assigned', 'todo_completed', 'todo_updated', 'deadline_reminder'
          },
          title: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          message: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          data: {
            type: Sequelize.JSONB,
            defaultValue: {},
          },
          priority: {
            type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
            defaultValue: 'medium',
          },
          delivery_methods: {
            type: Sequelize.JSONB,
            defaultValue: { inApp: true, email: false, push: false, sms: false },
          },
          is_read: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          read_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });
        
        console.log('✅ group_todo_notifications table created');
      }
      
      // 5. Add missing columns to group_todos table
      console.log('📋 Adding missing columns to group_todos table...');
      
      const groupTodoColumns = [
        { name: 'kanban_column', type: Sequelize.STRING, defaultValue: 'todo' },
        { name: 'workflow_stage', type: Sequelize.STRING, defaultValue: 'planning' },
        { name: 'sprint_id', type: Sequelize.INTEGER, allowNull: true },
        { name: 'story_points', type: Sequelize.INTEGER, allowNull: true },
        { name: 'risk_level', type: Sequelize.STRING, defaultValue: 'low' },
        { name: 'acceptance_criteria', type: Sequelize.JSONB, defaultValue: [] },
        { name: 'dependencies', type: Sequelize.JSONB, defaultValue: [] },
        { name: 'milestones', type: Sequelize.JSONB, defaultValue: [] },
        { name: 'settings', type: Sequelize.JSONB, defaultValue: {} },
      ];
      
      for (const column of groupTodoColumns) {
        try {
          await queryInterface.addColumn('group_todos', column.name, {
            type: column.type,
            defaultValue: column.defaultValue,
            allowNull: column.allowNull,
          }, { transaction });
          console.log(`✅ Added column ${column.name} to group_todos`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`ℹ️ Column ${column.name} already exists in group_todos`);
          } else {
            throw error;
          }
        }
      }
      
      // 6. Create indexes for better performance
      console.log('📊 Creating indexes...');
      
      const indexes = [
        { table: 'group_todo_assignments', columns: ['todo_id', 'user_id'] },
        { table: 'group_todo_assignments', columns: ['status'] },
        { table: 'group_todo_chat', columns: ['todo_id', 'created_at'] },
        { table: 'group_todo_files', columns: ['todo_id'] },
        { table: 'group_todo_notifications', columns: ['user_id', 'is_read'] },
        { table: 'group_todo_notifications', columns: ['todo_id'] },
        { table: 'group_todos', columns: ['group_id', 'status'] },
        { table: 'group_todos', columns: ['created_by'] },
        { table: 'group_todos', columns: ['kanban_column'] },
        { table: 'group_todos', columns: ['deadline'] },
      ];
      
      for (const index of indexes) {
        try {
          const indexName = `${index.table}_${index.columns.join('_')}_idx`;
          await queryInterface.addIndex(index.table, index.columns, {
            name: indexName,
            transaction,
          });
          console.log(`✅ Created index ${indexName}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`ℹ️ Index for ${index.table} already exists`);
          } else {
            console.warn(`⚠️ Could not create index for ${index.table}:`, error.message);
          }
        }
      }
      
      await transaction.commit();
      console.log('🎉 Todo assignment system completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔄 Rolling back todo assignment system...');
      
      // Drop tables in reverse order
      await queryInterface.dropTable('group_todo_notifications', { transaction });
      await queryInterface.dropTable('group_todo_files', { transaction });
      await queryInterface.dropTable('group_todo_chat', { transaction });
      await queryInterface.dropTable('group_todo_assignments', { transaction });
      
      // Remove columns from group_todos
      const columnsToRemove = [
        'kanban_column',
        'workflow_stage',
        'sprint_id',
        'story_points',
        'risk_level',
        'acceptance_criteria',
        'dependencies',
        'milestones',
        'settings',
      ];
      
      for (const column of columnsToRemove) {
        try {
          await queryInterface.removeColumn('group_todos', column, { transaction });
          console.log(`✅ Removed column ${column} from group_todos`);
        } catch (error) {
          console.log(`ℹ️ Column ${column} doesn't exist in group_todos`);
        }
      }
      
      await transaction.commit();
      console.log('✅ Rollback completed');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
}; 