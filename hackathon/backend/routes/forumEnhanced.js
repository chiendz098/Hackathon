const express = require('express');
const router = express.Router();
const { ForumCategory, ForumTopic, ForumPost, User, UserProfile, ActivityFeed, Notification } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all forum categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await ForumCategory.getTopLevelCategories();
    
    res.json({
      success: true,
      categories
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get category by slug with topics
router.get('/categories/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const category = await ForumCategory.findBySlug(slug);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if user can view this category
    const userRole = req.user?.role || 'guest';
    if (!category.canUserView(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const topics = await ForumTopic.getActiveTopics(category.id, parseInt(limit), offset);
    
    res.json({
      success: true,
      category,
      topics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: topics.length === parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Create new topic
router.post('/topics', auth, async (req, res) => {
  try {
    const {
      categoryId,
      title,
      content,
      type = 'discussion',
      tags = [],
      pollData = null
    } = req.body;
    
    // Validate required fields
    if (!categoryId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Category, title, and content are required'
      });
    }
    
    // Check if category exists and user can post
    const category = await ForumCategory.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const userRole = req.user?.role || 'authenticated';
    if (!category.canUserPost(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to post in this category'
      });
    }
    
    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-') + '-' + Date.now();
    
    // Create topic
    const topic = await ForumTopic.create({
      categoryId,
      userId: req.userId,
      title,
      content,
      slug,
      type,
      tags,
      pollData,
      isApproved: !category.requiresApproval
    });
    
    // Update category stats
    await category.incrementTopicCount();
    await category.updateLastPost(null, req.userId);
    
    // Create activity feed entry
    await ActivityFeed.createActivity({
      userId: req.userId,
      type: 'forum_topic_created',
      title: 'Created new topic',
      description: `Created topic "${title}" in ${category.name}`,
      metadata: {
        topicId: topic.id,
        topicTitle: title,
        categoryName: category.name
      },
      visibility: 'public',
      contextType: 'forum',
      contextId: topic.id
    });
    
    // Load topic with associations for response
    const createdTopic = await ForumTopic.findByPk(topic.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: ForumCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'color']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      topic: createdTopic,
      message: 'Topic created successfully'
    });
    
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get topic by slug with posts
router.get('/topics/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const topic = await ForumTopic.findBySlug(slug);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    
    // Increment view count
    await topic.incrementViews();
    
    // Get posts for this topic
    const posts = await ForumPost.getTopicPosts(topic.id, parseInt(limit), offset);
    
    res.json({
      success: true,
      topic,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Create new post/reply
router.post('/posts', auth, async (req, res) => {
  try {
    const {
      topicId,
      content,
      parentId = null
    } = req.body;
    
    if (!topicId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Topic ID and content are required'
      });
    }
    
    // Check if topic exists and is not locked
    const topic = await ForumTopic.findByPk(topicId, {
      include: [{
        model: ForumCategory,
        as: 'category'
      }]
    });
    
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    
    if (topic.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Topic is locked'
      });
    }
    
    // Check permissions
    const userRole = req.user?.role || 'authenticated';
    if (!topic.category.canUserReply(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to reply in this category'
      });
    }
    
    // Get next position
    const lastPost = await ForumPost.findOne({
      where: { topicId },
      order: [['position', 'DESC']]
    });
    const position = (lastPost?.position || 0) + 1;
    
    // Create post
    const post = await ForumPost.create({
      topicId,
      userId: req.userId,
      parentId,
      content,
      position,
      contentAnalysis: {
        wordCount: content.split(/\s+/).length,
        readingTime: Math.ceil(content.split(/\s+/).length / 200)
      }
    });
    
    // Update topic stats
    await topic.incrementReplies();
    await topic.updateLastReply(post.id, req.userId);
    
    // Update category stats
    await topic.category.incrementPostCount();
    await topic.category.updateLastPost(post.id, req.userId);
    
    // If this is a reply to another post, update parent post stats
    if (parentId) {
      const parentPost = await ForumPost.findByPk(parentId);
      if (parentPost) {
        await parentPost.incrementReplies();
      }
    }
    
    // Create activity feed entry
    await ActivityFeed.createActivity({
      userId: req.userId,
      type: parentId ? 'forum_reply_created' : 'forum_post_created',
      title: parentId ? 'Replied to post' : 'Created new post',
      description: `${parentId ? 'Replied to a post' : 'Posted'} in "${topic.title}"`,
      metadata: {
        postId: post.id,
        topicId: topic.id,
        topicTitle: topic.title,
        parentId
      },
      visibility: 'public',
      contextType: 'forum',
      contextId: post.id
    });
    
    // Create notifications for mentioned users
    const mentions = content.match(/@(\w+)/g);
    if (mentions) {
      const usernames = mentions.map(m => m.substring(1));
      const mentionedUsers = await User.findAll({
        where: {
          name: { [Op.in]: usernames }
        }
      });
      
      for (const mentionedUser of mentionedUsers) {
        await Notification.create({
          userId: mentionedUser.id,
          type: 'forum_mention',
          title: 'You were mentioned',
          message: `${req.user.name} mentioned you in "${topic.title}"`,
          data: {
            postId: post.id,
            topicId: topic.id,
            topicTitle: topic.title,
            mentionedBy: req.userId
          }
        });
        
        await post.addMention(mentionedUser.id);
      }
    }
    
    // Load post with associations for response
    const createdPost = await ForumPost.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      post: createdPost,
      message: 'Post created successfully'
    });
    
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
