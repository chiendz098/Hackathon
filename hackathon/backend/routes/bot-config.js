const express = require('express');
const router = express.Router();
const { BotConfiguration } = require('../models');

// Get all active bot configurations
router.get('/', async (req, res) => {
  try {
    const botConfigs = await BotConfiguration.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['created_at', 'ASC']]
    });

    res.json(botConfigs);
  } catch (error) {
    console.error('Error fetching bot configurations:', error);
    res.status(500).json({ error: 'Failed to fetch bot configurations' });
  }
});

// Get a specific bot configuration
router.get('/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const botConfig = await BotConfiguration.findOne({
      where: { botId, isActive: true }
    });

    if (!botConfig) {
      return res.status(404).json({ error: 'Bot configuration not found' });
    }

    res.json(botConfig);
  } catch (error) {
    console.error('Error fetching bot configuration:', error);
    res.status(500).json({ error: 'Failed to fetch bot configuration' });
  }
});

// Create a new bot configuration (admin only)
router.post('/', async (req, res) => {
  try {
    const { botId, name, description, icon, color, features, order } = req.body;

    const existingBot = await BotConfiguration.findOne({ where: { botId } });
    if (existingBot) {
      return res.status(400).json({ error: 'Bot configuration with this ID already exists' });
    }

    const botConfig = await BotConfiguration.create({
      botId,
      name,
      description,
      icon,
      color,
      features: features || [],
      order: order || 0
    });

    res.status(201).json(botConfig);
  } catch (error) {
    console.error('Error creating bot configuration:', error);
    res.status(500).json({ error: 'Failed to create bot configuration' });
  }
});

// Update a bot configuration (admin only)
router.put('/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { name, description, icon, color, features, isActive, order } = req.body;

    const botConfig = await BotConfiguration.findOne({ where: { botId } });
    if (!botConfig) {
      return res.status(404).json({ error: 'Bot configuration not found' });
    }

    await botConfig.update({
      name: name || botConfig.name,
      description: description || botConfig.description,
      icon: icon || botConfig.icon,
      color: color || botConfig.color,
      features: features !== undefined ? features : botConfig.features,
      isActive: isActive !== undefined ? isActive : botConfig.isActive,
      order: order !== undefined ? order : botConfig.order
    });

    res.json(botConfig);
  } catch (error) {
    console.error('Error updating bot configuration:', error);
    res.status(500).json({ error: 'Failed to update bot configuration' });
  }
});

// Delete a bot configuration (admin only)
router.delete('/:botId', async (req, res) => {
  try {
    const { botId } = req.params;

    const botConfig = await BotConfiguration.findOne({ where: { botId } });
    if (!botConfig) {
      return res.status(404).json({ error: 'Bot configuration not found' });
    }

    await botConfig.destroy();
    res.json({ message: 'Bot configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting bot configuration:', error);
    res.status(500).json({ error: 'Failed to delete bot configuration' });
  }
});

module.exports = router;
