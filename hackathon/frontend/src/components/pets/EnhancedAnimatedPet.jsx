import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Box, 
  Image, 
  Text, 
  VStack, 
  HStack, 
  Badge, 
  IconButton, 
  Tooltip,
  Progress,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Avatar,
  AvatarBadge,
  Divider,
  Wrap,
  WrapItem,
  useClipboard
} from '@chakra-ui/react';
import { 
  FaHeart, 
  FaBolt, 
  FaBrain, 
  FaShield, 
  FaStar, 
  FaPlay, 
  FaPause, 
  FaVolumeUp, 
  FaVolumeMute,
  FaShare,
  FaCamera,
  FaGift,
  FaMagic,
  FaFire,
  FaWater,
  FaLeaf,
  FaWind,
  FaLightbulb,
  FaCrown,
  FaGem,
  FaCoins
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import useApi from '../../hooks/useApi';

// Particle effect component
const ParticleEffect = ({ type, position, duration = 1000 }) => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const particleTypes = {
      sparkles: ['✨', '⭐', '💫', '🌟'],
      hearts: ['❤️', '💖', '💝', '💕'],
      tears: ['💧', '🌧️', '☔'],
      clouds: ['☁️', '🌥️', '⛅'],
      zzz: ['💤', '😴', '🛌'],
      moon: ['🌙', '🌛', '🌜'],
      nom: ['🍖', '🥩', '🍗'],
      crumbs: ['🍞', '🥖', '🥨'],
      footsteps: ['👣', '🦶', '👟'],
      speed: ['💨', '🌪️', '⚡'],
      wind: ['💨', '🌬️', '🍃'],
      bounce: ['🦘', '🏀', '⚽'],
      stars: ['⭐', '🌟', '💫'],
      music: ['🎵', '🎶', '🎼'],
      confetti: ['🎊', '🎉', '🎈'],
      fire: ['🔥', '💥', '⚡'],
      lightning: ['⚡', '💥', '🔥'],
      heal: ['💚', '💙', '💜'],
      light: ['💡', '🌟', '✨'],
      evolution: ['🌈', '✨', '💫'],
      rainbow: ['🌈', '🎨', '✨']
    };
    
    const particleArray = particleTypes[type] || ['✨'];
    const newParticles = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      emoji: particleArray[Math.floor(Math.random() * particleArray.length)],
      x: position.x + (Math.random() - 0.5) * 100,
      y: position.y + (Math.random() - 0.5) * 100,
      rotation: Math.random() * 360,
      scale: Math.random() * 0.5 + 0.5
    }));
    
    setParticles(newParticles);
    
    const timer = setTimeout(() => {
      setParticles([]);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [type, position, duration]);
  
  return (
    <Box position="absolute" pointerEvents="none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ 
            opacity: 0, 
            scale: 0, 
            x: position.x, 
            y: position.y 
          }}
          animate={{ 
            opacity: [0, 1, 0], 
            scale: [0, particle.scale, 0],
            x: particle.x,
            y: particle.y,
            rotate: particle.rotation
          }}
          transition={{ duration: duration / 1000, ease: "easeOut" }}
          style={{
            position: 'absolute',
            fontSize: '20px',
            zIndex: 1000
          }}
        >
          {particle.emoji}
        </motion.div>
      ))}
    </Box>
  );
};

// Enhanced Animated Pet Component
const EnhancedAnimatedPet = ({ 
  pet, 
  isOwned = false, 
  onInteract, 
  size = 'lg',
  showStats = true,
  showActions = true,
  isPreview = false
}) => {
  const { user } = useAuth();
  const { get, post } = useApi();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { hasCopied, onCopy } = useClipboard(pet?.id || '');
  
  // Animation states
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [particlePosition, setParticlePosition] = useState({ x: 0, y: 0 });
  const [currentFrame, setCurrentFrame] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  
  // Pet interaction states
  const [petStats, setPetStats] = useState(pet?.baseStats || {});
  const [currentMood, setCurrentMood] = useState('happy');
  const [interactionCooldown, setInteractionCooldown] = useState(0);
  const [lastInteraction, setLastInteraction] = useState(null);
  
  // Refs
  const petRef = useRef(null);
  const animationRef = useRef(null);
  const controls = useAnimation();
  
  // Animation variants
  const animationVariants = {
    idle: {
      scale: [1, 1.02, 1],
      rotate: [0, 1, -1, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    },
    happy: {
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
      transition: { duration: 1, ease: "easeInOut" }
    },
    sad: {
      scale: [1, 0.95, 1],
      rotate: [0, -2, 2, 0],
      transition: { duration: 2, ease: "easeInOut" }
    },
    sleeping: {
      scale: [1, 1.05, 1],
      rotate: [0, 1, -1, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    },
    eating: {
      scale: [1, 1.15, 1],
      rotate: [0, 3, -3, 0],
      transition: { duration: 0.8, ease: "easeInOut" }
    },
    walking: {
      x: [-5, 5, -5],
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    running: {
      x: [-10, 10, -10],
      scale: [1, 1.1, 1],
      transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    },
    jumping: {
      y: [0, -20, 0],
      scale: [1, 1.2, 1],
      transition: { duration: 0.8, ease: "bounceOut" }
    },
    dancing: {
      rotate: [0, 15, -15, 0],
      scale: [1, 1.1, 1],
      transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    },
    fighting: {
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
      transition: { duration: 0.6, ease: "easeInOut" }
    },
    healing: {
      scale: [1, 1.15, 1],
      opacity: [1, 0.8, 1],
      transition: { duration: 2, ease: "easeInOut" }
    },
    evolving: {
      scale: [1, 1.5, 1],
      rotate: [0, 360, 0],
      transition: { duration: 3, ease: "easeInOut" }
    }
  };
  
  // Get animation data from pet
  const getAnimationData = (animationType) => {
    if (!pet?.animations?.[animationType]) return null;
    return pet.animations[animationType];
  };
  
  // Handle pet interaction
  const handleInteraction = useCallback(async (interactionType) => {
    if (!isOwned || isAnimating || interactionCooldown > 0) return;
    
    try {
      setIsAnimating(true);
      setCurrentAnimation(interactionType);
      
      // Update particle position
      if (petRef.current) {
        const rect = petRef.current.getBoundingClientRect();
        setParticlePosition({ x: rect.width / 2, y: rect.height / 2 });
      }
      
      // Call interaction API
      if (onInteract) {
        await onInteract(interactionType, pet.id);
      }
      
      // Update pet stats based on interaction
      const interactionEffects = {
        pet: { happiness: 5, energy: -2 },
        feed: { happiness: 8, energy: 10 },
        play: { happiness: 10, energy: -5 },
        train: { intelligence: 5, loyalty: 3 },
        heal: { energy: 15, happiness: 3 }
      };
      
      if (interactionEffects[interactionType]) {
        const effects = interactionEffects[interactionType];
        setPetStats(prev => {
          const newStats = { ...prev };
          Object.keys(effects).forEach(stat => {
            if (newStats[stat]) {
              newStats[stat] = Math.min(100, Math.max(0, newStats[stat] + effects[stat]));
            }
          });
          return newStats;
        });
      }
      
      // Set cooldown
      setInteractionCooldown(5);
      setLastInteraction(interactionType);
      
      // Show success message
      toast({
        title: 'Interaction Successful!',
        description: `${pet.name} enjoyed the ${interactionType}!`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      // Reset animation after duration
      const animationData = getAnimationData(interactionType);
      if (animationData) {
        setTimeout(() => {
          setCurrentAnimation('idle');
          setIsAnimating(false);
        }, animationData.duration);
      } else {
        setTimeout(() => {
          setCurrentAnimation('idle');
          setIsAnimating(false);
        }, 2000);
      }
      
    } catch (error) {
      console.error('Interaction error:', error);
      toast({
        title: 'Interaction Failed',
        description: 'Something went wrong with the interaction.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsAnimating(false);
    }
  }, [isOwned, isAnimating, interactionCooldown, pet, onInteract, toast]);
  
  // Auto-animation cycle
  useEffect(() => {
    if (!isPlaying || isAnimating) return;
    
    const animationCycle = ['idle', 'happy', 'idle', 'sleeping', 'idle'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (!isAnimating) {
        currentIndex = (currentIndex + 1) % animationCycle.length;
        setCurrentAnimation(animationCycle[currentIndex]);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPlaying, isAnimating]);
  
  // Cooldown timer
  useEffect(() => {
    if (interactionCooldown <= 0) return;
    
    const timer = setInterval(() => {
      setInteractionCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [interactionCooldown]);
  
  // Handle animation changes
  useEffect(() => {
    if (currentAnimation && !isAnimating) {
      controls.start(animationVariants[currentAnimation]);
    }
  }, [currentAnimation, isAnimating, controls]);
  
  // Get pet rarity color
  const getRarityColor = (rarity) => {
    const colors = {
      common: 'gray',
      rare: 'blue',
      epic: 'purple',
      legendary: 'orange',
      mythical: 'pink'
    };
    return colors[rarity] || 'gray';
  };
  
  // Get pet species icon
  const getSpeciesIcon = (species) => {
    const icons = {
      cat: '🐱',
      dog: '🐕',
      bird: '🐦',
      fish: '🐠',
      hamster: '🐹',
      rabbit: '🐰',
      dragon: '🐉',
      phoenix: '🦅',
      unicorn: '🦄',
      butterfly: '🦋',
      dolphin: '🐬',
      elephant: '🐘',
      fox: '🦊',
      giraffe: '🦒',
      horse: '🐎',
      koala: '🐨',
      lion: '🦁',
      monkey: '🐒',
      owl: '🦉',
      panda: '🐼',
      penguin: '🐧',
      shark: '🦈',
      tiger: '🐯',
      wolf: '🐺',
      zebra: '🦓',
      alien: '👽',
      robot: '🤖',
      ghost: '👻'
    };
    return icons[species] || '🐾';
  };
  
  if (!pet) return null;
  
  const animationData = getAnimationData(currentAnimation);
  const isInteractive = pet.isInteractive && isOwned;
  
  return (
    <>
      <VStack spacing={4} align="center">
        {/* Pet Display */}
        <Box
          ref={petRef}
          position="relative"
          cursor={isInteractive ? 'pointer' : 'default'}
          onClick={() => isInteractive && handleInteraction('pet')}
        >
          {/* Main Pet Animation */}
          <motion.div
            ref={animationRef}
            animate={controls}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <Box
              position="relative"
              width={size === 'sm' ? '80px' : size === 'md' ? '120px' : '160px'}
              height={size === 'sm' ? '80px' : size === 'md' ? '120px' : '160px'}
              display="flex"
              justifyContent="center"
              alignItems="center"
              fontSize={size === 'sm' ? '40px' : size === 'md' ? '60px' : '80px'}
            >
              {/* Animated GIF or Sprite */}
              {animationData?.gif ? (
                <Image
                  src={animationData.gif}
                  alt={`${pet.name} ${currentAnimation}`}
                  width="100%"
                  height="100%"
                  objectFit="contain"
                  borderRadius="lg"
                />
              ) : (
                <Text fontSize="inherit">
                  {getSpeciesIcon(pet.species)}
                </Text>
              )}
              
              {/* Pet Name Badge */}
              <Badge
                position="absolute"
                top="-10px"
                left="50%"
                transform="translateX(-50%)"
                colorScheme={getRarityColor(pet.rarity)}
                variant="solid"
                borderRadius="full"
                px={2}
                py={1}
                fontSize="xs"
              >
                {pet.name}
              </Badge>
              
              {/* Rarity Badge */}
              <Badge
                position="absolute"
                top="-10px"
                right="-10px"
                colorScheme={getRarityColor(pet.rarity)}
                variant="outline"
                borderRadius="full"
                px={2}
                py={1}
                fontSize="xs"
              >
                {pet.rarity}
              </Badge>
              
              {/* Animation Controls */}
              {showActions && (
                <HStack
                  position="absolute"
                  bottom="-40px"
                  left="50%"
                  transform="translateX(-50%)"
                  spacing={2}
                >
                  <Tooltip label={isPlaying ? 'Pause' : 'Play'}>
                    <IconButton
                      size="sm"
                      icon={isPlaying ? <FaPause /> : <FaPlay />}
                      onClick={() => setIsPlaying(!isPlaying)}
                      colorScheme="blue"
                      variant="ghost"
                    />
                  </Tooltip>
                  
                  <Tooltip label={isMuted ? 'Unmute' : 'Mute'}>
                    <IconButton
                      size="sm"
                      icon={isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                      onClick={() => setIsMuted(!isMuted)}
                      colorScheme="blue"
                      variant="ghost"
                    />
                  </Tooltip>
                </HStack>
              )}
            </Box>
          </motion.div>
          
          {/* Particle Effects */}
          {animationData?.effects && animationData.effects.length > 0 && (
            <ParticleEffect
              type={animationData.effects[0]}
              position={particlePosition}
              duration={animationData.duration}
            />
          )}
        </Box>
        
        {/* Pet Stats */}
        {showStats && (
          <VStack spacing={2} width="100%">
            {/* Basic Stats */}
            <Wrap spacing={2} justify="center">
              <WrapItem>
                <Stat size="sm" textAlign="center">
                  <StatLabel color="red.500">
                    <FaHeart />
                  </StatLabel>
                  <StatNumber fontSize="sm">{petStats.happiness || 0}</StatNumber>
                </Stat>
              </WrapItem>
              
              <WrapItem>
                <Stat size="sm" textAlign="center">
                  <StatLabel color="yellow.500">
                    <FaBolt />
                  </StatLabel>
                  <StatNumber fontSize="sm">{petStats.energy || 0}</StatNumber>
                </Stat>
              </WrapItem>
              
              <WrapItem>
                <Stat size="sm" textAlign="center">
                  <StatLabel color="blue.500">
                    <FaBrain />
                  </StatLabel>
                  <StatNumber fontSize="sm">{petStats.intelligence || 0}</StatNumber>
                </Stat>
              </WrapItem>
              
              <WrapItem>
                <Stat size="sm" textAlign="center">
                  <StatLabel color="green.500">
                    <FaShield />
                  </StatLabel>
                  <StatNumber fontSize="sm">{petStats.loyalty || 0}</StatNumber>
                </Stat>
              </WrapItem>
            </Wrap>
            
            {/* Progress Bars */}
            <VStack spacing={1} width="100%">
              <Box width="100%">
                <Text fontSize="xs" mb={1}>Happiness</Text>
                <Progress 
                  value={petStats.happiness || 0} 
                  colorScheme="red" 
                  size="sm" 
                  borderRadius="full"
                />
              </Box>
              
              <Box width="100%">
                <Text fontSize="xs" mb={1}>Energy</Text>
                <Progress 
                  value={petStats.energy || 0} 
                  colorScheme="yellow" 
                  size="sm" 
                  borderRadius="full"
                />
              </Box>
            </VStack>
          </VStack>
        )}
        
        {/* Interaction Buttons */}
        {showActions && isInteractive && (
          <VStack spacing={2} width="100%">
            <HStack spacing={2} wrap="wrap" justify="center">
              <Tooltip label="Pet (Happiness +5, Energy -2)">
                <IconButton
                  size="sm"
                  icon={<FaHeart />}
                  onClick={() => handleInteraction('pet')}
                  colorScheme="red"
                  variant="outline"
                  isDisabled={interactionCooldown > 0}
                />
              </Tooltip>
              
              <Tooltip label="Feed (Happiness +8, Energy +10)">
                <IconButton
                  size="sm"
                  icon={<FaGift />}
                  onClick={() => handleInteraction('feed')}
                  colorScheme="green"
                  variant="outline"
                  isDisabled={interactionCooldown > 0}
                />
              </Tooltip>
              
              <Tooltip label="Play (Happiness +10, Energy -5)">
                <IconButton
                  size="sm"
                  icon={<FaPlay />}
                  onClick={() => handleInteraction('play')}
                  colorScheme="blue"
                  variant="outline"
                  isDisabled={interactionCooldown > 0}
                />
              </Tooltip>
              
              <Tooltip label="Train (Intelligence +5, Loyalty +3)">
                <IconButton
                  size="sm"
                  icon={<FaBrain />}
                  onClick={() => handleInteraction('train')}
                  colorScheme="purple"
                  variant="outline"
                  isDisabled={interactionCooldown > 0}
                />
              </Tooltip>
              
              <Tooltip label="Heal (Energy +15, Happiness +3)">
                <IconButton
                  size="sm"
                  icon={<FaMagic />}
                  onClick={() => handleInteraction('heal')}
                  colorScheme="teal"
                  variant="outline"
                  isDisabled={interactionCooldown > 0}
                />
              </Tooltip>
            </HStack>
            
            {/* Cooldown Display */}
            {interactionCooldown > 0 && (
              <Text fontSize="xs" color="gray.500">
                Cooldown: {interactionCooldown}s
              </Text>
            )}
            
            {/* Last Interaction */}
            {lastInteraction && (
              <Text fontSize="xs" color="green.500">
                Last: {lastInteraction}
              </Text>
            )}
          </VStack>
        )}
        
        {/* Pet Details Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onOpen}
          leftIcon={<FaStar />}
        >
          View Details
        </Button>
      </VStack>
      
      {/* Pet Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{pet.name} - Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              {/* Pet Info */}
              <Box>
                <Text fontWeight="bold" mb={2}>Species: {pet.species}</Text>
                <Text fontWeight="bold" mb={2}>Rarity: {pet.rarity}</Text>
                <Text mb={2}>{pet.description}</Text>
              </Box>
              
              {/* Abilities */}
              {pet.abilities && pet.abilities.length > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={2}>Abilities:</Text>
                  <Wrap spacing={2}>
                    {pet.abilities.map((ability, index) => (
                      <WrapItem key={index}>
                        <Badge colorScheme="blue" variant="outline">
                          {ability.replace(/_/g, ' ')}
                        </Badge>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}
              
              {/* Personality */}
              {pet.personality && (
                <Box>
                  <Text fontWeight="bold" mb={2}>Personality:</Text>
                  <VStack spacing={2} align="stretch">
                    {pet.personality.traits && (
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold">Traits:</Text>
                        <Wrap spacing={1}>
                          {pet.personality.traits.map((trait, index) => (
                            <WrapItem key={index}>
                              <Badge size="sm" colorScheme="purple">
                                {trait.replace(/_/g, ' ')}
                              </Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                    )}
                    
                    {pet.personality.likes && (
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold">Likes:</Text>
                        <Wrap spacing={1}>
                          {pet.personality.likes.map((like, index) => (
                            <WrapItem key={index}>
                              <Badge size="sm" colorScheme="green">
                                {like.replace(/_/g, ' ')}
                              </Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                    )}
                  </VStack>
                </Box>
              )}
              
              {/* Evolution Info */}
              {pet.evolution && pet.evolution.canEvolve && (
                <Box>
                  <Text fontWeight="bold" mb={2}>Evolution:</Text>
                  <Text fontSize="sm">
                    Level {pet.evolution.evolutionLevel} of {pet.evolution.maxEvolutionLevel}
                  </Text>
                  {pet.evolution.evolutionRequirements?.level2 && (
                    <Text fontSize="sm" color="gray.600">
                      Next evolution requires: Level {pet.evolution.evolutionRequirements.level2.level}
                    </Text>
                  )}
                </Box>
              )}
              
              {/* Actions */}
              <HStack spacing={2} justify="center">
                <Button
                  size="sm"
                  leftIcon={<FaShare />}
                  onClick={onCopy}
                  colorScheme="blue"
                  variant="outline"
                >
                  {hasCopied ? 'Copied!' : 'Share ID'}
                </Button>
                
                <Button
                  size="sm"
                  leftIcon={<FaCamera />}
                  onClick={() => {
                    // Implement screenshot functionality
                    toast({
                      title: 'Screenshot',
                      description: 'Screenshot feature coming soon!',
                      status: 'info',
                      duration: 2000,
                      isClosable: true,
                    });
                  }}
                  colorScheme="green"
                  variant="outline"
                >
                  Screenshot
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default EnhancedAnimatedPet; 