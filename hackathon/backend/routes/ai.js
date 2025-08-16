const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config');
const { auth } = require('../middleware/auth');
const aiAssistant = require('../services/aiAssistant');
const rateLimit = require('express-rate-limit');
const { Todo } = require('../models');
const { Op } = require('sequelize');

// Route Chatbot AI Gemini
router.post('/chatbot', async (req, res) => {
  const { prompt } = req.body;
  try {
    const apiKey = config.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(400).json({ message: 'Missing AI API key' });

    if (config.GOOGLE_API_KEY) {
      const geminiRes = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
        { contents: [{ parts: [{ text: prompt }] }] }
      );
      const text = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi từ Gemini.';
      return res.json({ text });
    } else {
      const openaiRes = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
        },
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      const text = openaiRes.data.choices?.[0]?.message?.content || 'Không có phản hồi từ OpenAI.';
      return res.json({ text });
    }
  } catch (err) {
    return res.status(500).json({ message: 'AI API error', error: err.message });
  }
});

// Basic AI status (unauthenticated)
router.get('/status', async (req, res) => {
  try {
    const apiKey = config.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;
    const isAvailable = !!apiKey;
    res.json({
      success: true,
      status: isAvailable ? 'available' : 'unavailable',
      provider: config.GOOGLE_API_KEY ? 'gemini' : 'openai',
      message: isAvailable ? 'AI service is available' : 'AI service is not configured'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Failed to check AI status'
    });
  }
});

// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many AI requests, please try again later.'
  }
});

// Generate personalized study plan
router.post('/study-plan', auth, aiRateLimit, async (req, res) => {
  try {
    const { preferences = {} } = req.body;
    const userId = req.userId;

    // If AI is disabled, return a lightweight fallback plan
    if (!aiAssistant.isEnabled()) {
      return res.json({
        success: true,
        data: {
          success: true,
          studyPlan: 'Kế hoạch học tập cơ bản (fallback)\n- Mỗi ngày học 60 phút\n- Áp dụng Pomodoro 25/5\n- Ôn tập vào cuối tuần',
          generatedAt: new Date(),
          preferences
        },
        message: 'Study plan generated (fallback mode)'
      });
    }

    const result = await aiAssistant.generateStudyPlan(userId, preferences);

    res.json({
      success: true,
      data: result,
      message: 'Study plan generated successfully'
    });
  } catch (error) {
    console.error('Error generating study plan:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate study plan'
    });
  }
});

// Get learning recommendations
router.post('/recommendations', auth, aiRateLimit, async (req, res) => {
  try {
    const { context = {} } = req.body;
    const userId = req.userId;

    if (!aiAssistant.isEnabled()) {
      return res.json({
        success: true,
        data: {
          success: true,
          recommendations: [
            { title: 'Kỹ thuật Pomodoro', description: 'Học 25 phút, nghỉ 5 phút', action: 'Bắt đầu với 4 phiên mỗi ngày', benefit: 'Tăng tập trung', priority: 'high' }
          ],
          generatedAt: new Date(),
          context
        },
        message: 'Recommendations generated (fallback mode)'
      });
    }

    const result = await aiAssistant.getRecommendations(userId, context);

    res.json({ success: true, data: result, message: 'Recommendations generated successfully' });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate recommendations' });
  }
});

// Answer learning questions
router.post('/ask', auth, aiRateLimit, async (req, res) => {
  try {
    const { question, context = {} } = req.body;
    const userId = req.userId;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    if (!aiAssistant.isEnabled()) {
      return res.json({
        success: true,
        data: { success: true, answer: 'Câu trả lời mẫu (fallback). Vui lòng bật AI để có nội dung tốt hơn.' },
        message: 'Question answered (fallback mode)'
      });
    }

    const result = await aiAssistant.answerQuestion(userId, question.trim(), context);

    res.json({ success: true, data: result, message: 'Question answered successfully' });
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to answer question' });
  }
});

// Generate quiz questions
router.post('/quiz', auth, aiRateLimit, async (req, res) => {
  try {
    const { topic, difficulty = 'medium', questionCount = 5 } = req.body;
    const userId = req.userId;

    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Topic is required' });
    }

    if (!aiAssistant.isEnabled()) {
      return res.json({
        success: true,
        data: { success: true, quiz: { title: `Quiz: ${topic}`, topic, difficulty, questions: [] }, generatedAt: new Date() },
        message: 'Quiz generated (fallback mode)'
      });
    }

    const result = await aiAssistant.generateQuiz(userId, topic.trim(), difficulty, parseInt(questionCount));

    res.json({ success: true, data: result, message: 'Quiz generated successfully' });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate quiz' });
  }
});

// Enhanced AI Todo Generator
router.post('/enhanced-todo-generator', auth, aiRateLimit, async (req, res) => {
  try {
    const prompt = req.body.prompt || req.body.input || '';
    const context = req.body.context || {};
    const userId = req.userId;

    // Always allow a basic generation even if AI is disabled
    const result = await aiAssistant.generateEnhancedTodos(userId, prompt, context);

    res.json({ success: true, data: result, message: 'Enhanced todos generated successfully' });
  } catch (error) {
    console.error('Error generating enhanced todos:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate enhanced todos' });
  }
});

// AI Learning Planner (compatible with frontend payload)
router.post('/learning-planner', auth, aiRateLimit, async (req, res) => {
  try {
    const userId = req.userId;
    // Accept both shapes
    // Frontend may send: { goal, timeframe, currentLevel, preferences }
    // Or: { subject, goals, preferences }
    const { goal, timeframe, currentLevel, preferences = {}, subject, goals } = req.body || {};
    const mergedPreferences = {
      ...preferences,
      goal: goal || goals || '',
      timeframe: timeframe || preferences.timeframe || '',
      currentLevel: currentLevel || preferences.currentLevel || 'beginner',
      subject: subject || preferences.subject || ''
    };

    if (!aiAssistant.isEnabled()) {
      return res.json({
        success: true,
        data: {
          success: true,
          studyPlan: 'Kế hoạch học tập cơ bản (fallback) dựa trên mục tiêu của bạn.',
          generatedAt: new Date(),
          preferences: mergedPreferences
        },
        message: 'Learning plan generated (fallback mode)'
      });
    }

    // Use existing study plan generator under the hood
    const result = await aiAssistant.generateStudyPlan(userId, mergedPreferences);

    res.json({ success: true, data: result, message: 'Learning plan generated successfully' });
  } catch (error) {
    console.error('Error generating learning plan:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate learning plan' });
  }
});

// Smart Schedule Optimization - new endpoint
router.post('/schedule-optimization', auth, aiRateLimit, async (req, res) => {
  try {
    const { dateRange = {}, preferences = {}, applyOptimizations = false } = req.body || {};
    const userId = req.userId;

    // Basic analysis over user's todos (no external AI required)
    const todos = await Todo.findAll({ where: { userId } });
    const total = todos.length;
    const completed = todos.filter(t => t.status === 'done').length;
    const pending = total - completed;

    const analysis = {
      success: true,
      message: 'Schedule analyzed successfully',
      summary: { total, completed, pending },
      suggestions: [
        'Giảm số task trong một ngày nếu vượt quá ' + (preferences.maxTasksPerDay || 5),
        'Ưu tiên task có deadline gần',
        'Phân bổ thời gian học vào buổi ' + (preferences.preferredStudyTime || 'sáng')
      ],
      appliedOptimizations: []
    };

    // Optionally apply minimal optimizations
    if (applyOptimizations) {
      // Simple example: mark overdue todos as high priority
      const now = new Date();
      for (const todo of todos) {
        if (todo.deadline && todo.status !== 'done' && new Date(todo.deadline) < now) {
          await todo.update({ priorityLabel: 'high' });
          analysis.appliedOptimizations.push({ id: todo.id, change: 'Set high priority for overdue task' });
        }
      }
    }

    res.json({ success: true, data: analysis, message: 'Schedule optimization completed' });
  } catch (error) {
    console.error('Error optimizing schedule:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to optimize schedule' });
  }
});

// AI Schedule Analysis
router.get('/analyze-schedule', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Get user's tasks for analysis
    const tasks = await Todo.findAll({
      where: {
        userId,
        created_at: {
          [Op.between]: [weekStart, weekEnd]
        }
      },
      order: [['dueDate', 'ASC']]
    });

    const analysis = await performScheduleAnalysis(tasks, userId);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze schedule'
    });
  }
});

// Generate Monthly Report
router.get('/monthly-report', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const tasks = await Todo.findAll({
      where: {
        userId,
        created_at: {
          [Op.between]: [monthStart, monthEnd]
        }
      }
    });

    const report = await generateMonthlyReport(tasks, userId, monthStart, monthEnd);

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly report'
    });
  }
});

// Weekly Flashback
router.get('/weekly-flashback', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const flashback = await generateWeeklyFlashback(userId);

    res.json({
      success: true,
      flashback
    });
  } catch (error) {
    console.error('Error generating weekly flashback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate weekly flashback'
    });
  }
});

// Get Analytics Data
router.get('/analytics', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;

    const analytics = await getAnalyticsData(userId, period);

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// Get AI insights for user
router.get('/insights', auth, async (req, res) => {
  try {
    const todos = await Todo.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    const completed = todos.filter(t => t.status === 'done').length;
    const total = todos.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate overdue tasks
    const now = new Date();
    const overdue = todos.filter(t => 
      t.deadline && 
      t.status !== 'done' && 
      new Date(t.deadline) < now
    ).length;

    // Get productivity insights
    const insights = {
      completionRate,
      totalTasks: total,
      completedTasks: completed,
      overdueTasks: overdue,
      productivityScore: Math.max(0, completionRate - overdue * 10),
      recommendations: []
    };

    // Generate recommendations based on data
    if (completionRate < 50) {
      insights.recommendations.push('Consider breaking down large tasks into smaller, manageable pieces');
    }
    if (overdue > 0) {
      insights.recommendations.push('Focus on completing overdue tasks first');
    }
    if (total < 5) {
      insights.recommendations.push('Try adding more tasks to build momentum');
    }

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating insights'
    });
  }
});

// AI Helper Functions
async function performScheduleAnalysis(tasks, userId) {
  const analysis = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    pendingTasks: tasks.filter(t => t.status !== 'done').length,
    overdueTasks: tasks.filter(t => 
      t.deadline && t.status !== 'done' && new Date(t.deadline) < new Date()
    ).length,
    productivityScore: 0,
    recommendations: []
  };

  // Calculate productivity score
  if (analysis.totalTasks > 0) {
    analysis.productivityScore = Math.round((analysis.completedTasks / analysis.totalTasks) * 100);
  }

  // Generate recommendations
  if (analysis.overdueTasks > 0) {
    analysis.recommendations.push(`Focus on completing ${analysis.overdueTasks} overdue tasks first`);
  }
  if (analysis.productivityScore < 50) {
    analysis.recommendations.push('Consider breaking down large tasks into smaller, manageable pieces');
  }
  if (analysis.pendingTasks > 10) {
    analysis.recommendations.push('You have many pending tasks. Consider prioritizing them by deadline');
  }

  return analysis;
}

async function generateMonthlyReport(tasks, userId, monthStart, monthEnd) {
  const completedTasks = tasks.filter(t => t.status === 'done');
  const totalStudyTime = completedTasks.reduce((sum, t) => sum + (t.estimatedTime || 60), 0) / 60;

  const report = {
    period: {
      start: monthStart,
      end: monthEnd
    },
    summary: {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      totalStudyTime,
      averageTasksPerDay: Math.round(tasks.length / 30)
    },
    subjectBreakdown: {},
    recommendations: []
  };

  // Generate subject breakdown
  const subjectStats = {};
  for (const task of tasks) {
    if (!subjectStats[task.subject]) {
      subjectStats[task.subject] = { total: 0, completed: 0, time: 0 };
    }
    subjectStats[task.subject].total++;
    if (task.status === 'done') {
      subjectStats[task.subject].completed++;
      subjectStats[task.subject].time += (task.estimatedTime || 60);
    }
  }

  report.subjectBreakdown = subjectStats;

  // Generate recommendations
  if (report.summary.completionRate < 70) {
    report.recommendations.push('Focus on improving task completion rate');
  }
  if (report.summary.totalStudyTime < 20) {
    report.recommendations.push('Consider increasing study time for better results');
  }

  return report;
}

async function getAnalyticsData(userId, period) {
  return {
    studyConsistency: {
      score: 85,
      trend: 'improving',
      weeklyData: [
        { day: 'Mon', hours: 3.5, completed: 8 },
        { day: 'Tue', hours: 4.2, completed: 6 },
        { day: 'Wed', hours: 2.8, completed: 5 },
        { day: 'Thu', hours: 5.1, completed: 9 },
        { day: 'Fri', hours: 3.9, completed: 7 },
        { day: 'Sat', hours: 2.3, completed: 4 },
        { day: 'Sun', hours: 1.8, completed: 3 }
      ]
    },
    learningStyle: {
      primary: 'Visual',
      distribution: [
        { name: 'Visual', value: 45, color: '#3B82F6' },
        { name: 'Auditory', value: 25, color: '#10B981' },
        { name: 'Kinesthetic', value: 30, color: '#F59E0B' }
      ]
    },
    subjectEngagement: [
      { subject: 'Math', engagement: 92, timeSpent: 120, completed: 15 },
      { subject: 'Physics', engagement: 78, timeSpent: 95, completed: 12 },
      { subject: 'Programming', engagement: 95, timeSpent: 150, completed: 18 }
    ],
    productivityPatterns: {
      peakHours: [9, 10, 14, 15],
      averageSessionLength: 45,
      completionRate: 78,
      focusScore: 82
    }
  };
}

async function generateWeeklyFlashback(userId) {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    weekRange: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
    totalTasks: 28,
    completedTasks: 23,
    completionRate: 82,
    totalStudyTime: 18.5,
    streakDays: 6,
    topSubject: 'Programming',
    achievements: [
      {
        id: 1,
        title: 'Study Streak Master',
        description: 'Maintained a 6-day study streak!',
        icon: '🔥',
        rarity: 'rare',
        points: 100
      }
    ],
    highlights: [
      {
        day: 'Monday',
        event: 'Completed Math Assignment',
        image: '📊',
        description: 'Finished calculus problems with 95% accuracy'
      }
    ],
    improvements: [
      {
        area: 'Time Management',
        before: 65,
        after: 78,
        improvement: '+13%'
      }
    ],
    nextWeekGoals: [
      'Complete all Math assignments on time',
      'Maintain 7-day study streak'
    ],
    motivationalQuote: {
      text: "Success is the sum of small efforts repeated day in and day out.",
      author: "Robert Collier"
    }
  };
}

// AI Chat endpoint for todo creation
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.userId;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Use AI assistant to generate response and suggestions
    const aiResponse = await aiAssistant.processChatMessage(userId, message, context);

    res.json({
      success: true,
      response: aiResponse.response,
      suggestions: aiResponse.suggestions || []
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing AI chat message'
    });
  }
});

// AI Chatbot endpoint

module.exports = router;