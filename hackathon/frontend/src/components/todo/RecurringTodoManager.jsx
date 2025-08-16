import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { Calendar, Clock, Repeat, Settings, Plus, Trash2 } from 'lucide-react';

const RecurringTodoManager = ({ todo, onUpdate }) => {
  const { currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [pattern, setPattern] = useState(todo.recurringPattern || {
    frequency: 'daily',
    interval: 1,
    endDate: null,
    daysOfWeek: [],
    dayOfMonth: null
  });

  const frequencyOptions = [
    { value: 'daily', label: 'Daily', icon: '📅' },
    { value: 'weekly', label: 'Weekly', icon: '📆' },
    { value: 'monthly', label: 'Monthly', icon: '📊' },
    { value: 'yearly', label: 'Yearly', icon: '📈' }
  ];

  const daysOfWeek = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' }
  ];

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/todo/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isRecurring: true,
          recurringPattern: pattern
        })
      });

      const data = await response.json();
      if (data.success) {
        onUpdate(data.todo);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error updating recurring pattern:', error);
    }
  };

  const handleRemoveRecurring = async () => {
    try {
      const response = await fetch(`/api/todo/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isRecurring: false,
          recurringPattern: null
        })
      });

      const data = await response.json();
      if (data.success) {
        onUpdate(data.todo);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error removing recurring pattern:', error);
    }
  };

  const toggleDayOfWeek = (dayValue) => {
    setPattern(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayValue)
        ? prev.daysOfWeek.filter(d => d !== dayValue)
        : [...prev.daysOfWeek, dayValue]
    }));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
          todo.isRecurring
            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Repeat className="w-4 h-4 mr-1" />
        {todo.isRecurring ? 'Recurring' : 'Make Recurring'}
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`absolute top-full left-0 mt-2 p-4 rounded-lg shadow-lg z-50 min-w-80 ${
            currentTheme === 'neon' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                Recurring Settings
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded ${
                  currentTheme === 'neon' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Frequency Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Frequency
              </label>
              <div className="grid grid-cols-2 gap-2">
                {frequencyOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setPattern(prev => ({ ...prev, frequency: option.value }))}
                    className={`p-2 rounded-lg text-sm transition-colors ${
                      pattern.frequency === option.value
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : currentTheme === 'neon'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interval */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Every {pattern.interval} {pattern.frequency.slice(0, -2)}(s)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={pattern.interval}
                onChange={(e) => setPattern(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                className={`w-full p-2 rounded border ${
                  currentTheme === 'neon'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Days of Week for Weekly */}
            {pattern.frequency === 'weekly' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Days of Week
                </label>
                <div className="flex flex-wrap gap-1">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.value}
                      onClick={() => toggleDayOfWeek(day.value)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        pattern.daysOfWeek.includes(day.value)
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : currentTheme === 'neon'
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* End Date */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                End Date (Optional)
              </label>
              <input
                type="date"
                value={pattern.endDate || ''}
                onChange={(e) => setPattern(prev => ({ ...prev, endDate: e.target.value || null }))}
                className={`w-full p-2 rounded border ${
                  currentTheme === 'neon'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Pattern
              </button>
              {todo.isRecurring && (
                <button
                  onClick={handleRemoveRecurring}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove Recurring
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RecurringTodoManager; 