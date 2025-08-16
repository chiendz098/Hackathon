const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Decoration = sequelize.define('Decoration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('theme', 'avatar_frame', 'profile_banner', 'background', 'effect', 'accessory'),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary', 'mythic'),
    allowNull: false,
    defaultValue: 'common'
  },
  priceCoins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  priceGems: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rarity: {
    type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary', 'mythic'),
    allowNull: false,
    defaultValue: 'common'
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  previewUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  effects: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  requirements: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  unlockConditions: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'decorations',
  timestamps: true,
  underscored: true
});

module.exports = Decoration; 