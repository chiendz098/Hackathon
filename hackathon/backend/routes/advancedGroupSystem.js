const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { auth } = require('../middleware/auth');
const config = require('../config.js');
const { groupCreationLimiter } = require('../middleware/rateLimiter');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  connectionString: config.DB_URI,
  ssl: { rejectUnauthorized: false }
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/group-todos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// ===== ADVANCED GROUP MANAGEMENT =====

// Get all groups with advanced filtering and search
router.get('/groups', auth, async (req, res) => {
  try {
    const { 
      search, category, status, sortBy = 'createdAt', sortOrder = 'DESC',
      page = 1, limit = 20, includeStats = false 
    } = req.query;
    
    // Validate and sanitize sortBy parameter
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'category'];
    const sanitizedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sanitizedSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    let whereClause = 'WHERE gm.user_id = $1 AND gm.is_active = true';
    let params = [req.user.id];
    let paramCount = 1;
    
    if (search) {
      paramCount++;
      whereClause += ` AND (g.name ILIKE $${paramCount} OR g.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    if (category) {
      paramCount++;
      whereClause += ` AND g.category = $${paramCount}`;
      params.push(category);
    }
    
    if (status) {
      paramCount++;
      whereClause += ` AND g.status = $${paramCount}`;
      params.push(status);
    }
    
    const offset = (page - 1) * limit;
    
    // Main query with advanced joins
    const query = `
      SELECT 
        g.*,
        gm.role as user_role, 
        gm.joined_at,
        COUNT(DISTINCT gm2.user_id) as member_count,
        COUNT(DISTINCT gt.id) as todo_count,
        COUNT(DISTINCT CASE WHEN gt.status = 'completed' THEN gt.id END) as completed_todo_count,
        MAX(gt.updated_at) as last_activity
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN group_members gm2 ON g.id = gm2.group_id AND gm2.is_active = true
      LEFT JOIN todos gt ON g.id = gt.group_id
      ${whereClause}
      GROUP BY g.id, gm.role, gm.joined_at
      ORDER BY g."${sanitizedSortBy}" ${sanitizedSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT g.id)
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);
    
    // Get additional stats if requested
    let stats = null;
    if (includeStats === 'true') {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_groups,
          COUNT(CASE WHEN sub.category = 'study' THEN 1 END) as study_groups,
          COUNT(CASE WHEN sub.category = 'project' THEN 1 END) as project_groups,
          COUNT(CASE WHEN sub.category = 'work' THEN 1 END) as work_groups,
          AVG(member_count) as avg_members_per_group
        FROM (
          SELECT g.id, g.category, COUNT(gm.user_id) as member_count
          FROM groups g
          INNER JOIN group_members gm ON g.id = gm.group_id AND gm.is_active = true
          INNER JOIN group_members gm2 ON g.id = gm2.group_id AND gm2.user_id = $1 AND gm2.is_active = true
          GROUP BY g.id, g.category
        ) sub
      `;
      
      const statsResult = await pool.query(statsQuery, [req.user.id]);
      stats = statsResult.rows[0];
    }
    
    res.json({
      success: true,
      groups: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    });
    
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching groups'
    });
  }
});

// Create new group with advanced settings
router.post('/groups', auth, groupCreationLimiter, async (req, res) => {
  try {
    const { 
      name, description, category, isPrivate, maxMembers, rules, settings,
      tags, inviteCode, allowMemberInvites, requireApproval, defaultPermissions
    } = req.body;
    
    // Validate input
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }
    
    // Check if user can create groups (rate limiting, etc.)
    const userGroupCount = await pool.query(
      'SELECT COUNT(*) FROM groups g INNER JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = $1 AND gm.role = $2',
      [req.user.id, 'admin']
    );
    
    if (parseInt(userGroupCount.rows[0].count) >= 10) {
      return res.status(429).json({
        success: false,
        message: 'You have reached the maximum number of groups you can create'
      });
    }
    
    // Create group with transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create group
      const groupQuery = `
        INSERT INTO groups (
          name, description, category, is_private, max_members, rules, settings,
          tags, invite_code, allow_member_invites, require_approval, created_by, 
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `;
      
      const groupResult = await client.query(groupQuery, [
        name, description, category, isPrivate || false, maxMembers ? parseInt(maxMembers) : 50,
        rules || {}, settings || {}, tags || [], inviteCode || generateInviteCode(),
        allowMemberInvites || false, requireApproval || false, req.user.id
      ]);
      
      const group = groupResult.rows[0];
      
      // Add creator as admin member with full permissions
      const memberQuery = `
        INSERT INTO group_members (
          group_id, user_id, role
        ) VALUES ($1, $2, $3)
      `;
      
      await client.query(memberQuery, [
        group.id, req.user.id, 'admin'
      ]);
      
      // Create default kanban columns
      const kanbanQuery = `
        INSERT INTO group_todo_kanban (group_id, column_name, column_order, column_color, wip_limit) VALUES
        ($1, 'Backlog', 1, '#6B7280', NULL),
        ($1, 'To Do', 2, '#3B82F6', NULL),
        ($1, 'In Progress', 3, '#F59E0B', 3),
        ($1, 'Review', 4, '#8B5CF6', 2),
        ($1, 'Done', 5, '#10B981', NULL)
      `;
      
      await client.query(kanbanQuery, [group.id]);
      
      // Create default notification templates for this group
      const notificationTemplates = [
        {
          type: 'todo_assigned',
          title: 'New task assigned in {{group_name}}',
          message: 'You have been assigned: {{todo_title}}',
          icon: 'check-square',
          color: 'blue'
        },
        {
          type: 'todo_updated',
          title: 'Task updated in {{group_name}}',
          message: '{{todo_title}} has been updated by {{updater_name}}',
          icon: 'edit',
          color: 'orange'
        },
        {
          type: 'deadline_approaching',
          title: 'Deadline approaching in {{group_name}}',
          message: '{{todo_title}} is due in {{time_remaining}}',
          icon: 'clock',
          color: 'red'
        }
      ];
      
      for (const template of notificationTemplates) {
        await client.query(`
          INSERT INTO notification_templates (type, title_template, message_template, icon, color, "groupId")
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (type) DO NOTHING
        `, [template.type, template.title, template.message, template.icon, template.color, group.id]);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        group,
        message: 'Group created successfully with all features enabled'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating group'
    });
  }
});

// Delete group (for testing purposes)
router.delete('/groups/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    console.log(`Delete group request: groupId=${groupId}, userId=${req.user.id}`);
    
    // Check if user has permission to delete this group
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    console.log(`Member query result:`, memberResult.rows);
    
    if (memberResult.rows.length === 0) {
      console.log(`User ${req.user.id} is not a member of group ${groupId}`);
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    const member = memberResult.rows[0];
    console.log(`User role in group:`, member.role);
    
    if (member.role !== 'admin' && member.role !== 'owner') {
      console.log(`User ${req.user.id} does not have admin/owner role in group ${groupId}`);
      return res.status(403).json({
        success: false,
        message: 'Only admins and owners can delete groups'
      });
    }
    
    // Check if group exists
    const groupQuery = 'SELECT id, name FROM groups WHERE id = $1';
    const groupResult = await pool.query(groupQuery, [parseInt(groupId)]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    const group = groupResult.rows[0];
    console.log(`Deleting group: ${group.name} (ID: ${group.id})`);
    
    // Delete group with transaction (cascade delete related data)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete related data in order (to avoid foreign key constraints)
      
      // 1. Delete group todo notifications (will be handled by CASCADE after fix)
      await client.query('DELETE FROM group_todo_notifications WHERE group_id = $1', [parseInt(groupId)]);
      
      // 2. Delete group todos
      await client.query('DELETE FROM todos WHERE "groupId" = $1', [parseInt(groupId)]);
      
      // 3. Delete group kanban columns
      await client.query('DELETE FROM group_todo_kanban WHERE group_id = $1', [parseInt(groupId)]);
      
      // 4. Delete group invitations
      await client.query('DELETE FROM group_invitations WHERE "groupId" = $1', [parseInt(groupId)]);
      
      // 5. Delete group members
      await client.query('DELETE FROM group_members WHERE group_id = $1', [parseInt(groupId)]);
      
      // 6. Delete notification templates
      await client.query('DELETE FROM notification_templates WHERE "groupId" = $1', [parseInt(groupId)]);
      
      // 7. Delete the group itself
      await client.query('DELETE FROM groups WHERE id = $1', [parseInt(groupId)]);
      
      await client.query('COMMIT');
      
      console.log(`Group ${group.name} deleted successfully`);
      
      res.json({
        success: true,
        message: `Group "${group.name}" deleted successfully`
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting group'
    });
  }
});

// Invite members to group
router.post('/groups/invite', auth, async (req, res) => {
  try {
    const { group_id, email, role = 'member', message } = req.body;
    
    // Validate input
    if (!group_id || !email) {
      return res.status(400).json({
        success: false,
        message: 'Group ID and email are required'
      });
    }
    
    // Check if user has permission to invite to this group
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(group_id), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    const member = memberResult.rows[0];
    if (member.role !== 'admin' && !member.permissions?.canInvite) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to invite members to this group'
      });
    }
    
    // Check if user already exists
    const userQuery = 'SELECT id, name, email FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User with this email not found'
      });
    }
    
    const targetUser = userResult.rows[0];
    
    // Check if user is already a member
    const existingMemberQuery = `
      SELECT id FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const existingMemberResult = await pool.query(existingMemberQuery, [parseInt(group_id), targetUser.id]);
    if (existingMemberResult.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'User is already a member of this group',
        alreadyMember: true,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email
        }
      });
    }
    
    // Allow multiple invitations but clean up expired ones
    const cleanupQuery = `
      UPDATE group_invitations 
      SET status = 'expired', "updatedAt" = NOW()
      WHERE "groupId" = $1 AND "invitedUserId" = $2 AND status = 'pending'
      AND ("expiresAt" IS NULL OR "expiresAt" <= NOW())
    `;
    
    await pool.query(cleanupQuery, [parseInt(group_id), targetUser.id]);
    
    // Create invitation
    const invitationQuery = `
      INSERT INTO group_invitations (
        "groupId", "invitedUserId", "invitedBy", role, message, status, 
        "expiresAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    const invitationResult = await pool.query(invitationQuery, [
      parseInt(group_id), targetUser.id, req.user.id, role, message || null,
      'pending', expiresAt
    ]);
    
    const invitation = invitationResult.rows[0];
    
    // Create notification for invited user
    try {
      const notificationQuery = `
        INSERT INTO notifications (
          "userId", type, title, message, data, priority, "deliveryMethod", 
          "relatedEntityType", "relatedEntityId", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `;
      
      await pool.query(notificationQuery, [
        targetUser.id, 'group_invitation',
        'Group Invitation',
        `You have been invited to join group: ${groupResult.rows[0]?.name || 'Unknown Group'}`,
        JSON.stringify({
          invitation_id: invitation.id,
          group_id: parseInt(group_id),
          inviter_id: req.user.id,
          role: role,
          group_name: groupResult.rows[0]?.name || 'Unknown Group'
        }),
        'normal', 
        JSON.stringify({ inApp: true, email: false, push: false, sms: false }), 
        'group', 
        parseInt(group_id)
      ]);
      
      console.log(`✅ Created notification for user ${targetUser.id} about invitation to group ${group_id}`);
      
      // Send real-time notification via WebSocket
      try {
        const groupTodoSocket = req.app.get('groupTodoSocket');
        if (groupTodoSocket) {
          groupTodoSocket.sendInvitationNotification(targetUser.id, {
            invitation_id: invitation.id,
            group_id: parseInt(group_id),
            group_name: groupResult.rows[0]?.name || 'Unknown Group',
            inviter_id: req.user.id,
            inviter_name: req.user.name,
            role: role,
            message: message,
            expires_at: invitation.expiresAt
          });
        }
      } catch (wsError) {
        console.error('Error sending WebSocket notification:', wsError);
      }
      
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the invitation if notification fails
    }
    
    res.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        group_id: invitation.groupId,
        invited_user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email
        },
        role: invitation.role,
        expires_at: invitation.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invitation'
    });
  }
});

// Cancel/Resend invitation
router.delete('/groups/:groupId/invitations/:invitationId', auth, async (req, res) => {
  try {
    const { groupId, invitationId } = req.params;
    
    // Check if user has permission to cancel this invitation
    const permissionQuery = `
      SELECT gi.id, gi."invitedBy", g.name as group_name
      FROM group_invitations gi
      JOIN groups g ON gi."groupId" = g.id
      WHERE gi.id = $1 AND gi."groupId" = $2
    `;
    
    const permissionResult = await pool.query(permissionQuery, [invitationId, parseInt(groupId)]);
    if (permissionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    const invitation = permissionResult.rows[0];
    
    // Check if user is the inviter or group admin
    const memberQuery = `
      SELECT role FROM group_members 
      WHERE "groupId" = $1 AND "userId" = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    const isAdmin = memberResult.rows.length > 0 && 
                   (memberResult.rows[0].role === 'admin' || memberResult.rows[0].role === 'owner');
    const isInviter = invitation.invitedBy === req.user.id;
    
    if (!isAdmin && !isInviter) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this invitation'
      });
    }
    
    // Cancel the invitation
    const cancelQuery = `
      UPDATE group_invitations 
      SET status = 'cancelled', "updatedAt" = NOW()
      WHERE id = $1
    `;
    
    await pool.query(cancelQuery, [invitationId]);
    
    res.json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling invitation'
    });
  }
});

// Search users by email for invitation
router.get('/users/search', auth, async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email || email.length < 2) {
      return res.json({
        success: true,
        users: []
      });
    }
    
    // Search users by email (case insensitive)
    const query = `
      SELECT id, name, email, avatar
      FROM users 
      WHERE email ILIKE $1 
      AND id != $2
      ORDER BY 
        CASE WHEN email = $1 THEN 1 
             WHEN email ILIKE $1 || '%' THEN 2 
             ELSE 3 END,
        name
      LIMIT 10
    `;
    
    const result = await pool.query(query, [`%${email}%`, req.user.id]);
    
    res.json({
      success: true,
      users: result.rows
    });
    
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
});

// ===== ADVANCED GROUP TODO MANAGEMENT =====

// Get todos with advanced filtering, search, and analytics
router.get('/groups/:groupId/todos', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { 
      status, priority, category, assignee, search, tags, 
      deadline_from, deadline_to, created_by, sort_by = 'created_at',
      sort_order = 'DESC', page = 1, limit = 20, view = 'list'
    } = req.query;
    
    // Validate and sanitize sort_by parameter for group_todos table
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'priority', 'status', 'deadline', 'created_by'];
    const sanitizedSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sanitizedSortOrder = ['ASC', 'DESC'].includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
    
    // Check if user is member of the group OR has accepted invitation
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      // Check if user has accepted invitation
      const acceptedInvitationQuery = `
        SELECT * FROM group_invitations 
        WHERE "groupId" = $1 AND "invitedUserId" = $2 AND status = 'accepted'
        ORDER BY "createdAt" DESC
        LIMIT 1
      `;
      
      const acceptedInvitationResult = await pool.query(acceptedInvitationQuery, [parseInt(groupId), req.user.id]);
      
      if (acceptedInvitationResult.rows.length === 0) {
        // Check if user has pending invitation
        const pendingInvitationQuery = `
          SELECT * FROM group_invitations 
          WHERE "groupId" = $1 AND "invitedUserId" = $2 AND status = 'pending'
          ORDER BY "createdAt" DESC
          LIMIT 1
        `;
        
        const pendingInvitationResult = await pool.query(pendingInvitationQuery, [parseInt(groupId), req.user.id]);
        
        if (pendingInvitationResult.rows.length > 0) {
          return res.status(403).json({
            success: false,
            message: 'You have a pending invitation for this group. Please accept or decline the invitation first.',
            hasPendingInvitation: true,
            invitationId: pendingInvitationResult.rows[0].id
          });
        } else {
          return res.status(403).json({
            success: false,
            message: 'You are not a member of this group and have no invitation'
          });
        }
      }
    }
    
    const member = memberResult.rows[0];
    
    // Build complex query with joins
    let whereClause = 'WHERE t.group_id = $1';
    let params = [parseInt(groupId)];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      whereClause += ` AND t.status = $${paramCount}`;
      params.push(status);
    }
    
    if (priority) {
      paramCount++;
      whereClause += ` AND t.priority = $${paramCount}`;
      params.push(priority);
    }
    
    if (category) {
      paramCount++;
      whereClause += ` AND t.category = $${paramCount}`;
      params.push(category);
    }
    
    if (assignee) {
      paramCount++;
      whereClause += ` AND EXISTS (
        SELECT 1 FROM group_todo_assignments gta 
        WHERE gta.todo_id = t.id AND gta.user_id = $${paramCount}
      )`;
      params.push(parseInt(assignee));
    }
    
    if (search) {
      paramCount++;
      whereClause += ` AND (
        t.title ILIKE $${paramCount} OR 
        t.description ILIKE $${paramCount} OR
        t.tags::text ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }
    
    if (tags && tags.length > 0) {
      paramCount++;
      whereClause += ` AND t.tags ? $${paramCount}::text`;
      params.push(tags[0]); // Support single tag for now
    }
    
    if (deadline_from) {
      paramCount++;
      whereClause += ` AND t.deadline >= $${paramCount}`;
      params.push(deadline_from);
    }
    
    if (deadline_to) {
      paramCount++;
      whereClause += ` AND t.deadline <= $${paramCount}`;
      params.push(deadline_to);
    }
    
    if (created_by) {
      paramCount++;
      whereClause += ` AND t.created_by = $${paramCount}`;
      params.push(created_by);
    }
    
    const offset = (page - 1) * limit;
    
    // Main query with all related data
    const query = `
      SELECT 
        t.id,
        COALESCE(t.title, 'Untitled') as title,
        COALESCE(t.description, '') as description,
        COALESCE(t.status, 'pending') as status,
        COALESCE(t.priority, 'medium') as priority,
        COALESCE(t.kanban_column, 'todo') as kanban_column,
        COALESCE(t.deadline, NULL) as deadline,
        COALESCE(t.estimated_time, NULL) as estimated_time,
        COALESCE(t.subtasks, '[]'::jsonb) as subtasks,
        COALESCE(t.tags, '[]'::jsonb) as tags,
        COALESCE(t.is_public, true) as is_public,
        COALESCE(t.allow_comments, true) as allow_comments,
        COALESCE(t.allow_attachments, true) as allow_attachments,
        COALESCE(t.workflow_stage, 'planning') as workflow_stage,
        COALESCE(t.sprint_id, NULL) as sprint_id,
        COALESCE(t.story_points, NULL) as story_points,
        COALESCE(t.risk_level, 'low') as risk_level,
        COALESCE(t.acceptance_criteria, '[]'::jsonb) as acceptance_criteria,
        COALESCE(t.dependencies, '[]'::jsonb) as dependencies,
        COALESCE(t.milestones, '[]'::jsonb) as milestones,
        COALESCE(t.settings, '{}'::jsonb) as settings,
        COALESCE(t.created_by, 0) as created_by,
        COALESCE(t.group_id, 0) as group_id,
        COALESCE(t.created_at, NOW()) as created_at,
        COALESCE(t.updated_at, NOW()) as updated_at,
        u.name as creator_name,
        u.avatar as creator_avatar,
        u.email as creator_email,
        g.name as group_name,
        gm.role as user_role,
        COALESCE(assignments_data.assignments, '[]'::jsonb) as assignments,
        COALESCE(attachments_data.attachments, '[]'::jsonb) as attachments,
        COALESCE(message_data.message_count, 0) as message_count,
        COALESCE(file_data.file_count, 0) as file_count
      FROM group_todos t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN groups g ON t.group_id = g.id
      LEFT JOIN group_members gm ON t.group_id = gm.group_id AND gm.user_id = $1
      LEFT JOIN LATERAL (
        SELECT 
          t.id as todo_id,
          jsonb_agg(
            jsonb_build_object(
              'id', gta.id,
              'userId', gta.user_id,
              'assignedBy', gta.assigned_by,
              'role', gta.role,
              'estimatedTime', gta.estimated_time,
              'dueDate', gta.due_date,
              'notes', gta.notes,
              'status', gta.status,
              'createdAt', gta."createdAt",
              'updatedAt', gta."updatedAt"
            )
          ) as assignments
        FROM group_todo_assignments gta
        WHERE gta.todo_id = t.id
        GROUP BY t.id
      ) assignments_data ON true
      LEFT JOIN LATERAL (
        SELECT 
          t.id as todo_id,
          jsonb_agg(
            jsonb_build_object(
              'id', gtf.id,
              'fileName', gtf.filename,
              'fileUrl', gtf.file_path,
              'fileSize', gtf.file_size,
              'fileType', gtf.mime_type,
              'uploadedBy', gtf.user_id,
              'uploadedAt', gtf.uploaded_at
            )
          ) as attachments
        FROM group_todo_files gtf
        WHERE gtf.todo_id = t.id
        GROUP BY t.id
      ) attachments_data ON true
      LEFT JOIN LATERAL (
        SELECT 
          t.id as todo_id,
          COUNT(*) as message_count
        FROM group_todo_chat gtc
        WHERE gtc.todo_id = t.id AND gtc.is_deleted = false
        GROUP BY t.id
      ) message_data ON true
      LEFT JOIN LATERAL (
        SELECT 
          t.id as todo_id,
          COUNT(*) as file_count
        FROM group_todo_files gtf
        WHERE gtf.todo_id = t.id
        GROUP BY t.id
      ) file_data ON true
      ${whereClause}
      ORDER BY t."${sanitizedSortBy}" ${sanitizedSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Process results
    const todos = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      kanban_column: row.kanban_column,
      deadline: row.deadline,
      estimated_time: row.estimated_time,
      subtasks: row.subtasks,
      tags: row.tags,
      is_public: row.is_public,
      allow_comments: row.allow_comments,
      allow_attachments: row.allow_attachments,
      workflow_stage: row.workflow_stage,
      sprint_id: row.sprint_id,
      story_points: row.story_points,
      risk_level: row.risk_level,
      acceptance_criteria: row.acceptance_criteria,
      dependencies: row.dependencies,
      milestones: row.milestones,
      settings: row.settings,
      created_by: row.created_by,
      group_id: row.group_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator: {
        id: row.created_by,
        name: row.creator_name,
        avatar: row.creator_avatar,
        email: row.creator_email
      },
      group: {
        id: row.group_id,
        name: row.group_name
      },
      assignments: row.assignments,
      attachments: row.attachments,
      message_count: row.message_count,
      file_count: row.file_count,
      user_role: row.user_role
    }));
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT t.id)
      FROM group_todos t
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);
    
    // Get analytics if requested
    let analytics = null;
    if (view === 'analytics') {
      const analyticsQuery = `
        SELECT 
          COUNT(*) as total_todos,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_todos,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_todos,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_todos,
          COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_todos,
          AVG(COALESCE(progress, 0)) as avg_progress,
          AVG(COALESCE("estimatedTime", 0)) as avg_estimated_time,
          AVG(COALESCE("actualTime", 0)) as avg_actual_time
        FROM todos 
        WHERE "groupId" = $1
      `;
      
      const analyticsResult = await pool.query(analyticsQuery, [parseInt(groupId)]);
      analytics = analyticsResult.rows[0];
    }
    
    res.json({
      success: true,
      todos,
      memberRole: member?.role || 'member',
      permissions: member?.permissions || {},
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      analytics
    });
    
  } catch (error) {
    console.error('Error fetching group todos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group todos'
    });
  }
});

// Create advanced group todo with all features
router.post('/groups/:groupId/todos', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const {
      title, description, category, priority, deadline, estimatedTime,
      subtasks, tags, assignedTo, isPublic, allowComments, allowAttachments,
      workflowStage, kanbanColumn, sprintId, storyPoints, riskLevel,
      acceptanceCriteria, dependencies, milestones, settings,
      platforms, externalLinks, budget, notes, assignees
    } = req.body;
    
    // Check if user can create todos in this group (member or accepted invitation)
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    let member = null;
    let canCreate = false;
    
    if (memberResult.rows.length > 0) {
      member = memberResult.rows[0];
      canCreate = member.role === 'admin' || member.permissions?.canCreate || false;
    } else {
      // Check if user has accepted invitation
      const acceptedInvitationQuery = `
        SELECT role, permissions FROM group_invitations 
        WHERE "groupId" = $1 AND "invitedUserId" = $2 AND status = 'accepted'
        ORDER BY "createdAt" DESC
        LIMIT 1
      `;
      
      const acceptedInvitationResult = await pool.query(acceptedInvitationQuery, [parseInt(groupId), req.user.id]);
      
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
    
    // Validate required fields
    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required'
      });
    }
    
    // Use transaction for complex creation
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create the group todo
      const todoQuery = `
        INSERT INTO group_todos (
          title, description, group_id, created_by, status, priority, category,
          deadline, estimated_time, subtasks, tags, is_public, allow_comments,
          allow_attachments, workflow_stage, kanban_column, sprint_id, story_points,
          risk_level, acceptance_criteria, dependencies, milestones, settings,
          platforms, external_links, budget, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
        RETURNING *
      `;
      
      // Ensure all JSON fields are properly formatted
      const safeJsonStringify = (data) => {
        try {
          if (!data || (Array.isArray(data) && data.length === 0)) return '[]';
          if (typeof data === 'string') return data;
          return JSON.stringify(data);
        } catch (error) {
          console.error('JSON stringify error:', error);
          return '[]';
        }
      };

      const todoResult = await client.query(todoQuery, [
        title, description, groupId, req.user.id, 'pending', priority || 'medium',
        category, deadline, estimatedTime ? parseInt(estimatedTime) : null, 
        safeJsonStringify(subtasks), safeJsonStringify(tags),
        isPublic !== false, allowComments !== false, allowAttachments !== false,
        workflowStage || 'planning', kanbanColumn || 'backlog', sprintId ? parseInt(sprintId) : null,
        storyPoints ? parseInt(storyPoints) : null, riskLevel || 'low', 
        safeJsonStringify(acceptanceCriteria), safeJsonStringify(dependencies), 
        safeJsonStringify(milestones), safeJsonStringify(settings),
        safeJsonStringify(platforms), safeJsonStringify(externalLinks),
        budget ? parseFloat(budget) : null,
        notes || null
      ]);
      
      const todo = todoResult.rows[0];
      
      // Create assignments for assigned members
      const assignmentsToCreate = assignedTo || assignees || [];
      if (assignmentsToCreate.length > 0) {
        for (const assignment of assignmentsToCreate) {
          const { userId, role = 'member', estimatedTime: userEstimatedTime, dueDate, notes } = assignment;
          
          const assignmentQuery = `
            INSERT INTO group_todo_assignments (
              todo_id, user_id, assigned_by, role, estimated_time, due_date, notes,
              createdAt, updatedAt
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          `;
          
          await client.query(assignmentQuery, [
            todo.id, parseInt(userId), req.user.id, role, userEstimatedTime ? parseInt(userEstimatedTime) : null, dueDate, notes
          ]);
          
          // Create notification for assigned user
          const notificationQuery = `
            INSERT INTO group_todo_notifications (
              user_id, group_id, todo_id, type, title, message, data,
              priority, delivery_methods, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          `;
          
          await client.query(notificationQuery, [
            parseInt(userId), parseInt(groupId), todo.id, 'todo_assigned',
            `New task assigned in group`,
            `You have been assigned: ${title}`,
            JSON.stringify({
              groupId: parseInt(groupId), todoId: todo.id, todoTitle: title,
              assignedBy: req.user.id, role, dueDate
            }),
            'high', JSON.stringify({ inApp: true, email: true, push: false, sms: false })
          ]);
        }
      }
      
      // Create workflow stages if specified
      if (workflowStage && workflowStage !== 'planning') {
        const workflowQuery = `
          INSERT INTO group_todo_workflow (
            todo_id, stage, status, assigned_user_id, due_date, createdAt, updatedAt
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `;
        
        await client.query(workflowQuery, [
          todo.id, workflowStage, 'pending', assignedTo?.[0]?.userId ? parseInt(assignedTo[0].userId) : null, deadline
        ]);
      }
      
      // Create skill requirements if specified
      if (settings?.skills && settings.skills.length > 0) {
        for (const skill of settings.skills) {
          const skillQuery = `
            INSERT INTO group_todo_skills (
              todo_id, skill_name, skill_level, priority, is_required
            ) VALUES ($1, $2, $3, $4, $5)
          `;
          
          await client.query(skillQuery, [
            todo.id, skill.name, skill.level || 'beginner',
            skill.priority || 'medium', skill.required !== false
          ]);
        }
      }
      
      // Create activity log
      const activityQuery = `
        INSERT INTO group_todo_activities (
          todo_id, user_id, action, details, created_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `;
      
      await client.query(activityQuery, [
        todo.id, req.user.id, 'created',
        JSON.stringify({ 
          title, description, category, priority, workflowStage,
          assignedUsers: assignedTo?.length || 0
        })
      ]);
      
      await client.query('COMMIT');
      
      // Emit socket event for real-time updates
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to(`group_${groupId}`).emit('todo-created', {
          todoId: todo.id,
          groupId: parseInt(groupId),
          todo: {
            ...todo,
            creator: { name: req.user.name || 'Unknown' }
          },
          createdBy: req.user.id,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        todo,
        message: 'Advanced group todo created successfully with all features'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error creating group todo:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating group todo'
    });
  }
});

// ===== GROUP TODO CHAT SYSTEM =====

// Get chat messages for a specific todo
router.get('/groups/:groupId/todos/:todoId/chat', auth, async (req, res) => {
  try {
    const { groupId, todoId } = req.params;
    const { page = 1, limit = 50, parentId = null } = req.query;
    
    // Check if user is member of the group
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    const offset = (page - 1) * limit;
    
    // Get chat messages with user info and reactions
    const query = `
      SELECT 
        gtc.*,
        u.name as user_name, u.avatar as user_avatar,
        u.email as user_email,
        COUNT(gtc2.id) as reply_count
      FROM group_todo_chat gtc
      LEFT JOIN users u ON gtc.user_id = u.id
      LEFT JOIN group_todo_chat gtc2 ON gtc.id = gtc2.parent_message_id
      WHERE gtc.todo_id = $1 
        AND gtc.is_deleted = false
        AND (gtc.parent_message_id = $2 OR ($2 IS NULL AND gtc.parent_message_id IS NULL))
      GROUP BY gtc.id, u.name, u.avatar, u.email
      ORDER BY gtc.createdAt ASC
      LIMIT $3 OFFSET $4
    `;
    
    const result = await pool.query(query, [parseInt(todoId), parentId ? parseInt(parentId) : null, parseInt(limit), parseInt(offset)]);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) FROM group_todo_chat 
      WHERE todo_id = $1 AND is_deleted = false
        AND (parent_message_id = $2 OR ($2 IS NULL AND parent_message_id IS NULL))
    `;
    
    const countResult = await pool.query(countQuery, [parseInt(todoId), parentId ? parseInt(parentId) : null]);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      messages: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat messages'
    });
  }
});

// Send chat message
router.post('/groups/:groupId/todos/:todoId/chat', auth, async (req, res) => {
  try {
    const { groupId, todoId } = req.params;
    const { 
      content, messageType = 'text', metadata = {}, 
      parentMessageId, mentions = [] 
    } = req.body;
    
    // Check if user is member of the group
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    // Check if parent message exists (for replies)
    if (parentMessageId) {
      const parentQuery = `
        SELECT id FROM group_todo_chat 
        WHERE id = $1 AND todo_id = $2 AND is_deleted = false
      `;
      
      const parentResult = await pool.query(parentQuery, [parseInt(parentMessageId), parseInt(todoId)]);
      if (parentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Parent message not found'
        });
      }
    }
    
    // Create chat message
    const messageQuery = `
      INSERT INTO group_todo_chat (
        todo_id, user_id, message_type, content, metadata, parent_message_id,
                  mentions, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;
    
    const messageResult = await pool.query(messageQuery, [
      parseInt(todoId), req.user.id, messageType, content.trim(), 
      JSON.stringify(metadata), parentMessageId ? parseInt(parentMessageId) : null, JSON.stringify(mentions)
    ]);
    
    const message = messageResult.rows[0];
    
    // Get user info for the message
    const userQuery = `
      SELECT name, avatar, email FROM users WHERE id = $1
    `;
    
    const userResult = await pool.query(userQuery, [req.user.id]);
    const user = userResult.rows[0];
    
    // Send notifications to mentioned users
    if (mentions && mentions.length > 0) {
      for (const mention of mentions) {
        const notificationQuery = `
          INSERT INTO group_todo_notifications (
            user_id, group_id, todo_id, type, title, message, data,
            priority, delivery_methods, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `;
        
        await pool.query(notificationQuery, [
          parseInt(mention.userId), parseInt(groupId), parseInt(todoId), 'mention',
          `You were mentioned in a task`,
          `${user.name} mentioned you in: ${content.substring(0, 200)}...`,
          JSON.stringify({
            groupId: parseInt(groupId), todoId: parseInt(todoId), messageId: message.id,
            mentionedBy: req.user.id, content: content.substring(0, 200)
          }),
          'normal', JSON.stringify({ inApp: true, email: false, push: false, sms: false })
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
      parseInt(todoId), req.user.id, 'chat_message',
      JSON.stringify({ 
        messageId: message.id, 
        messageType, 
        mentions: mentions.length,
        isReply: !!parentMessageId
      })
    ]);
    
    res.json({
      success: true,
      message: {
        ...message,
        user: {
          id: req.user.id,
          name: user.name,
          avatar: user.avatar,
          email: user.email
        }
      }
    });
    
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending chat message'
    });
  }
});

// ===== FILE MANAGEMENT =====

// Upload files for a todo
router.post('/groups/:groupId/todos/:todoId/files', auth, upload.array('files', 10), async (req, res) => {
  try {
    const { groupId, todoId } = req.params;
    const { description, tags } = req.body;
    
    // Check if user is member of the group
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    const uploadedFiles = [];
    
    for (const file of req.files) {
      // Create file record
      const fileQuery = `
        INSERT INTO group_todo_files (
          todo_id, user_id, filename, original_name, file_path, file_size,
          mime_type, file_type, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `;
      
      const fileResult = await pool.query(fileQuery, [
        parseInt(todoId), req.user.id, file.filename, file.originalname,
        file.path, parseInt(file.size), file.mimetype, 
        path.extname(file.originalname).substring(1),
        JSON.stringify({ description, tags: tags ? tags.split(',') : [] })
      ]);
      
      uploadedFiles.push(fileResult.rows[0]);
    }
    
    // Create activity log
    const activityQuery = `
      INSERT INTO group_todo_activities (
        todo_id, user_id, action, details, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
    `;
    
    await pool.query(activityQuery, [
      parseInt(todoId), req.user.id, 'files_uploaded',
      JSON.stringify({ 
        fileCount: uploadedFiles.length,
        fileNames: uploadedFiles.map(f => f.original_name)
      })
    ]);
    
    res.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} files uploaded successfully`
    });
    
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files'
    });
  }
});

// ===== INVITATIONS MANAGEMENT =====

// Get pending invitations for the current user
router.get('/invitations/pending', auth, async (req, res) => {
  try {
    console.log(`🔍 Fetching pending invitations for user ${req.user.id}`);
    
    const query = `
      SELECT DISTINCT ON (gi."groupId")
        gi.*,
        g.name as group_name,
        g.description as group_description,
        g.category as group_category,
        g.avatar as group_avatar,
        u.name as inviter_name,
        u.avatar as inviter_avatar,
        u.email as inviter_email
      FROM group_invitations gi
      INNER JOIN groups g ON gi."groupId" = g.id
      INNER JOIN users u ON gi."invitedBy" = u.id
      WHERE gi."invitedUserId" = $1 
        AND gi.status = 'pending'
        AND (gi."expiresAt" IS NULL OR gi."expiresAt" > NOW())
      ORDER BY gi."groupId", gi."createdAt" DESC
    `;
    
    const result = await pool.query(query, [req.user.id]);
    
    console.log(`📊 Found ${result.rows.length} pending invitations for user ${req.user.id}`);
    
    // Debug: Log all invitations for this user
    const debugQuery = `
      SELECT gi.*, g.name as group_name, u.name as inviter_name
      FROM group_invitations gi
      LEFT JOIN groups g ON gi."groupId" = g.id
      LEFT JOIN users u ON gi."invitedBy" = u.id
      WHERE gi."invitedUserId" = $1
      ORDER BY gi."createdAt" DESC
    `;
    
    const debugResult = await pool.query(debugQuery, [req.user.id]);
    console.log(`📋 Total invitations for user ${req.user.id}: ${debugResult.rows.length}`);
    debugResult.rows.forEach(inv => {
      console.log(`  - Group: ${inv.group_name}, Status: ${inv.status}, Created: ${inv.createdAt}`);
    });
    
    res.json({
      success: true,
      invitations: result.rows,
      debug: {
        totalInvitations: debugResult.rows.length,
        pendingInvitations: result.rows.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending invitations'
    });
  }
});

// Debug: Get all invitations in system
router.get('/invitations/debug', auth, async (req, res) => {
  try {
    // Check if user is admin
    const userQuery = 'SELECT role FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [req.user.id]);
    
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const query = `
      SELECT 
        gi.*,
        g.name as group_name,
        u1.name as inviter_name,
        u2.name as invited_user_name
      FROM group_invitations gi
      LEFT JOIN groups g ON gi."groupId" = g.id
      LEFT JOIN users u1 ON gi."invitedBy" = u1.id
      LEFT JOIN users u2 ON gi."invitedUserId" = u2.id
      ORDER BY gi."createdAt" DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      invitations: result.rows,
      summary: {
        total: result.rows.length,
        pending: result.rows.filter(inv => inv.status === 'pending').length,
        accepted: result.rows.filter(inv => inv.status === 'accepted').length,
        declined: result.rows.filter(inv => inv.status === 'declined').length,
        expired: result.rows.filter(inv => inv.status === 'expired').length
      }
    });
    
  } catch (error) {
    console.error('Error fetching debug invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching debug invitations'
    });
  }
});

// Accept invitation
router.post('/invitations/:invitationId/accept', auth, async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    // Get invitation details
    const invitationQuery = `
      SELECT * FROM group_invitations 
      WHERE id = $1 AND "invitedUserId" = $2 AND status = 'pending'
    `;
    
    const invitationResult = await pool.query(invitationQuery, [parseInt(invitationId), req.user.id]);
    if (invitationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or already processed'
      });
    }
    
    const invitation = invitationResult.rows[0];
    
    // Check if user is already a member
    const memberQuery = `
      SELECT * FROM group_members 
      WHERE group_id = $1 AND user_id = $2
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(invitation.groupId), req.user.id]);
    if (memberResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }
    
    // Use transaction to ensure data consistency
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Add user to group
      const memberInsertQuery = `
        INSERT INTO group_members (
          group_id, user_id, role, permissions, joined_at, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), true, NOW(), NOW())
      `;
      
      const defaultMemberPermissions = {
        canCreate: true, canEdit: false, canDelete: false, canInvite: false,
        canAssign: false, canApprove: false, canManageMembers: false,
        canViewAnalytics: false, canManageSettings: false
      };
      
      await client.query(memberInsertQuery, [
        parseInt(invitation.groupId), req.user.id, 'member', JSON.stringify(defaultMemberPermissions)
      ]);
      
      // Update invitation status
      await client.query(
        'UPDATE group_invitations SET status = $1, "respondedAt" = NOW() WHERE id = $2',
        ['accepted', parseInt(invitationId)]
      );
      
      await client.query('COMMIT');
      
      // Send real-time notification to group members
      try {
        const groupTodoSocket = req.app.get('groupTodoSocket');
        if (groupTodoSocket) {
          groupTodoSocket.sendInvitationResponseNotification(parseInt(invitation.groupId), {
            user_id: req.user.id,
            user_name: req.user.name,
            action: 'accepted',
            group_id: parseInt(invitation.groupId),
            invitation_id: parseInt(invitationId)
          });
        }
      } catch (wsError) {
        console.error('Error sending WebSocket notification:', wsError);
      }
      
      // Get group details and todos for the response
      const groupQuery = `
        SELECT g.*, 
               COUNT(gm.user_id) as member_count
        FROM groups g
        LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.is_active = true
        WHERE g.id = $1
        GROUP BY g.id, g.name, g.description, g."createdBy", g."createdAt", g."updatedAt"
      `;
      
      const groupResult = await client.query(groupQuery, [parseInt(invitation.groupId)]);
      const group = groupResult.rows[0];
      
      // Get group todos with proper data structure
      const todosQuery = `
        SELECT 
          t.id,
          COALESCE(t.title, 'Untitled') as title,
          COALESCE(t.description, '') as description,
          COALESCE(t.status, 'pending') as status,
          COALESCE(t.priority, 'medium') as priority,
          COALESCE(t."kanban_column", 'todo') as "kanban_column",
          COALESCE(t."deadline", NULL) as deadline,
          CASE 
            WHEN t."assignedTo" IS NULL THEN NULL
            WHEN pg_typeof(t."assignedTo") IN ('json', 'jsonb') THEN NULL
            ELSE t."assignedTo"
          END as "assignedTo",
          COALESCE(t."creatorId", 0) as "creatorId",
          COALESCE(t."groupId", 0) as "groupId",
          COALESCE(t."createdAt", NOW()) as "createdAt",
          COALESCE(t."updatedAt", NOW()) as "updatedAt",
          u.name as creator_name,
          u.avatar as creator_avatar,
          u.email as creator_email,
          g.name as group_name,
          gm.role as user_role,
          '[]'::jsonb as assignments,
          '[]'::jsonb as attachments,
          0 as message_count,
          0 as file_count
        FROM todos t
        LEFT JOIN users u ON t."creatorId" = u.id
        LEFT JOIN groups g ON t."groupId" = g.id
        LEFT JOIN group_members gm ON t."groupId" = gm.group_id AND gm.user_id = $1
        WHERE t."groupId" = $2
        ORDER BY t."createdAt" DESC
      `;
      
      const todosResult = await client.query(todosQuery, [req.user.id, parseInt(invitation.groupId)]);
      
      res.json({
        success: true,
        message: 'Invitation accepted successfully',
        group: group,
        todos: todosResult.rows,
        groupId: parseInt(invitation.groupId)
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting invitation'
    });
  }
});

// Decline invitation
router.post('/invitations/:invitationId/decline', auth, async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    const result = await pool.query(
      'UPDATE group_invitations SET status = $1, "respondedAt" = NOW() WHERE id = $2 AND "invitedUserId" = $3 AND status = $4',
      ['declined', parseInt(invitationId), req.user.id, 'pending']
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or already processed'
      });
    }
    
    res.json({
      success: true,
      message: 'Invitation declined successfully'
    });
    
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error declining invitation'
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
      INNER JOIN groups g ON gi."groupId" = g.id
      WHERE gi.id = $1 AND gi."invitedUserId" = $2 AND gi.status = 'pending'
    `;
    
    const invitationResult = await pool.query(invitationQuery, [parseInt(invitationId), req.user.id]);
    if (invitationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or already processed'
      });
    }
    
    const invitation = invitationResult.rows[0];
    
    if (response === 'accept') {
      // Use transaction for accepting invitation
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Add user to group members
        const memberInsertQuery = `
          INSERT INTO group_members (
            group_id, user_id, role, permissions, joined_at, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, NOW(), true, NOW(), NOW())
        `;
        
        const defaultMemberPermissions = {
          canCreate: true, canEdit: false, canDelete: false, canInvite: false,
          canAssign: false, canApprove: false, canManageMembers: false,
          canViewAnalytics: false, canManageSettings: false
        };
        
        await client.query(memberInsertQuery, [
          parseInt(invitation.groupId), req.user.id, invitation.role, JSON.stringify(defaultMemberPermissions)
        ]);
        
        // Update invitation status
        await client.query(
          'UPDATE group_invitations SET status = $1, "respondedAt" = NOW() WHERE id = $2',
          ['accepted', parseInt(invitationId)]
        );
        
        await client.query('COMMIT');
        
        // Get group details and todos for the response
        const groupQuery = `
          SELECT g.*, 
                 COUNT(gm.user_id) as member_count
          FROM groups g
          LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.is_active = true
          WHERE g.id = $1
          GROUP BY g.id
        `;
        
        const groupResult = await client.query(groupQuery, [parseInt(invitation.groupId)]);
        const group = groupResult.rows[0];
        
        // Get group todos with proper data structure
        const todosQuery = `
          SELECT 
            t.id,
            COALESCE(t.title, 'Untitled') as title,
            COALESCE(t.description, '') as description,
            COALESCE(t.status, 'pending') as status,
            COALESCE(t.priority, 'medium') as priority,
            COALESCE(t."kanban_column", 'todo') as "kanban_column",
            COALESCE(t."deadline", NULL) as deadline,
            CASE 
              WHEN t."assignedTo" IS NULL THEN NULL
              WHEN pg_typeof(t."assignedTo") IN ('json', 'jsonb') THEN NULL
              ELSE t."assignedTo"
            END as "assignedTo",
            COALESCE(t."creatorId", 0) as "creatorId",
            COALESCE(t."groupId", 0) as "groupId",
            COALESCE(t."createdAt", NOW()) as "createdAt",
            COALESCE(t."updatedAt", NOW()) as "updatedAt",
            NULL as assigned_to_name,
            NULL as assigned_to_avatar,
            gm.role as user_role,
            '[]'::jsonb as assignments,
            '[]'::jsonb as attachments,
            0 as message_count,
            0 as file_count
          FROM todos t
          -- Removed problematic JOIN due to JSON data type issues
          LEFT JOIN group_members gm ON t.group_id = gm.group_id AND gm.user_id = $1
          WHERE t.group_id = $2
          ORDER BY t."createdAt" DESC
        `;
        
        const todosResult = await client.query(todosQuery, [req.user.id, parseInt(invitation.groupId)]);
        
        res.json({
          success: true,
          message: 'Invitation accepted successfully',
          group: group,
          todos: todosResult.rows,
          groupId: parseInt(invitation.groupId)
        });
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } else if (response === 'decline') {
      // Decline invitation
      const result = await pool.query(
        'UPDATE group_invitations SET status = $1, "respondedAt" = NOW() WHERE id = $2',
        ['declined', parseInt(invitationId)]
      );
      
      res.json({
        success: true,
        message: 'Invitation declined successfully'
      });
    }
    
  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to invitation'
    });
  }
});

// ===== NOTIFICATIONS =====

// Get notifications for the current user
router.get('/notifications', auth, async (req, res) => {
  try {
    const { unreadOnly = false, limit = 50, offset = 0 } = req.query;
    
    let whereClause = 'WHERE "userId" = $1';
    let params = [req.user.id];
    
    if (unreadOnly === 'true') {
      whereClause += ` AND "isRead" = false`;
    }
    
    // Add LIMIT and OFFSET parameters
    const query = `
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      notifications: result.rows
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
    
    const result = await pool.query(
      'UPDATE notifications SET "isRead" = true WHERE id = $1 AND "userId" = $2',
      [parseInt(notificationId), req.user.id]
    );
    
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

// Get assignments for a specific todo
router.get('/groups/:groupId/todos/:todoId/assignments', auth, async (req, res) => {
  try {
    const { groupId, todoId } = req.params;
    
    // Check if user is member of the group
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Get assignments with user details
    const query = `
      SELECT 
        gta.*,
        u.name as user_name,
        u.avatar as user_avatar,
        u.email as user_email,
        u.id as user_id
      FROM group_todo_assignments gta
      LEFT JOIN users u ON gta.user_id = u.id
      WHERE gta.todo_id = $1
      ORDER BY gta."createdAt" DESC
    `;
    
    const result = await pool.query(query, [parseInt(todoId)]);
    
    console.log('🔍 Backend - Raw assignments from DB:', result.rows);
    
    // Process assignments
    const assignments = result.rows.map(row => ({
      id: row.id,
      todoId: row.todo_id,
      userId: row.user_id,
      assignedBy: row.assigned_by,
      role: row.role,
      estimatedTime: row.estimated_time,
      dueDate: row.due_date,
      notes: row.notes,
      status: row.status,
      assignedTasks: row.assigned_tasks || [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.user_id,
        name: row.user_name,
        avatar: row.user_avatar,
        email: row.user_email
      }
    }));
    
    console.log('📤 Backend - Sending assignments response:', { success: true, assignments });
    
    res.json({
      success: true,
      assignments
    });
    
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments'
    });
  }
});

// Add assignment to a todo
router.post('/groups/:groupId/todos/:todoId/assignments', auth, async (req, res) => {
  try {
    const { groupId, todoId } = req.params;
    const { userId, role, estimatedTime, dueDate, notes, assignedTasks } = req.body;
    
    console.log('📥 Backend - Received assignment request:', {
      groupId, todoId, userId, role, estimatedTime, dueDate, notes, assignedTasks
    });
    
    // Check if user can assign tasks (admin or has permission)
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    const member = memberResult.rows[0];
    if (member.role !== 'admin' && !member.permissions?.canAssign) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to assign tasks'
      });
    }
    
    // Note: Users can have multiple assignments for the same todo
    // Each assignment can contain different tasks
    
    // Create assignment
    const assignmentQuery = `
      INSERT INTO group_todo_assignments (
        todo_id, user_id, assigned_by, role, estimated_time, due_date, notes,
        assigned_tasks, status, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;
    
    const assignmentResult = await pool.query(assignmentQuery, [
      parseInt(todoId), parseInt(userId), req.user.id, role || 'member',
      estimatedTime ? parseInt(estimatedTime) : null, dueDate, notes,
      assignedTasks ? JSON.stringify(assignedTasks) : '[]', 'assigned'
    ]);
    
    const assignment = assignmentResult.rows[0];
    
    console.log('✅ Backend - Assignment created successfully:', assignment);
    
    // Create notification for assigned user
    const notificationQuery = `
      INSERT INTO group_todo_notifications (
        user_id, group_id, todo_id, type, title, message, data,
        priority, delivery_methods, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `;
    
    await pool.query(notificationQuery, [
      parseInt(userId), parseInt(groupId), parseInt(todoId), 'todo_assigned',
      'New Task Assignment',
      `You have been assigned to: ${assignment.title || 'a task'}`,
      JSON.stringify({
        todoId: parseInt(todoId),
        groupId: parseInt(groupId),
        assignedBy: req.user.id,
        role: role || 'member'
      }),
      'high', JSON.stringify({ inApp: true, email: true, push: false, sms: false })
    ]);
    
    res.json({
      success: true,
      assignment: {
        id: assignment.id,
        todoId: assignment.todo_id,
        userId: assignment.user_id,
        assignedBy: assignment.assigned_by,
        role: assignment.role,
        estimatedTime: assignment.estimated_time,
        dueDate: assignment.due_date,
        notes: assignment.notes,
        status: assignment.status,
        assignedTasks: assignment.assigned_tasks || [],
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt
      },
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

// Update assignment
router.put('/groups/:groupId/todos/:todoId/assignments/:assignmentId', auth, async (req, res) => {
  try {
    const { groupId, todoId, assignmentId } = req.params;
    const updates = req.body;
    
    // Check if user can update assignments
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Build update query dynamically
    const allowedFields = ['role', 'estimated_time', 'due_date', 'notes', 'assigned_tasks', 'status'];
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(parseInt(assignmentId));
    
    const updateQuery = `
      UPDATE group_todo_assignments 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, updateValues);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    const assignment = result.rows[0];
    
    // Check if all assignments for this todo are completed
    const allAssignmentsQuery = `
      SELECT assigned_tasks FROM group_todo_assignments 
      WHERE todo_id = $1
    `;
    
    const allAssignmentsResult = await pool.query(allAssignmentsQuery, [parseInt(todoId)]);
    const allAssignments = allAssignmentsResult.rows;
    
    let allCompleted = true;
    let hasAssignments = false;
    
    for (const assignment of allAssignments) {
      if (assignment.assigned_tasks && assignment.assigned_tasks.length > 0) {
        hasAssignments = true;
        const allTasksCompleted = assignment.assigned_tasks.every(task => task.status === 'completed');
        if (!allTasksCompleted) {
          allCompleted = false;
          break;
        }
      }
    }
    
    // Update todo status if all assignments are completed
    if (hasAssignments && allCompleted) {
      const updateTodoQuery = `
        UPDATE group_todos 
        SET status = 'completed', updated_at = NOW()
        WHERE id = $1
      `;
      await pool.query(updateTodoQuery, [parseInt(todoId)]);
      
      // Create completion notification for all group members
      const groupMembersQuery = `
        SELECT user_id FROM group_members 
        WHERE group_id = $1 AND is_active = true
      `;
      
      const groupMembersResult = await pool.query(groupMembersQuery, [parseInt(groupId)]);
      
      for (const member of groupMembersResult.rows) {
        const notificationQuery = `
          INSERT INTO group_todo_notifications (
            user_id, group_id, todo_id, type, title, message, data,
            priority, delivery_methods, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `;
        
        await pool.query(notificationQuery, [
          member.user_id, parseInt(groupId), parseInt(todoId), 'todo_completed',
          'Todo Completed! 🎉',
          `The todo "${todo.title || 'Task'}" has been completed by all team members!`,
          JSON.stringify({
            todoId: parseInt(todoId),
            groupId: parseInt(groupId),
            completedBy: req.user.id
          }),
          'high', JSON.stringify({ inApp: true, email: true, push: true, sms: false })
        ]);
      }
      
      // Broadcast completion via Socket.IO
      const { GroupTodoSocket } = require('../websocket/groupTodoSocket');
      if (global.groupTodoSocket) {
        global.groupTodoSocket.broadcastTodoCompletion(parseInt(todoId), parseInt(groupId));
      }
    }
    
    res.json({
      success: true,
      assignment: {
        id: assignment.id,
        todoId: assignment.todo_id,
        userId: assignment.user_id,
        assignedBy: assignment.assigned_by,
        role: assignment.role,
        estimatedTime: assignment.estimated_time,
        dueDate: assignment.due_date,
        notes: assignment.notes,
        status: assignment.status,
        assignedTasks: assignment.assigned_tasks || [],
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt
      },
      message: 'Assignment updated successfully',
      todoCompleted: hasAssignments && allCompleted
    });
    
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment'
    });
  }
});

// Delete assignment
router.delete('/groups/:groupId/todos/:todoId/assignments/:assignmentId', auth, async (req, res) => {
  try {
    const { groupId, todoId, assignmentId } = req.params;
    
    // Check if user can delete assignments (admin or has permission)
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    const member = memberResult.rows[0];
    if (member.role !== 'admin' && !member.permissions?.canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete assignments'
      });
    }
    
    // Delete assignment
    const deleteQuery = `
      DELETE FROM group_todo_assignments 
      WHERE id = $1 AND todo_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(deleteQuery, [parseInt(assignmentId), parseInt(todoId)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting assignment'
    });
  }
});

// Get group members
router.get('/groups/:groupId/members', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check if user is member of the group
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Get all group members
    const query = `
      SELECT 
        gm.*,
        u.name, u.avatar, u.email, u.id as user_id
      FROM group_members gm
      LEFT JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1 AND gm.is_active = true
      ORDER BY gm.joined_at ASC
    `;
    
    const result = await pool.query(query, [parseInt(groupId)]);
    
    const members = result.rows.map(row => ({
      id: row.user_id,
      name: row.name,
      avatar: row.avatar,
      email: row.email,
      role: row.role,
      joinedAt: row.joined_at,
      permissions: row.permissions
    }));
    
    console.log('👥 Backend - Sending group members response:', { success: true, members });
    
    res.json({
      success: true,
      members
    });
    
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group members'
    });
  }
});

// Get chat messages for a todo
router.get('/groups/:groupId/todos/:todoId/chat', auth, async (req, res) => {
  try {
    const { groupId, todoId } = req.params;
    
    // Check if user is member of the group
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Get chat messages with user details - add pagination support
    const { limit = 1000, offset = 0 } = req.query; // Default to 1000 messages, can be increased
    
    const query = `
      SELECT 
        gtc.*,
        u.name as user_name,
        u.avatar as user_avatar,
        u.email as user_email
      FROM group_todo_chat gtc
      LEFT JOIN users u ON gtc.user_id = u.id
      WHERE gtc.todo_id = $1 AND gtc.is_deleted = false
      ORDER BY gtc.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    
    console.log('🔍 Backend - Querying chat messages for todo:', todoId, 'limit:', limit, 'offset:', offset);
    const result = await pool.query(query, [parseInt(todoId), parseInt(limit), parseInt(offset)]);
    console.log('🔍 Backend - Raw chat messages from DB:', result.rows.length, 'messages');
    
    const messages = result.rows.map(row => ({
      id: row.id,
      todoId: row.todo_id,
      userId: row.user_id,
      content: row.content,
      messageType: row.message_type,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        avatar: row.user_avatar,
        email: row.user_email
      }
    }));
    
    console.log('💬 Backend - Sending chat messages response:', { success: true, messages });
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM group_todo_chat gtc
      WHERE gtc.todo_id = $1 AND gtc.is_deleted = false
    `;
    
    const countResult = await pool.query(countQuery, [parseInt(todoId)]);
    const totalMessages = parseInt(countResult.rows[0].total);
    
    console.log('💬 Backend - Total messages in DB:', totalMessages, 'Returned:', messages.length);
    
    res.json({
      success: true,
      messages,
      pagination: {
        total: totalMessages,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalMessages > parseInt(offset) + messages.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat messages'
    });
  }
});

// Get recent chat messages for a todo (last N messages)
router.get('/groups/:groupId/todos/:todoId/chat/recent', auth, async (req, res) => {
  try {
    const { groupId, todoId } = req.params;
    const { limit = 50 } = req.query; // Default to last 50 messages
    
    // Check if user is member of the group
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Get recent chat messages with user details
    const query = `
      SELECT 
        gtc.*,
        u.name as user_name,
        u.avatar as user_avatar,
        u.email as user_email
      FROM group_todo_chat gtc
      LEFT JOIN users u ON gtc.user_id = u.id
      WHERE gtc.todo_id = $1 AND gtc.is_deleted = false
      ORDER BY gtc.created_at DESC
      LIMIT $2
    `;
    
    console.log('🔍 Backend - Querying recent chat messages for todo:', todoId, 'limit:', limit);
    const result = await pool.query(query, [parseInt(todoId), parseInt(limit)]);
    console.log('🔍 Backend - Recent chat messages from DB:', result.rows.length, 'messages');
    
    // Reverse to get chronological order
    const messages = result.rows.reverse().map(row => ({
      id: row.id,
      todoId: row.todo_id,
      userId: row.user_id,
      content: row.content,
      messageType: row.message_type,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        avatar: row.user_avatar,
        email: row.user_email
      }
    }));
    
    console.log('💬 Backend - Sending recent chat messages response:', { success: true, messages: messages.length });
    
    res.json({
      success: true,
      messages,
      pagination: {
        total: messages.length,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching recent chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent chat messages'
    });
  }
});

// Send chat message for a todo
router.post('/groups/:groupId/todos/:todoId/chat', auth, async (req, res) => {
  try {
    const { groupId, todoId } = req.params;
    const { content, messageType = 'text' } = req.body;
    
    // Check if user is member of the group
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Insert message
    const messageQuery = `
      INSERT INTO group_todo_chat (todo_id, user_id, content, message_type, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(messageQuery, [
      parseInt(todoId), req.user.id, content, messageType
    ]);
    
    const message = result.rows[0];
    
    console.log('✅ Backend - Chat message created successfully:', message);
    
    // Get user details
    const userQuery = `
      SELECT name, avatar, email FROM users WHERE id = $1
    `;
    
    const userResult = await pool.query(userQuery, [req.user.id]);
    const user = userResult.rows[0];
    
    console.log('👤 Backend - User details from DB:', user);
    console.log('👤 Backend - req.user:', req.user);
    
    const responseData = {
      success: true,
      messages: [{
        id: message.id,
        todoId: message.todo_id,
        userId: message.user_id,
        content: message.content,
        messageType: message.message_type,
        createdAt: message.created_at,
        user: {
          id: message.user_id,
          name: user.name,
          avatar: user.avatar,
          email: user.email
        }
      }]
    };
    
    console.log('📤 Backend - Full response data:', JSON.stringify(responseData, null, 2));
    
    console.log('📤 Backend - Sending chat response:', responseData);
    
    // Don't emit socket event here since it's already sent via socket
    // This prevents duplicate messages when socket message is sent first
    console.log('📡 Skipping socket emission from API route (already sent via socket)');
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending chat message'
    });
  }
});

// Update group todo
router.put('/groups/:groupId/todos/:todoId', auth, async (req, res) => {
  try {
    const { groupId, todoId } = req.params;
    const updates = req.body;
    
    // Check if user is member of the group
    const memberQuery = `
      SELECT role, permissions FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Check if todo exists
    const todoQuery = `
      SELECT * FROM group_todos 
      WHERE id = $1 AND group_id = $2
    `;
    
    const todoResult = await pool.query(todoQuery, [parseInt(todoId), parseInt(groupId)]);
    if (todoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group todo not found'
      });
    }
    
    // Build update query dynamically
    const allowedFields = [
      'title', 'description', 'status', 'priority', 'category', 'deadline',
      'estimated_time', 'subtasks', 'tags', 'is_public', 'allow_comments',
      'allow_attachments', 'workflow_stage', 'kanban_column', 'sprint_id',
      'story_points', 'risk_level', 'acceptance_criteria', 'dependencies',
      'milestones', 'settings', 'platforms', 'external_links', 'budget', 'notes'
    ];
    
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
        paramCount++;
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    
    const updateQuery = `
      UPDATE group_todos 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount} AND group_id = $${paramCount + 1}
      RETURNING *
    `;
    
    const finalValues = [...updateValues, parseInt(todoId), parseInt(groupId)];
    const updateResult = await pool.query(updateQuery, finalValues);
    
    const updatedTodo = updateResult.rows[0];
    
    // Create activity log
    const activityQuery = `
      INSERT INTO group_todo_activities (
        todo_id, user_id, action, details, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
    `;
    
    await pool.query(activityQuery, [
      updatedTodo.id, req.user.id, 'updated',
      JSON.stringify({ 
        updatedFields: Object.keys(updates),
        previousValues: todoResult.rows[0],
        newValues: updates
      })
    ]);
    
    // Emit socket event for real-time updates
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`group_${groupId}`).emit('todo-updated', {
        todoId: parseInt(todoId),
        groupId: parseInt(groupId),
        updates: updates,
        updatedBy: req.user.id,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      todo: updatedTodo,
      message: 'Group todo updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating group todo:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating group todo'
    });
  }
});

// Helper function to generate invite code
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ===== ADVANCED CHAT FEATURES =====

// Edit a chat message
router.put('/groups/:groupId/todos/:todoId/chat/:messageId', auth, async (req, res) => {
  try {
    const { groupId, todoId, messageId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    // Check if user is member of the group
    const memberQuery = `
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Get the message
    const messageQuery = `
      SELECT * FROM group_todo_messages 
      WHERE id = $1 AND todo_id = $2
    `;
    
    const messageResult = await pool.query(messageQuery, [parseInt(messageId), parseInt(todoId)]);
    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    const message = messageResult.rows[0];
    
    // Check if user can edit this message (only message owner or admin/moderator)
    if (message.user_id !== req.user.id) {
      const member = memberResult.rows[0];
      if (member.role !== 'admin' && member.role !== 'moderator') {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own messages'
        });
      }
    }
    
    // Update the message
    const updateQuery = `
      UPDATE group_todo_messages 
      SET content = $1, updated_at = NOW(), is_edited = true, edit_count = edit_count + 1
      WHERE id = $2
      RETURNING *
    `;
    
    const updateResult = await pool.query(updateQuery, [content.trim(), parseInt(messageId)]);
    const updatedMessage = updateResult.rows[0];
    
    // Get user info
    const userQuery = `
      SELECT name, avatar, email FROM users WHERE id = $1
    `;
    
    const userResult = await pool.query(userQuery, [req.user.id]);
    const user = userResult.rows[0];
    
    const responseData = {
      success: true,
      message: {
        id: updatedMessage.id,
        todoId: updatedMessage.todo_id,
        userId: updatedMessage.user_id,
        content: updatedMessage.content,
        messageType: updatedMessage.message_type,
        createdAt: updatedMessage.created_at,
        updatedAt: updatedMessage.updated_at,
        isEdited: updatedMessage.is_edited,
        editCount: updatedMessage.edit_count,
        user: {
          id: updatedMessage.user_id,
          name: user.name,
          avatar: user.avatar,
          email: user.email
        }
      }
    };
    
    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`todo:${todoId}`).emit('messageEdited', responseData.message);
    }
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Error editing chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Error editing chat message'
    });
  }
});

// Pin a chat message
router.post('/groups/:groupId/todos/:todoId/chat/:messageId/pin', auth, async (req, res) => {
  try {
    const { groupId, todoId, messageId } = req.params;
    
    // Check if user is member of the group
    const memberQuery = `
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Check if user can pin messages (admin/moderator or message owner)
    const member = memberResult.rows[0];
    const messageQuery = `
      SELECT user_id FROM group_todo_chat WHERE id = $1
    `;
    
    const messageResult = await pool.query(messageQuery, [parseInt(messageId)]);
    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    const message = messageResult.rows[0];
    if (message.user_id !== req.user.id && member.role !== 'admin' && member.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'You can only pin your own messages or need admin/moderator role'
      });
    }
    
    // Check if message is already pinned
    const pinnedQuery = `
      SELECT * FROM pinned_messages WHERE "messageId" = $1
    `;
    
    const pinnedResult = await pool.query(pinnedQuery, [parseInt(messageId)]);
    if (pinnedResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is already pinned'
      });
    }
    
    // Pin the message
    const pinQuery = `
      INSERT INTO pinned_messages ("messageId", "roomId", "pinnedBy", "pinnedAt")
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    
    const pinResult = await pool.query(pinQuery, [parseInt(messageId), parseInt(todoId), req.user.id]);
    
    // Update message is_pinned status
    await pool.query(`
      UPDATE group_todo_chat SET is_pinned = true WHERE id = $1
    `, [parseInt(messageId)]);
    
    res.json({
      success: true,
      message: 'Message pinned successfully',
      pinnedMessage: pinResult.rows[0]
    });
    
  } catch (error) {
    console.error('Error pinning chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Error pinning chat message'
    });
  }
});

// Forward a chat message
router.post('/groups/:groupId/todos/:todoId/chat/:messageId/forward', auth, async (req, res) => {
  try {
    const { groupId, todoId, messageId } = req.params;
    const { targetTodoId } = req.body;
    
    if (!targetTodoId) {
      return res.status(400).json({
        success: false,
        message: 'Target todo ID is required'
      });
    }
    
    // Check if user is member of the source group
    const memberQuery = `
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Get the original message
    const messageQuery = `
      SELECT gtc.*, u.name as user_name, u.avatar as user_avatar
      FROM group_todo_chat gtc
      JOIN users u ON gtc.user_id = u.id
      WHERE gtc.id = $1
    `;
    
    const messageResult = await pool.query(messageQuery, [parseInt(messageId)]);
    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    const originalMessage = messageResult.rows[0];
    
    // Check if target todo exists and user has access
    const targetTodoQuery = `
      SELECT gt.*, g.id as group_id, g.name as group_name
      FROM group_todos gt
      JOIN groups g ON gt.group_id = g.id
      WHERE gt.id = $1
    `;
    
    const targetTodoResult = await pool.query(targetTodoQuery, [parseInt(targetTodoId)]);
    if (targetTodoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Target todo not found'
      });
    }
    
    const targetTodo = targetTodoResult.rows[0];
    
    // Check if user is member of target group
    const targetMemberQuery = `
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const targetMemberResult = await pool.query(targetMemberQuery, [targetTodo.group_id, req.user.id]);
    if (targetMemberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to the target todo'
      });
    }
    
    // Create forwarded message
    const forwardQuery = `
      INSERT INTO group_todo_chat (todo_id, user_id, content, message_type, is_forwarded, forward_from, created_at)
      VALUES ($1, $2, $3, $4, true, $5, NOW())
      RETURNING *
    `;
    
    const forwardData = {
      messageId: originalMessage.id,
      todoId: originalMessage.todo_id,
      groupId: parseInt(groupId),
      groupName: targetTodo.group_name,
      sender: {
        id: originalMessage.user_id,
        name: originalMessage.user_name,
        avatar: originalMessage.user_avatar
      },
      forwardedAt: new Date()
    };
    
    const forwardResult = await pool.query(forwardQuery, [
      parseInt(targetTodoId),
      req.user.id,
      originalMessage.content,
      originalMessage.message_type || 'text',
      JSON.stringify(forwardData)
    ]);
    
    const forwardedMessage = forwardResult.rows[0];
    
    // Get user info for response
    const userQuery = `
      SELECT name, avatar, email FROM users WHERE id = $1
    `;
    
    const userResult = await pool.query(userQuery, [req.user.id]);
    const user = userResult.rows[0];
    
    const responseData = {
      success: true,
      message: {
        id: forwardedMessage.id,
        todoId: forwardedMessage.todo_id,
        userId: forwardedMessage.user_id,
        content: forwardedMessage.content,
        messageType: forwardedMessage.message_type,
        createdAt: forwardedMessage.created_at,
        isForwarded: forwardedMessage.is_forwarded,
        forwardFrom: JSON.parse(forwardedMessage.forward_from),
        user: {
          id: forwardedMessage.user_id,
          name: user.name,
          avatar: user.avatar,
          email: user.email
        }
      }
    };
    
    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`todo:${targetTodoId}`).emit('newTodoMessage', responseData.message);
    }
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Error forwarding chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Error forwarding chat message'
    });
  }
});

// Add reaction to a chat message
router.post('/groups/:groupId/todos/:todoId/chat/:messageId/reactions', auth, async (req, res) => {
  try {
    const { groupId, todoId, messageId } = req.params;
    const { reaction } = req.body;
    
    if (!reaction) {
      return res.status(400).json({
        success: false,
        message: 'Reaction is required'
      });
    }
    
    // Check if user is member of the group
    const memberQuery = `
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const memberResult = await pool.query(memberQuery, [parseInt(groupId), req.user.id]);
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Check if message exists
    const messageQuery = `
      SELECT * FROM group_todo_chat WHERE id = $1
    `;
    
    const messageResult = await pool.query(messageQuery, [parseInt(messageId)]);
    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user already reacted with this reaction
    const existingReactionQuery = `
      SELECT * FROM message_reactions 
      WHERE "messageId" = $1 AND "userId" = $2 AND emoji = $3
    `;
    
    const existingReactionResult = await pool.query(existingReactionQuery, [
      parseInt(messageId), req.user.id, reaction
    ]);
    
    if (existingReactionResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already reacted with this emoji'
      });
    }
    
    // Add reaction
    const reactionQuery = `
      INSERT INTO message_reactions ("messageId", "userId", emoji, "createdAt")
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    
    const reactionResult = await pool.query(reactionQuery, [
      parseInt(messageId), req.user.id, reaction
    ]);
    
    // Get updated reactions count
    const reactionsQuery = `
      SELECT emoji, COUNT(*) as count
      FROM message_reactions 
      WHERE "messageId" = $1
      GROUP BY emoji
    `;
    
    const reactionsResult = await pool.query(reactionsQuery, [parseInt(messageId)]);
    const reactions = {};
    reactionsResult.rows.forEach(row => {
      reactions[row.emoji] = parseInt(row.count);
    });
    
    // Update message reactions
    await pool.query(`
      UPDATE group_todo_chat 
      SET reactions = $1 
      WHERE id = $2
    `, [JSON.stringify(reactions), parseInt(messageId)]);
    
    res.json({
      success: true,
      message: 'Reaction added successfully',
      reaction: reactionResult.rows[0],
      reactions
    });
    
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reaction'
    });
  }
});

module.exports = router; 