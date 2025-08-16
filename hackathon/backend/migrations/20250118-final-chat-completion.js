const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🚀 Starting final chat completion migration...');
    
    // Helper function to safely add columns
    const safeAddColumn = async (table, column, definition) => {
      try {
        await queryInterface.addColumn(table, column, definition);
        console.log(`✅ Added column ${column} to ${table}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Column ${column} already exists in ${table}, skipping...`);
        } else {
          throw error;
        }
      }
    };

    // Helper function to safely create tables
    const safeCreateTable = async (tableName, definition) => {
      try {
        await queryInterface.createTable(tableName, definition);
        console.log(`✅ Created table ${tableName}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Table ${tableName} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    };

    // Add missing columns to chat_rooms
    console.log('📝 Adding advanced features to chat_rooms...');
    await safeAddColumn('chat_rooms', 'maxParticipants', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 100
    });

    await safeAddColumn('chat_rooms', 'isEncrypted', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await safeAddColumn('chat_rooms', 'encryptionKey', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await safeAddColumn('chat_rooms', 'allowInvites', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await safeAddColumn('chat_rooms', 'allowFileSharing', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await safeAddColumn('chat_rooms', 'allowVoiceMessages', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await safeAddColumn('chat_rooms', 'allowVideoCalls', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await safeAddColumn('chat_rooms', 'pinnedMessages', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    });

    await safeAddColumn('chat_rooms', 'rules', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    // Add missing columns to chat_participants
    console.log('👥 Adding realtime features to chat_participants...');
    await safeAddColumn('chat_participants', 'notificationSettings', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        messages: true,
        mentions: true,
        calls: true,
        fileUploads: true
      }
    });

    await safeAddColumn('chat_participants', 'muteUntil', {
      type: DataTypes.DATE,
      allowNull: true
    });

    await safeAddColumn('chat_participants', 'isBlocked', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await safeAddColumn('chat_participants', 'blockedBy', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add missing columns to chat_messages
    console.log('💬 Adding advanced messaging features...');
    await safeAddColumn('chat_messages', 'isEdited', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await safeAddColumn('chat_messages', 'editedAt', {
      type: DataTypes.DATE,
      allowNull: true
    });

    await safeAddColumn('chat_messages', 'editHistory', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    });

    await safeAddColumn('chat_messages', 'isForwarded', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await safeAddColumn('chat_messages', 'forwardedFrom', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    });

    await safeAddColumn('chat_messages', 'replyCount', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await safeAddColumn('chat_messages', 'viewCount', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await safeAddColumn('chat_messages', 'priority', {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'normal'
    });

    // Create chat_invitations table
    console.log('📨 Creating chat invitations system...');
    await safeCreateTable('chat_invitations', {
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
      invitedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      invitedUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired'),
        allowNull: false,
        defaultValue: 'pending'
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true
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

    // Create chat_typing_indicators table
    console.log('⌨️ Creating typing indicators system...');
    await safeCreateTable('chat_typing_indicators', {
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
      isTyping: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      lastActivity: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create chat_file_uploads table
    console.log('📁 Creating file management system...');
    await safeCreateTable('chat_file_uploads', {
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
      uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      filePath: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fileSize: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      mimeType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      thumbnailUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isProcessed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      processingStatus: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
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

    // Create chat_voice_messages table
    console.log('🎤 Creating voice messaging system...');
    await safeCreateTable('chat_voice_messages', {
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
      audioUrl: {
        type: DataTypes.STRING,
        allowNull: false
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      transcription: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      transcriptionStatus: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      waveform: {
        type: DataTypes.JSONB,
        allowNull: true
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

    // Create chat_presence table
    console.log('👤 Creating presence tracking system...');
    await safeCreateTable('chat_presence', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      status: {
        type: DataTypes.ENUM('online', 'away', 'busy', 'offline', 'invisible'),
        allowNull: false,
        defaultValue: 'offline'
      },
      customStatus: {
        type: DataTypes.STRING,
        allowNull: true
      },
      lastSeen: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      isTyping: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      currentRoom: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'chat_rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      deviceInfo: {
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

    // Create chat_notifications table
    console.log('🔔 Creating notification system...');
    await safeCreateTable('chat_notifications', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      roomId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'chat_rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      messageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'chat_messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: DataTypes.ENUM('message', 'mention', 'reaction', 'call', 'invite', 'file', 'voice'),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      priority: {
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'normal'
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
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

    // Create chat_analytics table
    console.log('📊 Creating analytics system...');
    await safeCreateTable('chat_analytics', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      roomId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'chat_rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      metric: {
        type: DataTypes.STRING,
        allowNull: false
      },
      value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create chat_webhooks table
    console.log('🔗 Creating webhook system...');
    await safeCreateTable('chat_webhooks', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      roomId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'chat_rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false
      },
      events: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      headers: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      secret: {
        type: DataTypes.STRING,
        allowNull: true
      },
      retryCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      lastDelivery: {
        type: DataTypes.DATE,
        allowNull: true
      },
      lastError: {
        type: DataTypes.TEXT,
        allowNull: true
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

    // Create chat_bots table
    console.log('🤖 Creating chatbot system...');
    await safeCreateTable('chat_bots', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      capabilities: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
      },
      settings: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      apiKey: {
        type: DataTypes.STRING,
        allowNull: true
      },
      webhookUrl: {
        type: DataTypes.STRING,
        allowNull: true
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

    // Create chat_bot_sessions table
    console.log('💬 Creating bot session system...');
    await safeCreateTable('chat_bot_sessions', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      botId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_bots',
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
      roomId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'chat_rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      context: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      lastActivity: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      endedAt: {
        type: DataTypes.DATE,
        allowNull: true
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

    // Create indexes for better performance
    console.log('⚡ Creating performance indexes...');
    
    // Chat rooms indexes
    await queryInterface.addIndex('chat_rooms', ['isEncrypted']);
    await queryInterface.addIndex('chat_rooms', ['maxParticipants']);
    await queryInterface.addIndex('chat_rooms', ['allowInvites']);
    await queryInterface.addIndex('chat_rooms', ['allowFileSharing']);

    // Chat participants indexes
    await queryInterface.addIndex('chat_participants', ['muteUntil']);
    await queryInterface.addIndex('chat_participants', ['isBlocked']);
    await queryInterface.addIndex('chat_participants', ['blockedBy']);

    // Chat messages indexes
    await queryInterface.addIndex('chat_messages', ['isEdited']);
    await queryInterface.addIndex('chat_messages', ['editedAt']);
    await queryInterface.addIndex('chat_messages', ['isForwarded']);
    await queryInterface.addIndex('chat_messages', ['replyCount']);
    await queryInterface.addIndex('chat_messages', ['viewCount']);
    await queryInterface.addIndex('chat_messages', ['priority']);

    // New tables indexes
    await queryInterface.addIndex('chat_invitations', ['roomId']);
    await queryInterface.addIndex('chat_invitations', ['invitedUser']);
    await queryInterface.addIndex('chat_invitations', ['status']);
    await queryInterface.addIndex('chat_invitations', ['expiresAt']);

    await queryInterface.addIndex('chat_typing_indicators', ['roomId']);
    await queryInterface.addIndex('chat_typing_indicators', ['userId']);
    await queryInterface.addIndex('chat_typing_indicators', ['isTyping']);

    await queryInterface.addIndex('chat_file_uploads', ['messageId']);
    await queryInterface.addIndex('chat_file_uploads', ['roomId']);
    await queryInterface.addIndex('chat_file_uploads', ['uploadedBy']);
    await queryInterface.addIndex('chat_file_uploads', ['mimeType']);
    await queryInterface.addIndex('chat_file_uploads', ['processingStatus']);

    await queryInterface.addIndex('chat_voice_messages', ['messageId']);
    await queryInterface.addIndex('chat_voice_messages', ['transcriptionStatus']);

    await queryInterface.addIndex('chat_presence', ['userId'], { unique: true });
    await queryInterface.addIndex('chat_presence', ['status']);
    await queryInterface.addIndex('chat_presence', ['currentRoom']);
    await queryInterface.addIndex('chat_presence', ['lastSeen']);

    await queryInterface.addIndex('chat_notifications', ['userId']);
    await queryInterface.addIndex('chat_notifications', ['roomId']);
    await queryInterface.addIndex('chat_notifications', ['type']);
    await queryInterface.addIndex('chat_notifications', ['isRead']);
    await queryInterface.addIndex('chat_notifications', ['priority']);
    await queryInterface.addIndex('chat_notifications', ['createdAt']);

    await queryInterface.addIndex('chat_analytics', ['roomId']);
    await queryInterface.addIndex('chat_analytics', ['userId']);
    await queryInterface.addIndex('chat_analytics', ['metric']);
    await queryInterface.addIndex('chat_analytics', ['timestamp']);

    await queryInterface.addIndex('chat_webhooks', ['roomId']);
    await queryInterface.addIndex('chat_webhooks', ['isActive']);
    await queryInterface.addIndex('chat_webhooks', ['events']);

    await queryInterface.addIndex('chat_bots', ['isActive']);
    await queryInterface.addIndex('chat_bots', ['capabilities']);

    await queryInterface.addIndex('chat_bot_sessions', ['botId']);
    await queryInterface.addIndex('chat_bot_sessions', ['userId']);
    await queryInterface.addIndex('chat_bot_sessions', ['sessionId']);
    await queryInterface.addIndex('chat_bot_sessions', ['isActive']);
    await queryInterface.addIndex('chat_bot_sessions', ['lastActivity']);

    // Add unique constraints
    console.log('🔒 Adding unique constraints...');
    await queryInterface.addConstraint('chat_invitations', {
      fields: ['roomId', 'invitedUser'],
      type: 'unique',
      name: 'chat_invitations_unique'
    });

    await queryInterface.addConstraint('chat_typing_indicators', {
      fields: ['roomId', 'userId'],
      type: 'unique',
      name: 'chat_typing_indicators_unique'
    });

    console.log('🎉 Final chat completion migration completed successfully!');
    console.log('\n📊 Database now includes FULL FEATURED chat system:');
    console.log('   ✅ Advanced chat rooms with encryption & permissions');
    console.log('   ✅ Real-time messaging with threads & reactions');
    console.log('   ✅ File uploads & voice messages');
    console.log('   ✅ Video/audio call sessions');
    console.log('   ✅ Typing indicators & presence tracking');
    console.log('   ✅ Push notifications system');
    console.log('   ✅ Chat analytics & performance monitoring');
    console.log('   ✅ Webhook integrations');
    console.log('   ✅ AI chatbot system');
    console.log('   ✅ Invitation & moderation system');
    console.log('   ✅ Performance optimizations & indexes');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Rolling back final chat completion migration...');
    
    // Drop tables
    await queryInterface.dropTable('chat_bot_sessions');
    await queryInterface.dropTable('chat_bots');
    await queryInterface.dropTable('chat_webhooks');
    await queryInterface.dropTable('chat_analytics');
    await queryInterface.dropTable('chat_notifications');
    await queryInterface.dropTable('chat_presence');
    await queryInterface.dropTable('chat_voice_messages');
    await queryInterface.dropTable('chat_file_uploads');
    await queryInterface.dropTable('chat_typing_indicators');
    await queryInterface.dropTable('chat_invitations');

    // Remove columns from chat_rooms
    await queryInterface.removeColumn('chat_rooms', 'maxParticipants');
    await queryInterface.removeColumn('chat_rooms', 'isEncrypted');
    await queryInterface.removeColumn('chat_rooms', 'encryptionKey');
    await queryInterface.removeColumn('chat_rooms', 'allowInvites');
    await queryInterface.removeColumn('chat_rooms', 'allowFileSharing');
    await queryInterface.removeColumn('chat_rooms', 'allowVoiceMessages');
    await queryInterface.removeColumn('chat_rooms', 'allowVideoCalls');
    await queryInterface.removeColumn('chat_rooms', 'pinnedMessages');
    await queryInterface.removeColumn('chat_rooms', 'rules');

    // Remove columns from chat_participants
    await queryInterface.removeColumn('chat_participants', 'notificationSettings');
    await queryInterface.removeColumn('chat_participants', 'muteUntil');
    await queryInterface.removeColumn('chat_participants', 'isBlocked');
    await queryInterface.removeColumn('chat_participants', 'blockedBy');

    // Remove columns from chat_messages
    await queryInterface.removeColumn('chat_messages', 'isEdited');
    await queryInterface.removeColumn('chat_messages', 'editedAt');
    await queryInterface.removeColumn('chat_messages', 'editHistory');
    await queryInterface.removeColumn('chat_messages', 'isForwarded');
    await queryInterface.removeColumn('chat_messages', 'forwardedFrom');
    await queryInterface.removeColumn('chat_messages', 'replyCount');
    await queryInterface.removeColumn('chat_messages', 'viewCount');
    await queryInterface.removeColumn('chat_messages', 'priority');

    console.log('✅ Rollback completed successfully');
  }
}; 