const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClassroomStudent = sequelize.define('ClassroomStudent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    classroomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'classrooms',
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
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'dropped'),
      defaultValue: 'active'
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    role: {
      type: DataTypes.ENUM('student', 'monitor', 'assistant'),
      defaultValue: 'student'
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: true // Optional nickname in class
    },
    stats: {
      type: DataTypes.JSON,
      defaultValue: {
        assignmentsCompleted: 0,
        assignmentsTotal: 0,
        averageScore: 0,
        totalScore: 0,
        participationPoints: 0,
        attendanceRate: 100
      }
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        notifications: true,
        emailUpdates: true,
        reminderTime: 24 // hours before due date
      }
    }
  }, {
    tableName: 'classroom_students',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['classroomId', 'studentId']
      },
      {
        fields: ['classroomId']
      },
      {
        fields: ['studentId']
      },
      {
        fields: ['status']
      }
    ]
  });

  // Associations
  ClassroomStudent.associate = (models) => {
    // ClassroomStudent belongs to Classroom
    ClassroomStudent.belongsTo(models.Classroom, {
      foreignKey: 'classroomId',
      as: 'classroom'
    });

    // ClassroomStudent belongs to User (student)
    ClassroomStudent.belongsTo(models.User, {
      foreignKey: 'studentId',
      as: 'student'
    });
  };

  return ClassroomStudent;
};
