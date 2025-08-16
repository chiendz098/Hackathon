const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// In-memory storage for demo purposes
// In production, use a proper database
let focusRooms = new Map();
let roomParticipants = new Map();
let roomMessages = new Map();

// Get all active focus rooms
router.get('/', auth, async (req, res) => {
  try {
    const rooms = Array.from(focusRooms.values()).map(room => ({
      ...room,
      participants: roomParticipants.get(room.id)?.size || 0
    }));

    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Error fetching focus rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch focus rooms'
    });
  }
});

// Create a new focus room
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      subject,
      maxParticipants = 8,
      isPrivate = false,
      description = ''
    } = req.body;

    const userId = req.user.id;
    const userName = req.user.name || 'Anonymous';

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required'
      });
    }

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newRoom = {
      id: roomId,
      name: name.trim(),
      subject: subject || 'General',
      maxParticipants,
      isPrivate,
      description,
      hostId: userId,
      hostName: userName,
      created_at: new Date(),
      isActive: true,
      currentTimer: {
        minutes: 25,
        seconds: 0,
        isActive: false,
        isBreak: false
      }
    };

    focusRooms.set(roomId, newRoom);
    roomParticipants.set(roomId, new Set());
    roomMessages.set(roomId, []);

    res.json({
      success: true,
      room: newRoom
    });
  } catch (error) {
    console.error('Error creating focus room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create focus room'
    });
  }
});

// Get room details
router.get('/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = focusRooms.get(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const participants = Array.from(roomParticipants.get(roomId) || []);
    const messages = roomMessages.get(roomId) || [];

    res.json({
      success: true,
      room: {
        ...room,
        participantCount: participants.length
      },
      participants,
      messages: messages.slice(-50) // Last 50 messages
    });
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room details'
    });
  }
});

// Join a room
router.post('/:roomId/join', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const userName = req.user.name || 'Anonymous';

    const room = focusRooms.get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const participants = roomParticipants.get(roomId);
    if (participants.size >= room.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }

    const participant = {
      id: userId,
      name: userName,
      joinedAt: new Date(),
      isHost: userId === room.hostId,
      isActive: true
    };

    participants.add(JSON.stringify(participant));

    // Add join message
    const messages = roomMessages.get(roomId);
    messages.push({
      id: Date.now(),
      type: 'system',
      content: `${userName} joined the room`,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Joined room successfully',
      room: {
        ...room,
        participantCount: participants.size
      },
      participant
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room'
    });
  }
});

// Leave a room
router.post('/:roomId/leave', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const userName = req.user.name || 'Anonymous';

    const room = focusRooms.get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const participants = roomParticipants.get(roomId);
    const participantArray = Array.from(participants);
    
    // Remove participant
    const updatedParticipants = participantArray.filter(p => {
      const participant = JSON.parse(p);
      return participant.id !== userId;
    });

    roomParticipants.set(roomId, new Set(updatedParticipants));

    // Add leave message
    const messages = roomMessages.get(roomId);
    messages.push({
      id: Date.now(),
      type: 'system',
      content: `${userName} left the room`,
      timestamp: new Date()
    });

    // If host left and there are other participants, assign new host
    if (userId === room.hostId && updatedParticipants.length > 0) {
      const newHost = JSON.parse(updatedParticipants[0]);
      room.hostId = newHost.id;
      room.hostName = newHost.name;
    }

    // If no participants left, mark room as inactive
    if (updatedParticipants.length === 0) {
      room.isActive = false;
    }

    res.json({
      success: true,
      message: 'Left room successfully'
    });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave room'
    });
  }
});

// Send message to room
router.post('/:roomId/message', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const userName = req.user.name || 'Anonymous';

    const room = focusRooms.get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const message = {
      id: Date.now(),
      type: 'user',
      content: content.trim(),
      userId,
      userName,
      timestamp: new Date()
    };

    const messages = roomMessages.get(roomId);
    messages.push(message);

    // Keep only last 100 messages
    if (messages.length > 100) {
      messages.splice(0, messages.length - 100);
    }

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Update room timer
router.post('/:roomId/timer', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { action, timerData } = req.body; // action: start, pause, reset
    const userId = req.user.id;

    const room = focusRooms.get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Only host can control timer
    if (userId !== room.hostId) {
      return res.status(403).json({
        success: false,
        message: 'Only room host can control the timer'
      });
    }

    switch (action) {
      case 'start':
        room.currentTimer.isActive = true;
        break;
      case 'pause':
        room.currentTimer.isActive = false;
        break;
      case 'reset':
        room.currentTimer = {
          minutes: 25,
          seconds: 0,
          isActive: false,
          isBreak: false
        };
        break;
      case 'update':
        if (timerData) {
          room.currentTimer = { ...room.currentTimer, ...timerData };
        }
        break;
    }

    res.json({
      success: true,
      timer: room.currentTimer
    });
  } catch (error) {
    console.error('Error updating timer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update timer'
    });
  }
});

// Delete room (host only)
router.delete('/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = focusRooms.get(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (userId !== room.hostId) {
      return res.status(403).json({
        success: false,
        message: 'Only room host can delete the room'
      });
    }

    focusRooms.delete(roomId);
    roomParticipants.delete(roomId);
    roomMessages.delete(roomId);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room'
    });
  }
});

// Get room statistics
router.get('/:roomId/stats', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = focusRooms.get(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const participants = roomParticipants.get(roomId) || new Set();
    const messages = roomMessages.get(roomId) || [];

    const stats = {
      totalParticipants: participants.size,
      totalMessages: messages.length,
      roomAge: new Date() - new Date(room.created_at),
      isActive: room.isActive,
      currentTimer: room.currentTimer
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching room stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room statistics'
    });
  }
});

// Cleanup inactive rooms (utility endpoint)
router.post('/cleanup', auth, async (req, res) => {
  try {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    let cleanedCount = 0;

    for (const [roomId, room] of focusRooms.entries()) {
      const roomAge = now - new Date(room.created_at);
      const participants = roomParticipants.get(roomId);
      
      // Remove rooms that are old and have no participants
      if (roomAge > maxAge && (!participants || participants.size === 0)) {
        focusRooms.delete(roomId);
        roomParticipants.delete(roomId);
        roomMessages.delete(roomId);
        cleanedCount++;
      }
    }

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} inactive rooms`
    });
  } catch (error) {
    console.error('Error cleaning up rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup rooms'
    });
  }
});

module.exports = router;
