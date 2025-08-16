const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Thread, Message, User } = require('../models');
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

// Lấy thread theo id
router.get('/:id', auth, async (req, res) => {
  const thread = await Thread.findByPk(req.params.id, {
    include: [{ model: Message, as: 'messages' }]
  });
  res.json(thread);
});

// Gửi tin nhắn vào thread
router.post('/:id/message', auth, async (req, res) => {
  const msg = await Message.create({ ...req.body, threadId: req.params.id, senderId: req.userId });
  res.json(msg);
});

// Lấy tin nhắn của thread
router.get('/:id/messages', auth, async (req, res) => {
  const messages = await Message.findAll({
    where: { threadId: req.params.id },
    include: [{ model: User, as: 'sender', attributes: ['name', 'avatar'] }],
    order: [['created_at', 'ASC']]
  });
  res.json(messages);
});

// Tóm tắt AI (giả lập, sẽ tích hợp Gemini API sau)
router.post('/:id/summarize', auth, async (req, res) => {
  const thread = await Thread.findByPk(req.params.id, {
    include: [{ model: Message, as: 'messages' }]
  });
  const content = thread.messages.map(m => m.content).join('\n');
  // TODO: Gọi Gemini API để tóm tắt content
  const summary = 'Tóm tắt AI (demo): ' + content.slice(0, 200) + '...';
  await thread.update({ summary });
  res.json({ summary });
});

module.exports = router; 