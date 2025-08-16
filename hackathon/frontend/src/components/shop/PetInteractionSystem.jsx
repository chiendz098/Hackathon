import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Text, 
  Button, 
  VStack, 
  HStack, 
  Progress, 
  Badge, 
  Card, 
  CardBody,
  CardHeader,
  Heading,
  useToast,
  Grid,
  Image,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
  IconButton,
  Tooltip,
  Divider,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { 
  FaHeart, 
  FaBolt, 
  FaMagic, 
  FaFire, 
  FaShield, 
  FaStar,
  FaUtensils,
  FaGamepad,
  FaGraduationCap,
  FaBed,
  FaBath,
  FaGift,
  FaCrown,
  FaGem,
  FaCoins,
  FaLeaf,
  FaWater,
  FaSun,
  FaMoon,
  FaCloud,
  FaSnowflake
} from 'react-icons/fa';
import AnimatedPet from './AnimatedPet';
import useApi from '../../hooks/useApi';

const PetInteractionSystem = ({ userPets = [], onPetUpdated }) => {
  const { get, post } = useApi();
  const toast = useToast();
  
  const [selectedPet, setSelectedPet] = useState(null);
  const [interactionType, setInteractionType] = useState(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [interactionProgress, setInteractionProgress] = useState(0);
  const [petStats, setPetStats] = useState({});
  const [inventory, setInventory] = useState([]);
  
  // Interaction types configuration
  const interactionTypes = {
    feed: {
      name: 'Cho ăn',
      icon: FaUtensils,
      color: 'green',
      duration: 2000,
      effects: {
        hunger: -30,
        happiness: +10,
        energy: +5
      },
      cost: { coins: 10 },
      description: 'Cho pet ăn để giảm đói và tăng hạnh phúc'
    },
    play: {
      name: 'Chơi đùa',
      icon: FaGamepad,
      color: 'blue',
      duration: 3000,
      effects: {
        happiness: +20,
        energy: -15,
        hunger: +10
      },
      cost: { coins: 5 },
      description: 'Chơi đùa với pet để tăng hạnh phúc'
    },
    train: {
      name: 'Huấn luyện',
      icon: FaGraduationCap,
      color: 'purple',
      duration: 5000,
      effects: {
        intelligence: +15,
        energy: -25,
        happiness: +5,
        hunger: +15
      },
      cost: { coins: 20 },
      description: 'Huấn luyện pet để tăng trí thông minh'
    },
    sleep: {
      name: 'Cho ngủ',
      icon: FaBed,
      color: 'indigo',
      duration: 4000,
      effects: {
        energy: +40,
        hunger: +5
      },
      cost: { coins: 0 },
      description: 'Cho pet ngủ để hồi phục năng lượng'
    },
    bath: {
      name: 'Tắm rửa',
      icon: FaBath,
      color: 'cyan',
      duration: 2500,
      effects: {
        happiness: +15,
        energy: -10
      },
      cost: { coins: 15 },
      description: 'Tắm rửa pet để tăng hạnh phúc'
    },
    gift: {
      name: 'Tặng quà',
      icon: FaGift,
      color: 'pink',
      duration: 1500,
      effects: {
        happiness: +25,
        loyalty: +10
      },
      cost: { coins: 25 },
      description: 'Tặng quà cho pet để tăng hạnh phúc và lòng trung thành'
    }
  };
  
  // Food items for feeding
  const foodItems = [
    { id: 'basic_food', name: 'Thức ăn cơ bản', icon: '🍖', effect: 30, cost: 10 },
    { id: 'premium_food', name: 'Thức ăn cao cấp', icon: '🥩', effect: 50, cost: 25 },
    { id: 'magic_food', name: 'Thức ăn ma thuật', icon: '✨', effect: 80, cost: 50 },
    { id: 'royal_food', name: 'Thức ăn hoàng gia', icon: '👑', effect: 100, cost: 100 }
  ];
  
  // Toy items for playing
  const toyItems = [
    { id: 'basic_toy', name: 'Đồ chơi cơ bản', icon: '🎾', effect: 20, cost: 15 },
    { id: 'interactive_toy', name: 'Đồ chơi tương tác', icon: '🎮', effect: 35, cost: 30 },
    { id: 'magic_toy', name: 'Đồ chơi ma thuật', icon: '🔮', effect: 50, cost: 60 },
    { id: 'legendary_toy', name: 'Đồ chơi huyền thoại', icon: '⚡', effect: 80, cost: 120 }
  ];
  
  // Training items
  const trainingItems = [
    { id: 'basic_training', name: 'Khóa huấn luyện cơ bản', icon: '📚', effect: 15, cost: 20 },
    { id: 'advanced_training', name: 'Khóa huấn luyện nâng cao', icon: '🎯', effect: 30, cost: 45 },
    { id: 'master_training', name: 'Khóa huấn luyện bậc thầy', icon: '🏆', effect: 50, cost: 80 },
    { id: 'legendary_training', name: 'Khóa huấn luyện huyền thoại', icon: '💎', effect: 80, cost: 150 }
  ];
  
  // Load pet stats and inventory
  useEffect(() => {
    if (selectedPet) {
      loadPetStats(selectedPet.id);
      loadInventory();
    }
  }, [selectedPet]);
  
  const loadPetStats = async (petId) => {
    try {
      const response = await get(`/pets/${petId}/stats`);
      setPetStats(response.data);
    } catch (error) {
      console.error('Error loading pet stats:', error);
    }
  };
  
  const loadInventory = async () => {
    try {
      const response = await get('/users/inventory');
      setInventory(response.data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };
  
  // Start interaction
  const startInteraction = (type) => {
    if (!selectedPet) return;
    
    const interaction = interactionTypes[type];
    if (!interaction) return;
    
    setInteractionType(type);
    setIsInteracting(true);
    setInteractionProgress(0);
    
    // Simulate interaction progress
    const duration = interaction.duration;
    const startTime = Date.now();
    
    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      setInteractionProgress(progress);
      
      if (progress < 100) {
        requestAnimationFrame(animateProgress);
      } else {
        completeInteraction(type);
      }
    };
    
    animateProgress();
  };
  
  // Complete interaction
  const completeInteraction = async (type) => {
    if (!selectedPet) return;
    
    try {
      const response = await post(`/pets/${selectedPet.id}/interact`, {
        type,
        timestamp: new Date().toISOString()
      });
      
      if (response.data.success) {
        const interaction = interactionTypes[type];
        const effects = interaction.effects;
        
        // Update local pet stats
        setPetStats(prev => {
          const newStats = { ...prev };
          Object.entries(effects).forEach(([stat, change]) => {
            newStats[stat] = Math.max(0, Math.min(100, (newStats[stat] || 50) + change));
          });
          return newStats;
        });
        
        // Show success message
        toast({
          title: 'Tương tác thành công! 🎉',
          description: `${interaction.name} với ${selectedPet.name} đã hoàn thành`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Notify parent component
        onPetUpdated?.(selectedPet.id, response.data.updatedPet);
        
        // Add experience points
        const expGained = Math.floor(Math.random() * 10) + 5;
        toast({
          title: 'Nhận được kinh nghiệm! ⭐',
          description: `+${expGained} XP từ tương tác`,
          status: 'info',
          duration: 2000,
          isClosable: true,
        });
        
      }
    } catch (error) {
      toast({
        title: 'Tương tác thất bại',
        description: error.response?.data?.message || 'Có lỗi xảy ra',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsInteracting(false);
      setInteractionProgress(0);
      setInteractionType(null);
    }
  };
  
  // Feed pet with specific food
  const feedPet = async (foodItem) => {
    if (!selectedPet) return;
    
    try {
      const response = await post(`/pets/${selectedPet.id}/feed`, {
        foodId: foodItem.id,
        quantity: 1
      });
      
      if (response.data.success) {
        toast({
          title: 'Cho ăn thành công! 🍖',
          description: `${selectedPet.name} đã ăn ${foodItem.name}`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        
        // Update stats
        setPetStats(prev => ({
          ...prev,
          hunger: Math.max(0, (prev.hunger || 50) - foodItem.effect),
          happiness: Math.min(100, (prev.happiness || 50) + 10)
        }));
        
        onPetUpdated?.(selectedPet.id, response.data.updatedPet);
      }
    } catch (error) {
      toast({
        title: 'Cho ăn thất bại',
        description: error.response?.data?.message || 'Có lỗi xảy ra',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Get pet mood based on stats
  const getPetMood = (stats) => {
    const avgHappiness = (stats.happiness || 50 + stats.energy || 50) / 2;
    
    if (avgHappiness >= 80) return { mood: 'excited', color: 'green', icon: '😄' };
    if (avgHappiness >= 60) return { mood: 'happy', color: 'blue', icon: '😊' };
    if (avgHappiness >= 40) return { mood: 'neutral', color: 'yellow', icon: '😐' };
    if (avgHappiness >= 20) return { mood: 'sad', color: 'orange', icon: '😔' };
    return { mood: 'depressed', color: 'red', icon: '😢' };
  };
  
  // Get pet status
  const getPetStatus = (stats) => {
    const statuses = [];
    
    if (stats.hunger > 70) statuses.push({ type: 'hungry', color: 'red', icon: '🍽️' });
    if (stats.energy < 30) statuses.push({ type: 'tired', color: 'orange', icon: '😴' });
    if (stats.happiness < 30) statuses.push({ type: 'sad', color: 'blue', icon: '💔' });
    if (stats.health < 50) statuses.push({ type: 'sick', color: 'purple', icon: '🤒' });
    
    return statuses;
  };
  
  if (!selectedPet) {
    return (
      <Box textAlign="center" py={12}>
        <Text fontSize="lg" color="gray.500">
          Hãy chọn một pet để tương tác
        </Text>
      </Box>
    );
  }
  
  const petMood = getPetMood(petStats);
  const petStatuses = getPetStatus(petStats);
  
  return (
    <Box>
      {/* Pet Display and Stats */}
      <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6} mb={6}>
        {/* Pet Display */}
        <Card>
          <CardHeader textAlign="center">
            <Heading size="md">Pet của bạn</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <AnimatedPet 
                pet={selectedPet} 
                isOwned={true} 
                size="xl"
                interactive={false}
              />
              
              <VStack spacing={2} textAlign="center">
                <Text fontWeight="bold" fontSize="xl">{selectedPet.name}</Text>
                <Badge colorScheme={selectedPet.rarity} size="lg">
                  {selectedPet.rarity}
                </Badge>
                
                {/* Pet Mood */}
                <HStack spacing={2}>
                  <Text fontSize="lg">{petMood.icon}</Text>
                  <Badge colorScheme={petMood.color}>
                    {petMood.mood === 'excited' ? 'Phấn khích' :
                     petMood.mood === 'happy' ? 'Vui vẻ' :
                     petMood.mood === 'neutral' ? 'Bình thường' :
                     petMood.mood === 'sad' ? 'Buồn' : 'Chán nản'}
                  </Badge>
                </HStack>
                
                {/* Pet Statuses */}
                {petStatuses.length > 0 && (
                  <Wrap spacing={2} justify="center">
                    {petStatuses.map((status, index) => (
                      <WrapItem key={index}>
                        <Tooltip label={status.type === 'hungry' ? 'Đói' :
                                       status.type === 'tired' ? 'Mệt' :
                                       status.type === 'sad' ? 'Buồn' : 'Bệnh'}>
                          <Badge colorScheme={status.color} variant="solid">
                            {status.icon}
                          </Badge>
                        </Tooltip>
                      </WrapItem>
                    ))}
                  </Wrap>
                )}
              </VStack>
            </VStack>
          </CardBody>
        </Card>
        
        {/* Pet Stats */}
        <Card>
          <CardHeader>
            <Heading size="md">Chỉ số Pet</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {/* Happiness */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <HStack spacing={2}>
                    <FaHeart color="pink" />
                    <Text fontSize="sm">Hạnh phúc</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold">{petStats.happiness || 50}%</Text>
                </HStack>
                <Progress 
                  value={petStats.happiness || 50} 
                  colorScheme="pink"
                  borderRadius="full"
                />
              </Box>
              
              {/* Energy */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <HStack spacing={2}>
                    <FaBolt color="yellow" />
                    <Text fontSize="sm">Năng lượng</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold">{petStats.energy || 50}%</Text>
                </HStack>
                <Progress 
                  value={petStats.energy || 50} 
                  colorScheme="yellow"
                  borderRadius="full"
                />
              </Box>
              
              {/* Hunger */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <HStack spacing={2}>
                    <FaUtensils color="orange" />
                    <Text fontSize="sm">Đói</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold">{petStats.hunger || 50}%</Text>
                </HStack>
                <Progress 
                  value={petStats.hunger || 50} 
                  colorScheme="orange"
                  borderRadius="full"
                />
              </Box>
              
              {/* Intelligence */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <HStack spacing={2}>
                    <FaGraduationCap color="purple" />
                    <Text fontSize="sm">Trí thông minh</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold">{petStats.intelligence || 50}%</Text>
                </HStack>
                <Progress 
                  value={petStats.intelligence || 50} 
                  colorScheme="purple"
                  borderRadius="full"
                />
              </Box>
              
              {/* Health */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <HStack spacing={2}>
                    <FaShield color="green" />
                    <Text fontSize="sm">Sức khỏe</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold">{petStats.health || 100}%</Text>
                </HStack>
                <Progress 
                  value={petStats.health || 100} 
                  colorScheme="green"
                  borderRadius="full"
                />
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Grid>
      
      {/* Interaction Progress */}
      {isInteracting && (
        <Card mb={6} bg={`${interactionTypes[interactionType]?.color}.50`}>
          <CardBody>
            <VStack spacing={4}>
              <HStack spacing={3}>
                {React.createElement(interactionTypes[interactionType]?.icon, { 
                  color: interactionTypes[interactionType]?.color,
                  size: 24
                })}
                <Text fontWeight="bold" fontSize="lg">
                  Đang {interactionTypes[interactionType]?.name.toLowerCase()}...
                </Text>
              </HStack>
              
              <Progress 
                value={interactionProgress} 
                size="lg" 
                colorScheme={interactionTypes[interactionType]?.color}
                borderRadius="full"
                w="full"
              />
              
              <Text fontSize="sm" color="gray.600">
                {Math.round(interactionProgress)}%
              </Text>
            </VStack>
          </CardBody>
        </Card>
      )}
      
      {/* Interaction Actions */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Hành động tương tác</Heading>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            {Object.entries(interactionTypes).map(([key, interaction]) => {
              const IconComponent = interaction.icon;
              const isDisabled = isInteracting || 
                               (interaction.cost.coins > 0 && (user?.coins || 0) < interaction.cost.coins);
              
              return (
                <Button
                  key={key}
                  colorScheme={interaction.color}
                  variant="outline"
                  size="lg"
                  h="120px"
                  onClick={() => startInteraction(key)}
                  isDisabled={isDisabled}
                  leftIcon={<IconComponent />}
                  flexDirection="column"
                  gap={2}
                >
                  <VStack spacing={1}>
                    <Text fontWeight="bold">{interaction.name}</Text>
                    <Text fontSize="xs" textAlign="center" color="gray.600">
                      {interaction.description}
                    </Text>
                    {interaction.cost.coins > 0 && (
                      <HStack spacing={1}>
                        <FaCoins color="gold" />
                        <Text fontSize="xs">{interaction.cost.coins}</Text>
                      </HStack>
                    )}
                  </VStack>
                </Button>
              );
            })}
          </Grid>
        </CardBody>
      </Card>
      
      {/* Food and Items */}
      <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
        {/* Food Items */}
        <Card>
          <CardHeader>
            <Heading size="md">Thức ăn</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              {foodItems.map((food) => (
                <Button
                  key={food.id}
                  variant="outline"
                  onClick={() => feedPet(food)}
                  isDisabled={isInteracting}
                  justifyContent="space-between"
                  px={4}
                  py={3}
                >
                  <HStack spacing={3}>
                    <Text fontSize="xl">{food.icon}</Text>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="sm">{food.name}</Text>
                      <Text fontSize="xs" color="gray.600">
                        Giảm đói: {food.effect}%
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack spacing={2}>
                    <FaCoins color="gold" />
                    <Text fontSize="sm" fontWeight="bold">{food.cost}</Text>
                  </HStack>
                </Button>
              ))}
            </VStack>
          </CardBody>
        </Card>
        
        {/* Toy Items */}
        <Card>
          <CardHeader>
            <Heading size="md">Đồ chơi</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              {toyItems.map((toy) => (
                <Button
                  key={toy.id}
                  variant="outline"
                  onClick={() => startInteraction('play')}
                  isDisabled={isInteracting}
                  justifyContent="space-between"
                  px={4}
                  py={3}
                >
                  <HStack spacing={3}>
                    <Text fontSize="xl">{toy.icon}</Text>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="sm">{toy.name}</Text>
                      <Text fontSize="xs" color="gray.600">
                        Tăng hạnh phúc: {toy.effect}%
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack spacing={2}>
                    <FaCoins color="gold" />
                    <Text fontSize="sm" fontWeight="bold">{toy.cost}</Text>
                  </HStack>
                </Button>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </Grid>
    </Box>
  );
};

export default PetInteractionSystem; 