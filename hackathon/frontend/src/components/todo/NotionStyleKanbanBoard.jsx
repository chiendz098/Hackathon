import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Plus, 
  MoreHorizontal, 
  Filter, 
  Search,
  Users,
  Clock,
  Calendar,
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
import NotionStyleTodoCard from './NotionStyleTodoCard';

const NotionStyleKanbanBoard = ({ 
  todos, 
  onTodoSelect, 
  onTodoMove, 
  onTodoUpdate, 
  onTodoDelete, 
  members, 
  darkMode 
}) => {
  const [draggedTodo, setDraggedTodo] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createColumn, setCreateColumn] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [columnSorts, setColumnSorts] = useState({});
  const [showColumnSettings, setShowColumnSettings] = useState(null);

  // Column configuration
  const columns = useMemo(() => [
    {
      id: 'pending',
      title: 'Pending',
      icon: Clock,
      color: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-700 dark:text-gray-300',
      borderColor: 'border-gray-200 dark:border-gray-700',
      todos: todos.pending || []
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      icon: Activity,
      color: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-blue-700 dark:text-blue-300',
      borderColor: 'border-blue-200 dark:border-blue-700',
      todos: todos.in_progress || []
    },
    {
      id: 'review',
      title: 'Review',
      icon: Target,
      color: 'bg-purple-100 dark:bg-purple-900',
      textColor: 'text-purple-700 dark:text-purple-300',
      borderColor: 'border-purple-200 dark:border-purple-700',
      todos: todos.review || []
    },
    {
      id: 'completed',
      title: 'Completed',
      icon: Check,
      color: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-green-700 dark:text-green-300',
      borderColor: 'border-green-200 dark:border-green-700',
      todos: todos.completed || []
    }
  ], [todos]);

  // Handle drag start
  const handleDragStart = (todo, columnId) => {
    setDraggedTodo({ ...todo, sourceColumn: columnId });
  };

  // Handle drag end
  const handleDragEnd = async (result, columnId) => {
    if (!draggedTodo || !result.destination) {
      setDraggedTodo(null);
      return;
    }

    const { sourceColumn } = draggedTodo;
    const destinationColumn = columnId;
    
    if (sourceColumn !== destinationColumn) {
      try {
        await onTodoMove(draggedTodo.id, destinationColumn, result.destination.index);
      } catch (error) {
        console.error('Error moving todo:', error);
      }
    }
    
    setDraggedTodo(null);
  };

  // Handle column reorder
  const handleColumnReorder = (newOrder) => {
    // Update column order in settings
    console.log('New column order:', newOrder);
  };

  // Handle todo reorder within column
  const handleTodoReorder = async (columnId, newOrder) => {
    try {
      // Update todo order within column
      const updatedTodos = newOrder.map((todo, index) => ({
        ...todo,
        order: index
      }));
      
      // Update todos in the column
      updatedTodos.forEach(todo => {
        onTodoUpdate(todo.id, { order: todo.order });
      });
    } catch (error) {
      console.error('Error reordering todos:', error);
    }
  };

  // Add new column
  const handleAddColumn = () => {
    if (createColumn.trim()) {
      // Add new column logic
      console.log('Adding new column:', createColumn);
      setCreateColumn('');
      setShowCreateModal(false);
    }
  };

  // Delete column
  const handleDeleteColumn = (columnId) => {
    // Delete column logic
    console.log('Deleting column:', columnId);
    setShowColumnSettings(null);
  };

  // Rename column
  const handleRenameColumn = (columnId, newName) => {
    // Rename column logic
    console.log('Renaming column:', columnId, 'to:', newName);
    setShowColumnSettings(null);
  };

  // Get column statistics
  const getColumnStats = (column) => {
    const totalTodos = column.todos.length;
    const completedTodos = column.todos.filter(todo => todo.status === 'completed').length;
    const overdueTodos = column.todos.filter(todo => {
      if (!todo.deadline) return false;
      return new Date(todo.deadline) < new Date();
    }).length;
    
    return { totalTodos, completedTodos, overdueTodos };
  };

  // Filter todos in column
  const getFilteredTodos = (column) => {
    let filteredTodos = [...column.todos];
    
    // Apply column-specific filters
    if (columnFilters[column.id]) {
      const filter = columnFilters[column.id];
      
      if (filter.search) {
        filteredTodos = filteredTodos.filter(todo =>
          todo.title.toLowerCase().includes(filter.search.toLowerCase()) ||
          todo.description?.toLowerCase().includes(filter.search.toLowerCase())
        );
      }
      
      if (filter.priority && filter.priority !== 'all') {
        filteredTodos = filteredTodos.filter(todo => todo.priority === filter.priority);
      }
      
      if (filter.assignee && filter.assignee !== 'all') {
        filteredTodos = filteredTodos.filter(todo =>
          todo.assignments?.some(a => a.assignedTo === filter.assignee)
        );
      }
    }
    
    // Apply column-specific sorting
    if (columnSorts[column.id]) {
      const sort = columnSorts[column.id];
      
      filteredTodos.sort((a, b) => {
        switch (sort.field) {
          case 'title':
            return sort.direction === 'asc' 
              ? a.title.localeCompare(b.title)
              : b.title.localeCompare(a.title);
          case 'priority':
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            return sort.direction === 'asc'
              ? priorityOrder[a.priority] - priorityOrder[b.priority]
              : priorityOrder[b.priority] - priorityOrder[a.priority];
          case 'deadline':
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return sort.direction === 'asc'
              ? new Date(a.deadline) - new Date(b.deadline)
              : new Date(b.deadline) - new Date(a.deadline);
          case 'createdAt':
            return sort.direction === 'asc'
              ? new Date(a.createdAt) - new Date(b.createdAt)
              : new Date(b.createdAt) - new Date(a.createdAt);
          default:
            return 0;
        }
      });
    }
    
    return filteredTodos;
  };

  // Handle column filter change
  const handleColumnFilterChange = (columnId, filterType, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        [filterType]: value
      }
    }));
  };

  // Handle column sort change
  const handleColumnSortChange = (columnId, field, direction) => {
    setColumnSorts(prev => ({
      ...prev,
      [columnId]: { field, direction }
    }));
  };

  // Handle bulk actions
  const handleBulkAction = async (action, selectedTodoIds, columnId) => {
    try {
      switch (action) {
        case 'delete':
          await Promise.all(selectedTodoIds.map(id => onTodoDelete(id)));
          break;
        case 'move':
          // Move todos to another column
          break;
        case 'assign':
          // Assign todos to specific user
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Board header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kanban Board</h2>
          <p className="text-gray-600 dark:text-gray-400">Organize and track your todos</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Column</span>
          </button>
        </div>
      </div>

      {/* Board content */}
      <div className="flex space-x-6 overflow-x-auto pb-4">
        <Reorder.Group
          axis="x"
          values={columns}
          onReorder={handleColumnReorder}
          className="flex space-x-6"
        >
          {columns.map((column) => {
            const filteredTodos = getFilteredTodos(column);
            const stats = getColumnStats(column);
            
            return (
              <Reorder.Item
                key={column.id}
                value={column}
                className="flex-shrink-0"
              >
                <motion.div
                  layout
                  className={`w-80 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${column.borderColor} shadow-sm`}
                >
                  {/* Column header */}
                  <div className={`p-4 ${column.color} rounded-t-lg border-b ${column.borderColor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {React.createElement(column.icon, { 
                          className: `w-5 h-5 ${column.textColor}` 
                        })}
                        <h3 className={`font-semibold ${column.textColor}`}>
                          {column.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${column.textColor} bg-white dark:bg-gray-700 bg-opacity-50`}>
                          {filteredTodos.length}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {/* Column filter */}
                        <button
                          onClick={() => setColumnFilters(prev => ({
                            ...prev,
                            [column.id]: !prev[column.id] ? {} : undefined
                          }))}
                          className={`p-1 rounded transition-colors ${
                            columnFilters[column.id] ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        
                        {/* Column settings */}
                        <button
                          onClick={() => setShowColumnSettings(showColumnSettings === column.id ? null : column.id)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Column statistics */}
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      <span className={column.textColor}>
                        Total: {stats.totalTodos}
                      </span>
                      {stats.completedTodos > 0 && (
                        <span className="text-green-600 dark:text-green-400">
                          Done: {stats.completedTodos}
                        </span>
                      )}
                      {stats.overdueTodos > 0 && (
                        <span className="text-red-600 dark:text-red-400">
                          Overdue: {stats.overdueTodos}
                        </span>
                      )}
                    </div>

                    {/* Column filters */}
                    {columnFilters[column.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-2"
                      >
                        <input
                          type="text"
                          placeholder="Search in column..."
                          value={columnFilters[column.id]?.search || ''}
                          onChange={(e) => handleColumnFilterChange(column.id, 'search', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        
                        <div className="flex space-x-2">
                          <select
                            value={columnFilters[column.id]?.priority || 'all'}
                            onChange={(e) => handleColumnFilterChange(column.id, 'priority', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="all">All Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                          
                          <select
                            value={columnFilters[column.id]?.assignee || 'all'}
                            onChange={(e) => handleColumnFilterChange(column.id, 'assignee', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="all">All Assignees</option>
                            {members.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Column content */}
                  <div className="p-2 min-h-[400px]">
                    <Reorder.Group
                      axis="y"
                      values={filteredTodos}
                      onReorder={(newOrder) => handleTodoReorder(column.id, newOrder)}
                      className="space-y-2"
                    >
                      <AnimatePresence>
                        {filteredTodos.map((todo, index) => (
                          <Reorder.Item
                            key={todo.id}
                            value={todo}
                            dragListener={false}
                          >
                            <motion.div
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              whileHover={{ scale: 1.02 }}
                              className="relative"
                            >
                              <NotionStyleTodoCard
                                todo={todo}
                                onSelect={() => onTodoSelect(todo)}
                                onUpdate={onTodoUpdate}
                                onDelete={onTodoDelete}
                                members={members}
                                darkMode={darkMode}
                              />
                              
                              {/* Drag handle */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DragHandle className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                              </div>
                            </motion.div>
                          </Reorder.Item>
                        ))}
                      </AnimatePresence>
                    </Reorder.Group>

                    {/* Empty state */}
                    {filteredTodos.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p className="text-sm">No todos in this column</p>
                        <p className="text-xs mt-1">Drag and drop todos here</p>
                      </div>
                    )}
                  </div>

                  {/* Column footer */}
                  <div className={`p-3 ${column.color} rounded-b-lg border-t ${column.borderColor}`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={column.textColor}>
                        {filteredTodos.length} todo{filteredTodos.length !== 1 ? 's' : ''}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        {/* Column sort options */}
                        <select
                          value={columnSorts[column.id]?.field || 'createdAt'}
                          onChange={(e) => handleColumnSortChange(column.id, e.target.value, columnSorts[column.id]?.direction || 'desc')}
                          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="createdAt">Created</option>
                          <option value="title">Title</option>
                          <option value="priority">Priority</option>
                          <option value="deadline">Deadline</option>
                        </select>
                        
                        <button
                          onClick={() => handleColumnSortChange(
                            column.id, 
                            columnSorts[column.id]?.field || 'createdAt',
                            columnSorts[column.id]?.direction === 'asc' ? 'desc' : 'asc'
                          )}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          {columnSorts[column.id]?.direction === 'asc' ? '↑' : '↓'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      {/* Add column modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full`}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Add New Column
                </h3>
                
                <input
                  type="text"
                  placeholder="Column name..."
                  value={createColumn}
                  onChange={(e) => setCreateColumn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                />
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddColumn}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Column
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Column settings modal */}
      <AnimatePresence>
        {showColumnSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full`}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Column Settings
                </h3>
                
                <div className="space-y-4">
                  <button
                    onClick={() => handleRenameColumn(showColumnSettings, 'New Name')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Rename Column
                  </button>
                  
                  <button
                    onClick={() => handleDeleteColumn(showColumnSettings)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-700 dark:text-red-300 transition-colors"
                  >
                    Delete Column
                  </button>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowColumnSettings(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotionStyleKanbanBoard; 