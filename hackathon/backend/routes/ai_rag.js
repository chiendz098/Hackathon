const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');
const { Todo, User, Group, TrialCourse } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const config = require('../config/config.json');

// Using imported auth middleware from ../middleware/auth

// Function map cho AI gọi CRUD
const ragFunctions = {
  async getTodos({ userId }) {
    const todos = await Todo.findAll({ where: { userId } });
    return todos.map(t => ({ title: t.title, deadline: t.deadline, isDone: t.isDone }));
  },
  async createTodo({ userId, title, deadline }) {
    const todo = await Todo.create({ userId, title, deadline });
    return { success: true, todo: { title: todo.title, deadline: todo.deadline } };
  },
  async updateTodo({ userId, title, isDone }) {
    const todo = await Todo.findOne({ where: { userId, title } });
    if (todo) {
      await todo.update({ isDone });
      return { success: true, todo };
    }
    return { success: false };
  },
  async deleteTodo({ userId, title }) {
    const todo = await Todo.findOne({ where: { userId, title } });
    if (todo) {
      await todo.destroy();
      return { success: true };
    }
    return { success: false };
  },
  // GROUP CRUD
  async getGroups({ userId }) {
    const user = await User.findByPk(userId, { include: { model: Group, as: 'groups' } });
    return user ? user.groups.map(g => ({ name: g.name, description: g.description })) : [];
  },
  async createGroup({ userId, name, description }) {
    const group = await Group.create({ name, description });
    await group.addMember(userId);
    return { success: true, group: { name: group.name, description: group.description } };
  },
  async joinGroup({ userId, name }) {
    const group = await Group.findOne({ where: { name } });
    if (group) {
      await group.addMember(userId);
      return { success: true, group };
    }
    return { success: false };
  },
  async leaveGroup({ userId, name }) {
    const group = await Group.findOne({ where: { name } });
    if (group) {
      await group.removeMember(userId);
      return { success: true };
    }
    return { success: false };
  },
  // FILE CRUD
  async getFiles() {
    const uploadDir = path.join(__dirname, '../uploads');
    const files = fs.readdirSync(uploadDir).map(f => ({ filename: f, url: `/api/file/download/${f}` }));
    return files;
  },
  async deleteFile({ filename }) {
    const uploadDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, message: 'File not found' };
  },
  // LEARNING PROGRESS CRUD
  async getLearningProgress({ userId }) {
    const user = await User.findByPk(userId);
    return user ? user.learningProgress || {} : {};
  },
  async updateLearningProgress({ userId, progress }) {
    const user = await User.findByPk(userId);
    if (user) {
      await user.update({ learningProgress: progress });
      return { success: true };
    }
    return { success: false };
  },
  // QUIZ/TRIALCOURSE CRUD
  async getTrialCourses() {
    const courses = await TrialCourse.findAll();
    return courses.map(c => ({ title: c.title, description: c.description }));
  },
  async getTrialQuiz({ major }) {
    const course = await TrialCourse.findOne({ where: { title: major } });
    return course ? { title: course.title, description: course.description } : null;
  },
  // TODO: Thêm các function cho nhóm, tài liệu, tiến trình học, ...
};

// Get user's todos for RAG
const getUserTodos = async (userId) => {
  const todos = await Todo.findAll({
    where: { userId },
    attributes: ['title', 'deadline', 'status'],
    order: [['createdAt', 'DESC']],
    limit: 50
  });
  return todos.map(t => ({ title: t.title, deadline: t.deadline, status: t.status }));
};

// Update todo status via RAG
const updateTodo = async ({ userId, title, status }) => {
  const todo = await Todo.findOne({
    where: { userId, title }
  });
  if (todo) {
    await todo.update({ status });
    return true;
  }
  return false;
};

// Endpoint AI RAG Chatbot
router.post('/rag-chatbot', auth, async (req, res) => {
  const { prompt } = req.body;
  const userId = req.user.id;
  try {
    // Gọi Gemini/GPT-4 function calling để phân tích intent và gọi function phù hợp
    // DEMO: Dùng từ khóa đơn giản, thực tế nên dùng OpenAI function calling hoặc Gemini function calling
    let result;
    if (/tạo to-do|add to-do|create to-do/i.test(prompt)) {
      // Ví dụ: "Tạo to-do nộp bài toán vào thứ 3"
      const title = prompt.split('to-do')[1]?.trim() || 'To-do mới';
      result = await ragFunctions.createTodo({ userId, title });
    } else if (/xem to-do|show to-do|list to-do/i.test(prompt)) {
      result = await ragFunctions.getTodos({ userId });
    } else if (/hoàn thành|done|mark as done/i.test(prompt)) {
      // Ví dụ: "Đánh dấu hoàn thành to-do nộp bài toán"
      const title = prompt.split('to-do')[1]?.trim() || '';
      result = await ragFunctions.updateTodo({ userId, title, isDone: true });
    } else if (/xóa to-do|delete to-do/i.test(prompt)) {
      const title = prompt.split('to-do')[1]?.trim() || '';
      result = await ragFunctions.deleteTodo({ userId, title });
    } else if (/tạo nhóm|create group/i.test(prompt)) {
      const name = prompt.split('nhóm')[1]?.trim() || 'Nhóm mới';
      result = await ragFunctions.createGroup({ userId, name });
    } else if (/xem nhóm|show group|list group/i.test(prompt)) {
      result = await ragFunctions.getGroups({ userId });
    } else if (/tham gia nhóm|join group/i.test(prompt)) {
      const name = prompt.split('nhóm')[1]?.trim() || '';
      result = await ragFunctions.joinGroup({ userId, name });
    } else if (/rời nhóm|leave group/i.test(prompt)) {
      const name = prompt.split('nhóm')[1]?.trim() || '';
      result = await ragFunctions.leaveGroup({ userId, name });
    } else if (/xem file|show file|list file/i.test(prompt)) {
      result = await ragFunctions.getFiles();
    } else if (/xóa file|delete file/i.test(prompt)) {
      const filename = prompt.split('file')[1]?.trim() || '';
      result = await ragFunctions.deleteFile({ filename });
    } else if (/xem tiến trình|show progress|learning progress/i.test(prompt)) {
      result = await ragFunctions.getLearningProgress({ userId });
    } else if (/cập nhật tiến trình|update progress/i.test(prompt)) {
      // Ví dụ: "Cập nhật tiến trình {"cntt": 80}"
      const progress = (() => { try { return JSON.parse(prompt.split('tiến trình')[1]); } catch { return {}; } })();
      result = await ragFunctions.updateLearningProgress({ userId, progress });
    } else if (/xem quiz|xem học thử|show trial|list trial/i.test(prompt)) {
      result = await ragFunctions.getTrialCourses();
    } else if (/quiz ngành|quiz trial|quiz major/i.test(prompt)) {
      const major = prompt.split('ngành')[1]?.trim() || '';
      result = await ragFunctions.getTrialQuiz({ major });
    } else {
      // Nếu không phải CRUD, gọi Gemini/GPT-4 trả lời tự do
      const apiKey = config.GOOGLE_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) return res.status(400).json({ message: 'Missing AI API key' });
      let text = '';
      if (config.GOOGLE_API_KEY) {
        const geminiRes = await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
          { contents: [{ parts: [{ text: prompt }] }] }
        );
        text = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi từ Gemini.';
      } else {
        const openaiRes = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
          },
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        text = openaiRes.data.choices?.[0]?.message?.content || 'Không có phản hồi từ OpenAI.';
      }
      result = { text };
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'AI RAG error', error: err.message });
  }
});

// Enhanced AI Todo Generator - Parse natural language and create detailed study plans
router.post('/enhanced-todo-generator', auth, async (req, res) => {
  try {
    const { input, context } = req.body;
    const userId = req.user.id;

    if (!input) {
      return res.status(400).json({ message: 'Input is required' });
    }

    const enhancedTodoPrompt = `You are an advanced AI Todo Generator for a learning platform. Parse the following natural language input and create detailed study tasks with specific time allocations.

User Input: "${input}"
Context: ${JSON.stringify(context || {})}
Current Date: ${new Date().toISOString()}

Analyze the input and determine:
1. Subject/Topic
2. Learning goals
3. Timeframe (if mentioned)
4. Difficulty level
5. Specific requirements

Then create a detailed study plan with daily tasks. Format as JSON:

{
  "analysis": {
    "subject": "detected subject",
    "goals": ["goal1", "goal2"],
    "timeframe": "detected timeframe",
    "difficulty": "beginner|intermediate|advanced",
    "taskType": "study|exam|project|assignment"
  },
  "studyPlan": {
    "title": "Generated plan title",
    "totalDuration": "X days/weeks",
    "dailyTimeCommitment": "X hours",
    "tasks": [
      {
        "title": "Specific task title",
        "description": "Detailed description of what to do",
        "timeAllocation": "X minutes",
        "priority": "high|medium|low",
        "type": "study|practice|review|quiz|project",
        "dueDate": "YYYY-MM-DD",
        "subtasks": [
          {
            "title": "Subtask title",
            "timeEstimate": "X minutes",
            "completed": false
          }
        ],
        "resources": ["resource1", "resource2"],
        "tags": ["tag1", "tag2"]
      }
    ],
    "milestones": [
      {
        "week": 1,
        "goal": "What should be achieved",
        "assessment": "How to measure progress"
      }
    ]
  },
  "recommendations": {
    "studyTips": ["tip1", "tip2"],
    "scheduleOptimization": "Best times to study this subject",
    "difficultyAdjustment": "How to adjust if too easy/hard"
  }
}

Examples of what to detect:
- "Biology test next week" → Create daily study tasks for biology, deadline in 7 days
- "Master OOP in 7 days" → Create object-oriented programming learning plan
- "Prepare for calculus exam on Friday" → Create math study schedule
- "Learn React for my project" → Create React learning roadmap

Be specific with time allocations (15-90 minutes per task) and create actionable, measurable tasks.
Respond in Vietnamese for task titles and descriptions.`;

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + config.GOOGLE_API_KEY,
      {
        contents: [{
          parts: [{
            text: enhancedTodoPrompt
          }]
        }]
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;

    // Extract JSON from response with improved parsing
    let parsedPlan = null;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        // Clean the JSON by removing comments and fixing common issues
        let cleanJson = jsonMatch[0]
          .replace(/\/\/.*$/gm, '') // Remove single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
          .replace(/,\s*}/g, '}') // Remove trailing commas before }
          .replace(/,\s*]/g, ']') // Remove trailing commas before ]
          .replace(/\n\s*\/\/.*$/gm, '') // Remove comments at end of lines
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();

        parsedPlan = JSON.parse(cleanJson);
      } catch (e) {
        console.log('Could not parse AI response JSON:', e);
        // Try to extract a simpler structure
        try {
          const analysisMatch = aiResponse.match(/"analysis":\s*\{[^}]*\}/);
          const studyPlanMatch = aiResponse.match(/"studyPlan":\s*\{[\s\S]*?"tasks":\s*\[[^\]]*\]/);

          if (analysisMatch && studyPlanMatch) {
            parsedPlan = {
              analysis: JSON.parse(`{${analysisMatch[0]}}`),
              studyPlan: { tasks: [] }, // Simplified structure
              recommendations: { studyTips: ["Học đều đặn mỗi ngày", "Thực hành nhiều"] }
            };
          }
        } catch (fallbackError) {
          console.log('Fallback parsing also failed:', fallbackError);
        }
      }
    }

    // If we have a valid plan, create the todos in the database
    let createdTodos = [];
    if (parsedPlan && parsedPlan.studyPlan && parsedPlan.studyPlan.tasks) {
      for (const task of parsedPlan.studyPlan.tasks) {
        try {
          const todoData = {
            userId: userId,
            title: task.title,
            description: task.description,
            priority: task.priority === 'high' ? 5 : task.priority === 'medium' ? 3 : 1,
            priorityLabel: task.priority,
            type: task.type || 'study',
            estimatedTime: parseInt(task.timeAllocation) || 30,
            deadline: task.dueDate ? new Date(task.dueDate) : null,
            tags: task.tags || [],
            customFields: {
              aiGenerated: true,
              originalInput: input,
              timeAllocation: task.timeAllocation,
              resources: task.resources || [],
              subtasks: task.subtasks || []
            }
          };

          const todo = await Todo.create(todoData);
          createdTodos.push(todo);

          // Create subtasks if any
          if (task.subtasks && task.subtasks.length > 0) {
            for (const subtask of task.subtasks) {
              await Todo.create({
                userId: userId,
                title: subtask.title,
                description: `Subtask của: ${task.title}`,
                parentTodoId: todo.id,
                estimatedTime: parseInt(subtask.timeEstimate) || 15,
                priority: 2,
                priorityLabel: 'low',
                type: 'study',
                customFields: {
                  aiGenerated: true,
                  isSubtask: true
                }
              });
            }
          }
        } catch (error) {
          console.error('Error creating todo:', error);
        }
      }
    }

    res.json({
      success: true,
      analysis: parsedPlan?.analysis,
      studyPlan: parsedPlan?.studyPlan,
      recommendations: parsedPlan?.recommendations,
      createdTodos: createdTodos.length,
      todos: createdTodos,
      aiResponse: aiResponse,
      message: `Đã tạo thành công ${createdTodos.length} task từ yêu cầu của bạn!`
    });

  } catch (error) {
    console.error('Enhanced todo generator error:', error);
    res.status(500).json({ message: 'Error generating study plan', error: error.message });
  }
});

// Learning Planner endpoint
router.post('/learning-planner', async (req, res) => {
  try {
    const { message, userId, conversationHistory } = req.body;

    // Enhanced prompt for learning plan generation
    const learningPlannerPrompt = `
You are an AI Learning Planner for FPT COMPASS students. Your role is to create personalized learning roadmaps and study plans.

User message: "${message}"

Based on the user's request, analyze if they want to:
1. Create a learning roadmap for a specific subject/skill
2. Prepare for an exam or assignment
3. Develop a skill over a specific timeframe
4. Get study recommendations

If the user wants a learning plan, generate a structured response that includes:
- A conversational response acknowledging their request
- A detailed learning plan with weekly breakdown
- Specific topics and milestones
- Estimated time commitments
- Study tips and resources

If this is a learning plan request, also include a JSON object with this structure:
{
  "title": "Learning Plan Title",
  "duration": "X weeks/months",
  "topics": ["Week 1: Topic", "Week 2: Topic", ...],
  "totalHours": estimated_hours,
  "difficulty": "beginner/intermediate/advanced",
  "goals": ["Goal 1", "Goal 2", ...]
}

Respond in Vietnamese and be encouraging and supportive.
`;

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + config.GOOGLE_API_KEY,
      {
        contents: [{
          parts: [{
            text: learningPlannerPrompt
          }]
        }]
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;

    // Try to extract learning plan JSON from response
    let learningPlan = null;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        learningPlan = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.log('Could not parse learning plan JSON');
      }
    }

    // Clean response text (remove JSON if present)
    const cleanResponse = aiResponse.replace(/\{[\s\S]*\}/, '').trim();

    res.json({
      response: cleanResponse,
      learningPlan: learningPlan,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Learning Planner error:', error);
    res.status(500).json({
      error: 'Có lỗi xảy ra khi tạo lộ trình học tập',
      details: error.message
    });
  }
});

// Create learning todos from plan
router.post('/create-learning-todos', async (req, res) => {
  try {
    const { learningPlan, userId } = req.body;

    if (!learningPlan || !learningPlan.topics) {
      return res.status(400).json({ error: 'Invalid learning plan' });
    }

    const todos = [];
    const startDate = new Date();

    // Create todos for each topic/week
    for (let i = 0; i < learningPlan.topics.length; i++) {
      const topic = learningPlan.topics[i];
      const dueDate = new Date(startDate);
      dueDate.setDate(startDate.getDate() + (i + 1) * 7); // Each topic is due in a week

      const todo = await Todo.create({
        title: `${learningPlan.title} - ${topic}`,
        description: `Học tập theo lộ trình: ${topic}`,
        priority: 'medium',
        deadline: dueDate,
        userId: userId,
        category: 'learning',
        status: 'pending'
      });

      todos.push(todo);
    }

    res.json({
      message: 'Learning todos created successfully',
      todosCreated: todos.length,
      todos: todos
    });

  } catch (error) {
    console.error('Error creating learning todos:', error);
    res.status(500).json({
      error: 'Có lỗi xảy ra khi tạo todo items',
      details: error.message
    });
  }
});

// Smart Schedule Optimization - Detect conflicts and suggest redistributions
router.post('/schedule-optimization', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateRange, preferences } = req.body;

    // Get user's todos within the specified date range
    const startDate = dateRange?.start || new Date();
    const endDate = dateRange?.end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const todos = await Todo.findAll({
      where: {
        userId: userId,
        deadline: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['deadline', 'ASC']]
    });

    // Analyze schedule conflicts using AI
    const scheduleAnalysisPrompt = `You are a Smart Schedule Optimizer. Analyze the following tasks and detect conflicts, then suggest optimizations.

Current Date: ${new Date().toISOString()}
Analysis Period: ${startDate} to ${endDate}

Tasks to analyze:
${todos.map(todo => `
- Task: ${todo.title}
- Deadline: ${todo.deadline}
- Estimated Time: ${todo.estimatedTime || 30} minutes
- Priority: ${todo.priorityLabel}
- Type: ${todo.type}
- Current Status: ${todo.status}
`).join('\n')}

User Preferences:
${JSON.stringify(preferences || {
  workingHours: { start: '09:00', end: '17:00' },
  preferredStudyTime: 'morning',
  maxTasksPerDay: 5,
  breakTime: 15
})}

Analyze and provide:
1. Conflict Detection: Identify days with too many tasks or unrealistic time requirements
2. Optimization Suggestions: Redistribute tasks to balance workload
3. Priority Adjustments: Suggest priority changes based on deadlines
4. Time Management Tips: Provide specific advice for this schedule

Format response as JSON:
{
  "analysis": {
    "totalTasks": number,
    "totalEstimatedTime": "X hours",
    "conflictDays": [
      {
        "date": "YYYY-MM-DD",
        "tasks": number,
        "totalTime": "X hours",
        "conflictReason": "reason"
      }
    ],
    "workloadDistribution": "balanced|overloaded|underutilized"
  },
  "optimizations": [
    {
      "type": "redistribute|reschedule|priority_change",
      "taskId": task_id,
      "currentDate": "YYYY-MM-DD",
      "suggestedDate": "YYYY-MM-DD",
      "reason": "explanation"
    }
  ],
  "recommendations": {
    "dailySchedule": [
      {
        "date": "YYYY-MM-DD",
        "tasks": [
          {
            "taskId": task_id,
            "title": "task title",
            "timeSlot": "09:00-10:30",
            "priority": "high|medium|low"
          }
        ],
        "totalTime": "X hours",
        "freeTime": "X hours"
      }
    ],
    "tips": ["tip1", "tip2", "tip3"]
  },
  "alerts": [
    {
      "type": "warning|info|critical",
      "message": "alert message",
      "affectedTasks": [task_ids]
    }
  ]
}

Respond in Vietnamese for user-facing messages.`;

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + config.GOOGLE_API_KEY,
      {
        contents: [{
          parts: [{
            text: scheduleAnalysisPrompt
          }]
        }]
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;

    // Extract JSON from response
    let scheduleAnalysis = null;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        scheduleAnalysis = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.log('Could not parse schedule analysis JSON:', e);
      }
    }

    // Apply optimizations if requested
    let appliedOptimizations = [];
    if (req.body.applyOptimizations && scheduleAnalysis?.optimizations) {
      for (const optimization of scheduleAnalysis.optimizations) {
        try {
          if (optimization.type === 'reschedule' && optimization.suggestedDate) {
            await Todo.update(
              { deadline: new Date(optimization.suggestedDate) },
              { where: { id: optimization.taskId, userId: userId } }
            );
            appliedOptimizations.push(optimization);
          } else if (optimization.type === 'priority_change' && optimization.newPriority) {
            await Todo.update(
              {
                priorityLabel: optimization.newPriority,
                priority: optimization.newPriority === 'high' ? 5 : optimization.newPriority === 'medium' ? 3 : 1
              },
              { where: { id: optimization.taskId, userId: userId } }
            );
            appliedOptimizations.push(optimization);
          }
        } catch (error) {
          console.error('Error applying optimization:', error);
        }
      }
    }

    res.json({
      success: true,
      analysis: scheduleAnalysis?.analysis,
      optimizations: scheduleAnalysis?.optimizations,
      recommendations: scheduleAnalysis?.recommendations,
      alerts: scheduleAnalysis?.alerts,
      appliedOptimizations: appliedOptimizations,
      totalTasks: todos.length,
      aiResponse: aiResponse,
      message: `Đã phân tích ${todos.length} task và đưa ra ${scheduleAnalysis?.optimizations?.length || 0} gợi ý tối ưu hóa`
    });

  } catch (error) {
    console.error('Schedule optimization error:', error);
    res.status(500).json({ message: 'Error analyzing schedule', error: error.message });
  }
});

const { Pool } = require('pg');

const pool = new Pool({
  host: config.development.host,
  port: config.development.port,
  database: config.development.database,
  user: config.development.username,
  password: config.development.password,
  ssl: { rejectUnauthorized: false }
});

// Get AI recommendations
router.get('/recommendations', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;

    // Get user's recent todos and performance
    const userQuery = `
      SELECT 
        u.level,
        u.xp,
        u.streak,
        u.studystyle,
        COUNT(t.id) as total_todos,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_todos,
        AVG(CASE WHEN t.actualtime > 0 THEN t.actualtime ELSE NULL END) as avg_completion_time
      FROM users u
      LEFT JOIN todos t ON u.id = t."userId"
      WHERE u.id = $1
      GROUP BY u.id, u.level, u.xp, u.streak, u.studystyle
    `;
    
    const userResult = await client.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userData = userResult.rows[0];
    const completionRate = userData.total_todos > 0 ? (userData.completed_todos / userData.total_todos) * 100 : 0;
    
    // Generate AI recommendations based on user data
    const recommendations = [];
    
    // Study style recommendations
    if (userData.studystyle === 'visual') {
      recommendations.push({
        type: 'study_style',
        title: 'Visual Learning Enhancement',
        description: 'Try using mind maps and diagrams for your next study session',
        priority: 'medium',
        impact: 'high'
      });
    }
    
    // Streak recommendations
    if (userData.streak < 3) {
      recommendations.push({
        type: 'motivation',
        title: 'Build Your Streak',
        description: 'Complete at least one task daily to build momentum',
        priority: 'high',
        impact: 'medium'
      });
    }
    
    // Time management recommendations
    if (userData.avg_completion_time > 120) {
      recommendations.push({
        type: 'time_management',
        title: 'Break Down Large Tasks',
        description: 'Consider breaking complex tasks into smaller, manageable chunks',
        priority: 'medium',
        impact: 'high'
      });
    }
    
    // Level-based recommendations
    if (userData.level < 5) {
      recommendations.push({
        type: 'progression',
        title: 'Level Up Faster',
        description: 'Complete more tasks to earn XP and level up quickly',
        priority: 'low',
        impact: 'medium'
      });
    }

    res.json({
      success: true,
      data: {
        recommendations,
        userStats: {
          level: userData.level,
          xp: userData.xp,
          streak: userData.streak,
          completionRate: Math.round(completionRate),
          avgCompletionTime: Math.round(userData.avg_completion_time || 0)
        }
      }
    });
    
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get AI insights
router.get('/insights', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;

    // Get comprehensive user insights
    const insightsQuery = `
      SELECT 
        u.level,
        u.xp,
        u.streak,
        u.coins,
        COUNT(t.id) as total_todos,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_todos,
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_todos,
        COUNT(CASE WHEN t.status = 'overdue' THEN 1 END) as overdue_todos,
        AVG(CASE WHEN t.actualtime > 0 THEN t.actualtime ELSE NULL END) as avg_completion_time,
        COUNT(CASE WHEN t.priority = 'high' THEN 1 END) as high_priority_todos,
        COUNT(CASE WHEN t.priority = 'medium' THEN 1 END) as medium_priority_todos,
        COUNT(CASE WHEN t.priority = 'low' THEN 1 END) as low_priority_todos
      FROM users u
      LEFT JOIN todos t ON u.id = t."userId"
      WHERE u.id = $1
      GROUP BY u.id, u.level, u.xp, u.streak, u.coins
    `;
    
    const insightsResult = await client.query(insightsQuery, [userId]);
    
    if (insightsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const data = insightsResult.rows[0];
    const completionRate = data.total_todos > 0 ? (data.completed_todos / data.total_todos) * 100 : 0;
    
    // Generate insights
    const insights = [];
    
    // Productivity insights
    if (completionRate > 80) {
      insights.push({
        type: 'productivity',
        title: 'Excellent Productivity',
        description: `You're completing ${Math.round(completionRate)}% of your tasks. Keep up the great work!`,
        sentiment: 'positive',
        metric: completionRate
      });
    } else if (completionRate < 50) {
      insights.push({
        type: 'productivity',
        title: 'Room for Improvement',
        description: `Your completion rate is ${Math.round(completionRate)}%. Consider setting more realistic goals.`,
        sentiment: 'neutral',
        metric: completionRate
      });
    }
    
    // Priority insights
    if (data.high_priority_todos > data.medium_priority_todos + data.low_priority_todos) {
      insights.push({
        type: 'priority',
        title: 'High Priority Focus',
        description: 'You have many high-priority tasks. Consider delegating or breaking them down.',
        sentiment: 'warning',
        metric: data.high_priority_todos
      });
    }
    
    // Streak insights
    if (data.streak > 7) {
      insights.push({
        type: 'motivation',
        title: 'Amazing Streak',
        description: `You've maintained a ${data.streak}-day streak! You're building great habits.`,
        sentiment: 'positive',
        metric: data.streak
      });
    }
    
    // Time management insights
    if (data.avg_completion_time > 180) {
      insights.push({
        type: 'time_management',
        title: 'Time Management',
        description: `Tasks take an average of ${Math.round(data.avg_completion_time)} minutes. Consider time blocking.`,
        sentiment: 'neutral',
        metric: data.avg_completion_time
      });
    }

    res.json({
      success: true,
      data: {
        insights,
        summary: {
          totalTasks: data.total_todos,
          completedTasks: data.completed_todos,
          pendingTasks: data.pending_todos,
          overdueTasks: data.overdue_todos,
          completionRate: Math.round(completionRate),
          currentStreak: data.streak,
          level: data.level,
          xp: data.xp,
          coins: data.coins
        }
      }
    });
    
  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// AI Todo optimization
router.post('/todo/ai/optimize', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { todoId, mode = 'smart', includeAdvanced = false } = req.body;
    const userId = req.user.id;

    if (!todoId) {
      return res.status(400).json({
        success: false,
        message: 'Todo ID is required'
      });
    }

    // Get todo details
    const todoQuery = `
      SELECT 
        t.*,
        u.level,
        u.xp,
        u.streak,
        u.studystyle
      FROM todos t
      LEFT JOIN users u ON t."userId" = u.id
      WHERE t.id = $1 AND t."userId" = $2
    `;
    
    const todoResult = await client.query(todoQuery, [todoId, userId]);
    
    if (todoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }
    
    const todo = todoResult.rows[0];
    
    // Generate AI insights based on todo and user data
    const insights = [];
    
    // Priority optimization
    if (todo.priority === 'low' && todo.deadline && new Date(todo.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
      insights.push({
        id: 'priority_urgent',
        type: 'priority',
        title: 'Urgent Task Detected',
        description: 'This low-priority task is due soon. Consider upgrading priority.',
        priority: 'high',
        impact: 'high',
        action: 'upgrade_priority',
        suggestedValue: 'high'
      });
    }
    
    // Time estimation optimization
    if (todo.estimatedtime && todo.actualtime && todo.actualtime > todo.estimatedtime * 1.5) {
      insights.push({
        id: 'time_estimation',
        type: 'scheduling',
        title: 'Time Estimation Issue',
        description: 'This task took significantly longer than estimated. Consider adjusting future estimates.',
        priority: 'medium',
        impact: 'medium',
        action: 'adjust_estimate',
        suggestedValue: Math.round(todo.actualtime * 1.2)
      });
    }
    
    // Study style optimization
    if (todo.studystyle === 'visual' && !todo.attachments) {
      insights.push({
        id: 'visual_learning',
        type: 'learning',
        title: 'Visual Learning Opportunity',
        description: 'As a visual learner, consider adding diagrams or mind maps to this task.',
        priority: 'low',
        impact: 'medium',
        action: 'add_visual_aids',
        suggestedValue: 'mind_map'
      });
    }
    
    // Streak optimization
    if (todo.streak < 3 && todo.status === 'pending') {
      insights.push({
        id: 'streak_building',
        type: 'motivation',
        title: 'Streak Building',
        description: 'Complete this task to build your daily streak and maintain momentum.',
        priority: 'medium',
        impact: 'high',
        action: 'complete_for_streak',
        suggestedValue: 'complete_now'
      });
    }
    
    // Advanced insights
    if (includeAdvanced) {
      // Category optimization
      if (!todo.category) {
        insights.push({
          id: 'categorization',
          type: 'organization',
          title: 'Task Categorization',
          description: 'Adding a category will help with organization and analytics.',
          priority: 'low',
          impact: 'low',
          action: 'add_category',
          suggestedValue: 'general'
        });
      }
      
      // Collaboration opportunity
      if (todo.estimatedtime > 120 && !todo.assignedto) {
        insights.push({
          id: 'collaboration',
          type: 'collaboration',
          title: 'Collaboration Opportunity',
          description: 'This long task might benefit from collaboration.',
          priority: 'low',
          impact: 'medium',
          action: 'suggest_collaboration',
          suggestedValue: 'find_partner'
        });
      }
    }

    res.json({
      success: true,
      insights,
      todo: {
        id: todo.id,
        title: todo.title,
        status: todo.status,
        priority: todo.priority,
        estimatedTime: todo.estimatedtime,
        actualTime: todo.actualtime
      }
    });
    
  } catch (error) {
    console.error('Error optimizing todo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize todo',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Apply AI optimization
router.post('/todo/ai/apply', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { todoId, insightId, action } = req.body;
    const userId = req.user.id;

    if (!todoId || !insightId) {
      return res.status(400).json({
        success: false,
        message: 'Todo ID and insight ID are required'
      });
    }

    // Get the insight details (in a real app, this would come from the previous request)
    const insights = {
      'priority_urgent': { action: 'upgrade_priority', value: 'high' },
      'time_estimation': { action: 'adjust_estimate', value: null },
      'visual_learning': { action: 'add_visual_aids', value: 'mind_map' },
      'streak_building': { action: 'complete_for_streak', value: 'complete_now' },
      'categorization': { action: 'add_category', value: 'general' },
      'collaboration': { action: 'suggest_collaboration', value: 'find_partner' }
    };

    const insight = insights[insightId];
    if (!insight) {
      return res.status(400).json({
        success: false,
        message: 'Invalid insight ID'
      });
    }

    let updateQuery = '';
    let updateParams = [];
    let updateFields = [];

    // Apply the optimization based on insight type
    switch (insight.action) {
      case 'upgrade_priority':
        updateFields.push('priority = $1');
        updateParams.push(insight.value);
        break;
      case 'adjust_estimate':
        // Get current estimated time and adjust it
        const currentQuery = 'SELECT estimatedtime FROM todos WHERE id = $1 AND "userId" = $2';
        const currentResult = await client.query(currentQuery, [todoId, userId]);
        if (currentResult.rows.length > 0) {
          const currentEstimate = currentResult.rows[0].estimatedtime || 60;
          const newEstimate = Math.round(currentEstimate * 1.5);
          updateFields.push('estimatedtime = $1');
          updateParams.push(newEstimate);
        }
        break;
      case 'add_category':
        updateFields.push('category = $1');
        updateParams.push(insight.value);
        break;
      case 'complete_for_streak':
        updateFields.push('status = $1, completedat = NOW()');
        updateParams.push('done');
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported optimization action'
        });
    }

    if (updateFields.length > 0) {
      updateParams.push(todoId, userId);
      updateQuery = `
        UPDATE todos 
        SET ${updateFields.join(', ')}, updatedat = NOW()
        WHERE id = $${updateParams.length - 1} AND "userId" = $${updateParams.length}
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, updateParams);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }

      const optimizedTodo = result.rows[0];

      res.json({
        success: true,
        message: 'Optimization applied successfully',
        optimizedTodo,
        appliedInsight: insightId
      });
    } else {
      res.json({
        success: true,
        message: 'Optimization suggestion noted',
        appliedInsight: insightId
      });
    }
    
  } catch (error) {
    console.error('Error applying optimization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply optimization',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;