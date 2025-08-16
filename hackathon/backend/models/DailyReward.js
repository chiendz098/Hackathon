const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DailyReward = sequelize.define('DailyReward', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    day: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 30 // Monthly cycle
      }
    },
    rewardType: {
      type: DataTypes.ENUM('coins', 'gems', 'xp', 'item', 'theme', 'pet'),
      allowNull: false
    },
    rewardAmount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rewardItemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'shop_items',
        key: 'id'
      }
    },
    multiplier: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0 // For streak bonuses
    },
    isSpecial: {
      type: DataTypes.BOOLEAN,
      defaultValue: false // Special rewards for milestones
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'daily_rewards',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['day']
      }
    ]
  });

  // Associations
  DailyReward.associate = (models) => {
    // DailyReward belongs to ShopItem (optional)
    DailyReward.belongsTo(models.ShopItem, {
      foreignKey: 'rewardItemId',
      as: 'rewardItem'
    });

    // DailyReward has many UserDailyRewards
    DailyReward.hasMany(models.UserDailyReward, {
      foreignKey: 'rewardId',
      as: 'userRewards'
    });
  };

  return DailyReward;
};
