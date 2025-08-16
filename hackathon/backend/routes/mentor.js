const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Mentor, User } = require('../models');
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

// Tạo mentor mới
router.post('/', auth, async (req, res) => {
  const mentor = await Mentor.create({ ...req.body, userId: req.userId });
  res.json(mentor);
});

// Lấy danh sách mentor
router.get('/', auth, async (req, res) => {
  const mentors = await Mentor.findAll({
    order: [['created_at', 'DESC']],
    include: [{ model: User, as: 'user', attributes: ['name'] }]
  });
  res.json(mentors);
});

// Lấy chi tiết mentor
router.get('/:id', auth, async (req, res) => {
  const mentor = await Mentor.findByPk(req.params.id, {
    include: [{ model: User, as: 'user', attributes: ['name'] }]
  });
  if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
  res.json(mentor);
});

// Cập nhật mentor
router.put('/:id', auth, async (req, res) => {
  const mentor = await Mentor.findByPk(req.params.id);
  if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
  await mentor.update(req.body);
  res.json(mentor);
});

// Xóa mentor
router.delete('/:id', auth, async (req, res) => {
  const mentor = await Mentor.findByPk(req.params.id);
  if (!mentor) return res.status(404).json({ message: 'Mentor not found' });
  await mentor.destroy();
  res.json({ message: 'Mentor deleted' });
});

module.exports = router; 