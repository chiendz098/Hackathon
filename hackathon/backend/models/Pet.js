const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Pet = sequelize.define('Pet', {
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
        len: [1, 50]
      }
    },
    species: {
      type: DataTypes.ENUM(
        'cat', 'dog', 'bird', 'fish', 'hamster', 
        'rabbit', 'dragon', 'phoenix', 'unicorn',
        'butterfly', 'dolphin', 'elephant', 'fox',
        'giraffe', 'horse', 'koala', 'lion', 'monkey',
        'owl', 'panda', 'penguin', 'shark', 'tiger',
        'wolf', 'zebra', 'alien', 'robot', 'ghost'
      ),
      allowNull: false
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary', 'mythical'),
      defaultValue: 'common'
    },
    baseStats: {
      type: DataTypes.JSONB,
      defaultValue: {
        happiness: 50,
        energy: 50,
        intelligence: 50,
        loyalty: 50,
        strength: 50,
        agility: 50,
        magic: 50,
        defense: 50
      },
      field: 'baseStats'
    },
    abilities: {
      type: DataTypes.JSONB,
      defaultValue: [] // Special abilities the pet can have
    },
    unlockRequirements: {
      type: DataTypes.JSONB,
      defaultValue: {
        level: 1,
        achievements: [],
        coins: 0,
        gems: 0,
        specialItems: []
      }
    },
    // Enhanced animation system
    animations: {
      type: DataTypes.JSONB,
      defaultValue: {
        idle: {
          gif: '',
          duration: 2000,
          loop: true,
          effects: []
        },
        happy: {
          gif: '',
          duration: 1500,
          loop: false,
          effects: ['sparkles', 'hearts']
        },
        sad: {
          gif: '',
          duration: 2000,
          loop: false,
          effects: ['tears', 'clouds']
        },
        sleeping: {
          gif: '',
          duration: 3000,
          loop: true,
          effects: ['zzz', 'moon']
        },
        eating: {
          gif: '',
          duration: 1000,
          loop: false,
          effects: ['nom', 'crumbs']
        },
        walking: {
          gif: '',
          duration: 1000,
          loop: true,
          effects: ['footsteps']
        },
        running: {
          gif: '',
          duration: 800,
          loop: true,
          effects: ['speed', 'wind']
        },
        jumping: {
          gif: '',
          duration: 500,
          loop: false,
          effects: ['bounce', 'stars']
        },
        dancing: {
          gif: '',
          duration: 2000,
          loop: true,
          effects: ['music', 'confetti']
        },
        fighting: {
          gif: '',
          duration: 1200,
          loop: false,
          effects: ['fire', 'lightning']
        },
        healing: {
          gif: '',
          duration: 2500,
          loop: false,
          effects: ['heal', 'light']
        },
        evolving: {
          gif: '',
          duration: 5000,
          loop: false,
          effects: ['evolution', 'rainbow']
        }
      }
    },
    // Enhanced sprites with multiple states
    sprites: {
      type: DataTypes.JSONB,
      defaultValue: {
        idle: '',
        happy: '',
        sad: '',
        sleeping: '',
        eating: '',
        walking: '',
        running: '',
        jumping: '',
        dancing: '',
        fighting: '',
        healing: '',
        evolving: ''
      }
    },
    // New features
    personality: {
      type: DataTypes.JSONB,
      defaultValue: {
        traits: [],
        likes: [],
        dislikes: [],
        favoriteActivities: [],
        moodSwings: false
      }
    },
    evolution: {
      type: DataTypes.JSONB,
      defaultValue: {
        canEvolve: false,
        evolutionLevel: 1,
        maxEvolutionLevel: 3,
        evolutionRequirements: {},
        evolutionRewards: {}
      }
    },
    specialEffects: {
      type: DataTypes.JSONB,
      defaultValue: {
        particleEffects: [],
        soundEffects: [],
        visualEffects: [],
        interactiveElements: []
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Basic pet flag for default pets
    isBasic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // New fields for enhanced functionality
    isAnimated: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    animationQuality: {
      type: DataTypes.STRING,
      defaultValue: 'medium',
      validate: {
        isIn: [['low', 'medium', 'high', 'ultra']]
      }
    },
    hasSound: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isInteractive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    canLearn: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    learningProgress: {
      type: DataTypes.JSONB,
      defaultValue: {
        skills: [],
        tricks: [],
        commands: [],
        experience: 0
      }
    }
  }, {
    tableName: 'pets',
    timestamps: true,
    indexes: [
      {
        fields: ['species']
      },
      {
        fields: ['rarity']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['isAnimated']
      }
    ]
  });

  // Associations
  Pet.associate = (models) => {
    // Pet has many UserPets
    Pet.hasMany(models.UserPet, {
      foreignKey: 'petId',
      as: 'userPets'
    });
  };

  return Pet;
};
