import React, { useState, useEffect, useCallback } from 'react';
import { useGamification } from '../contexts/GamificationContext';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StandaloneSpinWheel from '../components/gamification/StandaloneSpinWheel';
import CoinEarningSystem from '../components/gamification/CoinEarningSystem';
import DailyChallenge from '../components/gamification/DailyChallenge';
import ActivityFeed from '../components/gamification/ActivityFeed';
// import UltimatePetSystem from '../components/pets/UltimatePetSystem';
// import UltimateShopSystem from '../components/shop/UltimateShopSystem';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getAchievements, getLeaderboard, getUserProgress } from '../api';
import { toast } from 'react-hot-toast';
import { 
  FaTrophy, 
  FaCoins, 
  FaGem, 
  FaStar, 
  FaFire, 
  FaChartLine, 
  FaUsers, 
  FaCalendar,
  FaBook,
  FaHeart,
  FaCrown,
  FaMedal,
  FaAward,
  FaGift,
  FaRocket,
  FaLightbulb,
  FaBullseye,
  FaCheckCircle,
  FaHistory,
  FaChartBar,
  FaBell,
  FaCog
} from 'react-icons/fa';

const MotionDiv = motion.create('div');
const MotionButton = motion.create('button');
const MotionCard = motion.create(Card);
import { CardBody } from '../components/ui/Card';

const GamificationNew = () => {
  const { user } = useAuth();
  const { userProgress, updateUserProgress } = useGamification();
  const [activeTab, setActiveTab] = useState('overview');
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  // const [showPetSystem, setShowPetSystem] = useState(false);
  // const [showShopSystem, setShowShopSystem] = useState(false);
  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    coins: 0,
    gems: 0,
    streak: 0,
    totalTodos: 0,
    completedTodos: 0,
    completionRate: 0,
    nextLevelXp: 1000,
    totalStudyTime: 0,
    focusSessions: 0,
    achievementsCount: 0
  });

  // Daily challenge state
  const [dailyChallenge, setDailyChallenge] = useState({
    title: 'Complete 5 tasks today',
    progress: 0,
    target: 5,
    reward: { xp: 100, coins: 25 },
    type: 'complete_todos'
  });

  // Recent activity state
  const [recentActivity, setRecentActivity] = useState([]);

  // Tab configuration with improved icons and descriptions
  const tabs = [
    { 
      id: 'overview', 
      name: 'Overview', 
      icon: '📊', 
      description: 'Your gamification dashboard and progress overview',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'achievements', 
      name: 'Achievements', 
      icon: '🏆', 
      description: 'Unlock badges and rewards for your accomplishments',
      color: 'from-yellow-500 to-yellow-600'
    },

    // { 
    //   id: 'advanced-pets', 
    //   name: 'Advanced Pets', 
    //   icon: '🐉', 
    //   description: 'Advanced pet companions and evolution system',
    //   color: 'from-green-500 to-green-600'
    // },
    // { 
    //   id: 'advanced-shop', 
    //   name: 'Advanced Shop', 
    //   icon: '🏪', 
    //   description: 'Premium items, themes, and exclusive rewards',
    //   color: 'from-indigo-500 to-indigo-600'
    // },
    { 
      id: 'rewards', 
      name: 'Daily Rewards', 
      icon: '🎁', 
      description: 'Spin the wheel and claim daily rewards',
      color: 'from-pink-500 to-pink-600'
    },
    { 
      id: 'coin-earning', 
      name: 'Coin Earning', 
      icon: '💰', 
      description: 'Learn how to earn more coins and maximize rewards',
      color: 'from-orange-500 to-orange-600'
    },
    { 
      id: 'challenges', 
      name: 'Daily Challenges', 
      icon: '🎯', 
      description: 'Complete daily challenges for bonus rewards',
      color: 'from-red-500 to-red-600'
    },
    { 
      id: 'activity', 
      name: 'Activity Feed', 
      icon: '📈', 
      description: 'Track your learning activities and progress history',
      color: 'from-teal-500 to-teal-600'
    }
  ];

  // Manual refresh function
  const refreshStats = () => {
    toast.success('Refreshing stats...');
    fetchAllData();
  };

  // Fetch real daily challenges from API
  const fetchDailyChallenges = async () => {
    try {
      const response = await fetch('/api/gamification/daily-challenges', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // setDailyChallenge(data.challenge || null); // This state variable was removed
        }
      }
    } catch (error) {
      console.error('Error fetching daily challenges:', error);
    }
  };

  // Fetch real recent activities from API
  const fetchRecentActivities = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://ai-learning-backend.loca.lt';
      const response = await fetch(`${API_URL}/api/activity/recent`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecentActivity(data.activities || []);
        }
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  // Get progress percentage for challenges
  const getProgressPercentage = (current, target) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  // Handle tab change with animation
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Add smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Enhanced refresh function with loading state
  const enhancedRefreshStats = async () => {
    setIsRefreshing(true);
    try {
      await fetchAllData();
      toast.success('Stats refreshed successfully! 🎉');
    } catch (error) {
      toast.error('Failed to refresh stats');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get level progress percentage
  const getLevelProgress = () => {
    const currentLevelXP = (userStats.level - 1) * 1000;
    const currentLevelProgress = userStats.xp - currentLevelXP;
    const xpForNextLevel = userStats.nextLevelXp - currentLevelXP;
    return Math.min((currentLevelProgress / xpForNextLevel) * 100, 100);
  };

  // Get XP needed for next level
  const getXPForNextLevel = () => {
    return userStats.nextLevelXp - userStats.xp;
  };

  // Get streak status and rewards
  const getStreakStatus = () => {
    if (userStats.streak >= 30) return { status: 'legendary', reward: 500, icon: '👑' };
    if (userStats.streak >= 7) return { status: 'epic', reward: 100, icon: '🔥🔥🔥' };
    if (userStats.streak >= 3) return { status: 'rare', reward: 25, icon: '🔥🔥' };
    if (userStats.streak >= 1) return { status: 'common', reward: 10, icon: '🔥' };
    return { status: 'none', reward: 0, icon: '💤' };
  };

  // Get achievement count by rarity
  const getAchievementStats = () => {
    const unlocked = achievements.filter(a => a.unlocked);
    const locked = achievements.filter(a => !a.unlocked);
    
    return {
      total: achievements.length,
      unlocked: unlocked.length,
      locked: locked.length,
      completionRate: achievements.length > 0 ? (unlocked.length / achievements.length) * 100 : 0
    };
  };

  // Get leaderboard position
  const getLeaderboardPosition = () => {
    if (!leaderboard.length) return null;
    const userIndex = leaderboard.findIndex(user => user.id === user?.id);
    return userIndex >= 0 ? userIndex + 1 : null;
  };

  // Get daily challenge progress
  const getDailyChallengeProgress = () => {
    if (!dailyChallenge) return { progress: 0, target: 1, percentage: 0 };
    return {
      progress: dailyChallenge.progress || 0,
      target: dailyChallenge.target || 1,
      percentage: getProgressPercentage(dailyChallenge.progress || 0, dailyChallenge.target || 1)
    };
  };

  const fetchAllData = useCallback(async () => {
    try {
      console.log('🔄 Initializing comprehensive gamification data...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No authentication token found');
        setDataLoaded(true);
        setLoading(false);
        return;
      }
      
      // Fetch data in parallel for better performance
      const [progressRes, achievementsRes, leaderboardRes] = await Promise.allSettled([
        getUserProgress(),
        getAchievements(),
        getLeaderboard()
      ]);

      // Handle progress data
      if (progressRes.status === 'fulfilled' && progressRes.value?.data?.success) {
        const progressData = progressRes.value.data.progress;
        setUserStats({
          level: progressData.level || 1,
          xp: progressData.xp || 0,
          coins: progressData.coins || 0,
          gems: progressData.gems || 0,
          streak: progressData.streak || 0,
          totalTodos: progressData.totalTodos || 0,
          completedTodos: progressData.completedTodos || 0,
          completionRate: progressData.completionRate || 0,
          nextLevelXp: progressData.nextLevelXp || 1000,
          totalStudyTime: progressData.totalStudyTime || 0,
          focusSessions: progressData.focusSessions || 0,
          achievementsCount: progressData.achievementsCount || 0
        });
        console.log('✅ User progress loaded');
      }

      // Handle achievements data
      if (achievementsRes.status === 'fulfilled' && achievementsRes.value?.data?.success) {
        setAchievements(achievementsRes.value.data.achievements || []);
        console.log(`✅ Loaded ${achievementsRes.value.data.achievements?.length || 0} achievements`);
      }

      // Handle leaderboard data
      if (leaderboardRes.status === 'fulfilled' && leaderboardRes.value?.data?.success) {
        setLeaderboard(leaderboardRes.value.data.leaderboard || []);
        console.log(`✅ Loaded ${leaderboardRes.value.data.leaderboard?.length || 0} leaderboard entries`);
      }

      // Fetch real daily challenges and activities
      await fetchDailyChallenges();
      await fetchRecentActivities();

      console.log('✅ All gamification data loaded successfully');
      setDataLoaded(true);
    } catch (error) {
      console.error('Error initializing gamification data:', error);
      setError('Failed to load gamification data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Đang tải dữ liệu gamification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-lg text-gray-600">Loading your gamification data...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-40 max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            {/* Main Title */}
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎮 Gamification Hub
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Level up your learning journey with achievements, rewards, and friendly competition
              </p>
            </div>

            {/* User Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MotionCard 
                className="bg-gradient-to-br from-yellow-100 via-yellow-200 to-orange-200 text-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <CardBody className="text-center p-6">
                  <div className="text-4xl mb-3">💰</div>
                  <div className="text-3xl font-bold mb-2 text-gray-900 whitespace-nowrap">{userStats.coins}</div>
                  <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Coins</div>
                  
                  {/* Decorative Elements */}
                  <div className="flex justify-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full opacity-60"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full opacity-40"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full opacity-20"></div>
                  </div>
                </CardBody>
              </MotionCard>
              
              <MotionCard 
                className="bg-gradient-to-br from-purple-100 via-purple-200 to-indigo-200 text-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <CardBody className="text-center p-6">
                  <div className="text-4xl mb-3">⭐</div>
                  <div className="text-3xl font-bold mb-2 text-gray-900 whitespace-nowrap">{userStats.gems}</div>
                  <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Gems</div>
                  
                  {/* Decorative Elements */}
                  <div className="flex justify-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full opacity-60"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full opacity-40"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full opacity-20"></div>
                  </div>
                </CardBody>
              </MotionCard>
              
              <MotionCard 
                className="bg-gradient-to-br from-green-100 via-green-200 to-emerald-200 text-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <CardBody className="text-center p-6">
                  <div className="text-4xl mb-3">🏆</div>
                  <div className="text-3xl font-bold mb-2 text-gray-900 whitespace-nowrap">Lv.{userStats.level}</div>
                  <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Level</div>
                  
                  {/* Enhanced Progress Bar */}
                  <div className="w-full bg-white bg-opacity-50 rounded-full h-2.5 overflow-hidden mb-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2.5 rounded-full transition-all duration-1000 shadow-lg" 
                      style={{ width: `${getLevelProgress()}%` }}
                    ></div>
                  </div>
                  
                  {/* Progress Text */}
                  <div className="text-xs text-gray-600 font-medium">
                    {getLevelProgress().toFixed(1)}% Complete
                  </div>
                </CardBody>
              </MotionCard>
              
              <MotionCard 
                className="bg-gradient-to-br from-blue-100 via-blue-200 to-cyan-200 text-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <CardBody className="text-center p-6">
                  <div className="text-4xl mb-3">⚡</div>
                  <div className="text-3xl font-bold mb-2 text-gray-900 whitespace-nowrap">{userStats.xp}</div>
                  <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">XP</div>
                  
                  {/* XP Progress Indicator */}
                  <div className="flex justify-center">
                    <div className="bg-white bg-opacity-60 rounded-full px-3 py-1">
                      <span className="text-xs text-gray-700 font-medium">
                        +{getXPForNextLevel()} to Next
                      </span>
                    </div>
                  </div>
                </CardBody>
              </MotionCard>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {tabs.map((tab) => (
              <MotionButton
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md'
                }`}
                whileHover={{ scale: activeTab === tab.id ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                title={tab.description}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </MotionButton>
            ))}
          </div>
          
          {/* Enhanced Stats Bar */}
          <div className="mt-6 flex justify-center">
            <div className="bg-white rounded-xl shadow-lg p-4 flex items-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{getLeaderboardPosition() || 'N/A'}</div>
                <div className="text-sm text-gray-600">Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getAchievementStats().completionRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Achievements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{getStreakStatus().icon}</div>
                <div className="text-sm text-gray-600">{userStats.streak} Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{getXPForNextLevel()}</div>
                <div className="text-sm text-gray-600">XP to Next</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <MotionDiv
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Leaderboard Section - Right after stats bar */}
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
                  <CardBody>
                    <div className="flex items-center mb-6">
                      <div className="text-3xl mr-3">🏆</div>
                      <div>
                        <h3 className="text-2xl font-bold text-orange-600">Bảng Xếp Hạng</h3>
                        <p className="text-gray-600">Xem vị trí của bạn trong cộng đồng</p>
                      </div>
                    </div>
                    
                    {leaderboard.length > 0 ? (
                      <div className="space-y-3">
                        {leaderboard.slice(0, 5).map((leaderboardUser, index) => (
                          <MotionDiv
                            key={leaderboardUser.id || leaderboardUser._id || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center p-4 rounded-lg transition-all duration-200 ${
                              (leaderboardUser.id === user?.id || leaderboardUser._id === user?.id)
                                ? 'bg-blue-50 border-2 border-blue-200 shadow-md'
                                : 'bg-white hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
                              index === 0 ? 'bg-yellow-500 shadow-lg' : 
                              index === 1 ? 'bg-gray-400 shadow-md' : 
                              index === 2 ? 'bg-orange-500 shadow-md' : 'bg-blue-500'
                            }`}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="font-semibold text-gray-900">
                                  {leaderboardUser.username || leaderboardUser.name || `User ${index + 1}`}
                                </span>
                                {(leaderboardUser.id === user?.id || leaderboardUser._id === user?.id) && (
                                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                Level {leaderboardUser.level || 1} • {leaderboardUser.xp || 0} XP
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">{leaderboardUser.xp || 0}</div>
                              <div className="text-xs text-gray-500">XP</div>
                            </div>
                          </MotionDiv>
                        ))}
                        
                        {/* Show current user if not in top 5 */}
                        {leaderboard.length > 5 && !leaderboard.slice(0, 5).some(u => u.id === user?.id || u._id === user?.id) && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-500 mb-2 text-center">Vị trí của bạn:</div>
                            {(() => {
                              const userRank = leaderboard.findIndex(u => u.id === user?.id || u._id === user?.id) + 1;
                              const userData = leaderboard.find(u => u.id === user?.id || u._id === user?.id);
                              if (userData) {
                                return (
                                  <div className="flex items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                                      {userRank}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-semibold text-gray-900">Bạn</div>
                                      <div className="text-sm text-gray-600">
                                        Level {userData.level || 1} • {userData.xp || 0} XP
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-blue-600">{userData.xp || 0}</div>
                                      <div className="text-xs text-gray-500">XP</div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <div className="text-4xl mb-4">🥇</div>
                        <p className="text-gray-600">Chưa có dữ liệu bảng xếp hạng.</p>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </MotionDiv>

              {/* Welcome Section */}
              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl">
                <CardBody className="p-8 text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <h2 className="text-3xl font-bold mb-4">Welcome to Your Learning Journey!</h2>
                  <p className="text-xl opacity-90 mb-6">
                    Track your progress, unlock achievements, and compete with fellow learners
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="text-center">
                      <div className="text-3xl mb-2">📚</div>
                      <div className="text-lg font-semibold">Learning Progress</div>
                      <div className="text-sm opacity-80">Track your achievements</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-2">🏆</div>
                      <div className="text-lg font-semibold">Earn Rewards</div>
                      <div className="text-sm opacity-80">Unlock new content</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-2">🌟</div>
                      <div className="text-lg font-semibold">Compete & Grow</div>
                      <div className="text-sm opacity-80">Challenge yourself</div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardBody className="text-center p-6">
                    <div className="text-4xl mb-3">🔥</div>
                    <div className="text-2xl font-bold text-orange-600">{userStats.streak}</div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                    <div className="mt-2 text-xs text-orange-500 font-medium">
                      {getStreakStatus().status.toUpperCase()}
                    </div>
                  </CardBody>
                </Card>
                
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardBody className="text-center p-6">
                    <div className="text-4xl mb-3">✅</div>
                    <div className="text-2xl font-bold text-green-600">{userStats.completedTodos}</div>
                    <div className="text-sm text-gray-600">Tasks Completed</div>
                    <div className="mt-2 text-xs text-green-500 font-medium">
                      {userStats.completionRate}% Rate
                    </div>
                  </CardBody>
                </Card>
                
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardBody className="text-center p-6">
                    <div className="text-4xl mb-3">⏰</div>
                    <div className="text-2xl font-bold text-blue-600">{Math.floor(userStats.totalStudyTime / 60)}h</div>
                    <div className="text-sm text-gray-600">Study Time</div>
                    <div className="mt-2 text-xs text-blue-500 font-medium">
                      {userStats.focusSessions} Sessions
                    </div>
                  </CardBody>
                </Card>
                
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardBody className="text-center p-6">
                    <div className="text-4xl mb-3">🏅</div>
                    <div className="text-2xl font-bold text-purple-600">{userStats.achievementsCount}</div>
                    <div className="text-sm text-gray-600">Achievements</div>
                    <div className="mt-2 text-xs text-purple-500 font-medium">
                      {getAchievementStats().completionRate.toFixed(1)}% Complete
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Level Progress Section */}
              <Card className="bg-white shadow-lg">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Level Progress</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">Lv.{userStats.level}</div>
                      <div className="text-sm text-gray-600">{userStats.xp} / {userStats.nextLevelXp} XP</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${getLevelProgress()}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Level {userStats.level}</span>
                    <span>{getXPForNextLevel()} XP to Level {userStats.level + 1}</span>
                  </div>
                </CardBody>
              </Card>

              {/* Recent Activity Preview */}
              <Card className="bg-white shadow-lg">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <FaHistory className="mr-2 text-blue-500" />
                      Recent Activity
                    </h3>
                    <button 
                      onClick={enhancedRefreshStats}
                      disabled={isRefreshing}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      {isRefreshing ? '🔄' : '🔄'} Refresh
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentActivity.length > 0 ? (
                      recentActivity.slice(0, 3).map((activity, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl mr-3">{activity.icon || '🎯'}</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{activity.title}</div>
                            <div className="text-sm text-gray-600">{activity.description}</div>
                          </div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl mr-3">🎯</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">Completed a task</div>
                            <div className="text-sm text-gray-600">+10 XP earned</div>
                          </div>
                          <div className="text-xs text-gray-500">2 min ago</div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl mr-3">🔥</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">Maintained streak</div>
                            <div className="text-sm text-gray-600">Day 3 completed</div>
                          </div>
                          <div className="text-xs text-gray-500">1 hour ago</div>
                        </div>
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            </MotionDiv>
          )}

                    {activeTab === 'achievements' && (
            <MotionDiv
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {achievements.map((achievement, index) => (
                    <MotionCard 
                      key={achievement.id || achievement._id || `${achievement.name}-${index}`} 
                      className={`bg-white transform hover:scale-105 transition-all duration-300 ${
                        achievement.unlocked ? 'ring-2 ring-green-500' : 'opacity-60'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardBody>
                        <div className="text-center">
                          <div className="text-4xl mb-3">{achievement.icon || '🏆'}</div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{achievement.name}</h3>
                          <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            achievement.unlocked 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {achievement.unlocked ? 'Unlocked' : 'Locked'}
                          </div>
                          {achievement.unlocked && achievement.rewards && (
                            <div className="mt-3 text-xs text-gray-500">
                              {achievement.rewards.xp && <span className="mr-2">+{achievement.rewards.xp} XP</span>}
                              {achievement.rewards.coins && <span className="mr-2">+{achievement.rewards.coins} Coins</span>}
                              {achievement.rewards.gems && <span>+{achievement.rewards.gems} Gems</span>}
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </MotionCard>
                  ))}
                </div>
              ) : (
                <Card className="bg-white">
                  <CardBody className="text-center p-12">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No Achievements Yet</h3>
                    <p className="text-gray-600">Complete tasks and challenges to unlock achievements!</p>
                  </CardBody>
                </Card>
              )}
            </MotionDiv>
          )}





          {activeTab === 'rewards' && (
            <MotionDiv
              key="rewards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Daily Rewards Header */}
              <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CardBody className="text-center p-8">
                  <div className="text-6xl mb-4">🎯</div>
                  <h2 className="text-3xl font-bold mb-2">Daily Rewards</h2>
                  <p className="text-xl opacity-90">Spin the wheel to earn amazing prizes!</p>
                  <div className="mt-6 flex justify-center items-center space-x-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold">🎁</div>
                      <div className="text-sm opacity-90">Daily Spin</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">🔥</div>
                      <div className="text-sm opacity-90">Streak Bonus</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">⭐</div>
                      <div className="text-sm opacity-90">Special Rewards</div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Spin Wheel Section */}
              <Card className="bg-white">
                <CardBody className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Spin & Win</h3>
                    <StandaloneSpinWheel />
                  </div>
                </CardBody>
              </Card>

              {/* Rewards History */}
              <Card className="bg-white">
                <CardBody>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Rewards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">💰</div>
                        <div>
                          <div className="font-semibold text-blue-900">+50 Coins</div>
                          <div className="text-sm text-blue-600">Today</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">⚡</div>
                        <div>
                          <div className="font-semibold text-purple-900">+25 XP</div>
                          <div className="text-sm text-purple-600">Yesterday</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">⭐</div>
                        <div>
                          <div className="font-semibold text-green-900">+5 Gems</div>
                          <div className="text-sm text-green-600">2 days ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Streak Rewards */}
              <Card className="bg-white">
                <CardBody>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Streak Rewards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-lg border-2 ${userStats.streak >= 1 ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-center">
                        <div className="text-2xl mb-2">🔥</div>
                        <div className="font-semibold">1 Day</div>
                        <div className="text-sm text-gray-600">+10 XP</div>
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg border-2 ${userStats.streak >= 3 ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-center">
                        <div className="text-2xl mb-2">🔥🔥</div>
                        <div className="font-semibold">3 Days</div>
                        <div className="text-sm text-gray-600">+25 XP</div>
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg border-2 ${userStats.streak >= 7 ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-center">
                        <div className="text-2xl mb-2">🔥🔥🔥</div>
                        <div className="font-semibold">7 Days</div>
                        <div className="text-sm text-gray-600">+100 XP</div>
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg border-2 ${userStats.streak >= 30 ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-center">
                        <div className="text-2xl mb-2">👑</div>
                        <div className="font-semibold">30 Days</div>
                        <div className="text-sm text-gray-600">+500 XP</div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </MotionDiv>
          )}

          {activeTab === 'coin-earning' && (
            <MotionDiv
              key="coin-earning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CoinEarningSystem />
            </MotionDiv>
          )}

          {activeTab === 'challenges' && (
            <MotionDiv
              key="challenges"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DailyChallenge />
            </MotionDiv>
          )}

          {activeTab === 'activity' && (
            <MotionDiv
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ActivityFeed />
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>

      {/* Pet System Modal */}
      {/* <UltimatePetSystem 
        isOpen={showPetSystem} 
        onClose={() => setShowPetSystem(false)} 
      /> */}

      {/* Shop System Modal */}
      {/* <UltimateShopSystem 
        isOpen={showShopSystem} 
        onClose={() => setShowShopSystem(false)} 
      /> */}
    </div>
  );
};

export default GamificationNew; 