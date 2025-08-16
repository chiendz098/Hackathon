import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const TeacherAssignmentView = ({ onTodoCreated, onClose }) => {
  const { theme, currentTheme } = useTheme();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [filter, setFilter] = useState('pending');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher/assignments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAssignments(data.assignments);
          // Extract unique class names
          const uniqueClasses = ['all', ...new Set(data.assignments.map(a => a.className))];
          setClasses(uniqueClasses);
        }
      } else {
        console.error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const classMatch = selectedClass === 'all' || assignment.className === selectedClass;
    const statusMatch = filter === 'all' || assignment.status === filter;
    return classMatch && statusMatch;
  });

  const acceptAssignment = async (assignment) => {
    try {
      // Convert assignment to todo format
      const todoData = {
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject,
        priority: assignment.priority,
        difficulty: assignment.difficulty,
        dueDate: assignment.dueDate,
        estimatedTime: assignment.estimatedTime,
        creationMethod: 'teacher',
        teacherInfo: {
          teacherId: assignment.teacher,
          className: assignment.className,
          points: assignment.points,
          assignmentId: assignment.id
        },
        tags: ['assignment', assignment.subject.toLowerCase()]
      };

      const response = await fetch('/api/todo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(todoData)
      });

      const data = await response.json();
      if (data.success) {
        // Update assignment status
        setAssignments(prev => prev.map(a => 
          a.id === assignment.id ? { ...a, status: 'accepted' } : a
        ));
        onTodoCreated(data.todo);
      }
    } catch (error) {
      console.error('Error accepting assignment:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'blue';
      case 'accepted': return 'green';
      case 'declined': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className={currentTheme === 'neon' ? 'text-white' : 'text-gray-600'}>
            Loading assignments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className={`text-xl font-bold ${
              currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
            }`}>
              Teacher Assignments
            </h3>
            <p className={`text-sm ${
              currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {filteredAssignments.length} assignments available
            </p>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                currentTheme === 'neon'
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              ✕
            </button>
          )}
          
          <div className="flex gap-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className={`px-3 py-2 rounded-lg border transition-colors ${
                currentTheme === 'neon'
                  ? 'bg-gray-800 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {classes.map(className => (
                <option key={className} value={className}>
                  {className === 'all' ? 'All Classes' : className}
                </option>
              ))}
            </select>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border transition-colors ${
                currentTheme === 'neon'
                  ? 'bg-gray-800 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence>
          {filteredAssignments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">📚</div>
              <h3 className={`text-xl font-semibold mb-2 ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                No assignments found
              </h3>
              <p className={currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'}>
                Check back later for new assignments from your teachers
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                    currentTheme === 'neon'
                      ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                  }`}
                >
                  {/* Assignment Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={`text-lg font-semibold ${
                          currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {assignment.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assignment.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                          assignment.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <span>{assignment.teacherAvatar}</span>
                          <span className={currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'}>
                            {assignment.teacher}
                          </span>
                        </div>
                        <div className={currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'}>
                          📚 {assignment.className}
                        </div>
                        <div className={currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'}>
                          🏆 {assignment.points} points
                        </div>
                      </div>
                    </div>
                    
                    {assignment.status === 'pending' && (
                      <motion.button
                        onClick={() => acceptAssignment(assignment)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          currentTheme === 'neon'
                            ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Accept Assignment
                      </motion.button>
                    )}
                  </div>

                  {/* Assignment Details */}
                  <p className={`mb-4 ${
                    currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {assignment.description}
                  </p>

                  {/* Assignment Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${
                      currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className={`text-xs font-medium mb-1 ${
                        currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Due Date
                      </div>
                      <div className={`text-sm font-semibold ${
                        currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${
                      currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className={`text-xs font-medium mb-1 ${
                        currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Priority
                      </div>
                      <div className={`text-sm font-semibold capitalize ${
                        assignment.priority === 'urgent' ? 'text-red-500' :
                        assignment.priority === 'high' ? 'text-orange-500' :
                        assignment.priority === 'medium' ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {assignment.priority}
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${
                      currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className={`text-xs font-medium mb-1 ${
                        currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Est. Time
                      </div>
                      <div className={`text-sm font-semibold ${
                        currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {assignment.estimatedTime}min
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${
                      currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className={`text-xs font-medium mb-1 ${
                        currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Difficulty
                      </div>
                      <div className={`text-sm font-semibold ${
                        currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {'⭐'.repeat(assignment.difficulty)}/5
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  {assignment.instructions && assignment.instructions.length > 0 && (
                    <div className="mb-4">
                      <h5 className={`font-medium mb-2 ${
                        currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Instructions:
                      </h5>
                      <ul className={`list-disc list-inside space-y-1 text-sm ${
                        currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {assignment.instructions.map((instruction, idx) => (
                          <li key={idx}>{instruction}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Attachments */}
                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div>
                      <h5 className={`font-medium mb-2 ${
                        currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Attachments:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {assignment.attachments.map((attachment, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              currentTheme === 'neon'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            📎 {attachment}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeacherAssignmentView;
