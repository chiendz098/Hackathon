const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { 
  Classroom, ClassroomStudent, TodoAssignment, TodoSubmission, User 
} = require('../models');
const { Op } = require('sequelize');

// Generate unique class code
function generateClassCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Admin: Create new classroom
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      subject,
      maxStudents,
      semester,
      year,
      schedule,
      coverImage,
      color
    } = req.body;

    // Generate unique class code
    let classCode;
    let isUnique = false;
    while (!isUnique) {
      classCode = generateClassCode();
      const existing = await Classroom.findOne({ where: { classCode } });
      if (!existing) isUnique = true;
    }

    const classroom = await Classroom.create({
      name,
      description,
      subject,
      classCode,
      createdBy: req.user.id,
      maxStudents: maxStudents || 50,
      semester,
      year,
      schedule: schedule || {},
      coverImage,
      color: color || '#3B82F6'
    });

    res.status(201).json({
      success: true,
      classroom,
      message: 'Classroom created successfully'
    });
  } catch (error) {
    console.error('Error creating classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating classroom'
    });
  }
});

// Get all classrooms (admin) or user's classrooms (student)
router.get('/', auth, async (req, res) => {
  try {
    let classrooms;

    if (req.user.role === 'admin') {
      // Admin sees all classrooms they created
      classrooms = await Classroom.findAll({
        where: { createdBy: req.user.id },
        include: [
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'name', 'email', 'avatar']
          },
          {
            model: ClassroomStudent,
            as: 'students',
            include: [{
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'email', 'avatar', 'studentId']
            }]
          }
        ],
        order: [['created_at', 'DESC']]
      });
    } else {
      // Students see classrooms they're enrolled in
      const enrollments = await ClassroomStudent.findAll({
        where: { studentId: req.user.id },
        include: [{
          model: Classroom,
          as: 'classroom',
          include: [{
            model: User,
            as: 'teacher',
            attributes: ['id', 'name', 'email', 'avatar']
          }]
        }]
      });
      classrooms = enrollments.map(e => e.classroom);
    }

    res.json({
      success: true,
      classrooms,
      count: classrooms.length
    });
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching classrooms'
    });
  }
});

// Get classroom by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const classroom = await Classroom.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: ClassroomStudent,
          as: 'students',
          include: [{
            model: User,
            as: 'student',
            attributes: ['id', 'name', 'email', 'avatar', 'studentId', 'major']
          }]
        },
        {
          model: TodoAssignment,
          as: 'assignments',
          order: [['created_at', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check if user has access to this classroom
    const hasAccess = req.user.role === 'admin' && classroom.createdBy === req.user.id ||
                     await ClassroomStudent.findOne({
                       where: { classroomId: classroom.id, studentId: req.user.id }
                     });

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this classroom'
      });
    }

    res.json({
      success: true,
      classroom
    });
  } catch (error) {
    console.error('Error fetching classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching classroom'
    });
  }
});

// Student: Join classroom by class code
router.post('/join', auth, async (req, res) => {
  try {
    const { classCode } = req.body;

    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can join classrooms'
      });
    }

    const classroom = await Classroom.findOne({
      where: { classCode, isActive: true }
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Invalid class code or classroom not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await ClassroomStudent.findOne({
      where: { classroomId: classroom.id, studentId: req.user.id }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this classroom'
      });
    }

    // Check if classroom is full
    const currentStudents = await ClassroomStudent.count({
      where: { classroomId: classroom.id, status: 'active' }
    });

    if (currentStudents >= classroom.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'Classroom is full'
      });
    }

    // Enroll student
    const enrollment = await ClassroomStudent.create({
      classroomId: classroom.id,
      studentId: req.user.id,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      enrollment,
      classroom: {
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject
      },
      message: 'Successfully joined classroom'
    });
  } catch (error) {
    console.error('Error joining classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining classroom'
    });
  }
});

module.exports = router;
