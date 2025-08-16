const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TodoComment = sequelize.define('TodoComment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    todoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'todos',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'comment',
      validate: {
        isIn: [['comment', 'status_change', 'attachment', 'mention']],
      },
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'todo_comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // Associations
  TodoComment.associate = (models) => {
    TodoComment.belongsTo(models.Todo, {
      foreignKey: 'todoId',
      as: 'todo',
    });

    TodoComment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return TodoComment;
};
