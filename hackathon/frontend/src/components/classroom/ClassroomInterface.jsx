import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  ClipboardList, 
  Calendar, 
  MessageSquare,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Award,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Send,
  Paperclip
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const ClassroomInterface = () => {
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (user) {
      fetchClassrooms();
    }
  }, [user]);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/classroom/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setClassrooms(data.classrooms);
        }
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassroomDetails = async (classroomId) => {
    try {
      const [assignmentsRes, studentsRes, submissionsRes] = await Promise.all([
        fetch(`/api/classroom/${classroomId}/assignments`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/classroom/${classroomId}/students`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/classroom/${classroomId}/submissions`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        if (assignmentsData.success) {
          setAssignments(assignmentsData.assignments);
        }
      }

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        if (studentsData.success) {
          setStudents(studentsData.students);
        }
      }

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        if (submissionsData.success) {
          setSubmissions(submissionsData.submissions);
        }
      }
    } catch (error) {
      console.error('Error fetching classroom details:', error);
    }
  };

  const handleJoinClassroom = async () => {
    if (!joinCode.trim()) return;

    try {
      const response = await fetch('/api/classroom/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ classCode: joinCode })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJoinCode('');
          setShowJoinModal(false);
          fetchClassrooms();
        }
      }
    } catch (error) {
      console.error('Error joining classroom:', error);
    }
  };

  const handleLeaveClassroom = async (classroomId) => {
    if (!window.confirm('Are you sure you want to leave this classroom?')) return;

    try {
      const response = await fetch(`/api/classroom/${classroomId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchClassrooms();
        if (selectedClassroom?.id === classroomId) {
          setSelectedClassroom(null);
        }
      }
    } catch (error) {
      console.error('Error leaving classroom:', error);
    }
  };

  const handleSubmitAssignment = async (assignmentId, submissionData) => {
    try {
      const formData = new FormData();
      formData.append('assignmentId', assignmentId);
      formData.append('submission', JSON.stringify(submissionData));

      if (submissionData.file) {
        formData.append('file', submissionData.file);
      }

      const response = await fetch('/api/classroom/assignments/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchClassroomDetails(selectedClassroom.id);
        }
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
    }
  };

  const selectClassroom = async (classroom) => {
    setSelectedClassroom(classroom);
    await fetchClassroomDetails(classroom.id);
  };

  const filteredClassrooms = classrooms.filter(classroom =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Classrooms
              </h1>
            </div>
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Join Classroom
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Classroom List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  My Classrooms
                </h2>
                <Search className="w-4 h-4 text-gray-400" />
              </div>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search classrooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Classroom List */}
              <div className="space-y-2">
                {filteredClassrooms.map((classroom) => (
                  <motion.div
                    key={classroom.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={() => selectClassroom(classroom)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedClassroom?.id === classroom.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {classroom.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {classroom.subject}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                            {classroom.participants?.length || 0} students
                          </span>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedClassroom ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                {/* Classroom Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedClassroom.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedClassroom.subject} • {selectedClassroom.participants?.length || 0} students
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleLeaveClassroom(selectedClassroom.id)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8 px-6">
                    {[
                      { id: 'overview', label: 'Overview', icon: Eye },
                      { id: 'assignments', label: 'Assignments', icon: ClipboardList },
                      { id: 'students', label: 'Students', icon: Users },
                      { id: 'submissions', label: 'My Submissions', icon: Upload }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6">
                          <div className="flex items-center">
                            <ClipboardList className="w-8 h-8 text-blue-600" />
                            <div className="ml-4">
                              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                Total Assignments
                              </p>
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                {assignments.length}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6">
                          <div className="flex items-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <div className="ml-4">
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                Completed
                              </p>
                              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                {assignments.filter(a => a.status === 'completed').length}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6">
                          <div className="flex items-center">
                            <Clock className="w-8 h-8 text-purple-600" />
                            <div className="ml-4">
                              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                Pending
                              </p>
                              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                {assignments.filter(a => a.status === 'pending').length}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Recent Activity
                        </h3>
                        <div className="space-y-4">
                          {assignments.slice(0, 5).map((assignment) => (
                            <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {assignment.title}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                assignment.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : assignment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {assignment.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Assignments Tab */}
                  {activeTab === 'assignments' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-4">
                        {assignments.map((assignment) => (
                          <div key={assignment.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {assignment.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {assignment.description}
                                </p>
                              </div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                assignment.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : assignment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {assignment.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {assignment.estimatedTime} minutes
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Award className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {assignment.maxScore} points
                                </span>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <Eye className="w-4 h-4" />
                                <span>View Details</span>
                              </button>
                              {assignment.status !== 'completed' && (
                                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                  <Upload className="w-4 h-4" />
                                  <span>Submit</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Students Tab */}
                  {activeTab === 'students' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map((student) => (
                          <div key={student.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={student.avatar || '/default-avatar.png'}
                                alt={student.name}
                                className="w-10 h-10 rounded-full"
                              />
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {student.name}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Submissions Tab */}
                  {activeTab === 'submissions' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-4">
                        {submissions.map((submission) => (
                          <div key={submission.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {submission.assignmentTitle}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                submission.status === 'graded'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {submission.status}
                              </span>
                            </div>

                            {submission.score !== null && (
                              <div className="mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Score: <span className="font-semibold">{submission.score}/{submission.maxScore}</span>
                                </p>
                              </div>
                            )}

                            {submission.feedback && (
                              <div className="mb-4">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  Feedback:
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {submission.feedback}
                                </p>
                              </div>
                            )}

                            <div className="flex space-x-2">
                              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Classroom Selected
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Select a classroom from the sidebar to view its details and assignments.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Join Classroom Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Join Classroom
                </h3>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter Class Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g., ABC123"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinClassroom}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Join
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassroomInterface; 