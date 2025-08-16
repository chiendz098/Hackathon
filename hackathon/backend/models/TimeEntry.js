const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TimeEntry = sequelize.define('TimeEntry', {
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
        key: 'id'
      },
      field: 'userId'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'work',
      validate: {
        isIn: [['work', 'break', 'meeting', 'research']],
      },
    },
  }, {
    tableName: 'time_entries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // Associations
  TimeEntry.associate = (models) => {
    TimeEntry.belongsTo(models.Todo, {
      foreignKey: 'todoId',
      as: 'todo',
    });

    TimeEntry.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return TimeEntry;
};
