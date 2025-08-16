const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Resource, User } = require('../models');
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

// Tạo resource mới
router.post('/', auth, async (req, res) => {
  const resource = await Resource.create({ ...req.body, uploadedBy: req.userId });
  res.json(resource);
});

// Lấy danh sách resource
router.get('/', auth, async (req, res) => {
  const resources = await Resource.findAll({
    order: [['created_at', 'DESC']],
    include: [{ model: User, as: 'uploader', attributes: ['name'] }]
  });
  res.json(resources);
});

// Lấy chi tiết resource
router.get('/:id', auth, async (req, res) => {
  const resource = await Resource.findByPk(req.params.id, {
    include: [{ model: User, as: 'uploader', attributes: ['name'] }]
  });
  if (!resource) return res.status(404).json({ message: 'Resource not found' });
  res.json(resource);
});

// Cập nhật resource
router.put('/:id', auth, async (req, res) => {
  const resource = await Resource.findByPk(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found' });
  await resource.update(req.body);
  res.json(resource);
});

// Xóa resource
router.delete('/:id', auth, async (req, res) => {
  const resource = await Resource.findByPk(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found' });
  await resource.destroy();
  res.json({ message: 'Resource deleted' });
});

module.exports = router; 