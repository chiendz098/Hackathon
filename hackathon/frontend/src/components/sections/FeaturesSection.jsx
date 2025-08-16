import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link  } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';

const _FeaturesSection = () => {
  const features = [
    {
      icon: '🤖',
      title: 'AI Chatbot Thông Minh',
      description: 'Trợ lý AI 24/7 giúp bạn giải đáp thắc mắc, tạo lộ trình học tập và quản lý todo tự động.',
      color: 'from-blue-500 to-cyan-500',
      link: '/advanced-chatbot',
      highlights: ['Tạo lộ trình học', 'Quản lý todo', 'Hỗ trợ 24/7']
    },
    {
      icon: '✅',
      title: 'Quản Lý Todo Thông Minh',
      description: 'Hệ thống todo với AI tự động phân loại, ưu tiên và nhắc nhở để tối ưu hiệu suất học tập.',
      color: 'from-green-500 to-emerald-500',
      link: '/todo',
      highlights: ['Tự động ưu tiên', 'Nhắc nhở thông minh', 'Theo dõi tiến độ']
    },
    {
      icon: '👥',
      title: 'Nhóm Học Tập',
      description: 'Tham gia nhóm học tập, chia sẻ kiến thức và cùng nhau tiến bộ trong môi trường học tập tích cực.',
      color: 'from-purple-500 to-pink-500',
      link: '/group',
      highlights: ['Chat real-time', 'Chia sẻ tài liệu', 'Học nhóm hiệu quả']
    },
    {
      icon: '👨‍🏫',
      title: 'Hệ Thống Mentor',
      description: 'Kết nối với mentor giàu kinh nghiệm, nhận tư vấn cá nhân và định hướng nghề nghiệp.',
      color: 'from-orange-500 to-red-500',
      link: '/mentor',
      highlights: ['Mentor 1-1', 'Tư vấn nghề nghiệp', 'Kinh nghiệm thực tế']
    },
    {
      icon: '💬',
      title: 'Diễn Đàn Sinh Viên',
      description: 'Cộng đồng sinh viên FPT sôi động với hàng ngàn chủ đề thảo luận và chia sẻ kinh nghiệm.',
      color: 'from-indigo-500 to-purple-500',
      link: '/forum',
      highlights: ['Cộng đồng lớn', 'Thảo luận sôi nổi', 'Chia sẻ kinh nghiệm']
    },
    {
      icon: '🎮',
      title: 'Gamification',
      description: 'Hệ thống điểm thưởng, bảng xếp hạng và thành tựu giúp việc học trở nên thú vị và động lực.',
      color: 'from-yellow-500 to-orange-500',
      link: '/leaderboard',
      highlights: ['Điểm thưởng', 'Bảng xếp hạng', 'Thành tựu']
    }
  ];

  const _containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const _itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Tính Năng <span className="text-gradient">Đột Phá</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Khám phá những tính năng AI tiên tiến được thiết kế đặc biệt cho sinh viên FPT COMPASS
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card
                className="h-full group cursor-pointer border-0 bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300"
                hover={true}
              >
                <div className="p-6">
                  {/* Icon with gradient background */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-3xl">{feature.icon}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-2 mb-6">
                    {feature.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                        {highlight}
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    as={Link}
                    to={feature.link}
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300"
                  >
                    Khám phá ngay
                  </Button>
                </div>

                {/* Hover effect overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 rounded-lg transition-opacity duration-300`}></div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Sẵn sàng bắt đầu hành trình học tập thông minh?
            </h3>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Tham gia cùng hàng ngàn sinh viên FPT đang sử dụng FPT UniHub để tối ưu hóa việc học tập
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as={Link}
                to="/register"
                variant="secondary"
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Đăng ký miễn phí
              </Button>
              <Button
                as={Link}
                to="/trial"
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                Học thử ngay
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
