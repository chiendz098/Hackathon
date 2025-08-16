'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔧 Creating/updating group_todos table with complete structure...');
      
      // Check if group_todos table exists
      const [tables] = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'group_todos'",
        { transaction }
      );
      
      if (tables.length === 0) {
        // Create the table if it doesn't exist
        await queryInterface.createTable('group_todos', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          title: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
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
          created_by: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
          },
          status: {
            type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'cancelled', 'overdue'),
            defaultValue: 'pending',
          },
          priority: {
            type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
            defaultValue: 'medium',
          },
          category: {
            type: Sequelize.STRING,
            defaultValue: 'general',
          },
          deadline: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          estimated_time: {
            type: Sequelize.INTEGER, // in minutes
            allowNull: true,
          },
          subtasks: {
            type: Sequelize.JSONB,
            defaultValue: [],
          },
          tags: {
            type: Sequelize.JSONB,
            defaultValue: [],
          },
          is_public: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
          },
          allow_comments: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
          },
          allow_attachments: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
          },
          workflow_stage: {
            type: Sequelize.STRING,
            defaultValue: 'planning',
          },
          kanban_column: {
            type: Sequelize.STRING,
            defaultValue: 'backlog',
          },
          sprint_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          story_points: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          risk_level: {
            type: Sequelize.STRING,
            defaultValue: 'low',
          },
          acceptance_criteria: {
            type: Sequelize.JSONB,
            defaultValue: [],
          },
          dependencies: {
            type: Sequelize.JSONB,
            defaultValue: [],
          },
          milestones: {
            type: Sequelize.JSONB,
            defaultValue: [],
          },
          settings: {
            type: Sequelize.JSONB,
            defaultValue: {},
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        }, { transaction });
        
        console.log('✅ Created group_todos table');
      } else {
        // Table exists, check and add missing columns
        console.log('📋 group_todos table exists, checking for missing columns...');
        
        const [columns] = await queryInterface.sequelize.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name = 'group_todos'",
          { transaction }
        );
        
        const existingColumns = new Set(columns.map(c => c.column_name));
        
        // Add missing columns
        const missingColumns = [
          { name: 'workflow_stage', type: Sequelize.STRING, defaultValue: 'planning' },
          { name: 'kanban_column', type: Sequelize.STRING, defaultValue: 'backlog' },
          { name: 'sprint_id', type: Sequelize.INTEGER, allowNull: true },
          { name: 'story_points', type: Sequelize.INTEGER, allowNull: true },
          { name: 'risk_level', type: Sequelize.STRING, defaultValue: 'low' },
          { name: 'acceptance_criteria', type: Sequelize.JSONB, defaultValue: [] },
          { name: 'dependencies', type: Sequelize.JSONB, defaultValue: [] },
          { name: 'milestones', type: Sequelize.JSONB, defaultValue: [] },
          { name: 'settings', type: Sequelize.JSONB, defaultValue: {} }
        ];
        
        for (const column of missingColumns) {
          if (!existingColumns.has(column.name)) {
            await queryInterface.addColumn('group_todos', column.name, {
              type: column.type,
              allowNull: column.allowNull !== undefined ? column.allowNull : false,
              defaultValue: column.defaultValue
            }, { transaction });
            console.log(`✅ Added column: ${column.name}`);
          }
        }
      }
      
      // Create indexes
      await queryInterface.addIndex('group_todos', ['group_id'], { transaction }).catch(() => {});
      await queryInterface.addIndex('group_todos', ['created_by'], { transaction }).catch(() => {});
      await queryInterface.addIndex('group_todos', ['status'], { transaction }).catch(() => {});
      await queryInterface.addIndex('group_todos', ['priority'], { transaction }).catch(() => {});
      await queryInterface.addIndex('group_todos', ['deadline'], { transaction }).catch(() => {});
      await queryInterface.addIndex('group_todos', ['workflow_stage'], { transaction }).catch(() => {});
      await queryInterface.addIndex('group_todos', ['kanban_column'], { transaction }).catch(() => {});
      
      await transaction.commit();
      console.log('🎉 Successfully created/updated group_todos table');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error creating/updating group_todos table:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('🔄 Dropping group_todos table...');
      await queryInterface.dropTable('group_todos', { transaction });
      await transaction.commit();
      console.log('✅ Dropped group_todos table');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error dropping group_todos table:', error);
      throw error;
    }
  }
}; 