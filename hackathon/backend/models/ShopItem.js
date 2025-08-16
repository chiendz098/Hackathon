const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ShopItem = sequelize.define('ShopItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(
        'theme', 'avatar', 'pet', 'decoration', 
        'background', 'sticker', 'boost', 'special',
        'animation', 'effect', 'sound', 'interactive',
        'collectible', 'seasonal', 'event', 'premium'
      ),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('consumable', 'permanent', 'limited', 'subscription', 'bundle'),
      defaultValue: 'permanent'
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.ENUM('coins', 'gems', 'real_money', 'points'),
      defaultValue: 'coins'
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary', 'mythical', 'exclusive'),
      defaultValue: 'common'
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false
    },
    preview: {
      type: DataTypes.STRING, // URL or base64 for preview
      allowNull: true
    },
    // Enhanced metadata for advanced features
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        // Animation properties
        animations: {
          preview: '',
          hover: '',
          click: '',
          purchase: '',
          use: ''
        },
        // Interactive properties
        isInteractive: false,
        interactionType: null,
        interactionEffects: [],
        // Visual properties
        visualEffects: [],
        particleSystems: [],
        colorSchemes: [],
        // Audio properties
        hasSound: false,
        soundEffects: [],
        backgroundMusic: '',
        // Gameplay properties
        gameMechanics: [],
        powerUps: [],
        specialAbilities: [],
        // Social properties
        socialFeatures: [],
        sharingOptions: [],
        collaboration: false
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isLimited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    limitedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    requiredLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    // New fields for enhanced functionality
    isAnimated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    animationQuality: {
      type: DataTypes.STRING,
      defaultValue: 'medium',
      validate: {
        isIn: [['low', 'medium', 'high', 'ultra']]
      }
    },
    hasPreview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    previewType: {
      type: DataTypes.STRING,
      defaultValue: 'image',
      validate: {
        isIn: [['image', 'gif', 'video', '3d', 'interactive']]
      }
    },
    isCollectible: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    collectionSet: {
      type: DataTypes.STRING,
      allowNull: true
    },
    collectionPosition: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isSeasonal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    season: {
      type: DataTypes.STRING,
      defaultValue: 'all',
      validate: {
        isIn: [['spring', 'summer', 'autumn', 'winter', 'all']]
      }
    },
    isEvent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    eventName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    eventStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    eventEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    premiumTier: {
      type: DataTypes.STRING,
      defaultValue: 'basic',
      validate: {
        isIn: [['basic', 'premium', 'vip', 'ultimate']]
      }
    },
    // Bundle properties
    isBundle: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    bundleItems: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    bundleDiscount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Subscription properties
    isSubscription: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    subscriptionDuration: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['daily', 'weekly', 'monthly', 'yearly']]
      }
    },
    subscriptionPrice: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // Usage properties
    maxUses: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    currentUses: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    cooldown: {
      type: DataTypes.INTEGER, // in seconds
      defaultValue: 0
    },
    // Compatibility
    compatibility: {
      type: DataTypes.JSONB,
      defaultValue: {
        platforms: [],
        versions: [],
        requirements: []
      }
    }
  }, {
    tableName: 'shop_items',
    timestamps: true,
    indexes: [
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
        fields: ['isAnimated']
      },
      {
        fields: ['isCollectible']
      },
      {
        fields: ['isSeasonal']
      },
      {
        fields: ['isEvent']
      },
      {
        fields: ['isPremium']
      }
    ]
  });

  // Associations
  ShopItem.associate = (models) => {
    // ShopItem has many UserPurchases
    ShopItem.hasMany(models.UserPurchase, {
      foreignKey: 'itemId',
      as: 'purchases'
    });
  };

  return ShopItem;
};
