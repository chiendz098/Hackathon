const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const config = require('../config');
const { auth } = require('../middleware/auth');

const pool = new Pool({
  connectionString: config.DB_URI,
  ssl: {
    rejectUnauthorized: false
  }
});

// Get all shop items
router.get('/items', async (req, res) => {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT * FROM shop_items 
      WHERE is_active = true 
      ORDER BY rarity DESC, price_coins ASC
    `);
    
    client.release();
    
    res.json({
      success: true,
      items: result.rows
    });
  } catch (error) {
    console.error('Error fetching shop items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop items'
    });
  }
});

// Get shop categories
router.get('/categories', async (req, res) => {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT * FROM shop_categories 
      WHERE is_active = true 
      ORDER BY sort_order ASC
    `);
    
    client.release();
    
    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching shop categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop categories'
    });
  }
});

// Get shop bundles
router.get('/bundles', async (req, res) => {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT * FROM shop_bundles 
      WHERE is_active = true 
      ORDER BY is_featured DESC, discount_percentage DESC
    `);
    
    client.release();
    
    res.json({
      success: true,
      bundles: result.rows
    });
  } catch (error) {
    console.error('Error fetching shop bundles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop bundles'
    });
  }
});

// Purchase item
router.post('/purchase', auth, async (req, res) => {
  try {
    const { itemId, currency = 'coins' } = req.body;
    const userId = req.user.id;
    
    const client = await pool.connect();
    
    // Get item details
    const itemResult = await client.query(`
      SELECT * FROM shop_items WHERE id = $1 AND is_active = true
    `, [itemId]);
    
    if (itemResult.rows.length === 0) {
      client.release();
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    const item = itemResult.rows[0];
    
    // Check if user can afford the item
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
    const price = currency === 'gems' ? item.price_gems : item.price_coins;
    const userCurrency = currency === 'gems' ? user.gems : user.coins;
    
    if (userCurrency < price) {
      client.release();
      return res.status(400).json({
        success: false,
        message: `Insufficient ${currency}`
      });
    }
    
    // Deduct currency and add item to user's inventory
    const newCurrency = userCurrency - price;
    
    await client.query(`
      UPDATE users SET ${currency} = $1 WHERE id = $2
    `, [newCurrency, userId]);
    
    // Record purchase
    await client.query(`
      INSERT INTO user_purchases (id, item_id, price_paid, currency_used, purchased_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [userId, itemId, price, currency]);
    
    // Update item sold count
    await client.query(`
      UPDATE shop_items SET sold_count = sold_count + 1 WHERE id = $1
    `, [itemId]);
    
    client.release();
    
    res.json({
      success: true,
      message: 'Purchase successful',
      item: item,
      newBalance: newCurrency
    });
    
  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process purchase'
    });
  }
});

// Purchase single item
router.post('/purchase-item', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { itemId, quantity = 1, currency = 'coins' } = req.body;
    
    // Get item details
    const itemResult = await client.query(`
      SELECT * FROM shop_items WHERE id = $1 AND is_active = true
    `, [itemId]);
    
    if (itemResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    const item = itemResult.rows[0];
    
    // Check if user has enough currency
    const userResult = await client.query(`
      SELECT coins, gems FROM users WHERE id = $1
    `, [req.userId]);
    
    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const totalCost = currency === 'gems' ? item.price_gems * quantity : item.price_coins * quantity;
    const userBalance = currency === 'gems' ? user.gems : user.coins;
    
    if (userBalance < totalCost) {
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient ${currency}. You need ${totalCost} ${currency}` 
      });
    }
    
    // Deduct currency from user
    if (currency === 'gems') {
      await client.query(`
        UPDATE users SET gems = gems - $1 WHERE id = $2
      `, [totalCost, req.userId]);
    } else {
      await client.query(`
        UPDATE users SET coins = coins - $1 WHERE id = $2
      `, [totalCost, req.userId]);
    }
    
    // Record purchase
    await client.query(`
      INSERT INTO user_purchases (
        user_id, item_id, quantity, price_paid_coins, price_paid_gems, purchased_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `, [
      req.userId,
      itemId,
      quantity,
      currency === 'coins' ? totalCost : 0,
      currency === 'gems' ? totalCost : 0
    ]);
    
    // Get updated user balance
    const updatedUserResult = await client.query(`
      SELECT coins, gems FROM users WHERE id = $1
    `, [req.userId]);
    
    const updatedUser = updatedUserResult.rows[0];
    
    res.json({
      success: true,
      message: `${item.name} purchased successfully!`,
      item: {
        id: item.id,
        name: item.name,
        type: item.type,
        effects: item.effects
      },
      quantity,
      totalCost,
      currency,
      newBalance: {
        coins: updatedUser.coins,
        gems: updatedUser.gems
      }
    });
    
  } catch (error) {
    console.error('Error purchasing item:', error);
    res.status(500).json({ success: false, message: 'Error purchasing item' });
  } finally {
    client.release();
  }
});

// Purchase entire cart
router.post('/purchase-cart', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { items } = req.body;
    
    if (!items || items.length === 0) {
      client.release();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    // Get user's current balance
    const userResult = await client.query(`
      SELECT coins, gems FROM users WHERE id = $1
    `, [req.userId]);
    
    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    let totalCoinsCost = 0;
    let totalGemsCost = 0;
    
    // Validate all items and calculate total cost
    for (const cartItem of items) {
      const itemResult = await client.query(`
        SELECT * FROM shop_items WHERE id = $1 AND is_active = true
      `, [cartItem.id]);
      
      if (itemResult.rows.length === 0) {
        client.release();
        return res.status(404).json({ 
          success: false, 
          message: `Item ${cartItem.id} not found` 
        });
      }
      
      const item = itemResult.rows[0];
      const itemCost = item.price_gems > 0 ? item.price_gems * cartItem.quantity : item.price_coins * cartItem.quantity;
      
      if (item.price_gems > 0) {
        totalGemsCost += itemCost;
      } else {
        totalCoinsCost += itemCost;
      }
    }
    
    // Check if user has enough currency
    if (user.coins < totalCoinsCost) {
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient coins. You need ${totalCoinsCost} coins` 
      });
    }
    
    if (user.gems < totalGemsCost) {
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient gems. You need ${totalGemsCost} gems` 
      });
    }
    
    // Deduct currency from user
    if (totalCoinsCost > 0) {
      await client.query(`
        UPDATE users SET coins = coins - $1 WHERE id = $2
      `, [totalCoinsCost, req.userId]);
    }
    
    if (totalGemsCost > 0) {
      await client.query(`
        UPDATE users SET gems = gems - $1 WHERE id = $2
      `, [totalGemsCost, req.userId]);
    }
    
    // Record all purchases
    for (const cartItem of items) {
      const itemResult = await client.query(`
        SELECT * FROM shop_items WHERE id = $1
      `, [cartItem.id]);
      
      const item = itemResult.rows[0];
      const itemCost = item.price_gems > 0 ? item.price_gems * cartItem.quantity : item.price_coins * cartItem.quantity;
      
      await client.query(`
        INSERT INTO user_purchases (
          user_id, item_id, quantity, price_paid_coins, price_paid_gems, purchased_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [
        req.userId,
        cartItem.id,
        cartItem.quantity,
        item.price_gems > 0 ? 0 : itemCost,
        item.price_gems > 0 ? itemCost : 0
      ]);
    }
    
    // Get updated user balance
    const updatedUserResult = await client.query(`
      SELECT coins, gems FROM users WHERE id = $1
    `, [req.userId]);
    
    const updatedUser = updatedUserResult.rows[0];
    
    res.json({
      success: true,
      message: `Cart purchased successfully! ${items.length} items purchased.`,
      itemsPurchased: items.length,
      totalCost: {
        coins: totalCoinsCost,
        gems: totalGemsCost
      },
      newBalance: {
        coins: updatedUser.coins,
        gems: updatedUser.gems
      }
    });
    
  } catch (error) {
    console.error('Error purchasing cart:', error);
    res.status(500).json({ success: false, message: 'Error purchasing cart' });
  } finally {
    client.release();
  }
});

// Get user's purchase history
router.get('/purchases', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT up.*, si.name as item_name, si.type as item_type, si.rarity
      FROM user_purchases up
      JOIN shop_items si ON up.item_id = si.id
      WHERE up.id = $1
      ORDER BY up.purchased_at DESC
    `, [userId]);
    
    client.release();
    
    res.json({
      success: true,
      purchases: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase history'
    });
  }
});

// Get featured items
router.get('/featured', async (req, res) => {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT * FROM shop_items 
      WHERE is_featured = true AND is_active = true 
      ORDER BY rarity DESC
      LIMIT 6
    `);
    
    client.release();
    
    res.json({
      success: true,
      featured: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching featured items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured items'
    });
  }
});

// Search items
router.get('/search', async (req, res) => {
  try {
    const { q, category, rarity, minPrice, maxPrice } = req.query;
    
    let query = `
      SELECT * FROM shop_items 
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
      items: result.rows
    });
    
  } catch (error) {
    console.error('Error searching items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search items'
    });
  }
});

// Apply item effects after purchase
router.post('/apply-item-effects', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { itemId, effects } = req.body;
    
    if (!effects) {
      client.release();
      return res.status(400).json({ success: false, message: 'No effects to apply' });
    }
    
    const effectsApplied = [];
    
    // Apply different types of effects
    for (const [effectType, effectValue] of Object.entries(effects)) {
      switch (effectType) {
        case 'theme':
          // Unlock theme for user
          await client.query(`
            UPDATE users 
            SET unlockedthemes = array_append(unlockedthemes, $1)
            WHERE id = $2 AND NOT ($1 = ANY(unlockedthemes))
          `, [effectValue, req.userId]);
          effectsApplied.push({ type: 'theme', value: effectValue });
          break;
          
        case 'xp_boost':
          // Apply XP boost (temporary effect)
          const boostExpiry = new Date(Date.now() + (effectValue.duration * 1000));
          await client.query(`
            INSERT INTO user_effects (
              user_id, effect_type, effect_value, expires_at, created_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, effect_type) 
            DO UPDATE SET effect_value = $3, expires_at = $4
          `, [req.userId, 'xp_boost', effectValue.xp_boost, boostExpiry]);
          effectsApplied.push({ type: 'xp_boost', value: effectValue.xp_boost, duration: effectValue.duration });
          break;
          
        case 'focus_boost':
          // Apply focus boost (temporary effect)
          const focusExpiry = new Date(Date.now() + (effectValue.duration * 1000));
          await client.query(`
            INSERT INTO user_effects (
              user_id, effect_type, effect_value, expires_at, created_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, effect_type) 
            DO UPDATE SET effect_value = $3, expires_at = $4
          `, [req.userId, 'focus_boost', effectValue.focus_boost, focusExpiry]);
          effectsApplied.push({ type: 'focus_boost', value: effectValue.focus_boost, duration: effectValue.duration });
          break;
          
        case 'pet_happiness':
          // Increase pet happiness
          await client.query(`
            UPDATE user_pets 
            SET current_stats = jsonb_set(
              current_stats, 
              '{happiness}', 
              (COALESCE((current_stats->>'happiness')::int, 100) + $1)::text::jsonb
            )
            WHERE user_id = $2 AND is_active = true
          `, [effectValue, req.userId]);
          effectsApplied.push({ type: 'pet_happiness', value: effectValue });
          break;
          
        case 'pet_energy':
          // Increase pet energy
          await client.query(`
            UPDATE user_pets 
            SET current_stats = jsonb_set(
              current_stats, 
              '{energy}', 
              (COALESCE((current_stats->>'energy')::int, 100) + $1)::text::jsonb
            )
            WHERE user_id = $2 AND is_active = true
          `, [effectValue, req.userId]);
          effectsApplied.push({ type: 'pet_energy', value: effectValue });
          break;
          
        case 'luck_boost':
          // Apply luck boost (temporary effect)
          const luckExpiry = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
          await client.query(`
            INSERT INTO user_effects (
              user_id, effect_type, effect_value, expires_at, created_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, effect_type) 
            DO UPDATE SET effect_value = $3, expires_at = $4
          `, [req.userId, 'luck_boost', effectValue, luckExpiry]);
          effectsApplied.push({ type: 'luck_boost', value: effectValue });
          break;
          
        case 'reward_quality':
          // Apply reward quality boost (temporary effect)
          const qualityExpiry = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
          await client.query(`
            INSERT INTO user_effects (
              user_id, effect_type, effect_value, expires_at, created_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, effect_type) 
            DO UPDATE SET effect_value = $3, expires_at = $4
          `, [req.userId, 'reward_quality', effectValue, qualityExpiry]);
          effectsApplied.push({ type: 'reward_quality', value: effectValue });
          break;
          
        default:
          // Unknown effect type
          console.log(`Unknown effect type: ${effectType}`);
      }
    }
    
    res.json({
      success: true,
      message: 'Item effects applied successfully!',
      effectsApplied
    });
    
  } catch (error) {
    console.error('Error applying item effects:', error);
    res.status(500).json({ success: false, message: 'Error applying item effects' });
  } finally {
    client.release();
  }
});

module.exports = router;
