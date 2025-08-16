const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Classroom = sequelize.define('Classroom', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    classCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [6, 10]
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for existing data during migration
      references: {
        model: 'users',
        key: 'id'
      }
    },
    maxStudents: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      validate: {
        min: 1,
        max: 200
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    semester: {
      type: DataTypes.STRING,
      allowNull: true
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 2020,
        max: 2030
      }
    },
    schedule: {
      type: DataTypes.JSON,
      defaultValue: {} // Schedule information
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        allowLateSubmission: false,
        autoGrading: false,
        notificationsEnabled: true,
        discussionEnabled: true
      }
    },
    coverImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING,
      defaultValue: '#3B82F6' // Default blue color
    }
  }, {
    tableName: 'classrooms',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['classCode']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['subject']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  // Associations
  Classroom.associate = (models) => {
    // Classroom belongs to User (admin/teacher who created it)
    Classroom.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'teacher'
    });

    // Classroom has many ClassroomStudents
    Classroom.hasMany(models.ClassroomStudent, {
      foreignKey: 'classroomId',
      as: 'students'
    });

    // Classroom has many TodoAssignments
    Classroom.hasMany(models.TodoAssignment, {
      foreignKey: 'classroomId',
      as: 'assignments'
    });
  };

  return Classroom;
};
