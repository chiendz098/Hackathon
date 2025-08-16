const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create message_reactions table
    await queryInterface.createTable('message_reactions', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      messageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      emoji: {
        type: DataTypes.STRING,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create message_reads table
    await queryInterface.createTable('message_reads', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      messageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create call_sessions table
    await queryInterface.createTable('call_sessions', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      roomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      initiatorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      callType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'audio'
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'initiating'
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      endedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      participants: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      recordingUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add new columns to chat_messages table
    try {
      await queryInterface.addColumn('chat_messages', 'threadId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    } catch (error) {
      console.log('Column threadId already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_messages', 'isPinned', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } catch (error) {
      console.log('Column isPinned already exists, skipping...');
    }

    await queryInterface.addColumn('chat_messages', 'isStarred', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('chat_messages', 'scheduledAt', {
      type: DataTypes.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'sentAt', {
      type: DataTypes.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'selfDestructAt', {
      type: DataTypes.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'mentions', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('chat_messages', 'reactions', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    });

    await queryInterface.addColumn('chat_messages', 'forwardFrom', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('chat_messages', 'linkPreview', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('chat_messages', 'encryptionKey', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'fileSize', {
      type: DataTypes.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'fileName', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'fileType', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'fileUrl', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'voiceDuration', {
      type: DataTypes.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'voiceTranscription', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'latitude', {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'longitude', {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'locationName', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'systemAction', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('chat_messages', 'systemData', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    });

    // Add new columns to users table
    await queryInterface.addColumn('users', 'status', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'online'
    });

    await queryInterface.addColumn('users', 'customStatus', {
      type: DataTypes.STRING,
      allowNull: true
    });

    // Add new columns to chat_participants table
    await queryInterface.addColumn('chat_participants', 'isTyping', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('chat_participants', 'lastTyping', {
      type: DataTypes.DATE,
      allowNull: true
    });

    // Create indexes for better performance
    await queryInterface.addIndex('message_reactions', ['messageId']);
    await queryInterface.addIndex('message_reactions', ['userId']);
    await queryInterface.addIndex('message_reactions', ['emoji']);
    await queryInterface.addIndex('message_reactions', ['messageId', 'userId', 'emoji'], {
      unique: true,
      name: 'message_reactions_unique'
    });

    await queryInterface.addIndex('message_reads', ['messageId']);
    await queryInterface.addIndex('message_reads', ['userId']);
    await queryInterface.addIndex('message_reads', ['readAt']);
    await queryInterface.addIndex('message_reads', ['messageId', 'userId'], {
      unique: true,
      name: 'message_reads_unique'
    });

    await queryInterface.addIndex('call_sessions', ['roomId']);
    await queryInterface.addIndex('call_sessions', ['initiatorId']);
    await queryInterface.addIndex('call_sessions', ['status']);
    await queryInterface.addIndex('call_sessions', ['startedAt']);
    await queryInterface.addIndex('call_sessions', ['callType']);

    await queryInterface.addIndex('chat_messages', ['threadId']);
    await queryInterface.addIndex('chat_messages', ['isPinned']);
    await queryInterface.addIndex('chat_messages', ['scheduledAt']);
    await queryInterface.addIndex('chat_messages', ['sentAt']);
    await queryInterface.addIndex('chat_messages', ['selfDestructAt']);
    await queryInterface.addIndex('chat_messages', ['isDeleted']);

    await queryInterface.addIndex('users', ['status']);
    await queryInterface.addIndex('chat_participants', ['isTyping']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables
    await queryInterface.dropTable('message_reactions');
    await queryInterface.dropTable('message_reads');
    await queryInterface.dropTable('call_sessions');

    // Remove columns from chat_messages
    await queryInterface.removeColumn('chat_messages', 'threadId');
    await queryInterface.removeColumn('chat_messages', 'isPinned');
    await queryInterface.removeColumn('chat_messages', 'isStarred');
    await queryInterface.removeColumn('chat_messages', 'scheduledAt');
    await queryInterface.removeColumn('chat_messages', 'sentAt');
    await queryInterface.removeColumn('chat_messages', 'selfDestructAt');
    await queryInterface.removeColumn('chat_messages', 'mentions');
    await queryInterface.removeColumn('chat_messages', 'reactions');
    await queryInterface.removeColumn('chat_messages', 'forwardFrom');
    await queryInterface.removeColumn('chat_messages', 'linkPreview');
    await queryInterface.removeColumn('chat_messages', 'encryptionKey');
    await queryInterface.removeColumn('chat_messages', 'fileSize');
    await queryInterface.removeColumn('chat_messages', 'fileName');
    await queryInterface.removeColumn('chat_messages', 'fileType');
    await queryInterface.removeColumn('chat_messages', 'fileUrl');
    await queryInterface.removeColumn('chat_messages', 'voiceDuration');
    await queryInterface.removeColumn('chat_messages', 'voiceTranscription');
    await queryInterface.removeColumn('chat_messages', 'latitude');
    await queryInterface.removeColumn('chat_messages', 'longitude');
    await queryInterface.removeColumn('chat_messages', 'locationName');
    await queryInterface.removeColumn('chat_messages', 'systemAction');
    await queryInterface.removeColumn('chat_messages', 'systemData');

    // Remove columns from users
    await queryInterface.removeColumn('users', 'status');
    await queryInterface.removeColumn('users', 'customStatus');

    // Remove columns from chat_participants
    await queryInterface.removeColumn('chat_participants', 'isTyping');
    await queryInterface.removeColumn('chat_participants', 'lastTyping');
  }
}; 