const fs = require('fs');
const path = require('path');

const envContent = `# Database Configuration - Supabase
DB_URI="postgresql://postgres:Nhatlong1010@db.risphrngpdhesslhjcin.supabase.co:5432/postgres"

# JWT Configuration - MUST match across all services
JWT_SECRET=fpt-university-chatbot-secret-key-2024
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://risphrngpdhesslhjcin.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_5iSD7TyQko7yd4IatIGNoQ_AxW9blRi
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc3Bocm5ncGRoZXNzbGhqY2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNzY4OTgsImV4cCI6MjA2OTg1Mjg5OH0.mD7ecOITZqH5NSNioUS8NOpz20UH8BZJnIrOj6uxcyI

# WebSocket Configuration
SOCKET_URL=http://localhost:5001

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Frontend URL
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Chatbot Configuration
CHATBOT_URL=http://localhost:8000
CHATBOT_ENABLED=true
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📍 Location:', envPath);
  console.log('🔑 JWT_SECRET set to: fpt-university-chatbot-secret-key-2024');
  console.log('\n📝 Please restart your backend server for the changes to take effect.');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n📝 Please manually create a .env file in the backend directory with the following content:');
  console.log('\n' + envContent);
} 