const express = require('express');
const router = express.Router();
const { User, Todo, FocusSession, UserAnalytics } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// AI-powered schedule conflict detection and resolution
router.post('/check-conflicts', auth, async (req, res) => {
  try {
    const { todoId, proposedDate, proposedDuration } = req.body;
    
    const user = await User.findByPk(req.userId);
    const proposedStart = new Date(proposedDate);
    const proposedEnd = new Date(proposedStart.getTime() + proposedDuration * 60000);
    
    // Get existing todos and sessions for the day
    const dayStart = new Date(proposedStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(proposedStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const [existingTodos, existingSessions] = await Promise.all([
      Todo.findAll({
        where: {
          userId: req.userId,
          deadline: {
            [Op.between]: [dayStart, dayEnd]
          },
          status: 'pending', // Changed from isDone: false
          id: { [Op.ne]: todoId || 0 }
        }
      }),
      FocusSession.findAll({
        where: {
          userId: req.userId,
          startTime: {
            [Op.between]: [dayStart, dayEnd]
          },
          status: { [Op.in]: ['planned', 'active'] }
        }
      })
    ]);

    // Detect conflicts
    const conflicts = [];
    const workloadAnalysis = analyzeWorkload(existingTodos, existingSessions, proposedDuration);
    
    // Check time conflicts
    existingSessions.forEach(session => {
      const sessionStart = new Date(session.startTime);
      const sessionEnd = new Date(sessionStart.getTime() + session.plannedDuration * 60000);
      
      if (isTimeOverlap(proposedStart, proposedEnd, sessionStart, sessionEnd)) {
        conflicts.push({
          type: 'time_conflict',
          conflictWith: 'focus_session',
          sessionId: session.id,
          message: `Conflicts with existing focus session from ${sessionStart.toLocaleTimeString()} to ${sessionEnd.toLocaleTimeString()}`
        });
      }
    });

    // Check workload conflicts
    if (workloadAnalysis.isOverloaded) {
      conflicts.push({
        type: 'workload_conflict',
        message: `You have ${workloadAnalysis.totalTasks} tasks due on ${proposedStart.toDateString()}. Consider redistributing some tasks.`,
        suggestions: workloadAnalysis.suggestions
      });
    }

    // Generate AI suggestions for conflict resolution
    const aiSuggestions = await generateConflictResolutions(
      conflicts, 
      proposedStart, 
      proposedDuration, 
      user,
      existingTodos
    );

    res.json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts,
      workloadAnalysis,
      aiSuggestions
    });
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Auto-schedule todos using AI
router.post('/auto-schedule', auth, async (req, res) => {
  try {
    const { todoIds, preferences = {} } = req.body;
    const user = await User.findByPk(req.userId);
    
    // Get todos to schedule
    const todos = await Todo.findAll({
      where: {
        id: { [Op.in]: todoIds },
        userId: req.userId,
        status: 'pending' // Changed from isDone: false
      }
    });

    if (todos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid todos found for scheduling'
      });
    }

    // Get user analytics for optimal scheduling
    const analytics = await UserAnalytics.findOne({
      where: { userId: req.userId },
      order: [['date', 'DESC']]
    });

    // Generate optimal schedule
    const schedule = await generateOptimalSchedule(todos, user, analytics, preferences);

    res.json({
      success: true,
      schedule,
      message: `Successfully scheduled ${todos.length} tasks`
    });
  } catch (error) {
    console.error('Error auto-scheduling:', error);
    res.status(500).json({
      success: false,
      message: 'Error auto-scheduling tasks'
    });
  }
});

// Get user's upcoming tasks for scheduling
router.get('/upcoming-tasks', auth, async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingTasks = await Todo.findAll({
      where: {
        userId: req.userId, // Changed from req.user.id
        status: 'pending', // Changed from isDone: false
        deadline: {
          [Op.between]: [now, nextWeek]
        }
      },
      order: [['deadline', 'ASC']],
      attributes: ['id', 'title', 'description', 'deadline', 'estimatedTime', 'priority', 'category']
    });

    res.json({
      success: true,
      tasks: upcomingTasks
    });
  } catch (error) {
    console.error('Error fetching upcoming tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming tasks'
    });
  }
});

// Generate AI recommendations for task scheduling
router.post('/recommendations', auth, async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get user's pending tasks
    const pendingTasks = await Todo.findAll({
      where: {
        userId: req.userId,
        status: 'pending',
        deadline: {
          [Op.between]: [now, nextWeek]
        }
      },
      order: [['deadline', 'ASC']]
    });

    // Get user's completed tasks for pattern analysis
    const completedTasks = await Todo.findAll({
      where: {
        userId: req.userId,
        status: 'done',
        completedAt: {
          [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      attributes: ['title', 'category', 'estimatedTime', 'actualTime', 'completedAt']
    });

    // Generate recommendations based on patterns
    const recommendations = generateRecommendations(pendingTasks, completedTasks);

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations'
    });
  }
});

// Helper functions
function generateRecommendations(pendingTasks, completedTasks) {
  const recommendations = [];
  
  // Analyze task patterns
  const categories = {};
  const priorities = {};
  
  completedTasks.forEach(task => {
    categories[task.category] = (categories[task.category] || 0) + 1;
    priorities[task.priority] = (priorities[task.priority] || 0) + 1;
  });

  // Generate category-based recommendations
  const topCategory = Object.keys(categories).sort((a, b) => categories[b] - categories[a])[0];
  if (topCategory) {
    recommendations.push({
      type: 'category',
      title: `Focus on ${topCategory}`,
      description: `You've completed ${categories[topCategory]} tasks in ${topCategory} category recently`,
      priority: 'medium'
    });
  }

  // Generate deadline-based recommendations
  const urgentTasks = pendingTasks.filter(task => {
    const daysUntilDeadline = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24);
    return daysUntilDeadline <= 2;
  });

  if (urgentTasks.length > 0) {
    recommendations.push({
      type: 'deadline',
      title: 'Urgent Deadlines',
      description: `You have ${urgentTasks.length} tasks due within 2 days`,
      priority: 'high',
      tasks: urgentTasks.map(task => ({
        id: task.id,
        title: task.title,
        deadline: task.deadline
      }))
    });
  }

  // Generate time management recommendations
  const totalEstimatedTime = pendingTasks.reduce((sum, task) => sum + (task.estimatedTime || 60), 0);
  if (totalEstimatedTime > 480) { // More than 8 hours
    recommendations.push({
      type: 'time_management',
      title: 'High Workload',
      description: `You have ${Math.round(totalEstimatedTime / 60)} hours of work planned`,
      priority: 'medium',
      suggestion: 'Consider breaking down large tasks or rescheduling some work'
    });
  }

  // Generate study pattern recommendations
  if (completedTasks.length > 0) {
    const avgCompletionTime = completedTasks.reduce((sum, task) => {
      const actualTime = task.actualTime || task.estimatedTime || 60;
      const estimatedTime = task.estimatedTime || 60;
      return sum + (actualTime / estimatedTime);
    }, 0) / completedTasks.length;

    if (avgCompletionTime > 1.5) {
      recommendations.push({
        type: 'planning',
        title: 'Improve Time Estimation',
        description: 'Your tasks are taking longer than estimated',
        priority: 'low',
        suggestion: 'Try adding buffer time to your estimates'
      });
    }
  }

  return recommendations;
}

function isTimeOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

function analyzeWorkload(todos, sessions, additionalDuration) {
  const totalTasks = todos.length + 1; // +1 for the new task
  const totalDuration = todos.reduce((sum, todo) => sum + (todo.estimatedTime || 60), 0) + 
                       sessions.reduce((sum, session) => sum + session.plannedDuration, 0) + 
                       additionalDuration;
  
  const isOverloaded = totalTasks > 5 || totalDuration > 480; // More than 8 hours
  
  const suggestions = [];
  if (isOverloaded) {
    if (totalTasks > 5) {
      suggestions.push('Consider moving some lower priority tasks to tomorrow');
    }
    if (totalDuration > 480) {
      suggestions.push('Break down large tasks into smaller chunks');
      suggestions.push('Schedule some tasks for the weekend');
    }
  }

  return {
    totalTasks,
    totalDuration,
    isOverloaded,
    suggestions,
    workloadScore: Math.min(10, (totalDuration / 60) + (totalTasks * 0.5))
  };
}

async function generateConflictResolutions(conflicts, proposedStart, duration, user, existingTodos) {
  const suggestions = [];
  
  if (conflicts.some(c => c.type === 'time_conflict')) {
    // Suggest alternative times
    const alternatives = findAlternativeTimeSlots(proposedStart, duration, existingTodos);
    suggestions.push({
      type: 'reschedule',
      message: 'Suggested alternative times:',
      alternatives
    });
  }
  
  if (conflicts.some(c => c.type === 'workload_conflict')) {
    // Suggest task redistribution
    const redistribution = suggestTaskRedistribution(existingTodos, proposedStart);
    suggestions.push({
      type: 'redistribute',
      message: 'Consider moving these tasks:',
      tasks: redistribution
    });
  }

  return suggestions;
}

function findAlternativeTimeSlots(originalTime, duration, existingTodos) {
  const alternatives = [];
  const baseDate = new Date(originalTime);
  
  // Try same day, different hours
  for (let hour = 8; hour <= 20; hour++) {
    const altTime = new Date(baseDate);
    altTime.setHours(hour, 0, 0, 0);
    
    if (Math.abs(altTime - originalTime) > 60 * 60 * 1000) { // At least 1 hour difference
      alternatives.push({
        time: altTime,
        reason: 'Same day alternative'
      });
    }
  }
  
  // Try next day
  const nextDay = new Date(baseDate);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(14, 0, 0, 0); // 2 PM next day
  alternatives.push({
    time: nextDay,
    reason: 'Next day option'
  });

  return alternatives.slice(0, 3); // Return top 3 alternatives
}

function suggestTaskRedistribution(todos, targetDate) {
  return todos
    .filter(todo => todo.priority < 4) // Lower priority tasks
    .slice(0, 2)
    .map(todo => ({
      todoId: todo.id,
      title: todo.title,
      suggestedNewDate: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
      reason: 'Lower priority - can be moved to tomorrow'
    }));
}

async function generateOptimalSchedule(todos, user, analytics, preferences) {
  // Get user's most productive hours from analytics
  const productiveHours = getOptimalHours(analytics);
  
  // Sort todos by priority and deadline
  const sortedTodos = todos.sort((a, b) => {
    const priorityDiff = b.priority - a.priority;
    if (priorityDiff !== 0) return priorityDiff;
    
    const deadlineDiff = new Date(a.deadline) - new Date(b.deadline);
    return deadlineDiff;
  });

  const schedule = [];
  let currentTime = new Date();
  currentTime.setHours(productiveHours[0], 0, 0, 0);

  sortedTodos.forEach((todo, index) => {
    const estimatedDuration = todo.estimatedTime || estimateTaskDuration(todo);
    const scheduledTime = new Date(currentTime);
    
    // Adjust for user preferences
    if (preferences.preferMorning && scheduledTime.getHours() > 12) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
      scheduledTime.setHours(8, 0, 0, 0);
    }

    schedule.push({
      todoId: todo.id,
      title: todo.title,
      scheduledTime,
      estimatedDuration,
      suggestedPriority: calculateAIPriority(todo, analytics),
      breakdownSteps: generateTaskBreakdown(todo),
      studyTips: generateStudyTips(todo, user.studyStyle),
      timeBlocks: [{
        start: scheduledTime,
        end: new Date(scheduledTime.getTime() + estimatedDuration * 60000),
        date: scheduledTime.toDateString()
      }]
    });

    // Move to next time slot
    currentTime = new Date(scheduledTime.getTime() + (estimatedDuration + 15) * 60000); // +15 min break
  });

  return schedule;
}

function getOptimalHours(analytics) {
  if (!analytics) return [14, 15, 16]; // Default afternoon hours
  
  const hourCounts = {};
  analytics.forEach(day => {
    if (day.mostActiveHour) {
      hourCounts[day.mostActiveHour] = (hourCounts[day.mostActiveHour] || 0) + 1;
    }
  });

  const sortedHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([hour]) => parseInt(hour));

  return sortedHours.slice(0, 3);
}

function estimateTaskDuration(todo) {
  const baseTime = 60; // 1 hour default
  const difficultyMultiplier = {
    1: 0.5, 2: 0.75, 3: 1, 4: 1.5, 5: 2
  };
  
  return Math.round(baseTime * (difficultyMultiplier[todo.difficulty] || 1));
}

function calculateAIPriority(todo, analytics) {
  let score = todo.priority || 3;
  
  // Adjust based on deadline proximity
  if (todo.deadline) {
    const daysUntilDeadline = (new Date(todo.deadline) - new Date()) / (1000 * 60 * 60 * 24);
    if (daysUntilDeadline < 1) score += 2;
    else if (daysUntilDeadline < 3) score += 1;
  }
  
  // Adjust based on subject performance
  const subjectPerformance = getSubjectPerformance(todo.subject, analytics);
  if (subjectPerformance < 0.7) score += 1; // Need more focus on weak subjects
  
  return Math.min(5, Math.max(1, Math.round(score)));
}

function getSubjectPerformance(subject, analytics) {
  if (!subject || !analytics) return 0.8; // Default
  
  let totalTime = 0;
  let totalTasks = 0;
  
  analytics.forEach(day => {
    if (day.subjectBreakdown && day.subjectBreakdown[subject]) {
      totalTime += day.subjectBreakdown[subject].time || 0;
      totalTasks += day.subjectBreakdown[subject].tasks || 0;
    }
  });
  
  return totalTasks > 0 ? Math.min(1, totalTime / (totalTasks * 60)) : 0.8;
}

function generateTaskBreakdown(todo) {
  const steps = [];
  
  if (todo.type === 'assignment') {
    steps.push('Research and gather materials');
    steps.push('Create outline or plan');
    steps.push('Complete first draft');
    steps.push('Review and revise');
  } else if (todo.type === 'study') {
    steps.push('Review previous materials');
    steps.push('Read new content');
    steps.push('Take notes and summarize');
    steps.push('Practice problems or quiz yourself');
  } else {
    steps.push('Break down into smaller tasks');
    steps.push('Gather necessary resources');
    steps.push('Complete main work');
    steps.push('Review and finalize');
  }
  
  return steps;
}

function generateStudyTips(todo, studyStyle) {
  const baseTips = [
    'Take regular breaks every 25-30 minutes',
    'Eliminate distractions before starting',
    'Set a specific goal for this session'
  ];
  
  const styleTips = {
    visual: ['Use diagrams and mind maps', 'Color-code your notes', 'Watch related videos'],
    auditory: ['Read aloud or explain concepts', 'Use background music', 'Discuss with others'],
    kinesthetic: ['Take notes by hand', 'Use physical models', 'Study while walking'],
    reading: ['Write detailed summaries', 'Use multiple text sources', 'Create written flashcards']
  };
  
  return [...baseTips, ...(styleTips[studyStyle] || styleTips.visual)];
}

function generatePersonalizedRecommendations(user, analytics, todos, sessions) {
  const recommendations = [];
  
  // Analyze recent performance
  if (analytics && analytics.length > 0) {
    const avgProductivity = analytics.reduce((sum, day) => sum + day.productivityScore, 0) / analytics.length;
    
    if (avgProductivity < 5) {
      recommendations.push({
        type: 'productivity',
        priority: 'high',
        title: 'Boost Your Productivity',
        message: 'Your productivity has been below average. Try the Pomodoro technique!',
        action: 'start_pomodoro_session'
      });
    }
  }
  
  // Check upcoming deadlines
  const urgentTodos = todos.filter(todo => {
    const daysUntil = (new Date(todo.deadline) - new Date()) / (1000 * 60 * 60 * 24);
    return daysUntil < 2;
  });
  
  if (urgentTodos.length > 0) {
    recommendations.push({
      type: 'deadline',
      priority: 'urgent',
      title: 'Urgent Deadlines Approaching',
      message: `You have ${urgentTodos.length} tasks due within 2 days`,
      action: 'view_urgent_tasks',
      data: urgentTodos.map(t => ({ id: t.id, title: t.title, deadline: t.deadline }))
    });
  }
  
  // Study consistency check
  if (user.streak < 3) {
    recommendations.push({
      type: 'consistency',
      priority: 'medium',
      title: 'Build Your Study Streak',
      message: 'Complete a task today to build your study streak!',
      action: 'view_quick_tasks'
    });
  }
  
  return recommendations;
}

function calculateScheduleBalance(schedule) {
  // Calculate balance between different subjects and difficulty levels
  const subjects = {};
  const difficulties = {};
  
  schedule.forEach(item => {
    const subject = item.subject || 'general';
    const difficulty = item.difficulty || 3;
    
    subjects[subject] = (subjects[subject] || 0) + 1;
    difficulties[difficulty] = (difficulties[difficulty] || 0) + 1;
  });
  
  // Balance score based on distribution
  const subjectBalance = Object.keys(subjects).length > 1 ? 8 : 5;
  const difficultyBalance = Object.keys(difficulties).length > 1 ? 8 : 6;
  
  return Math.round((subjectBalance + difficultyBalance) / 2);
}

module.exports = router;
