import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  useToast,
} from '@chakra-ui/react';
import { motion, AnimatePresence   } from 'framer-motion';
import { 
  FiZap, 
  FiTrendingUp,
  FiStar,
  FiAward
} from 'react-icons/fi';

const MotionBox = motion.create(Box);

// XP notification that appears when user gains XP
export default function XPNotification({ 
  xpGained = 0, 
  reason = '', 
  levelUp = false,
  newLevel = 1,
  currentXP = 0,
  xpToNext = 100,
  isVisible = false,
  onComplete
}) {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (isVisible && xpGained > 0) {
      setShowNotification(true);
      
      // Auto-hide after 4 seconds
      const _timer = setTimeout(() => {
        setShowNotification(false);
        if (onComplete) onComplete();
      }, 4000);

      return () => clearTimeout(_timer);
    }
  }, [isVisible, xpGained, onComplete]);

  const _getReasonText = (_reason) => {
    const reasonMap = {
      'task_completion': 'Task Completed',
      'achievement': 'Achievement Unlocked',
      'daily_spin': 'Daily Spin',
      'streak_bonus': 'Streak Bonus',
      'perfect_day': 'Perfect Day',
      'study_session': 'Study Session'
    };
    return reasonMap[reason] || 'XP Gained';
  };

  const _getReasonIcon = (_reason) => {
    const iconMap = {
      'task_completion': FiZap,
      'achievement': FiAward,
      'daily_spin': FiStar,
      'streak_bonus': FiTrendingUp,
      'perfect_day': FiStar,
      'study_session': FiZap
    };
    return iconMap[reason] || FiZap;
  };

  const _getReasonColor = (_reason) => {
    const colorMap = {
      'task_completion': 'blue',
      'achievement': 'purple',
      'daily_spin': 'yellow',
      'streak_bonus': 'orange',
      'perfect_day': 'pink',
      'study_session': 'green'
    };
    return colorMap[reason] || 'blue';
  };

  const xpProgress = ((currentXP / (currentXP + xpToNext)) * 100);
  const ReasonIcon = _getReasonIcon(reason);
  const reasonColor = _getReasonColor(reason);

  return (
    <AnimatePresence>
      {showNotification && (
        <MotionBox
          position="fixed"
          top="20px"
          right="20px"
          zIndex={9999}
          initial={{ x: 400, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 400, opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            duration: 0.5
          }}
        >
          {levelUp ? (
            // Level Up Notification
            <MotionBox
              bg="gradient-to-r from-purple.500 to-pink.500"
              color="white"
              p={4}
              borderRadius="xl"
              boxShadow="0 10px 25px rgba(147, 51, 234, 0.4)"
              border="2px solid"
              borderColor="purple.300"
              minW="300px"
              initial={{ scale: 0.5 }}
              animate={{ scale: [0.5, 1.1, 1] }}
              transition={{ duration: 0.6 }}
            >
              <VStack spacing={3} align="center">
                <MotionBox
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: 2 }}
                >
                  <Text fontSize="4xl">🎉</Text>
                </MotionBox>
                
                <VStack spacing={1}>
                  <Text fontSize="lg" fontWeight="bold" textAlign="center">
                    LEVEL UP!
                  </Text>
                  <HStack>
                    <Badge colorScheme="yellow" variant="solid" fontSize="md" px={3} py={1}>
                      Level {newLevel}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" opacity={0.9} textAlign="center">
                    +{xpGained} XP from {getReasonText(reason)}
                  </Text>
                </VStack>

                {/* Celebration particles */}
                <Box position="relative" w="full" h="20px">
                  {[...Array(10)].map((_, i) => (
                    <MotionBox
                      key={i}
                      position="absolute"
                      w="4px"
                      h="4px"
                      bg="yellow.300"
                      borderRadius="full"
                      initial={{ 
                        x: Math.random() * 280,
                        y: 10,
                        opacity: 1
                      }}
                      animate={{ 
                        y: -30,
                        opacity: 0,
                        scale: [1, 1.5, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        delay: Math.random() * 0.5
                      }}
                    />
                  ))}
                </Box>
              </VStack>
            </MotionBox>
          ) : (
            // Regular XP Notification
            <MotionBox
              bg="white"
              p={4}
              borderRadius="xl"
              boxShadow="0 10px 25px rgba(0, 0, 0, 0.15)"
              border="2px solid"
              borderColor={`${reasonColor}.200`}
              minW="280px"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Box
                      p={2}
                      bg={`${reasonColor}.100`}
                      borderRadius="lg"
                      color={`${reasonColor}.600`}
                    >
                      <ReasonIcon size={20} />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">
                        {getReasonText(reason)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        XP Gained
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <MotionBox
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <Badge 
                      colorScheme={reasonColor} 
                      variant="solid" 
                      fontSize="lg"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      +{xpGained}
                    </Badge>
                  </MotionBox>
                </HStack>

                {/* XP Progress Bar */}
                <VStack spacing={1} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.600">
                      Level Progress
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {currentXP} / {currentXP + xpToNext}
                    </Text>
                  </HStack>
                  
                  <MotionBox>
                    <Progress
                      value={xpProgress}
                      colorScheme={reasonColor}
                      size="sm"
                      borderRadius="full"
                      bg="gray.100"
                    />
                    <MotionBox
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      bg={`${reasonColor}.400`}
                      borderRadius="full"
                      initial={{ width: 0 }}
                      animate={{ width: `${xpProgress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      opacity={0.3}
                    />
                  </MotionBox>
                </VStack>

                {/* Floating XP particles */}
                <Box position="relative" h="0" overflow="visible">
                  {[...Array(5)].map((_, i) => (
                    <MotionBox
                      key={i}
                      position="absolute"
                      right={`${20 + i * 15}px`}
                      bottom="10px"
                      color={`${reasonColor}.400`}
                      fontSize="xs"
                      fontWeight="bold"
                      initial={{ y: 0, opacity: 1 }}
                      animate={{ y: -30, opacity: 0 }}
                      transition={{
                        duration: 2,
                        delay: i * 0.2
                      }}
                    >
                      +{Math.floor(xpGained / 5)}
                    </MotionBox>
                  ))}
                </Box>
              </VStack>
            </MotionBox>
          )}
        </MotionBox>
      )}
    </AnimatePresence>
  );
}
