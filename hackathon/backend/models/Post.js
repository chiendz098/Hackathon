const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft',
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    likes: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'authorId', // Explicitly map to camelCase field name
      references: {
        model: 'users',
        key: 'id',
      },
    }
  }, {
    tableName: 'posts',
    timestamps: true,
  });

  // Associations
  Post.associate = (models) => {
    Post.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author',
    });
    Post.hasMany(models.Comment, {
      foreignKey: 'postId',
      as: 'comments',
    });

  };

  // Instance methods
  Post.prototype.incrementViews = async function() {
    this.views += 1;
    return await this.save();
  };

  Post.prototype.toggleLike = async function() {
    this.likes += 1;
    return await this.save();
  };

  Post.prototype.addComment = async function(commentData) {
    const { Comment } = sequelize.models;
    return await Comment.create({
      ...commentData,
      postId: this.id
    });
  };

  Post.prototype.addVote = async function(voteData) {
    const { Vote } = sequelize.models;
    
    // Check if user already voted
    const existingVote = await Vote.findOne({
      where: {
        postId: this.id,
        userId: voteData.userId
      }
    });

    if (existingVote) {
      // Update existing vote
      await existingVote.update({ value: voteData.value });
    } else {
      // Create new vote
      await Vote.create({
        ...voteData,
        postId: this.id
      });
    }

    return this;
  };

  Post.prototype.getVoteCount = async function() {
    const { Vote } = sequelize.models;
    const votes = await Vote.findAll({
      where: { postId: this.id }
    });
    
    return votes.reduce((sum, vote) => sum + vote.value, 0);
  };

  // Class methods
  Post.findPublished = function() {
    return this.findAll({
      where: { status: 'published' },
      include: [{
        model: sequelize.models.User,
        as: 'author',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['publishedAt', 'DESC']]
    });
  };

  Post.findByCategory = function(category) {
    return this.findAll({
      where: { 
        status: 'published',
        category: category
      },
      include: [{
        model: sequelize.models.User,
        as: 'author',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['publishedAt', 'DESC']]
    });
  };

  Post.findFeatured = function() {
    return this.findAll({
      where: { 
        status: 'published',
        featured: true
      },
      include: [{
        model: sequelize.models.User,
        as: 'author',
        attributes: ['id', 'name', 'avatar']
      }],
      order: [['publishedAt', 'DESC']]
    });
  };

  return Post;
}; 