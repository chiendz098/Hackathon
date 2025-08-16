import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useEconomy } from '../../contexts/EconomyContext';
import { useAuth } from '../../contexts/AuthContext';
import Confetti from 'react-confetti';
import { toast } from 'react-hot-toast';

const StandaloneSpinWheel = () => {
  const { theme, currentTheme } = useTheme();
  const { addCoins } = useEconomy();
  const { user } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [canSpin, setCanSpin] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Check if user has already spun today
    const lastSpin = localStorage.getItem(`lastSpin_${user?.id}`);
    const today = new Date().toDateString();
    
    if (lastSpin === today) {
      setCanSpin(false);
    }
  }, [user]);

  const prizes = [
    { id: 1, name: '50 Coins', value: 50, type: 'coins', color: '#FFD700', emoji: '💰', rarity: 'common' },
    { id: 2, name: '100 XP', value: 100, type: 'xp', color: '#3B82F6', emoji: '⭐', rarity: 'common' },
    { id: 3, name: '25 Coins', value: 25, type: 'coins', color: '#FFD700', emoji: '💰', rarity: 'common' },
    { id: 4, name: 'Theme Unlock', value: 'random_theme', type: 'theme', color: '#8B5CF6', emoji: '🎨', rarity: 'rare' },
    { id: 5, name: '75 Coins', value: 75, type: 'coins', color: '#FFD700', emoji: '💰', rarity: 'uncommon' },
    { id: 6, name: '200 XP', value: 200, type: 'xp', color: '#3B82F6', emoji: '⭐', rarity: 'uncommon' },
    { id: 7, name: '10 Coins', value: 10, type: 'coins', color: '#FFD700', emoji: '💰', rarity: 'common' },
    { id: 8, name: 'Pet Food', value: 'pet_food', type: 'item', color: '#10B981', emoji: '🍎', rarity: 'uncommon' },
    { id: 9, name: '150 Coins', value: 150, type: 'coins', color: '#FFD700', emoji: '💰', rarity: 'rare' },
    { id: 10, name: '500 XP', value: 500, type: 'xp', color: '#3B82F6', emoji: '⭐', rarity: 'rare' },
    { id: 11, name: '30 Coins', value: 30, type: 'coins', color: '#FFD700', emoji: '💰', rarity: 'common' },
    { id: 12, name: 'Lucky Charm', value: 'lucky_charm', type: 'item', color: '#F59E0B', emoji: '🍀', rarity: 'legendary' }
  ];

  const segmentAngle = 360 / prizes.length;

  const handleSpin = () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    
    // Generate random rotation (multiple full rotations + random position)
    const spins = 5 + Math.random() * 5; // 5-10 full rotations
    const finalAngle = Math.random() * 360;
    const totalRotation = rotation + (spins * 360) + finalAngle;
    
    setRotation(totalRotation);

    // Calculate which prize was selected
    const normalizedAngle = (360 - (finalAngle % 360)) % 360;
    const prizeIndex = Math.floor(normalizedAngle / segmentAngle);
    const prize = prizes[prizeIndex];

    setTimeout(() => {
      setSelectedPrize(prize);
      setIsSpinning(false);
      setCanSpin(false);
      setShowConfetti(true);
      
      // Award the prize
      awardPrize(prize);
      
      // Save last spin date
      localStorage.setItem(`lastSpin_${user?.id}`, new Date().toDateString());
      
      setTimeout(() => setShowConfetti(false), 5000);
    }, 3000);
  };

  const awardPrize = async (prize) => {
    try {
      switch (prize.type) {
        case 'coins':
          await addCoins(prize.value, `Daily spin reward: ${prize.name}`);
          toast.success(`🎉 Won ${prize.name}!`);
          break;
        case 'xp':
          // Convert XP to coins (1 XP = 2 coins)
          await addCoins(prize.value * 2, `Daily spin reward: ${prize.name} (XP converted to coins)`);
          toast.success(`🎉 Won ${prize.name} (converted to ${prize.value * 2} coins)!`);
          break;
        case 'theme':
          // Unlock a random theme
          console.log('Theme unlocked!');
          toast.success(`🎉 Unlocked a new theme!`);
          break;
        case 'item':
          // Add item to inventory
          console.log(`Item awarded: ${prize.name}`);
          toast.success(`🎉 Won ${prize.name}!`);
          break;
      }
    } catch (error) {
      console.error('Error awarding prize:', error);
      toast.error('Failed to award prize');
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-600';
      case 'uncommon': return 'text-green-600';
      case 'rare': return 'text-blue-600';
      case 'legendary': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const resetSpin = () => {
    // For testing - remove in production
    localStorage.removeItem(`lastSpin_${user?.id}`);
    setCanSpin(true);
    setSelectedPrize(null);
    toast.success('Spin reset for testing!');
  };

  return (
    <div className="relative">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      <div className="max-w-2xl mx-auto">
        {/* Spin Wheel */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Wheel */}
          <div className="relative">
            <motion.div
              className="w-80 h-80 rounded-full border-8 border-gray-300 relative overflow-hidden shadow-2xl"
              animate={{ rotate: rotation }}
              transition={{ 
                duration: isSpinning ? 3 : 0,
                ease: isSpinning ? "easeOut" : "linear"
              }}
              style={{
                background: `conic-gradient(${prizes.map((prize, index) => 
                  `${prize.color} ${index * segmentAngle}deg ${(index + 1) * segmentAngle}deg`
                ).join(', ')})`
              }}
            >
              {/* Prize segments */}
              {prizes.map((prize, index) => {
                const angle = index * segmentAngle;
                const midAngle = angle + segmentAngle / 2;
                const radian = (midAngle * Math.PI) / 180;
                const radius = 120;
                const x = Math.cos(radian) * radius;
                const y = Math.sin(radian) * radius;
                
                return (
                  <div
                    key={prize.id}
                    className="absolute text-white font-bold text-sm flex flex-col items-center justify-center"
                    style={{
                      transform: `translate(${x}px, ${y}px) rotate(${midAngle + 90}deg)`,
                      left: '50%',
                      top: '50%',
                      marginLeft: '-20px',
                      marginTop: '-20px',
                      width: '40px',
                      height: '40px'
                    }}
                  >
                    <div className="text-lg">{prize.emoji}</div>
                    <div className="text-xs text-center leading-tight">
                      {prize.name.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500" />
            </div>
          </div>
        </div>

        {/* Spin Button */}
        <div className="text-center mb-6">
          <motion.button
            onClick={handleSpin}
            disabled={!canSpin || isSpinning}
            className={`px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 ${
              !canSpin || isSpinning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : currentTheme === 'neon'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg'
            }`}
            whileHover={{ scale: canSpin && !isSpinning ? 1.05 : 1 }}
            whileTap={{ scale: canSpin && !isSpinning ? 0.95 : 1 }}
          >
            {isSpinning ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Spinning...</span>
              </div>
            ) : !canSpin ? (
              'Come back tomorrow!'
            ) : (
              '🎰 SPIN NOW!'
            )}
          </motion.button>
        </div>

        {/* Prize Result */}
        <AnimatePresence>
          {selectedPrize && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`text-center p-6 rounded-xl ${
                currentTheme === 'neon'
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="text-6xl mb-4">{selectedPrize.emoji}</div>
              <h3 className={`text-2xl font-bold mb-2 ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                Congratulations!
              </h3>
              <p className={`text-lg mb-2 ${
                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                You won: <span className="font-bold">{selectedPrize.name}</span>
              </p>
              <p className={`text-sm ${getRarityColor(selectedPrize.rarity)}`}>
                {selectedPrize.rarity.charAt(0).toUpperCase() + selectedPrize.rarity.slice(1)} Prize
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prize List */}
        <div className={`mt-6 p-4 rounded-xl ${
          currentTheme === 'neon'
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <h4 className={`font-semibold mb-3 text-center ${
            currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
          }`}>
            🏆 Possible Rewards
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {prizes.slice(0, 8).map((prize) => (
              <div
                key={prize.id}
                className={`text-center p-2 rounded-lg ${
                  currentTheme === 'neon' ? 'bg-gray-700' : 'bg-white'
                }`}
              >
                <div className="text-lg">{prize.emoji}</div>
                <div className={`text-xs font-medium ${
                  currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                }`}>
                  {prize.name}
                </div>
              </div>
            ))}
          </div>
          <p className={`text-xs text-center mt-2 ${
            currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            ...and more!
          </p>
        </div>
      </div>
    </div>
  );
};

export default StandaloneSpinWheel; 