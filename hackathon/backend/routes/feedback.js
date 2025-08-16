const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Feedback, User } = require('../models');
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

// Tạo feedback mới
router.post('/', auth, async (req, res) => {
  const feedback = await Feedback.create({ ...req.body, userId: req.userId });
  res.json(feedback);
});

// Lấy danh sách feedback
router.get('/', auth, async (req, res) => {
  const feedbacks = await Feedback.findAll({
    order: [['created_at', 'DESC']],
    include: [{ model: User, as: 'user', attributes: ['name'] }]
  });
  res.json(feedbacks);
});

// Lấy chi tiết feedback
router.get('/:id', auth, async (req, res) => {
  const feedback = await Feedback.findByPk(req.params.id, {
    include: [{ model: User, as: 'user', attributes: ['name'] }]
  });
  if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
  res.json(feedback);
});

// Cập nhật feedback
router.put('/:id', auth, async (req, res) => {
  const feedback = await Feedback.findByPk(req.params.id);
  if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
  await feedback.update(req.body);
  res.json(feedback);
});

// Xóa feedback
router.delete('/:id', auth, async (req, res) => {
  const feedback = await Feedback.findByPk(req.params.id);
  if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
  await feedback.destroy();
  res.json({ message: 'Feedback deleted' });
});

module.exports = router; 