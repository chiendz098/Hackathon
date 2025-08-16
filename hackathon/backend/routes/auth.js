const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { User, Pet, UserPet } = require('../models');

// Đăng ký
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tất cả các trường đều bắt buộc'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'student',
      isActive: true,
      coins: 1000,
      gems: 100
    });

    // Create default pet for new user
    try {
      // Find or create default pet
      let defaultPet = await Pet.findOne({ where: { name: 'Starter Pet' } });
      
      if (!defaultPet) {
        defaultPet = await Pet.create({
          name: 'Starter Pet',
          type: 'starter',
          description: 'A friendly starter companion for new users',
          image: '🐾',
          isActive: true,
          rarity: 'common',
          baseStats: {
            happiness: 100,
            energy: 100,
            hunger: 100,
            thirst: 100,
            intelligence: 50,
            loyalty: 50
          },
          abilities: ['basic_commands', 'motivation'],
          evolution: {
            stage: 0,
            requirements: { level: 10, experience: 1000 }
          }
        });
      }

      // Create user pet
      await UserPet.create({
        userId: user.id,
        petId: defaultPet.id,
        nickname: 'My First Pet',
        isActive: true,
        level: 1,
        experience: 0,
        evolutionStage: 0,
        currentStats: {
          happiness: 100,
          energy: 100,
          hunger: 100,
          thirst: 100,
          intelligence: 50,
          loyalty: 50,
          xp: 0,
          level: 1
        },
        lastFed: new Date(),
        lastPlayed: new Date(),
        accessories: [],
        abilities: ['basic_commands', 'motivation']
      });

      console.log(`🐾 Created default pet for new user: ${user.email}`);
    } catch (petError) {
      console.error('Error creating default pet:', petError);
      // Don't fail registration if pet creation fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create clean response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      level: user.level,
      xp: user.xp,
      coins: user.coins,
      gems: user.gems,
      isActive: user.isActive
    };

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  try {
    console.log('🔍 Login request received');
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request body:', req.body);
    console.log('🔍 Request body type:', typeof req.body);
    console.log('🔍 Request body keys:', Object.keys(req.body));
    
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email và mật khẩu đều bắt buộc' 
      });
    }

    // Find user using raw query to avoid Sequelize model field issues
    const { Sequelize } = require('sequelize');
    const sequelize = new Sequelize(config.DB_URI, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
    const users = await sequelize.query(`
      SELECT id, name, email, password, role, isactive, avatar, bio, level, xp, coins, gems
      FROM "users" 
      WHERE email = $1
    `, { 
      type: sequelize.QueryTypes.SELECT,
      bind: [email]
    });
    
    if (users.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Sai email hoặc mật khẩu' 
      });
    }
    
    const user = users[0];
    
    // Check if user is active
    if (!user.isactive) {
      return res.status(400).json({ 
        success: false,
        message: 'Tài khoản đã bị khóa' 
      });
    }

    // Verify password using bcrypt directly
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Sai email hoặc mật khẩu'
      });
    }

    // Update last login
    await sequelize.query(`
      UPDATE "users" SET lastlogin = NOW() WHERE id = $1
    `, { 
      type: sequelize.QueryTypes.UPDATE,
      bind: [user.id]
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create clean response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      level: user.level,
      xp: user.xp,
      coins: user.coins,
      gems: user.gems,
      isActive: user.isactive
    };

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: userResponse
    });

    await sequelize.close();
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token không được cung cấp' 
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Use raw query instead of User model
    const { Sequelize } = require('sequelize');
    const sequelize = new Sequelize(config.DB_URI, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
    
    const users = await sequelize.query(`
      SELECT id, name, email, role, avatar, bio, level, xp, coins, gems, isactive
      FROM "users" 
      WHERE id = $1
    `, { 
      type: sequelize.QueryTypes.SELECT,
      bind: [decoded.id]
    });
    
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Token không hợp lệ' 
      });
    }

    const user = users[0];
    
    // Create clean response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      level: user.level,
      xp: user.xp,
      coins: user.coins,
      gems: user.gems,
      isActive: user.isactive
    };

    res.json({
      success: true,
      user: userResponse
    });
    
    await sequelize.close();
  } catch (err) {
    console.error('Get user error:', err);
    res.status(401).json({ 
      success: false,
      message: 'Token không hợp lệ' 
    });
  }
});

module.exports = router; 