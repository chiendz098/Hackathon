'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Guard: if chat_rooms already exists, skip full migration
    const [exists] = await queryInterface.sequelize.query(
      "SELECT to_regclass('public.chat_rooms') AS reg;"
    );
    if (exists[0] && exists[0].reg) {
      return; // tables likely exist; skip to avoid enum duplication
    }

    // Create chat_rooms table
    await queryInterface.createTable('chat_rooms', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('private', 'group'),
        allowNull: false,
        defaultValue: 'private'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      lastActivity: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Create chat_participants table
    await queryInterface.createTable('chat_participants', {
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
        type: Sequelize.ENUM('member', 'admin', 'moderator'),
        allowNull: false,
        defaultValue: 'member'
      },
      joinedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      lastSeen: {
        type: Sequelize.DATE,
        allowNull: true
      },
      unreadCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Create chat_messages table
    await queryInterface.createTable('chat_messages', {
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
      senderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('text', 'image', 'file', 'audio', 'video', 'location', 'sticker'),
        allowNull: false,
        defaultValue: 'text'
      },
      attachments: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      replyToId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      editedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
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
    });

    // Add indexes
    await queryInterface.addIndex('chat_rooms', ['type']).catch(() => {});
    await queryInterface.addIndex('chat_rooms', ['lastActivity']).catch(() => {});
    await queryInterface.addIndex('chat_rooms', ['createdBy']).catch(() => {});

    await queryInterface.addIndex('chat_participants', ['roomId', 'userId'], {
      unique: true
    }).catch(() => {});
    await queryInterface.addIndex('chat_participants', ['userId']).catch(() => {});
    await queryInterface.addIndex('chat_participants', ['roomId']).catch(() => {});

    await queryInterface.addIndex('chat_messages', ['roomId']).catch(() => {});
    await queryInterface.addIndex('chat_messages', ['senderId']).catch(() => {});
    await queryInterface.addIndex('chat_messages', ['createdAt']).catch(() => {});
    await queryInterface.addIndex('chat_messages', ['readAt']).catch(() => {});
    await queryInterface.addIndex('chat_messages', ['type']).catch(() => {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('chat_messages').catch(() => {});
    await queryInterface.dropTable('chat_participants').catch(() => {});
    await queryInterface.dropTable('chat_rooms').catch(() => {});
  }
}; 