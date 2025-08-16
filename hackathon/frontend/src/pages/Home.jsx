import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Users, Target, TrendingUp, Award, 
  Calendar, BookOpen, Zap, Star, CheckCircle 
} from 'lucide-react';
import * as api from '../api';
import AnimatedBackground from '../components/AnimatedBackground';
import TypewriterText from '../components/TypewriterText';
import Animated3DCard from '../components/Animated3DCard';
import FloatingElements from '../components/FloatingElements';
import ParticleSystem from '../components/ParticleSystem';
import RealTimeStatistics from '../components/analytics/RealTimeStatistics';
import '../components/HomeAnimations.css';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Fetch recent posts
  const fetchPosts = async () => {
    try {
      setIsLoadingPosts(true);
      const response = await api.getPosts({ limit: 6 });
      console.log('🔍 Posts response:', response);
      
      // Handle both response formats
      if (response.data && response.data.success) {
        setPosts(response.data.posts || []);
      } else if (response.data && Array.isArray(response.data)) {
        setPosts(response.data);
      } else if (response.success) {
        setPosts(response.posts || []);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const features = [
    {
      icon: '🎓',
      title: 'Smart Learning',
      description: 'AI-powered study plans and personalized learning paths',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: '🏆',
      title: 'Gamification',
      description: 'Earn points, unlock achievements, and compete with friends',
      color: 'from-green-500 to-blue-600'
    },
    {
      icon: '👥',
      title: 'Study Groups',
              description: 'Collaborate with classmates in group todos',
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed analytics',
      color: 'from-orange-500 to-red-600'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Active Students', icon: '👥' },
    
    { number: '5000+', label: 'Tasks Completed', icon: '✅' },
    { number: '200+', label: 'Achievements', icon: '🏅' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Floating Elements */}
      <FloatingElements />
      
      {/* Particle System */}
      <ParticleSystem />

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-3d">FPT COMPASS</span>
            </h1>
            <TypewriterText 
              texts={[
                "Transform your learning experience",
                "AI-powered study companion",
                "Collaborate with classmates",
                "Track your progress"
              ]}
              typingSpeed={100}
              deletionSpeed={50}
              pauseTime={2000}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
                            <Link to="/todo">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="modern-button text-lg"
              >
                🚀 Get Started
              </motion.button>
            </Link>
            <Link to="/about">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-transparent border-2 border-white/30 text-white text-lg font-semibold rounded-full hover:bg-white/10 transition-all duration-300 glass"
              >
                📖 Learn More
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose <span className="neon-text">FPT COMPASS</span>?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the future of education with cutting-edge AI technology and collaborative learning tools
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <div className="modern-card text-center">
                    <div className={`text-4xl mb-4 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Posts Section */}
      <section className="relative z-10 py-20 px-4 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Recent <span className="gradient-text">Posts</span>
            </h2>
            <p className="text-xl text-gray-300">
              Stay updated with the latest discussions and insights from our community
            </p>
          </motion.div>

          {isLoadingPosts ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-white mt-4">Loading posts...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 h-full">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                        {post.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-white font-medium">{post.author?.name || 'Anonymous'}</div>
                        <div className="text-gray-400 text-sm">{new Date(post.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {post.content}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          💬 {post.comments?.length || 0}
                        </span>
                        <span className="flex items-center">
                          👍 {post.likes?.length || 0}
                        </span>
                      </div>
                      <Link 
                        to={`/posts/${post.id}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p className="text-lg">No posts available yet.</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Link to="/posts">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="modern-button text-lg"
              >
                📝 View All Posts
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Real-Time Statistics Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Live <span className="gradient-text">Statistics</span>
            </h2>
            <p className="text-xl text-gray-300">
              Real-time data from our learning platform
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20"
          >
            <RealTimeStatistics />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-3xl p-12 border border-white/20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to <span className="gradient-text">Transform</span> Your Learning?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already experiencing the future of education
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/register">
                <button className="modern-button text-xl px-10 py-5">
                  🎯 Start Your Journey
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl font-bold text-white mb-4">
            <span className="shimmer-text">FPT COMPASS</span>
          </div>
          <p className="text-gray-400 mb-6">
            Empowering students with AI-driven learning solutions
          </p>
          <div className="flex justify-center space-x-6 text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;