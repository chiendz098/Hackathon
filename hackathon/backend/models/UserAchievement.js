const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserAchievement = sequelize.define('UserAchievement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'userId'
    },
    achievementId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'achievements',
        key: 'id',
      },
    },
    unlockedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    progress: {
      type: DataTypes.JSON,
      defaultValue: {}, // Track progress towards achievement
    },
    isNotified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Whether user has been notified of this achievement
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Whether this achievement is featured on user's profile
    },
  }, {
    tableName: 'user_achievements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'achievementId']
      }
    ]
  });

  // Associations
  UserAchievement.associate = (models) => {
    // UserAchievement belongs to User
    UserAchievement.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    // UserAchievement belongs to Achievement
    UserAchievement.belongsTo(models.Achievement, {
      foreignKey: 'achievementId',
      as: 'achievement',
    });
  };

  return UserAchievement;
};
