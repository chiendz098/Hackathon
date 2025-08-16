const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Progress, User } = require('../models');
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

// Tạo progress mới
router.post('/', auth, async (req, res) => {
  const progress = await Progress.create({ ...req.body, userId: req.userId });
  res.json(progress);
});

// Lấy danh sách progress
router.get('/', auth, async (req, res) => {
  const progresses = await Progress.findAll({
    order: [['updatedAt', 'DESC']],
    include: [{ model: User, as: 'user', attributes: ['name'] }]
  });
  res.json(progresses);
});

// Lấy chi tiết progress
router.get('/:id', auth, async (req, res) => {
  const progress = await Progress.findByPk(req.params.id, {
    include: [{ model: User, as: 'user', attributes: ['name'] }]
  });
  if (!progress) return res.status(404).json({ message: 'Progress not found' });
  res.json(progress);
});

// Cập nhật progress
router.put('/:id', auth, async (req, res) => {
  const progress = await Progress.findByPk(req.params.id);
  if (!progress) return res.status(404).json({ message: 'Progress not found' });
  await progress.update(req.body);
  res.json(progress);
});

// Xóa progress
router.delete('/:id', auth, async (req, res) => {
  const progress = await Progress.findByPk(req.params.id);
  if (!progress) return res.status(404).json({ message: 'Progress not found' });
  await progress.destroy();
  res.json({ message: 'Progress deleted' });
});

module.exports = router; 