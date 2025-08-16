const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ScheduledMessage = sequelize.define('ScheduledMessage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chat_messages',
        key: 'id'
      }
    },
    scheduledBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    }
  }, {
    tableName: 'scheduled_messages',
    timestamps: true,
    indexes: [
      {
        fields: ['scheduledBy']
      },
      {
        fields: ['scheduledAt']
      },
      {
        fields: ['status']
      }
    ]
  });

  ScheduledMessage.associate = (models) => {
    ScheduledMessage.belongsTo(models.ChatMessage, {
      foreignKey: 'messageId',
      as: 'message'
    });

    ScheduledMessage.belongsTo(models.User, {
      foreignKey: 'scheduledBy',
      as: 'scheduler'
    });
  };

  return ScheduledMessage;
}; 