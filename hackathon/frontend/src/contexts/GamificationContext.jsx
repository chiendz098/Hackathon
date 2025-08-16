import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProgress } from '../api';
import { useAuth } from './AuthContext';
import AchievementNotification from '../components/gamification/AchievementNotification';
import XPNotification from '../components/gamification/XPNotification';

const GamificationContext = createContext();

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

export const GamificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Notification states
  const [xpNotification, setXpNotification] = useState({
    isVisible: false,
    xpGained: 0,
    reason: '',
    levelUp: false,
    newLevel: 1,
    currentXP: 0,
    xpToNext: 100
  });
  
  const [achievementNotification, setAchievementNotification] = useState({
    isVisible: false,
    achievements: []
  });

  // Load user progress on mount and when user changes
  useEffect(() => {
    if (user) {
      loadUserProgress();
    }
  }, [user]);

  const loadUserProgress = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await getUserProgress();
      if (response.data.success) {
        setUserProgress(response.data.progress);
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show XP notification
  const showXPNotification = (data) => {
    setXpNotification({
      isVisible: true,
      xpGained: data.xpAwarded || 0,
      reason: data.reason || 'task_completion',
      levelUp: data.leveledUp || false,
      newLevel: data.newLevel || userProgress?.currentLevel || 1,
      currentXP: data.progress?.totalXP || userProgress?.totalXP || 0,
      xpToNext: data.progress?.xpToNextLevel || userProgress?.xpToNextLevel || 100
    });

    // Update user progress if provided
    if (data.progress) {
      setUserProgress(data.progress);
    }
  };

  // Show achievement notification
  const showAchievementNotification = (achievements) => {
    if (achievements && achievements.length > 0) {
      setAchievementNotification({
        isVisible: true,
        achievements: Array.isArray(achievements) ? achievements : [achievements]
      });
    }
  };

  // Hide XP notification
  const hideXPNotification = () => {
    setXpNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Hide achievement notification
  const hideAchievementNotification = () => {
    setAchievementNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Handle todo completion with gamification tracking
  const handleTodoCompletion = async (todoId, completionData = {}) => {
    try {
      // Track study progress if there's actual time spent
      if (completionData.actualTime && completionData.actualTime > 0) {
        await trackStudyProgress('todo_completion', completionData.actualTime, todoId);
      }
      
      // Update streak
      await updateStreak(todoId);
      
      // Refresh user progress
      await loadUserProgress();
      
      // Show XP notification
      const xpGained = 10; // Base XP for todo completion
      showXPNotification({
        xpGained,
        reason: 'task_completion',
        currentXP: userProgress?.xp || 0,
        xpToNext: userProgress?.nextLevelXp || 100
      });
      
      return true;
    } catch (error) {
      console.error('Error handling todo completion:', error);
      return false;
    }
  };

  // Track study progress
  const trackStudyProgress = async (type, duration, todoId = null, sessionType = 'pomodoro') => {
    try {
      const response = await fetch('/api/gamification/track-study', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type, duration, todoId, sessionType })
      });
      
      if (response.ok) {
        console.log('✅ Study progress tracked successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error tracking study progress:', error);
      return false;
    }
  };

  // Update streak when todo is completed
  const updateStreak = async (todoId) => {
    try {
      const response = await fetch('/api/gamification/update-streak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ todoId })
      });
      
      if (response.ok) {
        console.log('🔥 Streak updated successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating streak:', error);
      return false;
    }
  };

  // Calculate level progress percentage
  const getLevelProgress = () => {
    if (!userProgress) return 0;
    const totalXPForCurrentLevel = userProgress.totalXP;
    const xpNeededForNext = userProgress.xpToNextLevel;
    return (totalXPForCurrentLevel / (totalXPForCurrentLevel + xpNeededForNext)) * 100;
  };

  // Get user's current rank/title based on level
  const getUserRank = () => {
    if (!userProgress) return 'Beginner';
    
    const level = userProgress.currentLevel;
    if (level >= 50) return 'Grandmaster';
    if (level >= 40) return 'Master';
    if (level >= 30) return 'Expert';
    if (level >= 20) return 'Advanced';
    if (level >= 10) return 'Intermediate';
    if (level >= 5) return 'Novice';
    return 'Beginner';
  };

  // Check if user can afford something
  const canAfford = (cost, currency = 'coins') => {
    if (!userProgress) return false;
    return userProgress[currency] >= cost;
  };

  // Spend currency
  const spendCurrency = async (amount, currency = 'coins', item = null) => {
    try {
      // This would call the backend to spend currency
      // For now, just update local state
      if (canAfford(amount, currency)) {
        setUserProgress(prev => ({
          ...prev,
          [currency]: prev[currency] - amount
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error spending currency:', error);
      return false;
    }
  };

  // Get streak status
  const getStreakStatus = () => {
    if (!userProgress) return { current: 0, isActive: false };
    
    const today = new Date().toISOString().split('T')[0];
    const lastStudy = userProgress.lastStudyDate ? 
      new Date(userProgress.lastStudyDate).toISOString().split('T')[0] : null;
    
    return {
      current: userProgress.currentStreak || 0,
      longest: userProgress.longestStreak || 0,
      isActive: lastStudy === today
    };
  };

  const value = {
    // State
    userProgress,
    loading,
    
    // Actions
    loadUserProgress,
    showXPNotification,
    showAchievementNotification,
    hideXPNotification,
    hideAchievementNotification,
    handleTodoCompletion,
    trackStudyProgress,
    updateStreak,
    spendCurrency,
    
    // Computed values
    getLevelProgress,
    getUserRank,
    canAfford,
    getStreakStatus,
    
    // Notification states
    xpNotification,
    achievementNotification
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
      
      {/* XP Notification Component */}
      <XPNotification
        {...xpNotification}
        onComplete={hideXPNotification}
      />
      
      {/* Achievement Notification Component */}
      <AchievementNotification
        achievements={achievementNotification.achievements}
        isVisible={achievementNotification.isVisible}
        onClose={hideAchievementNotification}
      />
    </GamificationContext.Provider>
  );
};
