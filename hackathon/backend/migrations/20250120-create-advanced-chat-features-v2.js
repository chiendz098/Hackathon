'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create message_reactions table
    await queryInterface.createTable('message_reactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      messageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      reaction: {
        type: Sequelize.STRING,
        allowNull: false
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
    });

    // Create message_edit_history table
    await queryInterface.createTable('message_edit_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      messageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      editedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      previousContent: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      editedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create pinned_messages table
    await queryInterface.createTable('pinned_messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      messageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      roomId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      pinnedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      pinnedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create scheduled_messages table
    await queryInterface.createTable('scheduled_messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      messageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      scheduledBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      scheduledAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create chat_moderators table
    await queryInterface.createTable('chat_moderators', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      roomId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      role: {
        type: Sequelize.ENUM('admin', 'moderator'),
        allowNull: false,
        defaultValue: 'moderator'
      },
      permissions: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      assignedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assignedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create chat_bans table
    await queryInterface.createTable('chat_bans', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      roomId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      bannedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      bannedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isPermanent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    });

    // Create chat_mutes table
    await queryInterface.createTable('chat_mutes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      roomId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      mutedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      mutedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create push_notifications table
    await queryInterface.createTable('push_notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      type: {
        type: Sequelize.ENUM('message', 'mention', 'reaction', 'system'),
        allowNull: false,
        defaultValue: 'message'
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('message_reactions', ['messageId']);
    await queryInterface.addIndex('message_reactions', ['userId']);
    await queryInterface.addIndex('message_reactions', ['reaction']);
    await queryInterface.addIndex('message_reactions', ['messageId', 'userId'], { unique: true });

    await queryInterface.addIndex('message_edit_history', ['messageId']);
    await queryInterface.addIndex('message_edit_history', ['editedBy']);
    await queryInterface.addIndex('message_edit_history', ['editedAt']);

    await queryInterface.addIndex('pinned_messages', ['roomId']);
    await queryInterface.addIndex('pinned_messages', ['messageId'], { unique: true });
    await queryInterface.addIndex('pinned_messages', ['pinnedAt']);

    await queryInterface.addIndex('scheduled_messages', ['scheduledBy']);
    await queryInterface.addIndex('scheduled_messages', ['scheduledAt']);
    await queryInterface.addIndex('scheduled_messages', ['status']);

    await queryInterface.addIndex('chat_moderators', ['roomId']);
    await queryInterface.addIndex('chat_moderators', ['userId']);
    await queryInterface.addIndex('chat_moderators', ['role']);

    await queryInterface.addIndex('chat_bans', ['roomId']);
    await queryInterface.addIndex('chat_bans', ['userId']);
    await queryInterface.addIndex('chat_bans', ['expiresAt']);

    await queryInterface.addIndex('chat_mutes', ['roomId']);
    await queryInterface.addIndex('chat_mutes', ['userId']);
    await queryInterface.addIndex('chat_mutes', ['expiresAt']);

    await queryInterface.addIndex('push_notifications', ['userId']);
    await queryInterface.addIndex('push_notifications', ['status']);
    await queryInterface.addIndex('push_notifications', ['type']);
    await queryInterface.addIndex('push_notifications', ['createdAt']);

    // Add new columns to existing chat_messages table if they don't exist
    try {
      await queryInterface.addColumn('chat_messages', 'isEdited', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } catch (error) {
      console.log('Column isEdited already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_messages', 'editCount', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    } catch (error) {
      console.log('Column editCount already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_messages', 'isForwarded', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } catch (error) {
      console.log('Column isForwarded already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_messages', 'forwardFrom', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null
      });
    } catch (error) {
      console.log('Column forwardFrom already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_messages', 'linkPreview', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null
      });
    } catch (error) {
      console.log('Column linkPreview already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_messages', 'searchIndex', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    } catch (error) {
      console.log('Column searchIndex already exists, skipping...');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('push_notifications');
    await queryInterface.dropTable('chat_mutes');
    await queryInterface.dropTable('chat_bans');
    await queryInterface.dropTable('chat_moderators');
    await queryInterface.dropTable('scheduled_messages');
    await queryInterface.dropTable('pinned_messages');
    await queryInterface.dropTable('message_edit_history');
    await queryInterface.dropTable('message_reactions');

    // Remove columns from chat_messages
    try {
      await queryInterface.removeColumn('chat_messages', 'searchIndex');
    } catch (error) {
      console.log('Column searchIndex does not exist, skipping...');
    }

    try {
      await queryInterface.removeColumn('chat_messages', 'linkPreview');
    } catch (error) {
      console.log('Column linkPreview does not exist, skipping...');
    }

    try {
      await queryInterface.removeColumn('chat_messages', 'forwardFrom');
    } catch (error) {
      console.log('Column forwardFrom does not exist, skipping...');
    }

    try {
      await queryInterface.removeColumn('chat_messages', 'isForwarded');
    } catch (error) {
      console.log('Column isForwarded does not exist, skipping...');
    }

    try {
      await queryInterface.removeColumn('chat_messages', 'editCount');
    } catch (error) {
      console.log('Column editCount does not exist, skipping...');
    }

    try {
      await queryInterface.removeColumn('chat_messages', 'isEdited');
    } catch (error) {
      console.log('Column isEdited does not exist, skipping...');
    }
  }
}; 