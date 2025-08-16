import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy, 
  Share2, 
  Archive,
  Clock,
  Calendar,
  User,
  Tag,
  Flag,
  CheckCircle,
  Circle,
  AlertCircle,
  Clock3,
  MessageSquare,
  Paperclip,
  Eye,
  Star,
  Target,
  TrendingUp,
  Activity,
  Zap,
  Crown,
  Shield,
  UserCheck,
  UserX,
  UserMinus,
  UserPlus2,
  Download,
  Upload,
  RefreshCw,
  Play,
  Pause,
  Stop,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Mail,
  PhoneCall,
  MessageCircle,
  HelpCircle,
  Info,
  AlertTriangle,
  Check,
  XCircle,
  Minus,
  Maximize2,
  Minimize2,
  Move,
  GripVertical,
  DragHandle,
  MousePointer,
  Hand,
  MousePointer2,
  HandPointer,
  HandMetal,
  HandHeart,
  HandCoins,
  Handshake,
  HandshakeIcon,
  Heart,
  HeartOff,
  ThumbsUp,
  ThumbsDown,
  Award,
  Trophy,
  Medal,
  Badge,
  Certificate,
  Diploma,
  GraduationCap,
  BookOpen,
  Book,
  Library,
  School,
  University,
  Building,
  Home,
  Office,
  Store,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  DollarSign,
  Coins,
  PiggyBank,
  Wallet,
  Banknote,
  Receipt,
  File,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderX,
  FolderCheck,
  FolderSearch,
  FolderHeart,
  FolderClock,
  FolderKey,
  FolderLock,
  FolderUnlock,
  FolderCog,
  FolderSettings,
  FolderGit,
  FolderGit2,
  FolderUp,
  FolderDown,
  FolderLeft,
  FolderRight,
  FolderTree,
  FolderSymlink,
  FolderArchive,
  FolderOff,
  FolderQuestion,
  FolderStar,
  FolderUser,
  FolderPlus2,
  FolderMinus2,
  FolderX2,
  FolderCheck2,
  FolderSearch2,
  FolderHeart2,
  FolderClock2,
  FolderKey2,
  FolderLock2,
  FolderUnlock2,
  FolderCog2,
  FolderSettings2,
  FolderGit2 as FolderGit3,
  FolderGit22,
  FolderUp2,
  FolderDown2,
  FolderLeft2,
  FolderRight2,
  FolderTree2,
  FolderSymlink2,
  FolderArchive2,
  FolderOff2,
  FolderQuestion2,
  FolderStar2,
  FolderUser2
} from 'lucide-react';

const NotionStyleTodoCard = ({ 
  todo, 
  onSelect, 
  onUpdate, 
  onDelete, 
  members, 
  darkMode,
  isSelected = false,
  onSelectChange = null,
  showCheckbox = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Priority colors and icons
  const priorityConfig = {
    low: { color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400', icon: Info },
    medium: { color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400', icon: AlertCircle },
    high: { color: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-400', icon: AlertTriangle },
    urgent: { color: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400', icon: AlertTriangle }
  };

  // Status colors and icons
  const statusConfig = {
    pending: { color: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400', icon: Circle },
    in_progress: { color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400', icon: Clock3 },
    review: { color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-400', icon: Eye },
    completed: { color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400', icon: CheckCircle }
  };

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (todo.groupProgress !== undefined) {
      return todo.groupProgress;
    }
    return todo.progress || 0;
  }, [todo.progress, todo.groupProgress]);

  // Get assignee info
  const assignee = useMemo(() => {
    if (todo.assignments && todo.assignments.length > 0) {
      const assignment = todo.assignments[0];
      return members.find(m => m.id === assignment.assignedTo);
    }
    return null;
  }, [todo.assignments, members]);

  // Get due date status
  const dueDateStatus = useMemo(() => {
    if (!todo.deadline) return null;
    
    const now = new Date();
    const deadline = new Date(todo.deadline);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 1) return 'due-soon';
    if (diffDays <= 3) return 'due-this-week';
    return 'due-later';
  }, [todo.deadline]);

  // Format deadline
  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    try {
      await onUpdate(todo.id, { status: newStatus });
      setShowMenu(false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Handle priority change
  const handlePriorityChange = async (newPriority) => {
    try {
      await onUpdate(todo.id, { priority: newPriority });
      setShowMenu(false);
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  // Handle assignee change
  const handleAssigneeChange = async (newAssigneeId) => {
    try {
      // Update todo assignment
      await onUpdate(todo.id, { 
        assignedTo: newAssigneeId 
      });
      setShowMenu(false);
    } catch (error) {
      console.error('Error updating assignee:', error);
    }
  };

  // Handle duplicate
  const handleDuplicate = async () => {
    try {
      const duplicateData = {
        ...todo,
        title: `${todo.title} (Copy)`,
        status: 'pending',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      delete duplicateData.id;
      // Create duplicate todo
      // This would need to be implemented in the parent component
      setShowMenu(false);
    } catch (error) {
      console.error('Error duplicating todo:', error);
    }
  };

  // Handle archive
  const handleArchive = async () => {
    try {
      await onUpdate(todo.id, { status: 'archived' });
      setShowMenu(false);
    } catch (error) {
      console.error('Error archiving todo:', error);
    }
  };

  // Handle share
  const handleShare = () => {
    // Generate share link
    const shareLink = `${window.location.origin}/todos/${todo.id}`;
    navigator.clipboard.writeText(shareLink);
    setShowMenu(false);
    // Show success notification
  };

  // Handle export
  const handleExport = () => {
    const todoData = {
      title: todo.title,
      description: todo.description,
      status: todo.status,
      priority: todo.priority,
      deadline: todo.deadline,
      progress: progressPercentage,
      assignee: assignee?.name,
      tags: todo.tags,
      notes: todo.notes
    };
    
    const blob = new Blob([JSON.stringify(todoData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${todo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className={`group relative ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Checkbox for selection */}
      {showCheckbox && (
        <div className="absolute top-3 left-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectChange?.(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <div className={`flex items-start justify-between ${showCheckbox ? 'ml-6' : ''}`}>
        <div className="flex-1 min-w-0">
          {/* Title and status */}
          <div className="flex items-center space-x-2 mb-2">
            <h3 className={`text-lg font-semibold text-gray-900 dark:text-white truncate ${
              todo.status === 'completed' ? 'line-through text-gray-500' : ''
            }`}>
              {todo.title}
            </h3>
            
            {/* Status badge */}
            {todo.status && (
                           <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig[todo.status]?.color}`}>
               {React.createElement(statusConfig[todo.status]?.icon, { className: "w-3 h-3 mr-1" })}
               {todo.status.replace('_', ' ')}
             </span>
            )}
          </div>

          {/* Description */}
          {todo.description && (
            <p className={`text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 ${
              todo.status === 'completed' ? 'line-through' : ''
            }`}>
              {todo.description}
            </p>
          )}
        </div>

        {/* Action menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`p-1 rounded-lg transition-colors ${
              isHovered || showMenu
                ? 'bg-gray-100 dark:bg-gray-700'
                : 'bg-transparent'
            }`}
          >
            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`absolute right-0 top-full mt-1 w-56 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-10`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                {/* Status options */}
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Status
                  </p>
                  <div className="space-y-1">
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                          todo.status === status
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                                                 {React.createElement(config.icon, { className: "w-3 h-3 inline mr-2" })}
                         {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority options */}
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Priority
                  </p>
                  <div className="space-y-1">
                    {Object.entries(priorityConfig).map(([priority, config]) => (
                      <button
                        key={priority}
                        onClick={() => handlePriorityChange(priority)}
                        className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                          todo.priority === priority
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <config.icon className="w-3 h-3 inline mr-2" />
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignee options */}
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Assign to
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleAssigneeChange(null)}
                      className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                        !assignee
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      Unassigned
                    </button>
                    {members.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleAssigneeChange(member.id)}
                        className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                          assignee?.id === member.id
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleDuplicate}
                    className="w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Share2 className="w-3 h-3 mr-2" />
                    Share
                  </button>
                  <button
                    onClick={handleExport}
                    className="w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Export
                  </button>
                  <button
                    onClick={handleArchive}
                    className="w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Archive className="w-3 h-3 mr-2" />
                    Archive
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(todo.id);
                    }}
                    className="w-full text-left px-2 py-1 rounded text-sm hover:bg-red-100 dark:hover:bg-red-900 text-red-700 dark:text-red-300 flex items-center"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {progressPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Meta information */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          {/* Priority */}
          {todo.priority && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityConfig[todo.priority]?.color}`}>
              <Flag className="w-3 h-3 mr-1" />
              {todo.priority}
            </span>
          )}

          {/* Assignee */}
          {assignee && (
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">{assignee.name}</span>
            </div>
          )}

          {/* Tags */}
          {todo.tags && todo.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              <Tag className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {todo.tags.slice(0, 2).join(', ')}
                {todo.tags.length > 2 && ` +${todo.tags.length - 2}`}
              </span>
            </div>
          )}
        </div>

        {/* Due date */}
        {todo.deadline && (
          <div className={`flex items-center space-x-1 ${
            dueDateStatus === 'overdue' ? 'text-red-600 dark:text-red-400' :
            dueDateStatus === 'due-soon' ? 'text-orange-600 dark:text-orange-400' :
            dueDateStatus === 'due-this-week' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-gray-500 dark:text-gray-400'
          }`}>
            <Calendar className="w-3 h-3" />
            <span className="text-xs">{formatDeadline(todo.deadline)}</span>
          </div>
        )}
      </div>

      {/* Estimated time */}
      {todo.estimatedTime && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
          <Clock className="w-3 h-3" />
          <span>Est. {todo.estimatedTime} min</span>
        </div>
      )}

      {/* Comments count */}
      {todo.comments && todo.comments.length > 0 && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
          <MessageSquare className="w-3 h-3" />
          <span>{todo.comments.length} comment{todo.comments.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Attachments count */}
      {todo.attachments && todo.attachments.length > 0 && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
          <Paperclip className="w-3 h-3" />
          <span>{todo.attachments.length} attachment{todo.attachments.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Created/Updated info */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <span>Created {new Date(todo.createdAt).toLocaleDateString()}</span>
        {todo.updatedAt !== todo.createdAt && (
          <span>Updated {new Date(todo.updatedAt).toLocaleDateString()}</span>
        )}
      </div>
    </motion.div>
  );
};

export default NotionStyleTodoCard; 