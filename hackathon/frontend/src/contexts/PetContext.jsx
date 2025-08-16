import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { 
  getPetStats, 
  setActivePet as setActivePetAPI, 
  adoptPet as adoptPetAPI,
  getUserPets as getUserPetsAPI,
  getActivePet as getActivePetAPI,
  getPetEvolution,
  getPetAchievements,
  getPetQuests,
  getPetEvents
} from '../api';

const PetContext = createContext();

export const usePets = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePets must be used within a PetProvider');
  }
  return context;
};

export const PetProvider = ({ children }) => {
  const { user } = useAuth();
  const [availablePets, setAvailablePets] = useState([]);
  const [userPets, setUserPets] = useState([]);
  const [activePet, setActivePetState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [petShop, setPetShop] = useState([]);
  const [petAccessories, setPetAccessories] = useState([]);
  const [petThemes, setPetThemes] = useState([]);
  const [petFood, setPetFood] = useState([]);
  const [petToys, setPetToys] = useState([]);
  const [petTraining, setPetTraining] = useState([]);
  const [petBonding, setPetBonding] = useState([]);
  const [petEvolution, setPetEvolution] = useState([]);
  const [petStats, setPetStats] = useState({});
  const [petAchievements, setPetAchievements] = useState([]);
  const [petQuests, setPetQuests] = useState([]);
  const [petEvents, setPetEvents] = useState([]);

  // Load pets data when user changes
  useEffect(() => {
    if (user && user.id && !loading) {
      fetchAllPetData();
    }
  }, [user]);

  // Auto-save pet stats every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (activePet && Object.keys(petStats).length > 0) {
        savePetStats();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [activePet, petStats]);

  // Auto-update pet mood and energy every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (activePet) {
        updatePetNaturalStats();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [activePet]);

  const fetchAllPetData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAvailablePets(),
        fetchUserPets(),
        fetchActivePet(),
        fetchPetShop(),
        fetchPetAccessories(),
        fetchPetThemes(),
        fetchPetFood(),
        fetchPetToys(),
        fetchPetTraining(),
        fetchPetBonding(),
        fetchPetEvolution(),
        fetchPetStats(),
        fetchPetAchievements(),
        fetchPetQuests(),
        fetchPetEvents()
      ]);
    } catch (error) {
      console.error('Error fetching all pet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePets = async () => {
    try {
      const response = await fetch('/api/pets/available', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailablePets(data.pets || []);
      } else {
        console.error('Failed to fetch available pets:', response.status);
        setAvailablePets([]);
      }
    } catch (error) {
      console.error('Error fetching available pets:', error);
      setAvailablePets([]);
    }
  };

  const fetchUserPets = async () => {
    try {
      const response = await fetch('/api/pets/my-pets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserPets(data.pets || []);
      } else {
        console.error('Failed to fetch user pets:', response.status);
        setUserPets([]);
      }
    } catch (error) {
      console.error('Error fetching user pets:', error);
      setUserPets([]);
    }
  };

  const fetchActivePet = async () => {
    try {
      const response = await fetch('/api/pets/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivePet(data.activePet || null);
      } else {
        console.error('Failed to fetch active pet:', response.status);
        setActivePet(null);
      }
    } catch (error) {
      console.error('Error fetching active pet:', error);
      setActivePet(null);
    }
  };

  const fetchPetShop = async () => {
    try {
      const response = await fetch('/api/pets/shop', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPetShop(data.shop || []);
      }
    } catch (error) {
      console.error('Error fetching pet shop:', error);
    }
  };

  const fetchPetAccessories = async () => {
    try {
      const response = await fetch('/api/pets/accessories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPetAccessories(data.accessories || []);
      }
    } catch (error) {
      console.error('Error fetching pet accessories:', error);
    }
  };

  const fetchPetThemes = async () => {
    try {
      const response = await fetch('/api/pets/themes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPetThemes(data.themes || []);
      }
    } catch (error) {
      console.error('Error fetching pet themes:', error);
    }
  };

  const fetchPetFood = async () => {
    try {
      const response = await fetch('/api/pets/food', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPetFood(data.food || []);
      }
    } catch (error) {
      console.error('Error fetching pet food:', error);
    }
  };

  const fetchPetToys = async () => {
    try {
      const response = await fetch('/api/pets/toys', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPetToys(data.toys || []);
      }
    } catch (error) {
      console.error('Error fetching pet toys:', error);
    }
  };

  const fetchPetTraining = async () => {
    try {
      const response = await fetch('/api/pets/training', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPetTraining(data.training || []);
      }
    } catch (error) {
      console.error('Error fetching pet training:', error);
    }
  };

  const fetchPetBonding = async () => {
    try {
      const response = await fetch('/api/pets/bonding', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPetBonding(data.bonding || []);
      }
    } catch (error) {
      console.error('Error fetching pet bonding:', error);
    }
  };

  const fetchPetEvolution = async () => {
    try {
      const response = await fetch('/api/pets/evolution', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPetEvolution(data.evolution || []);
      }
    } catch (error) {
      console.error('Error fetching pet evolution:', error);
    }
  };

  const fetchPetStats = async () => {
    try {
      const response = await getPetStats();
      if (response.data && response.data.stats) {
        setPetStats(response.data.stats);
      } else {
        setPetStats({});
      }
    } catch (error) {
      console.error('Error fetching pet stats:', error);
      setPetStats({});
    }
  };

  const fetchPetAchievements = async () => {
    try {
      const response = await fetch('/api/pets/achievements', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPetAchievements(data.achievements || []);
      }
    } catch (error) {
      console.error('Error fetching pet achievements:', error);
    }
  };

  const fetchPetQuests = async () => {
    try {
      const response = await fetch('/api/pets/quests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPetQuests(data.quests || []);
      }
    } catch (error) {
      console.error('Error fetching pet quests:', error);
    }
  };

  const fetchPetEvents = async () => {
    try {
      const response = await fetch('/api/pets/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPetEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching pet events:', error);
    }
  };

  // Core Pet Functions
  const adoptPet = async (petId, nickname = '') => {
    try {
      const response = await fetch('/api/pets/adopt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ petId, nickname })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
        await fetchUserPets();
          toast.success(`Congratulations! You adopted ${data.pet.name}! 🎉`);
          return data.pet;
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to adopt pet');
      }
    } catch (error) {
      console.error('Error adopting pet:', error);
      toast.error('Failed to adopt pet');
    }
    return null;
  };

  const setActivePet = async (petId) => {
    try {
      const response = await setActivePetAPI(petId);
      if (response.data && response.data.success) {
        setActivePetState(response.data.activePet);
        const petName = response.data.activePet?.name || response.data.activePet?.nickname || 'Your pet';
        toast.success(`${petName} is now your active companion! 🐾`);
      }
    } catch (error) {
      console.error('Error setting active pet:', error);
      // Don't show error toast for 404 when no pets exist
      if (error.response?.status !== 404) {
        toast.error('Failed to set active pet');
      }
    }
  };

  // Pet Care Functions
  const feedPet = async (petId, foodId) => {
    try {
      const response = await fetch('/api/pets/feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ petId, foodId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchPetStats();
          toast.success(`${data.pet.name} enjoyed the food! 🍖`);
          return data.pet;
        }
      }
    } catch (error) {
      console.error('Error feeding pet:', error);
      toast.error('Failed to feed pet');
    }
    return null;
  };

  const playWithPet = async (petId, toyId) => {
    try {
      const response = await fetch('/api/pets/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ petId, toyId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchPetStats();
          toast.success(`${data.pet.name} had fun playing! 🎾`);
          return data.pet;
        }
      }
    } catch (error) {
      console.error('Error playing with pet:', error);
      toast.error('Failed to play with pet');
    }
    return null;
  };

  const trainPet = async (petId, trainingId) => {
    try {
      const response = await fetch('/api/pets/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ petId, trainingId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchPetStats();
          toast.success(`${data.pet.name} learned something new! 🎓`);
          return data.pet;
        }
      }
    } catch (error) {
      console.error('Error training pet:', error);
      toast.error('Failed to train pet');
    }
    return null;
  };

  const bondWithPet = async (petId, bondingId) => {
    try {
      const response = await fetch('/api/pets/bond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ petId, bondingId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchPetStats();
          toast.success(`Your bond with ${data.pet.name} grew stronger! 💕`);
          return data.pet;
        }
      }
    } catch (error) {
      console.error('Error bonding with pet:', error);
      toast.error('Failed to bond with pet');
    }
    return null;
  };

  // Pet Evolution Functions
  const evolvePet = async (petId) => {
    try {
      const response = await fetch('/api/pets/evolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ petId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchUserPets();
          await fetchPetStats();
          toast.success(`${data.pet.name} evolved! ✨`);
          return data.pet;
        }
      }
    } catch (error) {
      console.error('Error evolving pet:', error);
      toast.error('Failed to evolve pet');
    }
    return null;
  };

  // Pet Customization Functions
  const equipAccessory = async (petId, accessoryId) => {
    try {
      const response = await fetch('/api/pets/equip-accessory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ petId, accessoryId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchPetStats();
          toast.success(`Accessory equipped! 🎀`);
          return data.pet;
        }
      }
    } catch (error) {
      console.error('Error equipping accessory:', error);
      toast.error('Failed to equip accessory');
    }
    return null;
  };

  const applyTheme = async (petId, themeId) => {
    try {
      const response = await fetch('/api/pets/apply-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ petId, themeId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchPetStats();
          toast.success(`Theme applied! 🎨`);
          return data.pet;
        }
      }
    } catch (error) {
      console.error('Error applying theme:', error);
      toast.error('Failed to apply theme');
    }
    return null;
  };

  // Pet Shop Functions
  const buyPet = async (petId) => {
    try {
      const response = await fetch('/api/pets/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ petId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchUserPets();
          toast.success(`You bought a new pet! 🎉`);
          return data.pet;
        }
      }
    } catch (error) {
      console.error('Error buying pet:', error);
      toast.error('Failed to buy pet');
    }
    return null;
  };

  const buyAccessory = async (accessoryId) => {
    try {
      const response = await fetch('/api/pets/buy-accessory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ accessoryId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchPetAccessories();
          toast.success(`Accessory purchased! 🎁`);
          return data.accessory;
        }
      }
    } catch (error) {
      console.error('Error buying accessory:', error);
      toast.error('Failed to buy accessory');
    }
    return null;
  };

  // Pet Stats Management
  const updatePetStats = async (petId, stats) => {
    try {
      const response = await fetch('/api/pets/update-stats', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ petId, stats })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchPetStats();
          return data.pet;
        }
      }
    } catch (error) {
      console.error('Error updating pet stats:', error);
    }
    return null;
  };

  const savePetStats = async () => {
    if (!activePet || Object.keys(petStats).length === 0) return;
    
    try {
      await updatePetStats(activePet.id, petStats);
    } catch (error) {
      console.error('Error saving pet stats:', error);
    }
  };

  const updatePetNaturalStats = async () => {
    if (!activePet) return;
    
    const currentStats = petStats[activePet.id] || {};
    const newStats = {
      ...currentStats,
      energy: Math.max(0, (currentStats.energy || 100) - 2),
      happiness: Math.max(0, (currentStats.happiness || 100) - 1),
      hunger: Math.min(100, (currentStats.hunger || 0) + 3),
      thirst: Math.min(100, (currentStats.thirst || 0) + 2)
    };
    
    setPetStats(prev => ({
      ...prev,
      [activePet.id]: newStats
    }));
  };

  // Pet Quest Functions
  const startPetQuest = async (questId) => {
    try {
      const response = await fetch('/api/pets/start-quest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ questId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchPetQuests();
          toast.success(`Quest started: ${data.quest.title}! 🗺️`);
          return data.quest;
        }
      }
    } catch (error) {
      console.error('Error starting quest:', error);
      toast.error('Failed to start quest');
    }
    return null;
  };

  const completePetQuest = async (questId) => {
    try {
      const response = await fetch('/api/pets/complete-quest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ questId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchPetQuests();
          await fetchPetStats();
          toast.success(`Quest completed! Rewards: ${data.rewards.join(', ')} 🎁`);
          return data;
        }
      }
    } catch (error) {
      console.error('Error completing quest:', error);
      toast.error('Failed to complete quest');
    }
    return null;
  };

  // Pet Event Functions
  const participateInEvent = async (eventId) => {
    try {
      const response = await fetch('/api/pets/participate-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ eventId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchPetEvents();
          toast.success(`Joined event: ${data.event.title}! 🎪`);
          return data.event;
        }
      }
    } catch (error) {
      console.error('Error participating in event:', error);
      toast.error('Failed to join event');
    }
    return null;
  };

  // Utility Functions
  const getPetById = useCallback((petId) => {
    return userPets.find(pet => pet.id === petId);
  }, [userPets]);

  const getPetStats = useCallback((petId) => {
    return petStats[petId] || {};
  }, [petStats]);

  const isPetEvolvable = useCallback((pet) => {
    const stats = getPetStats(pet.id);
    const currentLevel = pet.evolution?.currentStage || 0;
    const maxLevel = pet.evolution?.stages?.length || 1;
    
    if (currentLevel >= maxLevel - 1) return false;
    
    const requiredXP = pet.evolution?.requirements?.[currentLevel + 1] || 0;
    return (stats.xp || 0) >= requiredXP;
  }, [getPetStats]);

  const getPetMood = useCallback((pet) => {
    const stats = getPetStats(pet.id);
    const happiness = stats.happiness || 50;
    const energy = stats.energy || 50;
    const hunger = stats.hunger || 50;
    const thirst = stats.thirst || 50;
    
    const average = (happiness + energy + (100 - hunger) + (100 - thirst)) / 4;
    
    if (average >= 80) return 'excellent';
    if (average >= 60) return 'good';
    if (average >= 40) return 'okay';
    if (average >= 20) return 'poor';
    return 'terrible';
  }, [getPetStats]);

  const refreshAllData = async () => {
    await fetchAllPetData();
  };

  const value = {
    // State
    availablePets,
    userPets,
    activePet,
    loading,
    petShop,
    petAccessories,
    petThemes,
    petFood,
    petToys,
    petTraining,
    petBonding,
    petEvolution,
    petStats,
    petAchievements,
    petQuests,
    petEvents,
    
    // Core Functions
    adoptPet,
    setActivePet,
    feedPet,
    playWithPet,
    trainPet,
    bondWithPet,
    
    // Evolution Functions
    evolvePet,
    
    // Customization Functions
    equipAccessory,
    applyTheme,
    
    // Shop Functions
    buyPet,
    buyAccessory,
    
    // Stats Functions
    updatePetStats,
    getPetStats,
    
    // Quest Functions
    startPetQuest,
    completePetQuest,
    
    // Event Functions
    participateInEvent,
    
    // Utility Functions
    getPetById,
    isPetEvolvable,
    getPetMood,
    refreshAllData
  };

  return (
    <PetContext.Provider value={value}>
      {children}
    </PetContext.Provider>
  );
};
