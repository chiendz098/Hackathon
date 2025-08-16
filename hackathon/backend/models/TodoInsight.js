const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TodoInsight = sequelize.define('TodoInsight', {
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
    insightType: {
      type: DataTypes.ENUM('productivity', 'learning', 'scheduling', 'collaboration', 'motivation', 'health', 'custom'),
      allowNull: false,
      field: 'insight_type'
    },
    category: {
      type: DataTypes.ENUM('tip', 'warning', 'suggestion', 'prediction', 'analysis', 'recommendation'),
      defaultValue: 'suggestion',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.JSON,
      defaultValue: {},
      field: 'content'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    confidence: {
      type: DataTypes.FLOAT,
      defaultValue: 0.8,
      validate: {
        min: 0,
        max: 1,
      },
      field: 'confidence'
    },
    source: {
      type: DataTypes.STRING,
      defaultValue: 'ai', // ai, system, user, external
    },
    isActionable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_actionable'
    },
    actions: {
      type: DataTypes.JSON,
      defaultValue: [],
      field: 'actions'
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
      field: 'tags'
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      field: 'metadata'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read'
    },
    isDismissed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_dismissed'
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
    tableName: 'todo_insights',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['todo_id'] },
      { fields: ['insight_type'] },
      { fields: ['category'] },
      { fields: ['priority'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] }
    ]
  });

  TodoInsight.associate = (models) => {
    TodoInsight.belongsTo(models.Todo, { foreignKey: 'todoId', as: 'todo' });
  };

  return TodoInsight;
}; 