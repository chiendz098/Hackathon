const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { User, ChatbotConversation, ChatbotMessage } = require('../models');
const axios = require('axios');
const FormData = require('form-data');

// Chatbot health check
router.get('/health', async (req, res) => {
  try {
    const chatbotUrl = process.env.CHATBOT_URL || 'http://localhost:8000';
    const response = await axios.get(`${chatbotUrl}/`, { timeout: 5000 });
    
    res.json({
      success: true,
      status: 'healthy',
      pythonService: 'running',
      message: response.data.message
    });
  } catch (error) {
    console.error('Chatbot health check failed:', error.message);
    res.json({
      success: false,
      status: 'unhealthy',
      pythonService: 'down',
      message: 'Python chatbot service is not available'
    });
  }
});

// Chatbot conversation management - Step 1: Create conversation with UUID
router.post('/conversation', auth, async (req, res) => {
  try {
    // Generate random UUID for conversation
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert into chatbot_conversations table
    await ChatbotConversation.create({
      id: conversationId,
      userId: req.user.id,
      startedAt: new Date()
    });

    res.json({
      success: true,
      conversationId,
      message: 'Conversation created successfully'
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
});

// Get user conversations list
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await ChatbotConversation.findAll({
      where: { userId: req.user.id },
      order: [['startedAt', 'DESC']],
      include: [
        {
          model: ChatbotMessage,
          as: 'messages',
          attributes: ['id', 'message', 'created_at'],
          order: [['created_at', 'DESC']]
        }
      ]
    });

          const formattedConversations = conversations.map(conv => {
        const messages = conv.messages || [];
        const lastMessage = messages[0];
        const title = lastMessage ? 
          (lastMessage.message.content.length > 30 ? 
            lastMessage.message.content.substring(0, 30) + '...' : 
            lastMessage.message.content) : 
          'Cuộc trò chuyện mới';

        return {
          id: conv.id,
          title: title,
          messageCount: messages.length,
          updatedAt: lastMessage ? lastMessage.created_at : conv.startedAt,
          createdAt: conv.startedAt
        };
      });

    res.json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// Get conversation history
router.get('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Verify conversation belongs to user
    const conversation = await ChatbotConversation.findOne({
      where: { id: conversationId, userId: req.user.id }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get messages for this conversation
    const messages = await ChatbotMessage.findAll({
      where: { conversationId },
      order: [['created_at', 'ASC']]
    });

    // Convert to frontend format
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      type: msg.message.type === 'human' ? 'user' : 'bot',
      content: msg.message.content,
      agent: msg.message.agent || null,
      timestamp: msg.created_at
    }));

    res.json({
      success: true,
      messages: formattedMessages
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation'
    });
  }
});

// Enhanced proxy to Python chatbot with better error handling
router.post('/stream/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { query } = req.body;
    const token = req.headers.authorization;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    // Check if chatbot is enabled
    if (process.env.CHATBOT_ENABLED !== 'true') {
      return res.status(503).json({
        success: false,
        message: 'Chatbot service is currently disabled'
      });
    }

    // Set up streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Create form data for Python chatbot
    const formData = new FormData();
    formData.append('query', query);

    // Make request to Python chatbot
    const chatbotUrl = process.env.CHATBOT_URL || 'http://localhost:8000';
    
    const response = await axios.post(
      `${chatbotUrl}/chatbot/stream/${conversationId}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': token
        },
        responseType: 'stream',
        timeout: 30000 // 30 second timeout
      }
    );

    // Pipe the streaming response from Python chatbot to client
    response.data.pipe(res);

    // Handle errors
    response.data.on('error', (error) => {
      console.error('Chatbot stream error:', error);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        content: 'Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại.'
      })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('Error in chatbot stream:', error);
    
    // Send error response
    res.write(`data: ${JSON.stringify({
      type: 'error',
      content: 'Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại.'
    })}\n\n`);
    
    res.end();
  }
});

// Non-streaming chatbot endpoint for simple queries
router.post('/chat/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { query } = req.body;
    const token = req.headers.authorization;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    // Check if chatbot is enabled
    if (process.env.CHATBOT_ENABLED !== 'true') {
      return res.json({
        success: true,
        response: 'Chatbot service is currently disabled. Please try again later.',
        conversationId
      });
    }

    // Create form data for Python chatbot
    const formData = new FormData();
    formData.append('query', query);

    // Make request to Python chatbot
    const chatbotUrl = process.env.CHATBOT_URL || 'http://localhost:8000';
    
    const response = await axios.post(
      `${chatbotUrl}/chatbot/stream/${conversationId}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': token
        },
        timeout: 30000
      }
    );

    // Parse streaming response to get final message
    let finalMessage = '';
    const lines = response.data.split('\n\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));
          if (data.type === 'final_message') {
            finalMessage = data.content;
            break;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    res.json({
      success: true,
      response: finalMessage || 'No response received',
      conversationId
    });

  } catch (error) {
    console.error('Error in chatbot chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing chatbot request'
    });
  }
});

// Update conversation title (not supported in current schema)
router.put('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;

    // Since we don't have title column, we'll update the first message to set the title
    const firstMessage = await ChatbotMessage.findOne({
      where: { conversationId },
      order: [['created_at', 'ASC']]
    });

    if (firstMessage) {
      // Update the first message content to include title
      const messageData = firstMessage.message;
      messageData.title = title;
      await firstMessage.update({ message: messageData });
    }
    
    res.json({
      success: true,
      message: 'Conversation updated successfully'
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update conversation'
    });
  }
});

// Delete conversation
router.delete('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await ChatbotConversation.findOne({
      where: { id: conversationId, userId: req.user.id }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Delete all messages first
    await ChatbotMessage.destroy({
      where: { conversationId }
    });

    // Delete conversation
    await conversation.destroy();
    
    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation'
    });
  }
});

// Save message to database - Step 3: Save messages to chatbot_messages
router.post('/message', auth, async (req, res) => {
  try {
    const { conversationId, type, content, agent } = req.body;

    // Verify conversation belongs to user
    const conversation = await ChatbotConversation.findOne({
      where: { id: conversationId, userId: req.user.id }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Convert type to match database format (human/ai)
    const messageType = type === 'user' ? 'human' : 'ai';
    
    // Save message in JSONB format to chatbot_messages table
    await ChatbotMessage.create({
      conversationId,
      message: {
        type: messageType,
        content: content,
        agent: agent || null
      }
    });

    res.json({
      success: true,
      message: 'Message saved successfully'
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save message'
    });
  }
});

module.exports = router; 