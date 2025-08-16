import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePets } from '../../contexts/PetContext';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, Zap, Gift, X, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const GlobalPetCompanion = () => {
  const { activePet, refreshPets } = usePets() || {};
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isFeeding, setIsFeeding] = useState(false);
  const [petMood, setPetMood] = useState('happy');
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  useEffect(() => {
    if (activePet) {
      // Update pet mood based on hunger and happiness
      const hunger = activePet.hunger || 50;
      const happiness = activePet.happiness || 100;
      
      if (happiness > 80 && hunger > 30) setPetMood('happy');
      else if (happiness > 50) setPetMood('content');
      else if (hunger < 20) setPetMood('hungry');
      else setPetMood('sad');
    }
  }, [activePet]);

  const getSpeciesEmoji = (species) => {
    const emojiMap = {
      cat: '🐱', dog: '🐶', rabbit: '🐰', bird: '🐦',
      fish: '🐟', hamster: '🐹', dragon: '🐉', owl: '🦉',
      fox: '🦊', panda: '🐼'
    };
    return emojiMap[species] || '🐾';
  };

  const getMoodEmoji = (mood) => {
    const moodMap = {
      happy: '😊', content: '😌', sad: '😢', hungry: '😋', excited: '🤩'
    };
    return moodMap[mood] || '😊';
  };

  const feedPet = async () => {
    if (!activePet || isFeeding || user.coins < 10) return;

    setIsFeeding(true);
    try {
      const response = await fetch(`/api/pets/feed/${activePet.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('🍖 Pet fed successfully!');
        setPetMood('happy');
        setLastInteraction(Date.now());
        refreshPets && refreshPets();
      } else {
        toast.error(data.message || 'Failed to feed pet');
      }
    } catch (error) {
      console.error('Error feeding pet:', error);
      toast.error('Failed to feed pet');
    } finally {
      setIsFeeding(false);
    }
  };

  const playWithPet = async () => {
    if (!activePet) return;

    try {
      const response = await fetch(`/api/pets/play/${activePet.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('🎾 Played with pet!');
        setPetMood('excited');
        setLastInteraction(Date.now());
        refreshPets && refreshPets();
      }
    } catch (error) {
      console.error('Error playing with pet:', error);
    }
  };

  if (!activePet) return null;

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 mb-2 w-64"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{activePet.nickname || activePet.pet?.name}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center mb-4">
              <motion.div
                className="text-6xl mb-2"
                animate={{ 
                  rotate: petMood === 'happy' ? [0, 10, -10, 0] : 0,
                  scale: petMood === 'excited' ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  repeat: petMood === 'happy' || petMood === 'excited' ? Infinity : 0, 
                  duration: 2 
                }}
              >
                {getSpeciesEmoji(activePet.pet?.species)}
              </motion.div>
              <div className="text-2xl mb-2">{getMoodEmoji(petMood)}</div>
              <div className="text-sm text-gray-600 capitalize">{petMood}</div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  Happiness
                </span>
                <span>{activePet.happiness || 100}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(activePet.happiness || 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Hunger
                </span>
                <span>{activePet.hunger || 50}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(activePet.hunger || 50)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={feedPet}
                disabled={isFeeding || user.coins < 10}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>🍖</span>
                <span className="text-xs">Feed (10c)</span>
              </button>
              <button
                onClick={playWithPet}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Gift className="w-4 h-4" />
                <span className="text-xs">Play</span>
              </button>
            </div>

            {activePet.customization?.accessories?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Accessories:</div>
                <div className="flex flex-wrap gap-1">
                  {activePet.customization.accessories.map((accessory, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                      {accessory}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-white rounded-full shadow-lg border-2 border-gray-200 p-3 hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          y: petMood === 'happy' ? [0, -5, 0] : 0,
        }}
        transition={{ 
          repeat: petMood === 'happy' ? Infinity : 0, 
          duration: 3,
          ease: "easeInOut"
        }}
      >
        <div className="text-3xl">
          {getSpeciesEmoji(activePet.pet?.species)}
        </div>
        
        {/* Mood indicator */}
        <div className="absolute -top-1 -right-1 text-lg">
          {getMoodEmoji(petMood)}
        </div>

        {/* Notification dot for low stats */}
        {((activePet.hunger || 50) < 30 || (activePet.happiness || 100) < 50) && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}

        {/* Toggle indicator */}
        <div className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1">
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </div>
      </motion.button>
    </motion.div>
  );
};

export default GlobalPetCompanion; 