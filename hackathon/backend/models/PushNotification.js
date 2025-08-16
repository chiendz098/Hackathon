const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PushNotification = sequelize.define('PushNotification', {
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
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    type: {
      type: DataTypes.ENUM('message', 'mention', 'reaction', 'system'),
      allowNull: false,
      defaultValue: 'message'
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'push_notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  PushNotification.associate = (models) => {
    PushNotification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return PushNotification;
}; 