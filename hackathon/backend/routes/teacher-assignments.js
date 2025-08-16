const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { Pool } = require('pg');
const config = require('../config/config.json');

const pool = new Pool({
  host: config.development.host,
  port: config.development.port,
  database: config.development.database,
  user: config.development.username,
  password: config.development.password,
  ssl: { rejectUnauthorized: false }
});

// Get all assignments for teachers
router.get('/', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teachers only.'
      });
    }
    
    const assignmentsQuery = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.priority,
        a.status,
        a.created_at,
        a.updated_at,
        c.name as classroom_name,
        c.id as classroom_id,
        u.username as created_by_name,
        COUNT(ta.id) as total_assignments,
        COUNT(CASE WHEN ta.status = 'done' THEN 1 END) as completed_assignments,
        COUNT(CASE WHEN ta.status = 'pending' THEN 1 END) as pending_assignments,
        COUNT(CASE WHEN ta.status = 'overdue' THEN 1 END) as overdue_assignments
      FROM assignments a
      LEFT JOIN classrooms c ON a.classroom_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN todo_assignments ta ON a.id = ta.assignment_id
      WHERE a.created_by = $1
      GROUP BY a.id, a.title, a.description, a.due_date, a.priority, a.status, a.created_at, a.updated_at, c.name, c.id, u.username
      ORDER BY a.created_at DESC
    `;
    
    const result = await client.query(assignmentsQuery, [req.user.id]);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Create new assignment
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teachers only.'
      });
    }
    
    const { title, description, dueDate, priority, classroomId, assignedStudents } = req.body;
    
    if (!title || !description || !classroomId) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and classroom are required'
      });
    }
    
    // Start transaction
    await client.query('BEGIN');
    
    // Create assignment
    const createAssignmentQuery = `
      INSERT INTO assignments (title, description, due_date, priority, status, classroom_id, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;
    
    const assignmentResult = await client.query(createAssignmentQuery, [
      title,
      description,
      dueDate,
      priority || 'medium',
      'active',
      classroomId,
      req.user.id
    ]);
    
    const newAssignment = assignmentResult.rows[0];
    
    // Create todo for each assigned student
    if (assignedStudents && assignedStudents.length > 0) {
      for (const studentId of assignedStudents) {
        // Create todo
        const createTodoQuery = `
          INSERT INTO todos (title, description, "userId", "todoType", "classroomId", priority, status, due_date, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING id
        `;
        
        const todoResult = await client.query(createTodoQuery, [
          title,
          description,
          studentId,
          'assignment',
          classroomId,
          priority || 'medium',
          'pending',
          dueDate
        ]);
        
        const todoId = todoResult.rows[0].id;
        
        // Create todo assignment
        await client.query(`
          INSERT INTO todo_assignments (todo_id, assigned_to, assigned_by, status, role, assignment_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [todoId, studentId, req.user.id, 'pending', 'student', newAssignment.id]);
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: {
        assignment: newAssignment
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assignment',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Update assignment
router.put('/:id', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teachers only.'
      });
    }
    
    const { id } = req.params;
    const { title, description, dueDate, priority, status } = req.body;
    
    // Check if assignment exists and belongs to user
    const checkQuery = `
      SELECT id, created_by FROM assignments WHERE id = $1
    `;
    
    const checkResult = await client.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    if (checkResult.rows[0].created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own assignments.'
      });
    }
    
    // Update assignment
    const updateQuery = `
      UPDATE assignments 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          due_date = COALESCE($3, due_date),
          priority = COALESCE($4, priority),
          status = COALESCE($5, status),
          updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [
      title, description, dueDate, priority, status, id
    ]);
    
    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Delete assignment
router.delete('/:id', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Check if user is a teacher
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teachers only.'
      });
    }
    
    const { id } = req.params;
    
    // Check if assignment exists and belongs to user
    const checkQuery = `
      SELECT id, created_by FROM assignments WHERE id = $1
    `;
    
    const checkResult = await client.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    if (checkResult.rows[0].created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own assignments.'
      });
    }
    
    // Start transaction
    await client.query('BEGIN');
    
    // Delete related todo assignments
    await client.query(`
      DELETE FROM todo_assignments WHERE assignment_id = $1
    `, [id]);
    
    // Delete related todos
    await client.query(`
      DELETE FROM todos WHERE "todoType" = 'assignment' AND "classroomId" IN (
        SELECT classroom_id FROM assignments WHERE id = $1
      )
    `, [id]);
    
    // Delete assignment
    await client.query(`
      DELETE FROM assignments WHERE id = $1
    `, [id]);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assignment',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get assignment details with submissions
router.get('/:id', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    // Get assignment details
    const assignmentQuery = `
      SELECT 
        a.*,
        c.name as classroom_name,
        u.username as created_by_name
      FROM assignments a
      LEFT JOIN classrooms c ON a.classroom_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = $1
    `;
    
    const assignmentResult = await client.query(assignmentQuery, [id]);
    
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    const assignment = assignmentResult.rows[0];
    
    // Get student submissions
    const submissionsQuery = `
      SELECT 
        ta.id,
        ta.todo_id,
        ta.assigned_to,
        ta.status,
        ta.submitted_at,
        ta.grade,
        ta.feedback,
        u.username as student_name,
        u.avatar as student_avatar,
        t.title as todo_title,
        t.description as todo_description
      FROM todo_assignments ta
      INNER JOIN users u ON ta.assigned_to = u.id
      INNER JOIN todos t ON ta.todo_id = t.id
      WHERE ta.assignment_id = $1
      ORDER BY ta.submitted_at DESC
    `;
    
    const submissionsResult = await client.query(submissionsQuery, [id]);
    
    res.json({
      success: true,
      data: {
        assignment: assignment,
        submissions: submissionsResult.rows
      }
    });
    
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment details',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router; 