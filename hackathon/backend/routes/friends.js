const express = require('express');
const router = express.Router();
const { User, UserProfile, Friendship, ActivityFeed, Notification } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Send friend request
router.post('/request', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const requesterId = req.userId;

    if (userId == requesterId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    // Check if target user exists
    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if friendship already exists
    const existingFriendship = await Friendship.findFriendship(requesterId, userId);
    if (existingFriendship) {
      return res.status(400).json({
        success: false,
        message: 'Friendship request already exists or users are already friends'
      });
    }

    // Check target user's privacy settings
    const targetProfile = await UserProfile.findOne({
      where: { userId }
    });

    if (targetProfile && !targetProfile.privacySettings.allowFriendRequests) {
      return res.status(403).json({
        success: false,
        message: 'User is not accepting friend requests'
      });
    }

    // Create friendship request
    const friendship = await Friendship.create({
      requesterId,
      addresseeId: userId,
      status: 'pending'
    });

    // Create notification for target user
    await Notification.create({
      userId: userId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: `${req.user.name} sent you a friend request`,
      data: {
        requesterId,
        requesterName: req.user.name,
        friendshipId: friendship.id
      }
    });

    // Create activity feed entry
    await ActivityFeed.createActivity({
      userId: requesterId,
      type: 'friend_request_sent',
      title: 'Sent friend request',
      description: `Sent a friend request to ${targetUser.name}`,
      relatedUserId: userId,
      visibility: 'private'
    });

    res.json({
      success: true,
      friendship,
      message: 'Friend request sent successfully'
    });

  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Accept friend request
router.post('/accept/:friendshipId', auth, async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.userId;

    const friendship = await Friendship.findOne({
      where: {
        id: friendshipId,
        addresseeId: userId,
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    // Accept the friendship
    await friendship.accept();

    // Create notification for requester
    await Notification.create({
      userId: friendship.requesterId,
      type: 'friend_request_accepted',
      title: 'Friend Request Accepted',
      message: `${req.user.name} accepted your friend request`,
      data: {
        accepterId: userId,
        accepterName: req.user.name,
        friendshipId: friendship.id
      }
    });

    // Create activity feed entries for both users
    await ActivityFeed.createActivity({
      userId: friendship.requesterId,
      type: 'friend_added',
      title: 'New friend',
      description: `${req.user.name} accepted your friend request`,
      relatedUserId: userId,
      visibility: 'friends'
    });

    await ActivityFeed.createActivity({
      userId: userId,
      type: 'friend_added',
      title: 'New friend',
      description: `You are now friends with ${friendship.requester.name}`,
      relatedUserId: friendship.requesterId,
      visibility: 'friends'
    });

    res.json({
      success: true,
      friendship,
      message: 'Friend request accepted'
    });

  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Decline friend request
router.post('/decline/:friendshipId', auth, async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.userId;

    const friendship = await Friendship.findOne({
      where: {
        id: friendshipId,
        addresseeId: userId,
        status: 'pending'
      }
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    await friendship.decline();

    res.json({
      success: true,
      message: 'Friend request declined'
    });

  } catch (error) {
    console.error('Error declining friend request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Remove friend
router.delete('/:friendshipId', auth, async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.userId;

    const friendship = await Friendship.findOne({
      where: {
        id: friendshipId,
        [Op.or]: [
          { requesterId: userId },
          { addresseeId: userId }
        ],
        status: 'accepted'
      }
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Friendship not found'
      });
    }

    await friendship.destroy();

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Block user
router.post('/block/:friendshipId', auth, async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.userId;

    const friendship = await Friendship.findOne({
      where: {
        id: friendshipId,
        [Op.or]: [
          { requesterId: userId },
          { addresseeId: userId }
        ]
      }
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Friendship not found'
      });
    }

    await friendship.block();

    res.json({
      success: true,
      message: 'User blocked successfully'
    });

  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get friends list
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { status = 'accepted', limit = 50, offset = 0 } = req.query;

    const friendships = await Friendship.findAll({
      where: {
        [Op.or]: [
          { requesterId: userId },
          { addresseeId: userId }
        ],
        status
      },
      include: [
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'name', 'email', 'avatar'],
          include: [{
            model: UserProfile,
            as: 'profile',
            attributes: ['displayName', 'avatar', 'onlineStatus', 'lastActive']
          }]
        },
        {
          model: User,
          as: 'addressee',
          attributes: ['id', 'name', 'email', 'avatar'],
          include: [{
            model: UserProfile,
            as: 'profile',
            attributes: ['displayName', 'avatar', 'onlineStatus', 'lastActive']
          }]
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format the response to show the friend (not the current user)
    const friends = friendships.map(friendship => {
      const friend = friendship.requesterId === userId ? friendship.addressee : friendship.requester;
      return {
        friendshipId: friendship.id,
        friend,
        status: friendship.status,
        relationshipType: friendship.relationshipType,
        closenessLevel: friendship.closenessLevel,
        interactionCount: friendship.interactionCount,
        lastInteraction: friendship.lastInteraction,
        created_at: friendship.created_at
      };
    });

    res.json({
      success: true,
      friends,
      total: friends.length,
      hasMore: friends.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get pending friend requests (received)
router.get('/requests/pending', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const pendingRequests = await Friendship.getPendingRequests(userId);

    res.json({
      success: true,
      requests: pendingRequests,
      count: pendingRequests.length
    });

  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get sent friend requests
router.get('/requests/sent', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const sentRequests = await Friendship.getSentRequests(userId);

    res.json({
      success: true,
      requests: sentRequests,
      count: sentRequests.length
    });

  } catch (error) {
    console.error('Error fetching sent requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get closest friends
router.get('/closest', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 5 } = req.query;

    const closestFriends = await Friendship.getClosestFriends(userId, parseInt(limit));

    // Format the response
    const friends = closestFriends.map(friendship => {
      const friend = friendship.requesterId === userId ? friendship.addressee : friendship.requester;
      return {
        friendshipId: friendship.id,
        friend,
        closenessLevel: friendship.closenessLevel,
        interactionCount: friendship.interactionCount,
        lastInteraction: friendship.lastInteraction
      };
    });

    res.json({
      success: true,
      closestFriends: friends
    });

  } catch (error) {
    console.error('Error fetching closest friends:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update friendship settings
router.put('/:friendshipId/settings', auth, async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const { settings, relationshipType, notes, tags } = req.body;
    const userId = req.userId;

    const friendship = await Friendship.findOne({
      where: {
        id: friendshipId,
        [Op.or]: [
          { requesterId: userId },
          { addresseeId: userId }
        ],
        status: 'accepted'
      }
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Friendship not found'
      });
    }

    const updateData = {};
    if (settings) updateData.settings = { ...friendship.settings, ...settings };
    if (relationshipType) updateData.relationshipType = relationshipType;
    if (notes !== undefined) updateData.notes = notes;
    if (tags) updateData.tags = tags;

    await friendship.update(updateData);

    res.json({
      success: true,
      friendship,
      message: 'Friendship settings updated'
    });

  } catch (error) {
    console.error('Error updating friendship settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
