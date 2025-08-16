import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Card,
  CardBody,
  Heading,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { motion, AnimatePresence   } from 'framer-motion';
import { 
  FiAward, 
  FiStar, 
  FiZap, 
  FiTrendingUp,
  FiGift,
  FiCheckCircle,
  FiX
} from 'react-icons/fi';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

// Achievement notification popup that appears when user unlocks achievements
export default function AchievementNotification({ 
  achievements = [], 
  onClose, 
  isVisible = false 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRewards, setShowRewards] = useState(false);
  const { isOpen, onOpen, onClose: closeModal } = useDisclosure();
  const _toast = useToast();

  useEffect(() => {
    if (achievements.length > 0 && isVisible) {
      onOpen();
      setCurrentIndex(0);
      setShowRewards(false);
    }
  }, [achievements, isVisible, onOpen]);

  const _currentAchievement = achievements[currentIndex];

  const _handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowRewards(false);
    } else {
      handleClose();
    }
  };

  const _handleClose = () => {
    closeModal();
    setCurrentIndex(0);
    setShowRewards(false);
    if (onClose) onClose();
  };

  const _getRarityColor = (_rarity) => {
    const colors = {
      common: 'gray',
      rare: 'blue',
      epic: 'purple',
      legendary: 'orange',
      mythic: 'pink'
    };
    return colors[rarity] || 'gray';
  };

  const _getRarityGlow = (_rarity) => {
    const glows = {
      common: '0 0 10px rgba(128, 128, 128, 0.5)',
      rare: '0 0 20px rgba(59, 130, 246, 0.6)',
      epic: '0 0 25px rgba(147, 51, 234, 0.7)',
      legendary: '0 0 30px rgba(249, 115, 22, 0.8)',
      mythic: '0 0 35px rgba(236, 72, 153, 0.9)'
    };
    return glows[rarity] || glows.common;
  };

  if (!_currentAchievement) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal 
          isOpen={isOpen} 
          onClose={handleClose}
          size="lg"
          closeOnOverlayClick={false}
          isCentered
        >
          <ModalOverlay 
            bg="blackAlpha.800" 
            backdropFilter="blur(10px)"
          />
          <ModalContent
            bg="transparent"
            boxShadow="none"
            maxW="500px"
          >
            <MotionCard
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -50 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20,
                duration: 0.6
              }}
              bg="white"
              borderRadius="xl"
              overflow="hidden"
              position="relative"
              boxShadow={_getRarityGlow(_currentAchievement.rarity)}
              border="3px solid"
              borderColor={`${_getRarityColor(_currentAchievement.rarity)}.300`}
            >
              {/* Close Button */}
              <Button
                position="absolute"
                top={2}
                right={2}
                size="sm"
                variant="ghost"
                onClick={handleClose}
                zIndex={10}
                color="gray.500"
                _hover={{ color: "gray.700", bg: "gray.100" }}
              >
                <Icon as={FiX} />
              </Button>

              {/* Header with celebration effect */}
              <Box
                bg={`${_getRarityColor(_currentAchievement.rarity)}.500`}
                color="white"
                p={6}
                textAlign="center"
                position="relative"
                overflow="hidden"
              >
                {/* Animated background particles */}
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  opacity={0.2}
                >
                  {[...Array(20)].map((_, i) => (
                    <MotionBox
                      key={i}
                      position="absolute"
                      w="4px"
                      h="4px"
                      bg="white"
                      borderRadius="full"
                      initial={{ 
                        x: Math.random() * 400,
                        y: Math.random() * 100,
                        opacity: 0
                      }}
                      animate={{ 
                        y: -20,
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: Math.random() * 2
                      }}
                    />
                  ))}
                </Box>

                <VStack spacing={3} position="relative" zIndex={1}>
                  <MotionBox
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <Text fontSize="6xl" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))">
                      {_currentAchievement.icon}
                    </Text>
                  </MotionBox>
                  
                  <VStack spacing={1}>
                    <Heading size="lg" textShadow="0 2px 4px rgba(0,0,0,0.3)">
                      Achievement Unlocked!
                    </Heading>
                    <Badge 
                      colorScheme={_getRarityColor(_currentAchievement.rarity)}
                      variant="solid"
                      fontSize="sm"
                      px={3}
                      py={1}
                      borderRadius="full"
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      {_currentAchievement.rarity}
                    </Badge>
                  </VStack>
                </VStack>
              </Box>

              <CardBody p={6}>
                <VStack spacing={4} align="stretch">
                  {/* Achievement Details */}
                  <VStack spacing={2} textAlign="center">
                    <Heading size="md" color={`${_getRarityColor(_currentAchievement.rarity)}.600`}>
                      {_currentAchievement.name}
                    </Heading>
                    <Text color="gray.600" fontSize="sm">
                      {_currentAchievement.description}
                    </Text>
                    {_currentAchievement.unlockMessage && (
                      <Text 
                        color={`${_getRarityColor(_currentAchievement.rarity)}.500`}
                        fontSize="sm"
                        fontStyle="italic"
                        fontWeight="medium"
                      >
                        "{_currentAchievement.unlockMessage}"
                      </Text>
                    )}
                  </VStack>

                  <Divider />

                  {/* Rewards Section */}
                  <VStack spacing={3}>
                    <HStack>
                      <Icon as={FiGift} color={`${_getRarityColor(_currentAchievement.rarity)}.500`} />
                      <Text fontWeight="bold" color={`${_getRarityColor(_currentAchievement.rarity)}.600`}>
                        Rewards Earned
                      </Text>
                    </HStack>
                    
                    <SimpleGrid columns={3} spacing={3} w="full">
                      {_currentAchievement.rewards?.xp && (
                        <Stat textAlign="center">
                          <StatLabel fontSize="xs">XP</StatLabel>
                          <StatNumber color="blue.600" fontSize="lg">
                            +{_currentAchievement.rewards.xp}
                          </StatNumber>
                        </Stat>
                      )}
                      
                      {_currentAchievement.rewards?.coins && (
                        <Stat textAlign="center">
                          <StatLabel fontSize="xs">Coins</StatLabel>
                          <StatNumber color="yellow.600" fontSize="lg">
                            +{_currentAchievement.rewards.coins}
                          </StatNumber>
                        </Stat>
                      )}
                      
                      {_currentAchievement.rewards?.gems && (
                        <Stat textAlign="center">
                          <StatLabel fontSize="xs">Gems</StatLabel>
                          <StatNumber color="purple.600" fontSize="lg">
                            +{_currentAchievement.rewards.gems}
                          </StatNumber>
                        </Stat>
                      )}
                    </SimpleGrid>

                    {/* Unlocked Items */}
                    {_currentAchievement.rewards?.unlock && _currentAchievement.rewards.unlock.length > 0 && (
                      <Box w="full">
                        <Text fontSize="sm" fontWeight="medium" mb={2} textAlign="center">
                          🔓 Unlocked Items:
                        </Text>
                        <HStack justify="center" wrap="wrap">
                          {_currentAchievement.rewards.unlock.map((item, index) => (
                            <Badge 
                              key={index}
                              colorScheme="green" 
                              variant="outline"
                              fontSize="xs"
                            >
                              {item.replace('', ' ')}
                            </Badge>
                          ))}
                        </HStack>
                      </Box>
                    )}
                  </VStack>

                  <Divider />

                  {/* Action Buttons */}
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.500">
                      {currentIndex + 1} of {achievements.length}
                    </Text>
                    
                    <HStack spacing={2}>
                      {currentIndex < achievements.length - 1 ? (
                        <Button
                          colorScheme={_getRarityColor(_currentAchievement.rarity)}
                          onClick={_handleNext}
                          leftIcon={<Icon as={FiCheckCircle} />}
                        >
                          Next Achievement
                        </Button>
                      ) : (
                        <Button
                          colorScheme={_getRarityColor(_currentAchievement.rarity)}
                          onClick={_handleClose}
                          leftIcon={<Icon as={FiCheckCircle} />}
                        >
                          Awesome!
                        </Button>
                      )}
                    </HStack>
                  </HStack>
                </VStack>
              </CardBody>
            </MotionCard>
          </ModalContent>
        </Modal>
      )}
    </AnimatePresence>
  );
}
