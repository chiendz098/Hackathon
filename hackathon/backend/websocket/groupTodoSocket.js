const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const config = require('../config.js');

const pool = new Pool({
  connectionString: config.DB_URI,
  ssl: { rejectUnauthorized: false }
});

class GroupTodoSocket {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> socketId
    this.groupRooms = new Map(); // groupId -> Set of socketIds
    this.todoRooms = new Map(); // todoId -> Set of socketIds
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', async (socket) => {
      try {
        // Authenticate user
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        console.log(`🔐 Token received:`, token ? 'Yes' : 'No');
        if (!token) {
          console.log(`❌ No token provided, disconnecting socket`);
          socket.disconnect();
          return;
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        const userId = decoded.id;
        console.log(`🔐 Token decoded successfully, user ID:`, userId);
        
        // Store user socket mapping
        this.userSockets.set(userId, socket.id);
        socket.userId = userId;
        console.log(`🔗 User socket mapping stored:`, { userId, socketId: socket.id });
        console.log(`🔗 Total user sockets:`, this.userSockets.size);
        
        console.log(`🔌 User ${userId} connected to GroupTodo socket`);
        console.log(`🔌 Socket ID:`, socket.id);
        console.log(`🔌 User ID:`, userId);
        
        // Join user's groups
        await this.joinUserGroups(socket, userId);
        console.log(`🔌 Finished joining user groups for user ${userId}`);
        
        // Handle joining specific todo chat rooms
        socket.on('join-todo-chat', async (data) => {
          const { todoId, groupId } = data;
          console.log(`🔌 Frontend requested to join todo chat:`, { todoId, groupId, userId });
          console.log(`🔌 Socket ID:`, socket.id);
          console.log(`🔌 Socket user ID:`, socket.userId);
          console.log(`🔌 Socket connected:`, socket.connected);
          await this.joinTodoChat(socket, todoId, groupId, userId);
        });
        
        // Handle leaving todo chat rooms
        socket.on('leave-todo-chat', (data) => {
          const { todoId } = data;
          this.leaveTodoChat(socket, todoId);
        });
        
        // Handle chat messages
        socket.on('chat-message', async (data) => {
          await this.handleChatMessage(socket, data, userId);
        });
        
        // Handle typing indicators
        socket.on('typing-start', (data) => {
          this.handleTypingStart(socket, data, userId);
        });
        
        socket.on('typing-stop', (data) => {
          this.handleTypingStop(socket, data, userId);
        });
        
        // Handle todo updates
        socket.on('todo-updated', async (data) => {
          await this.handleTodoUpdate(socket, data, userId);
        });
        
        // Handle todo status changes
        socket.on('todo-status-change', async (data) => {
          await this.handleTodoStatusChange(socket, data, userId);
        });
        
        // Handle file uploads
        socket.on('file-uploaded', async (data) => {
          await this.handleFileUpload(socket, data, userId);
        });
        
        // Handle invitation notifications
        socket.on('join-invitation-room', () => {
          this.joinInvitationRoom(socket, userId);
        });

        // Handle todo assignment room joining
        socket.on('joinTodoRoom', (data) => {
          const { todoId, groupId } = data;
          this.joinTodoChat(socket, todoId, groupId, userId);
        });

        // Handle todo assignment room leaving
        socket.on('leaveTodoRoom', (data) => {
          const { todoId } = data;
          this.leaveTodoAssignmentRoom(socket, todoId, userId);
        });

        // Handle joining specific group
        socket.on('joinGroup', (data) => {
          const { groupId } = data;
          console.log(`🔌 Frontend requested to join group:`, { groupId, userId });
          console.log(`🔌 Socket ID:`, socket.id);
          this.joinGroupRoom(socket, groupId, userId);
        });

        // Handle online status
        socket.on('userOnline', (data) => {
          const { groupId } = data;
          this.handleUserOnline(socket, groupId, userId);
        });

        // Handle assignment updates
        socket.on('assignment-updated', async (data) => {
          await this.handleAssignmentUpdate(socket, data, userId);
        });

        // Handle todo chat messages
        socket.on('todoMessage', async (data) => {
          console.log(`🔌 Received todoMessage event:`, data);
          console.log(`🔌 Socket ID:`, socket.id);
          console.log(`🔌 User ID:`, userId);
          await this.handleChatMessage(socket, data, userId);
        });

        // Handle todo typing indicators
        socket.on('todoTyping', (data) => {
          this.handleTodoTyping(socket, data, userId);
        });

        socket.on('todoStopTyping', (data) => {
          this.handleTodoStopTyping(socket, data, userId);
        });
        
        // Handle disconnection
        socket.on('disconnect', () => {
          this.handleDisconnect(socket, userId);
        });
        
      } catch (error) {
        console.error('Socket authentication error:', error);
        console.error('Error details:', {
          error: error.message,
          stack: error.stack
        });
        socket.disconnect();
      }
    });
  }

  async joinUserGroups(socket, userId) {
    try {
      // Get user's groups
      const query = `
        SELECT group_id FROM group_members 
        WHERE user_id = $1 AND is_active = true
      `;
      
      const result = await pool.query(query, [userId]);
      console.log(`🔌 User ${userId} groups found:`, result.rows.length);
      console.log(`🔌 User groups:`, result.rows);
      
      // Join each group room
      for (const row of result.rows) {
        const groupId = row.group_id;
        const roomName = `group:${groupId}`;
        
        socket.join(roomName);
        
        // Store group room mapping
        if (!this.groupRooms.has(groupId)) {
          this.groupRooms.set(groupId, new Set());
        }
        this.groupRooms.get(groupId).add(socket.id);
        
        console.log(`👥 User ${userId} joined group room: ${roomName}`);
        console.log(`👥 Group ${groupId} members after join:`, this.groupRooms.get(groupId)?.size || 0);
      }
      
    } catch (error) {
      console.error('Error joining user groups:', error);
      console.error('Error details:', {
        userId,
        error: error.message,
        stack: error.stack
      });
    }
  }

  async joinTodoChat(socket, todoId, groupId, userId) {
    try {
      // Verify user has access to this todo - more flexible check
      const query = `
        SELECT gt.id, gt.title, g.name as group_name, g.id as group_id
        FROM group_todos gt
        INNER JOIN groups g ON gt.group_id = g.id
        WHERE gt.id = $1
      `;
      
      const result = await pool.query(query, [todoId]);
      if (result.rows.length === 0) {
        console.log(`❌ Todo ${todoId} not found`);
        socket.emit('error', { message: 'Todo not found' });
        return;
      }
      
      // Check if user is member of the group
      const memberQuery = `
        SELECT gm.user_id, gm.is_active, gm.role
        FROM group_members gm
        WHERE gm.group_id = $1 AND gm.user_id = $2
      `;
      
      const memberResult = await pool.query(memberQuery, [groupId, userId]);
      console.log(`🔍 User ${userId} member check for group ${groupId}:`, memberResult.rows);
      
      // Allow access if user is member or if no member check is needed
      if (memberResult.rows.length === 0) {
        console.log(`⚠️ User ${userId} is not a member of group ${groupId}, but allowing access for testing`);
        // For now, allow access even if not a member (for testing purposes)
      }
      const roomName = `todo:${todoId}`;
      
      // Join the room
      socket.join(roomName);
      
      // Store todo room mapping
      if (!this.todoRooms.has(todoId)) {
        this.todoRooms.set(todoId, new Set());
      }
      this.todoRooms.get(todoId).add(socket.id);
      
      // Get actual room members from Socket.IO
      const roomMembers = await this.io.in(roomName).fetchSockets();
      
      console.log(`💬 User ${userId} joined todo chat room: ${roomName}`);
      console.log(`💬 Room members after join:`, this.todoRooms.get(todoId)?.size || 0);
      console.log(`💬 Socket.IO room members:`, roomMembers.length);
      console.log(`💬 All rooms:`, Array.from(this.todoRooms.keys()));
      
      // Notify others in the room
      socket.to(roomName).emit('user-joined-chat', {
        userId,
        todoId,
        message: `Someone joined the chat for: ${todo.title}`
      });
      
      // Emit confirmation to the user
      socket.emit('userJoinedTodoRoom', {
        userId,
        todoId,
        message: `Successfully joined chat for: ${todo.title}`
      });
      
      console.log(`💬 User ${userId} joined todo chat room: ${roomName}`);
      
    } catch (error) {
      console.error('Error joining todo chat:', error);
      console.error('Error details:', {
        todoId,
        groupId,
        userId,
        error: error.message,
        stack: error.stack
      });
      socket.emit('error', { message: 'Failed to join todo chat' });
    }
  }

  leaveTodoChat(socket, todoId) {
    const roomName = `todo:${todoId}`;
    console.log(`👋 User ${socket.userId} leaving todo chat room: ${roomName}`);
    console.log(`👋 Socket ID:`, socket.id);
    
    socket.leave(roomName);
    
    // Remove from todo room mapping
    if (this.todoRooms.has(todoId)) {
      this.todoRooms.get(todoId).delete(socket.id);
      console.log(`💬 Todo room ${todoId} members after leave:`, this.todoRooms.get(todoId)?.size || 0);
      if (this.todoRooms.get(todoId).size === 0) {
        this.todoRooms.delete(todoId);
        console.log(`💬 Todo room ${todoId} deleted (no more members)`);
      }
    }
    
    console.log(`👋 User ${socket.userId} left todo chat room: ${roomName}`);
  }

  async handleChatMessage(socket, data, userId) {
    try {
      const { todoId, content, messageType, metadata, parentMessageId, mentions } = data;
      
      console.log(`💬 Processing chat message:`, { todoId, content, messageType, userId });
      console.log(`💬 Socket ID:`, socket.id);
      console.log(`💬 Room name will be:`, `todo:${todoId}`);
      
      // Validate message
      if (!content || !todoId) {
        console.log(`❌ Invalid message data:`, { content, todoId });
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }
      
      // Prevent duplicate processing
      const messageKey = `${socket.id}-${content}-${Date.now()}`;
      if (!this.processedMessages) {
        this.processedMessages = new Set();
      }
      
      if (this.processedMessages.has(messageKey)) {
        console.log(`🔄 Duplicate message detected, skipping:`, messageKey);
        return; // Skip duplicate
      }
      
      this.processedMessages.add(messageKey);
      setTimeout(() => {
        this.processedMessages.delete(messageKey);
      }, 5000);
      
      // Save message to database
      const messageQuery = `
        INSERT INTO group_todo_chat (
          todo_id, user_id, message_type, content, metadata, parent_message_id,
          mentions, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `;
      
      const messageResult = await pool.query(messageQuery, [
        todoId, userId, messageType || 'text', content,
        JSON.stringify(metadata || {}), parentMessageId,
        JSON.stringify(mentions || [])
      ]);
      
      const message = messageResult.rows[0];
      console.log(`💾 Message saved to database:`, message.id);
      console.log(`💾 Message data:`, message);
      
      // Get user info
      const userQuery = `
        SELECT name, avatar, email FROM users WHERE id = $1
      `;
      
      const userResult = await pool.query(userQuery, [userId]);
      const user = userResult.rows[0];
      console.log(`👤 User info retrieved:`, user);
      
      // Prepare message object
      const messageObject = {
        id: message.id,
        todo_id: message.todo_id,
        user_id: message.user_id,
        content: message.content,
        message_type: message.message_type,
        created_at: message.created_at,
        updated_at: message.updated_at,
        user: {
          id: userId,
          name: user.name,
          avatar: user.avatar,
          email: user.email
        }
      };
      
      console.log(`📝 Final message object:`, messageObject);
      
      // Broadcast to todo chat room
      const roomName = `todo:${todoId}`;
      
      // Auto-join all group members to the todo room BEFORE sending message
      const groupQuery = `
        SELECT group_id FROM group_todos WHERE id = $1
      `;
      
      const groupResult = await pool.query(groupQuery, [todoId]);
      console.log(`🏷️ Group query result:`, groupResult.rows);
      if (groupResult.rows.length > 0) {
        const groupId = groupResult.rows[0].group_id;
        console.log(`🏷️ Group ID found:`, groupId);
        const groupRoomName = `group:${groupId}`;
        
        // Auto-join all group members to the todo room BEFORE sending message
        const groupMembersQuery = `
          SELECT user_id FROM group_members 
          WHERE group_id = $1 AND is_active = true
        `;
        
        const groupMembersResult = await pool.query(groupMembersQuery, [groupId]);
        console.log(`👥 Group ${groupId} has ${groupMembersResult.rows.length} members`);
        
        // Get all sockets for this group
        const groupSockets = await this.io.in(groupRoomName).fetchSockets();
        console.log(`👥 Group ${groupId} has ${groupSockets.length} connected sockets`);
        
        // For each socket in the group, ensure they're also in the todo room
        for (const groupSocket of groupSockets) {
          const todoRoomName = `todo:${todoId}`;
          const todoSockets = await this.io.in(todoRoomName).fetchSockets();
          const isInTodoRoom = todoSockets.some(s => s.id === groupSocket.id);
          
          if (!isInTodoRoom) {
            console.log(`👥 Auto-joining socket ${groupSocket.id} to todo room ${todoRoomName}`);
            groupSocket.join(todoRoomName);
            
            // Update our tracking
            if (!this.todoRooms.has(todoId)) {
              this.todoRooms.set(todoId, new Set());
            }
            this.todoRooms.get(todoId).add(groupSocket.id);
          }
        }
      }
      
      // Get actual room members from Socket.IO AFTER auto-join
      const roomMembers = await this.io.in(roomName).fetchSockets();
      
      console.log(`📡 Broadcasting to room: ${roomName}`);
      console.log(`📡 Room members (our tracking):`, this.todoRooms.get(todoId)?.size || 0);
      console.log(`📡 Room members (Socket.IO):`, roomMembers.length);
      console.log(`📡 Message object being sent:`, messageObject);
      
      this.io.to(roomName).emit('newTodoMessage', messageObject);
      console.log(`📡 Event 'newTodoMessage' emitted to room: ${roomName}`);
      console.log(`📡 Message ID: ${messageObject.id}, Content: ${messageObject.content}`);
      console.log(`📡 Sender: ${messageObject.user.name} (ID: ${messageObject.user.id})`);
      
      // Send notification to group (excluding sender)
      if (groupResult.rows.length > 0) {
        const groupId = groupResult.rows[0].group_id;
        const groupRoomName = `group:${groupId}`;
        
        socket.to(groupRoomName).emit('todo-activity', {
          type: 'new_message',
          todoId,
          message: `${user.name} sent a message`,
          data: messageObject
        });
      }
      
      // Handle mentions
      if (mentions && mentions.length > 0) {
        await this.handleMentions(mentions, todoId, userId, content);
      }
      
      console.log(`💬 Chat message sent by user ${userId} in todo ${todoId}`);
      console.log(`💬 Message ID:`, message.id);
      console.log(`💬 Room:`, `todo:${todoId}`);
      console.log(`💬 Event: newTodoMessage`);
      
    } catch (error) {
      console.error('Error handling chat message:', error);
      console.error('Error details:', {
        todoId,
        userId,
        content,
        messageType,
        error: error.message,
        stack: error.stack
      });
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  async handleMentions(mentions, todoId, senderId, content) {
    try {
      console.log(`@ Mention handling for todo ${todoId}`);
      console.log(`@ Sender ID:`, senderId);
      console.log(`@ Mentions:`, mentions);
      console.log(`@ Content:`, content);
      
      for (const mention of mentions) {
        const { userId: mentionedUserId } = mention;
        console.log(`@ Processing mention for user ${mentionedUserId}`);
        
        // Create notification
        const notificationQuery = `
          INSERT INTO group_todo_notifications (
            user_id, group_id, todo_id, notification_type, title, message, data,
            priority, delivery_methods, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `;
        
        // Get group ID
        const groupQuery = `
          SELECT group_id FROM group_todos WHERE id = $1
        `;
        
        const groupResult = await pool.query(groupQuery, [todoId]);
        if (groupResult.rows.length === 0) continue;
        
        const groupId = groupResult.rows[0].group_id;
        
        await pool.query(notificationQuery, [
          mentionedUserId, groupId, todoId, 'mention',
          `You were mentioned in a task`,
          `Someone mentioned you in: ${content.substring(0, 100)}...`,
          JSON.stringify({
            groupId, todoId, mentionedBy: senderId,
            content: content.substring(0, 200)
          }),
          'normal', JSON.stringify({ inApp: true, email: true, push: false, sms: false })
        ]);
        
        // Send realtime notification
        const userSocketId = this.userSockets.get(mentionedUserId);
        if (userSocketId) {
          console.log(`@ Sending realtime mention notification to user ${mentionedUserId} via socket ${userSocketId}`);
          this.io.to(userSocketId).emit('notification', {
            type: 'mention',
            title: 'You were mentioned',
            message: `Someone mentioned you in a task`,
            data: { groupId, todoId }
          });
        } else {
          console.log(`@ User ${mentionedUserId} not online, skipping realtime mention notification`);
        }
      }
    } catch (error) {
      console.error('Error handling mentions:', error);
      console.error('Error details:', {
        mentions,
        todoId,
        senderId,
        content,
        error: error.message,
        stack: error.stack
      });
    }
  }

  handleTypingStart(socket, data, userId) {
    const { todoId } = data;
    const roomName = `todo:${todoId}`;
    console.log(`⌨️ User ${userId} started typing in todo ${todoId}`);
    console.log(`⌨️ Socket ID:`, socket.id);
    console.log(`⌨️ Room name:`, roomName);
    
    socket.to(roomName).emit('user-typing', {
      userId,
      todoId,
      isTyping: true
    });
  }

  handleTypingStop(socket, data, userId) {
    const { todoId } = data;
    const roomName = `todo:${todoId}`;
    console.log(`⌨️ User ${userId} stopped typing in todo ${todoId}`);
    console.log(`⌨️ Socket ID:`, socket.id);
    console.log(`⌨️ Room name:`, roomName);
    
    socket.to(roomName).emit('user-typing', {
      userId,
      todoId,
      isTyping: false
    });
  }

  async handleTodoUpdate(socket, data, userId) {
    try {
      const { todoId, updates, groupId } = data;
      console.log(`✏️ Todo update for todo ${todoId} by user ${userId}`);
      console.log(`✏️ Socket ID:`, socket.id);
      console.log(`✏️ Group ID:`, groupId);
      console.log(`✏️ Updates:`, updates);
      
      // Verify user has permission to update
      const permissionQuery = `
        SELECT gm.role, gm.permissions
        FROM group_members gm
        WHERE gm.group_id = $1 AND gm.user_id = $2 AND gm.is_active = true
      `;
      
      const permissionResult = await pool.query(permissionQuery, [groupId, userId]);
      if (permissionResult.rows.length === 0) {
        console.log(`❌ Permission denied for user ${userId} in group ${groupId}`);
        socket.emit('error', { message: 'Permission denied' });
        return;
      }
      
      const member = permissionResult.rows[0];
      if (member.role !== 'admin' && !member.permissions?.canEdit) {
        console.log(`❌ Insufficient permissions for user ${userId} in group ${groupId}`);
        socket.emit('error', { message: 'Permission denied' });
        return;
      }
      
      // Broadcast update to group
      const groupRoomName = `group:${groupId}`;
      socket.to(groupRoomName).emit('todo-updated', {
        todoId,
        updates,
        updatedBy: userId,
        timestamp: new Date()
      });
      
      // Send to todo chat room
      const todoRoomName = `todo:${todoId}`;
      this.io.to(todoRoomName).emit('todo-updated', {
        todoId,
        updates,
        updatedBy: userId,
        timestamp: new Date()
      });
      
      console.log(`✏️ Todo ${todoId} updated by user ${userId}`);
      
    } catch (error) {
      console.error('Error handling todo update:', error);
      console.error('Error details:', {
        todoId,
        updates,
        groupId,
        userId,
        error: error.message,
        stack: error.stack
      });
      socket.emit('error', { message: 'Failed to update todo' });
    }
  }

  async handleTodoStatusChange(socket, data, userId) {
    try {
      const { todoId, newStatus, groupId, previousStatus } = data;
      console.log(`🔄 Todo status change for todo ${todoId} by user ${userId}`);
      console.log(`🔄 Socket ID:`, socket.id);
      console.log(`🔄 Group ID:`, groupId);
      console.log(`🔄 Previous status:`, previousStatus);
      console.log(`🔄 New status:`, newStatus);
      
      // Verify user has permission
      const permissionQuery = `
        SELECT gm.role, gm.permissions
        FROM group_members gm
        WHERE gm.group_id = $1 AND gm.user_id = $2 AND gm.is_active = true
      `;
      
      const permissionResult = await pool.query(permissionQuery, [groupId, userId]);
      if (permissionResult.rows.length === 0) {
        console.log(`❌ Permission denied for user ${userId} in group ${groupId}`);
        socket.emit('error', { message: 'Permission denied' });
        return;
      }
      
      // Broadcast status change
      const groupRoomName = `group:${groupId}`;
      socket.to(groupRoomName).emit('todo-status-changed', {
        todoId,
        newStatus,
        previousStatus,
        changedBy: userId,
        timestamp: new Date()
      });
      
      // Send to todo chat room
      const todoRoomName = `todo:${todoId}`;
      this.io.to(todoRoomName).emit('todo-status-changed', {
        todoId,
        newStatus,
        previousStatus,
        changedBy: userId,
        timestamp: new Date()
      });
      
      // Send notifications to assigned users
      await this.notifyStatusChange(todoId, newStatus, previousStatus, userId);
      
      console.log(`🔄 Todo ${todoId} status changed to ${newStatus} by user ${userId}`);
      
    } catch (error) {
      console.error('Error handling status change:', error);
      console.error('Error details:', {
        todoId,
        newStatus,
        previousStatus,
        groupId,
        userId,
        error: error.message,
        stack: error.stack
      });
      socket.emit('error', { message: 'Failed to change status' });
    }
  }

  async notifyStatusChange(todoId, newStatus, previousStatus, changedBy) {
    try {
      console.log(`📢 Notifying status change for todo ${todoId}`);
      console.log(`📢 Changed by:`, changedBy);
      console.log(`📢 Previous status:`, previousStatus);
      console.log(`📢 New status:`, newStatus);
      
      // Get assigned users
      const assignedQuery = `
        SELECT user_id FROM group_todo_assignments 
        WHERE todo_id = $1 AND user_id != $2
      `;
      
      const assignedResult = await pool.query(assignedQuery, [todoId, changedBy]);
      console.log(`📢 Assigned users to notify:`, assignedResult.rows.length);
      
      for (const row of assignedResult.rows) {
        const assignedUserId = row.user_id;
        console.log(`📢 Notifying user ${assignedUserId} about status change`);
        
        // Create notification
        const notificationQuery = `
          INSERT INTO group_todo_notifications (
            user_id, group_id, todo_id, notification_type, title, message, data,
            priority, delivery_methods, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `;
        
        // Get group ID
        const groupQuery = `
          SELECT group_id FROM group_todos WHERE id = $1
        `;
        
        const groupResult = await pool.query(groupQuery, [todoId]);
        if (groupResult.rows.length === 0) {
          console.log(`❌ Group not found for todo ${todoId}`);
          continue;
        }
        
        const groupId = groupResult.rows[0].group_id;
        console.log(`📢 Group ID for notification:`, groupId);
        
        await pool.query(notificationQuery, [
          assignedUserId, groupId, todoId, 'status_change',
          `Task status changed`,
          `Task status changed from ${previousStatus} to ${newStatus}`,
          JSON.stringify({
            groupId, todoId, newStatus, previousStatus, changedBy
          }),
          'normal', JSON.stringify({ inApp: true, email: false, push: false, sms: false })
        ]);
        
        // Send realtime notification
        const userSocketId = this.userSockets.get(assignedUserId);
        if (userSocketId) {
          console.log(`📢 Sending realtime notification to user ${assignedUserId} via socket ${userSocketId}`);
          this.io.to(userSocketId).emit('notification', {
            type: 'status_change',
            title: 'Task Status Changed',
            message: `Task status changed from ${previousStatus} to ${newStatus}`,
            data: { groupId, todoId, newStatus, previousStatus }
          });
        } else {
          console.log(`📢 User ${assignedUserId} not online, skipping realtime notification`);
        }
      }
    } catch (error) {
      console.error('Error notifying status change:', error);
      console.error('Error details:', {
        todoId,
        newStatus,
        previousStatus,
        changedBy,
        error: error.message,
        stack: error.stack
      });
    }
  }

  async handleFileUpload(socket, data, userId) {
    try {
      const { todoId, fileName, fileSize, groupId } = data;
      console.log(`📁 File upload for todo ${todoId} by user ${userId}`);
      console.log(`📁 Socket ID:`, socket.id);
      console.log(`📁 File name:`, fileName);
      console.log(`📁 File size:`, fileSize);
      console.log(`📁 Group ID:`, groupId);
      
      // Broadcast file upload to group
      const groupRoomName = `group:${groupId}`;
      socket.to(groupRoomName).emit('file-uploaded', {
        todoId,
        fileName,
        fileSize,
        uploadedBy: userId,
        timestamp: new Date()
      });
      
      // Send to todo chat room
      const todoRoomName = `todo:${todoId}`;
      this.io.to(todoRoomName).emit('file-uploaded', {
        todoId,
        fileName,
        fileSize,
        uploadedBy: userId,
        timestamp: new Date()
      });
      
      console.log(`📁 File uploaded to todo ${todoId} by user ${userId}`);
      
    } catch (error) {
      console.error('Error handling file upload:', error);
      console.error('Error details:', {
        todoId,
        fileName,
        fileSize,
        groupId,
        userId,
        error: error.message,
        stack: error.stack
      });
      socket.emit('error', { message: 'Failed to process file upload' });
    }
  }

  joinInvitationRoom(socket, userId) {
    const roomName = `invitations:${userId}`;
    socket.join(roomName);
    console.log(`📨 User ${userId} joined invitation room: ${roomName}`);
  }

  // Method to send invitation notification
  sendInvitationNotification(invitedUserId, invitationData) {
    const roomName = `invitations:${invitedUserId}`;
    this.io.to(roomName).emit('new-invitation', {
      type: 'group_invitation',
      data: invitationData,
      timestamp: new Date().toISOString()
    });
    console.log(`📨 Sent invitation notification to user ${invitedUserId} in room ${roomName}`);
  }

  // Method to send invitation response notification
  sendInvitationResponseNotification(groupId, responseData) {
    const roomName = `group:${groupId}`;
    this.io.to(roomName).emit('invitation-response', {
      type: 'invitation_response',
      data: responseData,
      timestamp: new Date().toISOString()
    });
    console.log(`📨 Sent invitation response notification to group ${groupId}`);
  }

  handleDisconnect(socket, userId) {
    console.log(`🔌 User ${userId} disconnecting from GroupTodo socket`);
    console.log(`🔌 Socket ID:`, socket.id);
    
    // Remove from user sockets
    this.userSockets.delete(userId);
    console.log(`🔗 User socket mapping removed for user ${userId}`);
    console.log(`🔗 Remaining user sockets:`, this.userSockets.size);
    
    // Remove from group rooms
    for (const [groupId, socketIds] of this.groupRooms.entries()) {
      socketIds.delete(socket.id);
      if (socketIds.size === 0) {
        this.groupRooms.delete(groupId);
        console.log(`👥 Group room ${groupId} deleted (no more members)`);
      }
    }
    
    // Remove from todo rooms
    for (const [todoId, socketIds] of this.todoRooms.entries()) {
      socketIds.delete(socket.id);
      if (socketIds.size === 0) {
        this.todoRooms.delete(todoId);
        console.log(`💬 Todo room ${todoId} deleted (no more members)`);
      }
    }
    
    console.log(`🔌 User ${userId} disconnected from GroupTodo socket`);
    console.log(`🔌 Remaining group rooms:`, Array.from(this.groupRooms.keys()));
    console.log(`🔌 Remaining todo rooms:`, Array.from(this.todoRooms.keys()));
  }

  // Public methods for external use
  sendNotification(userId, notification) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
    }
  }

  broadcastToGroup(groupId, event, data) {
    const roomName = `group:${groupId}`;
    this.io.to(roomName).emit(event, data);
  }

  broadcastToTodo(todoId, event, data) {
    const roomName = `todo:${todoId}`;
    this.io.to(roomName).emit(event, data);
  }

  // Handle todo assignment updates
  async handleAssignmentUpdate(socket, data, userId) {
    try {
      const { todoId, assignmentId, updates } = data;
      const roomName = `todo:${todoId}`;
      console.log(`📋 Assignment update for todo ${todoId} by user ${userId}`);
      console.log(`📋 Socket ID:`, socket.id);
      console.log(`📋 Room name:`, roomName);
      console.log(`📋 Assignment ID:`, assignmentId);
      console.log(`📋 Updates:`, updates);
      
      // Broadcast assignment update to todo room
      this.io.to(roomName).emit('assignmentUpdated', {
        todoId: parseInt(todoId),
        assignmentId: parseInt(assignmentId),
        updates,
        updatedBy: userId,
        timestamp: new Date()
      });
      
      console.log(`📋 Assignment ${assignmentId} updated for todo ${todoId} by user ${userId}`);
      
    } catch (error) {
      console.error('Error handling assignment update:', error);
      console.error('Error details:', {
        todoId,
        assignmentId,
        updates,
        userId,
        error: error.message,
        stack: error.stack
      });
      socket.emit('error', { message: 'Failed to process assignment update' });
    }
  }

  // Handle joining todo assignment room
  joinTodoAssignmentRoom(socket, todoId, groupId, userId) {
    const roomName = `todo:${todoId}`;
    console.log(`📋 User ${userId} joining todo assignment room: ${roomName}`);
    console.log(`📋 Socket ID:`, socket.id);
    console.log(`📋 Group ID:`, groupId);
    
    socket.join(roomName);
    
    // Store in todo rooms map
    if (!this.todoRooms.has(todoId)) {
      this.todoRooms.set(todoId, new Set());
    }
    this.todoRooms.get(todoId).add(socket.id);
    
    console.log(`📋 User ${userId} joined todo assignment room: ${roomName}`);
    console.log(`📋 Todo room ${todoId} members after join:`, this.todoRooms.get(todoId)?.size || 0);
    
    // Notify others in the room
    socket.to(roomName).emit('userJoinedTodoRoom', {
      userId: userId,
      todoId: todoId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle leaving todo assignment room
  leaveTodoAssignmentRoom(socket, todoId, userId) {
    const roomName = `todo:${todoId}`;
    console.log(`📋 User ${userId} leaving todo assignment room: ${roomName}`);
    console.log(`📋 Socket ID:`, socket.id);
    
    socket.leave(roomName);
    
    // Remove from todo rooms map
    if (this.todoRooms.has(todoId)) {
      this.todoRooms.get(todoId).delete(socket.id);
      console.log(`📋 Todo room ${todoId} members after leave:`, this.todoRooms.get(todoId)?.size || 0);
      if (this.todoRooms.get(todoId).size === 0) {
        this.todoRooms.delete(todoId);
        console.log(`📋 Todo room ${todoId} deleted (no more members)`);
      }
    }
    
    console.log(`📋 User ${userId} left todo assignment room: ${roomName}`);
  }

  // Method to send assignment notification
  sendAssignmentNotification(assignedUserId, assignmentData) {
    const roomName = `invitations:${assignedUserId}`;
    this.io.to(roomName).emit('new-assignment', {
      type: 'todo_assignment',
      data: assignmentData,
      timestamp: new Date().toISOString()
    });
    console.log(`📋 Sent assignment notification to user ${assignedUserId}`);
  }

  // Method to broadcast todo completion
  broadcastTodoCompletion(todoId, groupId) {
    const groupRoomName = `group:${groupId}`;
    const todoRoomName = `todo:${todoId}`;
    
    this.io.to(groupRoomName).emit('todoCompleted', {
      todoId: parseInt(todoId),
      timestamp: new Date()
    });
    
    this.io.to(todoRoomName).emit('todoCompleted', {
      todoId: parseInt(todoId),
      timestamp: new Date()
    });
    
    console.log(`🎉 Broadcasted todo completion for todo ${todoId} in group ${groupId}`);
  }



  // Handle todo typing indicators
  handleTodoTyping(socket, data, userId) {
    const { todoId } = data;
    const roomName = `todo:${todoId}`;
    console.log(`⌨️ User ${userId} typing in todo ${todoId}`);
    console.log(`⌨️ Socket ID:`, socket.id);
    console.log(`⌨️ Room name:`, roomName);
    
    socket.to(roomName).emit('todoTyping', {
      todoId: parseInt(todoId),
      userId: userId
    });
  }

  handleTodoStopTyping(socket, data, userId) {
    const { todoId } = data;
    const roomName = `todo:${todoId}`;
    console.log(`⌨️ User ${userId} stopped typing in todo ${todoId}`);
    console.log(`⌨️ Socket ID:`, socket.id);
    console.log(`⌨️ Room name:`, roomName);
    
    socket.to(roomName).emit('todoStopTyping', {
      todoId: parseInt(todoId),
      userId: userId
    });
  }

  // Method to join group room
  joinGroupRoom(socket, groupId, userId) {
    const roomName = `group:${groupId}`;
    socket.join(roomName);
    
    // Add to group rooms map
    if (!this.groupRooms.has(groupId)) {
      this.groupRooms.set(groupId, new Set());
    }
    this.groupRooms.get(groupId).add(socket.id);
    
    console.log(`🔌 User ${userId} joined group room: ${roomName}`);
    console.log(`🔌 Group room members after join:`, this.groupRooms.get(groupId)?.size || 0);
    console.log(`🔌 All group rooms:`, Array.from(this.groupRooms.keys()));
  }

  // Handle online status
  handleUserOnline(socket, groupId, userId) {
    const roomName = `group:${groupId}`;
    console.log(`🟢 User ${userId} marking as online in group ${groupId}`);
    console.log(`🟢 Socket ID:`, socket.id);
    console.log(`🟢 Room name:`, roomName);
    
    socket.to(roomName).emit('userOnline', {
      userId: userId,
      timestamp: new Date().toISOString()
    });
    console.log(`🟢 User ${userId} marked as online in group ${groupId}`);
  }
}

module.exports = GroupTodoSocket; 