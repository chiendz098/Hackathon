const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserPurchase = sequelize.define('UserPurchase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'shop_items',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  pricePaidCoins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pricePaidGems: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  purchasedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('completed', 'pending', 'failed', 'refunded'),
    defaultValue: 'completed'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'user_purchases',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['item_id']
    },
    {
      fields: ['purchased_at']
    },
    {
      fields: ['transaction_id']
    }
  ]
});

module.exports = UserPurchase;
