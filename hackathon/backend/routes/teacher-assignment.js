const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Todo, User, Classroom, ClassroomStudent } = require('../models');
const config = require('../config');

// Middleware xác thực JWT
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

// Middleware kiểm tra quyền giáo viên
async function checkTeacherRole(req, res, next) {
  try {
    const user = await User.findByPk(req.userId);
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ message: 'Chỉ giáo viên mới có quyền này' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Tạo assignment cho toàn bộ lớp
router.post('/classroom/:classroomId/assign', auth, checkTeacherRole, async (req, res) => {
  try {
    const { classroomId } = req.params;
    const {
      title,
      description,
      deadline,
      priority = 3,
      priorityLabel = 'medium',
      category = 'study',
      type = 'exam',
      estimatedTime,
      notes,
      tags = [],
      customFields = {}
    } = req.body;

    // Kiểm tra classroom tồn tại và teacher có quyền
    const classroom = await Classroom.findOne({
      where: { 
        id: classroomId,
        teacherId: req.userId 
      }
    });

    if (!classroom) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc bạn không có quyền' });
    }

    // Lấy danh sách học sinh trong lớp
    const students = await ClassroomStudent.findAll({
      where: { classroomId },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (students.length === 0) {
      return res.status(400).json({ message: 'Lớp học chưa có học sinh nào' });
    }

    // Tạo todo cho từng học sinh
    const createdTodos = [];
    for (const student of students) {
      const todo = await Todo.create({
        userId: student.studentId,
        assignedBy: req.userId,
        title,
        description,
        notes,
        deadline: deadline ? new Date(deadline) : null,
        priority,
        priorityLabel,
        category,
        type,
        estimatedTime,
        tags,
        customFields: {
          ...customFields,
          classroomId,
          classroomName: classroom.name,
          assignmentType: 'teacher_assignment'
        }
      });

      createdTodos.push({
        todoId: todo.id,
        studentId: student.studentId,
        studentName: student.student.name,
        studentEmail: student.student.email
      });
    }

    res.json({
      success: true,
      message: `Đã giao bài tập cho ${students.length} học sinh`,
      assignment: {
        title,
        deadline,
        classroomName: classroom.name,
        studentsCount: students.length
      },
      createdTodos
    });

  } catch (error) {
    console.error('Error creating classroom assignment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get assignments for teacher
router.get('/assignments', auth, async (req, res) => {
  try {
    const assignments = await Todo.findAll({
      where: {
        assignedBy: req.userId,
        todoType: 'teacher_assignment'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      status: assignment.status,
      deadline: assignment.deadline,
      maxScore: assignment.maxScore,
      studentScore: assignment.studentScore,
      student: assignment.user,
      createdAt: assignment.createdAt
    }));

    const stats = {
      total: assignments.length,
      completed: assignments.filter(t => t.status === 'done').length,
      pending: assignments.filter(t => t.status !== 'done').length
    };

    res.json({
      success: true,
      assignments: formattedAssignments,
      stats
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments'
    });
  }
});

// View assignment details
router.get('/assignment/:assignmentKey', auth, checkTeacherRole, async (req, res) => {
  try {
    const { assignmentKey } = req.params;
    const [title, deadline, classroomId] = assignmentKey.split('-');

    const todos = await Todo.findAll({
      where: {
        assignedBy: req.userId,
        title: decodeURIComponent(title),
        deadline: deadline !== 'null' ? new Date(deadline) : null,
        'customFields.classroomId': classroomId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ],
      order: [['user', 'name', 'ASC']]
    });

    const classroom = await Classroom.findByPk(classroomId);

    const completedCount = todos.filter(t => t.status === 'done').length;
    const pendingCount = todos.filter(t => t.status !== 'done').length;

    res.json({
      assignment: {
        title: decodeURIComponent(title),
        deadline,
        classroom: classroom?.name,
        totalStudents: todos.length,
        completed: completedCount,
        pending: pendingCount,
        avgProgress: todos.reduce((sum, t) => sum + (t.progress || 0), 0) / todos.length,
        totalTimeSpent: todos.reduce((sum, t) => sum + (t.timeSpent || 0), 0)
      },
      students: todos.map(todo => ({
        todoId: todo.id,
        student: todo.user,
        status: todo.status,
        progress: todo.progress || 0,
        timeSpent: todo.timeSpent || 0,
        completedAt: todo.completedAt,
        notes: todo.notes
      }))
    });

  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching assignment details' 
    });
  }
});

// Get assignments assigned to student
router.get('/student-assignments', auth, async (req, res) => {
  try {
    const assignments = await Todo.findAll({
      where: { 
        userId: req.userId,
        assignedBy: { [require('sequelize').Op.ne]: null }
      },
      include: [
        {
          model: User,
          as: 'assignedByUser',
          attributes: ['id', 'name', 'avatar']
        }
      ],
      order: [['deadline', 'ASC']]
    });

    res.json({
      success: true,
      assignments
    });

  } catch (error) {
    console.error('Error fetching student assignments:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching student assignments' 
    });
  }
});

// Update assignment progress
router.put('/:id/progress', auth, async (req, res) => {
  try {
    const { progress } = req.body;
    const todo = await Todo.findOne({
      where: { id: req.params.id, assignedBy: req.userId }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const updatedProgress = Math.min(100, Math.max(0, progress));
    const status = updatedProgress >= 100 ? 'done' : todo.status;

    await todo.update({
      progress: updatedProgress,
      status
    });

    res.json({
      success: true,
      message: 'Assignment progress updated',
      todo
    });
  } catch (error) {
    console.error('Error updating assignment progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment progress'
    });
  }
});

module.exports = router;
