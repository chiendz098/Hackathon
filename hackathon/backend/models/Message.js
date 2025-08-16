const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'groups',
        key: 'id',
      },
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isAI: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    messageType: {
      type: DataTypes.ENUM('text', 'file', 'image', 'system'),
      defaultValue: 'text'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // Full-featured associations
  Message.associate = (models) => {
    // Message belongs to User (sender)
    Message.belongsTo(models.User, {
      foreignKey: 'senderId',
      as: 'sender',
    });

    // Message belongs to User (receiver)
    Message.belongsTo(models.User, {
      foreignKey: 'receiverId',
      as: 'receiver',
    });

    // Message belongs to Group (if group message)
    Message.belongsTo(models.Group, {
      foreignKey: 'groupId',
      as: 'group',
    });


  };

  return Message;
}; 