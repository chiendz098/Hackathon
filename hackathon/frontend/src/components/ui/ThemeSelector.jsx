import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useEconomy } from '../../contexts/EconomyContext';

const ThemeSelector = ({ isOpen, onClose }) => {
  const { 
    currentTheme, 
    getAllThemePreviews, 
    changeTheme, 
    unlockTheme,
    theme 
  } = useTheme();
  const { coins, spendCoins } = useEconomy();
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [showPurchaseModal, setShowPurchaseModal] = useState(null);

  const themes = getAllThemePreviews();

  const themeUnlockCosts = {
    default: 0,
    anime: 50,
    ghibli: 75,
    neon: 100,
    minimal: 25,
    ocean: 60
  };

  const handleThemeSelect = (themeId) => {
    const themePreview = themes.find(t => t.id === themeId);
    
    if (themePreview.isUnlocked) {
      setSelectedTheme(themeId);
      changeTheme(themeId);
    } else {
      setShowPurchaseModal(themeId);
    }
  };

  const handlePurchaseTheme = async (themeId) => {
    const cost = themeUnlockCosts[themeId];
    if (coins >= cost) {
      await spendCoins(cost, `Unlocked ${themeId} theme`);
      unlockTheme(themeId);
      changeTheme(themeId);
      setSelectedTheme(themeId);
      setShowPurchaseModal(null);
    }
  };

  const getThemeDescription = (themeId) => {
    const descriptions = {
      default: 'Clean and professional design perfect for focused studying',
      anime: 'Vibrant and energetic theme inspired by Japanese animation',
      ghibli: 'Peaceful and nature-inspired theme for calm learning',
      neon: 'Futuristic cyberpunk aesthetic for night owls',
      minimal: 'Distraction-free minimalist design for pure focus',
      ocean: 'Calming ocean depths theme for deep concentration'
    };
    return descriptions[themeId] || '';
  };

  const getThemeEmoji = (themeId) => {
    const emojis = {
      default: '🎯',
      anime: '🌸',
      ghibli: '🌿',
      neon: '⚡',
      minimal: '⚪',
      ocean: '🌊'
    };
    return emojis[themeId] || '🎨';
  };

  if (!isOpen) return null;

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
          className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
            currentTheme === 'neon' ? 'bg-gray-900 border border-cyan-500/30' :
            currentTheme === 'minimal' ? 'bg-white border border-gray-200' :
            'bg-white/95 backdrop-blur-md'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200/20">
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-bold ${
                currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
              }`}>
                🎨 Theme Customization
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${
                  currentTheme === 'neon' ? 
                    'hover:bg-gray-800 text-gray-400 hover:text-white' :
                    'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                ✕
              </button>
            </div>
            <p className={`mt-2 ${
              currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Customize your learning environment with beautiful themes
            </p>
          </div>

          {/* Theme Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes.map((themePreview) => (
                <motion.div
                  key={themePreview.id}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    selectedTheme === themePreview.id
                      ? `border-[${themePreview.primaryColor}] shadow-lg`
                      : currentTheme === 'neon' 
                        ? 'border-gray-700 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-300'
                  } ${
                    !themePreview.isUnlocked ? 'opacity-75' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleThemeSelect(themePreview.id)}
                >
                  {/* Theme Preview */}
                  <div className="relative mb-4">
                    <div
                      className="h-24 rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${themePreview.primaryColor}, ${themePreview.secondaryColor})`
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl">{getThemeEmoji(themePreview.id)}</span>
                    </div>
                    
                    {/* Lock Overlay */}
                    {!themePreview.isUnlocked && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="text-2xl mb-1">🔒</div>
                          <div className="text-sm font-medium">
                            {themeUnlockCosts[themePreview.id]} coins
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Theme Info */}
                  <div>
                    <h3 className={`font-semibold text-lg mb-1 ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {themePreview.name}
                    </h3>
                    <p className={`text-sm mb-3 ${
                      currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {getThemeDescription(themePreview.id)}
                    </p>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      {themePreview.isUnlocked ? (
                        <span className="text-green-500 text-sm font-medium">
                          ✓ Unlocked
                        </span>
                      ) : (
                        <span className={`text-sm font-medium ${
                          coins >= themeUnlockCosts[themePreview.id] 
                            ? 'text-blue-500' 
                            : 'text-red-500'
                        }`}>
                          💰 {themeUnlockCosts[themePreview.id]} coins
                        </span>
                      )}
                      
                      {selectedTheme === themePreview.id && (
                        <span className="text-blue-500 text-sm font-medium">
                          ✨ Active
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className={`p-6 border-t ${
            currentTheme === 'neon' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm ${
                currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Your coins: <span className="font-semibold text-yellow-500">💰 {coins}</span>
              </div>
              <div className="text-sm text-gray-500">
                Earn coins by completing tasks and achievements!
              </div>
            </div>
          </div>
        </motion.div>

        {/* Purchase Modal */}
        <AnimatePresence>
          {showPurchaseModal && (
            <motion.div
              className="absolute inset-0 bg-black/70 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={`p-6 rounded-xl max-w-sm w-full mx-4 ${
                  currentTheme === 'neon' ? 'bg-gray-800 border border-cyan-500/30' : 'bg-white'
                }`}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">{getThemeEmoji(showPurchaseModal)}</div>
                  <h3 className={`text-xl font-bold mb-2 ${
                    currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Unlock {themes.find(t => t.id === showPurchaseModal)?.name} Theme?
                  </h3>
                  <p className={`mb-4 ${
                    currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Cost: {themeUnlockCosts[showPurchaseModal]} coins
                  </p>
                  <p className={`text-sm mb-6 ${
                    currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {getThemeDescription(showPurchaseModal)}
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPurchaseModal(null)}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                        currentTheme === 'neon' 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handlePurchaseTheme(showPurchaseModal)}
                      disabled={coins < themeUnlockCosts[showPurchaseModal]}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        coins >= themeUnlockCosts[showPurchaseModal]
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {coins >= themeUnlockCosts[showPurchaseModal] ? 'Unlock' : 'Not enough coins'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThemeSelector;
