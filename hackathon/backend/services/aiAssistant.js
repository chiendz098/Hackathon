const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Analytics, User, UserProgress, Todo, Achievement } = require('../models');

class AILearningAssistant {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  // Generate personalized study plan
  async generateStudyPlan(userId, preferences = {}) {
    try {
      const userContext = await this.getUserContext(userId);
      
      const prompt = `
        Bạn là một AI trợ lý học tập thông minh. Hãy tạo một kế hoạch học tập cá nhân hóa cho học sinh với thông tin sau:

        Thông tin học sinh:
        - Level hiện tại: ${userContext.level}
        - Tổng XP: ${userContext.totalXP}
        - Chuỗi ngày học: ${userContext.currentStreak} ngày
        - Nhiệm vụ đã hoàn thành: ${userContext.completedTasks}
        - Thời gian học trung bình: ${userContext.avgStudyTime} phút/ngày
        - Môn học yêu thích: ${userContext.favoriteSubjects?.join(', ') || 'Chưa xác định'}
        - Mục tiêu: ${preferences.goals || 'Cải thiện kết quả học tập'}
        - Thời gian có sẵn: ${preferences.availableTime || '1-2 giờ/ngày'}
        - Phong cách học: ${preferences.learningStyle || 'Hỗn hợp'}

        Hãy tạo một kế hoạch học tập chi tiết bao gồm:
        1. Mục tiêu ngắn hạn (1 tuần)
        2. Mục tiêu trung hạn (1 tháng)
        3. Lịch học hàng ngày được đề xuất
        4. Các kỹ thuật học tập phù hợp
        5. Cách theo dõi tiến độ
        6. Lời khuyên cá nhân hóa

        Trả lời bằng tiếng Việt, có cấu trúc rõ ràng và thực tế.
      `;

      const result = await this.model.generateContent(prompt);
      const studyPlan = result.response.text();

      // Track AI usage
      await Analytics.trackEvent({
        userId,
        eventType: 'ai_study_plan_generated',
        eventData: {
          preferences,
          planLength: studyPlan.length,
          model: 'gemini-pro'
        }
      });

      return {
        success: true,
        studyPlan,
        generatedAt: new Date(),
        preferences
      };

    } catch (error) {
      console.error('Error generating study plan:', error);
      throw new Error('Không thể tạo kế hoạch học tập. Vui lòng thử lại sau.');
    }
  }

  // Provide learning recommendations
  async getRecommendations(userId, context = {}) {
    try {
      const userContext = await this.getUserContext(userId);
      const recentActivity = await this.getRecentActivity(userId);

      const prompt = `
        Dựa trên hoạt động học tập gần đây của học sinh, hãy đưa ra 5 gợi ý cải thiện:

        Thông tin học sinh:
        - Level: ${userContext.level}
        - Chuỗi ngày học: ${userContext.currentStreak} ngày
        - Hiệu suất gần đây: ${recentActivity.efficiency}%
        - Thời gian học hôm nay: ${recentActivity.todayStudyTime} phút
        - Nhiệm vụ hoàn thành tuần này: ${recentActivity.weeklyTasks}
        - Khó khăn hiện tại: ${context.challenges || 'Chưa xác định'}

        Hoạt động gần đây:
        ${recentActivity.summary}

        Hãy đưa ra 5 gợi ý cụ thể, thực tế và có thể thực hiện ngay để cải thiện hiệu quả học tập.
        Mỗi gợi ý nên có:
        - Tiêu đề ngắn gọn
        - Mô tả chi tiết
        - Cách thực hiện
        - Lợi ích mong đợi

        Trả lời bằng tiếng Việt, định dạng JSON với cấu trúc:
        {
          "recommendations": [
            {
              "title": "Tiêu đề",
              "description": "Mô tả",
              "action": "Cách thực hiện",
              "benefit": "Lợi ích",
              "priority": "high|medium|low"
            }
          ]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Bạn là một AI trợ lý học tập, chuyên phân tích dữ liệu học tập và đưa ra gợi ý cải thiện cá nhân hóa.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.6
      });

      let recommendations;
      try {
        recommendations = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        recommendations = {
          recommendations: [
            {
              title: "Cải thiện thói quen học tập",
              description: response.choices[0].message.content.substring(0, 200) + "...",
              action: "Áp dụng kỹ thuật Pomodoro",
              benefit: "Tăng tập trung và hiệu quả",
              priority: "high"
            }
          ]
        };
      }

      // Track AI usage
      await Analytics.trackEvent({
        userId,
        eventType: 'ai_recommendations_generated',
        eventData: {
          recommendationCount: recommendations.recommendations?.length || 0,
          context,
          model: this.model
        }
      });

      return {
        success: true,
        recommendations: recommendations.recommendations || [],
        generatedAt: new Date(),
        context
      };

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Không thể tạo gợi ý học tập. Vui lòng thử lại sau.');
    }
  }

  // Answer learning questions
  async answerQuestion(userId, question, context = {}) {
    try {
      const userContext = await this.getUserContext(userId);

      const prompt = `
        Học sinh cần hỗ trợ với câu hỏi sau:
        "${question}"

        Thông tin học sinh:
        - Level: ${userContext.level}
        - Môn học đang học: ${context.subject || 'Chưa xác định'}
        - Cấp độ: ${context.grade || 'Chưa xác định'}

        Hãy trả lời câu hỏi một cách:
        - Dễ hiểu, phù hợp với trình độ
        - Chi tiết nhưng không quá phức tạp
        - Có ví dụ minh họa nếu cần
        - Khuyến khích học sinh tự suy nghĩ
        - Đưa ra các bước giải quyết rõ ràng

        Nếu câu hỏi không liên quan đến học tập, hãy lịch sự chuyển hướng về chủ đề học tập.
        Trả lời bằng tiếng Việt.
      `;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Bạn là một AI gia sư thông minh, chuyên hỗ trợ học sinh giải đáp thắc mắc và hướng dẫn học tập hiệu quả.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.5
      });

      const answer = response.choices[0].message.content;

      // Track AI usage
      await Analytics.trackEvent({
        userId,
        eventType: 'ai_question_answered',
        eventData: {
          question: question.substring(0, 100),
          questionLength: question.length,
          answerLength: answer.length,
          subject: context.subject,
          model: this.model
        }
      });

      return {
        success: true,
        answer,
        question,
        answeredAt: new Date(),
        context
      };

    } catch (error) {
      console.error('Error answering question:', error);
      throw new Error('Không thể trả lời câu hỏi. Vui lòng thử lại sau.');
    }
  }

  // Generate quiz questions
  async generateQuiz(userId, topic, difficulty = 'medium', questionCount = 5) {
    try {
      const prompt = `
        Tạo một bài quiz về chủ đề "${topic}" với các yêu cầu:
        - Số câu hỏi: ${questionCount}
        - Độ khó: ${difficulty}
        - Định dạng: Trắc nghiệm 4 đáp án (A, B, C, D)
        - Phù hợp với học sinh Việt Nam

        Trả lời theo định dạng JSON:
        {
          "quiz": {
            "title": "Tiêu đề bài quiz",
            "topic": "${topic}",
            "difficulty": "${difficulty}",
            "questions": [
              {
                "id": 1,
                "question": "Câu hỏi",
                "options": {
                  "A": "Đáp án A",
                  "B": "Đáp án B", 
                  "C": "Đáp án C",
                  "D": "Đáp án D"
                },
                "correctAnswer": "A",
                "explanation": "Giải thích đáp án đúng"
              }
            ]
          }
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Bạn là một AI chuyên tạo câu hỏi quiz giáo dục chất lượng cao cho học sinh.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens * 2,
        temperature: 0.7
      });

      let quiz;
      try {
        quiz = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        throw new Error('Không thể tạo quiz. Vui lòng thử lại.');
      }

      // Track AI usage
      await Analytics.trackEvent({
        userId,
        eventType: 'ai_quiz_generated',
        eventData: {
          topic,
          difficulty,
          questionCount,
          model: this.model
        }
      });

      return {
        success: true,
        quiz: quiz.quiz,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Error generating quiz:', error);
      throw new Error('Không thể tạo quiz. Vui lòng thử lại sau.');
    }
  }

  // Generate enhanced todos (works in dev without external AI)
  async generateEnhancedTodos(userId, prompt, context = {}) {
    try {
      // If AI is disabled, return a deterministic fallback result
      const aiDisabled = !this.isEnabled();

      const normalizedPrompt = (prompt || '').toString();
      
      // Create enhanced todos based on AI analysis or fallback logic
      const enhancedTodos = await this.analyzeAndCreateTodos(userId, normalizedPrompt, context);

      // Track event (best effort)
      try {
        await Analytics.trackEvent({
          userId,
          eventType: 'ai_enhanced_todos_generated',
          eventData: {
            prompt: normalizedPrompt.substring(0, 100),
            createdCount: enhancedTodos.length,
            aiDisabled
          }
        });
      } catch (_) {}

      return {
        success: true,
        todos: enhancedTodos,
        aiDisabled,
        message: aiDisabled ? 'AI service unavailable, using enhanced fallback logic' : 'AI-enhanced todos generated successfully'
      };
    } catch (error) {
      console.error('Error generating enhanced todos:', error);
      return {
        success: false,
        error: error.message,
        todos: []
      };
    }
  }

  // Analyze user input and create intelligent todos
  async analyzeAndCreateTodos(userId, prompt, context = {}) {
    try {
      // Get user's existing todos for context
      const existingTodos = await Todo.findAll({
        where: { userId },
        limit: 10,
        order: [['createdAt', 'DESC']]
      });

      // Analyze prompt and create relevant todos
      const todos = [];
      const words = prompt.toLowerCase().split(/\s+/);
      
      // Create intelligent todo based on prompt analysis
      const todo = await Todo.create({
        userId,
        title: this.generateSmartTitle(prompt),
        description: this.generateSmartDescription(prompt, context),
        priority: this.analyzePriority(words),
        status: 'pending',
        tags: this.extractTags(words, context),
        estimatedTime: this.estimateTime(words),
        difficulty: this.analyzeDifficulty(words),
        category: this.categorizeTask(words),
        subject: this.extractSubject(words)
      });

      todos.push(todo);
      return todos;
    } catch (error) {
      console.error('Error analyzing and creating todos:', error);
      return [];
    }
  }

  // Helper methods for intelligent todo creation
  generateSmartTitle(prompt) {
    const firstSentence = prompt.split(/[.!?]/)[0];
    return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
  }

  generateSmartDescription(prompt, context) {
    return `AI-generated task based on: "${prompt}"${context.tags ? `\nTags: ${context.tags.join(', ')}` : ''}`;
  }

  analyzePriority(words) {
    const urgentWords = ['urgent', 'asap', 'immediately', 'emergency', 'critical'];
    const highWords = ['important', 'exam', 'test', 'deadline', 'due'];
    const lowWords = ['later', 'when possible', 'optional', 'sometime'];
    
    if (urgentWords.some(word => words.includes(word))) return 5;
    if (highWords.some(word => words.includes(word))) return 4;
    if (lowWords.some(word => words.includes(word))) return 2;
    return 3; // medium
  }

  extractTags(words, context) {
    const tags = ['ai-generated'];
    if (context.tags && Array.isArray(context.tags)) {
      tags.push(...context.tags);
    }
    return tags;
  }

  estimateTime(words) {
    const timeWords = {
      'quick': 15, 'brief': 15, 'short': 30,
      'hour': 60, '1 hour': 60, 'one hour': 60,
      '2 hours': 120, 'two hours': 120, 'long': 120
    };
    
    for (const [word, time] of Object.entries(timeWords)) {
      if (words.includes(word)) return time;
    }
    return 60; // default 1 hour
  }

  analyzeDifficulty(words) {
    const easyWords = ['easy', 'simple', 'basic'];
    const hardWords = ['hard', 'difficult', 'complex', 'challenging'];
    const veryHardWords = ['very hard', 'extremely difficult', 'advanced'];
    
    if (veryHardWords.some(phrase => words.join(' ').includes(phrase))) return 5;
    if (hardWords.some(word => words.includes(word))) return 4;
    if (easyWords.some(word => words.includes(word))) return 2;
    return 3; // medium
  }

  categorizeTask(words) {
    const categories = {
      'study': ['study', 'learn', 'read', 'research'],
      'work': ['work', 'project', 'assignment', 'task'],
      'personal': ['personal', 'life', 'health', 'exercise'],
      'academic': ['academic', 'school', 'university', 'college']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => words.includes(keyword))) return category;
    }
    return 'other';
  }

  extractSubject(words) {
    const subjects = {
      'math': ['math', 'mathematics', 'calculus', 'algebra', 'geometry'],
      'physics': ['physics', 'science', 'mechanics', 'thermodynamics'],
      'chemistry': ['chemistry', 'chemical', 'molecular'],
      'programming': ['programming', 'code', 'coding', 'software', 'development'],
      'literature': ['literature', 'english', 'writing', 'essay', 'poetry'],
      'history': ['history', 'historical', 'past', 'ancient']
    };
    
    for (const [subject, keywords] of Object.entries(subjects)) {
      if (keywords.some(keyword => words.includes(keyword))) return subject;
    }
    return 'general';
  }

  // Process chat message for todo creation
  async processChatMessage(userId, message, context = {}) {
    try {
      const aiDisabled = !this.isEnabled();
      
      if (aiDisabled) {
        // Fallback response when AI is disabled
        const response = `I understand you want to "${message}". I can help you create a task for this. What would you like to call this task?`;
        
        // Generate basic suggestions
        const suggestions = await this.generateBasicSuggestions(message, context);
        
        return {
          response,
          suggestions
        };
      }

      // Use AI to generate intelligent response
      const prompt = `User wants to: "${message}". Context: ${JSON.stringify(context)}. 
      Generate a helpful response and suggest 2-3 task options with appropriate titles, descriptions, priorities, and estimated time.`;
      
      const aiResponse = await this.generateResponse(prompt);
      
      // Parse AI response to extract suggestions
      const suggestions = await this.parseSuggestionsFromResponse(aiResponse, message, context);
      
      return {
        response: aiResponse,
        suggestions
      };
    } catch (error) {
      console.error('Error processing chat message:', error);
      
      // Fallback response
      const response = `I understand you want to "${message}". Let me help you create a task for this.`;
      const suggestions = await this.generateBasicSuggestions(message, context);
      
      return {
        response,
        suggestions
      };
    }
  }

  // Generate basic suggestions when AI is disabled
  async generateBasicSuggestions(message, context) {
    try {
      const words = message.toLowerCase().split(/\s+/);
      
      const suggestion = {
        title: this.generateSmartTitle(message),
        description: this.generateSmartDescription(message, context),
        priority: this.analyzePriority(words),
        status: 'pending',
        tags: this.extractTags(words, context),
        estimatedTime: this.estimateTime(words),
        difficulty: this.analyzeDifficulty(words),
        category: this.categorizeTask(words),
        subject: this.extractSubject(words)
      };

      return [suggestion];
    } catch (error) {
      console.error('Error generating basic suggestions:', error);
      return [];
    }
  }

  // Parse suggestions from AI response
  async parseSuggestionsFromResponse(aiResponse, originalMessage, context) {
    try {
      // This is a simplified parser - in production, you'd want more sophisticated parsing
      const suggestions = [];
      
      // Extract task information from AI response
      const words = originalMessage.toLowerCase().split(/\s+/);
      
      const suggestion = {
        title: this.generateSmartTitle(originalMessage),
        description: this.generateSmartDescription(originalMessage, context),
        priority: this.analyzePriority(words),
        status: 'pending',
        tags: this.extractTags(words, context),
        estimatedTime: this.estimateTime(words),
        difficulty: this.analyzeDifficulty(words),
        category: this.categorizeTask(words),
        subject: this.extractSubject(words)
      };

      suggestions.push(suggestion);
      
      return suggestions;
    } catch (error) {
      console.error('Error parsing suggestions from AI response:', error);
      return [];
    }
  }

  // Generate AI response
  async generateResponse(prompt) {
    try {
      if (!this.isEnabled()) {
        return "I'm currently in fallback mode. I can help you create tasks based on your input.";
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant that helps users create and organize tasks. Be concise and practical.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm having trouble processing that right now. Let me help you create a basic task instead.";
    }
  }

  // Get user context for AI personalization
  async getUserContext(userId) {
    try {
      const [user, userProgress, completedTasks, recentEvents] = await Promise.all([
        User.findByPk(userId),
        UserProgress.findOne({ where: { userId } }),
        Todo.count({ where: { userId, status: 'done' } }),
        Analytics.getUserEvents(userId, null, 50)
      ]);

      const studyEvents = recentEvents.filter(e => 
        ['study_session_end', 'pomodoro_completed'].includes(e.eventType)
      );

      const totalStudyTime = studyEvents
        .reduce((sum, event) => sum + (event.duration || 0), 0) / 60;

      const avgStudyTime = studyEvents.length > 0 
        ? Math.round(totalStudyTime / Math.max(1, studyEvents.length))
        : 0;

      return {
        name: user?.name || 'Học sinh',
        level: userProgress?.currentLevel || 1,
        totalXP: userProgress?.totalXP || 0,
        currentStreak: userProgress?.currentStreak || 0,
        completedTasks,
        avgStudyTime,
        favoriteSubjects: userProgress?.favoriteSubjects || [],
        learningStyle: userProgress?.learningStyle || 'mixed'
      };

    } catch (error) {
      console.error('Error getting user context:', error);
      return {
        name: 'Học sinh',
        level: 1,
        totalXP: 0,
        currentStreak: 0,
        completedTasks: 0,
        avgStudyTime: 0,
        favoriteSubjects: [],
        learningStyle: 'mixed'
      };
    }
  }

  // Get recent activity summary
  async getRecentActivity(userId) {
    try {
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [recentEvents, todayEvents, weeklyTasks] = await Promise.all([
        Analytics.getEventsByTimeRange(last7Days, new Date()),
        Analytics.getEventsByTimeRange(today, new Date()),
        Todo.count({
          where: {
            userId,
            status: 'done',
            completedAt: { [require('sequelize').Op.gte]: last7Days }
          }
        })
      ]);

      const studyEvents = recentEvents.filter(e => e.eventType === 'study_session_end');
      const todayStudyEvents = todayEvents.filter(e => e.eventType === 'study_session_end');
      const pomodoroEvents = recentEvents.filter(e => e.eventType === 'pomodoro_completed');

      const totalStudyTime = studyEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / 60;
      const todayStudyTime = todayStudyEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / 60;
      const efficiency = studyEvents.length > 0 ? (pomodoroEvents.length / studyEvents.length) * 100 : 0;

      const summary = `
        - Đã học ${Math.round(totalStudyTime)} phút trong 7 ngày qua
        - Hoàn thành ${weeklyTasks} nhiệm vụ tuần này
        - Sử dụng Pomodoro ${pomodoroEvents.length} lần
        - Hiệu suất tập trung: ${Math.round(efficiency)}%
      `;

      return {
        efficiency: Math.round(efficiency),
        todayStudyTime: Math.round(todayStudyTime),
        weeklyTasks,
        summary: summary.trim()
      };

    } catch (error) {
      console.error('Error getting recent activity:', error);
      return {
        efficiency: 0,
        todayStudyTime: 0,
        weeklyTasks: 0,
        summary: 'Chưa có đủ dữ liệu hoạt động gần đây.'
      };
    }
  }

  // Check if AI features are enabled
  isEnabled() {
    // Be dev-friendly: allow fallback mode without keys
    const keysPresent = (process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY);
    const enabledFlag = process.env.AI_ENABLED === 'true';
    // If explicitly enabled and keys exist -> true; else false to trigger fallback in routes
    return enabledFlag && !!keysPresent;
  }
}

module.exports = new AILearningAssistant();
