const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting FPT COMPASS Backend with Chatbot...\n');

// Check if chatbot_final directory exists
const chatbotPath = path.join(__dirname, '..', 'chatbot_final');
if (!fs.existsSync(chatbotPath)) {
  console.error('❌ chatbot_final directory not found!');
  console.error('Please make sure chatbot_final is in the parent directory of backend');
  process.exit(1);
}

// Check if requirements.txt exists
const requirementsPath = path.join(chatbotPath, 'requirements.txt');
if (!fs.existsSync(requirementsPath)) {
  console.error('❌ requirements.txt not found in chatbot_final!');
  process.exit(1);
}

// Function to install Python dependencies
async function installPythonDependencies() {
  return new Promise((resolve, reject) => {
    console.log('📦 Installing Python dependencies...');
    
    const pip = spawn('pip', ['install', '-r', requirementsPath], {
      cwd: chatbotPath,
      stdio: 'pipe'
    });

    pip.stdout.on('data', (data) => {
      console.log(`📦 ${data.toString().trim()}`);
    });

    pip.stderr.on('data', (data) => {
      console.log(`⚠️  ${data.toString().trim()}`);
    });

    pip.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Python dependencies installed successfully!\n');
        resolve();
      } else {
        console.error(`❌ Failed to install Python dependencies (code: ${code})`);
        reject(new Error(`pip install failed with code ${code}`));
      }
    });
  });
}

// Function to start Python chatbot
function startChatbot() {
  console.log('🤖 Starting Python chatbot...');
  
  const chatbot = spawn('python', ['app.py'], {
    cwd: chatbotPath,
    stdio: 'pipe'
  });

  chatbot.stdout.on('data', (data) => {
    console.log(`🤖 ${data.toString().trim()}`);
  });

  chatbot.stderr.on('data', (data) => {
    console.log(`🤖 ERROR: ${data.toString().trim()}`);
  });

  chatbot.on('close', (code) => {
    console.log(`🤖 Chatbot process exited with code ${code}`);
  });

  chatbot.on('error', (error) => {
    console.error(`🤖 Failed to start chatbot: ${error.message}`);
  });

  return chatbot;
}

// Function to start Node.js backend
function startBackend() {
  console.log('⚡ Starting Node.js backend...');
  
  const backend = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'pipe'
  });

  backend.stdout.on('data', (data) => {
    console.log(`⚡ ${data.toString().trim()}`);
  });

  backend.stderr.on('data', (data) => {
    console.log(`⚡ ERROR: ${data.toString().trim()}`);
  });

  backend.on('close', (code) => {
    console.log(`⚡ Backend process exited with code ${code}`);
  });

  backend.on('error', (error) => {
    console.error(`⚡ Failed to start backend: ${error.message}`);
  });

  return backend;
}

// Main function
async function main() {
  try {
    // Install Python dependencies first
    await installPythonDependencies();
    
    // Start both processes
    const chatbot = startChatbot();
    const backend = startBackend();
    
    // Wait a bit for chatbot to start
    setTimeout(() => {
      console.log('\n🎉 Both services are starting up!');
      console.log('📱 Backend API: http://localhost:5001');
      console.log('🤖 Chatbot API: http://localhost:8000');
      console.log('📚 Chatbot Docs: http://localhost:8000/docs');
      console.log('\nPress Ctrl+C to stop both services\n');
    }, 3000);
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down services...');
      chatbot.kill();
      backend.kill();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down services...');
      chatbot.kill();
      backend.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start services:', error.message);
    process.exit(1);
  }
}

// Start everything
main(); 