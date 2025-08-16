import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useForm from '../../hooks/useForm';
import useApi from '../../hooks/useApi';
import { formConfigs } from '../../utils/validation';
import { logger } from '../../utils/monitoring';
import { ErrorBoundary } from '../../utils/errorHandler';
import { validateFile } from '../../utils/security';
import TodoTypeSelector from './TodoTypeSelector';
import { 
  X, 
  Mic, 
  MicOff, 
  Brain, 
  Target, 
  Clock, 
  BookOpen, 
  Zap, 
  Star, 
  Calendar,
  Tag,
  Paperclip,
  Lightbulb,
  TrendingUp,
  Users,
  Award,
  Timer,
  Coffee,
  Music,
  Moon,
  Sun,
  GraduationCap,
  User,
  MessageCircle,
  Share2,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const AdvancedTodoForm = ({ onSuccess, onCancel, initialValues = null, isEdit = false, title = "Create New Task" }) => {
  const { post, put, get } = useApi();
  const [isRecording, setIsRecording] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showStudyPlanner, setShowStudyPlanner] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [voiceText, setVoiceText] = useState('');
  const [todoType, setTodoType] = useState('personal');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedClassroomId, setSelectedClassroomId] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [userClassrooms, setUserClassrooms] = useState([]);
  const [userRole, setUserRole] = useState('student');
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false);
  const [studySession, setStudySession] = useState({
    duration: 25,
    breakTime: 5,
    sessions: 4,
    focusMode: 'pomodoro',
    backgroundMusic: false,
    ambientSound: 'none'
  });
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load user groups and classrooms
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user groups
        const groupsResponse = await get('/group/user-groups');
        setUserGroups(groupsResponse.data || []);

        // Load user classrooms
        const classroomsResponse = await get('/classroom/user-classrooms');
        setUserClassrooms(classroomsResponse.data || []);

        // Get user role (simplified - in real app, get from user context)
        setUserRole('student'); // This should come from user context
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Smart templates for students
  const smartTemplates = [
    {
      id: 'exam-prep',
      name: '📚 Exam Preparation',
      icon: '🎯',
      template: {
        title: 'Prepare for [Subject] Exam',
        description: 'Comprehensive exam preparation including review, practice tests, and study materials',
        category: 'academic',
        estimatedTime: 120,
        priority: 'high',
        tags: ['exam', 'study', 'review'],
        subtasks: [
          'Review lecture notes and materials',
          'Create study guide and flashcards',
          'Practice with past exam questions',
          'Group study session',
          'Final review and confidence check'
        ]
      }
    },
    {
      id: 'project-work',
      name: '💻 Project Work',
      icon: '🚀',
      template: {
        title: '[Project Name] Development',
        description: 'Project development with milestones and deliverables',
        category: 'project',
        estimatedTime: 180,
        priority: 'high',
        tags: ['project', 'development', 'coding'],
        subtasks: [
          'Project planning and requirements',
          'Research and design phase',
          'Implementation and coding',
          'Testing and debugging',
          'Documentation and presentation'
        ]
      }
    },
    {
      id: 'research-paper',
      name: '📝 Research Paper',
      icon: '🔬',
      template: {
        title: 'Research Paper: [Topic]',
        description: 'Academic research paper writing process',
        category: 'academic',
        estimatedTime: 240,
        priority: 'high',
        tags: ['research', 'writing', 'academic'],
        subtasks: [
          'Topic selection and research question',
          'Literature review and sources',
          'Data collection and analysis',
          'Writing and drafting',
          'Revision and final submission'
        ]
      }
    },
    {
      id: 'group-study',
      name: '👥 Group Study',
      icon: '🤝',
      template: {
        title: 'Group Study Session',
        description: 'Collaborative learning session with peers',
        category: 'collaboration',
        estimatedTime: 120,
        priority: 'medium',
        tags: ['group', 'collaboration', 'study'],
        subtasks: [
          'Coordinate with study partners',
          'Prepare discussion topics',
          'Share resources and notes',
          'Practice presentations',
          'Review and clarify doubts'
        ]
      }
    },
    {
      id: 'teacher-assignment',
      name: '🎓 Teacher Assignment',
      icon: '📋',
      template: {
        title: '[Subject] Assignment',
        description: 'Academic assignment from teacher',
        category: 'academic',
        estimatedTime: 90,
        priority: 'high',
        tags: ['assignment', 'academic', 'homework'],
        subtasks: [
          'Read assignment requirements',
          'Research and gather materials',
          'Complete the assignment',
          'Review and proofread',
          'Submit before deadline'
        ]
      }
    }
  ];

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setError,
    setValues
  } = useForm(initialValues || {
    title: '', 
    description: '', 
    dueDate: '', 
    priority: 'medium', 
    tags: [], 
    attachments: [],
    category: 'general',
    estimatedTime: 60,
    difficulty: 'medium',
    subject: '',
    location: '',
    isRecurring: false,
    recurringPattern: 'daily',
    subtasks: [],
    studyMode: 'individual',
    focusLevel: 'medium',
    energyLevel: 'medium',
    motivation: 'high',
    todoType: 'personal',
    groupId: null,
    classroomId: null,
    assignmentType: '',
    maxScore: null,
    groupMembers: [],
    collaborators: []
  }, formConfigs.createTodo, async (formData) => {
    try {
      // Add todo type and related data
      formData.todoType = todoType;
      formData.groupId = selectedGroupId;
      formData.classroomId = selectedClassroomId;

      // Handle file uploads first
      if (formData.attachments.length > 0) {
        const uploadPromises = formData.attachments.map(async (file) => {
          const validation = validateFile(file);
          if (!validation.valid) {
            throw new Error(validation.message);
          }

          const formData = new FormData();
          formData.append('file', file);
          const response = await post('/file/upload', formData);
          return response.fileUrl;
        });

        const fileUrls = await Promise.all(uploadPromises);
        formData.attachmentUrls = fileUrls;
      }

      // Add study session data if applicable
      if (showStudyPlanner) {
        formData.studySession = studySession;
      }

      // Create or update todo
      const endpoint = isEdit ? `/todo/${initialValues.id}` : '/todo';
      const method = isEdit ? put : post;
      const response = await method(endpoint, formData);

      logger.info(`Todo ${isEdit ? 'updated' : 'created'} successfully`, {
        todoId: response.id,
        todoType: formData.todoType
      });

      onSuccess(response);
    } catch (error) {
      logger.error(`Failed to ${isEdit ? 'update' : 'create'} todo`, {
        error,
        formData
      });
      throw error;
    }
  });

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'vi-VN';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setVoiceText(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
    }
  }, []);

  const startVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const applyVoiceText = () => {
    if (voiceText.trim()) {
      setValues(prev => ({
        ...prev,
        description: prev.description + (prev.description ? '\n' : '') + voiceText
      }));
      setVoiceText('');
    }
  };

  const applyTemplate = (template) => {
    setValues(prev => ({
      ...prev,
      ...template.template,
      subtasks: template.template.subtasks || []
    }));
    setSelectedTemplate(template);
    setShowTemplates(false);
  };

  const addSubtask = () => {
    const newSubtask = prompt('Enter subtask:');
    if (newSubtask) {
      setValues(prev => ({
        ...prev,
        subtasks: [...(prev.subtasks || []), newSubtask]
      }));
    }
  };

  const removeSubtask = (index) => {
    setValues(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError('attachments', validation.message);
        return false;
      }
      return true;
    });

    handleChange({
      target: {
        name: 'attachments',
        value: validFiles
      }
    });
  };

  const renderError = (field) => {
    if (touched[field] && errors[field]) {
      return (
        <div className="text-red-500 text-sm mt-1" data-testid={`${field}-error`}>
          {errors[field]}
        </div>
      );
    }
    return null;
  };

  return (
    <ErrorBoundary>
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6" />
              <h2 className="text-xl font-bold">{title}</h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Todo Type Selector */}
            <TodoTypeSelector
              selectedType={todoType}
              onTypeChange={setTodoType}
              onGroupSelect={setSelectedGroupId}
              onClassroomSelect={setSelectedClassroomId}
              userGroups={userGroups}
              userClassrooms={userClassrooms}
              userRole={userRole}
            />

            {/* Smart Templates Section */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                  Smart Templates
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {showTemplates ? 'Hide' : 'Show'} Templates
                </button>
              </div>
              
              <AnimatePresence>
                {showTemplates && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    {smartTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyTemplate(template)}
                        className="p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all text-left"
                      >
                        <div className="text-2xl mb-2">{template.icon}</div>
                        <div className="font-medium text-sm">{template.name}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={values.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                    touched.title && errors.title
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-700'
                  }`}
                  placeholder="What do you need to accomplish?"
                />
                {renderError('title')}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject/Course
                </label>
                <input
                  type="text"
                  name="subject"
                  value={values.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-700"
                  placeholder="e.g., Mathematics, Computer Science"
                />
              </div>
            </div>

            {/* Description with Voice Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    className={`p-2 rounded-lg transition-colors ${
                      isRecording 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  {voiceText && (
                    <button
                      type="button"
                      onClick={applyVoiceText}
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
              
              {voiceText && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Voice Input:</strong> {voiceText}
                  </div>
                </div>
              )}
              
              <textarea
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-colors ${
                  touched.description && errors.description
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-700'
                }`}
                placeholder="Describe your task in detail..."
              />
              {renderError('description')}
            </div>

            {/* Advanced Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="dueDate"
                  value={values.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority Level
                </label>
                <select
                  name="priority"
                  value={values.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-700"
                >
                  <option value="low">🟢 Low Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="high">🔴 High Priority</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  name="estimatedTime"
                  value={values.estimatedTime}
                  onChange={handleChange}
                  min="5"
                  max="480"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Group/Assignment Specific Fields */}
            <AnimatePresence>
              {todoType === 'group' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-green-500" />
                      Group Collaboration
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCollaboration(!showCollaboration)}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      {showCollaboration ? 'Hide' : 'Show'} Details
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {showCollaboration && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Group Members Assignment
                          </label>
                          <textarea
                            name="groupMembers"
                            value={JSON.stringify(values.groupMembers)}
                            onChange={(e) => {
                              try {
                                const members = JSON.parse(e.target.value);
                                setValues(prev => ({ ...prev, groupMembers: members }));
                              } catch (error) {
                                // Handle invalid JSON
                              }
                            }}
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-700"
                            placeholder='[{"userId": 1, "role": "leader", "assignedTasks": ["task1", "task2"]}]'
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Assign specific tasks to group members
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {todoType === 'teacher_assignment' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                      <GraduationCap className="w-5 h-5 mr-2 text-purple-500" />
                      Assignment Details
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAssignmentDetails(!showAssignmentDetails)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      {showAssignmentDetails ? 'Hide' : 'Show'} Details
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {showAssignmentDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Assignment Type
                          </label>
                          <select
                            name="assignmentType"
                            value={values.assignmentType}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-700"
                          >
                            <option value="">Select type</option>
                            <option value="homework">📝 Homework</option>
                            <option value="project">💻 Project</option>
                            <option value="exam">📚 Exam</option>
                            <option value="quiz">❓ Quiz</option>
                            <option value="presentation">🎤 Presentation</option>
                            <option value="lab">🔬 Lab Work</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Maximum Score
                          </label>
                          <input
                            type="number"
                            name="maxScore"
                            value={values.maxScore || ''}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-700"
                            placeholder="e.g., 100"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Study Session Planner */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <Timer className="w-5 h-5 mr-2 text-green-500" />
                  Study Session Planner
                </h3>
                <button
                  type="button"
                  onClick={() => setShowStudyPlanner(!showStudyPlanner)}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  {showStudyPlanner ? 'Hide' : 'Show'} Planner
                </button>
              </div>
              
              <AnimatePresence>
                {showStudyPlanner && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Session Duration (min)
                      </label>
                      <input
                        type="number"
                        value={studySession.duration}
                        onChange={(e) => setStudySession(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-700"
                        min="15"
                        max="120"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Break Time (min)
                      </label>
                      <input
                        type="number"
                        value={studySession.breakTime}
                        onChange={(e) => setStudySession(prev => ({ ...prev, breakTime: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-700"
                        min="1"
                        max="30"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Number of Sessions
                      </label>
                      <input
                        type="number"
                        value={studySession.sessions}
                        onChange={(e) => setStudySession(prev => ({ ...prev, sessions: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-700"
                        min="1"
                        max="8"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Focus Mode
                      </label>
                      <select
                        value={studySession.focusMode}
                        onChange={(e) => setStudySession(prev => ({ ...prev, focusMode: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-700"
                      >
                        <option value="pomodoro">🍅 Pomodoro</option>
                        <option value="flow">🌊 Flow State</option>
                        <option value="sprint">⚡ Sprint Mode</option>
                        <option value="relaxed">😌 Relaxed</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Subtasks Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subtasks
                </label>
                <button
                  type="button"
                  onClick={addSubtask}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                >
                  + Add Subtask
                </button>
              </div>
              
              {values.subtasks && values.subtasks.length > 0 && (
                <div className="space-y-2">
                  {values.subtasks.map((subtask, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="flex-1 text-sm">{subtask}</span>
                      <button
                        type="button"
                        onClick={() => removeSubtask(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Attachments
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {values.attachments && values.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {values.attachments.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    {isEdit ? 'Update Task' : 'Create Task'}
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AdvancedTodoForm;
