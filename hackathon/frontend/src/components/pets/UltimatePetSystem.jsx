import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
// import { usePets } from '../../contexts/PetContext';
// import { useEconomy } from '../../contexts/EconomyContext';
import toast from 'react-hot-toast';
import './UltimatePetSystem.css';

const UltimatePetSystem = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  // const { 
  //   userPets, 
  //   activePet, 
  //   adoptPet, 
  //   feedPet, 
  //   playWithPet, 
  //   setActivePet,
  //   trainPet,
  //   bondWithPet,
  //   evolvePet,
  //   equipAccessory,
  //   applyTheme,
  //   buyPet,
  //   buyAccessory,
  //   petShop,
  //   petAccessories,
  //   petThemes,
  //   petFood,
  //   petToys,
  //   petTraining,
  //   petBonding,
  //   petStats,
  //   petQuests,
  //   petEvents,
  //   isPetEvolvable
  // } = usePets?.() || {};
  // const { balance, spendCoins } = useEconomy();
  const balance = { coins: 0, gems: 0 }; // Default value
  
  // Default values for pet-related variables
  const userPets = []; // Default value
  const activePet = null; // Default value
  const adoptPet = () => {}; // Default function
  const feedPet = () => {}; // Default function
  const playWithPet = () => {}; // Default function
  const setActivePet = () => {}; // Default function
  const trainPet = () => {}; // Default function
  const bondWithPet = () => {}; // Default function
  const evolvePet = () => {}; // Default function
  const equipAccessory = () => {}; // Default function
  const applyTheme = () => {}; // Default function
  const buyPet = () => {}; // Default function
  const buyAccessory = () => {}; // Default function
  const petShop = []; // Default value
  const petAccessories = []; // Default value
  const petThemes = []; // Default value
  const petFood = []; // Default value
  const petToys = []; // Default value
  const petTraining = []; // Default value
  const petBonding = []; // Default value
  const petStats = {}; // Default value
  const petQuests = []; // Default value
  const petEvents = []; // Default value
  const isPetEvolvable = () => false; // Default function
  
  const [currentView, setCurrentView] = useState('main');
  const [selectedPet, setSelectedPet] = useState(null);
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [petAnimation, setPetAnimation] = useState('idle');
  const [selectedCategory, setSelectedCategory] = useState('pets');
  const [showShopModal, setShowShopModal] = useState(false);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

  // Enhanced pet data with animations and GIFs
  const availablePets = [
    {
      id: 1,
      name: 'Buddy',
      species: 'dog',
      rarity: 'common',
      price: 0,
      description: 'A loyal companion for new users',
      gifStates: {
        idle: '/pets/dog-idle.gif',
        happy: '/pets/dog-happy.gif',
        sad: '/pets/dog-sad.gif',
        eating: '/pets/dog-eating.gif',
        playing: '/pets/dog-playing.gif',
        sleeping: '/pets/dog-sleeping.gif',
        excited: '/pets/dog-excited.gif'
      },
      abilities: ['loyalty_boost', 'study_motivation', 'companionship'],
      baseStats: { happiness: 80, energy: 70, intelligence: 60, loyalty: 90 },
      evolution: {
        stages: ['Puppy', 'Adult Dog', 'Wise Dog'],
        requirements: [0, 100, 500]
      }
    },
    {
      id: 2,
      name: 'Whiskers',
      species: 'cat',
      rarity: 'common',
      price: 50,
      description: 'A curious and intelligent feline friend',
      gifStates: {
        idle: '/pets/cat-idle.gif',
        happy: '/pets/cat-happy.gif',
        sad: '/pets/cat-sad.gif',
        eating: '/pets/cat-eating.gif',
        playing: '/pets/cat-playing.gif',
        sleeping: '/pets/cat-sleeping.gif',
        hunting: '/pets/cat-hunting.gif'
      },
      abilities: ['focus_boost', 'stress_relief', 'curiosity'],
      baseStats: { happiness: 75, energy: 80, intelligence: 85, loyalty: 70 },
      evolution: {
        stages: ['Kitten', 'Adult Cat', 'Mystic Cat'],
        requirements: [0, 150, 600]
      }
    },
    {
      id: 3,
      name: 'Sparkle',
      species: 'unicorn',
      rarity: 'epic',
      price: 500,
      description: 'A magical unicorn that brings luck and inspiration',
      gifStates: {
        idle: '/pets/unicorn-idle.gif',
        happy: '/pets/unicorn-happy.gif',
        sad: '/pets/unicorn-sad.gif',
        eating: '/pets/unicorn-eating.gif',
        playing: '/pets/unicorn-playing.gif',
        flying: '/pets/unicorn-flying.gif',
        magic: '/pets/unicorn-magic.gif'
      },
      abilities: ['luck_boost', 'creativity_boost', 'magic_powers', 'inspiration'],
      baseStats: { happiness: 95, energy: 90, intelligence: 95, loyalty: 85 },
      evolution: {
        stages: ['Baby Unicorn', 'Teen Unicorn', 'Royal Unicorn'],
        requirements: [0, 300, 1000]
      }
    },
    {
      id: 4,
      name: 'Dragon',
      species: 'dragon',
      rarity: 'legendary',
      price: 1000,
      description: 'A powerful dragon companion with fire abilities',
      gifStates: {
        idle: '/pets/dragon-idle.gif',
        happy: '/pets/dragon-happy.gif',
        sad: '/pets/dragon-sad.gif',
        eating: '/pets/dragon-eating.gif',
        playing: '/pets/dragon-playing.gif',
        flying: '/pets/dragon-flying.gif',
        fire: '/pets/dragon-fire.gif'
      },
      abilities: ['fire_powers', 'strength_boost', 'protection', 'wisdom'],
      baseStats: { happiness: 90, energy: 95, intelligence: 90, loyalty: 95 },
      evolution: {
        stages: ['Baby Dragon', 'Young Dragon', 'Adult Dragon', 'Ancient Dragon'],
        requirements: [0, 500, 1500, 3000]
      }
    }
  ];

  // Pet care functions
  const handleFeedPet = async (petId, foodId) => {
    setIsLoading(true);
    try {
      await feedPet(petId, foodId);
      setPetAnimation('eating');
      setTimeout(() => setPetAnimation('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayWithPet = async (petId, toyId) => {
    setIsLoading(true);
    try {
      await playWithPet(petId, toyId);
      setPetAnimation('playing');
      setTimeout(() => setPetAnimation('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrainPet = async (petId, trainingId) => {
    setIsLoading(true);
    try {
      await trainPet(petId, trainingId);
      setPetAnimation('training');
      setTimeout(() => setPetAnimation('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBondWithPet = async (petId, bondingId) => {
    setIsLoading(true);
    try {
      await bondWithPet(petId, bondingId);
      setPetAnimation('bonding');
      setTimeout(() => setPetAnimation('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvolvePet = async (petId) => {
    setIsLoading(true);
    try {
      await evolvePet(petId);
      setShowEvolutionModal(false);
      toast.success('Pet evolved successfully! ✨');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdoptPet = async (petId) => {
    setIsLoading(true);
    try {
      const adoptedPet = await adoptPet(petId, nickname);
      if (adoptedPet) {
        setShowAdoptionModal(false);
        setNickname('');
        toast.success(`Welcome ${adoptedPet.name}! 🎉`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyPet = async (petId) => {
    setIsLoading(true);
    try {
      const boughtPet = await buyPet(petId);
      if (boughtPet) {
        setShowShopModal(false);
        toast.success(`You bought ${boughtPet.name}! 🎉`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyAccessory = async (accessoryId) => {
    setIsLoading(true);
    try {
      const accessory = await buyAccessory(accessoryId);
      if (accessory) {
        toast.success(`Accessory purchased: ${accessory.name}! 🎁`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEquipAccessory = async (petId, accessoryId) => {
    setIsLoading(true);
    try {
      await equipAccessory(petId, accessoryId);
      toast.success('Accessory equipped! 🎀');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTheme = async (petId, themeId) => {
    setIsLoading(true);
    try {
      await applyTheme(petId, themeId);
      toast.success('Theme applied! 🎨');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuest = async (questId) => {
    setIsLoading(true);
    try {
      // This would call the API when implemented
      toast.success('Quest started! 🎯');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParticipateInEvent = async (eventId) => {
    setIsLoading(true);
    try {
      // This would call the API when implemented
      toast.success('Event joined! 🎉');
    } finally {
      setIsLoading(false);
    }
  };

  // Get pet stats locally
  const getPetStatsLocal = useCallback((petId) => {
    return petStats[petId] || {
      happiness: 50,
      energy: 50,
      hunger: 50,
      thirst: 50,
      intelligence: 50,
      loyalty: 50,
      xp: 0,
      level: 1
    };
  }, [petStats]);

  // Get pet mood locally
  const getPetMoodLocal = useCallback((pet) => {
    const stats = getPetStatsLocal(pet.id);
    const happiness = stats.happiness || 50;
    const energy = stats.energy || 50;
    const hunger = stats.hunger || 50;
    const thirst = stats.thirst || 50;
    
    const average = (happiness + energy + (100 - hunger) + (100 - thirst)) / 4;
    
    if (average >= 80) return { mood: 'excellent', emoji: '😍', color: 'text-green-500' };
    if (average >= 60) return { mood: 'good', emoji: '😊', color: 'text-blue-500' };
    if (average >= 40) return { mood: 'okay', emoji: '😐', color: 'text-yellow-500' };
    if (average >= 20) return { mood: 'poor', emoji: '😔', color: 'text-orange-500' };
    return { mood: 'terrible', emoji: '😢', color: 'text-red-500' };
  }, [getPetStatsLocal]);

  // Render pet stats bar
  const renderStatsBar = (label, value, maxValue = 100, color = 'blue') => {
    const percentage = (value / maxValue) * 100;
    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="text-gray-800 font-medium">{value}/{maxValue}</span>
            </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          ></div>
          </div>
      </div>
    );
  };

  // Render pet card
  const renderPetCard = (pet, isOwned = false) => {
    const stats = getPetStatsLocal(pet.id);
    const mood = getPetMoodLocal(pet);
    const canEvolve = isPetEvolvable(pet);

    return (
            <motion.div
        key={pet.id}
        className={`bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300 ${
          isOwned ? 'ring-2 ring-blue-500' : ''
        }`}
        whileHover={{ y: -5 }}
      >
        <div className="relative">
          <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <div className="text-6xl">{pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : pet.species === 'unicorn' ? '🦄' : '🐉'}</div>
                  </div>
          {pet.rarity !== 'common' && (
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                pet.rarity === 'epic' ? 'bg-purple-500 text-white' :
                pet.rarity === 'legendary' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {(pet.rarity || 'common').toUpperCase()}
              </span>
                    </div>
          )}
                  </div>
        
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{pet.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{pet.description}</p>
          
          {isOwned && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">{mood.emoji}</span>
                <span className={`text-sm font-medium ${mood.color}`}>
                  {mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1)} Mood
                </span>
                </div>
              
              {renderStatsBar('Happiness', stats.happiness, 100, 'pink')}
              {renderStatsBar('Energy', stats.energy, 100, 'green')}
              {renderStatsBar('Hunger', 100 - stats.hunger, 100, 'orange')}
              {renderStatsBar('Thirst', 100 - stats.thirst, 100, 'blue')}
              {renderStatsBar('XP', stats.xp, 1000, 'purple')}
              </div>
          )}
          
          <div className="flex flex-wrap gap-2 mb-3">
            {pet.abilities.map((ability, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {ability.replace('_', ' ')}
              </span>
            ))}
          </div>
            
          <div className="flex justify-between items-center">
            {isOwned ? (
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedPet(pet)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Manage
                </button>
                {canEvolve && (
                <button 
                    onClick={() => {
                      setSelectedPet(pet);
                      setShowEvolutionModal(true);
                    }}
                    className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Evolve
                </button>
                )}
        </div>
      ) : (
              <div className="flex items-center space-x-2">
                <span className="text-lg">💰</span>
                <span className="font-bold text-gray-900">{pet.price}</span>
          <button 
                  onClick={() => {
                    setSelectedPet(pet);
                    setShowAdoptionModal(true);
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {pet.price === 0 ? 'Adopt Free' : 'Buy'}
          </button>
        </div>
      )}
              </div>
            </div>
      </motion.div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-11/12 h-5/6 max-w-7xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🐾 Ultimate Pet System</h1>
              <p className="text-blue-100">Manage your virtual companions</p>
            </div>
        <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
        >
              ✕
        </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex space-x-2">
            {['main', 'shop', 'collection', 'evolution', 'themes', 'accessories', 'quests', 'events'].map((tab) => (
        <button 
                key={tab}
                onClick={() => setCurrentView(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === tab
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
            ))}
      </div>
    </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {currentView === 'main' && (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Active Pet Display */}
                {activePet && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Companion</h2>
                    <div className="flex items-center space-x-6">
                      <div className="text-8xl">{activePet.species === 'dog' ? '🐕' : activePet.species === 'cat' ? '🐱' : activePet.species === 'unicorn' ? '🦄' : '🐉'}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{activePet.name}</h3>
                        <p className="text-gray-600 mb-4">{activePet.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4">
        <button 
                            onClick={() => handleFeedPet(activePet.id, 1)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
        >
                            🍖 Feed
        </button>
        <button 
                            onClick={() => handlePlayWithPet(activePet.id, 1)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
                            🎾 Play
        </button>
        <button 
                            onClick={() => handleTrainPet(activePet.id, 1)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
        >
                            🎓 Train
        </button>
        <button 
                            onClick={() => handleBondWithPet(activePet.id, 1)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
        >
                            💕 Bond
        </button>
      </div>
              </div>
            </div>
                  </div>
                )}

                {/* Available Pets */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Pets</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availablePets.map(pet => renderPetCard(pet, false))}
                  </div>
              </div>
              
                {/* User's Pet Collection */}
                {userPets.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Pet Collection</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userPets.map(pet => {
                        // Validate pet data before rendering
                        if (!pet || !pet.name) {
                          console.warn('Invalid pet data:', pet);
                          return null;
                        }
                        return renderPetCard(pet, true);
                      })}
              </div>
                  </div>
                )}
              </motion.div>
            )}

            {currentView === 'shop' && (
              <motion.div
                key="shop"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900">Pet Shop</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availablePets.map(pet => {
                    // Validate pet data before rendering
                    if (!pet || !pet.name) {
                      console.warn('Invalid pet data:', pet);
                      return null;
                    }
                    return renderPetCard(pet, false);
                  })}
            </div>
              </motion.div>
            )}

            {currentView === 'collection' && (
              <motion.div
                key="collection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900">Your Collection</h2>
                {userPets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userPets.map(pet => {
                      // Validate pet data before rendering
                      if (!pet || !pet.name) {
                        console.warn('Invalid pet data:', pet);
                        return null;
                      }
                      return renderPetCard(pet, true);
                    })}
              </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🐾</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No pets yet</h3>
                    <p className="text-gray-600">Adopt your first pet to get started!</p>
            </div>
                )}
              </motion.div>
            )}

            {currentView === 'evolution' && (
              <motion.div
                key="evolution"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900">Pet Evolution</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userPets.map(pet => {
                    // Validate pet data before rendering
                    if (!pet || !pet.name) {
                      console.warn('Invalid pet data:', pet);
                      return null;
                    }
                    
                    const canEvolve = isPetEvolvable(pet);
                    return (
                      <div key={pet.id} className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{pet.name}</h3>
                        <div className="text-center mb-4">
                          <div className="text-6xl mb-2">{pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : pet.species === 'unicorn' ? '🦄' : '🐉'}</div>
                          <p className="text-sm text-gray-600">Current Stage: {pet.evolution?.stages?.[pet.evolution?.currentStage || 0] || 'Basic'}</p>
              </div>
              
                        {canEvolve ? (
              <button 
                            onClick={() => {
                              setSelectedPet(pet);
                              setShowEvolutionModal(true);
                            }}
                            className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                          >
                            ✨ Evolve Now
              </button>
                        ) : (
                          <div className="text-center text-gray-500">
                            <p>Max evolution reached</p>
            </div>
                        )}
    </div>
  );
                  })}
        </div>
              </motion.div>
            )}

            {currentView === 'themes' && (
              <motion.div
                key="themes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900">Pet Themes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {petThemes.map(theme => (
                    <div key={theme.id} className="bg-white rounded-xl shadow-lg p-6">
                      <div className="text-center mb-4">
                        <div className="text-6xl mb-2">{theme.icon}</div>
                        <h3 className="text-lg font-bold text-gray-900">{theme.name}</h3>
                        <p className="text-sm text-gray-600">{theme.description}</p>
              </div>
                      <button
                        onClick={() => handleApplyTheme(activePet?.id, theme.id)}
                        disabled={!activePet}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        Apply Theme
                      </button>
          </div>
        ))}
      </div>
              </motion.div>
            )}

            {currentView === 'accessories' && (
              <motion.div
                key="accessories"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900">Pet Accessories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {petAccessories.map(accessory => (
                    <div key={accessory.id} className="bg-white rounded-xl shadow-lg p-6">
                      <div className="text-center mb-4">
                        <div className="text-6xl mb-2">{accessory.icon}</div>
                        <h3 className="text-lg font-bold text-gray-900">{accessory.name}</h3>
                        <p className="text-sm text-gray-600">{accessory.description}</p>
                        <p className="text-lg font-bold text-blue-600 mt-2">💰 {accessory.price}</p>
            </div>
                      <div className="flex space-x-2">
              <button 
                          onClick={() => handleBuyAccessory(accessory.id)}
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => handleEquipAccessory(activePet?.id, accessory.id)}
                          disabled={!activePet}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          Equip
              </button>
            </div>
          </div>
        ))}
      </div>
              </motion.div>
            )}

            {currentView === 'quests' && (
              <motion.div
                key="quests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900">Pet Quests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {petQuests.map(quest => (
                    <div key={quest.id} className="bg-white rounded-xl shadow-lg p-6">
                      <div className="text-center mb-4">
                        <div className="text-6xl mb-2">{quest.icon || '🎯'}</div>
                        <h3 className="text-lg font-bold text-gray-900">{quest.name || quest.title}</h3>
                        <p className="text-sm text-gray-600">{quest.description}</p>
                        <div className="mt-2">
                          <span className="text-sm text-gray-500">
                            Reward: {quest.reward?.xp || 0} XP, {quest.reward?.coins || 0} Coins
                          </span>
            </div>
                      </div>
              <button 
                        onClick={() => handleStartQuest(quest.id)}
                        className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                        Start Quest
              </button>
          </div>
        ))}
        </div>
              </motion.div>
            )}

            {currentView === 'events' && (
        <motion.div
                key="events"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-900">Pet Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {petEvents.map(event => (
                    <div key={event.id} className="bg-white rounded-xl shadow-lg p-6">
                      <div className="text-center mb-4">
                        <div className="text-6xl mb-2">{event.icon || '🎉'}</div>
                        <h3 className="text-lg font-bold text-gray-900">{event.name || event.title}</h3>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <div className="mt-2">
                          <span className="text-sm text-gray-500">
                            Type: {event.type || 'Special'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleParticipateInEvent(event.id)}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Join Event
            </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
            </div>

        {/* Modals */}
            <AnimatePresence>
          {/* Adoption Modal */}
          {showAdoptionModal && (
                <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Adopt {selectedPet?.name}</h3>
                        <input
                          type="text"
                  placeholder="Give your pet a nickname (optional)"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                        />
                <div className="flex space-x-3">
                        <button 
                          onClick={() => setShowAdoptionModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                    Cancel
                        </button>
                        <button 
                    onClick={() => handleAdoptPet(selectedPet?.id)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Adopting...' : 'Adopt Pet'}
                        </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

          {/* Evolution Modal */}
          {showEvolutionModal && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Evolve {selectedPet?.name}</h3>
                <p className="text-gray-600 mb-4">Are you sure you want to evolve your pet? This will unlock new abilities and appearance!</p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEvolutionModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEvolvePet(selectedPet?.id)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Evolving...' : 'Evolve Pet'}
                  </button>
                </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default UltimatePetSystem; 