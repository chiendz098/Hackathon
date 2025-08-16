const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Event, Exam, Resource, Mentor, Feedback, Progress, Notification, Todo, Group } = require('../models');
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

// Orchestrator endpoint
router.post('/agent', auth, async (req, res) => {
  const { prompt, function_call } = req.body;
  // TODO: Tích hợp AI intent detection, function calling, RAG
  // Demo: Nếu function_call, thực hiện CRUD tương ứng
  try {
    if (function_call) {
      const { entity, action, data, id } = function_call;
      let result;
      switch (entity) {
        case 'event':
          if (action === 'create') result = await Event.create({ ...data, createdBy: req.userId });
          else if (action === 'list') result = await Event.findAll();
          else if (action === 'get') result = await Event.findByPk(id);
          else if (action === 'update') {
            const event = await Event.findByPk(id);
            if (event) {
              await event.update(data);
              result = event;
            }
          }
          else if (action === 'delete') {
            const event = await Event.findByPk(id);
            if (event) {
              await event.destroy();
              result = { deleted: true };
            }
          }
          break;
        case 'exam':
          if (action === 'create') result = await Exam.create({ ...data, createdBy: req.userId });
          else if (action === 'list') result = await Exam.findAll();
          else if (action === 'get') result = await Exam.findByPk(id);
          else if (action === 'update') {
            const exam = await Exam.findByPk(id);
            if (exam) {
              await exam.update(data);
              result = exam;
            }
          }
          else if (action === 'delete') {
            const exam = await Exam.findByPk(id);
            if (exam) {
              await exam.destroy();
              result = { deleted: true };
            }
          }
          break;
        case 'resource':
          if (action === 'create') result = await Resource.create({ ...data, uploadedBy: req.userId });
          else if (action === 'list') result = await Resource.findAll();
          else if (action === 'get') result = await Resource.findByPk(id);
          else if (action === 'update') {
            const resource = await Resource.findByPk(id);
            if (resource) {
              await resource.update(data);
              result = resource;
            }
          }
          else if (action === 'delete') {
            const resource = await Resource.findByPk(id);
            if (resource) {
              await resource.destroy();
              result = { deleted: true };
            }
          }
          break;
        case 'mentor':
          if (action === 'create') result = await Mentor.create({ ...data, userId: req.userId });
          else if (action === 'list') result = await Mentor.findAll();
          else if (action === 'get') result = await Mentor.findByPk(id);
          else if (action === 'update') {
            const mentor = await Mentor.findByPk(id);
            if (mentor) {
              await mentor.update(data);
              result = mentor;
            }
          }
          else if (action === 'delete') {
            const mentor = await Mentor.findByPk(id);
            if (mentor) {
              await mentor.destroy();
              result = { deleted: true };
            }
          }
          break;
        case 'feedback':
          if (action === 'create') result = await Feedback.create({ ...data, userId: req.userId });
          else if (action === 'list') result = await Feedback.findAll();
          else if (action === 'get') result = await Feedback.findByPk(id);
          else if (action === 'update') {
            const feedback = await Feedback.findByPk(id);
            if (feedback) {
              await feedback.update(data);
              result = feedback;
            }
          }
          else if (action === 'delete') {
            const feedback = await Feedback.findByPk(id);
            if (feedback) {
              await feedback.destroy();
              result = { deleted: true };
            }
          }
          break;
        case 'progress':
          if (action === 'create') result = await Progress.create({ ...data, userId: req.userId });
          else if (action === 'list') result = await Progress.findAll();
          else if (action === 'get') result = await Progress.findByPk(id);
          else if (action === 'update') {
            const progress = await Progress.findByPk(id);
            if (progress) {
              await progress.update(data);
              result = progress;
            }
          }
          else if (action === 'delete') {
            const progress = await Progress.findByPk(id);
            if (progress) {
              await progress.destroy();
              result = { deleted: true };
            }
          }
          break;
        case 'notification':
          if (action === 'create') result = await Notification.create({ ...data, userId: req.userId });
          else if (action === 'list') result = await Notification.findAll({ where: { userId: req.userId } });
          else if (action === 'get') result = await Notification.findByPk(id);
          else if (action === 'update') {
            const notification = await Notification.findByPk(id);
            if (notification) {
              await notification.update(data);
              result = notification;
            }
          }
          else if (action === 'delete') {
            const notification = await Notification.findByPk(id);
            if (notification) {
              await notification.destroy();
              result = { deleted: true };
            }
          }
          break;
        // Thêm các entity khác (todo, group, file, v.v.) tương tự
        default:
          return res.status(400).json({ message: 'Unknown entity' });
      }
      return res.json({ result });
    }
    // Nếu không có function_call, trả về thông báo
    res.json({ message: 'Orchestrator agent sẵn sàng. Hãy gửi function_call hoặc prompt.' });
  } catch (err) {
    res.status(500).json({ message: 'Orchestrator error', error: err.message });
  }
});

module.exports = router; 