const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { auth } = require('../middleware/auth');
const config = require('../config/config.json');

const pool = new Pool({
  host: config.development.host,
  port: config.development.port,
  database: config.development.database,
  user: config.development.username,
  password: config.development.password,
  ssl: { rejectUnauthorized: false }
});

// ===== GROUP MANAGEMENT =====

// Get all groups for current user
router.get('/groups', auth, async (req, res) => {
  try {
    const query = `
      SELECT g.*, gm.role as user_role, gm.permissions
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1 AND gm.is_active = true
      ORDER BY g.created_at DESC
    `;
    
    const result = await pool.query(query, [req.user.id]);
    
    res.json({
      success: true,
      groups: result.rows
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching groups'
    });
  }
});

// Create new group
router.post('/groups', auth, async (req, res) => {
  try {
    const { name, description, category, isPrivate, maxMembers, rules, settings } = req.body;
    
    // Create group
    const groupQuery = `
      INSERT INTO groups (name, description, category, is_private, max_members, rules, settings, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;
    
    const groupResult = await pool.query(groupQuery, [
      name, description, category, isPrivate || false, maxMembers || 50,
      rules || {}, settings || {}, req.user.id
    ]);
    
    const group = groupResult.rows[0];
    
    // Add creator as admin member
    const memberQuery = `
      INSERT INTO group_members (group_id, user_id, role, permissions, joined_at, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), true, NOW(), NOW())
    `;
    
    await pool.query(memberQuery, [
      group.id, req.user.id, 'admin', 
      JSON.stringify({ canCreate: true, canEdit: true, canDelete: true, canInvite: true, canAssign: true })
    ]);
    
    res.json({
      success: true,
      group,
      message: 'Group created successfully'
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating group'
    });
  }
});

// ===== GROUP INVITATIONS =====

// Send group invitation
router.post('/groups/:groupId/invite', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { emails, role = 'member', message = '', permissions = {} } = req.body;
    
    // Check if user can invite to this group
    const permissionQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const permissionResult = await pool.query(permissionQuery, [groupId, req.user.id]);
    if (permissionResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    const member = permissionResult.rows[0];
    if (member.role !== 'admin' && !member.permissions?.canInvite) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to invite members'
      });
    }
    
    // Get group info
    const groupQuery = 'SELECT name, description FROM groups WHERE id = $1';
    const groupResult = await pool.query(groupQuery, [groupId]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    const group = groupResult.rows[0];
    
    // Process each email
    const invitations = [];
    for (const email of emails) {
      // Find user by email
      const userQuery = 'SELECT id, name FROM users WHERE email = $1';
      const userResult = await pool.query(userQuery, [email]);
      
      if (userResult.rows.length === 0) {
        continue; // Skip if user doesn't exist
      }
      
      const user = userResult.rows[0];
      
      // Check if user is already a member
      const existingMemberQuery = `
        SELECT id FROM group_members 
        WHERE group_id = $1 AND user_id = $2 AND is_active = true
      `;
      
      const existingMemberResult = await pool.query(existingMemberQuery, [groupId, user.id]);
      if (existingMemberResult.rows.length > 0) {
        continue; // Skip if already a member
      }
      
      // Check if invitation already exists
      const existingInvitationQuery = `
        SELECT id FROM group_invitations 
        WHERE group_id = $1 AND invited_user_id = $2 AND status = 'pending'
      `;
      
      const existingInvitationResult = await pool.query(existingInvitationQuery, [groupId, user.id]);
      if (existingInvitationResult.rows.length > 0) {
        continue; // Skip if invitation already exists
      }
      
      // Create invitation
      const invitationQuery = `
        INSERT INTO group_invitations (
          group_id, invited_user_id, invited_by, role, message, permissions, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
        RETURNING *
      `;
      
      const invitationResult = await pool.query(invitationQuery, [
        groupId, user.id, req.user.id, role, message, JSON.stringify(permissions)
      ]);
      
      const invitation = invitationResult.rows[0];
      
      // Create notification
      const notificationQuery = `
        INSERT INTO notifications (
          user_id, type, title, message, data, sender_id, is_read, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW())
      `;
      
      await pool.query(notificationQuery, [
        user.id, 'group_invitation', 
        `You have been invited to join ${group.name}`,
        `${req.user.name || 'Someone'} has invited you to join ${group.name}. Click to accept or decline.`,
        JSON.stringify({
          groupId,
          groupName: group.name,
          inviterId: req.user.id,
          inviterName: req.user.name,
          invitationId: invitation.id,
          role,
          message
        }),
        req.user.id
      ]);
      
      invitations.push({
        email,
        userId: user.id,
        userName: user.name,
        invitationId: invitation.id
      });
    }
    
    res.json({
      success: true,
      invitations,
      message: `${invitations.length} invitations sent successfully`
    });
    
  } catch (error) {
    console.error('Error sending invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invitations'
    });
  }
});

// Get pending invitations for current user
router.get('/invitations/pending', auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        gi.id, gi.role, gi.message, gi.permissions, gi.created_at,
        g.id as group_id, g.name as group_name, g.description as group_description,
        u.id as inviter_id, u.name as inviter_name, u.avatar as inviter_avatar
      FROM group_invitations gi
      INNER JOIN groups g ON gi.group_id = g.id
      INNER JOIN users u ON gi.invited_by = u.id
      WHERE gi.invited_user_id = $1 AND gi.status = 'pending'
      ORDER BY gi.created_at DESC
    `;
    
    const result = await pool.query(query, [req.user.id]);
    
    res.json({
      success: true,
      invitations: result.rows
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitations'
    });
  }
});

// Respond to invitation (accept/decline)
router.post('/invitations/:invitationId/respond', auth, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { response } = req.body; // 'accept' or 'decline'
    
    if (!['accept', 'decline'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid response. Must be "accept" or "decline"'
      });
    }
    
    // Get invitation details
    const invitationQuery = `
      SELECT gi.*, g.name as group_name, g.description as group_description
      FROM group_invitations gi
      INNER JOIN groups g ON gi.group_id = g.id
      WHERE gi.id = $1 AND gi.invited_user_id = $2 AND gi.status = 'pending'
    `;
    
    const invitationResult = await pool.query(invitationQuery, [invitationId, req.user.id]);
    if (invitationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or already processed'
      });
    }
    
    const invitation = invitationResult.rows[0];
    
    // Update invitation status
    const updateInvitationQuery = `
      UPDATE group_invitations 
      SET status = $1, responded_at = NOW(), updated_at = NOW()
      WHERE id = $2
    `;
    
    await pool.query(updateInvitationQuery, [response, invitationId]);
    
    if (response === 'accept') {
      // Add user to group
      const addMemberQuery = `
        INSERT INTO group_members (
          group_id, user_id, role, permissions, joined_at, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), true, NOW(), NOW())
      `;
      
      await pool.query(addMemberQuery, [
        invitation.group_id, req.user.id, invitation.role, invitation.permissions
      ]);
      
      // Create success notification
      const notificationQuery = `
        INSERT INTO notifications (
          user_id, type, title, message, data, is_read, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())
      `;
      
      await pool.query(notificationQuery, [
        req.user.id, 'group_joined', 
        `Welcome to ${invitation.group_name}!`,
        `You have successfully joined ${invitation.group_name}. You can now view and participate in group activities.`,
        JSON.stringify({
          groupId: invitation.group_id,
          groupName: invitation.group_name
        })
      ]);
    }
    
    res.json({
      success: true,
      message: `Invitation ${response}ed successfully`,
      groupId: invitation.group_id,
      groupName: invitation.group_name
    });
    
  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to invitation'
    });
  }
});

// ===== GROUP TODOS =====

// Get all todos for a specific group
router.get('/groups/:groupId/todos', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check if user is member of the group OR has accepted invitation
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [groupId, req.user.id]);
    let member = null;
    
    if (memberResult.rows.length > 0) {
      member = memberResult.rows[0];
    } else {
      // Check if user has accepted invitation
      const acceptedInvitationQuery = `
        SELECT role, permissions FROM group_invitations 
        WHERE group_id = $1 AND invited_user_id = $2 AND status = 'accepted'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const acceptedInvitationResult = await pool.query(acceptedInvitationQuery, [groupId, req.user.id]);
      
      if (acceptedInvitationResult.rows.length > 0) {
        member = acceptedInvitationResult.rows[0];
      } else {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group and have no accepted invitation'
        });
      }
    }
    
    // Get todos with assignments
    const todosQuery = `
      SELECT 
        gt.*,
        u.name as creator_name, u.avatar as creator_avatar,
        gta.user_id as assigned_user_id,
        gta.role as assignment_role,
        gta.status as assignment_status
      FROM group_todos gt
      LEFT JOIN users u ON gt.created_by = u.id
      LEFT JOIN group_todo_assignments gta ON gt.id = gta.todo_id
      WHERE gt.group_id = $1
      ORDER BY gt.created_at DESC
    `;
    
    const todosResult = await pool.query(todosQuery, [groupId]);
    
    // Group todos by ID and organize assignments
    const todosMap = new Map();
    todosResult.rows.forEach(row => {
      if (!todosMap.has(row.id)) {
        todosMap.set(row.id, {
          id: row.id,
          title: row.title,
          description: row.description,
          status: row.status,
          priority: row.priority,
          category: row.category,
          deadline: row.deadline,
          estimated_time: row.estimated_time,
          actual_time: row.actual_time,
          progress: row.progress,
          subtasks: row.subtasks,
          tags: row.tags,
          settings: row.settings,
          is_public: row.is_public,
          created_at: row.created_at,
          updated_at: row.updated_at,
          creator: {
            id: row.created_by,
            name: row.creator_name,
            avatar: row.creator_avatar
          },
          assignments: []
        });
      }
      
      if (row.assigned_user_id) {
        todosMap.get(row.id).assignments.push({
          userId: row.assigned_user_id,
          role: row.assignment_role,
          status: row.assignment_status
        });
      }
    });
    
    const todos = Array.from(todosMap.values());
    
    res.json({
      success: true,
      todos,
      memberRole: member.role,
      permissions: member.permissions
    });
    
  } catch (error) {
    console.error('Error fetching group todos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group todos'
    });
  }
});

// Create new group todo
router.post('/groups/:groupId/todos', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const {
      title, description, category, priority, deadline, estimatedTime,
      subtasks, tags, assignedTo, isPublic, allowComments, allowAttachments
    } = req.body;
    
    // Check if user can create todos in this group (member or accepted invitation)
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [groupId, req.user.id]);
    let member = null;
    let canCreate = false;
    
    if (memberResult.rows.length > 0) {
      member = memberResult.rows[0];
      canCreate = member.role === 'admin' || member.permissions?.canCreate || false;
    } else {
      // Check if user has accepted invitation
      const acceptedInvitationQuery = `
        SELECT role, permissions FROM group_invitations 
        WHERE group_id = $1 AND invited_user_id = $2 AND status = 'accepted'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const acceptedInvitationResult = await pool.query(acceptedInvitationQuery, [groupId, req.user.id]);
      
      if (acceptedInvitationResult.rows.length > 0) {
        member = acceptedInvitationResult.rows[0];
        canCreate = member.role === 'admin' || member.permissions?.canCreate || false;
      } else {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group and have no accepted invitation'
        });
      }
    }
    
    if (!canCreate) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create todos in this group'
      });
    }
    
    // Create the group todo
    const todoQuery = `
      INSERT INTO group_todos (
        title, description, group_id, created_by, status, priority, category,
        deadline, estimated_time, subtasks, tags, is_public, allow_comments,
        allow_attachments, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      RETURNING *
    `;
    
    const todoResult = await pool.query(todoQuery, [
      title, description, groupId, req.user.id, 'pending', priority || 'medium',
      category || 'general', deadline, estimatedTime, subtasks || [], tags || [],
      isPublic !== false, allowComments !== false, allowAttachments !== false
    ]);
    
    const todo = todoResult.rows[0];
    
    // Create assignments for assigned members
    if (assignedTo && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        const assignmentQuery = `
          INSERT INTO group_todo_assignments (
            todo_id, user_id, assigned_by, role, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `;
        
        await pool.query(assignmentQuery, [
          todo.id, userId, req.user.id, 'member', 'assigned'
        ]);
        
        // Create notification for assigned user
        const notificationQuery = `
          INSERT INTO notifications (
            user_id, type, title, message, data, sender_id, is_read, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW())
        `;
        
        await pool.query(notificationQuery, [
          userId, 'group_todo_assigned',
          `New task assigned in group`,
          `You have been assigned a new task: ${title}`,
          JSON.stringify({
            groupId,
            todoId: todo.id,
            todoTitle: title,
            assignedBy: req.user.id
          }),
          req.user.id
        ]);
      }
    }
    
    // Create activity log
    const activityQuery = `
      INSERT INTO group_todo_activities (
        todo_id, user_id, action, details, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
    `;
    
    await pool.query(activityQuery, [
      todo.id, req.user.id, 'created',
      JSON.stringify({ title, description, category, priority })
    ]);
    
    res.json({
      success: true,
      todo,
      message: 'Group todo created successfully'
    });
    
  } catch (error) {
    console.error('Error creating group todo:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating group todo'
    });
  }
});

// ===== NOTIFICATIONS =====

// Get notifications for current user
router.get('/notifications', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE user_id = $1';
    let params = [req.user.id];
    
    if (unreadOnly === 'true') {
      whereClause += ' AND is_read = false';
    }
    
    const query = `
      SELECT * FROM notifications 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM notifications ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      notifications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const query = `
      UPDATE notifications 
      SET is_read = true, read_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [notificationId, req.user.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    const query = `
      UPDATE notifications 
      SET is_read = true, read_at = NOW(), updated_at = NOW()
      WHERE user_id = $1 AND is_read = false
    `;
    
    await pool.query(query, [req.user.id]);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read'
    });
  }
});

module.exports = router; 