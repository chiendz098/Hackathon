import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  CircularProgress,
  CircularProgressLabel,
  useToast,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  List,
  ListItem,
  ListIcon,
  Divider,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import { motion, AnimatePresence   } from 'framer-motion';
import {
  FiStar,
  FiTrendingUp,
  FiAward,
  FiZap,
  FiTarget,
  FiGift,
  FiCheckCircle
} from 'react-icons/fi';
import { getUserProgress } from '../../api';

const _MotionBox = motion.create(Box);
const _MotionCard = motion.create(Card);

const _LEVEL_THEMES = {
  1: { color: 'gray', name: 'Người mới', icon: FiTarget },
  5: { color: 'blue', name: 'Học viên', icon: FiStar },
  10: { color: 'green', name: 'Thành thạo', icon: FiTrendingUp },
  15: { color: 'purple', name: 'Chuyên gia', icon: FiAward },
  25: { color: 'orange', name: 'Bậc thầy', icon: FiStar },
  50: { color: 'red', name: 'Huyền thoại', icon: FiAward },
};

const _LEVEL_REWARDS = {
  5: { coins: 50, gems: 1, unlock: ['theme_blue'] },
  10: { coins: 100, gems: 2, unlock: ['theme_green', 'avatar_student'] },
  15: { coins: 200, gems: 3, unlock: ['theme_purple'] },
  20: { coins: 300, gems: 5, unlock: ['avatar_expert'] },
  25: { coins: 500, gems: 8, unlock: ['theme_orange', 'pet_dragon'] },
  30: { coins: 750, gems: 10, unlock: ['theme_gold'] },
  50: { coins: 1500, gems: 25, unlock: ['theme_legendary', 'avatar_master', 'pet_phoenix'] },
};

export default function ProgressiveLevelingSystem() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [levelUpAnimation, setLevelUpAnimation] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedLevel, setSelectedLevel] = useState(null);
  const _toast = useToast();

  useEffect(() => {
    fetchProgress();
  }, []);

  const _fetchProgress = async () => {
    try {
      const response = await getUserProgress();
      setProgress(response.data.progress);
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin tiến độ',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const _getLevelTheme = (_level) => {
    const thresholds = Object.keys(LEVEL_THEMES).map(Number).sort((a, b) => b - a);
    for (const threshold of thresholds) {
      if (level >= threshold) {
        return LEVEL_THEMES[threshold];
      }
    }
    return LEVEL_THEMES[1];
  };

  const _getNextMilestone = (_level) => {
    const milestones = Object.keys(LEVEL_REWARDS).map(Number).sort((a, b) => a - b);
    return milestones.find(milestone => milestone > level) || null;
  };

  const _showLevelDetails = (_level) => {
    setSelectedLevel(level);
    onOpen();
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <VStack spacing={4}>
            <CircularProgress isIndeterminate color="blue.400" />
            <Text>Đang tải tiến độ...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardBody>
          <Text>Không thể tải thông tin tiến độ</Text>
        </CardBody>
      </Card>
    );
  }

  const _currentTheme = getLevelTheme(progress.currentLevel);
  const _nextMilestone = getNextMilestone(progress.currentLevel);
  const _xpProgress = (progress.totalXP / (progress.totalXP + progress.xpToNextLevel)) * 100;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <HStack spacing={3}>
            <Box p={2} bg={`${currentTheme.color}.100`} borderRadius="lg">
              <Icon as={currentTheme.icon} color={`${currentTheme.color}.600`} size={20} />
            </Box>
            <VStack align="start" spacing={0}>
              <Heading size="md" color={`${currentTheme.color}.600`}>
                ⭐ Progressive Leveling System
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Hệ thống cấp độ và phần thưởng tiến bộ
              </Text>
            </VStack>
          </HStack>
        </CardHeader>

        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* Current Level Display */}
            <MotionCard
              bg={`${currentTheme.color}.50`}
              borderColor={`${currentTheme.color}.200`}
              borderWidth="2px"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <CardBody>
                <VStack spacing={4}>
                  <HStack spacing={4} align="center">
                    <Box
                      p={4}
                      bg={`${currentTheme.color}.100`}
                      borderRadius="full"
                      border="3px solid"
                      borderColor={`${currentTheme.color}.300`}
                    >
                      <Icon as={currentTheme.icon} size={32} color={`${currentTheme.color}.600`} />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="2xl" fontWeight="bold" color={`${currentTheme.color}.700`}>
                        Level {progress.currentLevel}
                      </Text>
                      <Badge colorScheme={currentTheme.color} size="lg" variant="solid">
                        {currentTheme.name}
                      </Badge>
                    </VStack>
                  </HStack>

                  {/* XP Progress */}
                  <Box w="full">
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="medium">
                        Kinh nghiệm (XP)
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {progress.totalXP} / {progress.totalXP + progress.xpToNextLevel}
                      </Text>
                    </HStack>
                    <Progress
                      value={xpProgress}
                      colorScheme={currentTheme.color}
                      size="lg"
                      borderRadius="full"
                      bg="gray.100"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1} textAlign="center">
                      Còn {progress.xpToNextLevel} XP để lên level {progress.currentLevel + 1}
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </MotionCard>

            {/* Stats Grid */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Stat>
                <StatLabel>Tổng XP</StatLabel>
                <StatNumber color="blue.600">{progress.totalXP.toLocaleString()}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Kinh nghiệm tích lũy
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Coins</StatLabel>
                <StatNumber color="yellow.600">{progress.coins.toLocaleString()}</StatNumber>
                <StatHelpText>
                  <FiStar style={{ display: 'inline', marginRight: 4 }} />
                  Tiền xu
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Gems</StatLabel>
                <StatNumber color="purple.600">{progress.gems}</StatNumber>
                <StatHelpText>
                  <FiZap style={{ display: 'inline', marginRight: 4 }} />
                  Đá quý
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Streak</StatLabel>
                <StatNumber color="orange.600">{progress.currentStreak}</StatNumber>
                <StatHelpText>
                  <FiTrendingUp style={{ display: 'inline', marginRight: 4 }} />
                  Ngày liên tiếp
                </StatHelpText>
              </Stat>
            </SimpleGrid>

            {/* Next Milestone */}
            {nextMilestone && (
              <Card variant="outline" borderColor="purple.200">
                <CardBody>
                  <VStack spacing={3}>
                    <HStack>
                      <Icon as={FiGift} color="purple.500" />
                      <Text fontWeight="bold" color="purple.700">
                        Mốc tiếp theo: Level {nextMilestone}
                      </Text>
                    </HStack>
                    
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Còn {nextMilestone - progress.currentLevel} level để nhận phần thưởng đặc biệt!
                    </Text>
                    
                    <Button
                      size="sm"
                      colorScheme="purple"
                      variant="outline"
                      onClick={() => showLevelDetails(nextMilestone)}
                    >
                      Xem phần thưởng
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Level Milestones */}
            <Box>
              <Text fontWeight="bold" mb={3} color="gray.700">
                🏆 Các mốc cấp độ
              </Text>
              <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={3}>
                {Object.entries(LEVEL_REWARDS).map(([level, _rewards]) => {
                  const _levelNum = parseInt(level);
                  const _isUnlocked = progress.currentLevel >= levelNum;
                  const _theme = getLevelTheme(levelNum);
                  
                  return (
                    <Tooltip
                      key={level}
                      label={`Level ${level} - ${theme.name}`}
                      placement="top"
                    >
                      <Card
                        variant="outline"
                        borderColor={isUnlocked ? `${theme.color}.300` : 'gray.200'}
                        bg={isUnlocked ? `${theme.color}.50` : 'gray.50'}
                        cursor="pointer"
                        onClick={() => showLevelDetails(levelNum)}
                        _hover={{ transform: 'translateY(-2px)' }}
                        transition="all 0.2s"
                      >
                        <CardBody p={3} textAlign="center">
                          <VStack spacing={2}>
                            <Icon
                              as={theme.icon}
                              size={20}
                              color={isUnlocked ? `${theme.color}.600` : 'gray.400'}
                            />
                            <Text fontSize="sm" fontWeight="bold">
                              Level {level}
                            </Text>
                            {isUnlocked && (
                              <Icon as={FiCheckCircle} color="green.500" size={16} />
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    </Tooltip>
                  );
                })}
              </SimpleGrid>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      {/* Level Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Level {selectedLevel} - {selectedLevel && getLevelTheme(selectedLevel).name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedLevel && LEVEL_REWARDS[selectedLevel] && (
              <VStack spacing={4} align="stretch">
                <Text fontWeight="bold" color="purple.700">
                  🎁 Phần thưởng khi đạt Level {selectedLevel}:
                </Text>
                
                <List spacing={2}>
                  {LEVEL_REWARDS[selectedLevel].coins && (
                    <ListItem>
                      <ListIcon as={FiStar} color="yellow.500" />
                      {LEVEL_REWARDS[selectedLevel].coins.toLocaleString()} Coins
                    </ListItem>
                  )}
                  
                  {LEVEL_REWARDS[selectedLevel].gems && (
                    <ListItem>
                      <ListIcon as={FiZap} color="purple.500" />
                      {LEVEL_REWARDS[selectedLevel].gems} Gems
                    </ListItem>
                  )}
                  
                  {LEVEL_REWARDS[selectedLevel].unlock && (
                    <>
                      <Divider />
                      <Text fontWeight="bold" color="blue.700">
                        🔓 Mở khóa:
                      </Text>
                      {LEVEL_REWARDS[selectedLevel].unlock.map((item, index) => (
                        <ListItem key={index}>
                          <ListIcon as={FiGift} color="blue.500" />
                          {item.replace('theme', 'Theme: ').replace('avatar', 'Avatar: ').replace('pet', 'Pet: ')}
                        </ListItem>
                      ))}
                    </>
                  )}
                </List>
                
                {progress.currentLevel >= selectedLevel ? (
                  <Badge colorScheme="green" p={2} textAlign="center">
                    ✅ Đã mở khóa
                  </Badge>
                ) : (
                  <Badge colorScheme="orange" p={2} textAlign="center">
                    🔒 Cần {selectedLevel - progress.currentLevel} level nữa
                  </Badge>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </MotionBox>
  );
}
