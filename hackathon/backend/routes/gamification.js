const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Pool } = require('pg');
const config = require('../config/config.json');

const pool = new Pool({
  host: config.development.host,
  port: config.development.port,
  database: config.development.database,
  user: config.development.username,
  password: config.development.password,
  ssl: { rejectUnauthorized: false }
});

async function ensureGamificationTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(255),
        xpreward INTEGER DEFAULT 0,
        coinreward INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
        unlocked_at TIMESTAMP DEFAULT NOW(),
        UNIQUE ("userId", achievement_id)
      );
    `);

    // Create activity_feeds table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_feeds (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "activityType" VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        visibility VARCHAR(20) DEFAULT 'friends',
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        "contextType" VARCHAR(20) DEFAULT 'individual',
        "contextId" INTEGER,
        "relatedUserId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
        "relatedEntityType" VARCHAR(50),
        "relatedEntityId" INTEGER,
        priority VARCHAR(20) DEFAULT 'normal',
        "xpAwarded" INTEGER DEFAULT 0,
        "badgesEarned" JSONB DEFAULT '[]',
        tags JSONB DEFAULT '[]',
        location VARCHAR(255),
        "isHighlighted" BOOLEAN DEFAULT false,
        "isPinned" BOOLEAN DEFAULT false,
        "isArchived" BOOLEAN DEFAULT false,
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed defaults if empty
    const countRes = await client.query('SELECT COUNT(*)::int AS count FROM achievements');
    if ((countRes.rows[0]?.count || 0) === 0) {
      await client.query(
        `INSERT INTO achievements (name, description, icon, xpreward, coinreward) VALUES 
        ('First Task', 'Hoàn thành task đầu tiên', '🎯', 50, 10),
        ('5 Tasks', 'Hoàn thành 5 task', '🏅', 150, 30),
        ('Focus Starter', 'Hoàn thành phiên tập trung đầu tiên', '⏱️', 100, 20)`
      );
    }
  } finally {
    client.release();
  }
}

ensureGamificationTables().catch(() => {});

// Get user progress
router.get('/progress', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;

    // Get user's gamification data
    const userQuery = `
      SELECT 
        u.id,
        u.name as username,
        u.email,
        u.level,
        u.xp,
        u.coins,
        u.avatar,
        u.avatarframe as avatarFrame,
        u.badges,
        u.achievements
      FROM users u
      WHERE u.id = $1
    `;
    
    const userResult = await client.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    
    // Get user's todo statistics with completion dates
    const todoStatsQuery = `
      SELECT 
        COUNT(*) as total_todos,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_todos,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as done_todos,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_todos,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_todos,
        COUNT(CASE WHEN status = 'done' AND "completedAt" IS NOT NULL THEN 1 END) as completed_with_date
      FROM todos
      WHERE "userId" = $1
    `;
    
    const todoStatsResult = await client.query(todoStatsQuery, [userId]);
    const todoStats = todoStatsResult.rows[0];
    
    // Get user's achievements count
    const achievementsCountQuery = `
      SELECT COUNT(*)::int as count FROM user_achievements WHERE "userId" = $1
    `;
    const achievementsCountRes = await client.query(achievementsCountQuery, [userId]);

    // Calculate Study Streak - Simplified and more reliable logic
    let streak = 0;
    try {
      // Get all completed dates for the user
      const completedDatesQuery = `
        SELECT DISTINCT DATE("completedAt") as completion_date
        FROM todos 
        WHERE "userId" = $1 
          AND status = 'done' 
          AND "completedAt" IS NOT NULL
        ORDER BY completion_date DESC
      `;
      
      const completedDatesResult = await client.query(completedDatesQuery, [userId]);
      const completedDates = completedDatesResult.rows.map(row => row.completion_date);
      
      if (completedDates.length > 0) {
        // Check if user has completed todos today
        const today = new Date().toISOString().split('T')[0];
        const hasToday = completedDates.some(date => date === today);
        
        if (hasToday) {
          streak = 1;
          let checkDate = new Date(today);
          
          // Count consecutive days backwards
          while (true) {
            checkDate.setDate(checkDate.getDate() - 1);
            const checkDateStr = checkDate.toISOString().split('T')[0];
            
            if (completedDates.some(date => date === checkDateStr)) {
              streak++;
            } else {
              break;
            }
          }
        }
      }
    } catch (streakError) {
      console.log('Streak calculation error, using fallback:', streakError.message);
      // Fallback: simple count of recent completed todos
      const fallbackStreakQuery = `
        SELECT COUNT(DISTINCT DATE("completedAt")) as streak
        FROM todos 
        WHERE "userId" = $1 
          AND status = 'done' 
          AND "completedAt" IS NOT NULL
          AND "completedAt" >= CURRENT_DATE - INTERVAL '7 days'
      `;
      const fallbackResult = await client.query(fallbackStreakQuery, [userId]);
      streak = parseInt(fallbackResult.rows[0]?.streak || 0);
    }

    // Calculate total study time from todos and focus sessions
    const studyTimeQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN "actualTime" IS NOT NULL THEN "actualTime" ELSE 0 END), 0) as total_actual_time,
        COALESCE(SUM(CASE WHEN status = 'done' AND "completedAt" IS NOT NULL THEN 
          EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) / 60
        ELSE 0 END), 0) as total_completion_time
      FROM todos 
      WHERE "userId" = $1
    `;
    
    const studyTimeResult = await client.query(studyTimeQuery, [userId]);
    const studyTimeData = studyTimeResult.rows[0];
    
    // Get focus sessions count and time
    const focusSessionsQuery = `
      SELECT 
        COUNT(*) as session_count,
        COALESCE(SUM(duration), 0) as total_duration
      FROM focus_sessions 
      WHERE "userId" = $1
    `;
    
    let focusSessions = 0;
    let focusSessionsTime = 0;
    try {
      const focusResult = await client.query(focusSessionsQuery, [userId]);
      focusSessions = parseInt(focusResult.rows[0]?.session_count || 0);
      focusSessionsTime = parseInt(focusResult.rows[0]?.total_duration || 0);
    } catch (focusError) {
      console.log('Focus sessions query error:', focusError.message);
    }

    // Calculate total study time (in minutes)
    const totalStudyTime = Math.round(
      (studyTimeData.total_actual_time || 0) + 
      (studyTimeData.total_completion_time || 0) + 
      (focusSessionsTime || 0)
    );

    // Calculate progress percentages
    const totalTodos = todoStats.total_todos || 0;
    const completionRate = totalTodos > 0 ? Math.round((todoStats.done_todos / totalTodos) * 100) : 0;
    
    // Calculate level progress
    const currentLevel = user.level || 1;
    const currentXP = user.xp || 0;
    const xpForNextLevel = currentLevel * 100; // Simple XP calculation
    const levelProgress = Math.min(Math.round((currentXP / xpForNextLevel) * 100), 100);
    
    const progress = {
      level: user.level || 1,
      xp: user.xp || 0,
      coins: user.coins || 0,
      streak: streak,
      totalTodos: totalTodos,
      completedTodos: todoStats.done_todos || 0,
      completionRate: completionRate,
      nextLevelXp: xpForNextLevel,
      totalStudyTime: totalStudyTime,
      focusSessions: focusSessions,
      achievementsCount: achievementsCountRes.rows[0]?.count || 0
    };

    res.json({
      success: true,
      progress
    });
    
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user progress',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const leaderboardQuery = `
      SELECT 
        u.id,
        u.name as username,
        u.level,
        u.xp,
        u.coins,
        u.streak,
        u.avatar,
        COUNT(t.id) as total_todos,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_todos
      FROM users u
      LEFT JOIN todos t ON u.id = t."userId"
      GROUP BY u.id, u.name, u.level, u.xp, u.coins, u.streak, u.avatar
      ORDER BY u.xp DESC, u.level DESC, completed_todos DESC
      LIMIT 20
    `;
    
    const result = await client.query(leaderboardQuery);

    res.json({
      success: true,
      leaderboard: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get recent achievements
router.get('/recent-achievements', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const achievementsQuery = `
      SELECT 
        a.id,
        a.name,
        a.description,
        a.icon,
        a.xpreward as xp_reward,
        a.coinreward as coin_reward,
        ua.unlocked_at,
        u.name as username
      FROM user_achievements ua
      INNER JOIN achievements a ON ua.achievement_id = a.id
      INNER JOIN users u ON ua."userId" = u.id
      ORDER BY ua.unlocked_at DESC
      LIMIT 20
    `;
    
    const result = await client.query(achievementsQuery);

    res.json({
      success: true,
      data: {
        achievements: result.rows
      }
    });
    
  } catch (error) {
    console.error('Error fetching recent achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent achievements',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get gamification stats
router.get('/stats', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as active_students,
        COUNT(t.id) as study_sessions,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) as tasks_completed,
        COUNT(ua.id) as achievements
      FROM users u
      LEFT JOIN todos t ON u.id = t."userId"
      LEFT JOIN user_achievements ua ON u.id = ua."userId"
      WHERE u.role = 'student'
    `;
    
    const result = await client.query(statsQuery);
    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        activeStudents: parseInt(stats.active_students) || 0,
        studySessions: parseInt(stats.study_sessions) || 0,
        tasksCompleted: parseInt(stats.tasks_completed) || 0,
        achievements: parseInt(stats.achievements) || 0,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gamification stats',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Award XP to user
router.post('/award-xp', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('🎯 Award XP request received:', {
      body: req.body,
      userId: req.user.id,
      headers: req.headers
    });
    
    const { amount, reason, taskId } = req.body;
    const userId = req.user.id;

    console.log('🎯 Validating XP amount:', { amount, reason, taskId });
    
    if (!amount || amount <= 0) {
      console.log('❌ Invalid XP amount:', amount);
      return res.status(400).json({
        success: false,
        message: 'Invalid XP amount'
      });
    }

    console.log('🎯 Updating user XP in database:', { userId, amount });
    
    // Update user's XP
    const updateQuery = `
      UPDATE users 
      SET xp = COALESCE(xp, 0) + $1,
          level = CASE 
            WHEN (COALESCE(xp, 0) + $1) >= (COALESCE(level, 1) * 100) 
            THEN COALESCE(level, 1) + 1 
            ELSE COALESCE(level, 1) 
          END
      WHERE id = $2
      RETURNING xp, level
    `;
    
    console.log('🎯 Executing query:', updateQuery);
    const result = await client.query(updateQuery, [amount, userId]);
    console.log('🎯 Query result:', result.rows);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { xp, level } = result.rows[0];

    res.json({
      success: true,
      data: {
        xp,
        level,
        awarded: amount,
        reason,
        taskId
      }
    });
    
  } catch (error) {
    console.error('Error awarding XP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award XP',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Spend coins
router.post('/spend-coins', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { amount, item, itemType } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coin amount'
      });
    }

    // Check if user has enough coins
    const userQuery = `SELECT coins FROM users WHERE id = $1`;
    const userResult = await client.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentCoins = userResult.rows[0].coins || 0;
    
    if (currentCoins < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient coins'
      });
    }

    // Update user's coins
    const updateQuery = `
      UPDATE users 
      SET coins = coins - $1
      WHERE id = $2
      RETURNING coins
    `;
    
    const result = await client.query(updateQuery, [amount, userId]);
    const newCoins = result.rows[0].coins;

    res.json({
      success: true,
      data: {
        coins: newCoins,
        spent: amount,
        item,
        itemType
      }
    });
    
  } catch (error) {
    console.error('Error spending coins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to spend coins',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Spin daily wheel
router.post('/spin-wheel', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Check if user already spun today
    const checkQuery = `
      SELECT lastdailyreward 
      FROM users 
      WHERE id = $1
    `;
    
    const checkResult = await client.query(checkQuery, [userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const lastReward = checkResult.rows[0].lastdailyreward;
    
    if (lastReward && lastReward.toISOString().split('T')[0] === today) {
      return res.status(400).json({
        success: false,
        message: 'Already spun today'
      });
    }

    // Generate random reward
    const rewards = [
      { type: 'xp', amount: 50, probability: 0.4 },
      { type: 'coins', amount: 100, probability: 0.3 },
      { type: 'xp', amount: 100, probability: 0.2 },
      { type: 'coins', amount: 200, probability: 0.1 }
    ];

    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedReward = rewards[0];

    for (const reward of rewards) {
      cumulativeProbability += reward.probability;
      if (random <= cumulativeProbability) {
        selectedReward = reward;
        break;
      }
    }

    // Update user's rewards
    let updateQuery;
    if (selectedReward.type === 'xp') {
      updateQuery = `
        UPDATE users 
        SET xp = COALESCE(xp, 0) + $1,
            lastdailyreward = $2,
            dailystreak = COALESCE(dailystreak, 0) + 1
        WHERE id = $3
        RETURNING xp, dailystreak
      `;
    } else {
      updateQuery = `
        UPDATE users 
        SET coins = COALESCE(coins, 0) + $1,
            lastdailyreward = $2,
            dailystreak = COALESCE(dailystreak, 0) + 1
        WHERE id = $3
        RETURNING coins, dailystreak
      `;
    }
    
    const result = await client.query(updateQuery, [selectedReward.amount, today, userId]);
    const userData = result.rows[0];

    res.json({
      success: true,
      data: {
        reward: selectedReward,
        streak: userData.dailystreak,
        [selectedReward.type]: userData[selectedReward.type]
      }
    });
    
  } catch (error) {
    console.error('Error spinning daily wheel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to spin daily wheel',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Feed pet
router.post('/feed-pet', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;

    // Simple pet feeding - just award some XP
    const xpReward = 10;
    
    const updateQuery = `
      UPDATE users 
      SET xp = COALESCE(xp, 0) + $1
      WHERE id = $2
      RETURNING xp
    `;
    
    const result = await client.query(updateQuery, [xpReward, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newXp = result.rows[0].xp;

    res.json({
      success: true,
      data: {
        xp: newXp,
        fed: true,
        message: 'Pet fed successfully!'
      }
    });
    
  } catch (error) {
    console.error('Error feeding pet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to feed pet',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get all achievements with earned status for current user
router.get('/achievements', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;

    // Fetch all achievements
    const achievementsQuery = `
      SELECT 
        a.id,
        a.name,
        a.description,
        a.icon,
        a.xpreward as xp_reward,
        a.coinreward as coin_reward,
        CASE WHEN ua.achievement_id IS NULL THEN false ELSE true END AS earned,
        ua.unlocked_at
      FROM achievements a
      LEFT JOIN user_achievements ua 
        ON ua.achievement_id = a.id AND ua."userId" = $1
      ORDER BY a.id ASC
    `;

    const { rows } = await client.query(achievementsQuery, [userId]);

    // Transform the data to match frontend expectations
    const transformedAchievements = rows.map(achievement => ({
      ...achievement,
      rewards: {
        xp: achievement.xp_reward || 0,
        coins: achievement.coin_reward || 0,
        gems: 0 // Default value for gems
      }
    }));

    res.json({
      success: true,
      achievements: transformedAchievements
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get daily challenges
router.get('/daily-challenges', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Check if user already completed today's challenge
    const checkQuery = `
      SELECT lastdailyreward 
      FROM users 
      WHERE id = $1
    `;
    
    const checkResult = await client.query(checkQuery, [userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const lastReward = checkResult.rows[0].lastdailyreward;
    const alreadyCompleted = lastReward && lastReward.toISOString().split('T')[0] === today;

    // Generate today's challenge based on date for consistency
    const dateSeed = new Date(today).getTime();
    const challengeTypes = [
      {
        type: 'complete_todos',
        title: 'Task Master',
        description: 'Complete 3 tasks today',
        target: 3,
        reward: { xp: 50, coins: 20 },
        icon: '✅'
      },
      {
        type: 'study_time',
        title: 'Study Warrior',
        description: 'Study for 60 minutes today',
        target: 60,
        reward: { xp: 75, coins: 30 },
        icon: '📚'
      },
      {
        type: 'focus_sessions',
        title: 'Focus Champion',
        description: 'Complete 2 focus sessions today',
        target: 2,
        reward: { xp: 60, coins: 25 },
        icon: '🎯'
      },
      {
        type: 'streak_maintenance',
        title: 'Streak Keeper',
        description: 'Maintain your daily streak',
        target: 1,
        reward: { xp: 40, coins: 15 },
        icon: '🔥'
      }
    ];

    // Use date to select consistent challenge for the day
    const challengeIndex = Math.floor(dateSeed / (1000 * 60 * 60 * 24)) % challengeTypes.length;
    const dailyChallenge = challengeTypes[challengeIndex];

    // Get user's progress for today
    let progress = 0;
    let completed = false;

    if (dailyChallenge.type === 'complete_todos') {
      const progressQuery = `
        SELECT COUNT(*)::int as count 
        FROM todos 
        WHERE "userId" = $1 
        AND status = 'done' 
        AND DATE(created_at) = $2
      `;
      const progressResult = await client.query(progressQuery, [userId, today]);
      progress = progressResult.rows[0].count;
      completed = progress >= dailyChallenge.target;
    } else if (dailyChallenge.type === 'study_time') {
      // For study time, we'll use a placeholder since we don't have detailed time tracking yet
      progress = 0;
      completed = false;
    } else if (dailyChallenge.type === 'focus_sessions') {
      // For focus sessions, we'll use a placeholder
      progress = 0;
      completed = false;
    } else if (dailyChallenge.type === 'streak_maintenance') {
      const userQuery = `SELECT streak FROM users WHERE id = $1`;
      const userResult = await client.query(userQuery, [userId]);
      progress = userResult.rows[0]?.streak || 0;
      completed = progress > 0;
    }

    res.json({
      success: true,
      challenge: {
        ...dailyChallenge,
        progress,
        completed: alreadyCompleted || completed,
        alreadyCompleted,
        date: today
      }
    });
    
  } catch (error) {
    console.error('Error fetching daily challenges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily challenges',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Track study progress
router.post('/track-study', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { type, duration, todoId, sessionType } = req.body;
    
    if (!type || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Type and duration are required'
      });
    }

    if (type === 'focus_session') {
      // Create focus session record
      const focusSessionQuery = `
        INSERT INTO focus_sessions (
          "userId", "todoId", "sessionType", "plannedDuration", 
          "actualDuration", "duration", "startTime", "endTime", 
          "status", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $4, $4, NOW(), NOW(), 'completed', NOW(), NOW())
        RETURNING id
      `;
      
      await client.query(focusSessionQuery, [
        userId, 
        todoId || null, 
        sessionType || 'pomodoro', 
        duration
      ]);
      
      console.log(`✅ Focus session tracked: ${duration} minutes for user ${userId}`);
    }

    // Update user's total study time
    const updateUserQuery = `
      UPDATE users 
      SET 
        total_study_time = COALESCE(total_study_time, 0) + $1,
        total_focus_sessions = COALESCE(total_focus_sessions, 0) + $2,
        updated_at = NOW()
      WHERE id = $3
    `;
    
    const focusSessionsIncrement = type === 'focus_session' ? 1 : 0;
    await client.query(updateUserQuery, [duration, focusSessionsIncrement, userId]);

    res.json({
      success: true,
      message: 'Study progress tracked successfully'
    });
    
  } catch (error) {
    console.error('Error tracking study progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track study progress',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Update streak when todo is completed
router.post('/update-streak', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { todoId } = req.body;
    
    if (!todoId) {
      return res.status(400).json({
        success: false,
        message: 'Todo ID is required'
      });
    }

    // Get the completed todo to check completion date
    const todoQuery = `
      SELECT "completedAt", "createdAt"
      FROM todos 
      WHERE id = $1 AND "userId" = $2 AND status = 'done'
    `;
    
    const todoResult = await client.query(todoQuery, [todoId, userId]);
    
    if (todoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Completed todo not found'
      });
    }

    const todo = todoResult.rows[0];
    const completionDate = new Date(todo.completedAt);
    const today = new Date();
    
    // Check if this is the first completion today
    const todayCompletionsQuery = `
      SELECT COUNT(*) as count
      FROM todos 
      WHERE "userId" = $1 
        AND status = 'done' 
        AND DATE("completedAt") = DATE($2)
        AND id != $3
    `;
    
    const todayCompletionsResult = await client.query(todayCompletionsQuery, [
      userId, 
      completionDate, 
      todoId
    ]);
    
    const isFirstToday = parseInt(todayCompletionsResult.rows[0]?.count || 0) === 0;
    
    if (isFirstToday) {
      // Update streak logic
      const lastCompletionQuery = `
        SELECT "completedAt"
        FROM todos 
        WHERE "userId" = $1 
          AND status = 'done' 
          AND id != $2
        ORDER BY "completedAt" DESC
        LIMIT 1
      `;
      
      const lastCompletionResult = await client.query(lastCompletionQuery, [userId, todoId]);
      const lastCompletion = lastCompletionResult.rows[0]?.completedAt;
      
      if (lastCompletion) {
        const lastDate = new Date(lastCompletion);
        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day, increment streak
          const updateStreakQuery = `
            UPDATE users 
            SET streak = COALESCE(streak, 0) + 1, updated_at = NOW()
            WHERE id = $1
          `;
          await client.query(updateStreakQuery, [userId]);
          console.log(`🔥 Streak incremented for user ${userId}`);
        } else if (daysDiff > 1) {
          // Break in streak, reset to 1
          const resetStreakQuery = `
            UPDATE users 
            SET streak = 1, updated_at = NOW()
            WHERE id = $1
          `;
          await client.query(resetStreakQuery, [userId]);
          console.log(`🔄 Streak reset to 1 for user ${userId}`);
        }
      } else {
        // First completion ever, set streak to 1
        const setInitialStreakQuery = `
          UPDATE users 
          SET streak = 1, updated_at = NOW()
          WHERE id = $1
        `;
        await client.query(setInitialStreakQuery, [userId]);
        console.log(`🎯 Initial streak set to 1 for user ${userId}`);
      }
    }

    res.json({
      success: true,
      message: 'Streak updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update streak',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
