import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Grid,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Text,
  Button,
  Badge,
  VStack,
  HStack,
  Image,
  Icon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  List,
  ListItem,
  ListIcon,
  Flex,
  Spacer,
  Tooltip,
  Alert,
  AlertIcon,
  Avatar,
  AvatarBadge
} from '@chakra-ui/react';
import {
  FaHeart,
  FaStar,
  FaCrown,
  FaBolt,
  FaFire,
  FaWater,
  FaLeaf,
  FaSnowflake,
  FaSun,
  FaMoon,
  FaMagic,
  FaGift,
  FaCog,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaMinus,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaPaw,
  FaBone,
  FaApple,
  FaCarrot,
  FaFish,
  FaSeedling,
  FaGem,
  FaCoins,
  FaLock
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const AdvancedPetSystem = () => {
  const { user } = useAuth();
  const petToast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState('collection');

  // Pet types with animations and GIFs
  const petTypes = {
    dragon: {
      name: 'Dragon',
      description: 'Majestic dragon with fire breath and wing animations',
      rarity: 'legendary',
      element: 'fire',
      baseStats: { health: 100, attack: 80, defense: 70, speed: 60 },
      evolutionStages: [
        { name: 'Dragonet', level: 1, image: '/pets/dragon/dragonet.gif', animation: 'idle' },
        { name: 'Young Dragon', level: 10, image: '/pets/dragon/young-dragon.gif', animation: 'fly' },
        { name: 'Adult Dragon', level: 25, image: '/pets/dragon/adult-dragon.gif', animation: 'attack' },
        { name: 'Elder Dragon', level: 50, image: '/pets/dragon/elder-dragon.gif', animation: 'magic' }
      ],
      abilities: ['Fire Breath', 'Wing Flap', 'Scale Shine', 'Tail Wag'],
      sounds: {
        idle: '/sounds/dragon/idle.mp3',
        attack: '/sounds/dragon/attack.mp3',
        fly: '/sounds/dragon/fly.mp3'
      }
    },
    phoenix: {
      name: 'Phoenix',
      description: 'Immortal phoenix with flame rebirth and healing aura',
      rarity: 'mythic',
      element: 'fire',
      baseStats: { health: 120, attack: 70, defense: 60, speed: 90 },
      evolutionStages: [
        { name: 'Phoenix Egg', level: 1, image: '/pets/phoenix/egg.gif', animation: 'glow' },
        { name: 'Baby Phoenix', level: 15, image: '/pets/phoenix/baby.gif', animation: 'hatch' },
        { name: 'Adult Phoenix', level: 30, image: '/pets/phoenix/adult.gif', animation: 'rebirth' },
        { name: 'Immortal Phoenix', level: 60, image: '/pets/phoenix/immortal.gif', animation: 'ascend' }
      ],
      abilities: ['Flame Rebirth', 'Healing Aura', 'Golden Feathers', 'Eternal Flame'],
      sounds: {
        idle: '/sounds/phoenix/idle.mp3',
        rebirth: '/sounds/phoenix/rebirth.mp3',
        heal: '/sounds/phoenix/heal.mp3'
      }
    },
    unicorn: {
      name: 'Crystal Unicorn',
      description: 'Magical unicorn with rainbow trail and crystal powers',
      rarity: 'epic',
      element: 'light',
      baseStats: { health: 90, attack: 60, defense: 80, speed: 85 },
      evolutionStages: [
        { name: 'Baby Unicorn', level: 1, image: '/pets/unicorn/baby.gif', animation: 'trot' },
        { name: 'Young Unicorn', level: 12, image: '/pets/unicorn/young.gif', animation: 'gallop' },
        { name: 'Adult Unicorn', level: 28, image: '/pets/unicorn/adult.gif', animation: 'magic' },
        { name: 'Crystal Unicorn', level: 45, image: '/pets/unicorn/crystal.gif', animation: 'sparkle' }
      ],
      abilities: ['Rainbow Trail', 'Crystal Powers', 'Magic Horn', 'Sparkle Effects'],
      sounds: {
        idle: '/sounds/unicorn/idle.mp3',
        magic: '/sounds/unicorn/magic.mp3',
        sparkle: '/sounds/unicorn/sparkle.mp3'
      }
    },
    wolf: {
      name: 'Shadow Wolf',
      description: 'Mysterious wolf with shadow powers and pack instincts',
      rarity: 'rare',
      element: 'dark',
      baseStats: { health: 85, attack: 75, defense: 65, speed: 95 },
      evolutionStages: [
        { name: 'Wolf Pup', level: 1, image: '/pets/wolf/pup.gif', animation: 'play' },
        { name: 'Young Wolf', level: 8, image: '/pets/wolf/young.gif', animation: 'hunt' },
        { name: 'Adult Wolf', level: 20, image: '/pets/wolf/adult.gif', animation: 'howl' },
        { name: 'Shadow Wolf', level: 35, image: '/pets/wolf/shadow.gif', animation: 'stealth' }
      ],
      abilities: ['Shadow Step', 'Pack Howl', 'Night Vision', 'Stealth Mode'],
      sounds: {
        idle: '/sounds/wolf/idle.mp3',
        howl: '/sounds/wolf/howl.mp3',
        hunt: '/sounds/wolf/hunt.mp3'
      }
    }
  };

  // Food types for pets
  const foodTypes = [
    { name: 'Premium Kibble', type: 'basic', effect: { happiness: 10, energy: 15 }, price: 50, icon: FaBone },
    { name: 'Fresh Apple', type: 'fruit', effect: { happiness: 15, energy: 10 }, price: 30, icon: FaApple },
    { name: 'Golden Carrot', type: 'vegetable', effect: { happiness: 20, energy: 20 }, price: 75, icon: FaCarrot },
    { name: 'Magic Fish', type: 'protein', effect: { happiness: 25, energy: 25 }, price: 100, icon: FaFish },
    { name: 'Crystal Seeds', type: 'magical', effect: { happiness: 30, energy: 30, exp: 50 }, price: 200, icon: FaSeedling }
  ];

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      // Fetch real pets data from API
      const response = await fetch('/api/pets/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPets(data.pets || []);
        } else {
          console.error('Failed to fetch pets:', data.message);
          setPets([]);
        }
      } else {
        console.error('Failed to fetch pets:', response.status);
        setPets([]);
      }
    } catch (error) {
      console.error('Error loading pets:', error);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const feedPet = async (petId, foodType) => {
    try {
      const food = foodTypes.find(f => f.name === foodType);
      if (!food) return;

      setPets(prev => prev.map(pet => {
        if (pet.id === petId) {
          const newHappiness = Math.min(100, pet.happiness + food.effect.happiness);
          const newEnergy = Math.min(100, pet.energy + food.effect.energy);
          const newExp = pet.experience + (food.effect.exp || 0);
          
          return {
            ...pet,
            happiness: newHappiness,
            energy: newEnergy,
            experience: newExp,
            lastFed: new Date()
          };
        }
        return pet;
      }));

      petToast({
        title: 'Pet Fed!',
        description: `${food.name} was delicious!`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error feeding pet:', error);
    }
  };

  const playWithPet = async (petId) => {
    try {
      setPets(prev => prev.map(pet => {
        if (pet.id === petId) {
          const newHappiness = Math.min(100, pet.happiness + 15);
          const newEnergy = Math.max(0, pet.energy - 10);
          
          return {
            ...pet,
            happiness: newHappiness,
            energy: newEnergy
          };
        }
        return pet;
      }));

      petToast({
        title: 'Play Time!',
        description: 'Your pet had a great time playing!',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error playing with pet:', error);
    }
  };

  const getPetImage = (pet) => {
    const petType = petTypes[pet.type];
    const stage = petType.evolutionStages[pet.evolutionStage];
    return stage.image;
  };

  const getPetAnimation = (pet) => {
    const petType = petTypes[pet.type];
    const stage = petType.evolutionStages[pet.evolutionStage];
    return stage.animation;
  };

  const getElementIcon = (element) => {
    switch (element) {
      case 'fire': return FaFire;
      case 'water': return FaWater;
      case 'earth': return FaLeaf;
      case 'ice': return FaSnowflake;
      case 'light': return FaSun;
      case 'dark': return FaMoon;
      default: return FaMagic;
    }
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <Text className="mt-4 text-gray-600">Loading your magical companions...</Text>
        </div>
      </Box>
    );
  }

  return (
    <Box className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 mb-4">
          🐾 Advanced Pet System
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Raise, evolve, and bond with your magical companions
        </p>
      </motion.div>

      {/* Pet Collection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Your Pet Collection</h2>
              <div className="flex items-center space-x-4">
                <Button size="sm" variant="outline">
                  <FaPlay className="mr-1" />
                  {isPlaying ? 'Pause' : 'Play'} All
                </Button>
                <Button size="sm" variant="outline">
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
              {pets.map((pet, index) => {
                const petType = petTypes[pet.type];
                const ElementIcon = getElementIcon(petType.element);
                const currentStage = petType.evolutionStages[pet.evolutionStage];
                const nextStage = petType.evolutionStages[pet.evolutionStage + 1];
                const expToNext = nextStage ? (nextStage.level * 100) - pet.experience : 0;
                const expProgress = nextStage ? (pet.experience / (nextStage.level * 100)) * 100 : 100;
                
                return (
                  <motion.div
                    key={pet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${
                        pet.isActive ? 'ring-2 ring-purple-500' : ''
                      }`}
                      onClick={() => {
                        setSelectedPet(pet);
                        onOpen();
                      }}
                    >
                      {/* Pet Animation */}
                      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-6xl animate-bounce">
                            {pet.type === 'dragon' && '🐉'}
                            {pet.type === 'phoenix' && '🦅'}
                            {pet.type === 'unicorn' && '🦄'}
                            {pet.type === 'wolf' && '🐺'}
                          </div>
                        </div>
                        {pet.isActive && (
                          <div className="absolute top-2 left-2">
                            <Badge colorScheme="green" className="animate-pulse">
                              <FaStar className="mr-1" />
                              Active
                            </Badge>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge colorScheme="purple">
                            <ElementIcon className="mr-1" />
                            {petType.element}
                          </Badge>
                        </div>
                      </div>

                      <CardBody>
                        {/* Pet Info */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <Text className="text-lg font-bold text-gray-900">{pet.name}</Text>
                            <Badge colorScheme="blue">Lv.{pet.level}</Badge>
                          </div>
                          <Text className="text-sm text-gray-600 mb-2">{currentStage.name}</Text>
                          
                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="flex items-center space-x-1">
                              <FaHeart className="text-red-500 text-xs" />
                              <Text className="text-xs text-gray-600">{pet.health}</Text>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FaBolt className="text-yellow-500 text-xs" />
                              <Text className="text-xs text-gray-600">{pet.attack}</Text>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FaLock className="text-blue-500 text-xs" />
                              <Text className="text-xs text-gray-600">{pet.defense}</Text>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FaArrowUp className="text-green-500 text-xs" />
                              <Text className="text-xs text-gray-600">{pet.speed}</Text>
                            </div>
                          </div>

                          {/* Experience Progress */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Experience</span>
                              <span>{pet.experience}/{nextStage ? nextStage.level * 100 : 'MAX'}</span>
                            </div>
                            <Progress value={expProgress} colorScheme="purple" size="sm" />
                          </div>

                          {/* Happiness and Energy */}
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Happiness</span>
                                <span>{pet.happiness}%</span>
                              </div>
                              <Progress value={pet.happiness} colorScheme="pink" size="sm" />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Energy</span>
                                <span>{pet.energy}%</span>
                              </div>
                              <Progress value={pet.energy} colorScheme="green" size="sm" />
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={(e) => {
                              e.stopPropagation();
                              playWithPet(pet.id);
                            }}
                            isDisabled={pet.energy < 10}
                          >
                            <FaPaw className="mr-1" />
                            Play
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open feed modal
                            }}
                          >
                            <FaBone className="mr-1" />
                            Feed
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                );
              })}
            </Grid>
          </CardBody>
        </Card>
      </motion.div>

      {/* Pet Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="flex items-center">
            {selectedPet && (
              <>
                <div className="mr-3 text-2xl">
                  {selectedPet.type === 'dragon' && '🐉'}
                  {selectedPet.type === 'phoenix' && '🦅'}
                  {selectedPet.type === 'unicorn' && '🦄'}
                  {selectedPet.type === 'wolf' && '🐺'}
                </div>
                {selectedPet.name} - {petTypes[selectedPet.type]?.name}
              </>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody className="pb-6">
            {selectedPet && (
              <div className="space-y-6">
                {/* Pet Animation Preview */}
                <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl animate-bounce">
                      {selectedPet.type === 'dragon' && '🐉'}
                      {selectedPet.type === 'phoenix' && '🦅'}
                      {selectedPet.type === 'unicorn' && '🦄'}
                      {selectedPet.type === 'wolf' && '🐺'}
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 flex space-x-2">
                    <Button size="sm" variant="outline">
                      <FaPlay className="mr-1" />
                      {getPetAnimation(selectedPet)}
                    </Button>
                    <Button size="sm" variant="outline">
                      <FaVolumeUp className="mr-1" />
                    </Button>
                  </div>
                </div>

                {/* Pet Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Stat>
                    <StatLabel>Health</StatLabel>
                    <StatNumber>{selectedPet.health}</StatNumber>
                    <StatHelpText>Max HP</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Attack</StatLabel>
                    <StatNumber>{selectedPet.attack}</StatNumber>
                    <StatHelpText>Damage Power</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Defense</StatLabel>
                    <StatNumber>{selectedPet.defense}</StatNumber>
                    <StatHelpText>Protection</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Speed</StatLabel>
                    <StatNumber>{selectedPet.speed}</StatNumber>
                    <StatHelpText>Agility</StatHelpText>
                  </Stat>
                </div>

                {/* Abilities */}
                <div>
                  <Text className="text-lg font-semibold mb-2">Abilities</Text>
                  <div className="flex flex-wrap gap-2">
                    {selectedPet.abilities.map((ability, index) => (
                      <Badge key={index} colorScheme="purple">
                        {ability}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <Button colorScheme="blue" flex={1}>
                    <FaPaw className="mr-2" />
                    Play with Pet
                  </Button>
                  <Button colorScheme="green" flex={1}>
                    <FaBone className="mr-2" />
                    Feed Pet
                  </Button>
                  <Button colorScheme="purple" flex={1}>
                    <FaMagic className="mr-2" />
                    Train Pet
                  </Button>
                </div>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdvancedPetSystem; 