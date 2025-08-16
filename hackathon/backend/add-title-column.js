const sequelize = require('./config/database');

async function addTitleColumn() {
  try {
    console.log('🔍 Adding title column to chatbot_conversations...');
    
    await sequelize.query(`
      ALTER TABLE chatbot_conversations 
      ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT 'Cuộc trò chuyện mới'
    `);
    
    console.log('✅ Title column added successfully!');
  } catch (error) {
    console.error('❌ Error adding title column:', error);
  } finally {
    await sequelize.close();
  }
}

addTitleColumn(); 