const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroupMembers = sequelize.define('GroupMembers', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'group_id',
      references: {
        model: 'groups',
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
    role: {
      type: DataTypes.ENUM('member', 'moderator', 'admin'),
      defaultValue: 'member',
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: {},
    }
  }, {
    tableName: 'group_members',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // Associations
  GroupMembers.associate = (models) => {
    GroupMembers.belongsTo(models.Group, {
      foreignKey: 'groupId',
      as: 'group',
    });

    GroupMembers.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return GroupMembers;
}; 