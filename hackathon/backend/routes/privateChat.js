const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Middleware xác thực JWT
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Get user's private chats
router.get('/', auth, async (req, res) => {
  try {
    const { data: chats, error } = await supabase
      .from('private_chats')
      .select(`
        *,
        user1:users!private_chats_user1_id_fkey(id, name, email, avatar, is_online, last_seen),
        user2:users!private_chats_user2_id_fkey(id, name, email, avatar, is_online, last_seen),
        last_message:private_messages(
          content,
          type,
          created_at,
          sender:users(id, name, avatar)
        )
      `)
      .or(`user1_id.eq.${req.userId},user2_id.eq.${req.userId}`)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    // Process chats to show other user info
    const processedChats = chats.map(chat => {
      const otherUser = chat.user1_id === req.userId ? chat.user2 : chat.user1;
      const lastMessage = chat.last_message?.[0];
      
      return {
        id: chat.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          username: otherUser.username,
          major: otherUser.major,
          yearLevel: otherUser.year_level,
          gpa: otherUser.gpa,
          isOnline: otherUser.is_online,
          lastSeen: otherUser.last_seen
        },
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          type: lastMessage.type,
          created_at: lastMessage.created_at,
          senderName: lastMessage.sender?.name
        } : null,
        lastMessageAt: chat.last_message_at,
        unreadCount: 0 // Will be calculated separately
      };
    });

    res.json({
      success: true,
      chats: processedChats
    });

  } catch (error) {
    console.error('Error fetching private chats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get or create private chat with another user
router.post('/with/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (parseInt(userId) === req.userId) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    // Check if chat already exists
    const { data: existingChat, error: checkError } = await supabase
      .from('private_chats')
      .select('*')
      .or(`and(user1_id.eq.${req.userId},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${req.userId})`)
      .eq('is_active', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let chat;
    if (existingChat) {
      chat = existingChat;
    } else {
      // Create new chat
      const { data: newChat, error: createError } = await supabase
        .from('private_chats')
        .insert({
          user1_id: Math.min(req.userId, parseInt(userId)),
          user2_id: Math.max(req.userId, parseInt(userId)),
          is_active: true
        })
        .select()
        .single();

      if (createError) throw createError;
      chat = newChat;
    }

    // Get other user info
    const otherUserId = chat.user1_id === req.userId ? chat.user2_id : chat.user1_id;
    const { data: otherUser, error: userError } = await supabase
      .from('users')
                .select('id, name, email, avatar, is_online, last_seen')
      .eq('id', otherUserId)
      .single();

    if (userError) throw userError;

    res.json({
      success: true,
      chat: {
        id: chat.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          username: otherUser.username,
          major: otherUser.major,
          yearLevel: otherUser.year_level,
          gpa: otherUser.gpa,
          isOnline: otherUser.is_online,
          lastSeen: otherUser.last_seen
        }
      }
    });

  } catch (error) {
    console.error('Error getting/creating private chat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get chat messages
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user is part of this chat
    const { data: chat, error: chatError } = await supabase
      .from('private_chats')
      .select('*')
      .eq('id', chatId)
      .or(`user1_id.eq.${req.userId},user2_id.eq.${req.userId}`)
      .eq('is_active', true)
      .single();

    if (chatError || !chat) {
      return res.status(403).json({ message: 'Access denied to this chat' });
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from('private_messages')
      .select(`
        *,
        sender:users(id, name, email, avatar, username)
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Mark messages as read
    await supabase
      .from('private_messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('chat_id', chatId)
      .eq('sender_id', '!=', req.userId)
      .eq('is_read', false);

    res.json({
      success: true,
      messages: messages.reverse(), // Show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send private message
router.post('/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text', reactions } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Verify user is part of this chat
    const { data: chat, error: chatError } = await supabase
      .from('private_chats')
      .select('*')
      .eq('id', chatId)
      .or(`user1_id.eq.${req.userId},user2_id.eq.${req.userId}`)
      .eq('is_active', true)
      .single();

    if (chatError || !chat) {
      return res.status(403).json({ message: 'Access denied to this chat' });
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('private_messages')
      .insert({
        chat_id: chatId,
        sender_id: req.userId,
        content: content.trim(),
        type,
        reactions: reactions || {},
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        sender:users(id, name, email, avatar, username)
      `)
      .single();

    if (messageError) throw messageError;

    // Update chat's last message time
    await supabase
      .from('private_chats')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', chatId);

    res.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Error sending private message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread message count for all chats
router.get('/unread/count', auth, async (req, res) => {
  try {
    const { data: unreadCounts, error } = await supabase
      .from('private_messages')
      .select(`
        chat_id,
        count
      `)
      .eq('is_read', false)
      .neq('sender_id', req.userId)
      .in('chat_id', 
        supabase
          .from('private_chats')
          .select('id')
          .or(`user1_id.eq.${req.userId},user2_id.eq.${req.userId}`)
          .eq('is_active', true)
      )
      .group('chat_id');

    if (error) throw error;

    const totalUnread = unreadCounts.reduce((sum, item) => sum + parseInt(item.count), 0);

    res.json({
      success: true,
      unreadCounts,
      totalUnread
    });

  } catch (error) {
    console.error('Error fetching unread counts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark chat messages as read
router.post('/:chatId/read', auth, async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify user is part of this chat
    const { data: chat, error: chatError } = await supabase
      .from('private_chats')
      .select('*')
      .eq('id', chatId)
      .or(`user1_id.eq.${req.userId},user2_id.eq.${req.userId}`)
      .eq('is_active', true)
      .single();

    if (chatError || !chat) {
      return res.status(403).json({ message: 'Access denied to this chat' });
    }

    // Mark all messages as read
    await supabase
      .from('private_messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('chat_id', chatId)
      .eq('sender_id', '!=', req.userId)
      .eq('is_read', false);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete private chat
router.delete('/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify user is part of this chat
    const { data: chat, error: chatError } = await supabase
      .from('private_chats')
      .select('*')
      .eq('id', chatId)
      .or(`user1_id.eq.${req.userId},user2_id.eq.${req.userId}`)
      .eq('is_active', true)
      .single();

    if (chatError || !chat) {
      return res.status(403).json({ message: 'Access denied to this chat' });
    }

    // Deactivate chat
    await supabase
      .from('private_chats')
      .update({ is_active: false })
      .eq('id', chatId);

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 