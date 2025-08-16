const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserPet = sequelize.define('UserPet', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Align with DB: user_id (int)
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id'
    },
    // Align with DB: pet_id (int)
    petId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'pet_id'
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: { min: 1, max: 100 }
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 }
    },
    // Map currentStats to stats JSONB if present
    currentStats: {
      type: DataTypes.JSONB,
      field: 'stats',
      defaultValue: { happiness: 50, energy: 50 }
    },
    // Align times
    lastFed: { type: DataTypes.DATE, field: 'last_fed', defaultValue: DataTypes.NOW },
    lastPlayed: { type: DataTypes.DATE, field: 'last_played', defaultValue: DataTypes.NOW },
    isActive: { type: DataTypes.BOOLEAN, field: 'is_active', defaultValue: false },
    customization: { type: DataTypes.JSONB, defaultValue: { accessories: [], colors: {}, decorations: [] } },
    achievements: { type: DataTypes.JSONB, defaultValue: [] },
    mood: { type: DataTypes.STRING, defaultValue: 'neutral' }
  }, {
    tableName: 'user_pets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['pet_id'] },
      { fields: ['is_active'] }
    ]
  });

  // Instance methods
  UserPet.prototype.feed = function() {
    const stats = this.currentStats || {};
    stats.happiness = Math.min(100, (stats.happiness || 0) + 10);
    stats.energy = Math.min(100, (stats.energy || 0) + 15);
    this.currentStats = stats;
    this.lastFed = new Date();
  };

  UserPet.prototype.play = function() {
    const stats = this.currentStats || {};
    stats.happiness = Math.min(100, (stats.happiness || 0) + 15);
    stats.energy = Math.max(0, (stats.energy || 0) - 10);
    this.experience += 5;
    this.lastPlayed = new Date();
    this.checkLevelUp();
    this.updateMood();
  };

  UserPet.prototype.updateMood = function() {
    const stats = this.currentStats || {};
    const avg = ((stats.happiness || 0) + (stats.energy || 0)) / 2;
    if (avg >= 80) this.mood = 'happy';
    else if (avg >= 60) this.mood = 'neutral';
    else if (avg >= 40) this.mood = 'sad';
    else this.mood = 'sleepy';
  };

  UserPet.prototype.checkLevelUp = function() {
    const requiredExp = this.level * 100;
    if (this.experience >= requiredExp) {
      this.level += 1;
      this.experience -= requiredExp;
      return true;
    }
    return false;
  };

  // Associations
  UserPet.associate = (models) => {
    UserPet.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    UserPet.belongsTo(models.Pet, { foreignKey: 'pet_id', as: 'pet' });
  };

  return UserPet;
};
