const jwt = require('jsonwebtoken');
const config = require('../config');
const { Sequelize } = require('sequelize');

// Create a single Sequelize instance for reuse
const sequelize = new Sequelize(config.DB_URI, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Middleware xác thực JWT
async function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Fetch user data using raw query
    const users = await sequelize.query(`
      SELECT id, name, email, role, avatar, bio, level, xp, coins, gems, isactive
      FROM "users" 
      WHERE id = $1
    `, { 
      type: sequelize.QueryTypes.SELECT,
      bind: [decoded.id]
    });
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    const user = users[0];
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Middleware xác thực JWT tùy chọn (không bắt buộc)
async function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    req.user = null;
    req.userId = null;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Fetch user data using raw query
    const users = await sequelize.query(`
      SELECT id, name, email, role, avatar, bio, level, xp, coins, gems, isactive
      FROM "users" 
      WHERE id = $1
    `, { 
      type: sequelize.QueryTypes.SELECT,
      bind: [decoded.id]
    });
    
    if (users.length > 0) {
      req.user = users[0];
      req.userId = users[0].id;
    } else {
      req.user = null;
      req.userId = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    req.userId = null;
    next();
  }
}

// Middleware kiểm tra quyền admin
async function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Fetch user data using raw query
    const users = await sequelize.query(`
      SELECT id, name, email, role, avatar, bio, level, xp, coins, gems, isactive
      FROM "users" 
      WHERE id = $1
    `, { 
      type: sequelize.QueryTypes.SELECT,
      bind: [decoded.id]
    });
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    const user = users[0];
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Middleware kiểm tra quyền sở hữu resource
async function ownershipAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Fetch user data using raw query
    const users = await sequelize.query(`
      SELECT id, name, email, role, avatar, bio, level, xp, coins, gems, isactive
      FROM "users" 
      WHERE id = $1
    `, { 
      type: sequelize.QueryTypes.SELECT,
      bind: [decoded.id]
    });
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    const user = users[0];
    req.user = user;
    req.userId = user.id;
    
    // Kiểm tra xem user có quyền truy cập resource không
    const resourceUserId = req.params.userId || req.body.userId;
    if (resourceUserId && resourceUserId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = {
  auth,
  optionalAuth,
  adminAuth,
  ownershipAuth
}; 