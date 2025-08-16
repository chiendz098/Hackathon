const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.DB_URI,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware xác thực JWT
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.id = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
      }
    }

// Get daily rewards
router.get('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM daily_rewards 
      WHERE is_active = true 
      ORDER BY reward_amount DESC
    `);

    res.json({
      success: true,
      rewards: result.rows
    });
  } catch (error) {
    console.error('Error fetching daily rewards:', error);
    res.status(500).json({ success: false, message: 'Error fetching daily rewards' });
  } finally {
    client.release();
  }
});

// Claim daily reward
router.post('/:rewardId/claim', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rewardId } = req.params;
    
    // Check if user already claimed today
    const todayClaimResult = await client.query(`
      SELECT COUNT(*) as count FROM user_daily_rewards 
      WHERE id = $1 AND claimed_at >= CURRENT_DATE
    `, [req.id]);

    if (parseInt(todayClaimResult.rows[0].count) > 0) {
      client.release();
      return res.status(400).json({ success: false, message: 'Already claimed today' });
    }

    // Get reward details
    const rewardResult = await client.query(`
      SELECT * FROM daily_rewards WHERE id = $1 AND is_active = true
    `, [rewardId]);

    if (rewardResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }

    const reward = rewardResult.rows[0];

    // Award reward
    if (reward.reward_type === 'coins') {
      await client.query(`
        UPDATE users 
        SET coins = coins + $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [reward.reward_amount, req.id]);
    } else if (reward.reward_type === 'gems') {
      await client.query(`
        UPDATE users 
        SET gems = gems + $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [reward.reward_amount, req.id]);
    }

    // Record the claim
    await client.query(`
      INSERT INTO user_daily_rewards (id, reward_id, claimedAt, streakDay)
      VALUES ($1, $2, CURRENT_TIMESTAMP, 1)
    `, [req.id, rewardId]);

    // Update user streak
    await client.query(`
      UPDATE users 
      SET streak = streak + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [req.id]);

    res.json({
      success: true,
      message: `Claimed ${reward.reward_amount} ${reward.reward_type}!`,
      reward: {
        type: reward.reward_type,
        amount: reward.reward_amount
      }
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    res.status(500).json({ success: false, message: 'Error claiming reward' });
  } finally {
    client.release();
  }
});

// Get user's daily reward status
router.get('/status', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    // Check if user claimed today
    const todayClaimResult = await client.query(`
      SELECT COUNT(*) as count FROM user_daily_rewards 
      WHERE id = $1 AND claimed_at >= CURRENT_DATE
    `, [req.id]);

    const claimedToday = parseInt(todayClaimResult.rows[0].count) > 0;

    // Get user's current streak
    const userResult = await client.query(`
      SELECT streak FROM users WHERE id = $1
    `, [req.id]);

    const currentStreak = userResult.rows[0]?.streak || 0;

    // Get available rewards
    const rewardsResult = await client.query(`
      SELECT * FROM daily_rewards 
      WHERE is_active = true 
      ORDER BY reward_amount ASC
    `);

    res.json({
      success: true,
      claimedToday,
      currentStreak,
      availableRewards: rewardsResult.rows,
      nextReward: rewardsResult.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching daily reward status:', error);
    res.status(500).json({ success: false, message: 'Error fetching daily reward status' });
  } finally {
    client.release();
  }
});

module.exports = router;
