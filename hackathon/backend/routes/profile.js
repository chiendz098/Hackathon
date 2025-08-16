const express = require('express');
const router = express.Router();
const { User, UserProfile, UserProgress, Achievement, UserAchievement, Friendship, ActivityFeed } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get user's own profile (alias for /me)
router.get('/', auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({
      where: { userId: req.userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'created_at']
        }
      ]
    });

    if (!profile) {
      // Create default profile if doesn't exist
      const newProfile = await UserProfile.create({
        userId: req.userId,
        displayName: req.user?.name || 'User'
      });
      
      return res.json({
        success: true,
        profile: newProfile
      });
    }

    // Get additional stats
    const userProgress = await UserProgress.findOne({
      where: { userId: req.userId }
    });

    const achievementsCount = await UserAchievement.count({
      where: { userId: req.userId }
    });

    const friendsCount = await Friendship.count({
      where: {
        [Op.or]: [
          { requesterId: req.userId },
          { addresseeId: req.userId }
        ],
        status: 'accepted'
      }
    });

    res.json({
      success: true,
      profile: {
        ...profile.toJSON(),
        stats: {
          ...userProgress?.toJSON(),
          achievementsCount,
          friendsCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get user's own profile
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({
      where: { userId: req.userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'created_at']
        }
      ]
    });

    if (!profile) {
      // Create default profile if doesn't exist
      const newProfile = await UserProfile.create({
        userId: req.userId,
        displayName: req.user?.name || 'User'
      });
      
      return res.json({
        success: true,
        profile: newProfile
      });
    }

    // Get additional stats
    const userProgress = await UserProgress.findOne({
      where: { userId: req.userId }
    });

    const achievementsCount = await UserAchievement.count({
      where: { userId: req.userId }
    });

    const friendsCount = await Friendship.count({
      where: {
        [Op.or]: [
          { requesterId: req.userId },
          { addresseeId: req.userId }
        ],
        status: 'accepted'
      }
    });

    res.json({
      success: true,
      profile: {
        ...profile.toJSON(),
        stats: {
          ...userProgress?.toJSON(),
          achievementsCount,
          friendsCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get user profile by ID
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.userId;

    const profile = await UserProfile.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'created_at']
        }
      ]
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Check privacy settings
    const isOwnProfile = userId == requesterId;
    const friendship = await Friendship.findFriendship(requesterId, userId);
    const isFriend = friendship && friendship.status === 'accepted';

    // Determine what data to show based on privacy settings
    let profileData = profile.toJSON();
    
    if (!isOwnProfile) {
      // Increment profile views
      await profile.incrementProfileViews();

      // Apply privacy filters
      if (profile.privacySettings.profileVisibility === 'private') {
        return res.status(403).json({
          success: false,
          message: 'Profile is private'
        });
      }

      if (profile.privacySettings.profileVisibility === 'friends' && !isFriend) {
        // Show limited profile info
        profileData = {
          userId: profile.userId,
          displayName: profile.displayName,
          avatar: profile.avatar,
          bio: profile.bio,
          isVerified: profile.isVerified,
          user: profile.user
        };
      }

      // Filter stats based on privacy settings
      if (!profile.privacySettings.showStats && !isFriend) {
        delete profileData.showcaseStats;
      }

      if (!profile.privacySettings.showAchievements && !isFriend) {
        delete profileData.favoriteAchievements;
      }
    }

    // Get additional data if allowed
    let additionalData = {};
    
    if (isOwnProfile || profile.privacySettings.showStats || isFriend) {
      const userProgress = await UserProgress.findOne({
        where: { userId }
      });

      const achievementsCount = await UserAchievement.count({
        where: { userId }
      });

      const friendsCount = await Friendship.count({
        where: {
          [Op.or]: [
            { requesterId: userId },
            { addresseeId: userId }
          ],
          status: 'accepted'
        }
      });

      additionalData.stats = {
        ...userProgress?.toJSON(),
        achievementsCount,
        friendsCount
      };
    }

    // Get friendship status
    additionalData.friendshipStatus = friendship ? friendship.status : null;
    additionalData.canSendFriendRequest = !friendship && !isOwnProfile;

    res.json({
      success: true,
      profile: {
        ...profileData,
        ...additionalData
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update user profile
router.put('/', auth, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.userId;
    const updateData = { ...req.body };

    // Handle avatar upload
    if (req.file) {
      updateData.avatar = req.file.filename;
    }

    // Find or create profile
    let profile = await UserProfile.findOne({
      where: { userId }
    });

    if (!profile) {
      profile = await UserProfile.create({
        userId,
        displayName: req.user?.name || 'User',
        ...updateData
      });
    } else {
      await profile.update(updateData);
    }

    res.json({
      success: true,
      profile,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Upload profile avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    let profile = await UserProfile.findOne({
      where: { userId: req.userId }
    });

    if (!profile) {
      profile = await UserProfile.create({
        userId: req.userId
      });
    }

    const avatarUrl = `/uploads/profiles/${req.file.filename}`;
    await profile.update({ avatar: avatarUrl });

    res.json({
      success: true,
      avatarUrl,
      message: 'Avatar uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Upload cover image
router.post('/cover', auth, upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    let profile = await UserProfile.findOne({
      where: { userId: req.userId }
    });

    if (!profile) {
      profile = await UserProfile.create({
        userId: req.userId
      });
    }

    const coverUrl = `/uploads/profiles/${req.file.filename}`;
    await profile.update({ coverImage: coverUrl });

    res.json({
      success: true,
      coverUrl,
      message: 'Cover image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading cover image:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Search profiles
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const profiles = await UserProfile.searchProfiles(query, parseInt(limit));

    // Filter out private profiles and add friendship status
    const enhancedProfiles = await Promise.all(
      profiles.map(async (profile) => {
        const friendship = await Friendship.findFriendship(req.userId, profile.userId);
        
        return {
          ...profile.toJSON(),
          friendshipStatus: friendship ? friendship.status : null,
          canSendFriendRequest: !friendship && profile.userId !== req.userId
        };
      })
    );

    res.json({
      success: true,
      profiles: enhancedProfiles,
      total: enhancedProfiles.length
    });

  } catch (error) {
    console.error('Error searching profiles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get user's activity feed
router.get('/:userId/activity', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Check if user can view this activity feed
    const profile = await UserProfile.findOne({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const isOwnProfile = userId == req.userId;
    const friendship = await Friendship.findFriendship(req.userId, userId);
    const isFriend = friendship && friendship.status === 'accepted';

    if (!isOwnProfile && profile.privacySettings.profileVisibility === 'private') {
      return res.status(403).json({
        success: false,
        message: 'Activity feed is private'
      });
    }

    if (!isOwnProfile && profile.privacySettings.profileVisibility === 'friends' && !isFriend) {
      return res.status(403).json({
        success: false,
        message: 'Activity feed is only visible to friends'
      });
    }

    const activities = await ActivityFeed.getUserFeed(userId, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      activities,
      hasMore: activities.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update online status
router.post('/status', auth, async (req, res) => {
  try {
    const { status, message } = req.body;

    let profile = await UserProfile.findOne({
      where: { userId: req.userId }
    });

    if (!profile) {
      profile = await UserProfile.create({
        userId: req.userId
      });
    }

    await profile.setOnlineStatus(status, message);

    res.json({
      success: true,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get showcase achievements
router.get('/:userId/achievements', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await UserProfile.findOne({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Check privacy settings
    const isOwnProfile = userId == req.userId;
    const friendship = await Friendship.findFriendship(req.userId, userId);
    const isFriend = friendship && friendship.status === 'accepted';

    if (!isOwnProfile && !profile.privacySettings.showAchievements && !isFriend) {
      return res.status(403).json({
        success: false,
        message: 'Achievements are private'
      });
    }

    // Get user's achievements
    const userAchievements = await UserAchievement.findAll({
      where: { userId },
      include: [{
        model: Achievement,
        as: 'achievement'
      }],
      order: [['earnedAt', 'DESC']]
    });

    // Get favorite achievements if specified
    const favoriteAchievements = profile.favoriteAchievements || [];
    const showcaseAchievements = userAchievements.filter(ua =>
      favoriteAchievements.includes(ua.achievementId)
    );

    res.json({
      success: true,
      achievements: userAchievements,
      showcaseAchievements,
      totalCount: userAchievements.length
    });

  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update favorite achievements
router.put('/me/achievements/favorites', auth, async (req, res) => {
  try {
    const { achievementIds } = req.body;

    if (!Array.isArray(achievementIds) || achievementIds.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid achievement IDs or too many favorites (max 5)'
      });
    }

    let profile = await UserProfile.findOne({
      where: { userId: req.userId }
    });

    if (!profile) {
      profile = await UserProfile.create({
        userId: req.userId
      });
    }

    // Verify user owns these achievements
    const userAchievements = await UserAchievement.findAll({
      where: {
        userId: req.userId,
        achievementId: { [Op.in]: achievementIds }
      }
    });

    const validAchievementIds = userAchievements.map(ua => ua.achievementId);

    await profile.update({
      favoriteAchievements: validAchievementIds
    });

    res.json({
      success: true,
      favoriteAchievements: validAchievementIds,
      message: 'Favorite achievements updated'
    });

  } catch (error) {
    console.error('Error updating favorite achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get public profiles for discovery
router.get('/discover/public', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const profiles = await UserProfile.findPublicProfiles(parseInt(limit), parseInt(offset));

    // Add friendship status for each profile
    const enhancedProfiles = await Promise.all(
      profiles.map(async (profile) => {
        const friendship = await Friendship.findFriendship(req.userId, profile.userId);

        return {
          ...profile.toJSON(),
          friendshipStatus: friendship ? friendship.status : null,
          canSendFriendRequest: !friendship && profile.userId !== req.userId
        };
      })
    );

    res.json({
      success: true,
      profiles: enhancedProfiles,
      hasMore: profiles.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Error fetching public profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
