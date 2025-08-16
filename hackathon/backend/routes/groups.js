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

// Get all groups (with member count and basic info)
router.get('/', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        g.id,
        g.name,
        g.description,
        g.category,
        g."createdBy" as created_by,
        g.is_active,
        g.settings,
        g."createdAt" as createdAt,
        g."updatedAt" as updated_at,
        COUNT(gm.user_id) as member_count,
        u.username as creator_name
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.status = 'active'
      LEFT JOIN users u ON g."createdBy" = u.id
      WHERE g.is_active = true
      GROUP BY g.id, g.name, g.description, g.category, g."createdBy", g.is_active, g.settings, g."createdAt", g."updatedAt", u.username
      ORDER BY g."createdAt" DESC
    `;
    
    const result = await client.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch groups',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get groups for current user (including accepted invitations)
router.get('/my-groups', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    
    // Get groups where user is a member
    const memberGroupsQuery = `
      SELECT 
        g.id,
        g.name,
        g.description,
        g.category,
        g."createdBy" as created_by,
        g.is_active,
        g.settings,
        g."createdAt" as createdAt,
        g."updatedAt" as updated_at,
        gm.role,
        gm.joined_at,
        gm.status as member_status,
        COUNT(gm2.user_id) as total_members,
        'member' as access_type
      FROM groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN group_members gm2 ON g.id = gm2.group_id AND gm2.status = 'active'
      WHERE gm.user_id = $1 AND g.is_active = true
      GROUP BY g.id, g.name, g.description, g.category, g."createdBy", g.is_active, g.settings, g."createdAt", g."updatedAt", gm.role, gm.joined_at, gm.status
    `;
    
    const memberGroupsResult = await client.query(memberGroupsQuery, [userId]);
    
    // Get groups where user has accepted invitation
    const acceptedInvitationsQuery = `
      SELECT 
        g.id,
        g.name,
        g.description,
        g.category,
        g."createdBy" as created_by,
        g.is_active,
        g.settings,
        g."createdAt" as createdAt,
        g."updatedAt" as updated_at,
        gi.role,
        gi."createdAt" as joined_at,
        'accepted' as member_status,
        COUNT(gm2.user_id) as total_members,
        'invitation' as access_type
      FROM groups g
      INNER JOIN group_invitations gi ON g.id = gi."groupId"
      LEFT JOIN group_members gm2 ON g.id = gm2.group_id AND gm2.status = 'active'
      WHERE gi."invitedUserId" = $1 AND gi.status = 'accepted' AND g.is_active = true
      GROUP BY g.id, g.name, g.description, g.category, g."createdBy", g.is_active, g.settings, g."createdAt", g."updatedAt", gi.role, gi."createdAt"
    `;
    
    const acceptedInvitationsResult = await client.query(acceptedInvitationsQuery, [userId]);
    
    // Combine results and remove duplicates (prioritize member over invitation)
    const memberGroupIds = new Set(memberGroupsResult.rows.map(row => row.id));
    
    // Create a map to store unique groups by ID
    const uniqueGroupsMap = new Map();
    
    // Add member groups first (they have priority)
    memberGroupsResult.rows.forEach(group => {
      uniqueGroupsMap.set(group.id, group);
    });
    
    // Add invitation groups only if not already a member
    acceptedInvitationsResult.rows.forEach(group => {
      if (!uniqueGroupsMap.has(group.id)) {
        uniqueGroupsMap.set(group.id, group);
      }
    });
    
    // Convert map to array and sort by creation date
    const uniqueGroups = Array.from(uniqueGroupsMap.values()).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    res.json({
      success: true,
      data: uniqueGroups
    });
    
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user groups',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Create a new group
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { name, description, category, settings, invites } = req.body;
    const userId = req.user.id;
    
    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and category are required'
      });
    }
    
    // Start transaction
    await client.query('BEGIN');
    
    // Create group with explicit timestamps
    const createGroupQuery = `
      INSERT INTO groups (name, description, category, "createdBy", is_active, settings, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    
    const groupResult = await client.query(createGroupQuery, [
      name,
      description,
      category,
      userId,
      true,
      JSON.stringify(settings || {})
    ]);
    
    const newGroup = groupResult.rows[0];
    
    // Add creator as admin member
    const addMemberQuery = `
      INSERT INTO group_members (group_id, user_id, role, joined_at, status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), $4, NOW(), NOW())
    `;
    
    await client.query(addMemberQuery, [
      newGroup.id,
      userId,
      'admin',
      'active'
    ]);
    
    // Handle invites if provided
    if (invites && (invites.emails || invites.selectedUsers)) {
      const { emails = [], selectedUsers = [], role = 'member', message = '' } = invites;
      
      // Process email invites
      for (const email of emails) {
        if (email.trim()) {
          // Find user by email
          const user = await client.query(`
            SELECT id FROM users WHERE email = $1
          `, [email.trim()]);
          
          if (user.rows.length > 0) {
            const invitedUserId = user.rows[0].id;
            
            // Check if user is already invited
                    const existingInvite = await client.query(`
          SELECT id FROM group_invitations 
          WHERE "groupId" = $1 AND "invitedUserId" = $2 AND status = 'pending'
        `, [newGroup.id, invitedUserId]);
            
            if (existingInvite.rows.length === 0) {
              // Create invitation
              const invitationResult = await client.query(`
                INSERT INTO group_invitations ("groupId", "invitedUserId", "invitedBy", role, message, status, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
                RETURNING id
              `, [newGroup.id, invitedUserId, userId, role, message]);
              
              // Create notification for the invited user
              await client.query(`
                INSERT INTO notifications ("userId", "type", "title", "message", "data", "isRead", "createdAt", "updatedAt")
                VALUES ($1, 'group_invitation', 'Group Invitation', $2, $3, false, NOW(), NOW())
              `, [
                invitedUserId,
                `You have been invited to join group: ${newGroup.name}`,
                JSON.stringify({
                  groupId: newGroup.id,
                  groupName: newGroup.name,
                  invitedBy: userId,
                  invitationId: invitationResult.rows[0].id
                })
              ]);
            }
          }
        }
      }
      
      // Process selected user invites
      for (const selectedUserId of selectedUsers) {
        // Check if user is already invited
        const existingInvite = await client.query(`
          SELECT id FROM group_invitations 
          WHERE "groupId" = $1 AND "invitedUserId" = $2 AND status = 'pending'
        `, [newGroup.id, selectedUserId]);
        
        if (existingInvite.rows.length === 0) {
          // Create invitation
          const invitationResult = await client.query(`
            INSERT INTO group_invitations ("groupId", "invitedUserId", "invitedBy", role, message, status, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
            RETURNING id
          `, [newGroup.id, selectedUserId, userId, role, message]);
          
          // Create notification for the invited user
          await client.query(`
            INSERT INTO notifications ("userId", "type", "title", "message", "data", "isRead", "createdAt", "updatedAt")
            VALUES ($1, 'group_invitation', 'Group Invitation', $2, $3, false, NOW(), NOW())
          `, [
            selectedUserId,
            `You have been invited to join group: ${newGroup.name}`,
            JSON.stringify({
              groupId: newGroup.id,
              groupName: newGroup.name,
              invitedBy: userId,
              invitationId: invitationResult.rows[0].id
            })
          ]);
        }
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: {
        group: newGroup
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get group details
router.get('/:groupId', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { groupId } = req.params;
    
    // Validate groupId
    if (!groupId || isNaN(parseInt(groupId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }
    
    const query = `
      SELECT 
        g.*,
        COUNT(gm.user_id) as member_count,
        u.username as creator_name
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.status = 'active'
      LEFT JOIN users u ON g."createdBy" = u.id
      WHERE g.id = $1 AND g.is_active = true
      GROUP BY g.id, g.name, g.description, g.category, g."createdBy", g.is_active, g.settings, g."createdAt", g."updatedAt", u.username
    `;
    
    const result = await client.query(query, [groupId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Update group
router.put('/:groupId', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { groupId } = req.params;
    
    // Validate groupId
    if (!groupId || isNaN(parseInt(groupId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }
    const { name, description, category, settings } = req.body;
    const userId = req.user.id;
    
    // Check if user is group leader or admin
    const memberCheck = await client.query(`
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND status = 'active'
    `, [groupId, userId]);
    
    if (memberCheck.rows.length === 0 || 
        (memberCheck.rows[0].role !== 'leader' && memberCheck.rows[0].role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only group leaders and admins can update groups'
      });
    }
    
    const updateQuery = `
      UPDATE groups 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          category = COALESCE($3, category),
          settings = COALESCE($4, settings),
          "updatedAt" = NOW()
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [
      name, description, category, 
      settings ? JSON.stringify(settings) : null,
      groupId
    ]);
    
    res.json({
      success: true,
      message: 'Group updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Delete group (soft delete)
router.delete('/:groupId', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { groupId } = req.params;
    
    // Validate groupId
    if (!groupId || isNaN(parseInt(groupId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }
    const userId = req.user.id;
    
    // Check if user is group leader
    const memberCheck = await client.query(`
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND status = 'active'
    `, [groupId, userId]);
    
    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'leader') {
      return res.status(403).json({
        success: false,
        message: 'Only group leaders can delete groups'
      });
    }
    
    // Soft delete
    await client.query(`
      UPDATE groups SET is_active = false, "updatedAt" = NOW() WHERE id = $1
    `, [groupId]);
    
    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete group',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get group members
router.get('/:groupId/members', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { groupId } = req.params;
    
    const query = `
      SELECT 
        gm.id,
        gm.user_id,
        gm.role,
        gm.joined_at,
        gm.status,
        u.username,
        u.name,
        u.email,
        u.avatar,
        u.level,
        u.xp
      FROM group_members gm
      INNER JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1 AND gm.status = 'active'
      ORDER BY 
        CASE gm.role 
          WHEN 'leader' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'moderator' THEN 3 
          ELSE 4 
        END,
        gm.joined_at ASC
    `;
    
    const result = await client.query(query, [groupId]);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group members',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Add member to group
router.post('/:groupId/members', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { groupId } = req.params;
    
    // Validate groupId
    if (!groupId || isNaN(parseInt(groupId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }
    const { userId, role = 'member' } = req.body;
    const currentUserId = req.user.id;
    
    // Check if current user can add members
    const currentUserRole = await client.query(`
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND status = 'active'
    `, [groupId, currentUserId]);
    
    if (currentUserRole.rows.length === 0 || 
        (currentUserRole.rows[0].role !== 'leader' && currentUserRole.rows[0].role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only group leaders and admins can add members'
      });
    }
    
    // Check if user is already a member
    const existingMember = await client.query(`
      SELECT id FROM group_members 
      WHERE group_id = $1 AND user_id = $2
    `, [groupId, userId]);
    
    if (existingMember.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this group'
      });
    }
    
    // Add member
    await client.query(`
      INSERT INTO group_members (group_id, user_id, role, joined_at, status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), 'active', NOW(), NOW())
    `, [groupId, userId, role]);
    
    res.json({
      success: true,
      message: 'Member added successfully'
    });
    
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add member',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Remove member from group
router.delete('/:groupId/members/:userId', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { groupId, userId } = req.params;
    const currentUserId = req.user.id;
    
    // Check if current user can remove members
    const currentUserRole = await client.query(`
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND status = 'active'
    `, [groupId, currentUserId]);
    
    if (currentUserRole.rows.length === 0 || 
        (currentUserRole.rows[0].role !== 'leader' && currentUserRole.rows[0].role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only group leaders and admins can remove members'
      });
    }
    
    // Check if trying to remove leader
    const memberRole = await client.query(`
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND status = 'active'
    `, [groupId, userId]);
    
    if (memberRole.rows.length > 0 && memberRole.rows[0].role === 'leader') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group leader'
      });
    }
    
    // Remove member
    await client.query(`
      UPDATE group_members 
              SET status = 'inactive', "updatedAt" = NOW() 
      WHERE group_id = $1 AND user_id = $2
    `, [groupId, userId]);
    
    res.json({
      success: true,
      message: 'Member removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get available users to invite (not already in group)
router.get('/:groupId/available-users', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { groupId } = req.params;
    const { search } = req.query;
    
    // Check if current user can invite members
    const currentUserRole = await client.query(`
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND status = 'active'
    `, [groupId, req.user.id]);
    
    if (currentUserRole.rows.length === 0 || 
        (currentUserRole.rows[0].role !== 'leader' && currentUserRole.rows[0].role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only group leaders and admins can invite members'
      });
    }
    
    // Get users not already in the group (only those with valid usernames and emails)
    let query = `
      SELECT u.id, u.username, u.name, u.avatar, u.email
      FROM users u
      WHERE u.id NOT IN (
        SELECT gm.user_id 
        FROM group_members gm 
        WHERE gm.group_id = $1 AND gm.status = 'active'
      )
      AND u.username IS NOT NULL 
      AND u.email IS NOT NULL
      AND u.username != ''
      AND u.email != ''
    `;
    
    const params = [groupId];
    
    if (search) {
      query += ` AND (COALESCE(u.username, '') ILIKE $2 OR u.name ILIKE $2 OR u.email ILIKE $2)`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY u.name LIMIT 50`;
    
    const result = await client.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available users',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Invite users to group by email
router.post('/:groupId/invite', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { groupId } = req.params;
    const { emails, role = 'member', message = '' } = req.body;
    const currentUserId = req.user.id;
    
    // Check if current user can invite members
    const currentUserRole = await client.query(`
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND status = 'active'
    `, [groupId, currentUserId]);
    
    if (currentUserRole.rows.length === 0 || 
        (currentUserRole.rows[0].role !== 'leader' && currentUserRole.rows[0].role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only group leaders and admins can invite members'
      });
    }
    
    // Get group info
    const groupInfo = await client.query(`
      SELECT name FROM groups WHERE id = $1
    `, [groupId]);
    
    if (groupInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    const groupName = groupInfo.rows[0].name;
    const invitedUsers = [];
    
    for (const email of emails) {
      // Find user by email
      const user = await client.query(`
        SELECT id, username, name FROM users WHERE email = $1
      `, [email]);
      
      if (user.rows.length > 0) {
        const userId = user.rows[0].id;
        
        // Check if user is already a member
        const existingMember = await client.query(`
          SELECT id FROM group_members 
          WHERE group_id = $1 AND user_id = $2
        `, [groupId, userId]);
        
        if (existingMember.rows.length === 0) {
          // Create invitation using the correct column names
          const invitationResult = await client.query(`
            INSERT INTO group_invitations ("groupId", "invitedUserId", "invitedBy", role, message, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING id
          `, [groupId, userId, currentUserId, role, message]);
          
          // Create notification for the invited user
          await client.query(`
            INSERT INTO notifications ("userId", "type", "title", "message", "data", "isRead", "createdAt", "updatedAt")
            VALUES ($1, 'group_invitation', 'Group Invitation', $2, $3, false, NOW(), NOW())
          `, [
            userId,
            `You have been invited to join group: ${groupName}`,
            JSON.stringify({
              groupId: groupId,
              groupName: groupName,
              invitedBy: currentUserId,
              invitationId: invitationResult.rows[0].id
            })
          ]);
          
          invitedUsers.push({
            email,
            username: user.rows[0].username,
            name: user.rows[0].name,
            status: 'invited'
          });
        } else {
          invitedUsers.push({
            email,
            username: user.rows[0].username,
            name: user.rows[0].name,
            status: 'already_member'
          });
        }
      } else {
        invitedUsers.push({
          email,
          status: 'user_not_found'
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Invitations sent successfully',
      data: invitedUsers
    });
    
  } catch (error) {
    console.error('Error sending invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitations',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get pending invitations for a group
router.get('/:groupId/invitations', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { groupId } = req.params;
    
    // Check if current user is member of the group
    const isMember = await client.query(`
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND status = 'active'
    `, [groupId, req.user.id]);
    
    if (isMember.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Get pending invitations using the correct column names
    const invitations = await client.query(`
      SELECT 
        gi.id,
        gi.role,
        gi.message,
        gi."createdAt",
        gi.status,
        u.username,
        u.name,
        u.avatar,
        u.email,
        inviter.username as inviter_username,
        inviter.name as inviter_name
      FROM group_invitations gi
      LEFT JOIN users u ON gi."invitedUserId" = u.id
      LEFT JOIN users inviter ON gi."invitedBy" = inviter.id
      WHERE gi."groupId" = $1 AND gi.status = 'pending'
      ORDER BY gi."createdAt" DESC
    `, [groupId]);
    
    res.json({
      success: true,
      data: invitations.rows
    });
    
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitations',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Accept/Reject group invitation
router.post('/:groupId/invitations/:invitationId/respond', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { groupId, invitationId } = req.params;
    const { response } = req.body; // 'accept' or 'reject'
    const userId = req.user.id;
    
    // Get invitation using the correct column names
    const invitation = await client.query(`
      SELECT * FROM group_invitations 
      WHERE id = $1 AND "invitedUserId" = $2 AND "groupId" = $3 AND status = 'pending'
    `, [invitationId, userId, groupId]);
    
    if (invitation.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    if (response === 'accept') {
      // Add user to group
      await client.query(`
        INSERT INTO group_members (
          group_id, user_id, role, joined_at, status, 
          "createdAt", "updatedAt", is_active, permissions
        )
        VALUES (
          $1, $2, $3, NOW(), 'active', 
          NOW(), NOW(), true, 
          '{"canKick": false, "canAssign": false, "canInvite": false, "canModerate": false, "canEditTodos": true, "canCreateTodos": true, "canDeleteTodos": false}'::json
        )
      `, [groupId, userId, invitation.rows[0].role]);
      
      // Update invitation status
      await client.query(`
        UPDATE group_invitations SET status = 'accepted' WHERE id = $1
      `, [invitationId]);
      
      res.json({
        success: true,
        message: 'Invitation accepted successfully'
      });
    } else if (response === 'reject') {
      // Update invitation status
      await client.query(`
        UPDATE group_invitations SET status = 'rejected' WHERE id = $1
      `, [invitationId]);
      
      res.json({
        success: true,
        message: 'Invitation rejected successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid response. Must be "accept" or "reject"'
      });
    }
    
  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to invitation',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get group invite link
router.get('/:groupId/invite-link', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { groupId } = req.params;
    
    // Check if current user is member of the group
    const isMember = await client.query(`
      SELECT role FROM group_members 
      WHERE group_id = $1 AND user_id = $2 AND status = 'active'
    `, [groupId, req.user.id]);
    
    if (isMember.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Generate or get existing invite code
    let inviteCode = await client.query(`
      SELECT invite_code FROM groups WHERE id = $1
    `, [groupId]);
    
    if (!inviteCode.rows[0].invite_code) {
      // Generate new invite code
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await client.query(`
        UPDATE groups SET invite_code = $1 WHERE id = $2
      `, [newCode, groupId]);
      inviteCode = newCode;
    } else {
      inviteCode = inviteCode.rows[0].invite_code;
    }
    
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/groups/${groupId}/join?code=${inviteCode}`;
    
    res.json({
      success: true,
      data: {
        inviteCode,
        inviteLink
      }
    });
    
  } catch (error) {
    console.error('Error generating invite link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invite link',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Join group with invite code
router.post('/:groupId/join', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { groupId } = req.params;
    const { code } = req.body;
    const userId = req.user.id;
    
    // Verify invite code
    const group = await client.query(`
      SELECT id, name, invite_code FROM groups WHERE id = $1 AND is_active = true
    `, [groupId]);
    
    if (group.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    if (group.rows[0].invite_code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invite code'
      });
    }
    
    // Check if user is already a member
    const existingMember = await client.query(`
      SELECT id FROM group_members 
      WHERE group_id = $1 AND user_id = $2
    `, [groupId, userId]);
    
    if (existingMember.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }
    
    // Add user to group
    await client.query(`
      INSERT INTO group_members (group_id, user_id, role, joined_at, status)
      VALUES ($1, $2, $3, NOW(), 'active')
    `, [groupId, userId, 'member']);
    
    res.json({
      success: true,
      message: `Successfully joined ${group.rows[0].name}`,
      data: {
        groupId,
        groupName: group.rows[0].name
      }
    });
    
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join group',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router; 