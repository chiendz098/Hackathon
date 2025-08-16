const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Todo, User, TodoInsight, TodoCollaboration } = require('../models');

// AI-powered todo optimization
router.post('/optimize', auth, async (req, res) => {
  try {
    const { todoId, mode = 'smart', includeAdvanced = false } = req.body;
    const userId = req.user.id;

    const todo = await Todo.findByPk(todoId);
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    // Generate AI insights based on todo data
    const insights = await generateAIInsights(todo, mode, includeAdvanced, userId);

    res.json({
      success: true,
      insights,
      message: 'AI insights generated successfully'
    });
  } catch (error) {
    console.error('AI optimization error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate AI insights' });
  }
});

// Apply AI optimization
router.post('/apply', auth, async (req, res) => {
  try {
    const { todoId, insightId, action } = req.body;
    const userId = req.user.id;

    const todo = await Todo.findByPk(todoId);
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    // Apply the optimization based on insight
    const optimizedTodo = await applyOptimization(todo, insightId, action, userId);

    res.json({
      success: true,
      optimizedTodo,
      message: 'Optimization applied successfully'
    });
  } catch (error) {
    console.error('Apply optimization error:', error);
    res.status(500).json({ success: false, message: 'Failed to apply optimization' });
  }
});

// Smart scheduling suggestions
router.post('/schedule', auth, async (req, res) => {
  try {
    const { todoId, preferences } = req.body;
    const userId = req.user.id;

    const todo = await Todo.findByPk(todoId);
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    // Generate optimal schedule suggestions
    const scheduleSuggestions = await generateScheduleSuggestions(todo, preferences, userId);

    res.json({
      success: true,
      scheduleSuggestions,
      message: 'Schedule suggestions generated'
    });
  } catch (error) {
    console.error('Schedule optimization error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate schedule suggestions' });
  }
});

// AI-powered task breakdown
router.post('/breakdown', auth, async (req, res) => {
  try {
    const { todoId, complexity } = req.body;
    const userId = req.user.id;

    const todo = await Todo.findByPk(todoId);
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    // Break down complex tasks into subtasks
    const subtasks = await generateTaskBreakdown(todo, complexity, userId);

    res.json({
      success: true,
      subtasks,
      message: 'Task breakdown generated'
    });
  } catch (error) {
    console.error('Task breakdown error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate task breakdown' });
  }
});

// Helper functions
async function generateAIInsights(todo, mode, includeAdvanced, userId) {
  const insights = [];

  // Analyze todo complexity and suggest optimizations
  if (todo.difficulty > 3) {
    insights.push({
      id: `insight_${Date.now()}_1`,
      insightType: 'productivity',
      category: 'suggestion',
      title: 'Break Down Complex Task',
      description: 'This task has high complexity. Consider breaking it into smaller, manageable subtasks.',
      priority: 'high',
      confidence: 0.9,
      actions: ['Create subtasks', 'Set intermediate deadlines', 'Assign to multiple people'],
      source: 'ai'
    });
  }

  // Time optimization insights
  if (todo.estimatedTime && todo.estimatedTime > 120) {
    insights.push({
      id: `insight_${Date.now()}_2`,
      insightType: 'scheduling',
      category: 'tip',
      title: 'Optimize Time Allocation',
      description: 'This task requires significant time. Consider scheduling during your peak productivity hours.',
      priority: 'medium',
      confidence: 0.8,
      actions: ['Schedule during peak hours', 'Add buffer time', 'Plan breaks'],
      source: 'ai'
    });
  }

  // Energy-based scheduling
  if (todo.energyLevel && todo.energyLevel === 'high') {
    insights.push({
      id: `insight_${Date.now()}_3`,
      insightType: 'scheduling',
      category: 'recommendation',
      title: 'High Energy Task',
      description: 'This task requires high energy. Schedule it when you feel most energetic.',
      priority: 'medium',
      confidence: 0.85,
      actions: ['Schedule in morning', 'Avoid after lunch', 'Prepare energy boosters'],
      source: 'ai'
    });
  }

  // Collaboration opportunities
  if (todo.groupId && todo.groupMembers && todo.groupMembers.length > 1) {
    insights.push({
      id: `insight_${Date.now()}_4`,
      insightType: 'collaboration',
      category: 'suggestion',
      title: 'Leverage Team Collaboration',
      description: 'Multiple team members are involved. Consider pair programming or peer review.',
      priority: 'medium',
      confidence: 0.75,
      actions: ['Pair programming', 'Peer review', 'Regular sync meetings'],
      source: 'ai'
    });
  }

  // Advanced insights if requested
  if (includeAdvanced) {
    insights.push({
      id: `insight_${Date.now()}_5`,
      insightType: 'learning',
      category: 'analysis',
      title: 'Learning Opportunity',
      description: 'This task aligns with your learning goals. Consider documenting key learnings.',
      priority: 'low',
      confidence: 0.7,
      actions: ['Document learnings', 'Share with team', 'Create knowledge base'],
      source: 'ai'
    });
  }

  return insights;
}

async function applyOptimization(todo, insightId, action, userId) {
  // Apply the specific optimization based on insight
  const updatedTodo = { ...todo.toJSON() };

  if (insightId.includes('breakdown')) {
    // Apply task breakdown
    updatedTodo.subtasks = [
      { id: 1, title: 'Research and planning', status: 'pending', assignedTo: userId },
      { id: 2, title: 'Implementation', status: 'pending', assignedTo: userId },
      { id: 3, title: 'Testing and review', status: 'pending', assignedTo: userId }
    ];
  }

  if (insightId.includes('scheduling')) {
    // Apply scheduling optimization
    updatedTodo.smartScheduling = {
      ...updatedTodo.smartScheduling,
      autoScheduled: true,
      optimalTimeSlots: ['09:00', '14:00', '16:00']
    };
  }

  // Save the updated todo
  await Todo.update(updatedTodo, { where: { id: todo.id } });

  return updatedTodo;
}

async function generateScheduleSuggestions(todo, preferences, userId) {
  const suggestions = [];

  // Generate time slot suggestions based on preferences
  const timeSlots = ['09:00', '10:30', '14:00', '15:30', '17:00'];
  
  timeSlots.forEach((time, index) => {
    suggestions.push({
      id: `schedule_${index}`,
      time: time,
      duration: todo.estimatedTime || 60,
      priority: todo.priority,
      reason: `Optimal time based on your ${preferences.energyPattern || 'balanced'} energy pattern`,
      confidence: 0.8 - (index * 0.1)
    });
  });

  return suggestions;
}

async function generateTaskBreakdown(todo, complexity, userId) {
  const subtasks = [];

  if (complexity === 'high') {
    subtasks.push(
      { id: 1, title: 'Research and Analysis', description: 'Gather requirements and analyze scope', estimatedTime: 30, priority: 'high' },
      { id: 2, title: 'Planning and Design', description: 'Create detailed plan and design', estimatedTime: 45, priority: 'high' },
      { id: 3, title: 'Implementation', description: 'Execute the main task', estimatedTime: 90, priority: 'medium' },
      { id: 4, title: 'Testing and Validation', description: 'Test and validate results', estimatedTime: 30, priority: 'medium' },
      { id: 5, title: 'Documentation and Review', description: 'Document work and review', estimatedTime: 15, priority: 'low' }
    );
  } else if (complexity === 'medium') {
    subtasks.push(
      { id: 1, title: 'Planning', description: 'Plan the approach', estimatedTime: 20, priority: 'medium' },
      { id: 2, title: 'Execution', description: 'Complete the main task', estimatedTime: 60, priority: 'high' },
      { id: 3, title: 'Review', description: 'Review and finalize', estimatedTime: 10, priority: 'low' }
    );
  }

  return subtasks;
}

module.exports = router; 