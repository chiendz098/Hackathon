const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add missing columns to chat_rooms for advanced features
    try {
      await queryInterface.addColumn('chat_rooms', 'maxParticipants', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 100
      });
    } catch (error) {
      console.log('Column maxParticipants already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_rooms', 'isEncrypted', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } catch (error) {
      console.log('Column isEncrypted already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_rooms', 'encryptionKey', {
        type: DataTypes.STRING,
        allowNull: true
      });
    } catch (error) {
      console.log('Column encryptionKey already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_rooms', 'allowInvites', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    } catch (error) {
      console.log('Column allowInvites already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_rooms', 'allowFileSharing', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    } catch (error) {
      console.log('Column allowFileSharing already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_rooms', 'allowVoiceMessages', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    } catch (error) {
      console.log('Column allowVoiceMessages already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_rooms', 'allowVideoCalls', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    } catch (error) {
      console.log('Column allowVideoCalls already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_rooms', 'pinnedMessages', {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
      });
    } catch (error) {
      console.log('Column pinnedMessages already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_rooms', 'rules', {
        type: DataTypes.TEXT,
        allowNull: true
      });
    } catch (error) {
      console.log('Column rules already exists, skipping...');
    }

    // Add missing columns to chat_participants for realtime features
    try {
      await queryInterface.addColumn('chat_participants', 'lastSeen', {
        type: DataTypes.DATE,
        allowNull: true
      });
    } catch (error) {
      console.log('Column lastSeen already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_participants', 'notificationSettings', {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {
          messages: true,
          mentions: true,
          calls: true,
          fileUploads: true
        }
      });
    } catch (error) {
      console.log('Column notificationSettings already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_participants', 'muteUntil', {
        type: DataTypes.DATE,
        allowNull: true
      });
    } catch (error) {
      console.log('Column muteUntil already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_participants', 'isBlocked', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } catch (error) {
      console.log('Column isBlocked already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_participants', 'blockedBy', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    } catch (error) {
      console.log('Column blockedBy already exists, skipping...');
    }

    // Add missing columns to chat_messages for advanced messaging
    try {
      await queryInterface.addColumn('chat_messages', 'isEdited', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } catch (error) {
      console.log('Column isEdited already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_messages', 'editedAt', {
        type: DataTypes.DATE,
        allowNull: true
      });
    } catch (error) {
      console.log('Column editedAt already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_messages', 'editHistory', {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
      });
    } catch (error) {
      console.log('Column editHistory already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_messages', 'isForwarded', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    } catch (error) {
      console.log('Column isForwarded already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_messages', 'forwardedFrom', {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      });
    } catch (error) {
      console.log('Column forwardedFrom already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_messages', 'replyCount', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    } catch (error) {
      console.log('Column replyCount already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_messages', 'viewCount', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    } catch (error) {
      console.log('Column viewCount already exists, skipping...');
    }

    try {
      await queryInterface.addColumn('chat_messages', 'priority', {
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'normal'
      });
    } catch (error) {
      console.log('Column priority already exists, skipping...');
    }

    // Create chat_invitations table for room invitations
    await queryInterface.createTable('chat_invitations', {
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

    // Create chat_typing_indicators table for realtime typing
    await queryInterface.createTable('chat_typing_indicators', {
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

    // Create chat_file_uploads table for file management
    await queryInterface.createTable('chat_file_uploads', {
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

    // Create chat_voice_messages table for voice messages
    await queryInterface.createTable('chat_voice_messages', {
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

    // Create indexes for better performance
    await queryInterface.addIndex('chat_rooms', ['isEncrypted']);
    await queryInterface.addIndex('chat_rooms', ['maxParticipants']);
    await queryInterface.addIndex('chat_rooms', ['allowInvites']);
    await queryInterface.addIndex('chat_rooms', ['allowFileSharing']);

    await queryInterface.addIndex('chat_participants', ['lastSeen']);
    await queryInterface.addIndex('chat_participants', ['muteUntil']);
    await queryInterface.addIndex('chat_participants', ['isBlocked']);
    await queryInterface.addIndex('chat_participants', ['blockedBy']);

    await queryInterface.addIndex('chat_messages', ['isEdited']);
    await queryInterface.addIndex('chat_messages', ['editedAt']);
    await queryInterface.addIndex('chat_messages', ['isForwarded']);
    await queryInterface.addIndex('chat_messages', ['replyCount']);
    await queryInterface.addIndex('chat_messages', ['viewCount']);
    await queryInterface.addIndex('chat_messages', ['priority']);

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

    // Add unique constraints
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
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables
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
    await queryInterface.removeColumn('chat_participants', 'lastSeen');
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
  }
}; 