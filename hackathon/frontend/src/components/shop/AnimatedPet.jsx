import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Text, 
  Badge, 
  VStack, 
  HStack, 
  Progress, 
  Tooltip, 
  IconButton,
  useColorModeValue,
  Image
} from '@chakra-ui/react';
import { 
  FaHeart, 
  FaBolt, 
  FaStar, 
  FaMagic, 
  FaFire, 
  FaShield,
  FaLeaf,
  FaWater,
  FaWind,
  FaEarth,
  FaLightbulb,
  FaDragon,
  FaPhoenix,
  FaUnicorn,
  FaCat,
  FaDog,
  FaFish,
  FaBird,
  FaHamster,
  FaRabbit,
  FaPaw
} from 'react-icons/fa';

const AnimatedPet = ({ 
  pet, 
  isOwned = false, 
  onInteract, 
  size = 'lg',
  showStats = true,
  interactive = true,
  className = ''
}) => {
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [isAnimating, setIsAnimating] = useState(false);
  const [mood, setMood] = useState('happy');
  const [energy, setEnergy] = useState(100);
  const [happiness, setHappiness] = useState(100);
  const animationRef = useRef(null);
  
  // Pet species icons mapping
  const petIcons = {
    cat: FaCat,
    dog: FaDog,
    bird: FaBird,
    fish: FaFish,
    hamster: FaHamster,
    rabbit: FaRabbit,
    dragon: FaDragon,
    phoenix: FaPhoenix,
    unicorn: FaUnicorn
  };
  
  // Element icons for special pets
  const elementIcons = {
    fire: FaFire,
    water: FaWater,
    earth: FaEarth,
    wind: FaWind,
    light: FaLightbulb,
    magic: FaMagic
  };
  
  const IconComponent = petIcons[pet.species] || FaPaw;
  
  // Animation configurations
  const animations = {
    idle: { 
      scale: [1, 1.02, 1], 
      rotate: [0, 1, -1, 0],
      y: [0, -2, 0]
    },
    happy: { 
      scale: [1, 1.15, 1], 
      rotate: [0, 8, -8, 0],
      y: [0, -5, 0]
    },
    sad: { 
      scale: [1, 0.9, 1], 
      rotate: [0, -3, 3, 0],
      y: [0, 2, 0]
    },
    sleeping: { 
      scale: [1, 0.95, 1], 
      rotate: [0, 0.5, -0.5, 0],
      y: [0, 1, 0]
    },
    eating: { 
      scale: [1, 1.1, 1], 
      rotate: [0, 2, -2, 0],
      y: [0, -3, 0]
    },
    flying: {
      scale: [1, 1.05, 1],
      y: [0, -8, 0],
      rotate: [0, 5, -5, 0]
    },
    magic: {
      scale: [1, 1.2, 1],
      rotate: [0, 15, -15, 0],
      y: [0, -10, 0]
    },
    battle: {
      scale: [1, 1.1, 1],
      x: [0, 5, -5, 0],
      rotate: [0, 10, -10, 0]
    }
  };
  
  // Mood-based animations
  const moodAnimations = {
    happy: { scale: 1.05, rotate: 5 },
    sad: { scale: 0.95, rotate: -3 },
    excited: { scale: 1.1, rotate: 8 },
    calm: { scale: 1, rotate: 0 }
  };
  
  // Get rarity color
  const getRarityColor = (rarity) => {
    const colors = {
      common: 'gray',
      rare: 'blue',
      epic: 'purple',
      legendary: 'orange',
      mythic: 'red'
    };
    return colors[rarity] || 'gray';
  };
  
  // Get element color
  const getElementColor = (element) => {
    const colors = {
      fire: 'red',
      water: 'blue',
      earth: 'green',
      wind: 'cyan',
      light: 'yellow',
      magic: 'purple'
    };
    return colors[element] || 'gray';
  };
  
  // Handle pet interaction
  const handleInteraction = () => {
    if (!interactive || !isOwned) return;
    
    const animationStates = ['happy', 'excited', 'magic', 'flying'];
    const randomAnimation = animationStates[Math.floor(Math.random() * animationStates.length)];
    
    setIsAnimating(true);
    setCurrentAnimation(randomAnimation);
    setMood('excited');
    
    // Increase happiness and energy
    setHappiness(prev => Math.min(100, prev + 5));
    setEnergy(prev => Math.min(100, prev + 3));
    
    setTimeout(() => {
      setIsAnimating(false);
      setCurrentAnimation('idle');
      setMood('happy');
    }, 3000);
    
    onInteract?.(pet);
  };
  
  // Auto-animation cycle
  useEffect(() => {
    if (!interactive) return;
    
    const interval = setInterval(() => {
      if (!isAnimating) {
        const autoAnimations = ['idle', 'happy', 'calm'];
        const randomAuto = autoAnimations[Math.floor(Math.random() * autoAnimations.length)];
        setCurrentAnimation(randomAuto);
        
        // Gradually decrease stats
        setEnergy(prev => Math.max(0, prev - 0.5));
        setHappiness(prev => Math.max(0, prev - 0.3));
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAnimating, interactive]);
  
  // Pet size mapping
  const sizeMap = {
    xs: { iconSize: 16, containerSize: 60, fontSize: 'xs' },
    sm: { iconSize: 24, containerSize: 80, fontSize: 'sm' },
    md: { iconSize: 32, containerSize: 100, fontSize: 'md' },
    lg: { iconSize: 48, containerSize: 120, fontSize: 'lg' },
    xl: { iconSize: 64, containerSize: 150, fontSize: 'xl' }
  };
  
  const { iconSize, containerSize, fontSize } = sizeMap[size];
  
  // Check if pet has special abilities
  const hasSpecialAbility = pet.metadata?.abilities?.some(ability => 
    ['magic', 'flying', 'battle', 'evolution'].includes(ability.toLowerCase())
  );
  
  // Check if pet has element
  const petElement = pet.metadata?.abilities?.find(ability => 
    ['fire', 'water', 'earth', 'wind', 'light', 'magic'].includes(ability.toLowerCase())
  );
  
  const ElementIcon = petElement ? elementIcons[petElement] : null;
  
  return (
    <motion.div
      ref={animationRef}
      animate={isAnimating ? animations[currentAnimation] : animations[currentAnimation]}
      transition={{ 
        duration: 0.8, 
        repeat: isAnimating ? 2 : Infinity, 
        repeatType: "reverse",
        ease: "easeInOut"
      }}
      whileHover={interactive ? { scale: 1.05, y: -5 } : {}}
      whileTap={interactive ? { scale: 0.95 } : {}}
      onClick={handleInteraction}
      style={{ 
        cursor: interactive && isOwned ? 'pointer' : 'default',
        display: 'inline-block'
      }}
      className={className}
    >
      <VStack spacing={3} align="center">
        {/* Pet Container */}
        <Box
          position="relative"
          w={containerSize}
          h={containerSize}
          borderRadius="full"
          bg={useColorModeValue('blue.50', 'blue.900')}
          border="3px solid"
          borderColor={isOwned ? 'green.400' : getRarityColor(pet.rarity) + '.300'}
          _hover={{
            borderColor: isOwned ? 'green.500' : getRarityColor(pet.rarity) + '.500',
            transform: 'translateY(-2px)',
            shadow: 'xl'
          }}
          transition="all 0.3s"
          overflow="hidden"
        >
          {/* Pet Icon */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            textAlign="center"
          >
            <IconComponent 
              size={iconSize} 
              color={getRarityColor(pet.rarity) + '.500'}
            />
            
            {/* Element Icon Overlay */}
            {ElementIcon && (
              <Box
                position="absolute"
                top="-5px"
                right="-5px"
                bg={getElementColor(petElement) + '.500'}
                borderRadius="full"
                p={1}
                boxSize="20px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <ElementIcon size={12} color="white" />
              </Box>
            )}
          </Box>
          
          {/* Special Effects */}
          {hasSpecialAbility && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.6, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${getRarityColor(pet.rarity)}.200 0%, transparent 70%)`,
                  pointerEvents: 'none'
                }}
              />
            </AnimatePresence>
          )}
          
          {/* Ownership Badge */}
          {isOwned && (
            <Box
              position="absolute"
              top="5px"
              right="5px"
              bg="green.500"
              borderRadius="full"
              boxSize="20px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontSize="xs"
              fontWeight="bold"
            >
              ✓
            </Box>
          )}
          
          {/* Rarity Badge */}
          <Box
            position="absolute"
            bottom="5px"
            left="5px"
          >
            <Badge 
              colorScheme={getRarityColor(pet.rarity)} 
              size="sm"
              variant="solid"
              borderRadius="full"
              px={2}
            >
              {pet.rarity}
            </Badge>
          </Box>
        </Box>
        
        {/* Pet Name */}
        <Text 
          fontSize={fontSize} 
          fontWeight="bold" 
          textAlign="center"
          color={useColorModeValue('gray.800', 'white')}
          maxW="150px"
          noOfLines={2}
        >
          {pet.name}
        </Text>
        
        {/* Pet Stats (if enabled and owned) */}
        {showStats && isOwned && pet.metadata?.stats && (
          <VStack spacing={2} w="full" maxW="200px">
            {/* Happiness */}
            <Box w="full">
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color="gray.600">
                  <FaHeart style={{ display: 'inline', marginRight: '4px' }} />
                  Happiness
                </Text>
                <Text fontSize="xs" fontWeight="bold">{happiness}%</Text>
              </HStack>
              <Progress 
                value={happiness} 
                size="sm" 
                colorScheme="pink"
                borderRadius="full"
              />
            </Box>
            
            {/* Energy */}
            <Box w="full">
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color="gray.600">
                  <FaBolt style={{ display: 'inline', marginRight: '4px' }} />
                  Energy
                </Text>
                <Text fontSize="xs" fontWeight="bold">{energy}%</Text>
              </HStack>
              <Progress 
                value={energy} 
                size="sm" 
                colorScheme="yellow"
                borderRadius="full"
              />
            </Box>
            
            {/* Special Stats */}
            {Object.entries(pet.metadata.stats)
              .filter(([key]) => !['happiness', 'energy'].includes(key))
              .slice(0, 2)
              .map(([stat, value]) => (
                <Box key={stat} w="full">
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="xs" color="gray.600" textTransform="capitalize">
                      {stat}
                    </Text>
                    <Text fontSize="xs" fontWeight="bold">{value}</Text>
                  </HStack>
                  <Progress 
                    value={value} 
                    max={200}
                    size="sm" 
                    colorScheme={getRarityColor(pet.rarity)}
                    borderRadius="full"
                  />
                </Box>
              ))}
          </VStack>
        )}
        
        {/* Interaction Hint */}
        {interactive && isOwned && (
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Click để tương tác
          </Text>
        )}
      </VStack>
    </motion.div>
  );
};

export default AnimatedPet; 