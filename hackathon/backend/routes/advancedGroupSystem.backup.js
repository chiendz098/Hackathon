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
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this group'
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
    const notificationQuery = `
      INSERT INTO notifications (
        "userId", type, title, message, data, priority, "deliveryMethod", 
        "relatedEntityType", "relatedEntityId", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    `;
    
    await pool.query(notificationQuery, [
      targetUser.id, 'group_invitation',
      'Group Invitation',
      `You have been invited to join a group`,
      JSON.stringify({
        invitation_id: invitation.id,
        group_id: parseInt(group_id),
        inviter_id: req.user.id,
        role: role
      }),
      'normal', 
      JSON.stringify({ inApp: true, email: false, push: false, sms: false }), 
      'group', 
      parseInt(group_id)
    ]);
    
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
      deadline_from, deadline_to, created_by, sort_by = 'createdAt',
      sort_order = 'DESC', page = 1, limit = 20, view = 'list'
    } = req.query;
    
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
    
    const member = memberResult.rows[0];
    
    // Build complex query with joins
    let whereClause = 'WHERE gt.group_id = $1';
    let params = [parseInt(groupId)];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      whereClause += ` AND gt.status = $${paramCount}`;
      params.push(status);
    }
    
    if (priority) {
      paramCount++;
      whereClause += ` AND gt.priority = $${paramCount}`;
      params.push(priority);
    }
    
    if (category) {
      paramCount++;
      whereClause += ` AND gt.category = $${paramCount}`;
      params.push(category);
    }
    
    if (assignee) {
      paramCount++;
      whereClause += ` AND EXISTS (
        SELECT 1 FROM group_todo_assignments gta 
        WHERE gta.todo_id = gt.id AND gta.user_id = $${paramCount}
      )`;
      params.push(parseInt(assignee));
    }
    
    if (search) {
      paramCount++;
      whereClause += ` AND (
        gt.title ILIKE $${paramCount} OR 
        gt.description ILIKE $${paramCount} OR
        gt.tags::text ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }
    
    if (tags && tags.length > 0) {
      paramCount++;
      whereClause += ` AND gt.tags ? $${paramCount}::text`;
      params.push(tags[0]); // Support single tag for now
    }
    
    if (deadline_from) {
      paramCount++;
      whereClause += ` AND gt.deadline >= $${paramCount}`;
      params.push(deadline_from);
    }
    
    if (deadline_to) {
      paramCount++;
      whereClause += ` AND gt.deadline <= $${paramCount}`;
      params.push(deadline_to);
    }
    
    if (created_by) {
      paramCount++;
      whereClause += ` AND gt.created_by = $${paramCount}`;
      params.push(created_by);
    }
    
    const offset = (page - 1) * limit;
    
    // Main query with all related data
    const query = `
      SELECT 
        gt.*,
        u.name as creator_name, u.avatar as creator_avatar,
        u.email as creator_email,
        g.name as group_name,
        gta.user_id as assigned_user_id,
        gta.role as assignment_role,
        gta.status as assignment_status,
        gta.estimated_time as assignment_estimated_time,
        gta.due_date as assignment_due_date,
        gta.notes as assignment_notes,
        gtc.message_count,
        gtf.file_count,
        gtw.stage as workflow_stage,
        gtw.status as workflow_status
      FROM todos gt
      LEFT JOIN users u ON CASE 
        WHEN gt.created_by::text ~ '^[0-9]+$' THEN gt.created_by::integer = u.id 
        ELSE false 
      END
      LEFT JOIN groups g ON gt.group_id = g.id
      LEFT JOIN group_todo_assignments gta ON gt.id = gta.todo_id
      LEFT JOIN (
        SELECT todo_id, COUNT(*) as message_count 
        FROM group_todo_chat 
        GROUP BY todo_id
      ) gtc ON gt.id = gtc.todo_id
      LEFT JOIN (
        SELECT todo_id, COUNT(*) as file_count 
        FROM group_todo_files 
        GROUP BY todo_id
      ) gtf ON gt.id = gtf.todo_id
      LEFT JOIN group_todo_workflow gtw ON gt.id = gtw.todo_id
      ${whereClause}
      ORDER BY gt."${sort_by}" ${sort_order}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Group todos by ID and organize assignments
    const todosMap = new Map();
    result.rows.forEach(row => {
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
          workflow_stage: row.workflow_stage,
          kanban_column: row.kanban_column,
          sprint_id: row.sprint_id,
          story_points: row.story_points,
          risk_level: row.risk_level,
          created_at: row.createdAt,
          updated_at: row.updatedAt,
          creator: {
            id: parseInt(row.createdBy) || null,
            name: row.creator_name,
            avatar: row.creator_avatar,
            email: row.creator_email
          },
          group: {
            id: row.group_id,
            name: row.group_name
          },
          assignments: [],
          message_count: row.message_count || 0,
          file_count: row.file_count || 0,
          workflow_status: row.workflow_status
        });
      }
      
      if (row.assigned_user_id) {
        todosMap.get(row.id).assignments.push({
          userId: row.assigned_user_id,
          role: row.assignment_role,
          status: row.assignment_status,
          estimatedTime: row.assignment_estimated_time,
          dueDate: row.assignment_due_date,
          notes: row.assignment_notes
        });
      }
    });
    
    const todos = Array.from(todosMap.values());
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT gt.id)
      FROM todos gt
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
          AVG(progress) as avg_progress,
          AVG(estimated_time) as avg_estimated_time,
          AVG(actual_time) as avg_actual_time
        FROM todos 
        WHERE group_id = $1
      `;
      
      const analyticsResult = await pool.query(analyticsQuery, [parseInt(groupId)]);
      analytics = analyticsResult.rows[0];
    }
    
    res.json({
      success: true,
      todos,
      memberRole: member.role,
      permissions: member.permissions,
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
      acceptanceCriteria, dependencies, milestones, settings
    } = req.body;
    
    // Check if user can create todos in this group
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
    if (member.role !== 'admin' && !member.permissions?.canCreate) {
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
        INSERT INTO todos (
          title, description, "userId", "groupId", "createdBy", status, priority, category,
          deadline, estimated_time, subtasks, tags, is_public, allow_comments,
          allow_attachments, workflow_stage, kanban_column, sprint_id, story_points,
          risk_level, acceptance_criteria, dependencies, milestones, settings,
          createdAt, updatedAt
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW())
        RETURNING *
      `;
      
      const todoResult = await client.query(todoQuery, [
        title, description, req.user.id, groupId, req.user.id, 'pending', priority || 'medium',
        category, deadline, estimatedTime ? parseInt(estimatedTime) : null, subtasks || [], tags || [],
        isPublic !== false, allowComments !== false, allowAttachments !== false,
        workflowStage || 'planning', kanbanColumn || 'backlog', sprintId ? parseInt(sprintId) : null,
        storyPoints ? parseInt(storyPoints) : null, riskLevel || 'low', acceptanceCriteria || [],
        dependencies || [], milestones || [], settings || {}
      ]);
      
      const todo = todoResult.rows[0];
      
      // Create assignments for assigned members
      if (assignedTo && assignedTo.length > 0) {
        for (const assignment of assignedTo) {
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
              user_id, group_id, todo_id, notification_type, title, message, data,
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
            user_id, group_id, todo_id, notification_type, title, message, data,
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
        AND gi."expiresAt" > NOW()
      ORDER BY gi."groupId", gi."createdAt" DESC
    `;
    
    const result = await pool.query(query, [req.user.id]);
    
    res.json({
      success: true,
      invitations: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending invitations'
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
      WHERE "groupId" = $1 AND "userId" = $2
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
          "groupId", "userId", role, permissions, "joinedAt", "isActive", "createdAt", "updatedAt"
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
          COALESCE(t."assignedTo", 0) as "assignedTo",
          COALESCE(t."creatorId", 0) as "creatorId",
          COALESCE(t."groupId", 0) as "groupId",
          COALESCE(t."createdAt", NOW()) as "createdAt",
          COALESCE(t."updatedAt", NOW()) as "updatedAt",
          u.name as assigned_to_name,
          u.avatar as assigned_to_avatar,
          gm.role as user_role,
          '[]'::jsonb as assignments,
          '[]'::jsonb as attachments,
          0 as message_count,
          0 as file_count
        FROM todos t
        LEFT JOIN users u ON t."assignedTo" = u.id
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
            "groupId", "userId", role, permissions, "joinedAt", "isActive", "createdAt", "updatedAt"
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
              WHEN pg_typeof(t."assignedTo") IN ('json', 'jsonb') THEN NULL
              ELSE COALESCE(t."assignedTo", 0)
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

// Helper function to generate invite code
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = router; 