const express = require('express');
const router = express.Router();
const { User, Pet, UserPet, sequelize } = require('../models');
const { auth } = require('../middleware/auth');



// Get available pets
router.get(['/', '/available'], auth, async (req, res) => {
  try {
    const pets = await Pet.findAll({ where: { isActive: true } });
    res.json({ success: true, pets });
  } catch (error) {
    console.error('Error fetching available pets:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's pets
router.get('/my-pets', auth, async (req, res) => {
  try {
    const userPets = await UserPet.findAll({
      where: { userId: req.userId },
      include: [{ model: Pet, as: 'pet' }]
    });
    res.json({ success: true, pets: userPets });
  } catch (error) {
    console.error('Error fetching user pets:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get active pet
router.get('/active', auth, async (req, res) => {
  try {
    const userPet = await UserPet.findOne({
      where: { userId: req.userId, isActive: true },
      include: [{ model: Pet, as: 'pet' }]
    });
    res.json({ success: true, activePet: userPet });
  } catch (error) {
    console.error('Error fetching active pet:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Adopt a pet
router.post('/adopt', auth, async (req, res) => {
  try {
    const { petId, nickname } = req.body;
    const pet = await Pet.findByPk(petId);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });

    const existingPet = await UserPet.findOne({ where: { userId: req.userId, petId } });
    if (existingPet) {
      return res.status(400).json({ success: false, message: 'You already own this pet' });
    }

    const userPet = await UserPet.create({
      userId: req.userId,
      petId,
      nickname: nickname || pet.name,
      isActive: false
    });

    const petCount = await UserPet.count({ where: { userId: req.userId } });
    if (petCount === 1) await userPet.update({ isActive: true });

    res.json({ success: true, userPet, pet: userPet, message: `Successfully adopted ${pet.name}!` });
  } catch (error) {
    console.error('Error adopting pet:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Set active pet
router.post('/set-active', auth, async (req, res) => {
  try {
    const { petId } = req.body;
    console.log('🔍 Setting active pet:', { userId: req.userId, petId });
    
    // Deactivate all user's pets
    await UserPet.update(
      { isActive: false },
      { where: { userId: req.userId } }
    );

    // Activate the selected pet using raw query to avoid field mapping issues
    const [userPets] = await sequelize.query(`
      SELECT * FROM user_pets 
      WHERE user_id = $1 AND pet_id = $2
    `, {
      bind: [req.userId, petId]
    });

    console.log('🔍 Found userPets:', userPets.length);

    if (userPets.length === 0) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    const userPet = userPets[0];

    // Update using raw query
    await sequelize.query(`
      UPDATE user_pets 
      SET is_active = false 
      WHERE user_id = $1
    `, {
      bind: [req.userId]
    });

    await sequelize.query(`
      UPDATE user_pets 
      SET is_active = true 
      WHERE user_id = $1 AND pet_id = $2
    `, {
      bind: [req.userId, petId]
    });

    res.json({ success: true, activePet: userPet });
  } catch (error) {
    console.error('❌ Error setting active pet:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Feed pet
router.post('/feed', auth, async (req, res) => {
  try {
    const { petId, foodId } = req.body;

    const userPet = await UserPet.findOne({
      where: { userId: req.userId, petId: petId }
    });

    if (!userPet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Update hunger and happiness in currentStats
    const currentStats = userPet.currentStats || {};
    const newHunger = Math.min(100, (currentStats.hunger || 50) + 30);
    const newHappiness = Math.min(100, (currentStats.happiness || 50) + 10);
    currentStats.hunger = newHunger;
    currentStats.happiness = newHappiness;
    
    await userPet.update({
      currentStats,
      lastFed: new Date()
    });

    res.json({ success: true, userPet });
  } catch (error) {
    console.error('Error feeding pet:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Play with pet
router.post('/play', auth, async (req, res) => {
  try {
    const { petId, toyId } = req.body;

    const userPet = await UserPet.findOne({
      where: { userId: req.userId, petId: petId }
    });

    if (!userPet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Update happiness in currentStats
    const currentStats = userPet.currentStats || {};
    const newHappiness = Math.min(100, (currentStats.happiness || 50) + 20);
    currentStats.happiness = newHappiness;
    
    await userPet.update({
      currentStats,
      lastPlayed: new Date()
    });

    res.json({ success: true, userPet });
  } catch (error) {
    console.error('Error playing with pet:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Customize pet
router.post('/customize/:userPetId', auth, async (req, res) => {
  try {
    const { userPetId } = req.params;
    const { accessories } = req.body;

    const userPet = await UserPet.findOne({
      where: { userId: req.userId, id: userPetId }
    });

    if (!userPet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    await userPet.update({
      customization: { accessories: accessories || [] }
    });

    res.json({ success: true, userPet });
  } catch (error) {
    console.error('Error customizing pet:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// AI Pet Companion - Voice Command Handler
router.post('/voice-command', auth, async (req, res) => {
  try {
    const { command, userId } = req.body;
    
    const userPet = await UserPet.findOne({
      where: { userId: req.userId, isActive: true },
      include: [{ model: Pet, as: 'pet' }]
    });

    if (!userPet) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active pet found' 
      });
    }

    // Process voice commands
    const response = await processVoiceCommand(command, req.user, userPet);
    
    res.json({ 
      success: true, 
      response,
      pet: userPet.pet.name,
      petMood: userPet.currentStats?.happiness > 70 ? 'happy' : userPet.currentStats?.happiness > 40 ? 'neutral' : 'sad'
    });
  } catch (error) {
    console.error('Error processing voice command:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pet status and todo reminders
router.get('/status', auth, async (req, res) => {
  try {
    const userPet = await UserPet.findOne({
      where: { userId: req.userId, isActive: true },
      include: [{ model: Pet, as: 'pet' }]
    });

    if (!userPet) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active pet found' 
      });
    }

    // Get user's pending todos
    const { Todo } = require('../models');
    const pendingTodos = await Todo.findAll({
      where: { 
        userId: req.userId,
        status: 'pending'
      },
      limit: 5
    });

    // Generate pet response based on status
    const petResponse = generatePetResponse(userPet, pendingTodos, req.user);

    const currentStats = userPet.currentStats || {};
    res.json({
      success: true,
      pet: {
        id: userPet.id,
        petId: userPet.petId,
        name: userPet.pet.name,
        nickname: userPet.nickname,
        happiness: currentStats.happiness,
        hunger: currentStats.hunger,
        mood: currentStats.happiness > 70 ? 'happy' : currentStats.happiness > 40 ? 'neutral' : 'sad',
        lastFed: userPet.lastFed,
        lastPlayed: userPet.lastPlayed
      },
      petResponse,
      pendingTodos: pendingTodos.length,
      reminders: pendingTodos.map(todo => ({
        id: todo.id,
        title: todo.title,
        priority: todo.priority,
        dueDate: todo.dueDate
      }))
    });
  } catch (error) {
    console.error('Error getting pet status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Pet interaction - pet responds to user actions
router.post('/interact', auth, async (req, res) => {
  try {
    const { action, message } = req.body;
    
    const userPet = await UserPet.findOne({
      where: { userId: req.userId, isActive: true },
      include: [{ model: Pet, as: 'pet' }]
    });

    if (!userPet) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active pet found' 
      });
    }

    // Process interaction and generate response
    const response = await processPetInteraction(action, message, userPet, req.user);
    
    // Update pet stats based on interaction
    if (action === 'praise') {
      const currentStats = userPet.currentStats || {};
      await userPet.update({
        currentStats: {
          ...currentStats,
          happiness: Math.min(100, (currentStats.happiness || 50) + 15)
        }
      });
    } else if (action === 'scold') {
      const currentStats = userPet.currentStats || {};
      await userPet.update({
        currentStats: {
          ...currentStats,
          happiness: Math.max(0, (currentStats.happiness || 50) - 10)
        }
      });
    }

    const currentStats = userPet.currentStats || {};
    res.json({
      success: true,
      response,
      petMood: currentStats.happiness > 70 ? 'happy' : currentStats.happiness > 40 ? 'neutral' : 'sad',
      updatedHappiness: currentStats.happiness
    });
  } catch (error) {
    console.error('Error processing pet interaction:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all user pets
router.get('/user', auth, async (req, res) => {
  try {
    const userPets = await UserPet.findAll({
      where: { userId: req.userId },
      include: [{ model: Pet, as: 'pet' }],
      order: [['created_at', 'DESC']]
    });

    const formattedPets = userPets.map(userPet => {
      const currentStats = userPet.currentStats || {};
      return {
        id: userPet.id,
        type: userPet.pet.type,
        name: userPet.pet.name,
        nickname: userPet.nickname || userPet.pet.name,
        level: userPet.level || 1,
        experience: userPet.experience || 0,
        happiness: currentStats.happiness || 100,
        energy: currentStats.energy || 100,
        health: currentStats.health || 100,
        attack: currentStats.attack || 50,
        defense: currentStats.defense || 50,
        speed: currentStats.speed || 50,
        evolutionStage: userPet.evolutionStage || 0,
        isActive: userPet.isActive || false,
        lastFed: userPet.lastFed,
        lastPlayed: userPet.lastPlayed,
        abilities: userPet.abilities || [],
        accessories: userPet.accessories || [],
        petId: userPet.petId,
        petImage: userPet.pet.image || `/pets/${userPet.pet.type}/default.png`
      };
    });

    res.json({
      success: true,
      pets: formattedPets
    });
  } catch (error) {
    console.error('Error fetching user pets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user pets' 
    });
  }
});

// Get pet shop items
router.get('/shop', auth, async (req, res) => {
  try {
    const shopItems = [
      {
        id: 1,
        name: 'Dragon Egg',
        type: 'pet',
        rarity: 'legendary',
        price: 1000,
        description: 'A rare dragon egg that can hatch into a powerful companion',
        image: '🐉',
        category: 'pets'
      },
      {
        id: 2,
        name: 'Phoenix Feather',
        type: 'pet',
        rarity: 'mythical',
        price: 2000,
        description: 'A mystical phoenix that rises from ashes',
        image: '🔥',
        category: 'pets'
      },
      {
        id: 3,
        name: 'Unicorn Foal',
        type: 'pet',
        rarity: 'epic',
        price: 800,
        description: 'A magical unicorn with healing powers',
        image: '🦄',
        category: 'pets'
      }
    ];
    
    res.json({ success: true, shopItems });
  } catch (error) {
    console.error('Error fetching pet shop:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pet accessories
router.get('/accessories', auth, async (req, res) => {
  try {
    const accessories = [
      {
        id: 1,
        name: 'Golden Crown',
        type: 'accessory',
        rarity: 'legendary',
        price: 500,
        description: 'A majestic crown that increases pet prestige',
        image: '👑',
        category: 'accessories',
        stats: { prestige: 50 }
      },
      {
        id: 2,
        name: 'Magic Collar',
        type: 'accessory',
        rarity: 'epic',
        price: 200,
        description: 'A magical collar that enhances pet abilities',
        image: '🔮',
        category: 'accessories',
        stats: { intelligence: 20 }
      }
    ];
    
    res.json({ success: true, accessories });
  } catch (error) {
    console.error('Error fetching pet accessories:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pet themes
router.get('/themes', auth, async (req, res) => {
  try {
    const themes = [
      {
        id: 1,
        name: 'Fire Theme',
        type: 'theme',
        rarity: 'epic',
        price: 300,
        description: 'A blazing fire theme for your pet',
        image: '🔥',
        category: 'themes',
        effects: ['fire_aura', 'heat_resistance']
      },
      {
        id: 2,
        name: 'Ice Theme',
        type: 'theme',
        rarity: 'epic',
        price: 300,
        description: 'A chilling ice theme for your pet',
        image: '❄️',
        category: 'themes',
        effects: ['ice_aura', 'cold_resistance']
      }
    ];
    
    res.json({ success: true, themes });
  } catch (error) {
    console.error('Error fetching pet themes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pet food
router.get('/food', auth, async (req, res) => {
  try {
    const food = [
      {
        id: 1,
        name: 'Premium Kibble',
        type: 'food',
        rarity: 'rare',
        price: 50,
        description: 'High-quality food that restores hunger and happiness',
        image: '🍖',
        category: 'food',
        effects: { hunger: 40, happiness: 20 }
      },
      {
        id: 2,
        name: 'Magic Treats',
        type: 'food',
        rarity: 'epic',
        price: 100,
        description: 'Magical treats that boost all stats',
        image: '🍪',
        category: 'food',
        effects: { hunger: 30, happiness: 30, energy: 20 }
      }
    ];
    
    res.json({ success: true, food });
  } catch (error) {
    console.error('Error fetching pet food:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pet toys
router.get('/toys', auth, async (req, res) => {
  try {
    const toys = [
      {
        id: 1,
        name: 'Interactive Ball',
        type: 'toy',
        rarity: 'common',
        price: 25,
        description: 'A fun ball that increases happiness and energy',
        image: '⚽',
        category: 'toys',
        effects: { happiness: 25, energy: 15 }
      },
      {
        id: 2,
        name: 'Puzzle Toy',
        type: 'toy',
        rarity: 'rare',
        price: 75,
        description: 'A challenging puzzle that boosts intelligence',
        image: '🧩',
        category: 'toys',
        effects: { happiness: 20, intelligence: 25 }
      }
    ];
    
    res.json({ success: true, toys });
  } catch (error) {
    console.error('Error fetching pet toys:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pet training items
router.get('/training', auth, async (req, res) => {
  try {
    const training = [
      {
        id: 1,
        name: 'Agility Course',
        type: 'training',
        rarity: 'rare',
        price: 150,
        description: 'Training course that improves speed and agility',
        image: '🏃',
        category: 'training',
        effects: { speed: 30, agility: 25 }
      },
      {
        id: 2,
        name: 'Combat Training',
        type: 'training',
        rarity: 'epic',
        price: 250,
        description: 'Advanced combat training for attack and defense',
        image: '⚔️',
        category: 'training',
        effects: { attack: 35, defense: 30 }
      }
    ];
    
    res.json({ success: true, training });
  } catch (error) {
    console.error('Error fetching pet training:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pet bonding items
router.get('/bonding', auth, async (req, res) => {
  try {
    const bonding = [
      {
        id: 1,
        name: 'Heart Charm',
        type: 'bonding',
        rarity: 'rare',
        price: 100,
        description: 'A charm that strengthens the bond with your pet',
        image: '💖',
        category: 'bonding',
        effects: { loyalty: 40, happiness: 25 }
      },
      {
        id: 2,
        name: 'Soul Crystal',
        type: 'bonding',
        rarity: 'legendary',
        price: 500,
        description: 'A mystical crystal that creates an unbreakable bond',
        image: '💎',
        category: 'bonding',
        effects: { loyalty: 100, happiness: 50, trust: 100 }
      }
    ];
    
    res.json({ success: true, bonding });
  } catch (error) {
    console.error('Error fetching pet bonding:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pet evolution data
router.get('/evolution', auth, async (req, res) => {
  try {
    const evolution = [
      {
        id: 1,
        name: 'Dragon Evolution',
        type: 'evolution',
        rarity: 'legendary',
        price: 1000,
        description: 'Evolve your pet into a powerful dragon',
        image: '🐉',
        category: 'evolution',
        requirements: { level: 50, experience: 10000, items: ['dragon_scale'] }
      },
      {
        id: 2,
        name: 'Phoenix Evolution',
        type: 'evolution',
        rarity: 'mythical',
        price: 2000,
        description: 'Transform your pet into a mythical phoenix',
        image: '🔥',
        category: 'evolution',
        requirements: { level: 75, experience: 25000, items: ['phoenix_feather'] }
      }
    ];
    
    res.json({ success: true, evolution });
  } catch (error) {
    console.error('Error fetching pet evolution:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pet stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userPet = await UserPet.findOne({
      where: { userId: req.userId, isActive: true }
    });

    if (!userPet) {
      return res.status(404).json({ success: false, message: 'No active pet found' });
    }

    const stats = userPet.currentStats || {
      happiness: 50,
      energy: 50,
      hunger: 50,
      thirst: 50,
      intelligence: 50,
      loyalty: 50,
      xp: 0,
      level: 1
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching pet stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pet achievements
router.get('/achievements', auth, async (req, res) => {
  try {
    const achievements = [
      {
        id: 1,
        name: 'First Pet',
        description: 'Adopt your first pet',
        icon: '🐾',
        unlocked: true,
        reward: { xp: 100, coins: 50 }
      },
      {
        id: 2,
        name: 'Pet Lover',
        description: 'Own 5 different pets',
        icon: '💕',
        unlocked: false,
        reward: { xp: 500, coins: 200 }
      }
    ];
    
    res.json({ success: true, achievements });
  } catch (error) {
    console.error('Error fetching pet achievements:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pet quests
router.get('/quests', auth, async (req, res) => {
  try {
    const quests = [
      {
        id: 1,
        name: 'Daily Care',
        description: 'Feed and play with your pet today',
        type: 'daily',
        reward: { xp: 50, coins: 25 },
        progress: 0,
        target: 2,
        status: 'active'
      },
      {
        id: 2,
        name: 'Training Master',
        description: 'Complete 5 training sessions',
        type: 'weekly',
        reward: { xp: 200, coins: 100 },
        progress: 2,
        target: 5,
        status: 'active'
      }
    ];
    
    res.json({ success: true, quests });
  } catch (error) {
    console.error('Error fetching pet quests:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pet events
router.get('/events', auth, async (req, res) => {
  try {
    const events = [
      {
        id: 1,
        name: 'Pet Festival',
        description: 'A special event where pets can earn bonus rewards',
        type: 'seasonal',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        rewards: { xp: 500, coins: 250, special_items: ['festival_hat'] },
        status: 'active'
      },
      {
        id: 2,
        name: 'Evolution Week',
        description: 'Increased chances for pet evolution',
        type: 'limited',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        rewards: { evolution_boost: 2.0, xp: 300 },
        status: 'active'
      }
    ];
    
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching pet events:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Train pet
router.post('/train', auth, async (req, res) => {
  try {
    const { petId, trainingId } = req.body;
    
    const userPet = await UserPet.findOne({
      where: { userId: req.userId, id: petId }
    });

    if (!userPet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Update pet stats based on training
    const currentStats = userPet.currentStats || {};
    const newStats = {
      ...currentStats,
      intelligence: Math.min(100, (currentStats.intelligence || 50) + 10),
      xp: (currentStats.xp || 0) + 25
    };

    await userPet.update({ currentStats: newStats });

    res.json({ success: true, userPet, message: 'Training completed successfully!' });
  } catch (error) {
    console.error('Error training pet:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bond with pet
router.post('/bond', auth, async (req, res) => {
  try {
    const { petId, bondingId } = req.body;
    
    const userPet = await UserPet.findOne({
      where: { userId: req.userId, id: petId }
    });

    if (!userPet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Update pet stats based on bonding
    const currentStats = userPet.currentStats || {};
    const newStats = {
      ...currentStats,
      loyalty: Math.min(100, (currentStats.loyalty || 50) + 15),
      happiness: Math.min(100, (currentStats.happiness || 50) + 20)
    };

    await userPet.update({ currentStats: newStats });

    res.json({ success: true, userPet, message: 'Bonding strengthened!' });
  } catch (error) {
    console.error('Error bonding with pet:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Evolve pet
router.post('/evolve', auth, async (req, res) => {
  try {
    const { petId } = req.body;
    
    const userPet = await UserPet.findOne({
      where: { userId: req.userId, id: petId }
    });

    if (!userPet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Check if pet can evolve
    const currentStats = userPet.currentStats || {};
    if ((currentStats.level || 1) < 50) {
      return res.status(400).json({ success: false, message: 'Pet level too low for evolution' });
    }

    // Update evolution stage
    await userPet.update({ 
      evolutionStage: (userPet.evolutionStage || 0) + 1,
      currentStats: {
        ...currentStats,
        level: 1,
        xp: 0,
        attack: Math.min(100, (currentStats.attack || 50) + 20),
        defense: Math.min(100, (currentStats.defense || 50) + 20)
      }
    });

    res.json({ success: true, userPet, message: 'Pet evolved successfully!' });
  } catch (error) {
    console.error('Error evolving pet:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Equip accessory
router.post('/equip-accessory', auth, async (req, res) => {
  try {
    const { petId, accessoryId } = req.body;
    
    const userPet = await UserPet.findOne({
      where: { userId: req.userId, id: petId }
    });

    if (!userPet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Add accessory to pet
    const accessories = userPet.accessories || [];
    if (!accessories.includes(accessoryId)) {
      accessories.push(accessoryId);
      await userPet.update({ accessories });
    }

    res.json({ success: true, userPet, message: 'Accessory equipped successfully!' });
  } catch (error) {
    console.error('Error equipping accessory:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Apply theme
router.post('/apply-theme', auth, async (req, res) => {
  try {
    const { petId, themeId } = req.body;
    
    const userPet = await UserPet.findOne({
      where: { userId: req.userId, id: petId }
    });

    if (!userPet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Apply theme to pet
    await userPet.update({ currentTheme: themeId });

    res.json({ success: true, userPet, message: 'Theme applied successfully!' });
  } catch (error) {
    console.error('Error applying theme:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Buy pet
router.post('/buy', auth, async (req, res) => {
  try {
    const { petId } = req.body;
    
    // Check if user has enough coins (this would integrate with economy system)
    // For now, just create the pet
    
    const pet = await Pet.findByPk(petId);
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    const userPet = await UserPet.create({
      userId: req.userId,
      petId,
      nickname: pet.name,
      isActive: false
    });

    res.json({ success: true, userPet, message: 'Pet purchased successfully!' });
  } catch (error) {
    console.error('Error buying pet:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Buy accessory
router.post('/buy-accessory', auth, async (req, res) => {
  try {
    const { accessoryId } = req.body;
    
    // Check if user has enough coins (this would integrate with economy system)
    // For now, just return success
    
    res.json({ success: true, message: 'Accessory purchased successfully!' });
  } catch (error) {
    console.error('Error buying accessory:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update pet stats
router.post('/update-stats', auth, async (req, res) => {
  try {
    const { petId, stats } = req.body;
    
    const userPet = await UserPet.findOne({
      where: { userId: req.userId, id: petId }
    });

    if (!userPet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Update pet stats
    const currentStats = userPet.currentStats || {};
    const newStats = { ...currentStats, ...stats };
    
    await userPet.update({ currentStats: newStats });

    res.json({ success: true, userPet, message: 'Pet stats updated successfully!' });
  } catch (error) {
    console.error('Error updating pet stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start pet quest
router.post('/start-quest', auth, async (req, res) => {
  try {
    const { questId } = req.body;
    
    res.json({ success: true, message: 'Quest started successfully!' });
  } catch (error) {
    console.error('Error starting quest:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Complete pet quest
router.post('/complete-quest', auth, async (req, res) => {
  try {
    const { questId } = req.body;
    
    res.json({ success: true, message: 'Quest completed successfully!' });
  } catch (error) {
    console.error('Error completing quest:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Participate in pet event
router.post('/participate-event', auth, async (req, res) => {
  try {
    const { eventId } = req.body;
    
    res.json({ success: true, message: 'Event participation successful!' });
  } catch (error) {
    console.error('Error participating in event:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper functions
async function processVoiceCommand(command, user, userPet) {
  const lowerCommand = command.toLowerCase();
  
  // Check for pet calling commands
  if (lowerCommand.includes('pet cưng') || lowerCommand.includes('pet ơi') || 
      lowerCommand.includes('bạn nhỏ') || lowerCommand.includes('cưng ơi')) {
    
    // Get user's todos for motivation
    const { Todo } = require('../models');
    const pendingTodos = await Todo.count({
      where: { 
        userId: user.id,
        status: ['pending']
      }
    });

    if (pendingTodos > 0) {
      return {
        type: 'motivation',
        message: `Chào bạn! Tôi thấy bạn còn ${pendingTodos} việc chưa hoàn thành. Hãy cố gắng nhé! Tôi sẽ luôn ở đây để động viên bạn! 🐾`,
        action: 'show_todos',
        todoCount: pendingTodos
      };
    } else {
      return {
        type: 'celebration',
        message: `Wow! Bạn đã hoàn thành tất cả việc rồi! Bạn thật tuyệt vời! 🎉 Tôi rất tự hào về bạn!`,
        action: 'celebrate'
      };
    }
  }

  // Check for todo-related commands
  if (lowerCommand.includes('todo') || lowerCommand.includes('việc') || lowerCommand.includes('công việc')) {
    const { Todo } = require('../models');
    const todos = await Todo.findAll({
      where: { 
        userId: user.id,
        status: ['pending']
      },
      limit: 3,
      order: [['priority', 'DESC'], ['dueDate', 'ASC']]
    });

    if (todos.length === 0) {
      return {
        type: 'info',
        message: 'Bạn không có việc nào đang chờ đâu! Tuyệt vời! 🎉',
        action: 'no_todos'
      };
    }

    const todoList = todos.map(todo => `- ${todo.title} (${todo.priority} priority)`).join('\n');
    return {
      type: 'reminder',
      message: `Đây là những việc bạn cần làm:\n${todoList}\nHãy cố gắng hoàn thành nhé! 💪`,
      action: 'show_todos',
      todos: todos
    };
  }

  // Default response
  return {
    type: 'greeting',
    message: `Chào bạn! Tôi là ${userPet.pet.name}, pet cưng của bạn! Tôi có thể giúp bạn nhắc nhở việc, động viên học tập, hoặc chỉ đơn giản là trò chuyện. Bạn cần gì không? 🐾`,
    action: 'greet'
  };
}

function generatePetResponse(userPet, pendingTodos, user) {
  const petName = userPet.pet.name;
  const currentStats = userPet.currentStats || {};
  const happiness = currentStats.happiness || 50;
  const hunger = currentStats.hunger || 50;

  if (happiness < 30) {
    return {
      message: `${petName} trông buồn quá... Hãy chơi với tôi đi! 😢`,
      mood: 'sad',
      needsAttention: true
    };
  }

  if (hunger < 30) {
    return {
      message: `${petName} đang đói... Bạn có thể cho tôi ăn không? 🍽️`,
      mood: 'hungry',
      needsAttention: true
    };
  }

  if (pendingTodos.length > 5) {
    return {
      message: `${petName} thấy bạn có nhiều việc chưa làm. Hãy tập trung và hoàn thành từng việc một nhé! Tôi tin bạn làm được! 💪`,
      mood: 'encouraging',
      needsAttention: false
    };
  }

  if (pendingTodos.length === 0) {
    return {
      message: `${petName} rất vui vì bạn đã hoàn thành tất cả việc! Bạn thật tuyệt vời! 🎉`,
      mood: 'proud',
      needsAttention: false
    };
  }

  return {
    message: `${petName} đang vui vẻ! Bạn có ${pendingTodos.length} việc cần làm. Hãy cố gắng nhé! 🐾`,
    mood: 'happy',
    needsAttention: false
  };
}

async function processPetInteraction(action, message, userPet, user) {
  const petName = userPet.pet.name;
  
  switch (action) {
    case 'praise':
      return {
        message: `${petName} rất vui khi được khen! Cảm ơn bạn! 🥰`,
        emotion: 'happy',
        animation: 'jump'
      };
    
    case 'scold':
      return {
        message: `${petName} buồn vì bị mắng... Tôi sẽ cố gắng hơn! 😢`,
        emotion: 'sad',
        animation: 'cry'
      };
    
    case 'study_reminder':
      const { Todo } = require('../models');
      const studyTodos = await Todo.count({
        where: { 
          userId: user.id,
          status: ['pending'],
          category: 'study'
        }
      });
      
      return {
        message: studyTodos > 0 
          ? `${petName} nhắc bạn: Bạn còn ${studyTodos} bài học chưa hoàn thành! Hãy học tập chăm chỉ nhé! 📚`
          : `${petName} rất vui vì bạn đã hoàn thành tất cả bài học! 🎓`,
        emotion: studyTodos > 0 ? 'encouraging' : 'proud',
        animation: studyTodos > 0 ? 'point' : 'dance'
      };
    
    case 'custom_message':
      return {
        message: `${petName} đáp lại: "${message}" - Tôi luôn ở đây để động viên bạn! 💕`,
        emotion: 'caring',
        animation: 'wave'
      };
    
    default:
      return {
        message: `${petName} không hiểu lắm... Nhưng tôi vẫn yêu bạn! 🐾`,
        emotion: 'confused',
        animation: 'tilt'
      };
  }
}

module.exports = router; 