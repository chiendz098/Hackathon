const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TodoCollaboration = sequelize.define('TodoCollaboration', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    todoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'todo_id',
      references: {
        model: 'todos',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    actionType: {
      type: DataTypes.ENUM('edit', 'comment', 'assign', 'complete', 'review', 'approve', 'reject', 'mention'),
      allowNull: false,
      field: 'action_type'
    },
    actionData: {
      type: DataTypes.JSON,
      defaultValue: {},
      field: 'action_data'
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'timestamp'
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'session_id'
    },
    deviceInfo: {
      type: DataTypes.JSON,
      defaultValue: {},
      field: 'device_info'
    },
    location: {
      type: DataTypes.JSON,
      defaultValue: null,
      field: 'location'
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      field: 'metadata'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'todo_collaborations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['todo_id'] },
      { fields: ['user_id'] },
      { fields: ['action_type'] },
      { fields: ['timestamp'] },
      { fields: ['session_id'] }
    ]
  });

  TodoCollaboration.associate = (models) => {
    TodoCollaboration.belongsTo(models.Todo, { foreignKey: 'todoId', as: 'todo' });
    TodoCollaboration.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return TodoCollaboration;
}; 