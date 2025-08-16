const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TodoAssignment = sequelize.define('TodoAssignment', {
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
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'assigned_to',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    assignedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'assigned_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined', 'in_progress', 'completed', 'overdue'),
      defaultValue: 'pending',
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'member', // 'leader', 'member', 'reviewer'
    },
    assignedTasks: {
      type: DataTypes.JSON,
      defaultValue: [], // Array of specific tasks assigned to this user
      field: 'assigned_tasks',
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    estimatedTime: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true,
      field: 'estimated_time',
    },
    actualTime: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true,
      field: 'actual_time',
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'started_at',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    feedback: {
      type: DataTypes.JSON,
      defaultValue: {
        quality: null,
        timeliness: null,
        collaboration: null,
        comments: ''
      },
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: {
        canEdit: true,
        canDelete: false,
        canReassign: false,
        canReview: false
      },
    },
    isAccepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_accepted',
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'accepted_at',
    },
    declinedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'declined_at',
    },
    declineReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'decline_reason',
    },
    classroomId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'classroom_id',
      references: {
        model: 'classrooms',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  }, {
    tableName: 'todo_assignments',
    timestamps: true,
    indexes: [
      {
        fields: ['todo_id']
      },
      {
        fields: ['assigned_to']
      },
      {
        fields: ['assigned_by']
      },
      {
        fields: ['status']
      },
      {
        fields: ['due_date']
      },
      {
        unique: true,
        fields: ['todo_id', 'assigned_to']
      }
    ]
  });

  TodoAssignment.associate = (models) => {
    TodoAssignment.belongsTo(models.Todo, { foreignKey: 'todoId', targetKey: 'id', as: 'todo' });
    TodoAssignment.belongsTo(models.User, { foreignKey: 'assignedTo', targetKey: 'id', as: 'assignee' });
    TodoAssignment.belongsTo(models.User, { foreignKey: 'assignedBy', targetKey: 'id', as: 'assigner' });
    TodoAssignment.belongsTo(models.Classroom, { foreignKey: 'classroomId', targetKey: 'id', as: 'classroom' });
  };

  return TodoAssignment;
};
