const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Post, User, Pet, ShopItem, Theme, Achievement } = require('../models');
const { Op } = require('sequelize');
const { reloadUserModel } = require('../models');

// Admin middleware
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Reload User model (no auth required for testing)
router.post('/reload-user-model', async (req, res) => {
  try {
    console.log('🔄 Admin requested User model reload...');
    
    // Reload User model
    const newUser = reloadUserModel();
    
    console.log('✅ User model reloaded successfully by admin');
    
    res.json({
      success: true,
      message: 'User model reloaded successfully',
      fields: Object.keys(newUser.rawAttributes)
    });
    
  } catch (error) {
    console.error('❌ Error reloading User model:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error reloading User model: ' + error.message
    });
  }
});

// Get admin stats
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalPosts = await Post.count();
    const publishedPosts = await Post.count({ where: { status: 'published' } });
    const draftPosts = await Post.count({ where: { status: 'draft' } });
    
    // Calculate total views
    const posts = await Post.findAll({
      attributes: ['views']
    });
    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);

    res.json({
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all posts for admin
router.get('/posts', auth, adminAuth, async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email']
      }],
      order: [['created_at', 'DESC']]
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching admin posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post for admin
router.get('/posts/:id', auth, adminAuth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email']
      }]
    });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching admin post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create post
router.post('/posts', auth, adminAuth, async (req, res) => {
  try {
    const { title, content, category, status, image } = req.body;
    
    const post = await Post.create({
      title,
      content,
      category,
      status,
      image,
      authorId: req.user.id
    });

    res.json(post);
  } catch (error) {
    console.error('Error creating admin post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post
router.put('/posts/:id', auth, adminAuth, async (req, res) => {
  try {
    const { title, content, category, status, image } = req.body;
    
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.update({
      title,
      content,
      category,
      status,
      image
    });

    res.json(post);
  } catch (error) {
    console.error('Error updating admin post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/posts/:id', auth, adminAuth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.destroy();
    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error('Error deleting admin post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user stats
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.count();
    
    // Active users (logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = await User.count({
      where: {
        lastLogin: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    // New users (registered within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await User.count({
      where: {
        created_at: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    res.json({
      totalUsers,
      activeUsers,
      newUsers
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users for admin
router.get('/users/list', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'isactive', 'lastlogin', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role
router.put('/users/:id/role', auth, adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ role });
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle user active status
router.put('/users/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ isactive: !user.isactive });
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: buff user economy (coins/gems/xp)
router.post('/economy/buff', auth, adminAuth, async (req, res) => {
  try {
    const { userId, coins = 0, gems = 0, xp = 0 } = req.body;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.coins = (user.coins || 0) + Number(coins || 0);
    user.gems = (user.gems || 0) + Number(gems || 0);
    user.xp = (user.xp || 0) + Number(xp || 0);
    await user.save();
    res.json({
      success: true,
      message: 'Buff applied successfully',
      balance: { coins: user.coins, gems: user.gems, xp: user.xp }
    });
  } catch (error) {
    console.error('Error buffing economy:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: get all users
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (role && role !== 'all') {
      whereClause.role = role;
    }
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { studentId: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'role', 'studentId', 'level', 'xp', 'coins', 'gems', 'created_at', 'lastLoginAt'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      users: users.rows,
      total: users.count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(users.count / limit)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===== PETS MANAGEMENT =====

// Get all pets for admin
router.get('/pets', auth, adminAuth, async (req, res) => {
  try {
    const pets = await Pet.findAll({
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      pets: pets,
      total: pets.length
    });
  } catch (error) {
    console.error('Error fetching pets:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new pet
router.post('/pets', auth, adminAuth, async (req, res) => {
  try {
    const { name, type, description, avatar, baseHappiness, baseHunger, rarity, price, isBasic, specialAbilities, category } = req.body;
    
    const pet = await Pet.create({
      name,
      type,
      description,
      avatar,
      baseHappiness: baseHappiness || 70,
      baseHunger: baseHunger || 50,
      rarity: rarity || 'common',
      price: price || 0,
      isBasic: isBasic || false,
      specialAbilities: specialAbilities || [],
      category: category || 'general'
    });

    res.json({
      success: true,
      message: 'Pet created successfully',
      pet: pet
    });
  } catch (error) {
    console.error('Error creating pet:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update pet
router.put('/pets/:id', auth, adminAuth, async (req, res) => {
  try {
    const { name, type, description, avatar, baseHappiness, baseHunger, rarity, price, isBasic, specialAbilities, category } = req.body;
    
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    await pet.update({
      name,
      type,
      description,
      avatar,
      baseHappiness,
      baseHunger,
      rarity,
      price,
      isBasic,
      specialAbilities,
      category
    });

    res.json({
      success: true,
      message: 'Pet updated successfully',
      pet: pet
    });
  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete pet
router.delete('/pets/:id', auth, adminAuth, async (req, res) => {
  try {
    const pet = await Pet.findByPk(req.params.id);
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    await pet.destroy();
    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pet:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===== SHOP ITEMS MANAGEMENT =====

// Get all shop items for admin
router.get('/shop-items', auth, adminAuth, async (req, res) => {
  try {
    const items = await ShopItem.findAll({
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      items: items,
      total: items.length
    });
  } catch (error) {
    console.error('Error fetching shop items:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new shop item
router.post('/shop-items', auth, adminAuth, async (req, res) => {
  try {
    const { name, description, price, rarity, category, type, subType, preview, effects } = req.body;
    
    const item = await ShopItem.create({
      name,
      description,
      price,
      rarity,
      category,
      type,
      subType,
      preview,
      effects: effects || []
    });

    res.json({
      success: true,
      message: 'Shop item created successfully',
      item: item
    });
  } catch (error) {
    console.error('Error creating shop item:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===== THEMES MANAGEMENT =====

// Get all themes for admin
router.get('/themes', auth, adminAuth, async (req, res) => {
  try {
    const themes = await Theme.findAll({
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      themes: themes,
      total: themes.length
    });
  } catch (commit) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new theme
router.post('/themes', auth, adminAuth, async (req, res) => {
  try {
    const { name, description, price, rarity, category, preview, features } = req.body;
    
    const theme = await Theme.create({
      name,
      description,
      price,
      rarity,
      category,
      preview,
      features: features || []
    });

    res.json({
      success: true,
      message: 'Theme created successfully',
      theme: theme
    });
  } catch (error) {
    console.error('Error creating theme:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===== ACHIEVEMENTS MANAGEMENT =====

// Get all achievements for admin
router.get('/achievements', auth, adminAuth, async (req, res) => {
  try {
    const achievements = await Achievement.findAll({
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      achievements: achievements,
      total: achievements.length
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new achievement
router.post('/achievements', auth, adminAuth, async (req, res) => {
  try {
    const { name, description, reward, icon } = req.body;
    
    const achievement = await Achievement.create({
      name,
      description,
      reward: reward || {},
      icon
    });

    res.json({
      success: true,
      message: 'Achievement created successfully',
      achievement: achievement
    });
  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===== BULK SEEDING =====

// Seed all shop items at once
router.post('/seed-shop', auth, adminAuth, async (req, res) => {
  try {
    console.log('🌱 Starting shop seeding...');
    
    // Create basic pets
    const basicPets = [
      {
        name: 'Buddy',
        type: 'basic_dog',
        description: 'A friendly basic dog companion for new users - wagging tail and happy bouncing',
        avatar: '/pets/basic_dog.gif',
        baseHappiness: 70,
        baseHunger: 50,
        rarity: 'common',
        price: 0,
        isBasic: true,
        category: 'starter'
      },
      {
        name: 'Whiskers',
        type: 'basic_cat',
        description: 'A simple cat friend to start your journey - purring and stretching',
        avatar: '/pets/basic_cat.gif',
        baseHappiness: 65,
        baseHunger: 45,
        rarity: 'common',
        price: 0,
        isBasic: true,
        category: 'starter'
      }
    ];
    
    // Create premium pets
    const premiumPets = [
      {
        name: 'Luna',
        type: 'premium_cat',
        description: 'A majestic silver Persian cat with glowing eyes - floating with mystic aura',
        avatar: '/pets/premium_cat.gif',
        baseHappiness: 85,
        baseHunger: 40,
        rarity: 'rare',
        price: 500,
        specialAbilities: ['night_vision', 'mystic_aura'],
        category: 'premium'
      },
      {
        name: 'Thunder',
        type: 'premium_dog',
        description: 'A powerful husky with electric blue fur - running with lightning trails',
        avatar: '/pets/premium_dog.gif',
        baseHappiness: 90,
        baseHunger: 35,
        rarity: 'epic',
        price: 1000,
        specialAbilities: ['speed_boost', 'weather_sense'],
        category: 'premium'
      },
      {
        name: 'Phoenix',
        type: 'mythical_bird',
        description: 'A legendary phoenix that never truly dies - soaring with fire wings',
        avatar: '/pets/phoenix.gif',
        baseHappiness: 95,
        baseHunger: 30,
        rarity: 'legendary',
        price: 2500,
        specialAbilities: ['immortality', 'fire_mastery', 'rebirth'],
        category: 'mythical'
      },
      {
        name: 'Dragon',
        type: 'mythical_dragon',
        description: 'A wise ancient dragon with crystal scales - breathing magical fire',
        avatar: '/pets/dragon.gif',
        baseHappiness: 100,
        baseHunger: 25,
        rarity: 'mythic',
        price: 5000,
        specialAbilities: ['flight', 'elemental_magic', 'wisdom_boost'],
        category: 'mythical'
      },
      {
        name: 'Unicorn',
        type: 'mythical_unicorn',
        description: 'A magical unicorn with rainbow mane - galloping with sparkles',
        avatar: '/pets/unicorn.gif',
        baseHappiness: 95,
        baseHunger: 30,
        rarity: 'legendary',
        price: 3000,
        specialAbilities: ['healing_magic', 'rainbow_trail', 'wish_granting'],
        category: 'mythical'
      },
      {
        name: 'Robot',
        type: 'cyber_pet',
        description: 'A futuristic robot companion with AI - transforming and glowing',
        avatar: '/pets/robot.gif',
        baseHappiness: 80,
        baseHunger: 0,
        rarity: 'epic',
        price: 1500,
        specialAbilities: ['data_analysis', 'hologram_projection', 'upgradeable'],
        category: 'cyber'
      },
      {
        name: 'Butterfly',
        type: 'nature_pet',
        description: 'A magical butterfly with rainbow wings - fluttering and dancing',
        avatar: '/pets/butterfly.gif',
        baseHappiness: 75,
        baseHunger: 40,
        rarity: 'rare',
        price: 800,
        specialAbilities: ['flight', 'pollen_collection', 'beauty_aura'],
        category: 'nature'
      },
      {
        name: 'Pixie',
        type: 'fairy_pet',
        description: 'A tiny fairy with glowing wings - flying in circles with sparkles',
        avatar: '/pets/pixie.gif',
        baseHappiness: 90,
        baseHunger: 30,
        rarity: 'epic',
        price: 1200,
        specialAbilities: ['magic_dust', 'invisibility', 'wish_granting'],
        category: 'fairy'
      },
      {
        name: 'Water Spirit',
        type: 'elemental_pet',
        description: 'A flowing water spirit - rippling and splashing',
        avatar: '/pets/water_spirit.gif',
        baseHappiness: 85,
        baseHunger: 20,
        rarity: 'legendary',
        price: 2000,
        specialAbilities: ['water_control', 'healing_water', 'shape_shifting'],
        category: 'elemental'
      },
      {
        name: 'Shadow Cat',
        type: 'dark_pet',
        description: 'A mysterious cat made of shadows - slinking and disappearing',
        avatar: '/pets/shadow_cat.gif',
        baseHappiness: 70,
        baseHunger: 35,
        rarity: 'epic',
        price: 1800,
        specialAbilities: ['shadow_walk', 'night_vision', 'stealth_mode'],
        category: 'dark'
      }
    ];
    
    // Create themes
    const themes = [
      {
        name: 'Forest Magic',
        description: 'Enchanted forest with glowing mushrooms and fairy lights - animated nature',
        price: 300,
        rarity: 'rare',
        category: 'nature',
        preview: '/themes/forest_magic.gif',
        features: ['animated_leaves', 'glowing_effects', 'nature_sounds']
      },
      {
        name: 'Cyberpunk Neon',
        description: 'Futuristic cityscape with neon lights and holograms - pulsing neon',
        price: 300,
        rarity: 'epic',
        category: 'futuristic',
        preview: '/themes/cyberpunk.gif',
        features: ['neon_glow', 'hologram_effects', 'city_ambience']
      },
      {
        name: 'Ocean Depths',
        description: 'Underwater world with coral reefs and sea creatures - flowing water',
        price: 350,
        rarity: 'rare',
        category: 'aquatic',
        preview: '/themes/ocean.gif',
        features: ['bubble_effects', 'underwater_sounds', 'coral_animation']
      },
      {
        name: 'Space Explorer',
        description: 'Cosmic journey through stars and galaxies - rotating nebulas',
        price: 500,
        rarity: 'legendary',
        category: 'cosmic',
        preview: '/themes/space.gif',
        features: ['star_field', 'nebula_effects', 'space_music']
      },
      {
        name: 'Candy Land',
        description: 'Sweet world made of candies and desserts - bouncing candies',
        price: 250,
        rarity: 'common',
        category: 'fantasy',
        preview: '/themes/candy.gif',
        features: ['candy_effects', 'sweet_sounds', 'colorful_animation']
      },
      {
        name: 'Medieval Castle',
        description: 'Ancient castle with knights and dragons - flickering torches',
        price: 450,
        rarity: 'epic',
        category: 'historical',
        preview: '/themes/medieval.gif',
        features: ['torch_lighting', 'castle_ambience', 'medieval_music']
      }
    ];
    
    // Create accessories
    const accessories = [
      {
        name: 'Golden Crown',
        description: 'A majestic golden crown for your pet - sparkling and rotating',
        price: 200,
        rarity: 'rare',
        category: 'pet_accessory',
        type: 'accessory',
        subType: 'headwear',
        preview: '/accessories/golden_crown.gif',
        effects: ['royalty_aura', 'happiness_boost']
      },
      {
        name: 'Rainbow Wings',
        description: 'Magical wings that let your pet fly - flapping with rainbow trails',
        price: 300,
        rarity: 'epic',
        category: 'pet_accessory',
        type: 'accessory',
        subType: 'wings',
        preview: '/accessories/rainbow_wings.gif',
        effects: ['flight_ability', 'rainbow_trail']
      },
      {
        name: 'Crystal Collar',
        description: 'A beautiful collar with magical crystals - glowing and pulsing',
        price: 150,
        rarity: 'rare',
        category: 'pet_accessory',
        type: 'accessory',
        subType: 'collar',
        preview: '/accessories/crystal_collar.gif',
        effects: ['magic_boost', 'protection_aura']
      },
      {
        name: 'Fire Cape',
        description: 'A cape that burns with eternal flames - flickering fire',
        price: 400,
        rarity: 'epic',
        category: 'pet_accessory',
        type: 'accessory',
        subType: 'cape',
        preview: '/accessories/fire_cape.gif',
        effects: ['fire_resistance', 'intimidation_boost']
      },
      {
        name: 'Floating Books',
        description: 'Magical books that float around your study room - hovering and rotating',
        price: 180,
        rarity: 'rare',
        category: 'room_decoration',
        type: 'decoration',
        subType: 'furniture',
        preview: '/decorations/floating_books.gif',
        effects: ['knowledge_boost', 'magical_atmosphere']
      },
      {
        name: 'Crystal Chandelier',
        description: 'An elegant chandelier with rainbow crystals - rotating and sparkling',
        price: 300,
        rarity: 'epic',
        category: 'room_decoration',
        type: 'decoration',
        subType: 'lighting',
        preview: '/decorations/crystal_chandelier.gif',
        effects: ['beautiful_lighting', 'luxury_aura']
      },
      {
        name: 'Focus Crystal',
        description: 'A crystal that enhances concentration - pulsing with energy',
        price: 120,
        rarity: 'common',
        category: 'study_enhancement',
        type: 'enhancement',
        subType: 'crystal',
        preview: '/enhancements/focus_crystal.gif',
        effects: ['focus_boost', 'study_efficiency']
      },
      {
        name: 'Memory Orb',
        description: 'An orb that improves memory retention - floating and glowing',
        price: 200,
        rarity: 'rare',
        category: 'study_enhancement',
        type: 'enhancement',
        subType: 'orb',
        preview: '/enhancements/memory_orb.gif',
        effects: ['memory_boost', 'learning_speed']
      }
    ];
    
    // Create achievements
    const achievements = [
      {
        name: 'First Pet',
        description: 'Adopt your first pet - animated celebration',
        reward: { coins: 50, xp: 100 },
        icon: '/achievements/first_pet.gif'
      },
      {
        name: 'Pet Collector',
        description: 'Own 5 different pets - rotating trophy',
        reward: { coins: 200, xp: 500 },
        icon: '/achievements/pet_collector.gif'
      },
      {
        name: 'Theme Master',
        description: 'Purchase 3 themes - glowing crown',
        reward: { coins: 300, xp: 800 },
        icon: '/achievements/theme_master.gif'
      },
      {
        name: 'Accessory King',
        description: 'Collect 10 accessories - sparkling gems',
        reward: { coins: 500, xp: 1000 },
        icon: '/achievements/accessory_king.gif'
      }
    ];
    
    // Insert all items
    const createdPets = await Pet.bulkCreate([...basicPets, ...premiumPets]);
    const createdThemes = await Theme.bulkCreate(themes);
    const createdAccessories = await ShopItem.bulkCreate(accessories);
    const createdAchievements = await Achievement.bulkCreate(achievements);
    
    console.log(`✅ Created ${createdPets.length} pets, ${createdThemes.length} themes, ${createdAccessories.length} accessories, ${createdAchievements.length} achievements`);
    
    res.json({
      success: true,
      message: 'Shop seeded successfully',
      summary: {
        pets: createdPets.length,
        themes: createdThemes.length,
        accessories: createdAccessories.length,
        achievements: createdAchievements.length
      }
    });
    
  } catch (error) {
    console.error('Error seeding shop:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router; 