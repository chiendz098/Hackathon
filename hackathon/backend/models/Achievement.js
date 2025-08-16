const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Achievement = sequelize.define('Achievement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('productivity', 'learning', 'social', 'streak', 'milestone', 'special', 'seasonal', 'challenge'),
      defaultValue: 'productivity',
    },
    type: {
      type: DataTypes.ENUM('single', 'progressive', 'recurring', 'hidden', 'legendary'),
      defaultValue: 'single',
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rarity: {
      type: DataTypes.ENUM('common', 'uncommon', 'rare', 'epic', 'legendary'),
      defaultValue: 'common',
    },
    requirements: {
      type: DataTypes.JSON,
      defaultValue: {},
      field: 'requirements'
    },
    rewards: {
      type: DataTypes.JSON,
      defaultValue: {
        points: 0,
        experience: 0,
        badges: [],
        titles: [],
        specialFeatures: [],
        unlockables: []
      },
      field: 'rewards'
    },
    progressTracking: {
      type: DataTypes.JSON,
      defaultValue: {
        currentProgress: 0,
        targetProgress: 1,
        progressType: 'count', // count, time, percentage, custom
        milestones: [],
        timeLimit: null,
        resetFrequency: null
      },
      field: 'progress_tracking'
    },
    socialFeatures: {
      type: DataTypes.JSON,
      defaultValue: {
        shareable: true,
        leaderboard: false,
        competition: false,
        collaboration: false,
        publicDisplay: true,
        socialRewards: []
      },
      field: 'social_features'
    },
    unlockConditions: {
      type: DataTypes.JSON,
      defaultValue: {
        levelRequired: 1,
        skillRequired: {},
        timeRequired: null,
        prerequisiteAchievements: [],
        specialEvents: [],
        seasonalAvailability: null
      },
      field: 'unlock_conditions'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'achievements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Achievement.associate = (models) => {
    Achievement.belongsToMany(models.User, { 
      through: 'UserAchievement',
      foreignKey: 'achievementId',
      as: 'users'
    });
  };

  return Achievement;
};

// Achievement definitions to be seeded
const ACHIEVEMENT_DEFINITIONS = [
  // Streak Achievements
  {
    id: 'first_task',
    name: 'Bước Đầu Tiên',
    description: 'Hoàn thành task đầu tiên của bạn',
    icon: '🎯',
    category: 'completion',
    rarity: 'common',
    requirements: { type: 'tasks_completed', value: 1 },
    rewards: { xp: 10, coins: 5 },
    unlockMessage: 'Chúc mừng! Bạn đã hoàn thành task đầu tiên!'
  },
  {
    id: 'week_warrior',
    name: 'Chiến Binh Tuần',
    description: 'Học liên tục 7 ngày',
    icon: '🔥',
    category: 'streak',
    rarity: 'rare',
    requirements: { type: 'streak', value: 7, condition: 'days' },
    rewards: { xp: 100, coins: 50, gems: 1 },
    unlockMessage: 'Tuyệt vời! Bạn đã duy trì streak 7 ngày!'
  },
  {
    id: 'month_master',
    name: 'Bậc Thầy Tháng',
    description: 'Học liên tục 30 ngày',
    icon: '👑',
    category: 'streak',
    rarity: 'epic',
    requirements: { type: 'streak', value: 30, condition: 'days' },
    rewards: { xp: 500, coins: 200, gems: 5, unlock: ['theme_gold'] },
    unlockMessage: 'Không thể tin được! Streak 30 ngày - bạn là huyền thoại!'
  },
  
  // Completion Achievements
  {
    id: 'task_hunter',
    name: 'Thợ Săn Task',
    description: 'Hoàn thành 50 task',
    icon: '🏹',
    category: 'completion',
    rarity: 'rare',
    requirements: { type: 'tasks_completed', value: 50 },
    rewards: { xp: 200, coins: 100 },
    unlockMessage: 'Bạn là một thợ săn task thực thụ!'
  },
  {
    id: 'task_legend',
    name: 'Huyền Thoại Task',
    description: 'Hoàn thành 500 task',
    icon: '⚡',
    category: 'completion',
    rarity: 'legendary',
    requirements: { type: 'tasks_completed', value: 500 },
    rewards: { xp: 1000, coins: 500, gems: 10, unlock: ['avatar_legend'] },
    unlockMessage: 'Bạn đã trở thành huyền thoại trong việc hoàn thành task!'
  },
  
  // Time Achievements
  {
    id: 'study_marathon',
    name: 'Marathon Học Tập',
    description: 'Học tổng cộng 100 giờ',
    icon: '⏰',
    category: 'time',
    rarity: 'epic',
    requirements: { type: 'study_time', value: 6000, condition: 'minutes' },
    rewards: { xp: 300, coins: 150, gems: 3 },
    unlockMessage: '100 giờ học tập - sự kiên trì của bạn thật đáng ngưỡng mộ!'
  },
  
  // Forest Achievements
  {
    id: 'tree_planter',
    name: 'Người Trồng Cây',
    description: 'Trồng 10 cây trong rừng học tập',
    icon: '🌱',
    category: 'exploration',
    rarity: 'common',
    requirements: { type: 'trees_planted', value: 10 },
    rewards: { xp: 50, coins: 25 },
    unlockMessage: 'Rừng học tập của bạn đang phát triển tốt!'
  },
  {
    id: 'forest_guardian',
    name: 'Người Bảo Vệ Rừng',
    description: 'Trồng 100 cây và đạt Forest Level 10',
    icon: '🌳',
    category: 'exploration',
    rarity: 'epic',
    requirements: { type: 'forest_level', value: 10 },
    rewards: { xp: 400, coins: 200, gems: 5, unlock: ['theme_forest'] },
    unlockMessage: 'Bạn đã trở thành người bảo vệ rừng học tập!'
  },
  
  // Pet Achievements
  {
    id: 'pet_lover',
    name: 'Người Yêu Pet',
    description: 'Tương tác với pet 50 lần',
    icon: '🐱',
    category: 'social',
    rarity: 'rare',
    requirements: { type: 'pet_interactions', value: 50 },
    rewards: { xp: 100, coins: 75, unlock: ['pet_dog'] },
    unlockMessage: 'Pet của bạn rất hạnh phúc! Bạn đã mở khóa pet mới!'
  },
  
  // Level Achievements
  {
    id: 'level_10',
    name: 'Thăng Cấp 10',
    description: 'Đạt Level 10',
    icon: '🎖️',
    category: 'mastery',
    rarity: 'rare',
    requirements: { type: 'level', value: 10 },
    rewards: { xp: 0, coins: 100, gems: 2, unlock: ['theme_blue'] },
    unlockMessage: 'Level 10! Bạn đang trên con đường trở thành bậc thầy!'
  },
  {
    id: 'level_25',
    name: 'Chuyên Gia',
    description: 'Đạt Level 25',
    icon: '🏆',
    category: 'mastery',
    rarity: 'epic',
    requirements: { type: 'level', value: 25 },
    rewards: { xp: 0, coins: 250, gems: 5, unlock: ['theme_purple', 'avatar_expert'] },
    unlockMessage: 'Level 25! Bạn đã trở thành chuyên gia học tập!'
  },
  {
    id: 'level_50',
    name: 'Bậc Thầy',
    description: 'Đạt Level 50',
    icon: '👑',
    category: 'mastery',
    rarity: 'legendary',
    requirements: { type: 'level', value: 50 },
    rewards: { xp: 0, coins: 500, gems: 10, unlock: ['theme_master', 'avatar_master'] },
    unlockMessage: 'Level 50! Bạn đã trở thành bậc thầy học tập!'
  },
  
  // Special Achievements
  {
    id: 'early_bird',
    name: 'Chim Sớm',
    description: 'Hoàn thành task trước 8:00 AM trong 7 ngày',
    icon: '🌅',
    category: 'special',
    rarity: 'rare',
    requirements: { type: 'early_completion', value: 7, condition: 'days' },
    rewards: { xp: 150, coins: 100, unlock: ['theme_sunrise'] },
    unlockMessage: 'Bạn là một early bird thực thụ!'
  },
  {
    id: 'night_owl',
    name: 'Cú Đêm',
    description: 'Hoàn thành task sau 10:00 PM trong 7 ngày',
    icon: '🦉',
    category: 'special',
    rarity: 'rare',
    requirements: { type: 'late_completion', value: 7, condition: 'days' },
    rewards: { xp: 150, coins: 100, unlock: ['theme_midnight'] },
    unlockMessage: 'Bạn là một night owl thực thụ!'
  },
  
  // Hidden Achievements
  {
    id: 'perfectionist',
    name: 'Người Hoàn Hảo',
    description: 'Hoàn thành 20 task liên tiếp với 100% progress',
    icon: '💎',
    category: 'special',
    rarity: 'mythic',
    requirements: { type: 'perfect_completion', value: 20 },
    rewards: { xp: 1000, coins: 1000, gems: 20, unlock: ['theme_diamond', 'avatar_perfect'] },
    isHidden: true,
    unlockMessage: 'Không thể tin được! Bạn là một perfectionist thực thụ!'
  }
];

module.exports.ACHIEVEMENT_DEFINITIONS = ACHIEVEMENT_DEFINITIONS;
