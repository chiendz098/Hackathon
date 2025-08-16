import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import useApi from '../../hooks/useApi';
import { Trophy, Star, Target, TrendingUp, Users, Award, Flame, Zap, Crown, Medal } from 'lucide-react';
import toast from 'react-hot-toast';

const GamificationDashboard = () => {
  const { user } = useAuth();
  const { get } = useApi();
  const [stats, setStats] = useState({
    level: 1,
    experience: 0,
    points: 0,
    streak: 0,
    achievements: [],
    badges: [],
    rank: null,
    nextLevel: 100
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      const [statsResponse, leaderboardResponse, achievementsResponse] = await Promise.all([
        get('/api/gamification/stats'),
        get('/api/gamification/leaderboard'),
        get('/api/gamification/recent-achievements')
      ]);

      if (statsResponse.success) setStats(statsResponse.stats);
      if (leaderboardResponse.success) setLeaderboard(leaderboardResponse.leaderboard);
      if (achievementsResponse.success) setRecentAchievements(achievementsResponse.achievements);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      toast.error('Failed to load gamification data');
    } finally {
      setLoading(false);
    }
  };

  const getLevelProgress = () => {
    const currentLevelExp = (stats.level - 1) * 100;
    const currentExp = stats.experience - currentLevelExp;
    const nextLevelExp = stats.nextLevel - currentLevelExp;
    return Math.min((currentExp / nextLevelExp) * 100, 100);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <span className="text-lg font-bold text-gray-600">{rank}</span>;
  };

  const getBadgeIcon = (badgeType) => {
    switch (badgeType) {
      case 'streak': return <Flame className="w-5 h-5 text-red-500" />;
      case 'productivity': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'learning': return <Star className="w-5 h-5 text-blue-500" />;
      case 'social': return <Users className="w-5 h-5 text-green-500" />;
      default: return <Award className="w-5 h-5 text-purple-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Gamification Dashboard</h3>
            <p className="text-gray-600">Track your progress and achievements</p>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold">Level {stats.level}</h4>
            <p className="text-blue-100">{stats.experience} / {stats.nextLevel} XP</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.points}</div>
            <div className="text-blue-100 text-sm">Total Points</div>
          </div>
        </div>
        
        <div className="w-full bg-blue-400 rounded-full h-3 mb-2">
          <motion.div
            className="bg-white h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${getLevelProgress()}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span>Level {stats.level}</span>
          <span>Level {stats.level + 1}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Streak & Stats */}
        <div className="space-y-4">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center space-x-3">
              <Flame className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.streak}</div>
                <div className="text-orange-700 text-sm">Day Streak</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.achievements.length}</div>
                <div className="text-green-700 text-sm">Achievements</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h5 className="font-semibold text-purple-800 mb-3">Recent Achievements</h5>
          <div className="space-y-2">
            {recentAchievements.slice(0, 3).map((achievement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-purple-700">{achievement.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h5 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Top Performers</span>
        </h5>
        <div className="space-y-2">
          {leaderboard.slice(0, 5).map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(index + 1)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {player.id === user?.id ? 'You' : player.username}
                  </div>
                  <div className="text-sm text-gray-500">Level {player.level}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{player.points}</div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {stats.badges.length > 0 && (
        <div className="mt-6">
          <h5 className="font-semibold text-gray-800 mb-3">Your Badges</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.badges.map((badge, index) => (
              <motion.div
                key={badge.id || index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg p-3 border border-gray-200 text-center hover:shadow-md transition-shadow"
              >
                <div className="flex justify-center mb-2">
                  {getBadgeIcon(badge.type)}
                </div>
                <div className="text-sm font-medium text-gray-900">{badge.name}</div>
                <div className="text-xs text-gray-500">{badge.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationDashboard; 