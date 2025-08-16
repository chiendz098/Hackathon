import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link  } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Classroom = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    maxStudents: 30
  });
  const [joinData, setJoinData] = useState({
    classroomId: '',
    password: ''
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchClassrooms();
  }, [user]);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'teacher'
        ? '/api/classroom/teacher'
        : '/api/classroom/student';
      
      const response = await fetch(`${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setClassrooms(data.classrooms || []);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/classroom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      const classroom = await response.json();
      setClassrooms(prev => [...prev, classroom]);
      setShowCreateForm(false);
      setFormData({ name: '', description: '', subject: '', maxStudents: 30 });
    } catch (error) {
      console.error('Error creating classroom:', error);
    }
  };

  const handleJoinClassroom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/classroom/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(joinData)
      });
      
      if (response.ok) {
        fetchClassrooms();
        setShowJoinForm(false);
        setJoinData({ classroomId: '', password: '' });
      }
    } catch (error) {
      console.error('Error joining classroom:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {user?.role === 'teacher' ? 'Quản lý lớp học' : 'Lớp học của tôi'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {user?.role === 'teacher' 
              ? 'Tạo và quản lý các lớp học, giao bài tập cho học sinh'
              : 'Tham gia lớp học và theo dõi bài tập được giao'
            }
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="mb-8 flex flex-wrap gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {user?.role === 'teacher' ? (
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="primary"
              className="flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Tạo lớp học mới</span>
            </Button>
          ) : (
            <Button
              onClick={() => setShowJoinForm(true)}
              variant="primary"
              className="flex items-center space-x-2"
            >
              <span>🔗</span>
              <span>Tham gia lớp học</span>
            </Button>
          )}
        </motion.div>

        {/* Create Classroom Form */}
        {showCreateForm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Tạo lớp học mới</h2>
              <form onSubmit={handleCreateClassroom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên lớp học
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Môn học
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Học kỳ
                    </label>
                    <select
                      required
                      value={formData.semester}
                      onChange={(e) => setFormData({...formData, semester: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Chọn học kỳ</option>
                      <option value="Fall">Fall</option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Năm
                    </label>
                    <input
                      type="number"
                      required
                      min="2020"
                      max="2030"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" variant="primary">
                    Tạo lớp học
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Join Classroom Form */}
        {showJoinForm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Tham gia lớp học</h2>
              <form onSubmit={handleJoinClassroom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mã lớp học
                  </label>
                  <input
                    type="text"
                    required
                    value={joinData.classroomId}
                    onChange={(e) => setJoinData({...joinData, classroomId: e.target.value.toUpperCase()})}
                    placeholder="Nhập mã lớp học (6-10 ký tự)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowJoinForm(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" variant="primary">
                    Tham gia
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Classrooms Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {classrooms.map((classroom, index) => (
            <motion.div key={classroom.id || index} variants={itemVariants}>
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {classroom.name || classroom.classroom?.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {classroom.subject || classroom.classroom?.subject} • {classroom.semester || classroom.classroom?.semester} {classroom.year || classroom.classroom?.year}
                      </p>
                    </div>
                    <div className="text-2xl">📚</div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {classroom.description || classroom.classroom?.description || 'Không có mô tả'}
                  </p>
                  
                  {user?.role === 'teacher' && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Mã lớp: <span className="font-mono font-semibold">{classroom.classCode}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {classroom.students?.length || 0} học sinh
                    </div>
                    <Button
                      as={Link}
                      to={`/classroom/${classroom.id || classroom.classroom?.id}`}
                      variant="outline"
                      size="sm"
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {classrooms.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {user?.role === 'teacher' ? 'Chưa có lớp học nào' : 'Chưa tham gia lớp học nào'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {user?.role === 'teacher' 
                ? 'Tạo lớp học đầu tiên để bắt đầu giảng dạy'
                : 'Tham gia lớp học bằng mã lớp từ giáo viên'
              }
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Classroom;
