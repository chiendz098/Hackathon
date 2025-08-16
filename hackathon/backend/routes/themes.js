const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { Theme, User, UserPurchase } = require('../models');
const { Op } = require('sequelize');

// Get all available themes
router.get('/', auth, async (req, res) => {
  try {
    const { category, rarity, priceRange } = req.query;
    
    let whereClause = { isActive: true };
    
    if (category) {
      whereClause.category = category;
    }
    
    if (rarity) {
      whereClause.rarity = rarity;
    }
    
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      whereClause.price = { [Op.between]: [min, max] };
    }

    const themes = await Theme.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name'],
        required: false
      }],
      order: [['rarity', 'ASC'], ['price', 'ASC']]
    });

    // Check which themes user has purchased
    const userPurchases = await UserPurchase.findAll({
      where: { 
        userId: req.user.id,
        itemType: 'theme'
      }
    });

    const purchasedThemeIds = userPurchases.map(p => p.itemId);

    const themesWithPurchaseStatus = themes.map(theme => ({
      ...theme.toJSON(),
      isPurchased: purchasedThemeIds.includes(theme.id),
      canAfford: req.user.coins >= theme.price && req.user.gems >= theme.gemPrice
    }));

    res.json({
      success: true,
      themes: themesWithPurchaseStatus,
      count: themes.length,
      userCoins: req.user.coins,
      userGems: req.user.gems
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching themes'
    });
  }
});

// Get theme by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const theme = await Theme.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name'],
        required: false
      }]
    });

    if (!theme) {
      return res.status(404).json({
        success: false,
        message: 'Theme not found'
      });
    }

    // Check if user has purchased this theme
    const purchase = await UserPurchase.findOne({
      where: { 
        userId: req.user.id,
        itemId: theme.id,
        itemType: 'theme'
      }
    });

    res.json({
      success: true,
      theme: {
        ...theme.toJSON(),
        isPurchased: !!purchase,
        canAfford: req.user.coins >= theme.price && req.user.gems >= theme.gemPrice
      }
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching theme'
    });
  }
});

// Purchase theme
router.post('/:id/purchase', auth, async (req, res) => {
  try {
    const theme = await Theme.findByPk(req.params.id);
    
    if (!theme || !theme.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Theme not found or not available'
      });
    }

    // Check if already purchased
    const existingPurchase = await UserPurchase.findOne({
      where: { 
        userId: req.user.id,
        itemId: theme.id,
        itemType: 'theme'
      }
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: 'Theme already purchased'
      });
    }

    // Check if user can afford
    if (req.user.coins < theme.price || req.user.gems < theme.gemPrice) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient coins or gems'
      });
    }

    // Check unlock requirements
    const requirements = theme.unlockRequirements;
    if (requirements.level && req.user.level < requirements.level) {
      return res.status(400).json({
        success: false,
        message: `Requires level ${requirements.level}`
      });
    }

    // Process purchase
    const purchase = await UserPurchase.create({
      userId: req.user.id,
      itemId: theme.id,
      itemType: 'theme',
      price: theme.price,
      gemPrice: theme.gemPrice,
      purchaseDate: new Date()
    });

    // Deduct coins/gems from user
    await req.user.update({
      coins: req.user.coins - theme.price,
      gems: req.user.gems - theme.gemPrice
    });

    // Update theme download count
    await theme.increment('downloadCount');

    res.status(201).json({
      success: true,
      purchase,
      theme,
      remainingCoins: req.user.coins - theme.price,
      remainingGems: req.user.gems - theme.gemPrice,
      message: 'Theme purchased successfully'
    });
  } catch (error) {
    console.error('Error purchasing theme:', error);
    res.status(500).json({
      success: false,
      message: 'Error purchasing theme'
    });
  }
});

// Apply theme to user
router.post('/:id/apply', auth, async (req, res) => {
  try {
    const theme = await Theme.findByPk(req.params.id);
    
    if (!theme) {
      return res.status(404).json({
        success: false,
        message: 'Theme not found'
      });
    }

    // Check if user owns this theme (free themes or purchased)
    const isOwned = theme.price === 0 || await UserPurchase.findOne({
      where: { 
        userId: req.user.id,
        itemId: theme.id,
        itemType: 'theme'
      }
    });

    if (!isOwned) {
      return res.status(403).json({
        success: false,
        message: 'Theme not owned. Please purchase first.'
      });
    }

    // Apply theme to user
    await req.user.update({
      currentTheme: theme.name
    });

    res.json({
      success: true,
      theme,
      message: 'Theme applied successfully'
    });
  } catch (error) {
    console.error('Error applying theme:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying theme'
    });
  }
});

// Admin: Create new theme
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      gemPrice,
      rarity,
      themeData,
      preview,
      tags,
      isLimitedTime,
      availableUntil
    } = req.body;

    const theme = await Theme.create({
      name,
      description,
      category: category || 'color',
      price: price || 0,
      gemPrice: gemPrice || 0,
      rarity: rarity || 'common',
      themeData,
      preview,
      tags: tags || [],
      createdBy: req.user.id,
      isLimitedTime: isLimitedTime || false,
      availableUntil: availableUntil ? new Date(availableUntil) : null
    });

    res.status(201).json({
      success: true,
      theme,
      message: 'Theme created successfully'
    });
  } catch (error) {
    console.error('Error creating theme:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating theme'
    });
  }
});

// Get theme categories and rarities
router.get('/meta/options', auth, async (req, res) => {
  try {
    const categories = ['color', 'seasonal', 'premium', 'animated', 'special'];
    const rarities = ['common', 'rare', 'epic', 'legendary'];

    res.json({
      success: true,
      categories,
      rarities
    });
  } catch (error) {
    console.error('Error fetching theme options:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching theme options'
    });
  }
});

module.exports = router;
