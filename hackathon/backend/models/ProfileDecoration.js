const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProfileDecoration = sequelize.define('ProfileDecoration', {
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
        len: [1, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM(
        'avatar_frame', 'banner', 'badge', 'border', 'background', 
        'particle_effect', 'animation', 'sticker', 'title'
      ),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('seasonal', 'achievement', 'premium', 'event', 'special'),
      defaultValue: 'premium'
    },
    price: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // Price in coins
    },
    gemPrice: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // Price in gems
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary', 'mythic'),
      defaultValue: 'common'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    unlockRequirements: {
      type: DataTypes.JSON,
      defaultValue: {
        level: 1,
        achievements: [],
        tasks: 0,
        streak: 0
      }
    },
    decorationData: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        imageUrl: '',
        animationUrl: '',
        cssClass: '',
        position: 'overlay',
        zIndex: 1,
        opacity: 1,
        scale: 1,
        rotation: 0,
        effects: []
      }
    },
    preview: {
      type: DataTypes.STRING,
      allowNull: true // Preview image URL
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    isAnimated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    animationDuration: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // in milliseconds
    },
    isLimitedTime: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    availableUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    stackable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false // Can be used with other decorations
    },
    maxStack: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    tableName: 'profile_decorations',
    timestamps: true,
    indexes: [
      {
        fields: ['type']
      },
      {
        fields: ['category']
      },
      {
        fields: ['rarity']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['price']
      }
    ]
  });

  // Associations
  ProfileDecoration.associate = (models) => {
    // ProfileDecoration has many UserPurchases
    ProfileDecoration.hasMany(models.UserPurchase, {
      foreignKey: 'itemId',
      as: 'purchases',
      scope: {
        itemType: 'decoration'
      }
    });
  };

  return ProfileDecoration;
};
