import React, { useState } from 'react';
import { motion, AnimatePresence   } from 'framer-motion';
import AdvancedTodoCard from './AdvancedTodoCard';

const KanbanBoard = ({ todos, onUpdate, onDelete, onToggleComplete }) => {
  const [draggedItem, setDraggedItem] = useState(null);

  const columns = [
    { id: 'pending', title: '📋 Pending', color: 'bg-gray-100' },
    { id: 'done', title: '✅ Done', color: 'bg-green-100' },
    { id: 'cancelled', title: '❌ Cancelled', color: 'bg-red-100' }
  ];

  const getTodosByStatus = (status) => {
    return todos.filter(todo => {
      if (status === 'done') return todo.status === 'done';
      if (status === 'cancelled') return todo.status === 'cancelled';
      if (status === 'pending') return !todo.status || todo.status === 'pending' || (todo.status !== 'done' && todo.status !== 'cancelled');
      return todo.status === status;
    });
  };

  const handleStatusChange = async (todoId, newStatus) => {
    const updateData = {
      status: newStatus,
      isDone: newStatus === 'done'
    };

    if (newStatus === 'done') {
      updateData.completedAt = new Date().toISOString();
      updateData.progress = 100;
    }

    try {
      await onUpdate(todoId, updateData);
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };

  const getColumnStats = (status) => {
    const columnTodos = getTodosByStatus(status);
    return {
      count: columnTodos.length,
      completed: columnTodos.filter(t => t.isDone).length,
      totalTime: columnTodos.reduce((sum, t) => sum + (t.timeSpent || 0), 0)
    };
  };

  return (<div className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {columns.map((column) => {
          const columnTodos = getTodosByStatus(column.id);
          const stats = getColumnStats(column.id);

          return (
            <div key={column.id} className="flex flex-col h-full">
              {/* Column Header */}
              <div className={`${column.color} rounded-t-xl p-4 border-b-2 border-white`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{column.title}</h3>
                  <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
                    {stats.count}
                  </span>
                </div>

                {/* Column Stats */}
                <div className="mt-2 text-xs text-gray-600">
                  {stats.totalTime > 0 && (
                    <div>⏱️ {Math.round(stats.totalTime / 60)}h {stats.totalTime % 60}m</div>
                  )}
                </div>
              </div>

              {/* Column Content */}
              <div className={`flex-1 p-4 space-y-4 min-h-[200px] ${column.color}`}>
                <AnimatePresence>
                  {columnTodos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="transform-gpu"
                    >
                      <div className="relative">
                        {/* Status Change Buttons */}
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <select
                            value={todo.status || 'pending'}
                            onChange={(e) => handleStatusChange(todo.id, e.target.value)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white"
                          >
                            <option value="pending">Pending</option>
                            <option value="done">Done</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div className="group">
                          <AdvancedTodoCard
                            todo={todo}
                            onToggleComplete={onToggleComplete}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                            compact={true}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Empty State */}
                {columnTodos.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">📭</div>
                    <div className="text-sm">Không có task nào</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
