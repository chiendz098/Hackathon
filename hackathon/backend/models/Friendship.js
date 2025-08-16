const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Friendship = sequelize.define('Friendship', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    requesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    addresseeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined', 'blocked'),
      defaultValue: 'pending',
    },
    requestedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    // Friendship metadata
    closenessLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1, // 1-5 scale based on interactions
    },
    interactionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastInteraction: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    // Friendship settings
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        allowStudyRoomInvites: true,
        allowDirectMessages: true,
        showOnlineStatus: true,
        shareProgress: true,
        allowNotifications: true
      },
    },
    
    // Special relationship types
    relationshipType: {
      type: DataTypes.ENUM('friend', 'study_buddy', 'mentor', 'mentee', 'classmate', 'colleague'),
      defaultValue: 'friend',
    },
    
    // Notes about the friendship
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    // Tags for organizing friends
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    
  }, {
    tableName: 'friendships',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['requesterId', 'addresseeId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['requestedAt']
      }
    ]
  });

  // Instance methods
  Friendship.prototype.accept = function() {
    this.status = 'accepted';
    this.respondedAt = new Date();
    return this.save();
  };

  Friendship.prototype.decline = function() {
    this.status = 'declined';
    this.respondedAt = new Date();
    return this.save();
  };

  Friendship.prototype.block = function() {
    this.status = 'blocked';
    this.respondedAt = new Date();
    return this.save();
  };

  Friendship.prototype.incrementInteraction = function() {
    this.interactionCount += 1;
    this.lastInteraction = new Date();
    
    // Update closeness level based on interactions
    if (this.interactionCount >= 100) this.closenessLevel = 5;
    else if (this.interactionCount >= 50) this.closenessLevel = 4;
    else if (this.interactionCount >= 20) this.closenessLevel = 3;
    else if (this.interactionCount >= 5) this.closenessLevel = 2;
    
    return this.save();
  };

  Friendship.prototype.updateSettings = function(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    return this.save();
  };

  Friendship.prototype.addTag = function(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      return this.save();
    }
    return Promise.resolve(this);
  };

  Friendship.prototype.removeTag = function(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    return this.save();
  };

  // Class methods
  Friendship.findFriendship = function(userId1, userId2) {
    return this.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { requesterId: userId1, addresseeId: userId2 },
          { requesterId: userId2, addresseeId: userId1 }
        ]
      }
    });
  };

  Friendship.getFriends = function(userId, status = 'accepted') {
    return this.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { requesterId: userId },
          { addresseeId: userId }
        ],
        status
      },
      include: [
        {
          model: require('./User')(sequelize),
          as: 'requester',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: require('./User')(sequelize),
          as: 'addressee',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
  };

  Friendship.getPendingRequests = function(userId) {
    return this.findAll({
      where: {
        addresseeId: userId,
        status: 'pending'
      },
      include: [{
        model: require('./User')(sequelize),
        as: 'requester',
        attributes: ['id', 'name', 'email', 'avatar']
      }],
      order: [['requestedAt', 'DESC']]
    });
  };

  Friendship.getSentRequests = function(userId) {
    return this.findAll({
      where: {
        requesterId: userId,
        status: 'pending'
      },
      include: [{
        model: require('./User')(sequelize),
        as: 'addressee',
        attributes: ['id', 'name', 'email', 'avatar']
      }],
      order: [['requestedAt', 'DESC']]
    });
  };

  Friendship.getMutualFriends = function(userId1, userId2) {
    // This would require a more complex query to find mutual friends
    // Implementation would depend on specific requirements
    return Promise.resolve([]);
  };

  Friendship.getFriendSuggestions = function(userId, limit = 10) {
    // This would implement friend suggestion algorithm
    // Based on mutual friends, similar interests, etc.
    return Promise.resolve([]);
  };

  Friendship.getClosestFriends = function(userId, limit = 5) {
    return this.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { requesterId: userId },
          { addresseeId: userId }
        ],
        status: 'accepted'
      },
      order: [
        ['closenessLevel', 'DESC'],
        ['interactionCount', 'DESC'],
        ['lastInteraction', 'DESC']
      ],
      limit,
      include: [
        {
          model: require('./User')(sequelize),
          as: 'requester',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: require('./User')(sequelize),
          as: 'addressee',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });
  };

  // Associations
  Friendship.associate = function(models) {
    Friendship.belongsTo(models.User, {
      foreignKey: 'requesterId',
      as: 'requester'
    });
    
    Friendship.belongsTo(models.User, {
      foreignKey: 'addresseeId',
      as: 'addressee'
    });
  };

  return Friendship;
};
