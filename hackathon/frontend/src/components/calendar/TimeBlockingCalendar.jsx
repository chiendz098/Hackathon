import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../../api';

const TimeBlockingCalendar = ({ isOpen, onClose }) => {
  const { theme, currentTheme } = useTheme();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState([]);
  const [viewMode, setViewMode] = useState('day'); // day, week
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);
  const [newBlockData, setNewBlockData] = useState({ startTime: '', endTime: '', title: '', type: 'task' });

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  useEffect(() => {
    fetchTimeBlocks();
    fetchUnscheduledTasks();
  }, [selectedDate]);

  const fetchTimeBlocks = async () => {
    try {
      const response = await api.get(`/calendar/time-blocks?date=${selectedDate.toISOString().split('T')[0]}`);
      if (response.data.success) {
        setTimeBlocks(response.data.blocks);
      } else {
        console.error('Failed to fetch time blocks:', response.data.message);
        setTimeBlocks([]);
      }
    } catch (error) {
      console.error('Error fetching time blocks:', error);
      setTimeBlocks([]);
    }
  };

  const fetchUnscheduledTasks = async () => {
    try {
      const response = await api.get('/todo/unscheduled');
      if (response.data.success) {
        setUnscheduledTasks(response.data.tasks);
      } else {
        console.error('Failed to fetch unscheduled tasks');
        setUnscheduledTasks([]);
      }
    } catch (error) {
      console.error('Error fetching unscheduled tasks:', error);
      setUnscheduledTasks([]);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;

    // Handle task scheduling
    if (source.droppableId === 'unscheduled' && destination.droppableId.startsWith('timeslot-')) {
      const timeSlot = destination.droppableId.replace('timeslot-', '');
      const task = unscheduledTasks.find(t => t.id === draggableId);
      
      if (task) {
        await scheduleTask(task, timeSlot);
      }
    }
    
    // Handle time block reordering
    if (source.droppableId.startsWith('timeslot-') && destination.droppableId.startsWith('timeslot-')) {
      const newTimeSlot = destination.droppableId.replace('timeslot-', '');
      await moveTimeBlock(draggableId, newTimeSlot);
    }
  };

  const scheduleTask = async (task, startTime) => {
    const endTime = calculateEndTime(startTime, task.estimatedTime);
    
    const newBlock = {
      id: `block_${Date.now()}`,
      title: task.title,
      startTime,
      endTime,
      type: 'task',
      subject: task.subject,
      priority: task.priority,
      taskId: task.id
    };

    try {
      const response = await fetch('/api/calendar/time-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newBlock)
      });

      if (response.ok) {
        setTimeBlocks(prev => [...prev, newBlock]);
        setUnscheduledTasks(prev => prev.filter(t => t.id !== task.id));
      }
    } catch (error) {
      console.error('Error scheduling task:', error);
    }
  };

  const moveTimeBlock = async (blockId, newStartTime) => {
    const block = timeBlocks.find(b => b.id === blockId);
    if (!block) return;

    const duration = calculateDuration(block.startTime, block.endTime);
    const newEndTime = calculateEndTime(newStartTime, duration);

    const updatedBlock = {
      ...block,
      startTime: newStartTime,
      endTime: newEndTime
    };

    try {
      const response = await fetch(`/api/calendar/time-blocks/${blockId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedBlock)
      });

      if (response.ok) {
        setTimeBlocks(prev => prev.map(b => b.id === blockId ? updatedBlock : b));
      }
    } catch (error) {
      console.error('Error moving time block:', error);
    }
  };

  const calculateEndTime = (startTime, durationMinutes) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const calculateDuration = (startTime, endTime) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    return (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  };

  const getBlockColor = (type, priority) => {
    if (currentTheme === 'neon') {
      switch (type) {
        case 'study': return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-100';
        case 'assignment': return 'bg-purple-500/20 border-purple-500/50 text-purple-100';
        case 'break': return 'bg-green-500/20 border-green-500/50 text-green-100';
        default: return 'bg-gray-500/20 border-gray-500/50 text-gray-100';
      }
    } else {
      switch (type) {
        case 'study': return 'bg-blue-100 border-blue-300 text-blue-800';
        case 'assignment': return 'bg-purple-100 border-purple-300 text-purple-800';
        case 'break': return 'bg-green-100 border-green-300 text-green-800';
        default: return 'bg-gray-100 border-gray-300 text-gray-800';
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const createTimeBlock = async () => {
    if (!newBlockData.title || !newBlockData.startTime || !newBlockData.endTime) return;

    const block = {
      id: `block_${Date.now()}`,
      ...newBlockData,
      date: selectedDate.toISOString().split('T')[0]
    };

    try {
      const response = await fetch('/api/calendar/time-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(block)
      });

      if (response.ok) {
        setTimeBlocks(prev => [...prev, block]);
        setNewBlockData({ startTime: '', endTime: '', title: '', type: 'task' });
        setIsCreatingBlock(false);
      }
    } catch (error) {
      console.error('Error creating time block:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`max-w-7xl w-full max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
            currentTheme === 'neon' 
              ? 'bg-gray-900 border border-cyan-500/30' 
              : 'bg-white border border-gray-200'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 border-b ${
            currentTheme === 'neon' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${
                  currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                }`}>
                  📅 Time Blocking Calendar
                </h2>
                <p className={`mt-1 ${
                  currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Drag and drop tasks to schedule your day
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    currentTheme === 'neon'
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                
                <button
                  onClick={() => setIsCreatingBlock(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentTheme === 'neon'
                      ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  + Add Block
                </button>
                
                <button
                  onClick={onClose}
                  className={`p-2 rounded-full transition-colors ${
                    currentTheme === 'neon' 
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex h-[calc(90vh-120px)]">
              {/* Unscheduled Tasks Sidebar */}
              <div className={`w-80 p-6 border-r overflow-y-auto ${
                currentTheme === 'neon' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                }`}>
                  📋 Unscheduled Tasks
                </h3>
                
                <Droppable droppableId="unscheduled">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-3"
                    >
                      {unscheduledTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 rounded-lg border-2 cursor-move transition-all duration-300 ${
                                snapshot.isDragging
                                  ? 'shadow-lg scale-105'
                                  : currentTheme === 'neon'
                                    ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                              } ${getPriorityColor(task.priority)} border-l-4`}
                            >
                              <h4 className={`font-semibold text-sm ${
                                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {task.title}
                              </h4>
                              <div className={`text-xs mt-1 ${
                                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                📚 {task.subject} • ⏱️ {task.estimatedTime}min
                              </div>
                              <div className={`text-xs mt-1 ${
                                task.priority === 'high' ? 'text-red-500' :
                                task.priority === 'medium' ? 'text-yellow-500' :
                                'text-green-500'
                              }`}>
                                {task.priority.toUpperCase()} PRIORITY
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              {/* Calendar Grid */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-1">
                    {timeSlots.map((timeSlot) => {
                      const blocksInSlot = timeBlocks.filter(block => 
                        block.startTime <= timeSlot && block.endTime > timeSlot
                      );

                      return (
                        <Droppable key={timeSlot} droppableId={`timeslot-${timeSlot}`}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`min-h-16 p-2 border-b transition-all duration-300 ${
                                snapshot.isDraggingOver
                                  ? currentTheme === 'neon'
                                    ? 'bg-cyan-500/10 border-cyan-500/30'
                                    : 'bg-blue-50 border-blue-200'
                                  : currentTheme === 'neon'
                                    ? 'border-gray-700'
                                    : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`text-sm font-medium w-16 ${
                                  currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  {timeSlot}
                                </div>
                                
                                <div className="flex-1 space-y-2">
                                  {blocksInSlot.map((block, index) => (
                                    <Draggable key={block.id} draggableId={String(block.id)} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`p-3 rounded-lg border-2 cursor-move transition-all duration-300 ${
                                            snapshot.isDragging
                                              ? 'shadow-lg scale-105'
                                              : ''
                                          } ${getBlockColor(block.type, block.priority)} ${getPriorityColor(block.priority)} border-l-4`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-sm">
                                              {block.title}
                                            </h4>
                                            <span className="text-xs opacity-75">
                                              {block.startTime} - {block.endTime}
                                            </span>
                                          </div>
                                          {block.subject && (
                                            <div className="text-xs mt-1 opacity-75">
                                              📚 {block.subject}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              </div>
                            </div>
                          )}
                        </Droppable>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </DragDropContext>

          {/* Create Block Modal */}
          <AnimatePresence>
            {isCreatingBlock && (
              <motion.div
                className="absolute inset-0 bg-black/50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className={`p-6 rounded-xl max-w-md w-full mx-4 ${
                    currentTheme === 'neon' ? 'bg-gray-800 border border-cyan-500/30' : 'bg-white'
                  }`}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                >
                  <h3 className={`text-xl font-bold mb-4 ${
                    currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Create Time Block
                  </h3>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Block title"
                      value={newBlockData.title}
                      onChange={(e) => setNewBlockData(prev => ({ ...prev, title: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        currentTheme === 'neon'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="time"
                        value={newBlockData.startTime}
                        onChange={(e) => setNewBlockData(prev => ({ ...prev, startTime: e.target.value }))}
                        className={`px-3 py-2 rounded-lg border ${
                          currentTheme === 'neon'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <input
                        type="time"
                        value={newBlockData.endTime}
                        onChange={(e) => setNewBlockData(prev => ({ ...prev, endTime: e.target.value }))}
                        className={`px-3 py-2 rounded-lg border ${
                          currentTheme === 'neon'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    
                    <select
                      value={newBlockData.type}
                      onChange={(e) => setNewBlockData(prev => ({ ...prev, type: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        currentTheme === 'neon'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="task">Task</option>
                      <option value="study">Study Session</option>
                      <option value="assignment">Assignment</option>
                      <option value="break">Break</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setIsCreatingBlock(false)}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                        currentTheme === 'neon' 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createTimeBlock}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        currentTheme === 'neon'
                          ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Create
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TimeBlockingCalendar;
