const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Todo, User, Group } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const { Pool } = require('pg');
const config = require('../config/config.json');

const pool = new Pool({
  host: config.development.host,
  port: config.development.port,
  database: config.development.database,
  user: config.development.username,
  password: config.development.password,
  ssl: { rejectUnauthorized: false }
});

// Get all personal todos for current user (exclude group todos)
router.get('/', auth, async (req, res) => {
  try {
    console.log('🔍 Debug: Fetching todos for user ID:', req.user.id);
    console.log('🔍 Debug: User object:', req.user);
    
    const todos = await Todo.findAll({
      where: { 
        userId: req.user.id,
        todoType: { [Op.or]: ['personal', null] } // Only personal todos or legacy todos without todoType
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log('🔍 Debug: Found todos:', todos.length);
    console.log('🔍 Debug: Todos:', todos.map(t => ({ id: t.id, title: t.title, userId: t.userId, todoType: t.todoType })));

    res.json({
      success: true,
      todos
    });
  } catch (error) {
    console.error('Error fetching personal todos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching personal todos'
    });
  }
});

// Get all todos for current user (both personal and group)
router.get('/all', auth, async (req, res) => {
  try {
    console.log('🔍 Debug: Fetching ALL todos for user ID:', req.user.id);
    
    // Get personal todos
    const personalTodos = await Todo.findAll({
      where: { 
        userId: req.user.id,
        todoType: { [Op.or]: ['personal', null] } // Only personal todos or legacy todos without todoType
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log('🔍 Debug: Found personal todos:', personalTodos.length);

    // Get group todos from groups where user is member or has accepted invitation
    const { GroupMembers, GroupInvitation, Group } = require('../models');
    
    // Get all groups where user is a member
    const userGroups = await GroupMembers.findAll({
      where: { 
        userId: req.user.id, 
        isActive: true 
      },
      attributes: ['groupId']
    });

    // Get all groups where user has accepted invitation
    const acceptedInvitations = await GroupInvitation.findAll({
      where: { 
        invitedUserId: req.user.id, 
        status: 'accepted' 
      },
      attributes: ['groupId']
    });

    // Combine member groups and accepted invitation groups
    const memberGroupIds = userGroups.map(member => member.groupId);
    const invitationGroupIds = acceptedInvitations.map(invitation => invitation.groupId);
    const allGroupIds = [...new Set([...memberGroupIds, ...invitationGroupIds])];

    console.log('🔍 Debug: User has access to groups:', allGroupIds);

    let groupTodos = [];
    if (allGroupIds.length > 0) {
      groupTodos = await Todo.findAll({
        where: { 
          groupId: { [Op.in]: allGroupIds },
          todoType: 'group'
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar']
          },
          {
            model: Group,
            as: 'group',
            attributes: ['id', 'name', 'description']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    console.log('🔍 Debug: Found group todos:', groupTodos.length);

    // For /all endpoint, return only personal todos in the main todos array
    // Group todos are available separately for group-specific views
    res.json({
      success: true,
      todos: personalTodos, // Only personal todos in main array
      personalTodos,
      groupTodos,
      summary: {
        total: personalTodos.length + groupTodos.length,
        personal: personalTodos.length,
        group: groupTodos.length
      }
    });
  } catch (error) {
    console.error('Error fetching all todos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all todos'
    });
  }
});

// Get all todos for current user (both personal and group) - for combined view
router.get('/combined', auth, async (req, res) => {
  try {
    console.log('🔍 Debug: Fetching COMBINED todos for user ID:', req.user.id);
    
    // Get personal todos
    const personalTodos = await Todo.findAll({
      where: { 
        userId: req.user.id,
        todoType: { [Op.or]: ['personal', null] } // Only personal todos or legacy todos without todoType
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log('🔍 Debug: Found personal todos:', personalTodos.length);

    // Get group todos from groups where user is member or has accepted invitation
    const { GroupMembers, GroupInvitation, Group } = require('../models');
    
    // Get all groups where user is a member
    const userGroups = await GroupMembers.findAll({
      where: { 
        userId: req.user.id, 
        isActive: true 
      },
      attributes: ['groupId']
    });

    // Get all groups where user has accepted invitation
    const acceptedInvitations = await GroupInvitation.findAll({
      where: { 
        invitedUserId: req.user.id, 
        status: 'accepted' 
      },
      attributes: ['groupId']
    });

    // Combine member groups and accepted invitation groups
    const memberGroupIds = userGroups.map(member => member.groupId);
    const invitationGroupIds = acceptedInvitations.map(invitation => invitation.groupId);
    const allGroupIds = [...new Set([...memberGroupIds, ...invitationGroupIds])];

    console.log('🔍 Debug: User has access to groups:', allGroupIds);

    let groupTodos = [];
    if (allGroupIds.length > 0) {
      groupTodos = await Todo.findAll({
        where: { 
          groupId: { [Op.in]: allGroupIds },
          todoType: 'group'
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar']
          },
          {
            model: Group,
            as: 'group',
            attributes: ['id', 'name', 'description']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    console.log('🔍 Debug: Found group todos:', groupTodos.length);

    // Combine all todos
    const allTodos = [...personalTodos, ...groupTodos].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      todos: allTodos,
      personalTodos,
      groupTodos,
      summary: {
        total: allTodos.length,
        personal: personalTodos.length,
        group: groupTodos.length
      }
    });
  } catch (error) {
    console.error('Error fetching combined todos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching combined todos'
    });
  }
});

// Get user's todos summary (counts by type)
router.get('/summary', auth, async (req, res) => {
  try {
    const personalCount = await Todo.count({
      where: { 
        userId: req.user.id,
        todoType: { [Op.or]: ['personal', null] }
      }
    });

    const groupCount = await Todo.count({
      where: { 
        userId: req.user.id,
        todoType: 'group'
      }
    });

    const totalCount = personalCount + groupCount;

    res.json({
      success: true,
      summary: {
        total: totalCount,
        personal: personalCount,
        group: groupCount
      }
    });
  } catch (error) {
    console.error('Error fetching todos summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching todos summary'
    });
  }
});

// Get unscheduled personal todos
router.get('/unscheduled', auth, async (req, res) => {
  try {
    const todos = await Todo.findAll({
      where: { 
        userId: req.user.id,
        todoType: { [Op.or]: ['personal', null] }, // Only personal todos
        status: { [Op.ne]: 'done' }, // Not completed
        deadline: { [Op.gte]: new Date() } // Not overdue
      },
      attributes: ['id', 'title', 'subject', 'priority', 'estimatedTime', 'deadline', 'status'],
      order: [['deadline', 'ASC']]
    });

    res.json({
      success: true,
      tasks: todos
    });
  } catch (error) {
    console.error('Error fetching unscheduled personal todos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unscheduled personal todos'
    });
  }
});

// Get todo by ID (numeric only)
router.get('/:id(\\d+)', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }]
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    res.json({
      success: true,
      todo
    });
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching todo'
    });
  }
});

// Create new todo
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      type,
      deadline,
      subject,
      difficulty,
      estimatedTime,
      location,
      creationMethod,
      tags,
      isRecurring,
      recurringPattern,
      teacherinfo
    } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    // AI Analysis (simplified for now)
    const aiAnalysis = {
      complexity: difficulty ? (difficulty <= 2 ? 'easy' : difficulty <= 4 ? 'medium' : 'hard') : 'medium',
      keywords: tags || [],
      relatedTopics: subject ? [subject] : [],
      prerequisites: [],
      estimatedDuration: estimatedTime || 60
    };

    const todo = await Todo.create({
      title,
      description,
      category: category || 'personal',
      priority: priority || 'medium',
      type,
      deadline: deadline || null,
      userId: req.user.id,
      status: 'pending',
      todoType: 'personal', // Explicitly set as personal todo
      subject,
      difficulty: difficulty || 3,
      estimatedTime: estimatedTime || aiAnalysis.estimatedDuration,
      location: location || null,
      creationMethod,
      tags: JSON.stringify(tags),
      isRecurring,
      recurringPattern,
      teacherinfo: teacherinfo ? JSON.stringify(teacherinfo) : null,
      aiAnalysis: {
        complexity: aiAnalysis.complexity,
        keywords: aiAnalysis.keywords,
        relatedTopics: aiAnalysis.relatedTopics,
        prerequisites: aiAnalysis.prerequisites,
        smartScheduling: null
      },
      aiSuggestions: {
        scheduledTime: null,
        estimatedDuration: aiAnalysis.estimatedDuration,
        breakdownSteps: [],
        studyTips: [],
        conflictResolution: null
      }
    });

    // Award XP for task creation
    const user = await User.findByPk(req.user.id);
    if (user) {
      user.xp += 5; // 5 XP for creating a task
      user.coins += 2; // 2 coins for task creation
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      todo
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating todo'
    });
  }
});

// Update personal todo
router.put('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id,
        todoType: { [Op.or]: ['personal', null] } // Only personal todos
      }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Personal todo not found'
      });
    }

    const updatedTodo = await todo.update(req.body);

    res.json({
      success: true,
      message: 'Todo updated successfully',
      todo: updatedTodo
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating todo'
    });
  }
});

// Delete personal todo
router.delete('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id,
        todoType: { [Op.or]: ['personal', null] } // Only personal todos
      }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Personal todo not found'
      });
    }

    await todo.destroy();

    res.json({
      success: true,
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting todo'
    });
  }
});

// Mark personal todo as completed
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id,
        todoType: { [Op.or]: ['personal', null] } // Only personal todos
      }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Personal todo not found'
      });
    }

    const { status, actualTime } = req.body;
    
    const updateData = {
      status: status || 'completed',
      completedAt: new Date()
    };

    if (actualTime) {
      updateData.actualTime = actualTime;
    }

    const updatedTodo = await todo.update(updateData);

    // Award XP for completion
    const user = await User.findByPk(req.user.id);
    if (user && status === 'completed') {
      user.xp += 10; // 10 XP for completing a task
      user.coins += 5; // 5 coins for completion
      await user.save();
    }

    res.json({
      success: true,
      message: 'Todo updated successfully',
      todo: updatedTodo
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating todo'
    });
  }
});

// Get personal todos by status
router.get('/status/:status', auth, async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const todos = await Todo.findAll({
      where: {
        userId: req.user.id,
        todoType: { [Op.or]: ['personal', null] }, // Only personal todos
        status: status
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      todos,
      count: todos.length,
      status: status
    });
  } catch (error) {
    console.error('Error fetching personal todos by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching personal todos by status'
    });
  }
});

// Get personal todos by category
router.get('/category/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = [
      'personal', 'work', 'study', 'health', 'finance', 'social',
      'hobby', 'travel', 'shopping', 'family', 'career', 'learning',
      'exercise', 'reading', 'coding', 'design', 'writing', 'other'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be one of: ' + validCategories.join(', ')
      });
    }

    const todos = await Todo.findAll({
      where: {
        userId: req.user.id,
        todoType: { [Op.or]: ['personal', null] }, // Only personal todos
        category: category
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      todos,
      count: todos.length,
      category: category
    });
  } catch (error) {
    console.error('Error fetching personal todos by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching personal todos by category'
    });
  }
});

// Get todos by priority
router.get('/priority/:priority', auth, async (req, res) => {
  try {
    const { priority } = req.params;
    const validPriorities = ['low', 'medium', 'high'];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Must be one of: ' + validPriorities.join(', ')
      });
    }

    const todos = await Todo.findAll({
      where: {
        userId: req.user.id,
        priority: priority
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      todos,
      count: todos.length,
      priority: priority
    });
  } catch (error) {
    console.error('Error fetching todos by priority:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching todos by priority'
    });
  }
});

// Search todos
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;
    
    const todos = await Todo.findAll({
      where: {
        userId: req.user.id,
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
          { subject: { [Op.iLike]: `%${query}%` } },
          { tags: { [Op.iLike]: `%${query}%` } }
        ]
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      todos,
      count: todos.length,
      query: query
    });
  } catch (error) {
    console.error('Error searching todos:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching todos'
    });
  }
});

// Get overdue todos
router.get('/overdue', auth, async (req, res) => {
  try {
    const now = new Date();
    
    const todos = await Todo.findAll({
      where: {
        userId: req.user.id,
        deadline: {
          [require('sequelize').Op.lt]: now
        },
        status: {
          [require('sequelize').Op.notIn]: ['completed', 'cancelled']
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['deadline', 'ASC']]
    });

    res.json({
      success: true,
      todos,
      count: todos.length
    });
  } catch (error) {
    console.error('Error fetching overdue todos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue todos'
    });
  }
});

// Get upcoming personal todos
router.get('/upcoming', auth, async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const todos = await Todo.findAll({
      where: {
        userId: req.user.id,
        todoType: { [Op.or]: ['personal', null] }, // Only personal todos
        deadline: {
          [require('sequelize').Op.between]: [now, nextWeek]
        },
        status: {
          [require('sequelize').Op.notIn]: ['completed', 'cancelled']
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['deadline', 'ASC']]
    });

    res.json({
      success: true,
      todos,
      count: todos.length
    });
  } catch (error) {
    console.error('Error fetching upcoming personal todos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming personal todos'
    });
  }
});

// Timer endpoints
router.post('/:id/timer/start', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    const updatedTodo = await todo.update({
      isTimerRunning: true,
      timerStartedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Timer started successfully',
      todo: updatedTodo
    });
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting timer'
    });
  }
});

router.post('/:id/timer/pause', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    const updatedTodo = await todo.update({
      isTimerRunning: false
    });

    res.json({
      success: true,
      message: 'Timer paused successfully',
      todo: updatedTodo
    });
  } catch (error) {
    console.error('Error pausing timer:', error);
    res.status(500).json({
      success: false,
      message: 'Error pausing timer'
    });
  }
});

router.post('/:id/timer/stop', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    // Calculate elapsed time if timer was running
    let additionalTime = 0;
    if (todo.isTimerRunning && todo.timerStartedAt) {
      const elapsed = Math.floor((new Date() - new Date(todo.timerStartedAt)) / 1000 / 60); // minutes
      additionalTime = elapsed;
    }

    const updatedTodo = await todo.update({
      isTimerRunning: false,
      timerStartedAt: null,
      actualTime: (todo.actualTime || 0) + additionalTime
    });

    res.json({
      success: true,
      message: 'Timer stopped successfully',
      todo: updatedTodo
    });
  } catch (error) {
    console.error('Error stopping timer:', error);
    res.status(500).json({
      success: false,
      message: 'Error stopping timer'
    });
  }
});

// ===== POMODORO TIMER ENDPOINTS =====

// Start Pomodoro session
router.post('/:id/pomodoro/start', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { workDuration = 25, shortBreakDuration = 5, longBreakDuration = 15 } = req.body;

    const todo = await Todo.findOne({
      where: { id, userId: req.user.id }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    // Update todo with pomodoro settings and start timer
    await todo.update({
      isTimerRunning: true,
      timerStartedAt: new Date(),
      pomodoro_sessions: [
        ...(todo.pomodoro_sessions || []),
        {
          id: Date.now(),
          type: 'work',
          duration: workDuration * 60,
          startedAt: new Date().toISOString(),
          status: 'active'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Pomodoro session started',
      todo: {
        id: todo.id,
        isTimerRunning: todo.isTimerRunning,
        timerStartedAt: todo.timerStartedAt,
        pomodoro_sessions: todo.pomodoro_sessions
      }
    });
  } catch (error) {
    console.error('Error starting pomodoro session:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting pomodoro session'
    });
  }
});

// Pause Pomodoro session
router.post('/:id/pomodoro/pause', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findOne({
      where: { id, userId: req.user.id }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    if (!todo.isTimerRunning) {
      return res.status(400).json({
        success: false,
        message: 'No active pomodoro session'
      });
    }

    // Update todo to pause timer
    await todo.update({
      isTimerRunning: false
    });

    res.json({
      success: true,
      message: 'Pomodoro session paused',
      todo: {
        id: todo.id,
        isTimerRunning: todo.isTimerRunning
      }
    });
  } catch (error) {
    console.error('Error pausing pomodoro session:', error);
    res.status(500).json({
      success: false,
      message: 'Error pausing pomodoro session'
    });
  }
});

// Complete Pomodoro session
router.post('/:id/pomodoro/complete', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionData } = req.body;

    const todo = await Todo.findOne({
      where: { id, userId: req.user.id }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    // Update pomodoro sessions and total time
    const updatedSessions = [...(todo.pomodoro_sessions || []), sessionData];
    const totalTime = (todo.total_pomodoro_time || 0) + sessionData.duration;

    await todo.update({
      pomodoro_sessions: updatedSessions,
      total_pomodoro_time: totalTime,
      isTimerRunning: false
    });

    res.json({
      success: true,
      message: 'Pomodoro session completed',
      todo: {
        id: todo.id,
        pomodoro_sessions: updatedSessions,
        total_pomodoro_time: totalTime,
        isTimerRunning: false
      }
    });
  } catch (error) {
    console.error('Error completing pomodoro session:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing pomodoro session'
    });
  }
});

// Get Pomodoro sessions
router.get('/:id/pomodoro/sessions', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findOne({
      where: { id, userId: req.user.id },
      attributes: ['id', 'pomodoro_sessions', 'total_pomodoro_time', 'isTimerRunning', 'timerStartedAt']
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    res.json({
      success: true,
      sessions: todo.pomodoro_sessions || [],
      totalTime: todo.total_pomodoro_time || 0,
      isTimerRunning: todo.isTimerRunning,
      timerStartedAt: todo.timerStartedAt
    });
  } catch (error) {
    console.error('Error fetching pomodoro sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pomodoro sessions'
    });
  }
});

// Update Pomodoro settings
router.put('/:id/pomodoro/settings', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { workDuration, shortBreakDuration, longBreakDuration, sessionsUntilLongBreak } = req.body;

    const todo = await Todo.findOne({
      where: { id, userId: req.user.id }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    // Update pomodoro settings
    const pomodoroSettings = {
      workDuration: workDuration || 25,
      shortBreakDuration: shortBreakDuration || 5,
      longBreakDuration: longBreakDuration || 15,
      sessionsUntilLongBreak: sessionsUntilLongBreak || 4
    };

    await todo.update({
      pomodoroSettings
    });

    res.json({
      success: true,
      message: 'Pomodoro settings updated',
      settings: pomodoroSettings
    });
  } catch (error) {
    console.error('Error updating pomodoro settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pomodoro settings'
    });
  }
});

// Get todo analytics
router.get('/analytics', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { timeframe = 'week', category = 'all' } = req.query;

    // Calculate date range based on timeframe
    let dateFilter = '';
    const now = new Date();
    
    switch (timeframe) {
      case 'day':
        dateFilter = `AND t.createdat >= '${now.toISOString().split('T')[0]}'`;
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `AND t.createdat >= '${weekAgo.toISOString()}'`;
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = `AND t.createdat >= '${monthAgo.toISOString()}'`;
        break;
      default:
        dateFilter = '';
    }

    // Category filter
    let categoryFilter = '';
    if (category !== 'all') {
      categoryFilter = `AND t.category = '${category}'`;
    }

    // Get analytics data
    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_todos,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_todos,
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_todos,
        COUNT(CASE WHEN t.status = 'overdue' THEN 1 END) as overdue_todos,
        COUNT(CASE WHEN t.status = 'cancelled' THEN 1 END) as cancelled_todos,
        AVG(CASE WHEN t.actualtime > 0 THEN t.actualtime ELSE NULL END) as avg_completion_time,
        SUM(CASE WHEN t.actualtime > 0 THEN t.actualtime ELSE 0 END) as total_time_spent,
        COUNT(CASE WHEN t.priority = 'high' THEN 1 END) as high_priority_count,
        COUNT(CASE WHEN t.priority = 'medium' THEN 1 END) as medium_priority_count,
        COUNT(CASE WHEN t.priority = 'low' THEN 1 END) as low_priority_count,
        COUNT(CASE WHEN t.category IS NOT NULL THEN 1 END) as categorized_todos,
        COUNT(DISTINCT t.category) as unique_categories
      FROM todos t
      WHERE t."userId" = $1 ${dateFilter} ${categoryFilter}
    `;
    
    const analyticsResult = await client.query(analyticsQuery, [userId]);
    const analytics = analyticsResult.rows[0];

    // Get category breakdown
    const categoryQuery = `
      SELECT 
        t.category,
        COUNT(*) as count,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed,
        AVG(CASE WHEN t.actualtime > 0 THEN t.actualtime ELSE NULL END) as avg_time
      FROM todos t
      WHERE t."userId" = $1 ${dateFilter}
      GROUP BY t.category
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const categoryResult = await client.query(categoryQuery, [userId]);

    // Get daily completion trend
    const trendQuery = `
      SELECT 
        DATE(t.createdat) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed
      FROM todos t
      WHERE t."userId" = $1 ${dateFilter}
      GROUP BY DATE(t.createdat)
      ORDER BY date DESC
      LIMIT 30
    `;
    
    const trendResult = await client.query(trendQuery, [userId]);

    // Calculate completion rate
    const completionRate = analytics.total_todos > 0 ? 
      (analytics.completed_todos / analytics.total_todos) * 100 : 0;

    // Calculate productivity score
    const productivityScore = Math.min(100, 
      (completionRate * 0.4) + 
      (Math.min(analytics.avg_completion_time || 0, 120) / 120 * 100 * 0.3) +
      (Math.min(analytics.total_todos, 20) / 20 * 100 * 0.3)
    );

    res.json({
      success: true,
      data: {
        overview: {
          totalTodos: parseInt(analytics.total_todos) || 0,
          completedTodos: parseInt(analytics.completed_todos) || 0,
          pendingTodos: parseInt(analytics.pending_todos) || 0,
          overdueTodos: parseInt(analytics.overdue_todos) || 0,
          cancelledTodos: parseInt(analytics.cancelled_todos) || 0,
          completionRate: Math.round(completionRate),
          productivityScore: Math.round(productivityScore),
          avgCompletionTime: Math.round(analytics.avg_completion_time || 0),
          totalTimeSpent: Math.round(analytics.total_time_spent || 0)
        },
        priorities: {
          high: parseInt(analytics.high_priority_count) || 0,
          medium: parseInt(analytics.medium_priority_count) || 0,
          low: parseInt(analytics.low_priority_count) || 0
        },
        categories: categoryResult.rows.map(row => ({
          name: row.category || 'Uncategorized',
          total: parseInt(row.count),
          completed: parseInt(row.completed),
          avgTime: Math.round(row.avg_time || 0)
        })),
        trends: trendResult.rows.map(row => ({
          date: row.date,
          total: parseInt(row.total),
          completed: parseInt(row.completed),
          rate: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0
        })),
        timeframe,
        category
      }
    });
    
  } catch (error) {
    console.error('Error fetching todo analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;