const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Exam, User } = require('../models');
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

// Tạo exam mới
router.post('/', auth, async (req, res) => {
  const exam = await Exam.create({ ...req.body, createdBy: req.userId });
  res.json(exam);
});

// Lấy danh sách exam
router.get('/', auth, async (req, res) => {
  const exams = await Exam.findAll({
    order: [['date', 'ASC']],
    include: [
      { model: User, as: 'creator', attributes: ['name'] },
      { model: User, as: 'participants', attributes: ['name'], through: { attributes: [] } }
    ]
  });
  res.json(exams);
});

// Lấy chi tiết exam
router.get('/:id', auth, async (req, res) => {
  const exam = await Exam.findByPk(req.params.id, {
    include: [
      { model: User, as: 'creator', attributes: ['name'] },
      { model: User, as: 'participants', attributes: ['name'], through: { attributes: [] } }
    ]
  });
  if (!exam) return res.status(404).json({ message: 'Exam not found' });
  res.json(exam);
});

// Cập nhật exam
router.put('/:id', auth, async (req, res) => {
  const exam = await Exam.findByPk(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam not found' });
  await exam.update(req.body);
  res.json(exam);
});

// Xóa exam
router.delete('/:id', auth, async (req, res) => {
  const exam = await Exam.findByPk(req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam not found' });
  await exam.destroy();
  res.json({ message: 'Exam deleted' });
});

module.exports = router; 