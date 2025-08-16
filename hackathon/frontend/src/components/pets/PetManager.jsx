import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePets } from '../../contexts/PetContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const PetManager = () => {
  const { user } = useAuth();
  const {
    availablePets,
    userPets,
    activePet,
    loading,
    adoptPet,
    setActivePetById,
    feedPet,
    playWithPet,
    getPetMood,
    getPetMoodEmoji,
    canFeedPet,
    canPlayWithPet,
    getTimeUntilNextFeed,
    getTimeUntilNextPlay
  } = usePets();

  const [activeTab, setActiveTab] = useState('my-pets');
  const [selectedPet, setSelectedPet] = useState(null);
  const [adoptionModal, setAdoptionModal] = useState(null);
  const [nickname, setNickname] = useState('');
  const [accessoryInput, setAccessoryInput] = useState('');

  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return 'Ready now!';
    
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const handleAdoptPet = async (pet) => {
    if (!nickname.trim()) {
      toast.error('Please enter a nickname for your pet');
      return;
    }

    const result = await adoptPet(pet.id, nickname.trim());
    if (result.success) {
      setAdoptionModal(null);
      setNickname('');
      setActiveTab('my-pets');
    }
  };

  const handleFeedPet = async (petId) => {
    const result = await feedPet(petId);
    if (result.success) {
      // Pet stats updated automatically by context
    }
  };

  const handlePlayWithPet = async (petId) => {
    const result = await playWithPet(petId);
    if (result.success) {
      // Pet stats updated automatically by context
    }
  };

  const getSpeciesEmoji = (species) => {
    const emojis = {
      cat: '🐱',
      dog: '🐶',
      bird: '🐦',
      fish: '🐠',
      hamster: '🐹',
      rabbit: '🐰',
      dragon: '🐉',
      phoenix: '🔥',
      unicorn: '🦄'
    };
    return emojis[species] || '🐾';
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'border-gray-300 bg-gray-50',
      rare: 'border-blue-300 bg-blue-50',
      epic: 'border-purple-300 bg-purple-50',
      legendary: 'border-yellow-300 bg-yellow-50'
    };
    return colors[rarity] || colors.common;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🐾 Pet Manager
          </h1>
          <p className="text-gray-600">
            Adopt, care for, and play with your virtual companions!
          </p>
        </motion.div>

        {/* Active Pet Display */}
        {activePet && (
          <motion.div 
            className="bg-white rounded-2xl p-6 mb-8 shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-2xl font-bold text-center mb-4">
              Your Active Pet
            </h2>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-center">
                <motion.div className="text-8xl mb-2" animate={{ rotate: activePet.mood === 'happy' ? [0, 5, -5, 0] : 0 }} transition={{ repeat: activePet.mood==='happy'?Infinity:0, duration: 1.5 }}>
                  {getSpeciesEmoji(activePet.pet.species)}
                </motion.div>
                <div className="text-2xl">
                  {getPetMoodEmoji(getPetMood(activePet))}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {activePet.nickname}
                </h3>
                <p className="text-gray-600 mb-4 capitalize">
                  Level {activePet.level} {activePet.pet.species}
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Happiness</span>
                      <span className="text-sm font-medium">
                        {activePet.currentStats.happiness}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${activePet.currentStats.happiness}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Energy</span>
                      <span className="text-sm font-medium">
                        {activePet.currentStats.energy}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${activePet.currentStats.energy}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFeedPet(activePet.id)}
                    disabled={!canFeedPet(activePet)}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    🍖 Feed
                    {!canFeedPet(activePet) && (
                      <div className="text-xs mt-1">
                        {formatTimeRemaining(getTimeUntilNextFeed(activePet))}
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handlePlayWithPet(activePet.id)}
                    disabled={!canPlayWithPet(activePet)}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    🎾 Play
                    {!canPlayWithPet(activePet) && (
                      <div className="text-xs mt-1">
                        {formatTimeRemaining(getTimeUntilNextPlay(activePet))}
                      </div>
                    )}
                  </button>
                </div>
                {/* Accessories management */}
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Accessories</h4>
                  <div className="flex gap-2 mb-2">
                    <input className="border p-2 rounded flex-1" placeholder="Accessory ID (e.g. hat_red)" value={accessoryInput} onChange={e=>setAccessoryInput(e.target.value)} />
                    <button className="px-3 py-2 bg-purple-600 text-white rounded" onClick={async ()=>{
                      try {
                        await fetch(`/api/pets/customize/${activePet.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ accessories: [...(activePet.customization?.accessories||[]), accessoryInput] }) });
                        toast.success('Accessory added');
                        setAccessoryInput('');
                      } catch { toast.error('Failed'); }
                    }}>Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(activePet.customization?.accessories||[]).map((acc,i)=> (
                      <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                        {acc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('my-pets')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeTab === 'my-pets'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              My Pets ({userPets.length})
            </button>
            <button
              onClick={() => setActiveTab('adopt')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeTab === 'adopt'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              Adopt New Pet
            </button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'my-pets' ? (
            <motion.div
              key="my-pets"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {userPets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🐾</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No pets yet!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Adopt your first pet to get started
                  </p>
                  <button
                    onClick={() => setActiveTab('adopt')}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Adopt a Pet
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userPets && userPets.length > 0 ? userPets.map((userPet) => {
                    // Safety check to prevent undefined errors
                    if (!userPet || !userPet.pet) {
                      console.warn('Invalid userPet data:', userPet);
                      return null;
                    }
                    
                    return (
                      <motion.div
                        key={userPet.id}
                        className={`bg-white rounded-xl p-4 shadow-lg border-2 ${
                          userPet.isActive ? 'border-blue-500' : 'border-gray-200'
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="text-center mb-4">
                          <div className="text-4xl mb-2">
                            {getSpeciesEmoji(userPet.pet.species)}
                          </div>
                          <h3 className="font-bold text-lg">{userPet.nickname}</h3>
                          <p className="text-sm text-gray-600 capitalize">
                            Level {userPet.level} {userPet.pet.species}
                          </p>
                          <div className="text-lg mt-1">
                            {getPetMoodEmoji(getPetMood(userPet))}
                          </div>
                        </div>

                        {!userPet.isActive && (
                          <button
                            onClick={() => setActivePetById(userPet.id)}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Set as Active
                          </button>
                        )}
                        
                        {userPet.isActive && (
                          <div className="text-center text-blue-600 font-medium">
                            ⭐ Active Pet
                          </div>
                        )}
                      </motion.div>
                    );
                  }).filter(Boolean) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500">No pets found. Adopt your first pet!</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="adopt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availablePets.map((pet) => (
                  <motion.div
                    key={pet.id}
                    className={`bg-white rounded-xl p-4 border-2 ${getRarityColor(pet.rarity)} shadow-lg`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">
                        {getSpeciesEmoji(pet.species)}
                      </div>
                      <h3 className="font-bold text-lg">{pet.name}</h3>
                      <p className="text-sm text-gray-600 capitalize mb-2">
                        {pet.rarity} {pet.species}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pet.description}
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Requirements:</p>
                      <div className="text-xs space-y-1">
                        <div className={`flex items-center ${
                          user?.level >= pet.unlockRequirements.level 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          Level {pet.unlockRequirements.level}
                          {user?.level >= pet.unlockRequirements.level ? ' ✅' : ' ❌'}
                        </div>
                        <div className={`flex items-center ${
                          user?.coins >= pet.unlockRequirements.coins 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          🪙 {pet.unlockRequirements.coins}
                          {user?.coins >= pet.unlockRequirements.coins ? ' ✅' : ' ❌'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setAdoptionModal(pet)}
                      disabled={!pet.canUnlock}
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {pet.canUnlock ? 'Adopt' : 'Requirements Not Met'}
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Adoption Modal */}
        <AnimatePresence>
          {adoptionModal && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdoptionModal(null)}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 max-w-md w-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">
                    {getSpeciesEmoji(adoptionModal.species)}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Adopt {adoptionModal.name}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {adoptionModal.description}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Nickname
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter a cute nickname..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={30}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setAdoptionModal(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAdoptPet(adoptionModal)}
                    disabled={loading || !nickname.trim()}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Adopting...' : 'Adopt'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PetManager;
