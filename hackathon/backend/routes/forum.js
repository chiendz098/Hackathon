const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Post, Comment, User } = require('../models');
const config = require('../config');

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Lấy danh sách bài viết
router.get('/posts', async (req, res) => {
  const posts = await Post.findAll({
    order: [['created_at', 'DESC']],
    include: [
      { model: User, as: 'user', attributes: ['name'] },
      { model: Comment, as: 'comments', include: [{ model: User, as: 'user', attributes: ['name'] }] }
    ]
  });
  res.json(posts);
});

// Tạo bài viết mới
router.post('/post', auth, async (req, res) => {
  const post = await Post.create({ ...req.body, userId: req.userId });
  res.json(post);
});

// Bình luận bài viết
router.post('/comment', auth, async (req, res) => {
  const { postId, content } = req.body;
  const comment = await Comment.create({ userId: req.userId, postId, content });
  res.json(comment);
});

// Upvote/downvote bài viết
router.post('/vote', auth, async (req, res) => {
  const { postId, value } = req.body; // value: 1 (up), -1 (down)
  const post = await Post.findByPk(postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  await post.increment('votes', { by: value });
  await post.reload();
  res.json(post);
});

module.exports = router; 