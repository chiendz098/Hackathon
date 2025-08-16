import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardBody,
  Text,
  Button,
  Progress,
  VStack,
  HStack,
  Badge,
  Icon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import {
  FaBullseye,
  FaCheckCircle,
  FaTrophy,
  FaGift,
  FaCalendar,
  FaClock,
  FaFire,
  FaStar,
  FaCoins,
  FaGem,
  FaBook,
  FaUsers,
  FaLightbulb,
  FaRocket,
  FaMedal,
  FaAward
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { awardXP, claimDailyReward } from '../../api';

const DailyChallenge = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [challenges, setChallenges] = useState([]);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState([]);

  // Challenge types configuration
  const challengeTypes = {
    tasks: {
      name: 'Task Completion',
      icon: FaCheckCircle,
      color: 'green',
      description: 'Complete tasks to earn rewards',
      baseReward: 50
    },
    study: {
      name: 'Study Time',
      icon: FaBook,
      color: 'blue',
      description: 'Study for specified hours',
      baseReward: 75
    },
    streak: {
      name: 'Streak Maintenance',
      icon: FaFire,
      color: 'orange',
      description: 'Maintain your study streak',
      baseReward: 100
    },
    achievements: {
      name: 'Achievement Unlock',
      icon: FaTrophy,
      color: 'purple',
      description: 'Unlock new achievements',
      baseReward: 150
    },
    social: {
      name: 'Social Interaction',
      icon: FaUsers,
      color: 'teal',
      description: 'Interact with study groups',
      baseReward: 60
    },
    focus: {
      name: 'Focus Sessions',
      icon: FaBullseye,
      color: 'red',
      description: 'Complete focus sessions',
      baseReward: 80
    }
  };

  useEffect(() => {
    generateDailyChallenges();
  }, [user]);

  const generateDailyChallenges = () => {
    const today = new Date().toDateString();
    const userLevel = user?.level || 1;
    const userStreak = user?.streak || 0;
    
    const availableChallenges = [
      {
        id: 'daily_tasks',
        type: 'tasks',
        title: 'Complete Daily Tasks',
        description: `Complete ${Math.max(5, Math.floor(userLevel / 2))} tasks today`,
        target: Math.max(5, Math.floor(userLevel / 2)),
        current: Math.min(user?.completedTodos || 0, Math.max(5, Math.floor(userLevel / 2))),
        reward: {
          xp: Math.max(50, userLevel * 10),
          coins: Math.max(25, userLevel * 5),
          type: 'xp'
        },
        difficulty: 'easy',
        category: 'daily'
      },
      {
        id: 'study_time',
        type: 'study',
        title: 'Study Marathon',
        description: `Study for ${Math.max(1, Math.floor(userLevel / 5))} hours today`,
        target: Math.max(1, Math.floor(userLevel / 5)) * 60, // in minutes
        current: Math.min(user?.totalStudyTime || 0, Math.max(1, Math.floor(userLevel / 5)) * 60),
        reward: {
          xp: Math.max(75, userLevel * 15),
          coins: Math.max(35, userLevel * 7),
          type: 'xp'
        },
        difficulty: 'medium',
        category: 'daily'
      },
      {
        id: 'streak_maintenance',
        type: 'streak',
        title: 'Streak Master',
        description: `Maintain a ${Math.max(3, Math.floor(userLevel / 3))}-day streak`,
        target: Math.max(3, Math.floor(userLevel / 3)),
        current: Math.min(userStreak, Math.max(3, Math.floor(userLevel / 3))),
        reward: {
          xp: Math.max(100, userLevel * 20),
          coins: Math.max(50, userLevel * 10),
          gems: Math.max(1, Math.floor(userLevel / 10)),
          type: 'coins'
        },
        difficulty: 'hard',
        category: 'weekly'
      },
      {
        id: 'focus_sessions',
        type: 'focus',
        title: 'Focus Warrior',
        description: `Complete ${Math.max(2, Math.floor(userLevel / 4))} focus sessions`,
        target: Math.max(2, Math.floor(userLevel / 4)),
        current: Math.min(user?.focusSessions || 0, Math.max(2, Math.floor(userLevel / 4))),
        reward: {
          xp: Math.max(80, userLevel * 12),
          coins: Math.max(40, userLevel * 8),
          type: 'xp'
        },
        difficulty: 'medium',
        category: 'daily'
      },
      {
        id: 'achievement_hunter',
        type: 'achievements',
        title: 'Achievement Hunter',
        description: `Unlock ${Math.max(1, Math.floor(userLevel / 8))} new achievements`,
        target: Math.max(1, Math.floor(userLevel / 8)),
        current: 0, // This will be updated from achievements data
        reward: {
          xp: Math.max(150, userLevel * 25),
          coins: Math.max(75, userLevel * 15),
          gems: Math.max(2, Math.floor(userLevel / 8)),
          type: 'gems'
        },
        difficulty: 'hard',
        category: 'weekly'
      }
    ];

    setChallenges(availableChallenges);
    
    // Set current challenge (daily task completion)
    const dailyChallenge = availableChallenges.find(c => c.id === 'daily_tasks');
    setCurrentChallenge(dailyChallenge);
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'yellow';
      case 'hard': return 'red';
      default: return 'gray';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'easy': return FaStar;
      case 'medium': return FaMedal;
      case 'hard': return FaAward;
      default: return FaStar;
    }
  };

  const handleClaimReward = async (challenge) => {
    if (challenge.current < challenge.target) {
      toast({
        title: 'Challenge Not Complete',
        description: 'You need to complete the challenge first!',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      // Award XP for completing challenge
      if (challenge.reward.xp) {
        await awardXP(challenge.reward.xp, 'daily_challenge', null);
      }

      // Mark challenge as claimed
      setClaimedRewards(prev => [...prev, challenge.id]);

      toast({
        title: 'Challenge Completed!',
        description: `Earned ${challenge.reward.xp} XP and ${challenge.reward.coins} coins!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Update challenge progress
      setChallenges(prev => prev.map(c => 
        c.id === challenge.id 
          ? { ...c, current: c.target, completed: true }
          : c
      ));

    } catch (error) {
      console.error('Error claiming reward:', error);
      toast({
        title: 'Error',
        description: 'Failed to claim reward. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const isChallengeCompleted = (challenge) => {
    return challenge.current >= challenge.target;
  };

  const isChallengeClaimed = (challenge) => {
    return claimedRewards.includes(challenge.id);
  };

  return (
    <>
      {/* Main Challenge Display */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardBody>
          <div className="text-center p-6">
            <div className="flex items-center justify-center mb-4">
              <FaBullseye className="text-4xl mr-3" />
              <h3 className="text-3xl font-bold">Daily Challenge</h3>
            </div>
            
            {currentChallenge && (
              <div className="mb-6">
                <p className="text-xl mb-4">{currentChallenge.title}</p>
                <p className="text-purple-200 mb-4">{currentChallenge.description}</p>
                
                <div className="flex justify-center items-center space-x-6 mb-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold">
                      {currentChallenge.current}/{currentChallenge.target}
                    </div>
                    <div className="text-purple-200">Progress</div>
                  </div>
                  
                  <div className="w-32 bg-purple-400 rounded-full h-3">
                    <div 
                      className="bg-white h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${getProgressPercentage(currentChallenge.current, currentChallenge.target)}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-4xl font-bold">+{currentChallenge.reward.xp}</div>
                    <div className="text-purple-200">XP Reward</div>
                  </div>
                </div>

                <Button
                  onClick={onOpen}
                  className="bg-white text-purple-600 hover:bg-purple-100"
                  size="lg"
                >
                  View All Challenges
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* All Challenges Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="flex items-center">
                            <FaBullseye className="mr-2" />
            Daily Challenges
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody className="pb-6">
            <VStack spacing={4} align="stretch">
              {challenges.map((challenge) => {
                const challengeType = challengeTypes[challenge.type];
                const DifficultyIcon = getDifficultyIcon(challenge.difficulty);
                const isCompleted = isChallengeCompleted(challenge);
                const isClaimed = isChallengeClaimed(challenge);
                
                return (
                  <Card 
                    key={challenge.id}
                    className={`${
                      isCompleted ? 'ring-2 ring-green-500' : ''
                    } ${
                      isClaimed ? 'opacity-60' : ''
                    }`}
                  >
                    <CardBody>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Icon 
                              as={challengeType.icon} 
                              className={`text-${challengeType.color}-500 mr-2`}
                            />
                            <Text className="font-bold text-lg">{challenge.title}</Text>
                            <Badge 
                              colorScheme={getDifficultyColor(challenge.difficulty)}
                              className="ml-2"
                            >
                              <DifficultyIcon className="w-3 h-3 mr-1" />
                              {challenge.difficulty}
                            </Badge>
                          </div>
                          
                          <Text className="text-gray-600 mb-3">{challenge.description}</Text>
                          
                          <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{challenge.current}/{challenge.target}</span>
                            </div>
                            <Progress 
                              value={getProgressPercentage(challenge.current, challenge.target)}
                              colorScheme={isCompleted ? 'green' : 'blue'}
                              className="h-2"
                            />
                          </div>

                          <div className="flex items-center space-x-4 text-sm">
                            {challenge.reward.xp && (
                              <div className="flex items-center">
                                <FaStar className="text-yellow-500 mr-1" />
                                <span>+{challenge.reward.xp} XP</span>
                              </div>
                            )}
                            {challenge.reward.coins && (
                              <div className="flex items-center">
                                <FaCoins className="text-yellow-500 mr-1" />
                                <span>+{challenge.reward.coins} Coins</span>
                              </div>
                            )}
                            {challenge.reward.gems && (
                              <div className="flex items-center">
                                <FaGem className="text-purple-500 mr-1" />
                                <span>+{challenge.reward.gems} Gems</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-4">
                          {isClaimed ? (
                            <Badge colorScheme="green" className="px-3 py-1">
                              Claimed
                            </Badge>
                          ) : isCompleted ? (
                            <Button
                              onClick={() => handleClaimReward(challenge)}
                              colorScheme="green"
                              size="sm"
                              isLoading={loading}
                            >
                              Claim Reward
                            </Button>
                          ) : (
                            <Badge colorScheme="gray" className="px-3 py-1">
                              In Progress
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </VStack>

            <Divider className="my-6" />

            <div className="text-center">
              <Text className="text-gray-600 mb-2">
                Complete challenges to earn XP, coins, and gems!
              </Text>
              <Text className="text-sm text-gray-500">
                Challenges reset daily and weekly based on their category.
              </Text>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default DailyChallenge; 