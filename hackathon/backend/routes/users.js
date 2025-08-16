const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const { UserProfile, ShopItem, UserPurchase } = require('../models'); // Added missing imports

// Get user profile with coins, gems, level, and experience
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
          attributes: ['level', 'experience', 'achievements', 'stats']
        }
      ],
      attributes: ['id', 'name', 'email', 'coins', 'gems', 'avatar', 'role']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate experience to next level
    const currentLevel = user.profile?.level || 1;
    const currentExp = user.profile?.experience || 0;
    const expToNext = currentLevel * 100; // Simple formula: each level needs level * 100 exp

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        coins: user.coins || 0,
        gems: user.gems || 0,
        level: currentLevel,
        experience: currentExp,
        experienceToNext: expToNext,
        achievements: user.profile?.achievements || [],
        stats: user.profile?.stats || {}
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get user's owned items
router.get('/owned-items', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const ownedItems = await UserPurchase.findAll({
      where: { userId },
      include: [
        {
          model: ShopItem,
          as: 'item',
          attributes: ['id', 'name', 'description', 'category', 'icon', 'metadata', 'type']
        }
      ],
      order: [['purchasedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: ownedItems.map(purchase => ({
        itemId: purchase.itemId,
        quantity: purchase.quantity,
        purchasedAt: purchase.purchasedAt,
        item: purchase.item
      }))
    });
  } catch (error) {
    console.error('Error fetching owned items:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get user coins
router.get('/coins', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      coins: user.coins || 0,
      gems: user.gems || 0
    });
  } catch (err) {
    console.error('Error getting user coins:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all users (for admin purposes)
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'created_at']
    });
    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'role', 'avatar', 'points', 'badges', 'created_at']
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    // This would typically update the authenticated user's profile
    res.json({ message: 'Profile update endpoint' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user's theme preference
router.put('/theme', auth, async (req, res) => {
  try {
    const { themeId } = req.body;
    if (!themeId || typeof themeId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid themeId' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure theme is unlocked
    const unlocked = Array.isArray(user.unlockedThemes) ? user.unlockedThemes : [];
    if (!unlocked.includes(themeId)) {
      unlocked.push(themeId);
      user.unlockedThemes = unlocked;
    }

    user.currentTheme = themeId;
    await user.save();

    return res.json({
      success: true,
      message: 'Theme updated',
      user: {
        id: user.id,
        currentTheme: user.currentTheme,
        unlockedThemes: user.unlockedThemes,
        coins: user.coins,
        gems: user.gems
      }
    });
  } catch (err) {
    console.error('Error updating theme:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 