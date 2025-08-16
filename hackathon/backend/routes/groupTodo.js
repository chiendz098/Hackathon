const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { 
  Group, 
  User, 
  Todo, 
  GroupMembers, 
  GroupInvitation, 
  TodoAssignment,
  Notification 
} = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const config = require('../config');

// Helper function to check group permissions (member or accepted invitation)
const checkGroupPermission = async (groupId, userId, requiredPermission) => {
  const member = await GroupMembers.findOne({
    where: { groupId, userId, isActive: true }
  });
  
  if (member) {
    if (member.role === 'admin') return true;
    if (member.role === 'moderator' && requiredPermission !== 'admin') return true;
    return member.permissions?.[requiredPermission] || false;
  }
  
  // Check if user has accepted invitation
  const acceptedInvitation = await GroupInvitation.findOne({
    where: { 
      groupId, 
      invitedUserId: userId, 
      status: 'accepted' 
    }
  });
  
  if (acceptedInvitation) {
    if (acceptedInvitation.role === 'admin') return true;
    if (acceptedInvitation.role === 'moderator' && requiredPermission !== 'admin') return true;
    return acceptedInvitation.permissions?.[requiredPermission] || false;
  }
  
  return false;
};

// Get all group todos for current user
router.get('/groups/:groupId/todos', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check if user is member of the group OR has accepted invitation
    const isMember = await GroupMembers.findOne({
      where: { groupId, userId: req.user.id, isActive: true }
    });
    
    // If not a member, check if user has accepted invitation
    if (!isMember) {
      const acceptedInvitation = await GroupInvitation.findOne({
        where: { 
          groupId, 
          invitedUserId: req.user.id, 
          status: 'accepted' 
        }
      });
      
      if (!acceptedInvitation) {
        // Check if user has pending invitation
        const pendingInvitation = await GroupInvitation.findOne({
          where: { 
            groupId, 
            invitedUserId: req.user.id, 
            status: 'pending' 
          }
        });
        
        if (pendingInvitation) {
          return res.status(403).json({
            success: false,
            message: 'You have a pending invitation for this group. Please accept or decline the invitation first.',
            hasPendingInvitation: true,
            invitationId: pendingInvitation.id
          });
        } else {
          return res.status(403).json({
            success: false,
            message: 'You are not a member of this group and have no invitation'
          });
        }
      }
    }

    // Get todos using raw SQL
    const todosQuery = `
      SELECT 
        gt.*,
        u.name as creator_name, u.avatar as creator_avatar,
        g.name as group_name, g.description as group_description,
        gta.user_id as assigned_user_id,
        gta.role as assignment_role,
        gta.status as assignment_status
      FROM group_todos gt
      LEFT JOIN users u ON gt.created_by = u.id
      LEFT JOIN groups g ON gt.group_id = g.id
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
          category: row.category,
          priority: row.priority,
          status: row.status,
          deadline: row.deadline,
          estimated_time: row.estimated_time,
          subtasks: row.subtasks,
          tags: row.tags,
          is_public: row.is_public,
          allow_comments: row.allow_comments,
          allow_attachments: row.allow_attachments,
          workflow_stage: row.workflow_stage,
          kanban_column: row.kanban_column,
          created_at: row.created_at,
          updated_at: row.updated_at,
          creator: {
            id: row.created_by,
            name: row.creator_name,
            avatar: row.creator_avatar
          },
          group: {
            id: row.group_id,
            name: row.group_name,
            description: row.group_description
          },
          assignments: []
        });
      }
      
      // Add assignment if exists
      if (row.assigned_user_id) {
        const todo = todosMap.get(row.id);
        todo.assignments.push({
          user_id: row.assigned_user_id,
          role: row.assignment_role,
          status: row.assignment_status
        });
      }
    });
    
    const todos = Array.from(todosMap.values());

    // Determine user's role and permissions
    let userRole = 'member';
    let userPermissions = {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canAssign: false,
      canInvite: false
    };

    if (isMember) {
      userRole = isMember.role;
      userPermissions = isMember.permissions || userPermissions;
    } else {
      // User has accepted invitation but not yet a member
      const acceptedInvitation = await GroupInvitation.findOne({
        where: { 
          groupId, 
          invitedUserId: req.user.id, 
          status: 'accepted' 
        }
      });
      
      if (acceptedInvitation) {
        userRole = acceptedInvitation.role;
        userPermissions = acceptedInvitation.permissions || userPermissions;
      }
    }

    res.json({
      success: true,
      todos,
      groupInfo: {
        id: groupId,
        memberRole: userRole,
        permissions: userPermissions,
        isMember: !!isMember,
        hasAcceptedInvitation: !isMember && !!acceptedInvitation
      }
    });
  } catch (error) {
    console.error('Error fetching group todos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group todos'
    });
  }
});

// Get all group todos for current user across all groups
router.get('/user/groups/todos', auth, async (req, res) => {
  try {
    // Get all groups where user is a member
    const userGroups = await GroupMembers.findAll({
      where: { 
        userId: req.user.id, 
        isActive: true 
      },
      include: [
        {
          model: Group,
          as: 'group',
          attributes: ['id', 'name', 'description', 'category']
        }
      ]
    });

    // Get all groups where user has accepted invitation
    const acceptedInvitations = await GroupInvitation.findAll({
      where: { 
        invitedUserId: req.user.id, 
        status: 'accepted' 
      },
      include: [
        {
          model: Group,
          as: 'group',
          attributes: ['id', 'name', 'description', 'category']
        }
      ]
    });

    // Combine member groups and accepted invitation groups
    const memberGroupIds = userGroups.map(member => member.group.id);
    const invitationGroupIds = acceptedInvitations.map(invitation => invitation.group.id);
    const allGroupIds = [...new Set([...memberGroupIds, ...invitationGroupIds])];

    if (allGroupIds.length === 0) {
      return res.json({
        success: true,
        todos: [],
        groups: [],
        summary: {
          total: 0,
          groups: 0
        }
      });
    }

    // Get all todos from all user's groups
    const todos = await Todo.findAll({
      where: { 
        groupId: { [Op.in]: allGroupIds },
        todoType: 'group'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: Group,
          as: 'group',
          attributes: ['id', 'name', 'description', 'category']
        },
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
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group todos by group
    const todosByGroup = {};
    
    // Add member groups
    userGroups.forEach(member => {
      todosByGroup[member.group.id] = {
        group: member.group,
        todos: todos.filter(todo => todo.groupId === member.group.id),
        memberRole: member.role,
        permissions: member.permissions,
        isMember: true,
        hasAcceptedInvitation: false
      };
    });
    
    // Add accepted invitation groups
    acceptedInvitations.forEach(invitation => {
      if (!todosByGroup[invitation.group.id]) {
        todosByGroup[invitation.group.id] = {
          group: invitation.group,
          todos: todos.filter(todo => todo.groupId === invitation.group.id),
          memberRole: invitation.role,
          permissions: invitation.permissions || {
            canCreate: true,
            canEdit: true,
            canDelete: false,
            canAssign: false,
            canInvite: false
          },
          isMember: false,
          hasAcceptedInvitation: true
        };
      }
    });

    res.json({
      success: true,
      todos,
      todosByGroup,
      groups: [...userGroups.map(member => member.group), ...acceptedInvitations.map(invitation => invitation.group)],
      summary: {
        total: todos.length,
        groups: allGroupIds.length
      }
    });
  } catch (error) {
    console.error('Error fetching user group todos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user group todos'
    });
  }
});

// Create a new group todo
router.post('/groups/:groupId/todos', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const {
      title,
      description,
      category,
      priority,
      deadline,
      estimatedTime,
      assignedMembers,
      subtasks,
      groupSettings
    } = req.body;

    // Check if user can create todos in this group (member or accepted invitation)
    const isMember = await GroupMembers.findOne({
      where: { groupId, userId: req.user.id, isActive: true }
    });
    
    let canCreate = false;
    let userRole = 'member';
    let userPermissions = {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canAssign: false,
      canInvite: false
    };
    
    if (isMember) {
      canCreate = isMember.role === 'admin' || isMember.permissions?.canCreate || false;
      userRole = isMember.role;
      userPermissions = isMember.permissions || userPermissions;
    } else {
      // Check if user has accepted invitation
      const acceptedInvitation = await GroupInvitation.findOne({
        where: { 
          groupId, 
          invitedUserId: req.user.id, 
          status: 'accepted' 
        }
      });
      
      if (acceptedInvitation) {
        canCreate = acceptedInvitation.role === 'admin' || acceptedInvitation.permissions?.canCreate || false;
        userRole = acceptedInvitation.role;
        userPermissions = acceptedInvitation.permissions || userPermissions;
      }
    }
    
    if (!canCreate) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create todos in this group'
      });
    }

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    // Create the group todo using raw SQL
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
      category || 'study', deadline, estimatedTime, subtasks || [], [],
      true, true, true
    ]);
    
    const todo = todoResult.rows[0];

    // Create assignments for assigned members
    if (assignedMembers && assignedMembers.length > 0) {
      console.log('🔍 Debug: assignedMembers received:', JSON.stringify(assignedMembers, null, 2));
      console.log('🔍 Debug: todo.id:', todo.id);
      console.log('🔍 Debug: req.user.id:', req.user.id);
      
      const assignments = [];
      for (const member of assignedMembers) {
        console.log('🔍 Debug: Processing member:', JSON.stringify(member, null, 2));
        
        // Handle both object format and direct ID format
        let userId;
        if (typeof member === 'object' && member !== null) {
          userId = member.userId || member.id || member.user_id;
        } else if (typeof member === 'number' || typeof member === 'string') {
          userId = member;
        }
        
        if (!userId) {
          console.error('❌ Error: No valid userId found for member:', member);
          throw new Error(`Invalid member data: missing userId for member ${JSON.stringify(member)}`);
        }
        
        // Validate that the user exists
        console.log('🔍 Debug: Validating userId:', userId);
        
        // Check if user exists in the database
        const userExists = await User.findByPk(userId);
        if (!userExists) {
          console.error('❌ Error: User does not exist:', userId);
          throw new Error(`User with ID ${userId} does not exist`);
        }
        
        const assignment = {
          todoId: todo.id,
          assignedTo: userId,
          assignedBy: req.user.id,
          role: member.role || 'member',
          assignedTasks: member.assignedTasks || [],
          estimatedTime: member.estimatedTime,
          dueDate: member.dueDate,
          priority: member.priority || 'medium'
        };
        console.log('🔍 Debug: Created assignment object:', JSON.stringify(assignment, null, 2));
        assignments.push(assignment);
      }

      console.log('🔍 Debug: Creating assignments with raw SQL...');
      
      // Create assignments using raw SQL
      for (const assignment of assignments) {
        const assignmentQuery = `
          INSERT INTO group_todo_assignments (
            todo_id, user_id, assigned_by, role, estimated_time, due_date, notes,
            createdAt, updatedAt
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `;
        
        await pool.query(assignmentQuery, [
          assignment.todoId, assignment.assignedTo, assignment.assignedBy, 
          assignment.role, assignment.estimatedTime, assignment.dueDate, 
          JSON.stringify(assignment.assignedTasks)
        ]);
      }

      // Send notifications to assigned members
      for (const member of assignedMembers) {
        // Handle both object format and direct ID format for notifications
        let userId;
        if (typeof member === 'object' && member !== null) {
          userId = member.userId || member.id || member.user_id;
        } else if (typeof member === 'number' || typeof member === 'string') {
          userId = member;
        }
        
        if (userId) {
          try {
            const notificationQuery = `
              INSERT INTO group_todo_notifications (
                user_id, group_id, todo_id, notification_type, title, message, data,
                priority, delivery_methods, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            `;
            
            await pool.query(notificationQuery, [
              userId, groupId, todo.id, 'todo_assigned',
              'New Task Assignment',
              `You have been assigned to: ${title}`,
              JSON.stringify({
                todoId: todo.id,
                groupId,
                assignedBy: req.user.id
              }),
              'high', JSON.stringify({ inApp: true, email: true, push: false, sms: false })
            ]);
          } catch (notificationError) {
            console.error('❌ Error creating notification:', notificationError.message);
            // Continue with todo creation even if notification fails
          }
        }
      }
    }

    // Get the created todo with associations
    const createdTodo = await Todo.findByPk(todo.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: Group,
          as: 'group',
          attributes: ['id', 'name', 'description']
        },
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
    });

    res.status(201).json({
      success: true,
      message: 'Group todo created successfully',
      todo: createdTodo
    });
  } catch (error) {
    console.error('Error creating group todo:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating group todo'
    });
  }
});

// Update group todo
router.put('/groups/:groupId/todos/:todoId', auth, async (req, res) => {
  try {
    const { groupId, todoId } = req.params;
    
    // Check if user can edit todos in this group
    const canEdit = await checkGroupPermission(groupId, req.user.id, 'canEdit');
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit todos in this group'
      });
    }

    const todo = await Todo.findOne({
      where: { 
        id: todoId,
        groupId,
        todoType: 'group'
      }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Group todo not found'
      });
    }

    const updatedTodo = await todo.update(req.body);

    res.json({
      success: true,
      message: 'Group todo updated successfully',
      todo: updatedTodo
    });
  } catch (error) {
    console.error('Error updating group todo:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating group todo'
    });
  }
});

// Delete group todo
router.delete('/groups/:groupId/todos/:todoId', auth, async (req, res) => {
  try {
    const { groupId, todoId } = req.params;
    
    // Check if user can delete todos in this group
    const canDelete = await checkGroupPermission(groupId, req.user.id, 'canDelete');
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete todos in this group'
      });
    }

    const todo = await Todo.findOne({
      where: { 
        id: todoId,
        groupId,
        todoType: 'group'
      }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Group todo not found'
      });
    }

    // Delete associated assignments
    await TodoAssignment.destroy({
      where: { todoId: todoId }
    });

    await todo.destroy();

    res.json({
      success: true,
      message: 'Group todo deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group todo:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting group todo'
    });
  }
});

// Assign members to group todo
router.post('/groups/:groupId/todos/:todoId/assign', auth, async (req, res) => {
  try {
    const { groupId, todoId } = req.params;
    const { assignments } = req.body; // Array of {userId, role, assignedTasks, estimatedTime, dueDate}

    // Check if user can assign tasks
    const canAssign = await checkGroupPermission(groupId, req.user.id, 'canAssign');
    if (!canAssign) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to assign tasks in this group'
      });
    }

    const todo = await Todo.findOne({
      where: { 
        id: todoId,
        groupId,
        todoType: 'group'
      }
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Group todo not found'
      });
    }

    // Remove existing assignments
    await TodoAssignment.destroy({
      where: { todoId: todoId }
    });

    // Create new assignments
    if (assignments && assignments.length > 0) {
      const newAssignments = assignments.map(assignment => ({
        todoId: todoId,
        assignedTo: assignment.userId,
        assignedBy: req.user.id,
        role: assignment.role || 'member',
        assignedTasks: assignment.assignedTasks || [],
        estimatedTime: assignment.estimatedTime,
        dueDate: assignment.dueDate,
        priority: assignment.priority || 'medium',
        status: 'pending'
      }));

      await TodoAssignment.bulkCreate(newAssignments);

      // Send notifications
      for (const assignment of assignments) {
        await Notification.create({
          userId: assignment.userId,
          type: 'todo_assignment',
          title: 'Task Assignment Updated',
          message: `Your assignment for "${todo.title}" has been updated`,
          data: {
            todoId,
            groupId,
            assignedBy: req.user.id
          },
          isRead: false
        });
      }
    }

    // Update group members in todo
    await todo.update({
      groupMembers: assignments || []
    });

    res.json({
      success: true,
      message: 'Members assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning members:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning members'
    });
  }
});

// Update assignment progress
router.patch('/groups/:groupId/todos/:todoId/assignment/:assignmentId', auth, async (req, res) => {
  try {
    const { groupId, todoId, assignmentId } = req.params;
    const { progress, status, notes, actualTime } = req.body;

    const assignment = await TodoAssignment.findOne({
      where: { 
        id: assignmentId,
        todoId: todoId,
        assignedTo: req.user.id
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const updateData = {};
    if (progress !== undefined) updateData.progress = progress;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (actualTime !== undefined) updateData.actualTime = actualTime;

    if (status === 'in_progress' && !assignment.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const updatedAssignment = await assignment.update(updateData);

    // Update overall group progress
    const todo = await Todo.findByPk(todoId);
    const allAssignments = await TodoAssignment.findAll({
      where: { todoId: todoId }
    });

    const totalProgress = allAssignments.reduce((sum, ass) => sum + (ass.progress || 0), 0);
    const averageProgress = allAssignments.length > 0 ? Math.round(totalProgress / allAssignments.length) : 0;

    await todo.update({
      groupProgress: averageProgress
    });

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment: updatedAssignment,
      groupProgress: averageProgress
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment'
    });
  }
});

// Accept/Decline assignment
router.post('/groups/:groupId/todos/:todoId/assignment/:assignmentId/respond', auth, async (req, res) => {
  try {
    const { groupId, todoId, assignmentId } = req.params;
    const { response, reason } = req.body; // response: 'accepted' or 'declined'

    const assignment = await TodoAssignment.findOne({
      where: { 
        id: assignmentId,
        todoId: todoId,
        assignedTo: req.user.id
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (response === 'accepted') {
      await assignment.update({
        isAccepted: true,
        acceptedAt: new Date(),
        status: 'pending'
      });
    } else if (response === 'declined') {
      await assignment.update({
        isAccepted: false,
        declinedAt: new Date(),
        declineReason: reason,
        status: 'declined'
      });
    }

    res.json({
      success: true,
      message: `Assignment ${response} successfully`
    });
  } catch (error) {
    console.error('Error responding to assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to assignment'
    });
  }
});

// Get group todo analytics
router.get('/groups/:groupId/todos/analytics', auth, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if user is member
    const isMember = await GroupMembers.findOne({
      where: { groupId, userId: req.user.id, isActive: true }
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    const todos = await Todo.findAll({
      where: { 
        groupId,
        todoType: 'group'
      },
      include: [
        {
          model: TodoAssignment,
          as: 'assignments'
        }
      ]
    });

    const analytics = {
      totalTodos: todos.length,
      completedTodos: todos.filter(t => t.status === 'completed').length,
      inProgressTodos: todos.filter(t => t.status === 'in_progress').length,
      pendingTodos: todos.filter(t => t.status === 'pending').length,
      overdueTodos: todos.filter(t => {
        return t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed';
      }).length,
      averageProgress: todos.length > 0 ? 
        Math.round(todos.reduce((sum, t) => sum + (t.groupProgress || 0), 0) / todos.length) : 0,
      memberStats: {},
      priorityDistribution: {
        high: todos.filter(t => t.priority === 'high').length,
        medium: todos.filter(t => t.priority === 'medium').length,
        low: todos.filter(t => t.priority === 'low').length
      }
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error fetching group analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group analytics'
    });
  }
});

module.exports = router; 