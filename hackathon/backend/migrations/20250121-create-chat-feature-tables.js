const { Pool } = require('pg');
const config = require('../config/config.json');

const pool = new Pool({
  user: config.development.username,
  password: config.development.password,
  database: config.development.database,
  host: config.development.host,
  port: config.development.port,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createChatFeatureTables() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up chat feature tables...');
    
    // Check if tables already exist and have the right structure
    const reactionsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'message_reactions'
      );
    `);
    
    const pinnedExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pinned_messages'
      );
    `);
    
    if (!reactionsExists.rows[0].exists) {
      // Create message_reactions table
      await client.query(`
        CREATE TABLE message_reactions (
          id SERIAL PRIMARY KEY,
          message_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          reaction VARCHAR(10) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(message_id, user_id, reaction)
        )
      `);
      console.log('✅ Created message_reactions table');
    } else {
      console.log('ℹ️ message_reactions table already exists');
    }
    
    if (!pinnedExists.rows[0].exists) {
      // Create pinned_messages table
      await client.query(`
        CREATE TABLE pinned_messages (
          id SERIAL PRIMARY KEY,
          message_id INTEGER NOT NULL,
          room_id INTEGER NOT NULL,
          pinned_by INTEGER NOT NULL,
          pinned_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Created pinned_messages table');
    } else {
      console.log('ℹ️ pinned_messages table already exists');
    }
    
    // Check and add missing columns to group_todo_chat table
    const columns = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'group_todo_chat'
    `);
    
    const existingColumns = columns.rows.map(col => col.column_name);
    
    if (!existingColumns.includes('is_pinned')) {
      await client.query(`ALTER TABLE group_todo_chat ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE`);
      console.log('✅ Added is_pinned column');
    }
    
    if (!existingColumns.includes('is_forwarded')) {
      await client.query(`ALTER TABLE group_todo_chat ADD COLUMN is_forwarded BOOLEAN DEFAULT FALSE`);
      console.log('✅ Added is_forwarded column');
    }
    
    if (!existingColumns.includes('forward_from')) {
      await client.query(`ALTER TABLE group_todo_chat ADD COLUMN forward_from JSONB`);
      console.log('✅ Added forward_from column');
    }
    
    if (!existingColumns.includes('reactions')) {
      await client.query(`ALTER TABLE group_todo_chat ADD COLUMN reactions JSONB DEFAULT '{}'`);
      console.log('✅ Added reactions column');
    }
    
    if (!existingColumns.includes('parent_message_id')) {
      await client.query(`ALTER TABLE group_todo_chat ADD COLUMN parent_message_id INTEGER`);
      console.log('✅ Added parent_message_id column');
    }
    
    if (!existingColumns.includes('reply_count')) {
      await client.query(`ALTER TABLE group_todo_chat ADD COLUMN reply_count INTEGER DEFAULT 0`);
      console.log('✅ Added reply_count column');
    }
    
    // Create indexes for better performance (only if they don't exist)
    try {
      await client.query(`CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_pinned_messages_message_id ON pinned_messages(message_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_pinned_messages_room_id ON pinned_messages(room_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_group_todo_chat_parent_id ON group_todo_chat(parent_message_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_group_todo_chat_is_pinned ON group_todo_chat(is_pinned)`);
      console.log('✅ Created/verified indexes for chat features');
    } catch (indexError) {
      console.log('ℹ️ Some indexes already exist or could not be created');
    }
    
    // Add foreign key constraints (only if they don't exist)
    try {
      await client.query(`
        ALTER TABLE message_reactions 
        ADD CONSTRAINT IF NOT EXISTS fk_message_reactions_message_id 
        FOREIGN KEY (message_id) REFERENCES group_todo_chat(id) ON DELETE CASCADE
      `);
      
      await client.query(`
        ALTER TABLE message_reactions 
        ADD CONSTRAINT IF NOT EXISTS fk_message_reactions_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
      
      await client.query(`
        ALTER TABLE pinned_messages 
        ADD CONSTRAINT IF NOT EXISTS fk_pinned_messages_message_id 
        FOREIGN KEY (message_id) REFERENCES group_todo_chat(id) ON DELETE CASCADE
      `);
      
      await client.query(`
        ALTER TABLE pinned_messages 
        ADD CONSTRAINT IF NOT EXISTS fk_pinned_messages_pinned_by 
        FOREIGN KEY (pinned_by) REFERENCES users(id) ON DELETE CASCADE
      `);
      
      await client.query(`
        ALTER TABLE group_todo_chat 
        ADD CONSTRAINT IF NOT EXISTS fk_group_todo_chat_parent_id 
        FOREIGN KEY (parent_message_id) REFERENCES group_todo_chat(id) ON DELETE SET NULL
      `);
      
      console.log('✅ Added/verified foreign key constraints');
    } catch (constraintError) {
      console.log('ℹ️ Some constraints already exist or could not be added');
    }
    
    console.log('🎉 Chat feature tables setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up chat feature tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function rollback() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Rolling back chat feature tables...');
    
    // Drop foreign key constraints first
    await client.query(`
      ALTER TABLE message_reactions DROP CONSTRAINT IF EXISTS fk_message_reactions_message_id;
      ALTER TABLE message_reactions DROP CONSTRAINT IF EXISTS fk_message_reactions_user_id;
      ALTER TABLE pinned_messages DROP CONSTRAINT IF EXISTS fk_pinned_messages_message_id;
      ALTER TABLE pinned_messages DROP CONSTRAINT IF EXISTS fk_pinned_messages_pinned_by;
      ALTER TABLE group_todo_chat DROP CONSTRAINT IF EXISTS fk_group_todo_chat_parent_id;
    `);
    
    // Drop indexes
    await client.query(`
      DROP INDEX IF EXISTS idx_message_reactions_message_id;
      DROP INDEX IF EXISTS idx_message_reactions_user_id;
      DROP INDEX IF EXISTS idx_pinned_messages_message_id;
      DROP INDEX IF EXISTS idx_pinned_messages_room_id;
      DROP INDEX IF EXISTS idx_group_todo_chat_parent_id;
      DROP INDEX IF EXISTS idx_group_todo_chat_is_pinned;
    `);
    
    // Drop tables
    await client.query(`
      DROP TABLE IF EXISTS message_reactions CASCADE;
      DROP TABLE IF EXISTS pinned_messages CASCADE;
    `);
    
    // Remove added columns from group_todo_chat
    await client.query(`
      ALTER TABLE group_todo_chat 
      DROP COLUMN IF EXISTS is_pinned,
      DROP COLUMN IF EXISTS is_forwarded,
      DROP COLUMN IF EXISTS forward_from,
      DROP COLUMN IF EXISTS reactions,
      DROP COLUMN IF EXISTS parent_message_id,
      DROP COLUMN IF EXISTS reply_count
    `);
    
    console.log('✅ Chat feature tables rolled back successfully!');
    
  } catch (error) {
    console.error('❌ Error rolling back chat feature tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'rollback') {
    rollback()
      .then(() => {
        console.log('Rollback completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Rollback failed:', error);
        process.exit(1);
      });
  } else {
    createChatFeatureTables()
      .then(() => {
        console.log('Migration completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  createChatFeatureTables,
  rollback
}; 