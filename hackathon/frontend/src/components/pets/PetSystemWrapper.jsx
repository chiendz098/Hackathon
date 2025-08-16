import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UltimatePetSystem from './UltimatePetSystem';
import { useAuth } from '../../contexts/AuthContext';
// import { usePets } from '../../contexts/PetContext';
import toast from 'react-hot-toast';
import './PetSystemWrapper.css';

const PetSystemWrapper = () => {
  const { user } = useAuth();
  // const { activePet, userPets } = usePets();
  const activePet = null; // Default value
  const userPets = []; // Default value
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [showNoPetNotification, setShowNoPetNotification] = useState(false);

  // Check if user has pets on component mount
  useEffect(() => {
    if (user && userPets.length === 0) {
      // Show notification after a delay if user has no pets
      const timer = setTimeout(() => {
        setShowNoPetNotification(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, userPets]);

  const handlePetClick = () => {
    if (userPets.length === 0) {
      setShowNoPetNotification(true);
      setTimeout(() => setShowNoPetNotification(false), 5000);
    } else {
      setIsPetModalOpen(true);
    }
  };

  const getPetEmoji = (species) => {
    const emojiMap = {
      dog: '🐕',
      cat: '🐱',
      unicorn: '🦄',
      dragon: '🐉',
      phoenix: '🦅',
      bird: '🐦',
      fish: '🐟',
      rabbit: '🐰',
      hamster: '🐹'
    };
    return emojiMap[species] || '🐾';
  };

  const getPetMood = (pet) => {
    if (!pet || !pet.currentStats) return '😊';
    
    const happiness = pet.currentStats.happiness || 50;
    const energy = pet.currentStats.energy || 50;
    
    if (happiness > 80 && energy > 70) return '😊';
    if (happiness > 60 && energy > 50) return '😌';
    if (happiness > 40 && energy > 30) return '😐';
    if (happiness > 20 && energy > 20) return '😔';
    return '😢';
  };

  return (
    <>
      {/* Floating Pet Button */}
      <motion.div
        className="floating-pet-button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.button
          className="pet-button"
          onClick={handlePetClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            y: activePet ? [0, -5, 0] : 0,
          }}
          transition={{
            repeat: activePet ? Infinity : 0,
            duration: 2,
            ease: "easeInOut"
          }}
        >
          {activePet ? (
            <div className="active-pet-display">
              <div className="pet-emoji">
                {getPetEmoji(activePet.species)}
              </div>
              <div className="pet-mood">
                {getPetMood(activePet)}
              </div>
              {activePet.currentStats?.happiness < 30 && (
                <div className="pet-warning">⚠️</div>
              )}
            </div>
          ) : (
            <div className="no-pet-display">
              <div className="pet-emoji">🐾</div>
              <div className="pet-label">My Pet</div>
            </div>
          )}
        </motion.button>

        {/* Pet Stats Tooltip */}
        {activePet && (
          <motion.div
            className="pet-stats-tooltip"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="tooltip-header">
              <span className="pet-name">{activePet.nickname}</span>
              <span className="pet-level">Lv.{activePet.level || 1}</span>
            </div>
            <div className="tooltip-stats">
              <div className="stat-item">
                <span>😊 {activePet.currentStats?.happiness || 50}</span>
              </div>
              <div className="stat-item">
                <span>⚡ {activePet.currentStats?.energy || 50}</span>
              </div>
              <div className="stat-item">
                <span>🧠 {activePet.currentStats?.intelligence || 50}</span>
              </div>
            </div>
            <div className="tooltip-actions">
              <button 
                className="tooltip-btn feed-btn"
                onClick={() => {
                  // Trigger feed action
                  toast.success('🍖 Pet được cho ăn!');
                }}
              >
                🍖
              </button>
              <button 
                className="tooltip-btn play-btn"
                onClick={() => {
                  // Trigger play action
                  toast.success('🎾 Pet rất vui!');
                }}
              >
                🎾
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* No Pet Notification */}
      <AnimatePresence>
        {showNoPetNotification && (
          <motion.div
            className="no-pet-notification"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="notification-content">
              <div className="notification-icon">🐾</div>
              <div className="notification-text">
                <h4>Bạn chưa có pet nào!</h4>
                <p>Hãy vào shop để nhận nuôi một pet cưng nhé!</p>
              </div>
              <button 
                className="notification-btn"
                onClick={() => {
                  setShowNoPetNotification(false);
                  setIsPetModalOpen(true);
                }}
              >
                🛒 Vào Shop Ngay
              </button>
              <button 
                className="notification-close"
                onClick={() => setShowNoPetNotification(false)}
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet System Modal */}
      <UltimatePetSystem 
        isOpen={isPetModalOpen}
        onClose={() => setIsPetModalOpen(false)}
      />

      {/* Pet Status Indicators */}
      {activePet && (
        <div className="pet-status-indicators">
          {activePet.currentStats?.happiness < 30 && (
            <motion.div
              className="status-indicator hunger"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              🍽️ Pet đang đói!
            </motion.div>
          )}
          {activePet.currentStats?.energy < 30 && (
            <motion.div
              className="status-indicator tired"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              😴 Pet cần nghỉ ngơi!
            </motion.div>
          )}
        </div>
      )}
    </>
  );
};

export default PetSystemWrapper; 