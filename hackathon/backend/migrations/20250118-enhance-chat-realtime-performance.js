const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create chat_presence table for realtime presence tracking
    await queryInterface.createTable('chat_presence', {
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

    // Create chat_notifications table for push notifications
    await queryInterface.createTable('chat_notifications', {
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

    // Create chat_analytics table for performance monitoring
    await queryInterface.createTable('chat_analytics', {
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

    // Create chat_webhooks table for external integrations
    await queryInterface.createTable('chat_webhooks', {
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

    // Create chat_bots table for chatbot integration
    await queryInterface.createTable('chat_bots', {
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

    // Create chat_bot_sessions table for bot conversations
    await queryInterface.createTable('chat_bot_sessions', {
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

    // Add performance optimization columns to existing tables
    await queryInterface.addColumn('chat_messages', 'searchVector', {
      type: DataTypes.TSVECTOR,
      allowNull: true
    });

    await queryInterface.addColumn('chat_rooms', 'searchVector', {
      type: DataTypes.TSVECTOR,
      allowNull: true
    });

    // Create performance indexes
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

    // Create full-text search indexes
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS chat_messages_search_idx ON chat_messages USING GIN(searchVector);
      CREATE INDEX IF NOT EXISTS chat_rooms_search_idx ON chat_rooms USING GIN(searchVector);
    `);

    // Create materialized views for performance
    await queryInterface.sequelize.query(`
      CREATE MATERIALIZED VIEW chat_room_stats AS
      SELECT 
        cr.id as room_id,
        cr.name,
        cr.type,
        COUNT(cp.user_id) as participant_count,
        COUNT(cm.id) as message_count,
        MAX(cm.created_at) as last_message_at,
        AVG(EXTRACT(EPOCH FROM (cm.created_at - LAG(cm.created_at) OVER (PARTITION BY cr.id ORDER BY cm.created_at)))) as avg_message_interval
      FROM chat_rooms cr
      LEFT JOIN chat_participants cp ON cr.id = cp.room_id
      LEFT JOIN chat_messages cm ON cr.id = cm.room_id
      WHERE cr.is_active = true
      GROUP BY cr.id, cr.name, cr.type;
      
      CREATE UNIQUE INDEX chat_room_stats_idx ON chat_room_stats(room_id);
    `);

    // Create function to update search vectors
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_chat_search_vectors() RETURNS trigger AS $$
      BEGIN
        IF TG_TABLE_NAME = 'chat_messages' THEN
          NEW.searchVector := to_tsvector('english', COALESCE(NEW.content, ''));
        ELSIF TG_TABLE_NAME = 'chat_rooms' THEN
          NEW.searchVector := to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, ''));
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create triggers for search vector updates
    await queryInterface.sequelize.query(`
      CREATE TRIGGER chat_messages_search_update
        BEFORE INSERT OR UPDATE ON chat_messages
        FOR EACH ROW EXECUTE FUNCTION update_chat_search_vectors();
      
      CREATE TRIGGER chat_rooms_search_update
        BEFORE INSERT OR UPDATE ON chat_rooms
        FOR EACH ROW EXECUTE FUNCTION update_chat_search_vectors();
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop triggers and functions
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS chat_messages_search_update ON chat_messages;
      DROP TRIGGER IF EXISTS chat_rooms_search_update ON chat_rooms;
      DROP FUNCTION IF EXISTS update_chat_search_vectors();
    `);

    // Drop materialized views
    await queryInterface.sequelize.query(`
      DROP MATERIALIZED VIEW IF EXISTS chat_room_stats;
    `);

    // Drop tables
    await queryInterface.dropTable('chat_bot_sessions');
    await queryInterface.dropTable('chat_bots');
    await queryInterface.dropTable('chat_webhooks');
    await queryInterface.dropTable('chat_analytics');
    await queryInterface.dropTable('chat_notifications');
    await queryInterface.dropTable('chat_presence');

    // Remove columns
    await queryInterface.removeColumn('chat_messages', 'searchVector');
    await queryInterface.removeColumn('chat_rooms', 'searchVector');
  }
}; 