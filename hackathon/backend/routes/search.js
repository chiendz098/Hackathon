const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Todo } = require('../models');
const { Op } = require('sequelize');

// Smart search endpoint
router.post('/', auth, async (req, res) => {
  try {
    const { query, filters, userId } = req.body;
    
    if (!query || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Query and userId are required'
      });
    }

    const searchResults = await performSmartSearch(query, filters, userId);
    
    res.json({
      success: true,
      results: searchResults
    });
  } catch (error) {
    console.error('Error in smart search:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search'
    });
  }
});

// Get search suggestions
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    const suggestions = await getSearchSuggestions(query, userId);

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions'
    });
  }
});

// Get search history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // In a real implementation, you'd store search history in database
    // For now, return empty array as history is stored client-side
    res.json({
      success: true,
      history: []
    });
  } catch (error) {
    console.error('Error getting search history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search history'
    });
  }
});

// Save search query to history
router.post('/history', auth, async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user.id;

    // In a real implementation, you'd save to database
    // For now, just return success
    res.json({
      success: true,
      message: 'Search query saved to history'
    });
  } catch (error) {
    console.error('Error saving search history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save search history'
    });
  }
});

// Advanced search with filters
router.post('/advanced', auth, async (req, res) => {
  try {
    const {
      query,
      subjects,
      priorities,
      dateRange,
      taskStatus,
      tags
    } = req.body;

    const userId = req.user.id;
    const results = await performAdvancedSearch({
      query,
      subjects,
      priorities,
      dateRange,
      taskStatus,
      tags,
      userId
    });

    res.json({
      success: true,
      results,
      filters: {
        subjects,
        priorities,
        dateRange,
        taskStatus,
        tags
      }
    });
  } catch (error) {
    console.error('Error performing advanced search:', error);
    res.status(500).json({
      success: false,
      message: 'Advanced search failed'
    });
  }
});

// Perform smart search across multiple data types
async function performSmartSearch(query, filters, userId) {
  const results = [];
  const searchTerm = query.toLowerCase();
  
  try {
    // Search in todos
    if (filters.type === 'all' || filters.type === 'tasks') {
      const todos = await Todo.findAll({
        where: {
          userId,
          [Op.or]: [
            { title: { [Op.iLike]: `%${searchTerm}%` } },
            { description: { [Op.iLike]: `%${searchTerm}%` } },
            { subject: { [Op.iLike]: `%${searchTerm}%` } },
            { tags: { [Op.overlap]: [searchTerm] } }
          ]
        },
        limit: 10,
        order: [['created_at', 'DESC']]
      });
      
      results.push(...todos.map(todo => ({
        id: todo.id,
        type: 'task',
        title: todo.title,
        description: todo.description,
        subject: todo.subject,
        priority: todo.priority,
        dueDate: todo.deadline,
        tags: todo.tags,
        relevanceScore: calculateRelevanceScore(todo, searchTerm)
      })));
    }
    
    // Search in study materials
    if (filters.type === 'all' || filters.type === 'notes') {
      const materials = await StudyMaterial.findAll({
        where: {
          userId,
          [Op.or]: [
            { title: { [Op.iLike]: `%${searchTerm}%` } },
            { content: { [Op.iLike]: `%${searchTerm}%` } },
            { subject: { [Op.iLike]: `%${searchTerm}%` } }
          ]
        },
        limit: 10,
        order: [['created_at', 'DESC']]
      });
      
      results.push(...materials.map(material => ({
        id: material.id,
        type: 'note',
        title: material.title,
        description: material.content?.substring(0, 100),
        subject: material.subject,
        createdDate: material.created_at,
        tags: material.tags,
        relevanceScore: calculateRelevanceScore(material, searchTerm)
      })));
    }
    
    // Search in subjects
    if (filters.type === 'all' || filters.type === 'subjects') {
      const subjectTodos = await Todo.findAll({
        where: {
          userId,
          subject: { [Op.iLike]: `%${searchTerm}%` }
        },
        attributes: ['subject'],
        group: ['subject'],
        limit: 5
      });
      
      results.push(...subjectTodos.map(todo => ({
        id: `subject_${todo.subject}`,
        type: 'subject',
        title: todo.subject,
        description: `All ${todo.subject} related tasks and notes`,
        taskCount: 0, // Would need to calculate this
        noteCount: 0, // Would need to calculate this
        relevanceScore: 0.8
      })));
    }
    
    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return results.slice(0, 20); // Limit to top 20 results
    
  } catch (error) {
    console.error('Error in performSmartSearch:', error);
    return [];
  }
}

// Calculate relevance score for search results
function calculateRelevanceScore(item, searchTerm) {
  let score = 0;
  const term = searchTerm.toLowerCase();
  
  // Title match (highest weight)
  if (item.title?.toLowerCase().includes(term)) {
    score += 0.5;
  }
  
  // Description match
  if (item.description?.toLowerCase().includes(term)) {
    score += 0.3;
  }
  
  // Subject match
  if (item.subject?.toLowerCase().includes(term)) {
    score += 0.2;
  }
  
  // Tags match
  if (item.tags?.some(tag => tag.toLowerCase().includes(term))) {
    score += 0.1;
  }
  
  // Recency bonus
  if (item.created_at) {
    const daysSinceCreation = (Date.now() - new Date(item.created_at)) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) score += 0.1;
    else if (daysSinceCreation < 30) score += 0.05;
  }
  
  return Math.min(1, score);
}

async function getSearchSuggestions(query, userId) {
  if (!query || query.length < 2) {
    return [];
  }

  const suggestions = [];

  // Get recent tasks that match
  const recentTasks = await Todo.findAll({
    where: {
      userId,
      [Op.or]: [
        { title: { [Op.iLike]: `%${query}%` } },
        { subject: { [Op.iLike]: `%${query}%` } }
      ]
    },
    order: [['updatedAt', 'DESC']],
    limit: 5
  });

  recentTasks.forEach(task => {
    suggestions.push({
      type: 'task',
      text: task.title,
      subtitle: task.subject
    });
  });

  // Get subject suggestions
  const subjects = await getUniqueSubjects(userId);
  subjects.forEach(subject => {
    if (subject.toLowerCase().includes(query.toLowerCase())) {
      suggestions.push({
        type: 'subject',
        text: subject,
        subtitle: 'Subject'
      });
    }
  });

  return suggestions.slice(0, 8);
}

async function getUniqueSubjects(userId) {
  const tasks = await Todo.findAll({
    where: { userId },
    attributes: ['subject'],
    group: ['subject'],
    raw: true
  });

  return tasks
    .map(task => task.subject)
    .filter(subject => subject && subject.trim())
    .sort();
}

async function getUniqueTags(userId) {
  const tasks = await Todo.findAll({
    where: { 
      userId,
      tags: { [Op.ne]: null }
    },
    attributes: ['tags'],
    raw: true
  });

  const allTags = new Set();
  tasks.forEach(task => {
    if (task.tags) {
      try {
        const tags = JSON.parse(task.tags);
        tags.forEach(tag => allTags.add(tag));
      } catch (e) {
        // Ignore invalid JSON
      }
    }
  });

  return Array.from(allTags).sort();
}

module.exports = router;
