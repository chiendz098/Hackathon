import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePets } from '../../contexts/PetContext';
import { useEconomy } from '../../contexts/EconomyContext';
import toast from 'react-hot-toast';

const InteractivePet = () => {
  const { activePet, feedPet, playWithPet, refreshPets } = usePets();
  const { balance } = useEconomy();
  const [isMoving, setIsMoving] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [direction, setDirection] = useState(1);
  const [isHungry, setIsHungry] = useState(false);
  const [isHappy, setIsHappy] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [isFeeding, setIsFeeding] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [emotion, setEmotion] = useState('happy');
  const containerRef = useRef(null);

  // Pet movement animation
  useEffect(() => {
    if (!activePet) return;

    const moveInterval = setInterval(() => {
      if (!isMoving) {
        setIsMoving(true);
        const newX = Math.random() * 80 + 10; // 10% to 90% of screen width
        const newY = Math.random() * 80 + 10; // 10% to 90% of screen height
        
        setPosition({ x: newX, y: newY });
        setDirection(Math.random() > 0.5 ? 1 : -1);
        
        // Random emotions
        const emotions = ['happy', 'curious', 'sleepy', 'excited'];
        setEmotion(emotions[Math.floor(Math.random() * emotions.length)]);
        
        setTimeout(() => setIsMoving(false), 2000);
      }
    }, 5000 + Math.random() * 10000); // Move every 5-15 seconds

    return () => clearInterval(moveInterval);
  }, [activePet, isMoving]);

  // Pet status effects
  useEffect(() => {
    if (!activePet) return;

    const statusInterval = setInterval(() => {
      const now = Date.now();
      const lastFed = activePet.lastFed ? new Date(activePet.lastFed).getTime() : 0;
      const lastPlayed = activePet.lastPlayed ? new Date(activePet.lastPlayed).getTime() : 0;
      
      // Check hunger (every 30 minutes)
      if (now - lastFed > 30 * 60 * 1000) {
        setIsHungry(true);
        setEmotion('hungry');
      } else {
        setIsHungry(false);
      }
      
      // Check happiness (every 2 hours)
      if (now - lastPlayed > 2 * 60 * 60 * 1000) {
        setIsHappy(false);
        setEmotion('sad');
      } else {
        setIsHappy(true);
      }
    }, 60000); // Check every minute

    return () => clearInterval(statusInterval);
  }, [activePet]);

  const handleFeed = async () => {
    if (!activePet) return;
    
    setIsFeeding(true);
    try {
      await feedPet(activePet.id);
      setIsHungry(false);
      setEmotion('happy');
      toast.success(`${activePet.name} is now full! 🍽️`);
      refreshPets && refreshPets();
    } catch (error) {
      toast.error('Failed to feed pet');
    } finally {
      setIsFeeding(false);
    }
  };

  const handlePlay = async () => {
    if (!activePet) return;
    
    setIsPlaying(true);
    try {
      await playWithPet(activePet.id);
      setIsHappy(true);
      setEmotion('excited');
      toast.success(`${activePet.name} is having fun! 🎾`);
      refreshPets && refreshPets();
    } catch (error) {
      toast.error('Failed to play with pet');
    } finally {
      setIsPlaying(false);
    }
  };

  const getPetEmoji = () => {
    if (!activePet) return '🐾';
    
    const baseEmoji = activePet.species === 'cat' ? '🐱' : 
                     activePet.species === 'dog' ? '🐶' : 
                     activePet.species === 'bird' ? '🐦' : 
                     activePet.species === 'dragon' ? '🐉' : 
                     activePet.species === 'phoenix' ? '🦅' : 
                     activePet.species === 'unicorn' ? '🦄' : '🐾';
    
    switch (emotion) {
      case 'hungry': return '😿';
      case 'sad': return '😢';
      case 'excited': return '🤩';
      case 'sleepy': return '😴';
      case 'curious': return '🤔';
      default: return baseEmoji;
    }
  };

  const getPetAnimation = () => {
    if (isMoving) {
      return {
        x: `${position.x}vw`,
        y: `${position.y}vh`,
        scale: [1, 1.1, 1],
        rotate: direction * 10,
        transition: {
          duration: 2,
          ease: "easeInOut"
        }
      };
    }
    
    return {
      x: `${position.x}vw`,
      y: `${position.y}vh`,
      scale: isHappy ? 1 : 0.9,
      rotate: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    };
  };

  if (!activePet) {
    return null;
  }

  return (
    <>
      {/* Interactive Pet */}
      <motion.div
        ref={containerRef}
        className="fixed z-50 pointer-events-none"
        style={{
          left: `${position.x}vw`,
          top: `${position.y}vh`,
          transform: 'translate(-50%, -50%)'
        }}
        animate={getPetAnimation()}
        onHoverStart={() => setShowActions(true)}
        onHoverEnd={() => setShowActions(false)}
        onClick={() => setShowActions(!showActions)}
      >
        {/* Pet Avatar */}
        <motion.div
          className="relative cursor-pointer pointer-events-auto"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          {/* Pet Body */}
          <motion.div
            className={`text-6xl ${isHungry ? 'animate-pulse' : ''} ${!isHappy ? 'grayscale' : ''}`}
            animate={{
              y: isMoving ? [0, -5, 0] : [0, -2, 0],
              rotate: isMoving ? [0, 5, -5, 0] : 0
            }}
            transition={{
              duration: 2,
              repeat: isMoving ? 1 : Infinity,
              ease: "easeInOut"
            }}
          >
            {getPetEmoji()}
          </motion.div>

          {/* Status Indicators */}
          <div className="absolute -top-2 -right-2 flex flex-col gap-1">
            {isHungry && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-red-500 text-white text-xs px-2 py-1 rounded-full"
              >
                🍽️
              </motion.div>
            )}
            {!isHappy && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
              >
                😢
              </motion.div>
            )}
          </div>

          {/* Pet Name */}
          <motion.div
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: showActions ? 1 : 0, y: showActions ? 0 : 10 }}
          >
            {activePet.name}
          </motion.div>
        </motion.div>

        {/* Action Menu */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 pointer-events-auto"
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
            >
              <div className="flex flex-col gap-2 min-w-[120px]">
                {/* Pet Stats */}
                <div className="text-xs text-gray-600 text-center border-b border-gray-100 pb-2">
                  <div>Level {activePet.level || 1}</div>
                  <div>XP: {activePet.xp || 0}</div>
                </div>

                {/* Feed Button */}
                <motion.button
                  onClick={handleFeed}
                  disabled={isFeeding || !isHungry}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isHungry 
                      ? 'bg-green-500 text-white hover:bg-green-600' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  whileHover={isHungry ? { scale: 1.05 } : {}}
                  whileTap={isHungry ? { scale: 0.95 } : {}}
                >
                  {isFeeding ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    '🍽️ Feed'
                  )}
                </motion.button>

                {/* Play Button */}
                <motion.button
                  onClick={handlePlay}
                  disabled={isPlaying || isHappy}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    !isHappy 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  whileHover={!isHappy ? { scale: 1.05 } : {}}
                  whileTap={!isHappy ? { scale: 0.95 } : {}}
                >
                  {isPlaying ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    '🎾 Play'
                  )}
                </motion.button>

                {/* Pet Info */}
                <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                  <div>Happiness: {isHappy ? '😊' : '😢'}</div>
                  <div>Hunger: {isHungry ? '🍽️' : '✅'}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Pet Trail Effect */}
      {isMoving && (
        <motion.div
          className="fixed z-40 pointer-events-none"
          style={{
            left: `${position.x}vw`,
            top: `${position.y}vh`,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ opacity: 0.3, scale: 0.5 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 1 }}
        >
          <div className="text-4xl opacity-50">✨</div>
        </motion.div>
      )}
    </>
  );
};

export default InteractivePet; 