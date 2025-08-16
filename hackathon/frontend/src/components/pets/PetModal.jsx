import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePets } from '../../contexts/PetContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEconomy } from '../../contexts/EconomyContext';
import toast from 'react-hot-toast';
import './PetModal.css';

const PetModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { userPets, activePet, adoptPet, feedPet, playWithPet, setActivePet } = usePets();
  const { balance } = useEconomy();
  
  const [currentTab, setCurrentTab] = useState('my-pets');
  const [selectedPet, setSelectedPet] = useState(null);
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced pet data
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
        playing: '/pets/dog-playing.gif'
      },
      abilities: ['loyalty_boost', 'study_motivation'],
      baseStats: { happiness: 80, energy: 70, intelligence: 60, loyalty: 90 }
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
        playing: '/pets/cat-playing.gif'
      },
      abilities: ['focus_boost', 'stress_relief'],
      baseStats: { happiness: 75, energy: 80, intelligence: 85, loyalty: 70 }
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
        playing: '/pets/unicorn-playing.gif'
      },
      abilities: ['luck_boost', 'creativity_boost', 'magic_powers'],
      baseStats: { happiness: 95, energy: 90, intelligence: 95, loyalty: 85 }
    }
  ];

  const shopItems = [
    {
      id: 'theme_dark',
      name: 'Dark Theme',
      type: 'theme',
      price: 100,
      description: 'Elegant dark theme for your pet',
      icon: '🌙',
      rarity: 'common'
    },
    {
      id: 'accessory_hat',
      name: 'Wizard Hat',
      type: 'accessory',
      price: 75,
      description: 'A magical hat for your pet',
      icon: '🎩',
      rarity: 'common'
    },
    {
      id: 'food_premium',
      name: 'Premium Food',
      type: 'food',
      price: 25,
      description: 'High-quality food that boosts all stats',
      icon: '🍖',
      rarity: 'common'
    }
  ];

  const handleAdoptPet = async (pet) => {
    if (!nickname.trim()) {
      toast.error('Vui lòng nhập tên cho pet của bạn');
      return;
    }

    setIsLoading(true);
    try {
      const result = await adoptPet(pet.id, nickname.trim());
      if (result.success) {
        toast.success(`🎉 Chào mừng ${nickname} vào gia đình!`);
        setShowAdoptionModal(false);
        setNickname('');
        setCurrentTab('my-pets');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi nhận nuôi pet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedPet = async (petId) => {
    try {
      const result = await feedPet(petId);
      if (result.success) {
        toast.success('🍖 Pet đã được cho ăn!');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cho pet ăn');
    }
  };

  const handlePlayWithPet = async (petId) => {
    try {
      const result = await playWithPet(petId);
      if (result.success) {
        toast.success('🎾 Pet rất vui khi chơi với bạn!');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi chơi với pet');
    }
  };

  const getPetEmoji = (species) => {
    const emojiMap = {
      dog: '🐕',
      cat: '🐱',
      unicorn: '🦄',
      dragon: '🐉',
      bird: '🐦',
      fish: '🐟',
      rabbit: '🐰',
      hamster: '🐹'
    };
    return emojiMap[species] || '🐾';
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#6B7280',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B',
      mythical: '#EF4444'
    };
    return colors[rarity] || '#6B7280';
  };

  const renderMyPetsTab = () => (
    <div className="my-pets-tab">
      {activePet ? (
        <div className="active-pet-section">
          <div className="pet-display">
            <div className="pet-avatar">
              <img 
                src={getPetEmoji(activePet.species)} 
                alt={activePet.nickname}
                className="pet-image"
              />
            </div>
            <div className="pet-info">
              <h3>{activePet.nickname}</h3>
              <p className="pet-species">{activePet.species}</p>
              <div className="pet-stats">
                <div className="stat">
                  <span>😊 {activePet.currentStats?.happiness || 50}</span>
                </div>
                <div className="stat">
                  <span>⚡ {activePet.currentStats?.energy || 50}</span>
                </div>
                <div className="stat">
                  <span>🧠 {activePet.currentStats?.intelligence || 50}</span>
                </div>
                <div className="stat">
                  <span>❤️ {activePet.currentStats?.loyalty || 50}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pet-actions">
            <button 
              className="action-btn feed-btn"
              onClick={() => handleFeedPet(activePet.id)}
            >
              🍖 Cho Ăn
            </button>
            <button 
              className="action-btn play-btn"
              onClick={() => handlePlayWithPet(activePet.id)}
            >
              🎾 Chơi Đùa
            </button>
          </div>
        </div>
      ) : (
        <div className="no-pet-section">
          <div className="no-pet-icon">🐾</div>
          <h3>Bạn chưa có pet nào!</h3>
          <p>Hãy vào shop để nhận nuôi một pet cưng nhé!</p>
          <button 
            className="shop-btn"
            onClick={() => setCurrentTab('shop')}
          >
            🛒 Vào Shop Ngay
          </button>
        </div>
      )}

      <div className="pet-collection">
        <h4>Bộ Sưu Tập Pet</h4>
        <div className="pet-grid">
          {userPets.map(pet => (
            <div 
              key={pet.id}
              className={`pet-card ${activePet?.id === pet.id ? 'active' : ''}`}
              onClick={() => setActivePet(pet)}
            >
              <div className="pet-emoji">{getPetEmoji(pet.species)}</div>
              <div className="pet-card-info">
                <h5>{pet.nickname}</h5>
                <p>Lv.{pet.level || 1}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderShopTab = () => (
    <div className="shop-tab">
      <div className="shop-header">
        <h3>🛒 Pet Shop</h3>
        <div className="user-coins">
          <span>💰 {balance}</span>
        </div>
      </div>

      <div className="shop-items">
        {availablePets.map(pet => (
          <div key={pet.id} className="shop-item">
            <div className="item-image">
              <div className="pet-emoji-large">{getPetEmoji(pet.species)}</div>
              <div 
                className="rarity-badge"
                style={{ backgroundColor: getRarityColor(pet.rarity) }}
              >
                {pet.rarity}
              </div>
            </div>
            
            <div className="item-info">
              <h4>{pet.name}</h4>
              <p>{pet.description}</p>
              
              <div className="item-stats">
                <span>😊 {pet.baseStats.happiness}</span>
                <span>⚡ {pet.baseStats.energy}</span>
                <span>🧠 {pet.baseStats.intelligence}</span>
              </div>
              
              <div className="item-price">
                <span>💰 {pet.price}</span>
              </div>
              
              <button 
                className={`adopt-btn ${balance >= pet.price ? 'can-afford' : 'cannot-afford'}`}
                onClick={() => {
                  setSelectedPet(pet);
                  setShowAdoptionModal(true);
                }}
                disabled={balance < pet.price}
              >
                {balance >= pet.price ? '🐾 Nhận Nuôi' : '💸 Không đủ coins'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="pet-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="pet-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button className="close-pet-btn" onClick={onClose}>
              ✕
            </button>

            {/* Header */}
            <div className="pet-modal-header">
              <h2>🐾 Pet Companion</h2>
            </div>

            {/* Tabs */}
            <div className="pet-tabs">
              <button 
                className={`tab-btn ${currentTab === 'my-pets' ? 'active' : ''}`}
                onClick={() => setCurrentTab('my-pets')}
              >
                🏠 My Pets
              </button>
              <button 
                className={`tab-btn ${currentTab === 'shop' ? 'active' : ''}`}
                onClick={() => setCurrentTab('shop')}
              >
                🛒 Shop
              </button>
            </div>

            {/* Content */}
            <div className="pet-modal-content">
              {currentTab === 'my-pets' && renderMyPetsTab()}
              {currentTab === 'shop' && renderShopTab()}
            </div>

            {/* Adoption Modal */}
            <AnimatePresence>
              {showAdoptionModal && selectedPet && (
                <motion.div
                  className="adoption-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAdoptionModal(false)}
                >
                  <motion.div
                    className="adoption-modal"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="adoption-header">
                      <h3>🎉 Nhận Nuôi {selectedPet.name}</h3>
                      <button 
                        className="close-adoption-btn"
                        onClick={() => setShowAdoptionModal(false)}
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="adoption-content">
                      <div className="adoption-pet-image">
                        {getPetEmoji(selectedPet.species)}
                      </div>
                      <p>{selectedPet.description}</p>
                      
                      <div className="nickname-input">
                        <label>Đặt tên cho pet:</label>
                        <input
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="Nhập tên pet..."
                          maxLength={20}
                        />
                      </div>
                      
                      <div className="adoption-actions">
                        <button 
                          className="cancel-btn"
                          onClick={() => setShowAdoptionModal(false)}
                        >
                          Hủy
                        </button>
                        <button 
                          className="adopt-confirm-btn"
                          onClick={() => handleAdoptPet(selectedPet)}
                          disabled={isLoading || !nickname.trim()}
                        >
                          {isLoading ? 'Đang nhận nuôi...' : 'Nhận Nuôi'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PetModal; 