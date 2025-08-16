import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  SimpleGrid,
  CircularProgress,
  CircularProgressLabel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
} from '@chakra-ui/react';
import { motion, AnimatePresence   } from 'framer-motion';
import { 
  FiGift, 
  FiStar, 
  FiZap, 
  FiCalendar,
  FiTrendingUp,
  FiAward
} from 'react-icons/fi';
import { spinDailyWheel } from '../../api';
import { useGamification } from '../../contexts/GamificationContext';

const _MotionBox = motion.create(Box);
const _MotionCard = motion.create(Card);

export default function DailyRewards() {
  const [spinning, setSpinning] = useState(false);
  const [lastReward, setLastReward] = useState(null);
  const [canSpin, setCanSpin] = useState(true);
  const [spinTokens, setSpinTokens] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { userProgress, loadUserProgress } = useGamification();
  const _toast = useToast();

  useEffect(() => {
    checkDailyRewardStatus();
  }, [userProgress]);

  const _checkDailyRewardStatus = () => {
    if (!userProgress) return;
    
    const _today = new Date().toISOString().split('T')[0];
    const _lastSpin = userProgress.lastSpinDate ? 
      new Date(userProgress.lastSpinDate).toISOString().split('T')[0] : null;
    
    setCanSpin(lastSpin !== today);
    setSpinTokens(userProgress.spinTokens || 0);
  };

  const _handleDailySpin = async () => {
    if (!canSpin || spinning || spinTokens <= 0) return;
    
    setSpinning(true);
    try {
      const _response = await spinDailyWheel();
      if (response.data.success) {
        setLastReward(response.data.reward);
        setCanSpin(false);
        setSpinTokens(response.data.remainingTokens);
        
        // Refresh user progress
        await loadUserProgress();
        
        // Show reward modal
        onOpen();
        
        toast({
          title: 'Daily Reward Claimed! 🎁',
          description: `You received ${response.data.reward.amount} ${response.data.reward.type}!`,
          status: 'success',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error spinning daily wheel:', error);
      toast({
        title: 'Error',
        description: 'Failed to claim daily reward',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSpinning(false);
    }
  };

  const _getRewardIcon = (_type) => {
    const icons = {
      'coins': FiStar,
      'xp': FiZap,
      'gems': FiAward
    };
    return icons[type] || FiGift;
  };

  const _getRewardColor = (_type) => {
    const colors = {
      'coins': 'yellow',
      'xp': 'blue',
      'gems': 'purple'
    };
    return colors[type] || 'gray';
  };

  const _dailyRewards = [
    { type: 'coins', amount: 50, probability: 40 },
    { type: 'xp', amount: 100, probability: 30 },
    { type: 'coins', amount: 100, probability: 20 },
    { type: 'gems', amount: 1, probability: 8 },
    { type: 'gems', amount: 3, probability: 2 }
  ];

  const _getTimeUntilReset = () => {
    const now = new Date();
    const _tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const _diff = tomorrow - now;
    const _hours = Math.floor(diff / (1000 * 60 * 60));
    const _minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <>
      <MotionCard
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        variant="outline"
        borderColor={canSpin ? 'purple.200' : 'gray.200'}
        bg={canSpin ? 'purple.50' : 'gray.50'}
      >
        <CardHeader pb={2}>
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Box color="purple.500">
                <FiGift size={24} />
              </Box>
              <Heading size="md" color="purple.700">
                Daily Rewards
              </Heading>
            </HStack>
            
            {spinTokens > 0 && (
              <Badge colorScheme="purple" variant="solid">
                {spinTokens} spin{spinTokens !== 1 ? 's' : ''} left
              </Badge>
            )}
          </HStack>
        </CardHeader>

        <CardBody pt={0}>
          <VStack spacing={4} align="stretch">
            {/* Spin Wheel Visual */}
            <Box textAlign="center" position="relative">
              <MotionBox
                animate={spinning ? { rotate: 360 * 5 } : { rotate: 0 }}
                transition={{ duration: 3, ease: "easeOut" }}
              >
                <CircularProgress
                  value={100}
                  size="120px"
                  color="purple.400"
                  trackColor="purple.100"
                  thickness="8px"
                >
                  <CircularProgressLabel>
                    <VStack spacing={1}>
                      <Text fontSize="2xl">🎁</Text>
                      <Text fontSize="xs" fontWeight="bold" color="purple.600">
                        SPIN
                      </Text>
                    </VStack>
                  </CircularProgressLabel>
                </CircularProgress>
              </MotionBox>
              
              {/* Spinning indicator */}
              {spinning && (
                <MotionBox
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <Text fontSize="lg" fontWeight="bold" color="purple.600">
                    🌟
                  </Text>
                </MotionBox>
              )}
            </Box>

            {/* Status and Action */}
            <VStack spacing={3}>
              {canSpin && spinTokens > 0 ? (
                <>
                  <Text fontSize="sm" color="purple.600" textAlign="center" fontWeight="medium">
                    Your daily reward is ready! 🎉
                  </Text>
                  <Button
                    colorScheme="purple"
                    onClick={handleDailySpin}
                    isLoading={spinning}
                    loadingText="Spinning..."
                    leftIcon={<FiGift />}
                    size="lg"
                    w="full"
                  >
                    Claim Daily Reward
                  </Button>
                </>
              ) : (
                <>
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    {spinTokens <= 0 ? 'No spins remaining today' : 'Already claimed today'}
                  </Text>
                  <VStack spacing={1}>
                    <Text fontSize="xs" color="gray.400">
                      Next reward in:
                    </Text>
                    <Badge colorScheme="gray" variant="outline">
                      <HStack spacing={1}>
                        <FiCalendar size={12} />
                        <Text>{getTimeUntilReset()}</Text>
                      </HStack>
                    </Badge>
                  </VStack>
                </>
              )}
            </VStack>

            <Divider />

            {/* Possible Rewards Preview */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                Possible Rewards:
              </Text>
              <SimpleGrid columns={3} spacing={2}>
                {dailyRewards.slice(0, 3).map((reward, _index) => {
                  const _RewardIcon = getRewardIcon(reward.type);
                  return (
                    <VStack key={index} spacing={1} p={2} bg="gray.50" borderRadius="md">
                      <RewardIcon color={`var(--chakra-colors-${getRewardColor(reward.type)}-500)`} size={16} />
                      <Text fontSize="xs" fontWeight="bold">
                        {reward.amount}
                      </Text>
                      <Text fontSize="xs" color="gray.500" textTransform="capitalize">
                        {reward.type}
                      </Text>
                    </VStack>
                  );
                })}
              </SimpleGrid>
            </Box>
          </VStack>
        </CardBody>
      </MotionCard>

      {/* Reward Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader textAlign="center" color="purple.700">
            🎉 Daily Reward Claimed!
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {lastReward && (
              <VStack spacing={4}>
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Box
                    p={6}
                    bg={`${getRewardColor(lastReward.type)}.100`}
                    borderRadius="full"
                    border="3px solid"
                    borderColor={`${getRewardColor(lastReward.type)}.300`}
                  >
                    {React.createElement(getRewardIcon(lastReward.type), {
                      size: 48,
                      color: `var(--chakra-colors-${getRewardColor(lastReward.type)}-600)`
                    })}
                  </Box>
                </MotionBox>
                
                <VStack spacing={2}>
                  <Heading size="lg" color={`${getRewardColor(lastReward.type)}.600`}>
                    +{lastReward.amount} {lastReward.type.toUpperCase()}
                  </Heading>
                  <Text color="gray.600" textAlign="center">
                    Come back tomorrow for another reward!
                  </Text>
                </VStack>

                <Button colorScheme="purple" onClick={onClose} w="full">
                  Awesome!
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
