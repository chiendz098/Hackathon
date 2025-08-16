const { User, Todo, UserProgress, UserAnalytics } = require('../models');
const notificationService = require('./notificationService');
const gamificationService = require('./gamificationService');

class AIService {
  constructor() {
    this.websocketService = require('./websocket');
    this.conversationHistory = new Map(); // userId -> conversation history
  }

  // Initialize conversation for user
  initializeConversation(userId) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    return this.conversationHistory.get(userId);
  }

  // Add message to conversation history
  addToHistory(userId, role, content) {
    const history = this.initializeConversation(userId);
    history.push({ role, content, timestamp: new Date() });
    
    // Keep only last 20 messages to prevent memory issues
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
  }

  // Get conversation history
  getConversationHistory(userId) {
    return this.initializeConversation(userId);
  }

  // Clear conversation history
  clearConversationHistory(userId) {
    this.conversationHistory.delete(userId);
  }

  // Process user message and generate response
  async processMessage(userId, message, context = {}) {
    try {
      // Add user message to history
      this.addToHistory(userId, 'user', message);

      // Get user context
      const user = await User.findByPk(userId);
      const userProgress = await UserProgress.findOne({ where: { userId } });
      
      // Analyze message intent
      const intent = await this.analyzeIntent(message);
      
      // Generate response based on intent
      let response;
      switch (intent.type) {
        case 'todo_creation':
          response = await this.handleTodoCreation(userId, message, context);
          break;
        case 'study_planning':
          response = await this.handleStudyPlanning(userId, message, context);
          break;
        case 'motivation':
          response = await this.handleMotivation(userId, message, context);
          break;
        case 'progress_inquiry':
          response = await this.handleProgressInquiry(userId, message, context);
          break;
        case 'general_help':
          response = await this.handleGeneralHelp(userId, message, context);
          break;
        default:
          response = await this.generateGeneralResponse(userId, message, context);
      }

      // Add AI response to history
      this.addToHistory(userId, 'assistant', response);

      // Log interaction
      await this.logAIInteraction(userId, message, response, intent);

      return {
        response,
        intent: intent.type,
        suggestions: await this.generateSuggestions(userId, intent)
      };
    } catch (error) {
      console.error('Error processing AI message:', error);
      return {
        response: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        intent: 'error',
        suggestions: []
      };
    }
  }

  // Analyze message intent
  async analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Todo-related intents
    if (lowerMessage.includes('create') || lowerMessage.includes('add') || lowerMessage.includes('new task')) {
      return { type: 'todo_creation', confidence: 0.9 };
    }
    
    // Study planning intents
    if (lowerMessage.includes('study') || lowerMessage.includes('plan') || lowerMessage.includes('schedule')) {
      return { type: 'study_planning', confidence: 0.8 };
    }
    
    // Motivation intents
    if (lowerMessage.includes('motivate') || lowerMessage.includes('encourage') || lowerMessage.includes('help me')) {
      return { type: 'motivation', confidence: 0.7 };
    }
    
    // Progress inquiry intents
    if (lowerMessage.includes('progress') || lowerMessage.includes('how am i') || lowerMessage.includes('stats')) {
      return { type: 'progress_inquiry', confidence: 0.8 };
    }
    
    // General help
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you')) {
      return { type: 'general_help', confidence: 0.9 };
    }
    
    return { type: 'general', confidence: 0.5 };
  }

  // Handle todo creation
  async handleTodoCreation(userId, message, context) {
    try {
      // Extract todo details from message
      const todoDetails = this.extractTodoDetails(message);
      
      if (!todoDetails.title) {
        return "I'd be happy to help you create a todo! Please tell me what task you'd like to add, and optionally when it's due.";
      }

      // Create todo
      const todo = await Todo.create({
        userId,
        title: todoDetails.title,
        description: todoDetails.description || '',
        dueDate: todoDetails.dueDate,
        priority: todoDetails.priority || 'medium',
        status: 'pending',
        createdAt: new Date()
      });

      // Add experience points
      await gamificationService.addExperience(userId, 5, 'create_todo');

      return `Great! I've created a new todo: "${todoDetails.title}"${todoDetails.dueDate ? ` due on ${todoDetails.dueDate.toLocaleDateString()}` : ''}. You can view and manage it in your todo list.`;
    } catch (error) {
      console.error('Error creating todo:', error);
      return "I'm sorry, I couldn't create the todo right now. Please try again.";
    }
  }

  // Extract todo details from message
  extractTodoDetails(message) {
    const details = {
      title: '',
      description: '',
      dueDate: null,
      priority: 'medium'
    };

    // Simple extraction logic - in a real implementation, you'd use NLP
    const words = message.split(' ');
    const titleWords = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      
      if (word === 'due' || word === 'by' || word === 'on') {
        // Try to extract date from next few words
        const dateWords = words.slice(i + 1, i + 4);
        const dateStr = dateWords.join(' ');
        const date = this.parseDate(dateStr);
        if (date) {
          details.dueDate = date;
          break;
        }
      } else if (word === 'urgent' || word === 'high') {
        details.priority = 'high';
      } else if (word === 'low') {
        details.priority = 'low';
      } else {
        titleWords.push(words[i]);
      }
    }

    details.title = titleWords.join(' ').trim();
    return details;
  }

  // Parse date from string
  parseDate(dateStr) {
    try {
      // Simple date parsing - in production, use a proper date library
      const today = new Date();
      
      if (dateStr.includes('today')) {
        return today;
      } else if (dateStr.includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      } else if (dateStr.includes('next week')) {
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek;
      }
      
      // Try to parse as regular date
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // Handle study planning
  async handleStudyPlanning(userId, message, context) {
    try {
      const userProgress = await UserProgress.findOne({ where: { userId } });
      const todos = await Todo.findAll({
        where: { userId, status: 'pending' },
        order: [['dueDate', 'ASC']]
      });

      if (todos.length === 0) {
        return "You don't have any pending tasks right now! This is a great time to create some new learning goals. Would you like me to help you create some study tasks?";
      }

      const urgentTodos = todos.filter(todo => todo.priority === 'high');
      const upcomingTodos = todos.filter(todo => 
        todo.dueDate && new Date(todo.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      );

      let response = "Here's your study plan:\n\n";
      
      if (urgentTodos.length > 0) {
        response += "🔥 **Priority Tasks:**\n";
        urgentTodos.slice(0, 3).forEach(todo => {
          response += `• ${todo.title}${todo.dueDate ? ` (due: ${new Date(todo.dueDate).toLocaleDateString()})` : ''}\n`;
        });
        response += "\n";
      }

      if (upcomingTodos.length > 0) {
        response += "📅 **Upcoming This Week:**\n";
        upcomingTodos.slice(0, 5).forEach(todo => {
          response += `• ${todo.title}${todo.dueDate ? ` (due: ${new Date(todo.dueDate).toLocaleDateString()})` : ''}\n`;
        });
      }

      response += `\nYou're currently at level ${userProgress?.level || 1}. Keep up the great work!`;

      return response;
    } catch (error) {
      console.error('Error handling study planning:', error);
      return "I'm having trouble accessing your study plan right now. Please try again later.";
    }
  }

  // Handle motivation
  async handleMotivation(userId, message, context) {
    const motivations = [
      "You're doing amazing! Every step forward, no matter how small, brings you closer to your goals. 🌟",
      "Remember, the best time to start was yesterday, the second best time is now. You've got this! 💪",
      "Your future self will thank you for the work you're doing today. Keep pushing forward! 🚀",
      "Success is not final, failure is not fatal: it is the courage to continue that counts. You're building that courage every day! ✨",
      "You are capable of amazing things. Believe in yourself and keep moving forward, one task at a time! 🌈",
      "Every expert was once a beginner. You're on your way to becoming an expert in your field! 📚",
      "The only way to do great work is to love what you do. Keep that passion alive! 🔥",
      "Your dedication and hard work will pay off. Trust the process and keep going! 🎯"
    ];

    const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];
    
    // Add some personalized encouragement based on user progress
    try {
      const userProgress = await UserProgress.findOne({ where: { userId } });
      const completedTodos = await Todo.count({ where: { userId, status: 'done' } });
      
      let personalized = "";
      if (completedTodos > 0) {
        personalized = `\n\nYou've already completed ${completedTodos} tasks - that's incredible progress!`;
      }
      
      return randomMotivation + personalized;
    } catch (error) {
      return randomMotivation;
    }
  }

  // Handle progress inquiry
  async handleProgressInquiry(userId, message, context) {
    try {
      const userProgress = await UserProgress.findOne({ where: { userId } });
      const completedTodos = await Todo.count({ where: { userId, status: 'done' } });
      const pendingTodos = await Todo.count({ where: { userId, status: 'pending' } });
      const totalStudySessions = 0; // Study rooms removed

      const response = `Here's your progress summary:\n\n` +
        `📊 **Level:** ${userProgress?.level || 1}\n` +
        `⭐ **Experience:** ${userProgress?.experience || 0} XP\n` +
        `✅ **Completed Tasks:** ${completedTodos}\n` +
        `📝 **Pending Tasks:** ${pendingTodos}\n` +
        `📚 **Study Sessions:** ${totalStudySessions}\n\n` +
        `You're making great progress! Keep up the excellent work! 🎉`;

      return response;
    } catch (error) {
      console.error('Error handling progress inquiry:', error);
      return "I'm having trouble accessing your progress right now. Please try again later.";
    }
  }

  // Handle general help
  async handleGeneralHelp(userId, message, context) {
    return `I'm here to help you with your learning journey! Here's what I can do:\n\n` +
      `📝 **Create Tasks:** "Create a todo to study math" or "Add a task to review notes"\n` +
      `📚 **Study Planning:** "Help me plan my study session" or "What should I study today?"\n` +
      `💪 **Motivation:** "I need motivation" or "Encourage me"\n` +
      `📊 **Progress:** "How am I doing?" or "Show my progress"\n` +
      `🎯 **Goals:** "Help me set learning goals" or "Create a study plan"\n\n` +
      `Just tell me what you need help with!`;
  }

  // Generate general response
  async generateGeneralResponse(userId, message, context) {
    const responses = [
      "I understand! How can I help you with your learning goals today?",
      "That's interesting! Would you like me to help you create a plan for that?",
      "I'm here to support your learning journey. What would you like to work on?",
      "Great question! Let me help you with that.",
      "I'd be happy to assist you with that. Can you tell me more?"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Generate suggestions based on intent
  async generateSuggestions(userId, intent) {
    const suggestions = {
      todo_creation: [
        "Create a study schedule",
        "Add a review task",
        "Set a learning goal"
      ],
      study_planning: [
        "Show my pending tasks",
        "Create a study session",
        "Plan my week"
      ],
      motivation: [
        "Show my progress",
        "Set new goals",
        "Join a study room"
      ],
      progress_inquiry: [
        "Create new tasks",
        "Join study sessions",
        "Set learning goals"
      ],
      general_help: [
        "Create a todo",
        "Plan my studies",
        "Check my progress"
      ]
    };

    return suggestions[intent.type] || suggestions.general_help;
  }

  // Log AI interaction
  async logAIInteraction(userId, userMessage, aiResponse, intent) {
    try {
      await UserAnalytics.create({
        userId,
        type: 'ai_interaction',
        value: 1,
        metadata: {
          userMessage,
          aiResponse,
          intent: intent.type,
          confidence: intent.confidence
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging AI interaction:', error);
    }
  }

  // AI-powered task scheduling
  async suggestOptimalSchedule(userId) {
    try {
      const todos = await Todo.findAll({
        where: { userId, status: 'pending' },
        order: [['dueDate', 'ASC']]
      });

      if (todos.length === 0) {
        return {
          message: "You don't have any pending tasks. Great job staying on top of things!",
          schedule: []
        };
      }

      // Simple scheduling algorithm
      const schedule = [];
      const today = new Date();
      let currentDay = new Date(today);

      for (const todo of todos) {
        const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
        const daysUntilDue = dueDate ? Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) : 7;

        let suggestedDay;
        if (daysUntilDue <= 0) {
          suggestedDay = today;
        } else if (daysUntilDue <= 2) {
          suggestedDay = new Date(today.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
        } else {
          suggestedDay = new Date(today.getTime() + Math.floor(daysUntilDue / 2) * 24 * 60 * 60 * 1000);
        }

        schedule.push({
          todo,
          suggestedDay: suggestedDay.toDateString(),
          priority: todo.priority,
          urgency: daysUntilDue <= 1 ? 'high' : daysUntilDue <= 3 ? 'medium' : 'low'
        });
      }

      return {
        message: "Here's your AI-suggested schedule based on your tasks and deadlines:",
        schedule: schedule.sort((a, b) => {
          if (a.urgency === 'high' && b.urgency !== 'high') return -1;
          if (b.urgency === 'high' && a.urgency !== 'high') return 1;
          return new Date(a.suggestedDay) - new Date(b.suggestedDay);
        })
      };
    } catch (error) {
      console.error('Error suggesting optimal schedule:', error);
      throw error;
    }
  }

  // AI-powered study recommendations
  async generateStudyRecommendations(userId) {
    try {
      const userProgress = await UserProgress.findOne({ where: { userId } });
      const completedTodos = await Todo.findAll({
        where: { userId, status: 'done' },
        order: [['updatedAt', 'DESC']],
        limit: 10
      });

      const recommendations = [];

      // Based on level
      if (userProgress && userProgress.level < 5) {
        recommendations.push({
          type: 'beginner',
          title: 'Build Your Foundation',
          description: 'Focus on completing basic tasks to level up quickly',
          action: 'Create simple daily goals'
        });
      } else if (userProgress && userProgress.level >= 10) {
        recommendations.push({
          type: 'advanced',
          title: 'Master Your Skills',
          description: 'Take on more challenging projects and mentor others',
          action: 'Join advanced study groups'
        });
      }

      // Based on completion patterns
      if (completedTodos.length > 0) {
        const recentCompletion = completedTodos[0];
        recommendations.push({
          type: 'pattern',
          title: 'Continue Your Momentum',
          description: `You recently completed "${recentCompletion.title}". Build on this success!`,
          action: 'Create related follow-up tasks'
        });
      }

      // Based on study sessions
      const studySessions = 0; // Study rooms removed
      if (studySessions === 0) {
        recommendations.push({
          type: 'social',
          title: 'Join Study Groups',
          description: 'Collaborate with others to enhance your learning experience',
          action: 'Join group todos for collaboration'
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating study recommendations:', error);
      throw error;
    }
  }
}

module.exports = new AIService(); 