const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const config = require('../config');
const { auth } = require('../middleware/auth');
const UserDecoration = require('../models/UserDecoration');
const Decoration = require('../models/Decoration');

const pool = new Pool({
  connectionString: config.DB_URI,
  ssl: {
    rejectUnauthorized: false
  }
});

// Get all profile decorations
router.get('/decorations', async (req, res) => {
  try {
    const { category, rarity, type } = req.query;
    const client = await pool.connect();
    
    let query = `
      SELECT * FROM profile_decorations 
      WHERE is_active = true
    `;
    const params = [];
    let paramCount = 0;
    
    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }
    
    if (rarity) {
      paramCount++;
      query += ` AND rarity = $${paramCount}`;
      params.push(rarity);
    }
    
    if (type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(type);
    }
    
    query += ` ORDER BY rarity DESC, price_coins ASC`;
    
    const result = await client.query(query, params);
    client.release();
    
    res.json({
      success: true,
      decorations: result.rows
    });
  } catch (error) {
    console.error('Error fetching profile decorations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile decorations'
    });
  }
});

// Get user's profile decorations
router.get('/user-decorations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT upd.*, pd.name, pd.description, pd.type, pd.category, pd.rarity, 
             pd.effects, pd.image_url, pd.preview_url
      FROM user_profile_decorations upd
      JOIN profile_decorations pd ON upd.decoration_id = pd.id
      WHERE upd.id = $1
      ORDER BY upd.is_equipped DESC, pd.rarity DESC
    `, [userId]);
    
    client.release();
    
    res.json({
      success: true,
      userDecorations: result.rows
    });
  } catch (error) {
    console.error('Error fetching user decorations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user decorations'
    });
  }
});

// Get user's decorations
router.get('/user', auth, async (req, res) => {
  try {
    // Get user's purchased decorations
    const userDecorations = await UserDecoration.findAll({
      where: { userId: req.user.id },
      include: [{ model: Decoration, as: 'decoration' }],
      order: [['purchasedAt', 'DESC']]
    });

    const formattedDecorations = userDecorations.map(userDec => ({
      id: userDec.decoration.id,
      name: userDec.decoration.name,
      description: userDec.decoration.description,
      type: userDec.decoration.type,
      category: userDec.decoration.category,
      price_coins: userDec.decoration.price_coins,
      price_gems: userDec.decoration.price_gems,
      rarity: userDec.decoration.rarity,
      image_url: userDec.decoration.image_url,
      preview_url: userDec.decoration.preview_url,
      is_featured: userDec.decoration.is_featured,
      effects: userDec.decoration.effects,
      isOwned: true,
      purchasedAt: userDec.purchasedAt,
      isEquipped: userDec.isEquipped || false
    }));

    // Also get available decorations for purchase
    const availableDecorations = await Decoration.findAll({
      where: { is_active: true },
      order: [['rarity', 'DESC'], ['price_coins', 'ASC']]
    });

    const availableFormatted = availableDecorations.map(dec => ({
      id: dec.id,
      name: dec.name,
      description: dec.description,
      type: dec.type,
      category: dec.category,
      price_coins: dec.price_coins,
      price_gems: dec.price_gems,
      rarity: dec.rarity,
      image_url: dec.image_url,
      preview_url: dec.preview_url,
      is_featured: dec.is_featured,
      effects: dec.effects,
      isOwned: false,
      isEquipped: false
    }));

    // Combine owned and available decorations
    const allDecorations = [...formattedDecorations, ...availableFormatted];

    res.json({
      success: true,
      decorations: allDecorations,
      ownedCount: formattedDecorations.length,
      availableCount: availableFormatted.length
    });
  } catch (error) {
    console.error('Error fetching user decorations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user decorations' 
    });
  }
});

// Purchase profile decoration
router.post('/purchase', auth, async (req, res) => {
  try {
    const { decorationId, currency = 'coins' } = req.body;
    const userId = req.user.id;
    
    const client = await pool.connect();
    
    // Get decoration details
    const decorationResult = await client.query(`
      SELECT * FROM profile_decorations WHERE id = $1 AND is_active = true
    `, [decorationId]);
    
    if (decorationResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'Decoration not found'
      });
    }
    
    const decoration = decorationResult.rows[0];
    
    // Check if user can afford
    const userResult = await client.query(`
      SELECT coins, gems FROM users WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    const price = currency === 'gems' ? decoration.price_gems : decoration.price_coins;
    const userCurrency = currency === 'gems' ? user.gems : user.coins;
    
    if (userCurrency < price) {
      client.release();
      return res.status(400).json({
        success: false,
        message: `Insufficient ${currency}`
      });
    }
    
    // Check if user already owns this decoration
    const existingResult = await client.query(`
      SELECT id FROM user_profile_decorations 
      WHERE id = $1 AND decoration_id = $2
    `, [userId, decorationId]);
    
    if (existingResult.rows.length > 0) {
      client.release();
      return res.status(400).json({
        success: false,
        message: 'You already own this decoration'
      });
    }
    
    // Deduct currency and add decoration to user's inventory
    const newCurrency = userCurrency - price;
    
    await client.query(`
      UPDATE users SET ${currency} = $1 WHERE id = $2
    `, [newCurrency, userId]);
    
    // Add decoration to user's inventory
    await client.query(`
      INSERT INTO user_profile_decorations (id, decoration_id, acquired_at)
      VALUES ($1, $2, NOW())
    `, [userId, decorationId]);
    
    // Update decoration sold count
    await client.query(`
      UPDATE profile_decorations SET sold_count = sold_count + 1 WHERE id = $1
    `, [decorationId]);
    
    client.release();
    
    res.json({
      success: true,
      message: 'Decoration purchased successfully',
      decoration: decoration,
      newBalance: newCurrency
    });
    
  } catch (error) {
    console.error('Error purchasing decoration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase decoration'
    });
  }
});

// Equip profile decoration
router.post('/equip', auth, async (req, res) => {
  try {
    const { decorationId, slot } = req.body;
    const userId = req.user.id;
    
    const client = await pool.connect();
    
    // Check if user owns this decoration
    const ownershipResult = await client.query(`
      SELECT id FROM user_profile_decorations 
      WHERE id = $1 AND decoration_id = $2
    `, [userId, decorationId]);
    
    if (ownershipResult.rows.length === 0) {
      client.release();
      return res.status(400).json({
        success: false,
        message: 'You do not own this decoration'
      });
    }
    
    // Unequip other decorations in the same slot
    await client.query(`
      UPDATE user_profile_decorations 
      SET is_equipped = false, equipped_slot = NULL
      WHERE id = $1 AND equipped_slot = $2
    `, [userId, slot]);
    
    // Equip the selected decoration
    await client.query(`
      UPDATE user_profile_decorations 
      SET is_equipped = true, equipped_slot = $1
      WHERE id = $2 AND decoration_id = $3
    `, [slot, userId, decorationId]);
    
    client.release();
    
    res.json({
      success: true,
      message: 'Decoration equipped successfully'
    });
    
  } catch (error) {
    console.error('Error equipping decoration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to equip decoration'
    });
  }
});

// Unequip profile decoration
router.post('/unequip', auth, async (req, res) => {
  try {
    const { decorationId } = req.body;
    const userId = req.user.id;
    
    const client = await pool.connect();
    
    await client.query(`
      UPDATE user_profile_decorations 
      SET is_equipped = false, equipped_slot = NULL
      WHERE id = $1 AND decoration_id = $2
    `, [userId, decorationId]);
    
    client.release();
    
    res.json({
      success: true,
      message: 'Decoration unequipped successfully'
    });
    
  } catch (error) {
    console.error('Error unequipping decoration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unequip decoration'
    });
  }
});

// Get user's equipped decorations
router.get('/equipped', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT upd.*, pd.name, pd.description, pd.type, pd.category, pd.rarity, 
             pd.effects, pd.image_url, pd.preview_url
      FROM user_profile_decorations upd
      JOIN profile_decorations pd ON upd.decoration_id = pd.id
      WHERE upd.id = $1 AND upd.is_equipped = true
      ORDER BY pd.type, pd.category
    `, [userId]);
    
    client.release();
    
    res.json({
      success: true,
      equippedDecorations: result.rows
    });
  } catch (error) {
    console.error('Error fetching equipped decorations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipped decorations'
    });
  }
});

// Get decoration categories
router.get('/categories', async (req, res) => {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT category, COUNT(*) as count,
             COUNT(CASE WHEN rarity = 'legendary' THEN 1 END) as legendary_count,
             COUNT(CASE WHEN rarity = 'epic' THEN 1 END) as epic_count,
             COUNT(CASE WHEN rarity = 'rare' THEN 1 END) as rare_count
      FROM profile_decorations 
      WHERE is_active = true
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    client.release();
    
    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching decoration categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch decoration categories'
    });
  }
});

// Get featured decorations
router.get('/featured', async (req, res) => {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT * FROM profile_decorations 
      WHERE is_featured = true AND is_active = true 
      ORDER BY rarity DESC
      LIMIT 8
    `);
    
    client.release();
    
    res.json({
      success: true,
      featured: result.rows
    });
  } catch (error) {
    console.error('Error fetching featured decorations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured decorations'
    });
  }
});

// Search decorations
router.get('/search', async (req, res) => {
  try {
    const { q, category, rarity, minPrice, maxPrice } = req.query;
    
    let query = `
      SELECT * FROM profile_decorations 
      WHERE is_active = true
    `;
    const params = [];
    let paramCount = 0;
    
    if (q) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${q}%`);
    }
    
    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }
    
    if (rarity) {
      paramCount++;
      query += ` AND rarity = $${paramCount}`;
      params.push(rarity);
    }
    
    if (minPrice) {
      paramCount++;
      query += ` AND price_coins >= $${paramCount}`;
      params.push(parseInt(minPrice));
    }
    
    if (maxPrice) {
      paramCount++;
      query += ` AND price_coins <= $${paramCount}`;
      params.push(parseInt(maxPrice));
    }
    
    query += ` ORDER BY rarity DESC, price_coins ASC`;
    
    const client = await pool.connect();
    const result = await client.query(query, params);
    client.release();
    
    res.json({
      success: true,
      decorations: result.rows
    });
  } catch (error) {
    console.error('Error searching decorations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search decorations'
    });
  }
});

module.exports = router; 