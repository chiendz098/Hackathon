import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useApi from '../../hooks/useApi';
import './EnhancedPetShop.css';

const EnhancedPetShop = ({ onPetAdopted, onClose }) => {
  const { user } = useAuth();
  const { apiCall } = useApi();
  const [availablePets, setAvailablePets] = useState([]);
  const [userCoins, setUserCoins] = useState(0);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [filterRarity, setFilterRarity] = useState('all');
  const [sortBy, setSortBy] = useState('price');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const petTypes = {
    cat: {
      name: 'Mèo Con',
      description: 'Mèo con dễ thương, thích chơi đùa và rất thông minh',
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
      rarity: 'common',
      specialAbilities: ['Mèo có thể nhảy cao', 'Thích leo trèo', 'Ngủ nhiều']
    },
    dog: {
      name: 'Cún Con',
      description: 'Cún con trung thành, năng động và rất thân thiện',
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
      rarity: 'common',
      specialAbilities: ['Cún rất trung thành', 'Thích chạy nhảy', 'Bảo vệ chủ']
    },
    rabbit: {
      name: 'Thỏ Con',
      description: 'Thỏ con hiền lành, thích ăn cà rốt và rất nhanh nhẹn',
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
      rarity: 'uncommon',
      specialAbilities: ['Thỏ rất nhanh', 'Thích ăn rau', 'Tai dài đẹp']
    },
    dragon: {
      name: 'Rồng Con',
      description: 'Rồng con huyền thoại, có sức mạnh phi thường và rất hiếm',
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
      rarity: 'legendary',
      specialAbilities: ['Rồng có thể bay', 'Phun lửa', 'Sức mạnh khổng lồ']
    },
    phoenix: {
      name: 'Phượng Hoàng',
      description: 'Phượng hoàng bất tử, có thể tái sinh từ tro tàn',
      baseStats: { happiness: 98, energy: 95, intelligence: 95 },
      evolution: ['Phượng Hoàng Con', 'Phượng Hoàng Teen', 'Phượng Hoàng Trưởng Thành', 'Phượng Hoàng Bất Tử'],
      gifStates: {
        idle: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        happy: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        sad: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        eating: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        playing: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        sleeping: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
      },
      price: 1000,
      rarity: 'mythical',
      specialAbilities: ['Bất tử', 'Tái sinh', 'Bay xa']
    }
  };

  // Sử dụng useCallback để tránh re-render không cần thiết
  const loadUserCoins = useCallback(async () => {
    if (hasLoaded) return; // Chỉ load một lần
    
    try {
      const response = await apiCall('/users/coins', 'GET');
      if (response.success) {
        setUserCoins(response.coins);
      }
    } catch (error) {
      console.error('Error loading user coins:', error);
      setUserCoins(0);
    }
  }, [apiCall, hasLoaded]);

  const initializeAvailablePets = useCallback(() => {
    if (availablePets.length > 0) return; // Đã có pets rồi
    
    const pets = Object.entries(petTypes).map(([key, pet]) => ({
      id: key,
      ...pet
    }));
    setAvailablePets(pets);
  }, [availablePets.length]);

  useEffect(() => {
    if (user && user.id && !hasLoaded) {
      loadUserCoins();
      initializeAvailablePets();
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [user, hasLoaded, loadUserCoins, initializeAvailablePets]);

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
        if (onPetAdopted) {
          onPetAdopted(response.pet);
        }
        onClose();
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
      if (onPetAdopted) {
        onPetAdopted(newPet);
      }
      onClose();
    }
  }, [userCoins, petTypes, user, apiCall, onPetAdopted, onClose]);

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#4CAF50',
      uncommon: '#2196F3',
      rare: '#9C27B0',
      legendary: '#FF9800',
      mythical: '#F44336'
    };
    return colors[rarity] || '#666';
  };

  const getRarityText = (rarity) => {
    const texts = {
      common: 'Thường',
      uncommon: 'Hiếm',
      rare: 'Rất Hiếm',
      legendary: 'Huyền Thoại',
      mythical: 'Thần Thoại'
    };
    return texts[rarity] || rarity;
  };

  const filteredPets = availablePets
    .filter(pet => 
      (filterRarity === 'all' || pet.rarity === filterRarity) &&
      (searchTerm === '' || pet.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'rarity':
          const rarityOrder = { common: 1, uncommon: 2, rare: 3, legendary: 4, mythical: 5 };
          return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="pet-shop-overlay">
        <div className="pet-shop-modal">
          <div className="loading-spinner">🔄</div>
          <p>Đang tải Pet Shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pet-shop-overlay">
      <div className="pet-shop-modal">
        {/* Header */}
        <div className="shop-header">
          <h2>🏪 Pet Shop</h2>
          <div className="user-coins-display">
            <span className="coins-icon">💰</span>
            <span className="coins-amount">{userCoins.toLocaleString()}</span>
            <span className="coins-label">coins</span>
          </div>
          <button className="close-shop-btn" onClick={onClose}>✕</button>
        </div>

        {/* Filters and Search */}
        <div className="shop-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm pet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-controls">
            <select 
              value={filterRarity} 
              onChange={(e) => setFilterRarity(e.target.value)}
              className="rarity-filter"
            >
              <option value="all">Tất cả độ hiếm</option>
              <option value="common">Thường</option>
              <option value="uncommon">Hiếm</option>
              <option value="rare">Rất Hiếm</option>
              <option value="legendary">Huyền Thoại</option>
              <option value="mythical">Thần Thoại</option>
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-filter"
            >
              <option value="price">Sắp xếp theo giá</option>
              <option value="rarity">Sắp xếp theo độ hiếm</option>
              <option value="name">Sắp xếp theo tên</option>
            </select>
          </div>
        </div>

        {/* Pet Grid */}
        <div className="pet-grid">
          {filteredPets.map(pet => (
            <div key={pet.id} className="pet-card">
              <div className="pet-image-container">
                <img 
                  src={pet.gifStates.idle}
                  alt={pet.name}
                  className="pet-image"
                  onClick={() => {
                    setSelectedPet(pet);
                    setShowPreview(true);
                  }}
                />
                <div 
                  className="rarity-badge"
                  style={{ backgroundColor: getRarityColor(pet.rarity) }}
                >
                  {getRarityText(pet.rarity)}
                </div>
              </div>
              
              <div className="pet-info">
                <h3 className="pet-name">{pet.name}</h3>
                <p className="pet-description">{pet.description}</p>
                
                <div className="pet-stats">
                  <div className="stat">
                    <span>😊 {pet.baseStats.happiness}</span>
                  </div>
                  <div className="stat">
                    <span>⚡ {pet.baseStats.energy}</span>
                  </div>
                  <div className="stat">
                    <span>🧠 {pet.baseStats.intelligence}</span>
                  </div>
                </div>
                
                <div className="pet-price">
                  <span className="price-amount">💰 {pet.price.toLocaleString()}</span>
                  <span className="price-label">coins</span>
                </div>
                
                <button 
                  className={`adopt-button ${userCoins >= pet.price ? 'can-afford' : 'cannot-afford'}`}
                  onClick={() => adoptPet(pet.id)}
                  disabled={userCoins < pet.price}
                >
                  {userCoins >= pet.price ? '🐾 Nhận Nuôi' : '💸 Không đủ coins'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pet Preview Modal */}
        {showPreview && selectedPet && (
          <div className="pet-preview-overlay">
            <div className="pet-preview-modal">
              <div className="preview-header">
                <h3>{selectedPet.name}</h3>
                <button 
                  className="close-preview-btn"
                  onClick={() => setShowPreview(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="preview-content">
                <div className="preview-image">
                  <img src={selectedPet.gifStates.idle} alt={selectedPet.name} />
                </div>
                
                <div className="preview-info">
                  <p className="preview-description">{selectedPet.description}</p>
                  
                  <div className="preview-stats">
                    <h4>Thông Số Cơ Bản</h4>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-label">Hạnh phúc:</span>
                        <span className="stat-value">{selectedPet.baseStats.happiness}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Năng lượng:</span>
                        <span className="stat-value">{selectedPet.baseStats.energy}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Thông minh:</span>
                        <span className="stat-value">{selectedPet.baseStats.intelligence}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="preview-evolution">
                    <h4>Quá Trình Tiến Hóa</h4>
                    <div className="evolution-stages">
                      {selectedPet.evolution.map((stage, index) => (
                        <div key={index} className="evolution-stage">
                          <span className="stage-number">{index + 1}</span>
                          <span className="stage-name">{stage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="preview-abilities">
                    <h4>Khả Năng Đặc Biệt</h4>
                    <ul className="abilities-list">
                      {selectedPet.specialAbilities.map((ability, index) => (
                        <li key={index}>✨ {ability}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="preview-footer">
                <div className="preview-price">
                  <span className="price-amount">💰 {selectedPet.price.toLocaleString()} coins</span>
                </div>
                <button 
                  className={`adopt-preview-btn ${userCoins >= selectedPet.price ? 'can-afford' : 'cannot-afford'}`}
                  onClick={() => adoptPet(selectedPet.id)}
                  disabled={userCoins < selectedPet.price}
                >
                  {userCoins >= selectedPet.price ? '🐾 Nhận Nuôi Ngay!' : '💸 Không đủ coins'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPetShop; 