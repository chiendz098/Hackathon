const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add missing fields to todos table
    await queryInterface.addColumn('todos', 'milestones', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of milestone objects with title, description, targetDate, progress'
    });

    await queryInterface.addColumn('todos', 'time_entries', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of time tracking entries'
    });

    await queryInterface.addColumn('todos', 'collaboration_settings', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        allowComments: true,
        allowFileAttachments: true,
        requireApproval: false,
        autoNotifications: true
      },
      comment: 'Collaboration and notification settings'
    });

    await queryInterface.addColumn('todos', 'performance_metrics', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        velocity: 0,
        quality: 0,
        efficiency: 0,
        collaboration: 0
      },
      comment: 'Performance tracking metrics'
    });

    // 2. Create milestones table
    await queryInterface.createTable('milestones', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      todo_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'todos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      target_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'overdue'),
        defaultValue: 'pending',
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 3. Create time_entries table
    await queryInterface.createTable('time_entries', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      todo_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'todos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      duration: {
        type: DataTypes.INTEGER, // in seconds
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 4. Create group_messages table for collaboration
    await queryInterface.createTable('group_messages', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('text', 'file', 'image', 'system'),
        defaultValue: 'text',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 5. Create group_files table
    await queryInterface.createTable('group_files', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      original_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_size: {
        type: DataTypes.INTEGER, // in bytes
        allowNull: false,
      },
      mime_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 6. Create group_events table
    await queryInterface.createTable('group_events', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('meeting', 'deadline', 'milestone', 'other'),
        defaultValue: 'meeting',
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      attendees: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Array of user IDs who should attend'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 7. Create group_notifications table
    await queryInterface.createTable('group_notifications', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
        defaultValue: 'info',
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 8. Create member_performance table
    await queryInterface.createTable('member_performance', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      completion_rate: {
        type: DataTypes.DECIMAL(5, 2), // 0.00 to 100.00
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      avg_quality: {
        type: DataTypes.DECIMAL(3, 2), // 0.00 to 5.00
        defaultValue: 0,
        validate: {
          min: 0,
          max: 5,
        },
      },
      avg_efficiency: {
        type: DataTypes.DECIMAL(5, 2), // 0.00 to 100.00
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      collaboration_score: {
        type: DataTypes.DECIMAL(5, 2), // 0.00 to 100.00
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      total_tasks: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      completed_tasks: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_time: {
        type: DataTypes.INTEGER, // in minutes
        defaultValue: 0,
      },
      last_updated: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 9. Create indexes for better performance
    await queryInterface.addIndex('milestones', ['todo_id']);
    await queryInterface.addIndex('milestones', ['status']);
    await queryInterface.addIndex('time_entries', ['todo_id']);
    await queryInterface.addIndex('time_entries', ['user_id']);
    await queryInterface.addIndex('time_entries', ['start_time']);
    await queryInterface.addIndex('group_messages', ['group_id']);
    await queryInterface.addIndex('group_messages', ['user_id']);
    await queryInterface.addIndex('group_messages', ['created_at']);
    await queryInterface.addIndex('group_files', ['group_id']);
    await queryInterface.addIndex('group_files', ['user_id']);
    await queryInterface.addIndex('group_events', ['group_id']);
    await queryInterface.addIndex('group_events', ['start_date']);
    await queryInterface.addIndex('group_notifications', ['group_id']);
    await queryInterface.addIndex('group_notifications', ['user_id']);
    await queryInterface.addIndex('group_notifications', ['is_read']);
    await queryInterface.addIndex('member_performance', ['group_id']);
    await queryInterface.addIndex('member_performance', ['user_id']);

    // 10. Add unique constraints
    await queryInterface.addConstraint('member_performance', {
      fields: ['group_id', 'user_id'],
      type: 'unique',
      name: 'unique_group_member_performance'
    });

    console.log('✅ Enhanced Todo Group System migration completed successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove tables in reverse order
    await queryInterface.dropTable('member_performance');
    await queryInterface.dropTable('group_notifications');
    await queryInterface.dropTable('group_events');
    await queryInterface.dropTable('group_files');
    await queryInterface.dropTable('group_messages');
    await queryInterface.dropTable('time_entries');
    await queryInterface.dropTable('milestones');

    // Remove columns from todos table
    await queryInterface.removeColumn('todos', 'milestones');
    await queryInterface.removeColumn('todos', 'time_entries');
    await queryInterface.removeColumn('todos', 'collaboration_settings');
    await queryInterface.removeColumn('todos', 'performance_metrics');

    console.log('✅ Enhanced Todo Group System migration rolled back successfully!');
  }
}; 