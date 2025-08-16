const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { ChatbotConversation, ChatbotMessage } = require('../models');
const { auth } = require('../middleware/auth-optimized');
const axios = require('axios');

// Chatbot API configuration
const CHATBOT_BASE_URL = process.env.CHATBOT_API_URL || 'http://localhost:8000';
const CHATBOT_API_KEY = process.env.CHATBOT_API_KEY || '';

/**
 * Create a new chatbot conversation
 * POST /api/chatbot-adapter/conversations
 */
router.post('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = uuidv4();

    // Create conversation in database
    const conversation = await ChatbotConversation.create({
      id: conversationId,
      userId: userId,
      startedAt: new Date()
    });

    console.log(`✅ Created conversation ${conversationId} for user ${userId}`);

    res.status(201).json({
      success: true,
      data: {
        conversationId: conversationId,
        startedAt: conversation.startedAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation'
    });
  }
});

/**
 * Send message to chatbot and get response
 * POST /api/chatbot-adapter/conversations/:conversationId/messages
 */
router.post('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Verify conversation exists and belongs to user
    const conversation = await ChatbotConversation.findOne({
      where: {
        id: conversationId,
        userId: userId
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Save user message to database
    const userMessage = await ChatbotMessage.create({
      conversationId: conversationId,
      message: {
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString()
      }
    });

    console.log(`💬 Saved user message for conversation ${conversationId}`);

    // Prepare headers for chatbot API
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${req.headers.authorization?.split(' ')[1] || ''}`
    };

    // Call chatbot API
    console.log('🔍 Calling Python chatbot at:', `${CHATBOT_BASE_URL}/chatbot/stream/${conversationId}`);
    console.log('🔍 Headers:', headers);
    console.log('🔍 Query:', message.trim());
    
    const chatbotResponse = await axios.post(
      `${CHATBOT_BASE_URL}/chatbot/stream/${conversationId}`,
      `query=${encodeURIComponent(message.trim())}`,
      {
        headers: headers,
        responseType: 'stream',
        timeout: 30000 // 30 seconds timeout
      }
    );
    
    console.log('🔍 Python chatbot response received');

    // Handle streaming response
    let fullResponse = '';
    let isFirstChunk = true;

    chatbotResponse.data.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      console.log('🔍 Raw chunk from Python chatbot:', chunkStr);
      const lines = chunkStr.split('\n\n');

      for (const line of lines) {
        if (line.trim()) {
          console.log('🔍 Processing line from Python chatbot:', line);
          try {
            const data = JSON.parse(line);
            console.log('🔍 Parsed data from Python chatbot:', data);
            
            if (data.type === 'message') {
              // Send chunk to client
              if (isFirstChunk) {
                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Headers': 'Cache-Control'
                });
                isFirstChunk = false;
              }

              res.write(`data: ${JSON.stringify({
                type: 'chunk',
                content: data.content
              })}\n\n`);

              fullResponse = data.content;
            } else if (data.type === 'final_message') {
              // Save bot response to database
              ChatbotMessage.create({
                conversationId: conversationId,
                message: {
                  role: 'assistant',
                  content: data.content,
                  timestamp: new Date().toISOString()
                }
              }).then(() => {
                console.log(`🤖 Saved bot response for conversation ${conversationId}`);
              }).catch(err => {
                console.error('❌ Error saving bot message:', err);
              });

              // Send final message
              res.write(`data: ${JSON.stringify({
                type: 'final',
                content: data.content
              })}\n\n`);
              
              res.end();
            }
          } catch (parseError) {
            console.error('❌ Error parsing chatbot response:', parseError);
          }
        }
      }
    });

    chatbotResponse.data.on('error', (error) => {
      console.error('❌ Chatbot API error:', error);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.'
      })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('❌ Error sending message:', error);
    console.error('❌ Error details:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    console.error('❌ Error message:', error.message);
    
    // If it's an authentication error, return specific message
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed with Python chatbot'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

/**
 * Get conversation history
 * GET /api/chatbot-adapter/conversations/:conversationId/messages
 */
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify conversation exists and belongs to user
    const conversation = await ChatbotConversation.findOne({
      where: {
        id: conversationId,
        userId: userId
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Get messages
    const messages = await ChatbotMessage.findAll({
      where: {
        conversationId: conversationId
      },
      order: [['created_at', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        conversationId: conversationId,
        messages: messages.map(msg => msg.message)
      }
    });

  } catch (error) {
    console.error('❌ Error getting conversation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation history'
    });
  }
});

/**
 * Get user's conversations
 * GET /api/chatbot-adapter/conversations
 */
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get conversations without include
    const conversations = await ChatbotConversation.findAll({
      where: {
        userId: userId
      },
      order: [['startedAt', 'DESC']]
    });

    // Get last message for each conversation
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await ChatbotMessage.findOne({
          where: {
            conversationId: conv.id
          },
          order: [['created_at', 'DESC']]
        });

        return {
          id: conv.id,
          title: conv.title || 'Cuộc trò chuyện mới',
          startedAt: conv.startedAt,
          lastMessage: lastMessage?.message?.content || 'No messages yet',
          messageCount: await ChatbotMessage.count({
            where: { conversationId: conv.id }
          })
        };
      })
    );

    res.json({
      success: true,
      data: formattedConversations
    });

  } catch (error) {
    console.error('❌ Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations'
    });
  }
});

/**
 * Update conversation title
 * PUT /api/chatbot-adapter/conversations/:conversationId
 */
router.put('/conversations/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    // Verify conversation exists and belongs to user
    const conversation = await ChatbotConversation.findOne({
      where: {
        id: conversationId,
        userId: userId
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Update conversation title in database
    await conversation.update({
      title: title
    });

    console.log(`✅ Updated conversation ${conversationId} title to: ${title}`);

    res.json({
      success: true,
      data: {
        conversationId: conversationId,
        title: title
      }
    });

  } catch (error) {
    console.error('❌ Error updating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update conversation'
    });
  }
});

/**
 * Delete conversation
 * DELETE /api/chatbot-adapter/conversations/:conversationId
 */
router.delete('/conversations/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify conversation exists and belongs to user
    const conversation = await ChatbotConversation.findOne({
      where: {
        id: conversationId,
        userId: userId
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Delete all messages first
    await ChatbotMessage.destroy({
      where: {
        conversationId: conversationId
      }
    });

    // Delete conversation
    await conversation.destroy();

    console.log(`🗑️ Deleted conversation ${conversationId} and all messages`);

    res.json({
      success: true,
      data: {
        conversationId: conversationId
      }
    });

  } catch (error) {
    console.error('❌ Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    });
  }
});

/**
 * Delete empty conversations
 * DELETE /api/chatbot-adapter/conversations/cleanup
 */
router.delete('/conversations/cleanup', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all conversations for user
    const conversations = await ChatbotConversation.findAll({
      where: {
        userId: userId
      }
    });

    let deletedCount = 0;

    // Check each conversation for messages
    for (const conversation of conversations) {
      const messageCount = await ChatbotMessage.count({
        where: {
          conversationId: conversation.id
        }
      });

      // Delete conversation if it has no messages
      if (messageCount === 0) {
        await conversation.destroy();
        deletedCount++;
        console.log(`🗑️ Deleted empty conversation ${conversation.id}`);
      }
    }

    console.log(`✅ Cleaned up ${deletedCount} empty conversations for user ${userId}`);

    res.json({
      success: true,
      data: {
        deletedCount: deletedCount
      }
    });

  } catch (error) {
    console.error('❌ Error cleaning up conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean up conversations'
    });
  }
});

/**
 * Save message manually (for welcome messages, etc.)
 * POST /api/chatbot-adapter/messages
 */
router.post('/messages', auth, async (req, res) => {
  try {
    const { conversationId, type, content, agent } = req.body;
    const userId = req.user.id;

    // Verify conversation exists and belongs to user
    const conversation = await ChatbotConversation.findOne({
      where: {
        id: conversationId,
        userId: userId
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Save message
    const message = await ChatbotMessage.create({
      conversationId: conversationId,
      message: {
        role: type === 'bot' ? 'assistant' : 'user',
        content: content,
        timestamp: new Date().toISOString(),
        agent: agent
      }
    });

    res.status(201).json({
      success: true,
      data: {
        messageId: message.id,
        message: message.message
      }
    });

  } catch (error) {
    console.error('❌ Error saving message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save message'
    });
  }
});

module.exports = router; 