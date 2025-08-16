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

// Get leaderboard
router.get('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { category = 'overall', period = 'weekly' } = req.query;
    
    let leaderboardData;
    
    if (category === 'overall') {
      // Overall leaderboard based on XP and level
      const result = await client.query(`
        SELECT 
          u.id,
          u.name,
          u.avatar,
          u.level,
          u.xp,
          u.coins,
          u.gems,
          u.streak,
          ROW_NUMBER() OVER (ORDER BY u.xp DESC, u.level DESC, u.streak DESC) as rank
        FROM users u
        WHERE u.isactive = true
        ORDER BY u.xp DESC, u.level DESC, u.streak DESC
        LIMIT 100
      `);
      
      leaderboardData = result.rows;
    } else if (category === 'tasks') {
      // Task completion leaderboard
      const result = await client.query(`
        SELECT 
          u.id,
          u.name,
          u.avatar,
          COUNT(t.id) as total_todos,
          COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_todos,
          ROW_NUMBER() OVER (ORDER BY COUNT(CASE WHEN t.status = 'done' THEN 1 END) DESC) as rank
        FROM users u
        LEFT JOIN todos t ON u.id = t.id
        WHERE u.isactive = true
        GROUP BY u.id, u.name, u.avatar
        ORDER BY completed_todos DESC
        LIMIT 100
      `);
      
      leaderboardData = result.rows;
    } else if (category === 'streak') {
      // Streak leaderboard
      const result = await client.query(`
        SELECT 
          u.id,
          u.name,
          u.avatar,
          u.streak,
          u.level,
          ROW_NUMBER() OVER (ORDER BY u.streak DESC, u.level DESC) as rank
        FROM users u
        WHERE u.isactive = true
        ORDER BY u.streak DESC, u.level DESC
        LIMIT 100
      `);
      
      leaderboardData = result.rows;
    } else if (category === 'study') {
      // Study time leaderboard
      const result = await client.query(`
        SELECT 
          u.id,
          u.name,
          u.avatar,
          u.total_study_time,
          u.total_focus_sessions,
          ROW_NUMBER() OVER (ORDER BY u.total_study_time DESC, u.total_focus_sessions DESC) as rank
        FROM users u
        WHERE u.isactive = true
        ORDER BY u.total_study_time DESC, u.total_focus_sessions DESC
        LIMIT 100
      `);
      
      leaderboardData = result.rows;
    }

    // Get user's rank
    let userRank = null;
    if (leaderboardData) {
      const userEntry = leaderboardData.find(entry => entry.id === req.id);
      if (userEntry) {
        userRank = userEntry.rank;
      }
    }

    res.json({
      success: true,
      leaderboard: leaderboardData || [],
      userRank,
      category,
      period
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: 'Error fetching leaderboard' });
  } finally {
    client.release();
  }
});

// Get user's ranking
router.get('/user-rank', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { category = 'overall' } = req.query;
    
    let userRank;
    
    if (category === 'overall') {
      const result = await client.query(`
        SELECT 
          ROW_NUMBER() OVER (ORDER BY u.xp DESC, u.level DESC, u.streak DESC) as rank
        FROM users u
        WHERE u.id = $1
      `, [req.id]);
      
      userRank = result.rows[0]?.rank || 0;
    } else if (category === 'tasks') {
      const result = await client.query(`
        SELECT 
          ROW_NUMBER() OVER (
            ORDER BY COUNT(CASE WHEN t.status = 'done' THEN 1 END) DESC
          ) as rank
        FROM users u
        LEFT JOIN todos t ON u.id = t.id
        WHERE u.id = $1
        GROUP BY u.id
      `, [req.id]);
      
      userRank = result.rows[0]?.rank || 0;
    } else if (category === 'streak') {
      const result = await client.query(`
        SELECT 
          ROW_NUMBER() OVER (ORDER BY u.streak DESC, u.level DESC) as rank
        FROM users u
        WHERE u.id = $1
      `, [req.id]);
      
      userRank = result.rows[0]?.rank || 0;
    }

    res.json({
      success: true,
      userRank,
      category
    });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({ success: false, message: 'Error fetching user rank' });
  } finally {
    client.release();
  }
});

module.exports = router;