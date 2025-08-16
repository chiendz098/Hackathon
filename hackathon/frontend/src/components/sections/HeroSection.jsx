import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { getStatistics } from '../../api';

const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [statistics, setStatistics] = useState({
    users: { total: 0, students: 0 },
    courses: { total: 0 },
    satisfaction: { percentage: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await getStatistics();
        setStatistics(response.data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        // Fallback to default values if API fails
        setStatistics({
          users: { total: 1000, students: 850 },
          courses: { total: 50 },
          satisfaction: { percentage: 95 }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Background Animation */}
        <motion.div
        className="absolute inset-0 pointer-events-none"
          animate={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.1), transparent)`,
        }}
        transition={{ type: 'spring', damping: 10 }}
      />

      <motion.div
        className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div variants={itemVariants}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Nền tảng học tập
              <span className="text-blue-600 dark:text-blue-400"> thông minh</span>
            <br />
              với trợ lý AI
          </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Tối ưu hóa việc học của bạn với công nghệ AI tiên tiến. Tạo kế hoạch học tập cá nhân hóa,
              nhận gợi ý cải thiện và theo dõi tiến độ một cách thông minh.
            </p>
            <div className="flex flex-wrap gap-4">
          <Button
            as={Link}
            to="/register"
            variant="primary"
            size="lg"
                className="min-w-[150px]"
          >
                Bắt đầu miễn phí
          </Button>
          <Button
            as={Link}
                to="/about"
            variant="outline"
            size="lg"
                className="min-w-[150px]"
          >
                Tìm hiểu thêm
          </Button>
            </div>
        </motion.div>

          {/* Statistics */}
        <motion.div
          variants={itemVariants}
            className="grid grid-cols-2 gap-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {loading ? '...' : statistics.users.total.toLocaleString()}+
              </h3>
              <p className="text-gray-600 dark:text-gray-300">Người dùng</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {loading ? '...' : statistics.courses.total.toLocaleString()}+
              </h3>
              <p className="text-gray-600 dark:text-gray-300">Khóa học</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">
                {loading ? '...' : statistics.users.students.toLocaleString()}+
              </h3>
              <p className="text-gray-600 dark:text-gray-300">Học viên</p>
              </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {loading ? '...' : `${statistics.satisfaction.percentage}%`}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">Hài lòng</p>
              </div>
            </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
