'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔍 Checking if focus_sessions table exists...');
      
      // Check if focus_sessions table exists
      const [tables] = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'focus_sessions'"
      );
      
      if (tables.length === 0) {
        console.log('📝 Creating focus_sessions table...');
        
        // Create focus_sessions table if it doesn't exist
        await queryInterface.createTable('focus_sessions', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
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
          todoId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'todos',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          sessionType: {
            type: Sequelize.ENUM('pomodoro', 'deep_focus', 'quick_study', 'review', 'break'),
            defaultValue: 'pomodoro'
          },
          plannedDuration: {
            type: Sequelize.INTEGER, // in minutes
            allowNull: false
          },
          actualDuration: {
            type: Sequelize.INTEGER, // in minutes
            defaultValue: 0
          },
          duration: {
            type: Sequelize.INTEGER, // in minutes - for compatibility
            defaultValue: 0
          },
          startTime: {
            type: Sequelize.DATE,
            allowNull: false
          },
          endTime: {
            type: Sequelize.DATE,
            allowNull: true
          },
          status: {
            type: Sequelize.ENUM('planned', 'active', 'paused', 'completed', 'cancelled'),
            defaultValue: 'planned'
          },
          subject: {
            type: Sequelize.STRING,
            allowNull: true
          },
          tags: {
            type: Sequelize.JSONB,
            defaultValue: []
          },
          focusScore: {
            type: Sequelize.FLOAT,
            defaultValue: 0.0,
            validate: {
              min: 0.0,
              max: 10.0
            }
          },
          distractions: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          pauseCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0
          },
          notes: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          mood: {
            type: Sequelize.ENUM('energetic', 'focused', 'neutral', 'tired', 'distracted'),
            defaultValue: 'neutral'
          },
          environment: {
            type: Sequelize.JSONB,
            defaultValue: {}
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          }
        }, { transaction });

        // Add indexes for better performance
        await queryInterface.addIndex('focus_sessions', ['userId'], { transaction });
        await queryInterface.addIndex('focus_sessions', ['todoId'], { transaction });
        await queryInterface.addIndex('focus_sessions', ['status'], { transaction });
        await queryInterface.addIndex('focus_sessions', ['startTime'], { transaction });
        await queryInterface.addIndex('focus_sessions', ['sessionType'], { transaction });
        
        console.log('✅ Created focus_sessions table successfully');
      } else {
        console.log('ℹ️ focus_sessions table already exists');
        
        // Check if duration column exists, if not add it
        const [columns] = await queryInterface.sequelize.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name = 'focus_sessions' AND column_name = 'duration'"
        );
        
        if (columns.length === 0) {
          console.log('📝 Adding duration column to focus_sessions...');
          await queryInterface.addColumn('focus_sessions', 'duration', {
            type: Sequelize.INTEGER,
            defaultValue: 0
          }, { transaction });
          console.log('✅ Added duration column to focus_sessions');
        } else {
          console.log('ℹ️ duration column already exists');
        }
      }

      // Also ensure users table has the required columns
      console.log('🔍 Checking users table structure...');
      
      const [userColumns] = await queryInterface.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
      );
      
      const userColumnNames = userColumns.map(col => col.column_name);
      
      // Add total_study_time if it doesn't exist
      if (!userColumnNames.includes('total_study_time')) {
        console.log('📝 Adding total_study_time column to users...');
        await queryInterface.addColumn('users', 'total_study_time', {
          type: Sequelize.INTEGER,
          defaultValue: 0
        }, { transaction });
        console.log('✅ Added total_study_time column to users');
      }
      
      // Add total_focus_sessions if it doesn't exist
      if (!userColumnNames.includes('total_focus_sessions')) {
        console.log('📝 Adding total_focus_sessions column to users...');
        await queryInterface.addColumn('users', 'total_focus_sessions', {
          type: Sequelize.INTEGER,
          defaultValue: 0
        }, { transaction });
        console.log('✅ Added total_focus_sessions column to users');
      }
      
      // Add streak if it doesn't exist
      if (!userColumnNames.includes('streak')) {
        console.log('📝 Adding streak column to users...');
        await queryInterface.addColumn('users', 'streak', {
          type: Sequelize.INTEGER,
          defaultValue: 0
        }, { transaction });
        console.log('✅ Added streak column to users');
      }

      await transaction.commit();
      console.log('🎉 Migration completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back migration...');
      
      // Remove the columns we added to users table
      const [userColumns] = await queryInterface.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
      );
      
      const userColumnNames = userColumns.map(col => col.column_name);
      
      if (userColumnNames.includes('total_study_time')) {
        await queryInterface.removeColumn('users', 'total_study_time', { transaction });
        console.log('✅ Removed total_study_time column from users');
      }
      
      if (userColumnNames.includes('total_focus_sessions')) {
        await queryInterface.removeColumn('users', 'total_focus_sessions', { transaction });
        console.log('✅ Removed total_focus_sessions column from users');
      }
      
      if (userColumnNames.includes('streak')) {
        await queryInterface.removeColumn('users', 'streak', { transaction });
        console.log('✅ Removed streak column from users');
      }
      
      // Remove the duration column if it was added
      const [focusColumns] = await queryInterface.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'focus_sessions' AND column_name = 'duration'"
      );
      
      if (focusColumns.length > 0) {
        await queryInterface.removeColumn('focus_sessions', 'duration', { transaction });
        console.log('✅ Removed duration column from focus_sessions');
      }
      
      await transaction.commit();
      console.log('✅ Rollback completed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
}; 