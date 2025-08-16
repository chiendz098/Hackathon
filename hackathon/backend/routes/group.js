const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Group, User, Thread, GroupMembers, GroupInvitation, Notification } = require('../models');
const config = require('../config');

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

// Lấy danh sách nhóm của user
router.get('/', auth, async (req, res) => {
  const user = await User.findByPk(req.userId, { include: { model: Group, as: 'groups' } });
  res.json(user ? user.groups : []);
});

// Tạo nhóm mới
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, isPrivate, maxMembers, todoSettings } = req.body;
    
    // Generate invite code
    const inviteCode = 'GRP' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const group = await Group.create({ 
      name,
      description,
      category,
      isPrivate: isPrivate || false,
      maxMembers: maxMembers || 50,
      todoSettings: todoSettings || {},
      inviteCode,
      createdBy: req.userId
    });
    
    // Add creator as admin
    await GroupMembers.create({
      groupId: group.id,
      userId: req.userId,
      role: 'admin',
      permissions: {
        canInvite: true,
        canKick: true,
        canModerate: true,
        canCreateTodos: true,
        canEditTodos: true,
        canDeleteTodos: true,
        canAssign: true
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating group'
    });
  }
});

// Mời thành viên vào nhóm
router.post('/:id/invite', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIds, message, role, permissions } = req.body;
    
    // Check if user can invite
    const canInvite = await checkGroupPermission(groupId, req.userId, 'canInvite');
    if (!canInvite) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to invite members'
      });
    }
    
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check group capacity
    const currentMembers = await GroupMembers.count({
      where: { groupId, isActive: true }
    });
    
    if (currentMembers + userIds.length > group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Group is at maximum capacity'
      });
    }
    
    const invitations = [];
    
    for (const userId of userIds) {
      // Check if user is already a member
      const existingMember = await GroupMembers.findOne({
        where: { groupId, userId, isActive: true }
      });
      
      if (existingMember) {
        continue; // Skip if already member
      }
      
      // Check if invitation already exists
      const existingInvite = await GroupInvitation.findOne({
        where: { groupId, invitedUserId: userId, status: 'pending' }
      });
      
      if (existingInvite) {
        continue; // Skip if invitation already exists
      }
      
      // Create invitation
      const invitation = await GroupInvitation.create({
        groupId,
        invitedUserId: userId,
        invitedBy: req.userId,
        message: message || `You are invited to join ${group.name}`,
        role: role || 'member',
        permissions: permissions || {
          canCreateTodos: true,
          canEditTodos: true,
          canDeleteTodos: false,
          canAssign: false,
          canInvite: false
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      
      invitations.push(invitation);
      
      // Send notification
      await Notification.create({
        userId,
        type: 'group_invitation',
        title: 'Group Invitation',
        message: `You are invited to join ${group.name}`,
        data: {
          groupId,
          invitationId: invitation.id,
          invitedBy: req.userId
        },
        isRead: false
      });
    }
    
    res.json({
      success: true,
      message: `${invitations.length} invitation(s) sent successfully`,
      invitations
    });
  } catch (error) {
    console.error('Error inviting members:', error);
    res.status(500).json({
      success: false,
      message: 'Error inviting members'
    });
  }
});

// Accept/Decline group invitation
router.post('/invite/:invitationId/respond', auth, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { response, message } = req.body; // response: 'accepted' or 'declined'
    
    const invitation = await GroupInvitation.findOne({
      where: { 
        id: invitationId,
        invitedUserId: req.userId,
        status: 'pending'
      },
      include: [{ model: Group, as: 'group' }]
    });
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or expired'
      });
    }
    
    if (response === 'accepted') {
      // Check group capacity
      const currentMembers = await GroupMembers.count({
        where: { groupId: invitation.groupId, isActive: true }
      });
      
      if (currentMembers >= invitation.group.maxMembers) {
        return res.status(400).json({
          success: false,
          message: 'Group is at maximum capacity'
        });
      }
      
      // Add user to group
      await GroupMembers.create({
        groupId: invitation.groupId,
        userId: req.userId,
        role: invitation.role,
        permissions: invitation.permissions
      });
      
      // Update invitation status
      await invitation.update({
        status: 'accepted',
        respondedAt: new Date()
      });
      
      res.json({
        success: true,
        message: 'Successfully joined the group',
        group: invitation.group
      });
    } else if (response === 'declined') {
      await invitation.update({
        status: 'declined',
        respondedAt: new Date()
      });
      
      res.json({
        success: true,
        message: 'Invitation declined'
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

// Get pending invitations for user
router.get('/invitations/pending', auth, async (req, res) => {
  try {
    const invitations = await GroupInvitation.findAll({
      where: { 
        invitedUserId: req.userId,
        status: 'pending'
      },
      include: [
        {
          model: Group,
          as: 'group',
          attributes: ['id', 'name', 'description', 'category']
        },
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'name', 'avatar']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      invitations
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitations'
    });
  }
});

// Xóa thành viên khỏi nhóm
router.post('/:id/remove', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
  const { userId } = req.body;
    
    // Check if user can kick members
    const canKick = await checkGroupPermission(groupId, req.userId, 'canKick');
    if (!canKick) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove members'
      });
    }
    
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Cannot remove group creator
    if (group.createdBy === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group creator'
      });
    }
    
    // Remove member
    await GroupMembers.update(
      { isActive: false },
      { where: { groupId, userId } }
    );
    
    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member'
    });
  }
});

// Get group members
router.get('/:id/members', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const members = await GroupMembers.findAll({
      where: { groupId, isActive: true },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar', 'email']
        }
      ],
      order: [['joinedAt', 'ASC']]
    });
    
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

// Get group details with todos
router.get('/:id', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findByPk(groupId, {
      include: [
        {
          model: Todo,
          as: 'todos',
          where: { todoType: 'group' },
          required: false,
          include: [
            {
              model: TodoAssignment,
              as: 'assignments',
              include: [
                {
                  model: User,
                  as: 'assignee',
                  attributes: ['id', 'name', 'avatar']
                }
              ]
            }
          ]
        },
        {
          model: GroupMembers,
          as: 'groupMembers',
          where: { isActive: true },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'avatar']
            }
          ]
        }
      ]
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    res.json({
      success: true,
      group
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group'
    });
  }
});

// Helper function to check group permissions
const checkGroupPermission = async (groupId, userId, requiredPermission) => {
  const member = await GroupMembers.findOne({
    where: { groupId, userId, isActive: true }
  });
  
  if (!member) return false;
  
  if (member.role === 'admin') return true;
  if (member.role === 'moderator' && requiredPermission !== 'admin') return true;
  
  return member.permissions?.[requiredPermission] || false;
};

module.exports = router; 