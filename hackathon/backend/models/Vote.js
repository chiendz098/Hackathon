const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Vote = sequelize.define('Vote', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isIn: [[-1, 1]] // -1 for downvote, 1 for upvote
      }
    }
  }, {
    tableName: 'votes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['postId', 'userId']
      }
    ]
  });

  // Associations
  Vote.associate = (models) => {
    Vote.belongsTo(models.Post, {
      foreignKey: 'postId',
      as: 'post',
    });
    Vote.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Vote;
}; 