import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, Pin, Star, Reply, Forward, Edit3, Trash2, Clock, 
  Search, Users, Shield, Crown, Bell, Link, Eye, EyeOff,
  MoreVertical, MessageSquare, Calendar, Download, Upload
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const EnhancedChatFeatures = ({ 
  roomId, 
  message, 
  onReaction, 
  onReply, 
  onEdit, 
  onDelete, 
  onPin, 
  onForward,
  onSchedule,
  isModerator = false,
  isAdmin = false,
  currentUser
}) => {
  const { get, post, put, delete: del } = useApi();
  const { user } = useAuth();
  
  // State for enhanced features
  const [showReactions, setShowReactions] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showModeratorPanel, setShowModeratorPanel] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [forwardTarget, setForwardTarget] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [messageReactions, setMessageReactions] = useState(message.reactions || {});
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  
  // Emoji reactions
  const emojiReactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🙏', '🔥', '💯', '✨', '🎉', '🤔', '👀', '💪', '🚀', '💡', '🎯', '⭐', '🏆'];

  // Check permissions
  const canEdit = message.senderId === user?.id || isModerator;
  const canDelete = message.senderId === user?.id || isModerator;
  const canPin = isModerator;
  const canModerate = isModerator || isAdmin;

  // Load available rooms for forwarding
  useEffect(() => {
    if (showForwardModal) {
      loadAvailableRooms();
    }
  }, [showForwardModal]);

  // Load message reactions
  useEffect(() => {
    loadMessageReactions();
  }, [message.id]);

  const loadAvailableRooms = async () => {
    try {
      const response = await get('/api/chat/rooms');
      if (response?.success) {
        setAvailableRooms(response.rooms.filter(room => room.id !== roomId));
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadMessageReactions = async () => {
    try {
      const response = await get(`/api/advanced-chat/messages/${message.id}/reactions`);
      if (response?.success) {
        setMessageReactions(response.reactions);
      }
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  // Handle reactions
  const handleReaction = async (reaction) => {
    try {
      const response = await post(`/api/advanced-chat/messages/${message.id}/reactions`, { reaction });
      if (response?.success) {
        setMessageReactions(prev => {
          const updated = { ...prev };
          if (response.action === 'added') {
            updated[reaction] = (updated[reaction] || 0) + 1;
          } else if (response.action === 'removed') {
            updated[reaction] = Math.max(0, (updated[reaction] || 1) - 1);
          }
          return updated;
        });
        setShowReactions(false);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  // Handle message edit
  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    try {
      const response = await put(`/api/advanced-chat/messages/${message.id}`, { content: editContent });
      if (response?.success) {
        onEdit(message.id, editContent);
        setIsEditing(false);
        toast.success('Message updated successfully');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
    }
  };

  // Handle message delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const response = await del(`/api/chat/rooms/${roomId}/messages/${message.id}`);
      if (response?.success) {
        onDelete(message.id);
        toast.success('Message deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Handle pin message
  const handlePin = async () => {
    try {
      const response = await post(`/api/advanced-chat/messages/${message.id}/pin`);
      if (response?.success) {
        onPin(message.id);
        toast.success('Message pinned successfully');
      }
    } catch (error) {
      console.error('Error pinning message:', error);
      toast.error('Failed to pin message');
    }
  };

  // Handle forward message
  const handleForward = async () => {
    if (!forwardTarget) return;
    
    try {
      const response = await post(`/api/advanced-chat/messages/${message.id}/forward`, { targetRoomId: forwardTarget });
      if (response?.success) {
        onForward(message.id, forwardTarget);
        setShowForwardModal(false);
        setForwardTarget('');
        toast.success('Message forwarded successfully');
      }
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error('Failed to forward message');
    }
  };

  // Handle schedule message
  const handleSchedule = async () => {
    if (!scheduledTime) return;
    
    try {
      const response = await post('/api/advanced-chat/messages/schedule', {
        roomId,
        content: message.content,
        scheduledAt: scheduledTime
      });
      if (response?.success) {
        onSchedule(message.id, scheduledTime);
        setShowScheduleModal(false);
        setScheduledTime('');
        toast.success('Message scheduled successfully');
      }
    } catch (error) {
      console.error('Error scheduling message:', error);
      toast.error('Failed to schedule message');
    }
  };

  // Extract mentions from text
  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  // Generate link preview
  const generateLinkPreview = (content) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);
    if (!urls) return null;
    
    return {
      url: urls[0],
      title: urls[0],
      description: 'Link preview',
      image: null
    };
  };

  return (
    <div className="enhanced-chat-features">
      {/* Message Reactions */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="reactions-picker"
          >
            <div className="reactions-grid">
              {emojiReactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="reaction-button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Actions Menu */}
      <AnimatePresence>
        {showMessageMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="message-actions-menu"
          >
            <div className="actions-list">
              <button onClick={() => setShowReactions(true)} className="action-button">
                <Smile className="w-4 h-4" />
                React
              </button>
              
              <button onClick={() => onReply(message)} className="action-button">
                <Reply className="w-4 h-4" />
                Reply
              </button>
              
              {canEdit && (
                <button onClick={() => setIsEditing(true)} className="action-button">
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              )}
              
              {canDelete && (
                <button onClick={handleDelete} className="action-button text-red-600">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
              
              {canPin && (
                <button onClick={handlePin} className="action-button">
                  <Pin className="w-4 h-4" />
                  Pin
                </button>
              )}
              
              <button onClick={() => setShowForwardModal(true)} className="action-button">
                <Forward className="w-4 h-4" />
                Forward
              </button>
              
              <button onClick={() => setShowScheduleModal(true)} className="action-button">
                <Clock className="w-4 h-4" />
                Schedule
              </button>
              
              {canModerate && (
                <button onClick={() => setShowModeratorPanel(true)} className="action-button">
                  <Shield className="w-4 h-4" />
                  Moderate
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Message Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="edit-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="edit-modal"
            >
              <h3>Edit Message</h3>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="edit-textarea"
                rows="3"
              />
              <div className="edit-actions">
                <button onClick={handleEdit} className="save-button">
                  Save
                </button>
                <button onClick={() => setIsEditing(false)} className="cancel-button">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Message Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="modal"
            >
              <h3>Schedule Message</h3>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="schedule-input"
              />
              <div className="modal-actions">
                <button onClick={handleSchedule} className="primary-button">
                  Schedule
                </button>
                <button onClick={() => setShowScheduleModal(false)} className="secondary-button">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forward Message Modal */}
      <AnimatePresence>
        {showForwardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="modal"
            >
              <h3>Forward Message</h3>
              <select
                value={forwardTarget}
                onChange={(e) => setForwardTarget(e.target.value)}
                className="forward-select"
              >
                <option value="">Select a room</option>
                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
              <div className="modal-actions">
                <button onClick={handleForward} className="primary-button">
                  Forward
                </button>
                <button onClick={() => setShowForwardModal(false)} className="secondary-button">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Reactions Display */}
      {Object.keys(messageReactions).length > 0 && (
        <div className="message-reactions">
          {Object.entries(messageReactions).map(([reaction, count]) => (
            <button
              key={reaction}
              onClick={() => handleReaction(reaction)}
              className="reaction-display"
            >
              {reaction} {count}
            </button>
          ))}
        </div>
      )}

      {/* Message Content with Enhanced Features */}
      <div className="message-content-enhanced">
        {/* Reply indicator */}
        {message.replyTo && (
          <div className="reply-indicator">
            <Reply className="w-3 h-3" />
            <span>Replying to: {message.replyTo.content.substring(0, 50)}...</span>
          </div>
        )}
        
        {/* Forward indicator */}
        {message.isForwarded && (
          <div className="forward-indicator">
            <Forward className="w-3 h-3" />
            <span>Forwarded from {message.forwardFrom?.sender?.name}</span>
          </div>
        )}
        
        {/* Edit indicator */}
        {message.isEdited && (
          <div className="edit-indicator">
            <Edit3 className="w-3 h-3" />
            <span>(edited)</span>
          </div>
        )}
        
        {/* Link preview */}
        {message.linkPreview && (
          <div className="link-preview">
            <div className="link-title">{message.linkPreview.title}</div>
            <div className="link-description">{message.linkPreview.description}</div>
            {message.linkPreview.image && (
              <img src={message.linkPreview.image} alt="Link preview" className="link-image" />
            )}
          </div>
        )}
        
        {/* Message actions trigger */}
        <button
          onClick={() => setShowMessageMenu(!showMessageMenu)}
          className="message-actions-trigger"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default EnhancedChatFeatures; 