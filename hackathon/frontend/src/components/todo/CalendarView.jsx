import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

const CalendarView = ({ todos, onUpdate, onDelete, onToggleComplete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get calendar data
  const calendarData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth, currentYear]);

  // Group todos by date
  const todosByDate = useMemo(() => {
    const grouped = {};
    
    todos.forEach(todo => {
      if (todo.deadline) {
        const date = new Date(todo.deadline).toDateString();
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(todo);
      }
    });

    return grouped;
  }, [todos]);

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getTodosForDate = (date) => {
    return todosByDate[date.toDateString()] || [];
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-blue-500';
      case 5: return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-bold">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mt-4">
          {dayNames.map((day) => (
            <div key={day} className="text-center py-2 text-sm font-medium">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 p-4">
        {calendarData.map((date, index) => {
          const dateTodos = getTodosForDate(date);
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
          
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedDate(date)}
              className={`
                min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all
                ${isToday(date) ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:border-gray-300'}
                ${!isCurrentMonth(date) ? 'opacity-50' : ''}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              {/* Date Number */}
              <div className={`text-sm font-medium mb-1 ${
                isToday(date) ? 'text-blue-600' : 
                !isCurrentMonth(date) ? 'text-gray-400' : 'text-gray-800'
              }`}>
                {date.getDate()}
              </div>

              {/* Todos for this date */}
              <div className="space-y-1">
                {dateTodos.slice(0, 3).map((todo) => (
                  <div
                    key={todo.id}
                    className={`text-xs p-1 rounded truncate ${
                      todo.isDone ? 'bg-green-100 text-green-800 line-through' : 'bg-gray-100 text-gray-800'
                    }`}
                    title={todo.title}
                  >
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(todo.priority)}`} />
                      <span className="truncate">{todo.title}</span>
                    </div>
                  </div>
                ))}
                
                {dateTodos.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dateTodos.length - 3} khác
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-200 p-6 bg-gray-50"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Tasks cho {selectedDate.toLocaleDateString('vi-VN')}</span>
          </h3>

          <div className="space-y-3">
            {getTodosForDate(selectedDate).map((todo) => (
              <div
                key={todo.id}
                className={`p-3 rounded-lg border ${
                  todo.isDone ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onToggleComplete(todo)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        todo.isDone 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                      aria-label={todo.isDone ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {todo.isDone && '✓'}
                    </button>
                    
                    <div>
                      <h4 className={`font-medium ${todo.isDone ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {todo.title}
                      </h4>
                      {todo.description && (
                        <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {todo.deadline && (
                      <span className="text-xs text-gray-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(todo.deadline).toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </span>
                    )}
                    
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(todo.priority)}`} />
                  </div>
                </div>
              </div>
            ))}

            {getTodosForDate(selectedDate).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Không có task nào cho ngày này</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CalendarView;
