const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Event, User } = require('../models');
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

// Tạo event mới
router.post('/', auth, async (req, res) => {
  const event = await Event.create({ ...req.body, createdBy: req.userId });
  res.json(event);
});

// Lấy danh sách event
router.get('/', auth, async (req, res) => {
  const events = await Event.findAll({
    order: [['start', 'ASC']],
    include: [
      { model: User, as: 'creator', attributes: ['name'] },
      { model: User, as: 'participants', attributes: ['name'], through: { attributes: [] } }
    ]
  });
  res.json(events);
});

// Lấy chi tiết event
router.get('/:id', auth, async (req, res) => {
  const event = await Event.findByPk(req.params.id, {
    include: [
      { model: User, as: 'creator', attributes: ['name'] },
      { model: User, as: 'participants', attributes: ['name'], through: { attributes: [] } }
    ]
  });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json(event);
});

// Cập nhật event
router.put('/:id', auth, async (req, res) => {
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  await event.update(req.body);
  res.json(event);
});

// Xóa event
router.delete('/:id', auth, async (req, res) => {
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  await event.destroy();
  res.json({ message: 'Event deleted' });
});

module.exports = router; 