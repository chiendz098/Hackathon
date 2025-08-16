const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Post, User, Comment } = require('../models');

// Get all published posts (public)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { status: 'published' },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: Comment,
          as: 'comments',
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'name']
          }]
        },

      ],
      order: [['publishedAt', 'DESC']],
      limit: 9
    });

    res.json({
      success: true,
      posts: posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all posts (admin only)
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const posts = await Post.findAll({
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'email']
      }],
      order: [['created_at', 'DESC']]
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching admin posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'avatar']
      }]
    });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Increment views
    await post.incrementViews();
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create post (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, content, category, status, image } = req.body;
    
    const post = await Post.create({
      title,
      content,
      category,
      status,
      image,
      authorId: req.user.id
    });

    res.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, content, category, status, image } = req.body;
    
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.update({
      title,
      content,
      category,
      status,
      image
    });

    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.destroy();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle like on post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.toggleLike(req.user.id);
    res.json(post);
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get posts by category
router.get('/category/:category', async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { 
        status: 'published',
        category: req.params.category
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['publishedAt', 'DESC']]
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to post
router.post('/comment', auth, async (req, res) => {
  try {
    const { postId, content } = req.body;
    
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      content,
      postId,
      userId: req.user.id
    });

    // Get comment with author info
    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name']
      }]
    });

    res.json(commentWithAuthor);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on post (using likes field since votes table doesn't exist)
router.post('/vote', auth, async (req, res) => {
  try {
    const { postId, value } = req.body; // value: 1 for upvote, -1 for downvote
    
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get current likes array
    const currentLikes = post.likes || [];
    
    // Check if user already voted
    const existingVoteIndex = currentLikes.findIndex(vote => vote.userId === req.user.id);
    
    if (existingVoteIndex !== -1) {
      // Update existing vote
      currentLikes[existingVoteIndex].value = value;
    } else {
      // Add new vote
      currentLikes.push({
        userId: req.user.id,
        value: value,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update post with new likes
    await post.update({ likes: currentLikes });
    
    // Calculate total vote count
    const totalVotes = currentLikes.reduce((sum, vote) => sum + vote.value, 0);
    
    res.json({
      success: true,
      totalVotes: totalVotes,
      userVote: value
    });
  } catch (error) {
    console.error('Error voting on post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 