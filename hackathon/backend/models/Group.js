const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Group = sequelize.define('Group', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true, // Temporarily allow null to fix existing data
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rules: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // Todo group specific fields
    todoSettings: {
      type: DataTypes.JSONB,
      defaultValue: {
        allowMemberCreation: true,
        requireApproval: false,
        maxTodosPerMember: 10,
        allowPublicTodos: false,
        defaultPermissions: {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canAssign: false,
          canInvite: false
        },
        // Enhanced collaboration settings
        collaborationMode: 'real-time', // real-time, async, hybrid
        liveEditing: true,
        versionControl: true,
        conflictResolution: 'auto', // auto, manual, voting
        consensusRequired: false,
        peerReview: false,
        qualityCheckpoints: [],
        feedbackLoops: true,
        communicationChannels: ['chat', 'comments', 'mentions', 'notifications'],
        fileSharing: {
          enabled: true,
          maxFileSize: 50, // MB
          allowedTypes: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'png', 'gif'],
          versioning: true,
          collaboration: true
        },
        realTimeFeatures: {
          presenceIndicators: true,
          cursorTracking: true,
          changeHistory: true,
          autoSave: true,
          syncInterval: 3000, // milliseconds
          offlineSupport: true
        }
      },
      field: 'todo_settings'
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      field: 'max_members'
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_private'
    },
    inviteCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      field: 'invite_code'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true, // 'study', 'project', 'work', 'hobby', etc.
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: [],
    }
  }, {
    tableName: 'groups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // Temporarily comment out associations to fix server startup
  Group.associate = (models) => {
    // Group belongs to User (creator)
    Group.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
    });

    // Group has many GroupMembers
    Group.hasMany(models.GroupMembers, {
      foreignKey: 'groupId',
      as: 'groupMembers',
    });

    // Group has many Messages
    Group.hasMany(models.Message, {
      foreignKey: 'groupId',
      as: 'messages',
    });

    // Group has many StudyRooms (commented out - model doesn't exist)
    // Group.hasMany(models.StudyRoom, {
    //   foreignKey: 'groupId',
    //   as: 'studyRooms',
    // });

    // Group has many Todos
    Group.hasMany(models.Todo, {
      foreignKey: 'groupId',
      as: 'todos',
    });

    // Group has many GroupInvitations
    Group.hasMany(models.GroupInvitation, {
      foreignKey: 'groupId',
      as: 'invitations',
    });
  };

  return Group;
}; 