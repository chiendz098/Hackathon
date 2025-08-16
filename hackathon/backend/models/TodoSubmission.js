const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TodoSubmission = sequelize.define('TodoSubmission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    assignmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'todo_assignments',
        key: 'id'
      }
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attachments: {
      type: DataTypes.JSON,
      defaultValue: [] // Array of file URLs
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    isLate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('submitted', 'graded', 'returned', 'resubmitted'),
      defaultValue: 'submitted'
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gradedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    gradedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    attemptNumber: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    timeSpent: {
      type: DataTypes.INTEGER, // in minutes
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {
        wordCount: 0,
        fileCount: 0,
        lastModified: null
      }
    }
  }, {
    tableName: 'todo_submissions',
    timestamps: true,
    indexes: [
      {
        fields: ['assignmentId']
      },
      {
        fields: ['studentId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['submittedAt']
      },
      {
        unique: true,
        fields: ['assignmentId', 'studentId', 'attemptNumber']
      }
    ]
  });

  // Associations
  TodoSubmission.associate = (models) => {
    // TodoSubmission belongs to TodoAssignment
    TodoSubmission.belongsTo(models.TodoAssignment, {
      foreignKey: 'assignmentId',
      as: 'assignment'
    });

    // TodoSubmission belongs to User (student)
    TodoSubmission.belongsTo(models.User, {
      foreignKey: 'studentId',
      as: 'student'
    });

    // TodoSubmission belongs to User (grader)
    TodoSubmission.belongsTo(models.User, {
      foreignKey: 'gradedBy',
      as: 'grader'
    });
  };

  return TodoSubmission;
};
