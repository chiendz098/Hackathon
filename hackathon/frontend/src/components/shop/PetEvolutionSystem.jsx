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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Grid,
  Image,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  FaStar, 
  FaBolt, 
  FaMagic, 
  FaFire, 
  FaShield, 
  FaHeart,
  FaArrowUp,
  FaCrown,
  FaGem,
  FaCoins,
  FaRocket,
  FaDragon,
  FaPhoenix,
  FaUnicorn
} from 'react-icons/fa';
import AnimatedPet from './AnimatedPet';
import useApi from '../../hooks/useApi';

const PetEvolutionSystem = ({ userPets = [], onPetEvolved }) => {
  const { get, post } = useApi();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [selectedPet, setSelectedPet] = useState(null);
  const [evolutionData, setEvolutionData] = useState(null);
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionProgress, setEvolutionProgress] = useState(0);
  const [evolutionStage, setEvolutionStage] = useState('preparing');
  
  // Evolution stages configuration
  const evolutionStages = {
    preparing: { name: 'Chuẩn bị', progress: 0, duration: 1000 },
    gathering: { name: 'Thu thập năng lượng', progress: 25, duration: 2000 },
    transforming: { name: 'Biến đổi', progress: 50, duration: 3000 },
    stabilizing: { name: 'Ổn định', progress: 75, duration: 2000 },
    completing: { name: 'Hoàn thành', progress: 100, duration: 1000 }
  };
  
  // Check if pet can evolve
  const canEvolve = (pet) => {
    if (!pet.metadata?.evolution?.canEvolve) return false;
    
    const userLevel = pet.userLevel || 1;
    const requiredLevel = pet.metadata.evolution.evolutionLevel;
    
    return userLevel >= requiredLevel;
  };
  
  // Get evolution requirements
  const getEvolutionRequirements = (pet) => {
    if (!pet.metadata?.evolution) return null;
    
    return {
      level: pet.metadata.evolution.evolutionLevel,
      coins: pet.metadata.evolution.coins || 1000,
      gems: pet.metadata.evolution.gems || 100,
      items: pet.metadata.evolution.items || []
    };
  };
  
  // Get evolution benefits
  const getEvolutionBenefits = (pet) => {
    if (!pet.metadata?.evolution) return null;
    
    return {
      newName: pet.metadata.evolution.evolutionForm,
      statIncrease: {
        happiness: 50,
        energy: 50,
        intelligence: 50,
        magic: 50,
        defense: 50
      },
      newAbilities: pet.metadata.evolution.newAbilities || [],
      newSprites: pet.metadata.evolution.newSprites || {}
    };
  };
  
  // Start evolution process
  const startEvolution = async (pet) => {
    if (!canEvolve(pet)) {
      toast({
        title: 'Không thể tiến hóa',
        description: 'Pet này chưa đủ điều kiện để tiến hóa',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setSelectedPet(pet);
    setEvolutionData(getEvolutionBenefits(pet));
    onOpen();
  };
  
  // Execute evolution
  const executeEvolution = async () => {
    if (!selectedPet) return;
    
    setIsEvolving(true);
    setEvolutionProgress(0);
    setEvolutionStage('preparing');
    
    try {
      // Simulate evolution process with stages
      for (const [stageKey, stage] of Object.entries(evolutionStages)) {
        setEvolutionStage(stageKey);
        
        // Animate progress bar
        const startProgress = evolutionProgress;
        const endProgress = stage.progress;
        const duration = stage.duration;
        
        const startTime = Date.now();
        const animateProgress = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const currentProgress = startProgress + (endProgress - startProgress) * progress;
          
          setEvolutionProgress(currentProgress);
          
          if (progress < 1) {
            requestAnimationFrame(animateProgress);
          }
        };
        
        animateProgress();
        
        // Wait for stage duration
        await new Promise(resolve => setTimeout(resolve, stage.duration));
      }
      
      // Call API to evolve pet
      const response = await post('/pets/evolve', {
        petId: selectedPet.id
      });
      
      if (response.data.success) {
        toast({
          title: 'Tiến hóa thành công! 🎉',
          description: `${selectedPet.name} đã tiến hóa thành ${evolutionData.newName}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Update pet data
        onPetEvolved?.(selectedPet.id, response.data.evolvedPet);
      }
      
    } catch (error) {
      toast({
        title: 'Tiến hóa thất bại',
        description: error.response?.data?.message || 'Có lỗi xảy ra trong quá trình tiến hóa',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsEvolving(false);
      setEvolutionProgress(0);
      onClose();
    }
  };
  
  // Render evolution modal
  const renderEvolutionModal = () => (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent>
        <ModalHeader textAlign="center">
          <HStack spacing={3} justify="center">
            <FaRocket color="purple" />
            <Text>Tiến Hóa Pet</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {selectedPet && evolutionData && (
            <VStack spacing={6} align="stretch">
              {/* Current Pet */}
              <Card>
                <CardHeader>
                  <Heading size="md" textAlign="center">Pet Hiện Tại</Heading>
                </CardHeader>
                <CardBody>
                  <HStack spacing={6} justify="center">
                    <AnimatedPet 
                      pet={selectedPet} 
                      isOwned={true} 
                      size="lg"
                      interactive={false}
                    />
                    <VStack spacing={2} align="start">
                      <Text fontWeight="bold">{selectedPet.name}</Text>
                      <Badge colorScheme={selectedPet.rarity}>
                        {selectedPet.rarity}
                      </Badge>
                      <Text fontSize="sm" color="gray.600">
                        Level: {selectedPet.userLevel || 1}
                      </Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
              
              {/* Evolution Arrow */}
              <Box textAlign="center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FaArrowUp size={40} color="purple" />
                </motion.div>
              </Box>
              
              {/* Evolved Pet Preview */}
              <Card bg="purple.50" border="2px solid" borderColor="purple.200">
                <CardHeader>
                  <Heading size="md" textAlign="center" color="purple.600">
                    Pet Sau Tiến Hóa
                  </Heading>
                </CardHeader>
                <CardBody>
                  <HStack spacing={6} justify="center">
                    <Box
                      w="120px"
                      h="120px"
                      borderRadius="full"
                      bg="purple.100"
                      border="3px solid"
                      borderColor="purple.400"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      position="relative"
                    >
                      <FaDragon size={48} color="purple" />
                      
                      {/* Evolution Effects */}
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 0.8, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ duration: 2, repeat: Infinity }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, purple.200 0%, transparent 70%)',
                            pointerEvents: 'none'
                          }}
                        />
                      </AnimatePresence>
                    </Box>
                    
                    <VStack spacing={2} align="start">
                      <Text fontWeight="bold" color="purple.600">
                        {evolutionData.newName}
                      </Text>
                      <Badge colorScheme="purple" variant="solid">
                        Tiến Hóa
                      </Badge>
                      <Text fontSize="sm" color="purple.600">
                        Level: {selectedPet.userLevel || 1}
                      </Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
              
              {/* Evolution Benefits */}
              <Card>
                <CardHeader>
                  <Heading size="md" textAlign="center">Lợi Ích Tiến Hóa</Heading>
                </CardHeader>
                <CardBody>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    {Object.entries(evolutionData.statIncrease).map(([stat, increase]) => (
                      <Box key={stat} p={3} bg="gray.50" borderRadius="md">
                        <HStack justify="space-between" mb={2}>
                          <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                            {stat}
                          </Text>
                          <Text fontSize="sm" fontWeight="bold" color="green.500">
                            +{increase}
                          </Text>
                        </HStack>
                        <Progress 
                          value={increase} 
                          max={100}
                          size="sm" 
                          colorScheme="green"
                          borderRadius="full"
                        />
                      </Box>
                    ))}
                  </Grid>
                  
                  {evolutionData.newAbilities.length > 0 && (
                    <Box mt={4}>
                      <Text fontWeight="bold" mb={2}>Khả Năng Mới:</Text>
                      <HStack spacing={2} flexWrap="wrap">
                        {evolutionData.newAbilities.map((ability, index) => (
                          <Badge key={index} colorScheme="purple" variant="subtle">
                            {ability}
                          </Badge>
                        ))}
                      </HStack>
                    </Box>
                  )}
                </CardBody>
              </Card>
              
              {/* Evolution Progress */}
              {isEvolving && (
                <Card>
                  <CardBody>
                    <VStack spacing={4}>
                      <Text fontWeight="bold" textAlign="center">
                        {evolutionStages[evolutionStage]?.name}
                      </Text>
                      
                      <Progress 
                        value={evolutionProgress} 
                        size="lg" 
                        colorScheme="purple"
                        borderRadius="full"
                        w="full"
                      />
                      
                      <Text fontSize="sm" color="gray.600">
                        {Math.round(evolutionProgress)}%
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          )}
        </ModalBody>
        
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose} isDisabled={isEvolving}>
              Hủy
            </Button>
            <Button 
              colorScheme="purple" 
              onClick={executeEvolution}
              isDisabled={isEvolving}
              leftIcon={isEvolving ? <Spinner size="sm" /> : <FaRocket />}
            >
              {isEvolving ? 'Đang Tiến Hóa...' : 'Bắt Đầu Tiến Hóa'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
  
  // Filter pets that can evolve
  const evolvablePets = userPets.filter(canEvolve);
  
  return (
    <Box>
      {/* Header */}
      <Box mb={6} textAlign="center">
        <Heading size="lg" mb={2}>
          <FaRocket style={{ display: 'inline', marginRight: '8px' }} />
          Hệ Thống Tiến Hóa Pet
        </Heading>
        <Text color="gray.600">
          Nâng cấp pets của bạn lên cấp độ cao hơn với sức mạnh vượt trội
        </Text>
      </Box>
      
      {/* Evolution Stats */}
      <Card mb={6} bg="purple.50" border="2px solid" borderColor="purple.200">
        <CardBody>
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            <Box textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                {userPets.length}
              </Text>
              <Text color="purple.600">Tổng số pets</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {evolvablePets.length}
              </Text>
              <Text color="green.600">Có thể tiến hóa</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                {userPets.filter(pet => pet.metadata?.evolution?.evolved).length}
              </Text>
              <Text color="orange.600">Đã tiến hóa</Text>
            </Box>
          </Grid>
        </CardBody>
      </Card>
      
      {/* Evolvable Pets Grid */}
      {evolvablePets.length === 0 ? (
        <Card>
          <CardBody textAlign="center" py={12}>
            <FaRocket size={48} color="gray" style={{ margin: '0 auto 16px' }} />
            <Text fontSize="lg" color="gray.500" mb={2}>
              Chưa có pet nào có thể tiến hóa
            </Text>
            <Text color="gray.400">
              Hãy nâng cấp level và sở hữu pets có khả năng tiến hóa
            </Text>
          </CardBody>
        </Card>
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={6}>
          {evolvablePets.map((pet) => {
            const requirements = getEvolutionRequirements(pet);
            const benefits = getEvolutionBenefits(pet);
            
            return (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card 
                  variant="outline"
                  _hover={{ 
                    transform: 'translateY(-2px)', 
                    shadow: 'lg',
                    borderColor: 'purple.400'
                  }}
                  transition="all 0.3s"
                >
                  <CardBody>
                    <VStack spacing={4}>
                      {/* Pet Display */}
                      <AnimatedPet 
                        pet={pet} 
                        isOwned={true} 
                        size="lg"
                        interactive={false}
                      />
                      
                      {/* Pet Info */}
                      <VStack spacing={2} textAlign="center">
                        <Text fontWeight="bold" fontSize="lg">{pet.name}</Text>
                        <Badge colorScheme={pet.rarity} size="lg">
                          {pet.rarity}
                        </Badge>
                        <Text fontSize="sm" color="gray.600">
                          Level: {pet.userLevel || 1}
                        </Text>
                      </VStack>
                      
                      {/* Evolution Requirements */}
                      {requirements && (
                        <Box w="full">
                          <Text fontWeight="bold" mb={2} textAlign="center">
                            Yêu cầu tiến hóa:
                          </Text>
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="sm">Level:</Text>
                              <Badge 
                                colorScheme={pet.userLevel >= requirements.level ? 'green' : 'red'}
                              >
                                {pet.userLevel || 1}/{requirements.level}
                              </Badge>
                            </HStack>
                            
                            {requirements.coins > 0 && (
                              <HStack justify="space-between">
                                <Text fontSize="sm">Coins:</Text>
                                <Badge colorScheme="yellow">
                                  {requirements.coins}
                                </Badge>
                              </HStack>
                            )}
                            
                            {requirements.gems > 0 && (
                              <HStack justify="space-between">
                                <Text fontSize="sm">Gems:</Text>
                                <Badge colorScheme="blue">
                                  {requirements.gems}
                                </Badge>
                              </HStack>
                            )}
                          </VStack>
                        </Box>
                      )}
                      
                      {/* Evolution Benefits Preview */}
                      {benefits && (
                        <Box w="full">
                          <Text fontWeight="bold" mb={2} textAlign="center">
                            Sau tiến hóa:
                          </Text>
                          <Text fontSize="sm" color="purple.600" textAlign="center">
                            {benefits.newName}
                          </Text>
                          <Text fontSize="xs" color="gray.500" textAlign="center">
                            +50 tất cả chỉ số
                          </Text>
                        </Box>
                      )}
                      
                      {/* Evolution Button */}
                      <Button 
                        colorScheme="purple" 
                        w="full"
                        onClick={() => startEvolution(pet)}
                        leftIcon={<FaRocket />}
                      >
                        Tiến Hóa
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </Grid>
      )}
      
      {/* Evolution Modal */}
      {renderEvolutionModal()}
    </Box>
  );
};

export default PetEvolutionSystem; 