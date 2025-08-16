import { AES, enc } from 'crypto-js';

// Security configuration
const securityConfig = {
  // Minimum password requirements
  PASSWORD_MIN_LENGTH: 1,
  PASSWORD_REQUIRE_UPPERCASE: false,
  PASSWORD_REQUIRE_LOWERCASE: false,
  PASSWORD_REQUIRE_NUMBER: false,
  PASSWORD_REQUIRE_SPECIAL: false,
  
  // Session configuration
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REFRESH_TOKEN_BEFORE: 5 * 60 * 1000, // 5 minutes before expiry
  
  // Content Security Policy
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'https:'],
    'frame-src': ["'none'"],
    'object-src': ["'none'"]
  },
  
  // Allowed file types and sizes
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // XSS Prevention
  XSS_FILTER_OPTIONS: {
    whiteList: {}, // No tags allowed by default
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  }
};

// Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Validate file upload
export const validateFile = (file) => {
  if (!file) return { valid: false, message: 'No file provided' };
  
  if (!securityConfig.ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: 'File type not allowed'
    };
  }
  
  if (file.size > securityConfig.MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File size must not exceed ${securityConfig.MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }
  
  return { valid: true };
};

// Encrypt sensitive data for local storage
export const encryptData = (data, key) => {
  try {
    return AES.encrypt(JSON.stringify(data), key).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

// Decrypt data from local storage
export const decryptData = (encryptedData, key) => {
  try {
    const bytes = AES.decrypt(encryptedData, key);
    return JSON.parse(bytes.toString(enc.Utf8));
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Secure storage wrapper
export const secureStorage = {
  setItem: (key, value) => {
    const encryptionKey = import.meta.env.VITE_STORAGE_KEY || 'your-secure-key';
    const encrypted = encryptData(value, encryptionKey);
    if (encrypted) {
      localStorage.setItem(key, encrypted);
    }
  },
  
  getItem: (key) => {
    const encryptionKey = import.meta.env.VITE_STORAGE_KEY || 'your-secure-key';
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    return decryptData(encrypted, encryptionKey);
  },
  
  removeItem: (key) => {
    localStorage.removeItem(key);
  },
  
  clear: () => {
    localStorage.clear();
  }
};

// Session management
export const sessionManager = {
  startSession: () => {
    const sessionTimeout = setTimeout(() => {
      sessionManager.endSession();
    }, securityConfig.SESSION_TIMEOUT);
    
    secureStorage.setItem('sessionTimeout', sessionTimeout);
    document.addEventListener('click', sessionManager.refreshSession);
    document.addEventListener('keypress', sessionManager.refreshSession);
  },
  
  refreshSession: () => {
    const currentTimeout = secureStorage.getItem('sessionTimeout');
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
    sessionManager.startSession();
  },
  
  endSession: () => {
    secureStorage.clear();
    document.removeEventListener('click', sessionManager.refreshSession);
    document.removeEventListener('keypress', sessionManager.refreshSession);
    window.location.href = '/login';
  }
};

// Generate Content Security Policy header
export const generateCSP = () => {
  return Object.entries(securityConfig.CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
};

// Password strength checker
export const checkPasswordStrength = (password) => {
  const requirements = {
    length: password.length >= securityConfig.PASSWORD_MIN_LENGTH,
    uppercase: securityConfig.PASSWORD_REQUIRE_UPPERCASE ? /[A-Z]/.test(password) : true,
    lowercase: securityConfig.PASSWORD_REQUIRE_LOWERCASE ? /[a-z]/.test(password) : true,
    number: securityConfig.PASSWORD_REQUIRE_NUMBER ? /\d/.test(password) : true,
    special: securityConfig.PASSWORD_REQUIRE_SPECIAL ? /[^A-Za-z0-9]/.test(password) : true
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  const maxScore = Object.keys(requirements).length;
  
  return {
    score: (score / maxScore) * 100,
    requirements,
    isValid: score === maxScore
  };
};

// URL sanitizer
export const sanitizeUrl = (url) => {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    // Only allow specific protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

// HTML sanitizer
export const sanitizeHtml = (html) => {
  if (!html) return '';
  
  // Use DOMParser to safely parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Remove potentially dangerous elements and attributes
  const dangerous = doc.querySelectorAll('script, iframe, object, embed, form');
  dangerous.forEach(element => element.remove());
  
  return doc.body.textContent;
};

export default {
  securityConfig,
  sanitizeInput,
  validateFile,
  secureStorage,
  sessionManager,
  generateCSP,
  checkPasswordStrength,
  sanitizeUrl,
  sanitizeHtml
}; 