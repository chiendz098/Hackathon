const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserEffect = sequelize.define('UserEffect', {
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
  effectType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  effectValue: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Source of the effect (e.g., "shop_item", "achievement", "event")'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'user_effects',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'effect_type'],
      unique: true
    },
    {
      fields: ['expires_at']
    }
  ]
});

module.exports = UserEffect; 