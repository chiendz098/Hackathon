import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useApi from '../../hooks/useApi';
import './EnhancedPetSystem.css';

const EnhancedPetSystem = () => {
  const { user } = useAuth();
  const { apiCall } = useApi();
  const [pets, setPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  const [petCollection, setPetCollection] = useState([]);
  const [showCollection, setShowCollection] = useState(false);
  const [petMood, setPetMood] = useState('happy');
  const [isAnimating, setIsAnimating] = useState(false);
  const [petResponse, setPetResponse] = useState(null);
  const [showPetShop, setShowPetShop] = useState(false);
  const [availablePets, setAvailablePets] = useState([]);
  const [userCoins, setUserCoins] = useState(0);
  const [evolutionProgress, setEvolutionProgress] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);

  const animationRef = useRef(null);
  const petContainerRef = useRef(null);

  // Pet types with their characteristics
  const petTypes = {
    cat: {
      name: 'Mèo Con',
      baseStats: { happiness: 80, energy: 90, intelligence: 85 },
      evolution: ['Mèo Con', 'Mèo Teen', 'Mèo Trưởng Thành', 'Mèo Thông Minh'],
      gifStates: {
        idle: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        happy: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        sad: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        eating: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        playing: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        sleeping: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
      },
      price: 100,
      rarity: 'common'
    },
    dog: {
      name: 'Cún Con',
      baseStats: { happiness: 90, energy: 95, intelligence: 80 },
      evolution: ['Cún Con', 'Cún Teen', 'Cún Trưởng Thành', 'Cún Thông Minh'],
      gifStates: {
        idle: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8W9ep/giphy.gif',
        happy: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8W9ep/giphy.gif',
        sad: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8W9ep/giphy.gif',
        eating: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8W9ep/giphy.gif',
        playing: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8W9ep/giphy.gif',
        sleeping: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8W9ep/giphy.gif'
      },
      price: 150,
      rarity: 'common'
    },
    rabbit: {
      name: 'Thỏ Con',
      baseStats: { happiness: 85, energy: 88, intelligence: 82 },
      evolution: ['Thỏ Con', 'Thỏ Teen', 'Thỏ Trưởng Thành', 'Thỏ Thông Minh'],
      gifStates: {
        idle: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        happy: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        sad: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        eating: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        playing: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        sleeping: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
      },
      price: 120,
      rarity: 'uncommon'
    },
    dragon: {
      name: 'Rồng Con',
      baseStats: { happiness: 95, energy: 100, intelligence: 98 },
      evolution: ['Rồng Con', 'Rồng Teen', 'Rồng Trưởng Thành', 'Rồng Huyền Thoại'],
      gifStates: {
        idle: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        happy: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        sad: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        eating: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        playing: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        sleeping: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
      },
      price: 500,
      rarity: 'legendary'
    }
  };

  useEffect(() => {
    if (user && user.id && !hasLoaded) {
      loadUserPets();
      loadUserCoins();
      initializeAvailablePets();
      setHasLoaded(true);
    }
  }, [user, hasLoaded]);

  const loadUserPets = useCallback(async () => {
    if (hasLoaded && pets.length > 0) return; // Đã có pets rồi
    
    try {
              const response = await apiCall('/pets/my-pets', 'GET');
      if (response.success) {
        setPets(response.pets);
        if (response.pets.length > 0) {
          setActivePet(response.pets[0]);
          setPetMood(response.pets[0].mood || 'happy');
        }
      }
    } catch (error) {
      console.error('Error loading user pets:', error);
      setPets([]);
    }
  }, [apiCall, hasLoaded, pets.length]);

  const loadUserCoins = useCallback(async () => {
    if (hasLoaded && userCoins > 0) return; // Đã có coins rồi
    
    try {
      const response = await apiCall('/users/coins', 'GET');
      if (response.success) {
        setUserCoins(response.coins);
      }
    } catch (error) {
      console.error('Error loading user coins:', error);
      setUserCoins(0);
    }
  }, [apiCall, hasLoaded, userCoins]);

  const initializeAvailablePets = useCallback(() => {
    if (availablePets.length > 0) return; // Đã có pets rồi
    
    setAvailablePets(Object.entries(petTypes).map(([key, pet]) => ({
      id: key,
      ...pet
    })));
  }, [availablePets.length]);

  const adoptPet = useCallback(async (petType) => {
    if (userCoins < petTypes[petType].price) {
      alert('Không đủ coins để nhận nuôi pet này!');
      return;
    }

    try {
      const response = await apiCall('/pets/adopt', 'POST', {
        petType,
        userId: user.id
      });

      if (response.success) {
        setUserCoins(userCoins - petTypes[petType].price);
        setPets(prev => [...prev, response.pet]);
        setActivePet(response.pet);
        setPetMood('happy');
        setShowPetShop(false);
        
        // Trigger celebration animation
        triggerAnimation('celebration');
        setPetResponse({
          message: `Chào mừng ${petTypes[petType].name} mới! 🎉`,
          type: 'celebration'
        });
      }
    } catch (error) {
      console.error('Error adopting pet:', error);
      // Fallback: tạo pet locally nếu API fail
      const newPet = {
        id: Date.now(),
        name: petTypes[petType].name,
        type: petType,
        level: 1,
        happiness: petTypes[petType].baseStats.happiness,
        energy: petTypes[petType].baseStats.energy,
        intelligence: petTypes[petType].baseStats.intelligence,
        mood: 'happy',
        evolutionProgress: 0
      };
      
      setUserCoins(userCoins - petTypes[petType].price);
      setPets(prev => [...prev, newPet]);
      setActivePet(newPet);
      setPetMood('happy');
      setShowPetShop(false);
      
      triggerAnimation('celebration');
      setPetResponse({
        message: `Chào mừng ${petTypes[petType].name} mới! 🎉`,
        type: 'celebration'
      });
    }
  }, [userCoins, petTypes, user, apiCall]);

  const interactWithPet = useCallback(async (action) => {
    if (!activePet) return;

    try {
      const response = await apiCall('/pets/interact', 'POST', {
        petId: activePet.id,
        action
      });

      if (response.success) {
        setActivePet(response.pet);
        setPetMood(response.pet.mood);
        setPetResponse(response.response);
        setIsAnimating(true);
        
        // Trigger appropriate animation
        triggerAnimation(action);
        
        // Update evolution progress
        if (response.evolutionProgress) {
          setEvolutionProgress(response.evolutionProgress);
        }
        
        setTimeout(() => {
          setPetResponse(null);
          setIsAnimating(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error interacting with pet:', error);
      // Fallback: xử lý locally nếu API fail
      const updatedPet = { ...activePet };
      
      switch (action) {
        case 'feed':
          updatedPet.happiness = Math.min(100, updatedPet.happiness + 10);
          updatedPet.energy = Math.min(100, updatedPet.energy + 15);
          updatedPet.mood = 'happy';
          break;
        case 'play':
          updatedPet.happiness = Math.min(100, updatedPet.happiness + 15);
          updatedPet.energy = Math.max(0, updatedPet.energy - 10);
          updatedPet.mood = 'excited';
          break;
        case 'praise':
          updatedPet.happiness = Math.min(100, updatedPet.happiness + 20);
          updatedPet.intelligence = Math.min(100, updatedPet.intelligence + 5);
          updatedPet.mood = 'loved';
          break;
        case 'study':
          updatedPet.intelligence = Math.min(100, updatedPet.intelligence + 10);
          updatedPet.energy = Math.max(0, updatedPet.energy - 5);
          updatedPet.mood = 'focused';
          break;
        default:
          break;
      }
      
      setActivePet(updatedPet);
      setPetMood(updatedPet.mood);
      setPetResponse({
        message: `Pet ${action} thành công! 🎉`,
        type: 'success'
      });
      setIsAnimating(true);
      
      triggerAnimation(action);
      
      setTimeout(() => {
        setPetResponse(null);
        setIsAnimating(false);
      }, 3000);
    }
  }, [activePet, apiCall]);

  const triggerAnimation = useCallback((animationType) => {
    if (animationRef.current) {
      animationRef.current.play();
    }
  }, []);

  const switchPet = useCallback((pet) => {
    setActivePet(pet);
    setPetMood(pet.mood || 'happy');
  }, []);

  const getPetGif = useCallback((pet, state = 'idle') => {
    const petType = petTypes[pet.type];
    return petType?.gifStates[state] || petType?.gifStates.idle || '';
  }, [petTypes]);

  const getEvolutionStage = useCallback((pet) => {
    const level = pet.level || 1;
    if (level >= 30) return 'legendary';
    if (level >= 20) return 'adult';
    if (level >= 10) return 'teen';
    return 'baby';
  }, []);

  if (!user) return null;

  return (
    <div className="enhanced-pet-system">
      {/* Main Pet Display */}
      {activePet && (
        <div className="main-pet-container" ref={petContainerRef}>
          <div className="pet-display">
            <div className="pet-gif-container">
              <img
                ref={animationRef}
                src={getPetGif(activePet, petMood)}
                alt={activePet.name}
                className="pet-gif"
              />
              
              {/* Pet Level Badge */}
              <div className="pet-level-badge">
                Lv.{activePet.level || 1}
              </div>
              
              {/* Evolution Progress */}
              <div className="evolution-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${evolutionProgress}%` }}
                  />
                </div>
                <span className="progress-text">{evolutionProgress}%</span>
              </div>
            </div>

            {/* Pet Info */}
            <div className="pet-info">
              <h3 className="pet-name">{activePet.name}</h3>
              <p className="pet-type">{petTypes[activePet.type]?.name}</p>
              <p className="evolution-stage">{getEvolutionStage(activePet)}</p>
            </div>

            {/* Pet Stats */}
            <div className="pet-stats">
              <div className="stat-item">
                <span className="stat-icon">😊</span>
                <div className="stat-bar">
                  <div 
                    className="stat-fill happiness"
                    style={{ width: `${activePet.happiness || 80}%` }}
                  />
                </div>
                <span className="stat-value">{activePet.happiness || 80}%</span>
              </div>
              
              <div className="stat-item">
                <span className="stat-icon">⚡</span>
                <div className="stat-bar">
                  <div 
                    className="stat-fill energy"
                    style={{ width: `${activePet.energy || 90}%` }}
                  />
                </div>
                <span className="stat-value">{activePet.energy || 90}%</span>
              </div>
              
              <div className="stat-item">
                <span className="stat-icon">🧠</span>
                <div className="stat-bar">
                  <div 
                    className="stat-fill intelligence"
                    style={{ width: `${activePet.intelligence || 85}%` }}
                  />
                </div>
                <span className="stat-value">{activePet.intelligence || 85}%</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button 
                className="action-btn feed"
                onClick={() => interactWithPet('feed')}
                title="Cho pet ăn"
              >
                🍽️ Cho ăn
              </button>
              
              <button 
                className="action-btn play"
                onClick={() => interactWithPet('play')}
                title="Chơi với pet"
              >
                🎾 Chơi
              </button>
              
              <button 
                className="action-btn train"
                onClick={() => interactWithPet('train')}
                title="Huấn luyện pet"
              >
                🎯 Huấn luyện
              </button>
              
              <button 
                className="action-btn sleep"
                onClick={() => interactWithPet('sleep')}
                title="Cho pet ngủ"
              >
                😴 Ngủ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pet Collection Toggle */}
      <button 
        className="collection-toggle"
        onClick={() => setShowCollection(!showCollection)}
      >
        {showCollection ? '✕' : '📚'}
      </button>

      {/* Pet Collection Panel */}
      {showCollection && (
        <div className="pet-collection-panel">
          <div className="panel-header">
            <h3>Bộ Sưu Tập Pet</h3>
            <button 
              className="shop-btn"
              onClick={() => setShowPetShop(!showPetShop)}
            >
              🏪 Shop
            </button>
          </div>

          <div className="pet-grid">
            {pets.map(pet => (
              <div 
                key={pet.id}
                className={`pet-card ${activePet?.id === pet.id ? 'active' : ''}`}
                onClick={() => switchPet(pet)}
              >
                <img 
                  src={getPetGif(pet, 'idle')}
                  alt={pet.name}
                  className="pet-thumbnail"
                />
                <div className="pet-card-info">
                  <h4>{pet.name}</h4>
                  <p>Lv.{pet.level || 1}</p>
                  <span className="pet-type-badge">{petTypes[pet.type]?.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pet Shop */}
          {showPetShop && (
            <div className="pet-shop">
              <h4>Pet Shop</h4>
              <p className="user-coins">💰 {userCoins} coins</p>
              
              <div className="shop-items">
                {availablePets.map(pet => (
                  <div key={pet.id} className="shop-item">
                    <img 
                      src={pet.gifStates.idle}
                      alt={pet.name}
                      className="shop-pet-image"
                    />
                    <div className="shop-item-info">
                      <h5>{pet.name}</h5>
                      <p className="pet-rarity rarity-{pet.rarity}">{pet.rarity}</p>
                      <p className="pet-price">💰 {pet.price}</p>
                      <button 
                        className="adopt-btn"
                        onClick={() => adoptPet(pet.id)}
                        disabled={userCoins < pet.price}
                      >
                        Nhận Nuôi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pet Response Messages */}
      {petResponse && (
        <div className="pet-response-message">
          <div className="response-bubble">
            <p>{petResponse.message}</p>
          </div>
        </div>
      )}

      {/* No Pet State */}
      {!activePet && pets.length === 0 && (
        <div className="no-pet-state">
          <div className="no-pet-content">
            <div className="no-pet-icon">🐾</div>
            <h3>Bạn chưa có pet nào!</h3>
            <p>Hãy vào shop để nhận nuôi một pet cưng nhé!</p>
            <button 
              className="adopt-first-pet-btn"
              onClick={() => setShowPetShop(true)}
            >
              🏪 Vào Shop Ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPetSystem; 