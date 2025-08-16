const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserDecoration = sequelize.define('UserDecoration', {
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
  decorationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'decorations',
      key: 'id'
    }
  },
  isEquipped: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  purchasedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  customSettings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'user_decorations',
  timestamps: true,
  underscored: true
});

module.exports = UserDecoration; 