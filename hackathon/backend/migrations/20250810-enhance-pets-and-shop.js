'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new columns to pets table
    await queryInterface.addColumn('pets', 'animations', {
      type: Sequelize.JSONB,
      defaultValue: {
        idle: { gif: '', duration: 2000, loop: true, effects: [] },
        happy: { gif: '', duration: 1500, loop: false, effects: ['sparkles', 'hearts'] },
        sad: { gif: '', duration: 2000, loop: false, effects: ['tears', 'clouds'] },
        sleeping: { gif: '', duration: 3000, loop: true, effects: ['zzz', 'moon'] },
        eating: { gif: '', duration: 1000, loop: false, effects: ['nom', 'crumbs'] },
        walking: { gif: '', duration: 1000, loop: true, effects: ['footsteps'] },
        running: { gif: '', duration: 800, loop: true, effects: ['speed', 'wind'] },
        jumping: { gif: '', duration: 500, loop: false, effects: ['bounce', 'stars'] },
        dancing: { gif: '', duration: 2000, loop: true, effects: ['music', 'confetti'] },
        fighting: { gif: '', duration: 1200, loop: false, effects: ['fire', 'lightning'] },
        healing: { gif: '', duration: 2500, loop: false, effects: ['heal', 'light'] },
        evolving: { gif: '', duration: 5000, loop: false, effects: ['evolution', 'rainbow'] }
      }
    });

    await queryInterface.addColumn('pets', 'personality', {
      type: Sequelize.JSONB,
      defaultValue: {
        traits: [],
        likes: [],
        dislikes: [],
        favoriteActivities: [],
        moodSwings: false
      }
    });

    await queryInterface.addColumn('pets', 'evolution', {
      type: Sequelize.JSONB,
      defaultValue: {
        canEvolve: false,
        evolutionLevel: 1,
        maxEvolutionLevel: 3,
        evolutionRequirements: {},
        evolutionRewards: {}
      }
    });

    await queryInterface.addColumn('pets', 'specialEffects', {
      type: Sequelize.JSONB,
      defaultValue: {
        particleEffects: [],
        soundEffects: [],
        visualEffects: [],
        interactiveElements: []
      }
    });

    await queryInterface.addColumn('pets', 'isAnimated', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });

    await queryInterface.addColumn('pets', 'animationQuality', {
      type: Sequelize.ENUM('low', 'medium', 'high', 'ultra'),
      defaultValue: 'medium'
    });

    await queryInterface.addColumn('pets', 'hasSound', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('pets', 'isInteractive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });

    await queryInterface.addColumn('pets', 'canLearn', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('pets', 'learningProgress', {
      type: Sequelize.JSONB,
      defaultValue: {
        skills: [],
        tricks: [],
        commands: [],
        experience: 0
      }
    });

    // Update species enum to include new species
    await queryInterface.changeColumn('pets', 'species', {
      type: Sequelize.ENUM(
        'cat', 'dog', 'bird', 'fish', 'hamster', 
        'rabbit', 'dragon', 'phoenix', 'unicorn',
        'butterfly', 'dolphin', 'elephant', 'fox',
        'giraffe', 'horse', 'koala', 'lion', 'monkey',
        'owl', 'panda', 'penguin', 'shark', 'tiger',
        'wolf', 'zebra', 'alien', 'robot', 'ghost'
      )
    });

    // Update rarity enum to include mythical
    await queryInterface.changeColumn('pets', 'rarity', {
      type: Sequelize.ENUM('common', 'rare', 'epic', 'legendary', 'mythical')
    });

    // Add new columns to shop_items table
    await queryInterface.addColumn('shop_items', 'isAnimated', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('shop_items', 'animationQuality', {
      type: Sequelize.ENUM('low', 'medium', 'high', 'ultra'),
      defaultValue: 'medium'
    });

    await queryInterface.addColumn('shop_items', 'hasPreview', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('shop_items', 'previewType', {
      type: Sequelize.ENUM('image', 'gif', 'video', '3d', 'interactive'),
      defaultValue: 'image'
    });

    await queryInterface.addColumn('shop_items', 'isCollectible', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('shop_items', 'collectionSet', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('shop_items', 'collectionPosition', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('shop_items', 'isSeasonal', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('shop_items', 'season', {
      type: Sequelize.ENUM('spring', 'summer', 'autumn', 'winter', 'all'),
      defaultValue: 'all'
    });

    await queryInterface.addColumn('shop_items', 'isEvent', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('shop_items', 'eventName', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('shop_items', 'eventStartDate', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('shop_items', 'eventEndDate', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('shop_items', 'isPremium', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('shop_items', 'premiumTier', {
      type: Sequelize.ENUM('basic', 'premium', 'vip', 'ultimate'),
      defaultValue: 'basic'
    });

    await queryInterface.addColumn('shop_items', 'isBundle', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('shop_items', 'bundleItems', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    await queryInterface.addColumn('shop_items', 'bundleDiscount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('shop_items', 'isSubscription', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('shop_items', 'subscriptionDuration', {
      type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'yearly'),
      allowNull: true
    });

    await queryInterface.addColumn('shop_items', 'subscriptionPrice', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('shop_items', 'maxUses', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('shop_items', 'currentUses', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('shop_items', 'cooldown', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('shop_items', 'compatibility', {
      type: Sequelize.JSONB,
      defaultValue: {
        platforms: [],
        versions: [],
        requirements: []
      }
    });

    // Update category enum
    await queryInterface.changeColumn('shop_items', 'category', {
      type: Sequelize.ENUM(
        'theme', 'avatar', 'pet', 'decoration', 
        'background', 'sticker', 'boost', 'special',
        'animation', 'effect', 'sound', 'interactive',
        'collectible', 'seasonal', 'event', 'premium'
      )
    });

    // Update type enum
    await queryInterface.changeColumn('shop_items', 'type', {
      type: Sequelize.ENUM('consumable', 'permanent', 'limited', 'subscription', 'bundle')
    });

    // Update currency enum
    await queryInterface.changeColumn('shop_items', 'currency', {
      type: Sequelize.ENUM('coins', 'gems', 'real_money', 'points')
    });

    // Update rarity enum
    await queryInterface.changeColumn('shop_items', 'rarity', {
      type: Sequelize.ENUM('common', 'rare', 'epic', 'legendary', 'mythical', 'exclusive')
    });

    // Update metadata column with enhanced structure
    await queryInterface.changeColumn('shop_items', 'metadata', {
      type: Sequelize.JSONB,
      defaultValue: {
        animations: {
          preview: '',
          hover: '',
          click: '',
          purchase: '',
          use: ''
        },
        isInteractive: false,
        interactionType: null,
        interactionEffects: [],
        visualEffects: [],
        particleSystems: [],
        colorSchemes: [],
        hasSound: false,
        soundEffects: [],
        backgroundMusic: '',
        gameMechanics: [],
        powerUps: [],
        specialAbilities: [],
        socialFeatures: [],
        sharingOptions: [],
        collaboration: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove columns from pets table
    await queryInterface.removeColumn('pets', 'animations');
    await queryInterface.removeColumn('pets', 'personality');
    await queryInterface.removeColumn('pets', 'evolution');
    await queryInterface.removeColumn('pets', 'specialEffects');
    await queryInterface.removeColumn('pets', 'isAnimated');
    await queryInterface.removeColumn('pets', 'animationQuality');
    await queryInterface.removeColumn('pets', 'hasSound');
    await queryInterface.removeColumn('pets', 'isInteractive');
    await queryInterface.removeColumn('pets', 'canLearn');
    await queryInterface.removeColumn('pets', 'learningProgress');

    // Remove columns from shop_items table
    await queryInterface.removeColumn('shop_items', 'isAnimated');
    await queryInterface.removeColumn('shop_items', 'animationQuality');
    await queryInterface.removeColumn('shop_items', 'hasPreview');
    await queryInterface.removeColumn('shop_items', 'previewType');
    await queryInterface.removeColumn('shop_items', 'isCollectible');
    await queryInterface.removeColumn('shop_items', 'collectionSet');
    await queryInterface.removeColumn('shop_items', 'collectionPosition');
    await queryInterface.removeColumn('shop_items', 'isSeasonal');
    await queryInterface.removeColumn('shop_items', 'season');
    await queryInterface.removeColumn('shop_items', 'isEvent');
    await queryInterface.removeColumn('shop_items', 'eventName');
    await queryInterface.removeColumn('shop_items', 'eventStartDate');
    await queryInterface.removeColumn('shop_items', 'eventEndDate');
    await queryInterface.removeColumn('shop_items', 'isPremium');
    await queryInterface.removeColumn('shop_items', 'premiumTier');
    await queryInterface.removeColumn('shop_items', 'isBundle');
    await queryInterface.removeColumn('shop_items', 'bundleItems');
    await queryInterface.removeColumn('shop_items', 'bundleDiscount');
    await queryInterface.removeColumn('shop_items', 'isSubscription');
    await queryInterface.removeColumn('shop_items', 'subscriptionDuration');
    await queryInterface.removeColumn('shop_items', 'subscriptionPrice');
    await queryInterface.removeColumn('shop_items', 'maxUses');
    await queryInterface.removeColumn('shop_items', 'currentUses');
    await queryInterface.removeColumn('shop_items', 'cooldown');
    await queryInterface.removeColumn('shop_items', 'compatibility');

    // Revert enums to original values
    await queryInterface.changeColumn('pets', 'species', {
      type: Sequelize.ENUM('cat', 'dog', 'bird', 'fish', 'hamster', 'rabbit', 'dragon', 'phoenix', 'unicorn')
    });

    await queryInterface.changeColumn('pets', 'rarity', {
      type: Sequelize.ENUM('common', 'rare', 'epic', 'legendary')
    });

    await queryInterface.changeColumn('shop_items', 'category', {
      type: Sequelize.ENUM('theme', 'avatar', 'pet', 'decoration', 'background', 'sticker', 'boost', 'special')
    });

    await queryInterface.changeColumn('shop_items', 'type', {
      type: Sequelize.ENUM('consumable', 'permanent', 'limited')
    });

    await queryInterface.changeColumn('shop_items', 'currency', {
      type: Sequelize.ENUM('coins', 'gems')
    });

    await queryInterface.changeColumn('shop_items', 'rarity', {
      type: Sequelize.ENUM('common', 'rare', 'epic', 'legendary')
    });

    await queryInterface.changeColumn('shop_items', 'metadata', {
      type: Sequelize.JSONB,
      defaultValue: {}
    });
  }
}; 