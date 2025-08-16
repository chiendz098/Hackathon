const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroupInvitation = sequelize.define('GroupInvitation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id',
      },
    },
    invitedUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    invitedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired', 'cancelled'),
      defaultValue: 'pending',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('member', 'moderator', 'admin'),
      defaultValue: 'member',
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: {
        canInvite: false,
        canKick: false,
        canModerate: false,
        canCreateTodos: true,
        canEditTodos: true,
        canDeleteTodos: false
      },
    },
    inviteCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    maxUses: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentUses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isBulkInvite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    todoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'todos',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'group_invitations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['groupId']
      },
      {
        fields: ['invitedUserId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['inviteCode']
      },
      {
        fields: ['expiresAt']
      },
      {
        fields: ['todoId']
      }
    ]
  });

  GroupInvitation.associate = (models) => {
    GroupInvitation.belongsTo(models.Group, { foreignKey: 'groupId', as: 'group' });
    GroupInvitation.belongsTo(models.User, { foreignKey: 'invitedUserId', as: 'invitedUser' });
    GroupInvitation.belongsTo(models.User, { foreignKey: 'invitedBy', as: 'inviter' });
    GroupInvitation.belongsTo(models.Todo, { foreignKey: 'todoId', as: 'todo' });
  };

  return GroupInvitation;
}; 