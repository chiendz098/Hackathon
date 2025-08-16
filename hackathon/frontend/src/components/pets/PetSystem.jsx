import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { usePets } from '../../contexts/PetContext';
import { useEconomy } from '../../contexts/EconomyContext';
import AnimatedPet from './AnimatedPet';

const PetSystem = ({ isOpen, onClose }) => {
  const { theme, currentTheme } = useTheme();
  const { 
    activePet, 
    userPets,
    feedPet, 
    playWithPet, 
    getPetMood,
    getPetMoodEmoji,
    canFeedPet,
    canPlayWithPet
  } = usePets();
  const { coins, spendCoins } = useEconomy();
  
  const [selectedAction, setSelectedAction] = useState(null);
  const [showEvolutionAnimation, setShowEvolutionAnimation] = useState(false);
  const [currentPetAnimation, setCurrentPetAnimation] = useState('idle');

  // Auto-change animation based on pet mood and actions
  useEffect(() => {
    if (activePet) {
      const mood = getPetMood(activePet);
      if (mood === 'happy') {
        setCurrentPetAnimation('happy');
        setTimeout(() => setCurrentPetAnimation('idle'), 3000);
      } else if (mood === 'sad') {
        setCurrentPetAnimation('sad');
        setTimeout(() => setCurrentPetAnimation('idle'), 3000);
      }
    }
  }, [activePet, getPetMood]);

  const petActions = [
    {
      id: 'feed',
      name: 'Feed Pet',
      icon: '🍎',
      cost: 10,
      description: 'Feed your pet to increase happiness and health',
      effect: '+5 Happiness, +3 Health',
      cooldown: 30 // minutes
    },
    {
      id: 'play',
      name: 'Play Together',
      icon: '🎾',
      cost: 5,
      description: 'Play with your pet to boost mood and energy',
      effect: '+3 Happiness, +2 Energy',
      cooldown: 15
    },
    {
      id: 'train',
      name: 'Training Session',
      icon: '🏋️',
      cost: 20,
      description: 'Train your pet to increase intelligence and XP',
      effect: '+2 Intelligence, +10 XP',
      cooldown: 60
    },
    {
      id: 'groom',
      name: 'Grooming',
      icon: '🛁',
      cost: 15,
      description: 'Groom your pet to improve appearance and mood',
      effect: '+4 Happiness, +1 Beauty',
      cooldown: 45
    }
  ];

  const petEvolutions = {
    'study_cat': [
      { level: 1, name: 'Kitten Scholar', emoji: '🐱', description: 'A curious little kitten' },
      { level: 10, name: 'Book Cat', emoji: '📚🐱', description: 'Loves reading with you' },
      { level: 25, name: 'Professor Cat', emoji: '🎓🐱', description: 'Wise and scholarly' },
      { level: 50, name: 'Mystic Cat', emoji: '🔮🐱', description: 'Master of all knowledge' }
    ],
    'study_dragon': [
      { level: 1, name: 'Dragon Hatchling', emoji: '🥚', description: 'A tiny dragon egg' },
      { level: 15, name: 'Young Dragon', emoji: '🐲', description: 'Growing stronger each day' },
      { level: 30, name: 'Wise Dragon', emoji: '🐉', description: 'Ancient wisdom flows through' },
      { level: 60, name: 'Legendary Dragon', emoji: '🌟🐉', description: 'The ultimate study companion' }
    ],
    'study_owl': [
      { level: 1, name: 'Owlet', emoji: '🦉', description: 'A wise little owl' },
      { level: 12, name: 'Night Scholar', emoji: '🌙🦉', description: 'Studies through the night' },
      { level: 28, name: 'Ancient Owl', emoji: '📜🦉', description: 'Keeper of ancient knowledge' },
      { level: 45, name: 'Cosmic Owl', emoji: '🌌🦉', description: 'Sees all, knows all' }
    ]
  };

  const handlePetAction = async (action) => {
    if (coins < action.cost) {
      console.log('Not enough coins!');
      return;
    }

    try {
      await spendCoins(action.cost, `${action.name} for pet`);
      
      // Set animation based on action
      switch (action.id) {
        case 'feed':
          setCurrentPetAnimation('eating');
          if (activePet?.id) {
            await feedPet(activePet.id);
          }
          setTimeout(() => setCurrentPetAnimation('happy'), 2000);
          setTimeout(() => setCurrentPetAnimation('idle'), 5000);
          break;
        case 'play':
          setCurrentPetAnimation('playing');
          if (activePet?.id) {
            await playWithPet(activePet.id);
          }
          setTimeout(() => setCurrentPetAnimation('happy'), 2000);
          setTimeout(() => setCurrentPetAnimation('idle'), 5000);
          break;
        case 'train':
          setCurrentPetAnimation('training');
          // Training logic will be implemented later
          console.log('Training pet...');
          setTimeout(() => setCurrentPetAnimation('idle'), 3000);
          break;
        case 'groom':
          setCurrentPetAnimation('grooming');
          // Implement grooming logic
          setTimeout(() => setCurrentPetAnimation('idle'), 3000);
          break;
      }
      
      setSelectedAction(null);
    } catch (error) {
      console.error('Pet action failed:', error);
      setCurrentPetAnimation('idle');
    }
  };

  const getCurrentEvolution = () => {
    if (!activePet) return null;
    
    const evolutions = petEvolutions[activePet.pet?.species] || [];
    return evolutions
      .filter(evo => (activePet.level || 1) >= evo.level)
      .pop() || evolutions[0];
  };

  const getNextEvolution = () => {
    if (!activePet) return null;
    
    const evolutions = petEvolutions[activePet.pet?.species] || [];
    return evolutions.find(evo => (activePet.level || 1) < evo.level);
  };

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case 'ecstatic': return '😍';
      case 'happy': return '😊';
      case 'content': return '😌';
      case 'neutral': return '😐';
      case 'sad': return '😢';
      case 'angry': return '😠';
      default: return '😐';
    }
  };

  const getStatColor = (value, max) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (!isOpen || !activePet) return null;

  const currentEvolution = getCurrentEvolution();
  const nextEvolution = getNextEvolution();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
            currentTheme === 'neon' 
              ? 'bg-gray-900 border border-cyan-500/30' 
              : 'bg-white border border-gray-200'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 border-b ${
            currentTheme === 'neon' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${
                  currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                }`}>
                  🐾 Pet Care Center
                </h2>
                <p className={`mt-1 ${
                  currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Take care of your study companion
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${
                  currentTheme === 'neon' 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pet Display */}
              <div className={`p-6 rounded-xl ${
                currentTheme === 'neon'
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="text-center mb-6">
                  <AnimatedPet 
                    pet={activePet} 
                    currentAnimation={currentPetAnimation}
                    size="large"
                    className="mx-auto mb-4"
                  />
                  
                  <h3 className={`text-2xl font-bold mb-2 ${
                    currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {currentEvolution?.name || activePet.pet?.name || 'Unknown Pet'}
                  </h3>
                  
                  <p className={`text-sm mb-4 ${
                    currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {currentEvolution?.description || 'Your loyal study companion'}
                  </p>

                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <span className="text-2xl">{getPetMoodEmoji(getPetMood(activePet))}</span>
                    <span className={`font-medium ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Mood: {getPetMood(activePet)}
                    </span>
                  </div>
                </div>

                {/* Pet Stats */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Level {activePet?.level || 1}
                    </span>
                    <span className={`text-sm ${
                      currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {activePet?.xp || 0} / {(activePet?.level || 1) * 100} XP
                    </span>
                  </div>
                  
                  <div className={`w-full bg-gray-200 rounded-full h-2 ${
                    currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${((activePet?.xp || 0) / ((activePet?.level || 1) * 100)) * 100}%` 
                      }}
                    />
                  </div>

                  {/* Stat Bars */}
                  {[
                                    { name: 'Health', value: activePet?.health || 50, max: 100, icon: '❤️' },
                { name: 'Happiness', value: activePet?.happiness || 50, max: 100, icon: '😊' },
                { name: 'Energy', value: activePet?.energy || 50, max: 100, icon: '⚡' },
                { name: 'Intelligence', value: activePet?.intelligence || 50, max: 100, icon: '🧠' }
                  ].map((stat) => (
                    <div key={stat.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{stat.icon}</span>
                          <span className={`text-sm font-medium ${
                            currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {stat.name}
                          </span>
                        </div>
                        <span className={`text-sm ${
                          currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {stat.value}/{stat.max}
                        </span>
                      </div>
                      <div className={`w-full rounded-full h-2 ${
                        currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            getStatColor(stat.value, stat.max)
                          }`}
                          style={{ width: `${(stat.value / stat.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Evolution Progress */}
                {nextEvolution && (
                  <div className={`mt-6 p-4 rounded-lg ${
                    currentTheme === 'neon' 
                      ? 'bg-gray-700 border border-gray-600' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <h4 className={`font-semibold mb-2 ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                    }`}>
                      🌟 Next Evolution
                    </h4>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{nextEvolution.emoji}</span>
                      <div>
                        <div className={`font-medium ${
                          currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {nextEvolution.name}
                        </div>
                        <div className={`text-sm ${
                          currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Requires Level {nextEvolution.level}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pet Actions */}
              <div className="space-y-6">
                <h3 className={`text-xl font-bold ${
                  currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                }`}>
                  Pet Care Actions
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {petActions.map((action) => (
                    <motion.button
                      key={action.id}
                      onClick={() => handlePetAction(action)}
                      disabled={coins < action.cost}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                        coins < action.cost
                          ? 'opacity-50 cursor-not-allowed'
                          : currentTheme === 'neon'
                            ? 'bg-gray-800 border-gray-700 hover:border-gray-600 text-white'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md text-gray-900'
                      }`}
                      whileHover={{ scale: coins >= action.cost ? 1.02 : 1 }}
                      whileTap={{ scale: coins >= action.cost ? 0.98 : 1 }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{action.icon}</span>
                          <div>
                            <h4 className="font-semibold">{action.name}</h4>
                            <p className={`text-sm ${
                              currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className={`text-xs ${
                          currentTheme === 'neon' ? 'text-cyan-400' : 'text-blue-600'
                        }`}>
                          {action.effect}
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-500">💰</span>
                          <span className="text-sm font-medium">{action.cost}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Pet Status */}
                <div className={`p-4 rounded-xl ${
                  currentTheme === 'neon'
                    ? 'bg-gray-800 border border-gray-700'
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <h4 className={`font-semibold mb-3 ${
                    currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                  }`}>
                    🔔 Pet Status
                  </h4>
                  
                  <div className={`text-center py-4 ${
                    currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <span className="text-2xl mb-2 block">😊</span>
                    Your pet is happy and healthy!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PetSystem;
