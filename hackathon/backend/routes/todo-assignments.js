const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const { 
  TodoAssignment, TodoSubmission, Classroom, ClassroomStudent, User 
} = require('../models');
const { Op } = require('sequelize');

// Admin: Create new assignment for classroom
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      instructions,
      category,
      subject,
      priority,
      dueDate,
      classroomId,
      maxScore,
      attachments,
      requirements,
      allowLateSubmission,
      lateSubmissionPenalty
    } = req.body;

    // Verify classroom belongs to admin
    const classroom = await Classroom.findOne({
      where: { id: classroomId, createdBy: req.user.id }
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found or access denied'
      });
    }

    const assignment = await TodoAssignment.create({
      title,
      description,
      instructions,
      category: category || 'assignment',
      subject,
      priority: priority || 'medium',
      dueDate: new Date(dueDate),
      assignedBy: req.user.id,
      classroomId,
      maxScore: maxScore || 100,
      attachments: attachments || [],
      requirements: requirements || {
        fileTypes: [],
        maxFileSize: 10,
        minWords: 0,
        maxWords: 0
      },
      allowLateSubmission: allowLateSubmission || false,
      lateSubmissionPenalty: lateSubmissionPenalty || 10
    });

    // Get assignment with classroom info
    const assignmentWithDetails = await TodoAssignment.findByPk(assignment.id, {
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Classroom,
          as: 'classroom',
          attributes: ['id', 'name', 'subject']
        }
      ]
    });

    res.status(201).json({
      success: true,
      assignment: assignmentWithDetails,
      message: 'Assignment created successfully'
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating assignment'
    });
  }
});

// Get assignments for user (admin sees all their assignments, students see their classroom assignments)
router.get('/', auth, async (req, res) => {
  try {
    let assignments;

    if (req.user.role === 'admin') {
      // Admin sees all assignments they created
      assignments = await TodoAssignment.findAll({
        where: { assignedBy: req.user.id },
        include: [
          {
            model: Classroom,
            as: 'classroom',
            attributes: ['id', 'name', 'subject']
          },
          {
            model: TodoSubmission,
            as: 'submissions',
            include: [{
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'studentId']
            }]
          }
        ],
        order: [['created_at', 'DESC']]
      });
    } else {
      // Students see assignments from their classrooms
      const enrollments = await ClassroomStudent.findAll({
        where: { studentId: req.user.id, status: 'active' },
        attributes: ['classroomId']
      });

      const classroomIds = enrollments.map(e => e.classroomId);

      assignments = await TodoAssignment.findAll({
        where: { 
          classroomId: { [Op.in]: classroomIds },
          isActive: true
        },
        include: [
          {
            model: Classroom,
            as: 'classroom',
            attributes: ['id', 'name', 'subject']
          },
          {
            model: User,
            as: 'admin',
            attributes: ['id', 'name']
          },
          {
            model: TodoSubmission,
            as: 'submissions',
            where: { studentId: req.user.id },
            required: false
          }
        ],
        order: [['dueDate', 'ASC']]
      });
    }

    res.json({
      success: true,
      assignments,
      count: assignments.length
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments'
    });
  }
});

// Get assignment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await TodoAssignment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Classroom,
          as: 'classroom',
          attributes: ['id', 'name', 'subject']
        },
        {
          model: TodoSubmission,
          as: 'submissions',
          include: [{
            model: User,
            as: 'student',
            attributes: ['id', 'name', 'studentId', 'avatar']
          }]
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check access permissions
    let hasAccess = false;
    
    if (req.user.role === 'admin' && assignment.assignedBy === req.user.id) {
      hasAccess = true;
    } else if (req.user.role === 'student') {
      const enrollment = await ClassroomStudent.findOne({
        where: { 
          classroomId: assignment.classroomId, 
          studentId: req.user.id,
          status: 'active'
        }
      });
      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this assignment'
      });
    }

    // For students, include their submission if exists
    if (req.user.role === 'student') {
      const userSubmission = assignment.submissions.find(
        s => s.studentId === req.user.id
      );
      assignment.dataValues.userSubmission = userSubmission || null;
    }

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment'
    });
  }
});

// Student: Submit assignment
router.post('/:id/submit', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can submit assignments'
      });
    }

    const { content, attachments } = req.body;

    const assignment = await TodoAssignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if student is enrolled in the classroom
    const enrollment = await ClassroomStudent.findOne({
      where: { 
        classroomId: assignment.classroomId, 
        studentId: req.user.id,
        status: 'active'
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this classroom'
      });
    }

    // Check if assignment is still active and not past due (unless late submission allowed)
    const now = new Date();
    const isLate = now > assignment.dueDate;
    
    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Assignment deadline has passed and late submissions are not allowed'
      });
    }

    // Check for existing submission
    const existingSubmission = await TodoSubmission.findOne({
      where: { assignmentId: assignment.id, studentId: req.user.id }
    });

    let submission;
    if (existingSubmission) {
      // Update existing submission
      submission = await existingSubmission.update({
        content,
        attachments: attachments || [],
        submittedAt: now,
        isLate,
        status: 'resubmitted',
        attemptNumber: existingSubmission.attemptNumber + 1
      });
    } else {
      // Create new submission
      submission = await TodoSubmission.create({
        assignmentId: assignment.id,
        studentId: req.user.id,
        content,
        attachments: attachments || [],
        submittedAt: now,
        isLate,
        status: 'submitted',
        attemptNumber: 1
      });
    }

    res.status(201).json({
      success: true,
      submission,
      message: existingSubmission ? 'Assignment resubmitted successfully' : 'Assignment submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting assignment'
    });
  }
});

module.exports = router;
