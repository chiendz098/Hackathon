require('dotenv').config();

// Validation function for required environment variables
const validateEnvVar = (name, defaultValue = null) => {
  const value = process.env[name] || defaultValue;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Environment variable ${name} is required in production mode`);
  }
  return value;
};

// Configuration object
const config = {
  // Database - Supabase PostgreSQL
  DB_URI: validateEnvVar('DB_URI', 'postgresql://postgres:Nhatlong1010@db.risphrngpdhesslhjcin.supabase.co:5432/postgres'),
  SUPABASE_URL: validateEnvVar('SUPABASE_URL', 'https://risphrngpdhesslhjcin.supabase.co'),
  SUPABASE_ANON_KEY: validateEnvVar('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: validateEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  
  // JWT with fixed secret for chatbot compatibility
  JWT_SECRET: validateEnvVar('JWT_SECRET', 'fpt-university-chatbot-secret-key-2024'),
  JWT_EXPIRE: validateEnvVar('JWT_EXPIRE', '7d'),
  
  // Server
  PORT: parseInt(validateEnvVar('PORT', '5001'), 10),
  
  // File Upload with secure defaults
  UPLOAD_PATH: validateEnvVar('UPLOAD_PATH', './uploads'),
  MAX_FILE_SIZE: parseInt(validateEnvVar('MAX_FILE_SIZE', '10485760'), 10), // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  
  // Frontend URL with validation
  FRONTEND_URL: validateEnvVar('FRONTEND_URL', 'http://localhost:5173'),
  
  // Environment
  NODE_ENV: validateEnvVar('NODE_ENV', 'development'),
  
  // Security
  CORS_ORIGIN: validateEnvVar('CORS_ORIGIN', 'http://localhost:5173'),
  SESSION_SECRET: validateEnvVar('SESSION_SECRET', require('crypto').randomBytes(64).toString('hex')),
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW: parseInt(validateEnvVar('RATE_LIMIT_WINDOW', '15'), 10), // 15 minutes
    MAX_REQUESTS: parseInt(validateEnvVar('RATE_LIMIT_MAX_REQUESTS', '1000'), 10)
  },

  // AI Services
  OPENAI_API_KEY: validateEnvVar('OPENAI_API_KEY'),
  ANTHROPIC_API_KEY: validateEnvVar('ANTHROPIC_API_KEY'),
  
  // Email Configuration (optional)
  SMTP_HOST: validateEnvVar('SMTP_HOST', 'smtp.gmail.com'),
  SMTP_PORT: parseInt(validateEnvVar('SMTP_PORT', '587'), 10),
  SMTP_USER: validateEnvVar('SMTP_USER'),
  SMTP_PASS: validateEnvVar('SMTP_PASS'),
};

// Validate configuration
const validateConfig = () => {
  // Validate PORT
  if (config.PORT < 1024 || config.PORT > 65535) {
    throw new Error('PORT must be between 1024 and 65535');
  }

  // Validate URLs
  const urlRegex = /^https?:\/\/.+/;
  if (!urlRegex.test(config.FRONTEND_URL)) {
    throw new Error('Invalid FRONTEND_URL format');
  }

  // Validate PostgreSQL URI
  if (!config.DB_URI.startsWith('postgresql://')) {
    throw new Error('Invalid PostgreSQL URI format');
  }

  // Validate file size
  if (config.MAX_FILE_SIZE <= 0) {
    throw new Error('MAX_FILE_SIZE must be positive');
  }
};

try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}

module.exports = config; 