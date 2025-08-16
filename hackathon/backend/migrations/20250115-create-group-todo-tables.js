const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create group_invitations table
    await queryInterface.createTable('group_invitations', {
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
        onDelete: 'CASCADE',
      },
      invited_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      invited_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired', 'cancelled'),
        defaultValue: 'pending',
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      responded_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('member', 'moderator', 'admin'),
        defaultValue: 'member',
      },
      permissions: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      invite_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },
      max_uses: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      current_uses: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_bulk_invite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      todo_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'todos',
          key: 'id',
        },
        onDelete: 'CASCADE',
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

    // Create indexes for group_invitations
    await queryInterface.addIndex('group_invitations', ['group_id']);
    await queryInterface.addIndex('group_invitations', ['invited_user_id']);
    await queryInterface.addIndex('group_invitations', ['status']);
    await queryInterface.addIndex('group_invitations', ['invite_code']);
    await queryInterface.addIndex('group_invitations', ['expires_at']);
    await queryInterface.addIndex('group_invitations', ['todo_id']);

    // Create todo_assignments table
    await queryInterface.createTable('todo_assignments', {
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
        onDelete: 'CASCADE',
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      assigned_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined', 'in_progress', 'completed', 'overdue'),
        defaultValue: 'pending',
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: 'member',
      },
      assigned_tasks: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      estimated_time: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      actual_time: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      feedback: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      permissions: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      is_accepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      accepted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      declined_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      decline_reason: {
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

    // Create indexes for todo_assignments
    await queryInterface.addIndex('todo_assignments', ['todo_id']);
    await queryInterface.addIndex('todo_assignments', ['assigned_to']);
    await queryInterface.addIndex('todo_assignments', ['assigned_by']);
    await queryInterface.addIndex('todo_assignments', ['status']);
    await queryInterface.addIndex('todo_assignments', ['due_date']);
    await queryInterface.addUniqueConstraint('todo_assignments', ['todo_id', 'assigned_to']);

    // Add new columns to groups table
    await queryInterface.addColumn('groups', 'todo_settings', {
      type: DataTypes.JSONB,
      defaultValue: {
        allowMemberCreation: true,
        requireApproval: false,
        maxTodosPerMember: 10,
        allowPublicTodos: false,
        defaultPermissions: {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canAssign: false,
          canInvite: false
        }
      },
    });

    await queryInterface.addColumn('groups', 'max_members', {
      type: DataTypes.INTEGER,
      defaultValue: 50,
    });

    await queryInterface.addColumn('groups', 'is_private', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('groups', 'invite_code', {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('groups', 'category', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('groups', 'tags', {
      type: DataTypes.JSONB,
      defaultValue: [],
    });

    // Add new columns to todos table
    await queryInterface.addColumn('todos', 'group_settings', {
      type: DataTypes.JSONB,
      defaultValue: {
        allowMemberEditing: true,
        requireApproval: false,
        autoAssignTasks: false,
        progressTracking: true,
        deadlineReminders: true
      },
    });

    await queryInterface.addColumn('todos', 'group_chat_enabled', {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    });

    await queryInterface.addColumn('todos', 'group_file_sharing', {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables
    await queryInterface.dropTable('group_invitations');
    await queryInterface.dropTable('todo_assignments');

    // Remove columns from groups table
    await queryInterface.removeColumn('groups', 'todo_settings');
    await queryInterface.removeColumn('groups', 'max_members');
    await queryInterface.removeColumn('groups', 'is_private');
    await queryInterface.removeColumn('groups', 'invite_code');
    await queryInterface.removeColumn('groups', 'category');
    await queryInterface.removeColumn('groups', 'tags');

    // Remove columns from todos table
    await queryInterface.removeColumn('todos', 'group_settings');
    await queryInterface.removeColumn('todos', 'group_chat_enabled');
    await queryInterface.removeColumn('todos', 'group_file_sharing');
  }
}; 