import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import AssignmentForm from '../components/teacher/AssignmentForm';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    if (user?.role === 'teacher') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch classrooms and assignments
      // This would be implemented with actual API calls
      setClassrooms([
        { id: 1, name: 'Toán 10A1', studentCount: 25 },
        { id: 2, name: 'Toán 10A2', studentCount: 28 },
        { id: 3, name: 'Toán 11A1', studentCount: 22 }
      ]);
      
      setAssignments([
        {
          id: 1,
          title: 'Bài kiểm tra Chương 1',
          classroomName: 'Toán 10A1',
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          studentsCount: 25,
          completedCount: 15,
          avgProgress: 68
        }
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (formData) => {
    try {
      // API call to create assignment
      console.log('Creating assignment:', formData);
      // await createClassroomAssignment(formData.classroomId, formData);
      fetchData();
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  if (user?.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
            <p className="text-gray-600">Chỉ giáo viên mới có thể truy cập trang này.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <span>Teacher Dashboard</span>
              </h1>
              <p className="text-gray-600 mt-2">Quản lý bài tập và theo dõi tiến độ học sinh</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAssignmentForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Giao bài tập mới</span>
            </motion.button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Tổng lớp học</p>
                  <p className="text-2xl font-bold text-blue-800">{classrooms.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-green-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Bài tập đã giao</p>
                  <p className="text-2xl font-bold text-green-800">{assignments.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-yellow-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Đang chờ nộp</p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {assignments.reduce((sum, a) => sum + (a.studentsCount - a.completedCount), 0)}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-purple-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Tỷ lệ hoàn thành</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {assignments.length > 0 ? 
                      Math.round(assignments.reduce((sum, a) => sum + a.avgProgress, 0) / assignments.length) : 0
                    }%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </motion.div>
          </div>

          {/* Assignments List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                <Calendar className="w-6 h-6" />
                <span>Bài tập đã giao</span>
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <motion.div
                  key={assignment.id}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  className="p-6 cursor-pointer"
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {assignment.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{assignment.classroomName}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(assignment.deadline).toLocaleDateString('vi-VN')}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>{assignment.completedCount}/{assignment.studentsCount} hoàn thành</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Progress Circle */}
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="#e5e7eb"
                            strokeWidth="4"
                            fill="none"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="#3b82f6"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - assignment.avgProgress / 100)}`}
                            className="transition-all duration-300"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-800">
                            {Math.round(assignment.avgProgress)}%
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        assignment.avgProgress >= 90 ? 'bg-green-100 text-green-800' :
                        assignment.avgProgress >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {assignment.avgProgress >= 90 ? 'Tốt' :
                         assignment.avgProgress >= 70 ? 'Khá' : 'Cần cải thiện'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {assignments.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Chưa có bài tập nào</h3>
                  <p className="text-gray-600 mb-4">Bắt đầu bằng cách tạo bài tập đầu tiên cho lớp của bạn</p>
                  <button
                    onClick={() => setShowAssignmentForm(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Tạo bài tập đầu tiên
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Form */}
      <AssignmentForm
        isOpen={showAssignmentForm}
        onClose={() => setShowAssignmentForm(false)}
        onSubmit={handleCreateAssignment}
        classrooms={classrooms}
      />
    </div>
  );
}
