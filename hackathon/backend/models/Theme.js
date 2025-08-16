const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Theme = sequelize.define('Theme', {
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
    category: {
      type: DataTypes.ENUM('color', 'seasonal', 'premium', 'animated', 'special'),
      defaultValue: 'color'
    },
    price: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // Price in coins
    },
    gemPrice: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // Price in gems (premium currency)
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
      defaultValue: 'common'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    unlockRequirements: {
      type: DataTypes.JSON,
      defaultValue: {
        level: 1,
        achievements: [],
        tasks: 0
      }
    },
    themeData: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        accentColor: '#F59E0B',
        backgroundColor: '#F8FAFC',
        textColor: '#1F2937',
        borderRadius: '8px',
        fontFamily: 'Inter',
        animations: false,
        customCSS: ''
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
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    isLimitedTime: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    availableUntil: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'themes',
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
        fields: ['price']
      }
    ]
  });

  // Associations
  Theme.associate = (models) => {
    // Theme belongs to User (creator)
    Theme.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    // Theme has many UserPurchases
    Theme.hasMany(models.UserPurchase, {
      foreignKey: 'itemId',
      as: 'purchases',
      scope: {
        itemType: 'theme'
      }
    });
  };

  return Theme;
};
