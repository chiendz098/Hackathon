const express = require('express');
const router = express.Router();
const { Classroom, ClassroomStudent, Assignment, Todo, User } = require('../models');

// Get all classrooms for a teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const classrooms = await Classroom.findAll({
      where: { teacherId, isActive: true },
      include: [
        {
          model: ClassroomStudent,
          as: 'students',
          include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(classrooms);
  } catch (error) {
    console.error('Error fetching teacher classrooms:', error);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

// Get all classrooms for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const classrooms = await ClassroomStudent.findAll({
      where: { studentId, status: 'active' },
      include: [
        {
          model: Classroom,
          as: 'classroom',
          include: [{ model: User, as: 'teacher', attributes: ['id', 'name', 'email'] }]
        }
      ],
      order: [['enrolledAt', 'DESC']]
    });
    res.json(classrooms);
  } catch (error) {
    console.error('Error fetching student classrooms:', error);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

// Create new classroom
router.post('/', async (req, res) => {
  try {
    const { name, description, subject, semester, year, teacherId, maxStudents, schedule } = req.body;
    
    // Generate unique class code
    const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const classroom = await Classroom.create({
      name,
      description,
      subject,
      semester,
      year,
      teacherId,
      classCode,
      maxStudents,
      schedule
    });
    
    res.status(201).json(classroom);
  } catch (error) {
    console.error('Error creating classroom:', error);
    res.status(500).json({ error: 'Failed to create classroom' });
  }
});

// Join classroom by code
router.post('/join', async (req, res) => {
  try {
    const { classCode, studentId } = req.body;
    
    const classroom = await Classroom.findOne({ where: { classCode, isActive: true } });
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    
    // Check if student already enrolled
    const existingEnrollment = await ClassroomStudent.findOne({
      where: { classroomId: classroom.id, studentId }
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this classroom' });
    }
    
    // Check classroom capacity
    const currentStudents = await ClassroomStudent.count({
      where: { classroomId: classroom.id, status: 'active' }
    });
    
    if (currentStudents >= classroom.maxStudents) {
      return res.status(400).json({ error: 'Classroom is full' });
    }
    
    const enrollment = await ClassroomStudent.create({
      classroomId: classroom.id,
      studentId
    });
    
    res.status(201).json({ message: 'Successfully joined classroom', enrollment });
  } catch (error) {
    console.error('Error joining classroom:', error);
    res.status(500).json({ error: 'Failed to join classroom' });
  }
});

// Get classroom details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const classroom = await Classroom.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ClassroomStudent,
          as: 'students',
          include: [{ model: User, as: 'student', attributes: ['id', 'name', 'email'] }]
        },
        {
          model: Assignment,
          as: 'assignments',
          order: [['dueDate', 'ASC']]
        }
      ]
    });
    
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    
    res.json(classroom);
  } catch (error) {
    console.error('Error fetching classroom:', error);
    res.status(500).json({ error: 'Failed to fetch classroom' });
  }
});

// Create assignment
router.post('/:id/assignments', async (req, res) => {
  try {
    const { id: classroomId } = req.params;
    const { title, description, instructions, type, priority, dueDate, maxPoints, autoCreateTodo, attachments, rubric, createdBy } = req.body;
    
    const assignment = await Assignment.create({
      classroomId,
      title,
      description,
      instructions,
      type,
      priority,
      dueDate,
      maxPoints,
      autoCreateTodo,
      attachments,
      rubric,
      createdBy
    });
    
    // Auto-create todos for all students if enabled
    if (autoCreateTodo) {
      const students = await ClassroomStudent.findAll({
        where: { classroomId, status: 'active' }
      });
      
      const todoPromises = students.map(student => 
        Todo.create({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${title}`,
          description: description || instructions,
          priority: priority,
          dueDate: dueDate,
          userId: student.studentId,
          category: 'assignment',
          metadata: {
            assignmentId: assignment.id,
            classroomId: classroomId,
            type: type
          }
        })
      );
      
      await Promise.all(todoPromises);
    }
    
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Get assignments for classroom
router.get('/:id/assignments', async (req, res) => {
  try {
    const { id: classroomId } = req.params;
    const assignments = await Assignment.findAll({
      where: { classroomId, isActive: true },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['dueDate', 'ASC']]
    });
    
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Update classroom
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const [updatedRows] = await Classroom.update(updates, {
      where: { id }
    });
    
    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    
    const updatedClassroom = await Classroom.findByPk(id);
    res.json(updatedClassroom);
  } catch (error) {
    console.error('Error updating classroom:', error);
    res.status(500).json({ error: 'Failed to update classroom' });
  }
});

// Delete classroom
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete by setting isActive to false
    const [updatedRows] = await Classroom.update(
      { isActive: false },
      { where: { id } }
    );
    
    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    
    res.json({ message: 'Classroom deleted successfully' });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    res.status(500).json({ error: 'Failed to delete classroom' });
  }
});

module.exports = router;
