const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Notification, User } = require('../models');
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

// Tạo notification mới
router.post('/', auth, async (req, res) => {
  const notification = await Notification.create({ ...req.body, userId: req.userId });
  res.json(notification);
});

// Lấy danh sách notification của user
router.get('/', auth, async (req, res) => {
  const notifications = await Notification.findAll({
    where: { userId: req.userId },
    order: [['createdAt', 'DESC']]
  });
  res.json(notifications);
});

// Lấy chi tiết notification
router.get('/:id', auth, async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json(notification);
});

// Cập nhật notification (ví dụ: đánh dấu đã đọc)
router.put('/:id', auth, async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  await notification.update(req.body);
  res.json(notification);
});

// Xóa notification
router.delete('/:id', auth, async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  await notification.destroy();
  res.json({ message: 'Notification deleted' });
});

module.exports = router; 