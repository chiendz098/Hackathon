const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Todo } = require('../models');
const { Op } = require('sequelize');

// TODO: Cấu hình Google OAuth, lấy access_token từ user, dùng googleapis để đồng bộ
// Xem hướng dẫn: https://developers.google.com/calendar/api/quickstart/nodejs

router.post('/sync', async (req, res) => {
  // const { access_token, todos } = req.body;
  // TODO: Dùng googleapis để thêm/sửa/xóa sự kiện vào Google Calendar
  // Trả về kết quả đồng bộ
  res.json({ message: 'Đồng bộ Google Calendar: TODO - Cần cấu hình OAuth và API key.' });
});

// Get time blocks for a specific date
router.get('/time-blocks', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.userId;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get scheduled tasks for the date - use deadline or remindAt instead of scheduledTime
    const scheduledTasks = await Todo.findAll({
      where: {
        userId,
        [Op.or]: [
          {
            deadline: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            remindAt: {
              [Op.between]: [startDate, endDate]
            }
          }
        ]
      },
      order: [['deadline', 'ASC']]
    });

    // Convert tasks to time blocks format
    const blocks = scheduledTasks.map(task => ({
      id: `task_${task.id}`,
      title: task.title,
      startTime: new Date(task.deadline || task.remindAt || task.createdAt).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }),
      endTime: new Date(new Date(task.deadline || task.remindAt || task.createdAt).getTime() + (task.estimatedTime || 60) * 60000).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }),
      type: 'task',
      subject: task.subject,
      priority: task.priority,
      taskId: task.id
    }));

    res.json({
      success: true,
      blocks
    });
  } catch (error) {
    console.error('Error fetching time blocks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time blocks'
    });
  }
});

// Create a new time block
router.post('/time-blocks', auth, async (req, res) => {
  try {
    const {
      title,
      startTime,
      endTime,
      type,
      subject,
      priority,
      taskId,
      date
    } = req.body;

    const userId = req.userId;

    if (taskId) {
      // Update existing task with scheduling info - use remindAt instead of scheduledTime
      const scheduledDateTime = new Date(`${date}T${startTime}`);

      await Todo.update({
        remindAt: scheduledDateTime // Fixed: use remindAt instead of scheduledTime
      }, {
        where: {
          id: taskId,
          userId
        }
      });

      const updatedTask = await Todo.findByPk(taskId);

      res.json({
        success: true,
        block: {
          id: `task_${taskId}`,
          title: updatedTask.title,
          startTime,
          endTime,
          type: 'task',
          subject: updatedTask.subject,
          priority: updatedTask.priority,
          taskId
        }
      });
    } else {
      // Create new time block (non-task)
      const newBlock = {
        id: `block_${Date.now()}`,
        title,
        startTime,
        endTime,
        type,
        subject,
        priority,
        date
      };

      res.json({
        success: true,
        block: newBlock
      });
    }
  } catch (error) {
    console.error('Error creating time block:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create time block'
    });
  }
});

// Update a time block
router.put('/time-blocks/:blockId', auth, async (req, res) => {
  try {
    const { blockId } = req.params;
    const { startTime, endTime, date } = req.body;
    const userId = req.userId;

    if (blockId.startsWith('task_')) {
      const taskId = blockId.replace('task_', '');
      const scheduledDateTime = new Date(`${date}T${startTime}`);

      await Todo.update({
        remindAt: scheduledDateTime // Fixed: use remindAt instead of scheduledTime
      }, {
        where: {
          id: taskId,
          userId
        }
      });

      const updatedTask = await Todo.findByPk(taskId);

      res.json({
        success: true,
        block: {
          id: blockId,
          title: updatedTask.title,
          startTime,
          endTime,
          type: 'task',
          subject: updatedTask.subject,
          priority: updatedTask.priority,
          taskId
        }
      });
    } else {
      res.json({
        success: true,
        block: {
          id: blockId,
          startTime,
          endTime
        }
      });
    }
  } catch (error) {
    console.error('Error updating time block:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update time block'
    });
  }
});

module.exports = router;