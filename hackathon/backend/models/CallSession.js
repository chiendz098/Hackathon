const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CallSession = sequelize.define('CallSession', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chat_rooms',
        key: 'id'
      }
    },
    initiatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    callType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'audio',
      validate: {
        isIn: [['audio', 'video', 'screen-share']]
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'initiating',
      validate: {
        isIn: [['initiating', 'ringing', 'connected', 'ended', 'missed', 'rejected']]
      }
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER, // in seconds
      allowNull: true
    },
    participants: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    recordingUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'call_sessions',
    timestamps: true,
    indexes: [
      {
        fields: ['roomId']
      },
      {
        fields: ['initiatorId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['startedAt']
      },
      {
        fields: ['callType']
      }
    ]
  });

  CallSession.associate = (models) => {
    CallSession.belongsTo(models.ChatRoom, {
      foreignKey: 'roomId',
      as: 'room'
    });

    CallSession.belongsTo(models.User, {
      foreignKey: 'initiatorId',
      as: 'initiator'
    });
  };

  return CallSession;
}; 