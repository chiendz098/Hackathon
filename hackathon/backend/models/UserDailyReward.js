const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserDailyReward = sequelize.define('UserDailyReward', {
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
    rewardId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'daily_rewards',
        key: 'id'
      },
      field: 'rewardId'
    },
    claimedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    streakDay: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    bonusMultiplier: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0
    }
  }, {
    tableName: 'user_daily_rewards',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['claimedAt']
      },
      {
        unique: true,
        fields: ['userId', 'rewardId', 'streakDay']
      }
    ]
  });

  // Associations
  UserDailyReward.associate = (models) => {
    // UserDailyReward belongs to User
    UserDailyReward.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // UserDailyReward belongs to DailyReward
    UserDailyReward.belongsTo(models.DailyReward, {
      foreignKey: 'rewardId',
      as: 'reward'
    });
  };

  return UserDailyReward;
};
