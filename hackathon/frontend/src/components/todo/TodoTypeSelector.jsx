import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Users,
  GraduationCap,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Search,
  BookOpen,
  Calendar,
  Clock,
  Target,
  Star,
  Award,
  Trophy,
  Flame,
  Sparkles,
  Rocket,
  Brain,
  Zap,
  Lightbulb,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Share2,
  MessageCircle,
  Bell,
  BellOff
} from 'lucide-react';

const TodoTypeSelector = ({ 
  selectedType, 
  onTypeChange, 
  onGroupSelect, 
  onClassroomSelect,
  userGroups = [],
  userClassrooms = [],
  userRole = 'student' // 'student' or 'teacher'
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showClassroomSelector, setShowClassroomSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const todoTypes = [
    {
      id: 'personal',
      name: 'Personal Task',
      description: 'Công việc cá nhân của bạn',
      icon: '👤',
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      id: 'group',
      name: 'Group Project',
      description: 'Dự án nhóm - phân công việc cho từng thành viên',
      icon: '👥',
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700'
    },
    {
      id: 'teacher_assignment',
      name: 'Teacher Assignment',
      description: 'Bài tập từ giáo viên - tự động tạo cho cả lớp',
      icon: '🎓',
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      teacherOnly: true
    }
  ];

  const selectedTypeData = todoTypes.find(type => type.id === selectedType);

  const handleTypeSelect = (typeId) => {
    onTypeChange(typeId);
    setShowOptions(false);
    
    if (typeId === 'group') {
      setShowGroupSelector(true);
    } else if (typeId === 'teacher_assignment') {
      setShowClassroomSelector(true);
    }
  };

  const handleGroupSelect = (groupId) => {
    onGroupSelect(groupId);
    setShowGroupSelector(false);
  };

  const handleClassroomSelect = (classroomId) => {
    onClassroomSelect(classroomId);
    setShowClassroomSelector(false);
  };

  const filteredGroups = userGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClassrooms = userClassrooms.filter(classroom =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Main Type Selector */}
      <div className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
            selectedTypeData 
              ? `${selectedTypeData.bgColor} ${selectedTypeData.borderColor} ${selectedTypeData.textColor}`
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedTypeData ? (
                <>
                  <span className="text-2xl">{selectedTypeData.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold">{selectedTypeData.name}</div>
                    <div className="text-sm opacity-80">{selectedTypeData.description}</div>
                  </div>
                </>
              ) : (
                <>
                  <Plus className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold">Select Todo Type</div>
                    <div className="text-sm opacity-80">Choose how to create your task</div>
                  </div>
                </>
              )}
            </div>
            {showOptions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {/* Type Options Dropdown */}
        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            >
              <div className="p-2 space-y-1">
                {todoTypes.map((type) => {
                  // Hide teacher assignment for students
                  if (type.teacherOnly && userRole !== 'teacher') {
                    return null;
                  }

                  return (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type.id)}
                      className={`w-full p-3 rounded-lg text-left transition-all duration-200 hover:scale-105 ${
                        selectedType === type.id
                          ? `${type.bgColor} ${type.borderColor} ${type.textColor}`
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{type.icon}</span>
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm opacity-80">{type.description}</div>
                        </div>
                        {selectedType === type.id && (
                          <Check className="w-5 h-5 ml-auto" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Group Selector */}
      <AnimatePresence>
        {showGroupSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Select Group
              </h3>
              <button
                onClick={() => setShowGroupSelector(false)}
                className="p-1 hover:bg-green-200 dark:hover:bg-green-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {userGroups.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-green-700 dark:text-green-300 mb-2">No groups available</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Join a group first to create group tasks
                </p>
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-green-300 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handleGroupSelect(group.id)}
                      className="w-full p-3 bg-white dark:bg-gray-700 rounded-lg border border-green-200 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-800/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {group.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {group.description || 'No description'}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                            {group.members?.length || 0} members
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {group.leaderId && (
                            <div className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs rounded">
                              Leader
                            </div>
                          )}
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classroom Selector */}
      <AnimatePresence>
        {showClassroomSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2" />
                Select Classroom
              </h3>
              <button
                onClick={() => setShowClassroomSelector(false)}
                className="p-1 hover:bg-purple-200 dark:hover:bg-purple-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {userClassrooms.length === 0 ? (
              <div className="text-center py-6">
                <GraduationCap className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <p className="text-purple-700 dark:text-purple-300 mb-2">No classrooms available</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {userRole === 'teacher' 
                    ? 'Create a classroom first to assign tasks'
                    : 'Join a classroom first to receive assignments'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search classrooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-purple-300 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredClassrooms.map((classroom) => (
                    <button
                      key={classroom.id}
                      onClick={() => handleClassroomSelect(classroom.id)}
                      className="w-full p-3 bg-white dark:bg-gray-700 rounded-lg border border-purple-200 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-800/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {classroom.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {classroom.subject || 'No subject'}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            {classroom.students?.length || 0} students
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {userRole === 'teacher' && (
                            <div className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 text-xs rounded">
                              Teacher
                            </div>
                          )}
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Type Info */}
      {selectedTypeData && (
        <div className={`p-4 rounded-lg ${selectedTypeData.bgColor} border ${selectedTypeData.borderColor}`}>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">{selectedTypeData.icon}</span>
            <div className="flex-1">
              <h3 className={`font-semibold ${selectedTypeData.textColor}`}>
                {selectedTypeData.name}
              </h3>
              <p className="text-sm opacity-80 mt-1">
                {selectedTypeData.description}
              </p>
              
              {/* Additional info based on type */}
              {selectedType === 'group' && (
                <div className="mt-2 text-sm">
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <Users className="w-4 h-4" />
                    <span>All group members will see this task</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 mt-1">
                    <Target className="w-4 h-4" />
                    <span>You can assign specific tasks to members</span>
                  </div>
                </div>
              )}
              
              {selectedType === 'teacher_assignment' && (
                <div className="mt-2 text-sm">
                  <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                    <GraduationCap className="w-4 h-4" />
                    <span>Task will be created for all students in the classroom</span>
                  </div>
                  <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>Students will see this as an assignment from you</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoTypeSelector; 