import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Grid,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
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
  FaCoins,
  FaGem,
  FaStar,
  FaTrophy,
  FaCalendar,
  FaClock,
  FaCheckCircle,
  FaPlay,
  FaPause,
  FaStop,
  FaHistory,
  FaChartLine,
  FaLightbulb,
  FaBook,
  FaUsers,
  FaHeart,
  FaFire
} from 'react-icons/fa';

// Earning methods configuration
const EARNING_METHODS = {
  daily: {
    name: 'Daily Tasks',
    icon: FaCalendar,
    description: 'Hoàn thành nhiệm vụ hàng ngày để nhận coin',
    baseReward: 50,
    maxDaily: 200,
    color: 'blue'
  },
  study: {
    name: 'Study Sessions',
    icon: FaBook,
    description: 'Kiếm coin dựa trên thời gian học tập',
    baseReward: 10, // per hour
    maxDaily: 100,
    color: 'green'
  },
  streak: {
    name: 'Study Streaks',
    icon: FaFire,
    description: 'Duy trì chuỗi học tập liên tục',
    baseReward: 25, // per day in streak
    maxDaily: 500,
    color: 'orange'
  },
  achievements: {
    name: 'Achievements',
    icon: FaTrophy,
    description: 'Mở khóa thành tựu để nhận coin',
    baseReward: 100,
    maxDaily: 1000,
    color: 'purple'
  },
  social: {
    name: 'Social Activities',
    icon: FaUsers,
    description: 'Tương tác với bạn bè và cộng đồng',
    baseReward: 15,
    maxDaily: 150,
    color: 'teal'
  },
  challenges: {
    name: 'Weekly Challenges',
    icon: FaStar,
    description: 'Tham gia thử thách hàng tuần',
    baseReward: 200,
    maxDaily: 800,
    color: 'red'
  }
};

// Daily tasks configuration
const DAILY_TASKS = [
  {
    id: 'complete_3_todos',
    name: 'Hoàn thành 3 todos',
    description: 'Hoàn thành ít nhất 3 todos trong ngày',
    reward: 30,
    target: 3,
    type: 'todos'
  },
  {
    id: 'study_2_hours',
    name: 'Học tập 2 giờ',
    description: 'Tổng thời gian học tập đạt 2 giờ',
    reward: 40,
    target: 120, // minutes
    type: 'study_time'
  },
  {
    id: 'visit_shop',
    name: 'Ghé thăm shop',
    description: 'Truy cập shop ít nhất 1 lần',
    reward: 20,
    target: 1,
    type: 'shop_visit'
  },
  {
    id: 'help_friend',
    name: 'Giúp đỡ bạn bè',
    description: 'Tương tác với bạn bè (like, comment, share)',
    reward: 25,
    target: 3,
    type: 'social_interaction'
  },
  {
    id: 'complete_quiz',
    name: 'Hoàn thành quiz',
    description: 'Làm và hoàn thành ít nhất 1 quiz',
    reward: 35,
    target: 1,
    type: 'quiz'
  }
];

export default function CoinEarningSystem() {
  const [userStats, setUserStats] = useState({
    coins: 1250,
    gems: 45,
    level: 18,
    totalEarned: 5000,
    todayEarned: 0,
    streak: 7,
    studyTime: 0,
    todosCompleted: 0
  });

  const [dailyProgress, setDailyProgress] = useState({
    todos: 0,
    studyTime: 0,
    shopVisits: 0,
    socialInteractions: 0,
    quizzes: 0
  });

  const [activeStudySession, setActiveStudySession] = useState({
    isActive: false,
    startTime: null,
    duration: 0,
    paused: false,
    pauseStart: null,
    totalPaused: 0
  });

  const [achievements, setAchievements] = useState([
    { id: 'first_todo', name: 'Todo đầu tiên', earned: true, reward: 50 },
    { id: 'study_1_hour', name: 'Học 1 giờ', earned: true, reward: 100 },
    { id: 'streak_3_days', name: 'Streak 3 ngày', earned: true, reward: 150 },
    { id: 'complete_10_todos', name: 'Hoàn thành 10 todos', earned: false, reward: 200 },
    { id: 'study_10_hours', name: 'Học 10 giờ', earned: false, reward: 300 },
    { id: 'streak_7_days', name: 'Streak 7 ngày', earned: false, reward: 400 }
  ]);

  const [weeklyChallenges, setWeeklyChallenges] = useState([
    {
      id: 'complete_20_todos',
      name: 'Hoàn thành 20 todos',
      description: 'Hoàn thành 20 todos trong tuần này',
      progress: 12,
      target: 20,
      reward: 300,
      deadline: '2024-01-15'
    },
    {
      id: 'study_15_hours',
      name: 'Học tập 15 giờ',
      description: 'Tổng thời gian học tập đạt 15 giờ',
      progress: 8.5,
      target: 15,
      reward: 400,
      deadline: '2024-01-15'
    },
    {
      id: 'help_10_friends',
      name: 'Giúp đỡ 10 bạn bè',
      description: 'Tương tác với 10 bạn bè khác nhau',
      progress: 6,
      target: 10,
      reward: 250,
      deadline: '2024-01-15'
    }
  ]);

  const [earningsHistory, setEarningsHistory] = useState([
    { date: '2024-01-10', amount: 180, method: 'Daily Tasks', type: 'coins' },
    { date: '2024-01-10', amount: 120, method: 'Study Session', type: 'coins' },
    { date: '2024-01-09', amount: 200, method: 'Achievement', type: 'coins' },
    { date: '2024-01-09', amount: 150, method: 'Daily Tasks', type: 'coins' },
    { date: '2024-01-08', amount: 175, method: 'Study Session', type: 'coins' }
  ]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const toast = useToast();

  useEffect(() => {
    // Load user data
    loadUserData();
    // Start study session timer if active
    let interval;
    if (activeStudySession.isActive && !activeStudySession.paused) {
      interval = setInterval(() => {
        updateStudySession();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeStudySession.isActive, activeStudySession.paused]);

  const loadUserData = async () => {
    try {
      // Simulate API call to load user data
      // In real app, this would fetch from backend
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const updateStudySession = () => {
    if (activeStudySession.isActive && !activeStudySession.paused) {
      const now = Date.now();
      const duration = Math.floor((now - activeStudySession.startTime - activeStudySession.totalPaused) / 1000);
      
      setActiveStudySession(prev => ({
        ...prev,
        duration
      }));

      // Update daily progress
      setDailyProgress(prev => ({
        ...prev,
        studyTime: Math.floor(duration / 60)
      }));
    }
  };

  const startStudySession = () => {
    const now = Date.now();
    setActiveStudySession({
      isActive: true,
      startTime: now,
      duration: 0,
      paused: false,
      pauseStart: null,
      totalPaused: 0
    });
    
    toast({
      title: 'Bắt đầu học tập!',
      description: 'Bạn đang kiếm coin từ việc học tập',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const pauseStudySession = () => {
    if (activeStudySession.isActive && !activeStudySession.paused) {
      setActiveStudySession(prev => ({
        ...prev,
        paused: true,
        pauseStart: Date.now()
      }));
    }
  };

  const resumeStudySession = () => {
    if (activeStudySession.isActive && activeStudySession.paused) {
      const pauseDuration = Date.now() - activeStudySession.pauseStart;
      setActiveStudySession(prev => ({
        ...prev,
        paused: false,
        totalPaused: prev.totalPaused + pauseDuration
      }));
    }
  };

  const stopStudySession = () => {
    if (activeStudySession.isActive) {
      const finalDuration = activeStudySession.duration;
      const coinsEarned = Math.floor(finalDuration / 3600) * EARNING_METHODS.study.baseReward;
      
      if (coinsEarned > 0) {
        setUserStats(prev => ({
          ...prev,
          coins: prev.coins + coinsEarned,
          todayEarned: prev.todayEarned + coinsEarned
        }));
        
        setEarningsHistory(prev => [{
          date: new Date().toISOString().split('T')[0],
          amount: coinsEarned,
          method: 'Study Session',
          type: 'coins'
        }, ...prev]);
        
        toast({
          title: 'Phiên học tập kết thúc!',
          description: `Bạn đã kiếm được ${coinsEarned} coins`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      setActiveStudySession({
        isActive: false,
        startTime: null,
        duration: 0,
        paused: false,
        pauseStart: null,
        totalPaused: 0
      });
    }
  };

  const claimDailyTask = (taskId) => {
    const task = DAILY_TASKS.find(t => t.id === taskId);
    if (!task) return;

    // Check if task is completed
    let isCompleted = false;
    switch (task.type) {
      case 'todos':
        isCompleted = dailyProgress.todos >= task.target;
        break;
      case 'study_time':
        isCompleted = dailyProgress.studyTime >= task.target;
        break;
      case 'shop_visit':
        isCompleted = dailyProgress.shopVisits >= task.target;
        break;
      case 'social_interaction':
        isCompleted = dailyProgress.socialInteractions >= task.target;
        break;
      case 'quiz':
        isCompleted = dailyProgress.quizzes >= task.target;
        break;
    }

    if (isCompleted) {
      setUserStats(prev => ({
        ...prev,
        coins: prev.coins + task.reward,
        todayEarned: prev.todayEarned + task.reward
      }));
      
      setEarningsHistory(prev => [{
        date: new Date().toISOString().split('T')[0],
        amount: task.reward,
        method: 'Daily Task',
        type: 'coins'
      }, ...prev]);
      
      toast({
        title: 'Nhiệm vụ hoàn thành!',
        description: `Bạn đã nhận ${task.reward} coins`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Nhiệm vụ chưa hoàn thành',
        description: `Bạn cần hoàn thành ${task.name}`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const claimAchievement = (achievementId) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.earned) return;

    setUserStats(prev => ({
      ...prev,
      coins: prev.coins + achievement.reward,
      todayEarned: prev.todayEarned + achievement.reward
    }));
    
    setAchievements(prev => 
      prev.map(a => a.id === achievementId ? { ...a, earned: true } : a)
    );
    
    setEarningsHistory(prev => [{
      date: new Date().toISOString().split('T')[0],
      amount: achievement.reward,
      method: 'Achievement',
      type: 'coins'
    }, ...prev]);
    
    toast({
      title: 'Thành tựu mới!',
      description: `Bạn đã nhận ${achievement.reward} coins`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <Box p={6} maxW="1200px" mx="auto">
      {/* Header */}
      <Box mb={8} textAlign="center">
        <Text fontSize="3xl" fontWeight="bold" mb={2}>💰 Coin Earning System</Text>
        <Text fontSize="lg" color="gray.600">Kiếm coin thông minh và hiệu quả</Text>
      </Box>

      {/* User Stats Overview */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6} mb={8}>
        <Card bg="blue.50">
          <CardBody textAlign="center">
            <Icon as={FaCoins} color="gold" boxSize={8} mb={2} />
            <Stat>
              <StatNumber fontSize="2xl" color="blue.600">{userStats.coins.toLocaleString()}</StatNumber>
              <StatLabel>Coins hiện tại</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg="green.50">
          <CardBody textAlign="center">
            <Icon as={FaStar} color="green.500" boxSize={8} mb={2} />
            <Stat>
              <StatNumber fontSize="2xl" color="green.600">{userStats.todayEarned}</StatNumber>
              <StatLabel>Coins hôm nay</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg="orange.50">
          <CardBody textAlign="center">
            <Icon as={FaFire} color="orange.500" boxSize={8} mb={2} />
            <Stat>
              <StatNumber fontSize="2xl" color="orange.600">{userStats.streak}</StatNumber>
              <StatLabel>Ngày liên tục</StatLabel>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg="purple.50">
          <CardBody textAlign="center">
            <Icon as={FaTrophy} color="purple.500" boxSize={8} mb={2} />
            <Stat>
              <StatNumber fontSize="2xl" color="purple.600">{userStats.level}</StatNumber>
              <StatLabel>Level hiện tại</StatLabel>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Study Session Controller */}
      <Card mb={8} bg="green.50" border="2px solid" borderColor="green.200">
        <CardHeader>
          <HStack spacing={3}>
            <Icon as={FaBook} color="green.500" />
            <Text fontSize="lg" fontWeight="bold">Study Session Controller</Text>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <Text fontSize="2xl" fontFamily="mono" fontWeight="bold">
              {formatTime(activeStudySession.duration)}
            </Text>
            
            <HStack spacing={3}>
              {!activeStudySession.isActive ? (
                <Button colorScheme="green" onClick={startStudySession} leftIcon={<FaPlay />}>
                  Bắt đầu học
                </Button>
              ) : (
                <>
                  {activeStudySession.paused ? (
                    <Button colorScheme="blue" onClick={resumeStudySession} leftIcon={<FaPlay />}>
                      Tiếp tục
                    </Button>
                  ) : (
                    <Button colorScheme="yellow" onClick={pauseStudySession} leftIcon={<FaPause />}>
                      Tạm dừng
                    </Button>
                  )}
                  <Button colorScheme="red" onClick={stopStudySession} leftIcon={<FaStop />}>
                    Kết thúc
                  </Button>
                </>
              )}
            </HStack>
            
            <Text fontSize="sm" color="gray.600">
              Kiếm {EARNING_METHODS.study.baseReward} coins mỗi giờ học tập
            </Text>
          </VStack>
        </CardBody>
      </Card>

      {/* Main Content Tabs */}
      <Tabs variant="enclosed">
        <TabList mb={6}>
          <Tab>Daily Tasks</Tab>
          <Tab>Achievements</Tab>
          <Tab>Weekly Challenges</Tab>
          <Tab>Earning History</Tab>
        </TabList>

        <TabPanels>
          {/* Daily Tasks Tab */}
          <TabPanel>
            <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
              {DAILY_TASKS.map(task => {
                const progress = dailyProgress[task.type] || 0;
                const percentage = getProgressPercentage(progress, task.target);
                const isCompleted = progress >= task.target;
                
                return (
                  <Card key={task.id} variant="outline">
                    <CardBody>
                      <VStack spacing={4} align="start">
                        <HStack justify="space-between" w="full">
                          <Text fontWeight="bold">{task.name}</Text>
                          <Badge colorScheme={isCompleted ? 'green' : 'gray'}>
                            {isCompleted ? 'Hoàn thành' : 'Đang làm'}
                          </Badge>
                        </HStack>
                        
                        <Text fontSize="sm" color="gray.600">{task.description}</Text>
                        
                        <Box w="full">
                          <HStack justify="space-between" mb={2}>
                            <Text fontSize="sm">Tiến độ: {progress}/{task.target}</Text>
                            <Text fontSize="sm" fontWeight="bold">{task.reward} coins</Text>
                          </HStack>
                          <Progress value={percentage} colorScheme={isCompleted ? 'green' : 'blue'} />
                        </Box>
                        
                        <Button
                          size="sm"
                          colorScheme={isCompleted ? 'green' : 'gray'}
                          isDisabled={!isCompleted}
                          onClick={() => claimDailyTask(task.id)}
                          w="full"
                        >
                          {isCompleted ? 'Nhận thưởng' : 'Chưa hoàn thành'}
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </Grid>
          </TabPanel>

          {/* Achievements Tab */}
          <TabPanel>
            <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
              {achievements.map(achievement => (
                <Card key={achievement.id} variant="outline">
                  <CardBody>
                    <VStack spacing={4} align="start">
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="bold">{achievement.name}</Text>
                        <Badge colorScheme={achievement.earned ? 'green' : 'gray'}>
                          {achievement.earned ? 'Đã đạt' : 'Chưa đạt'}
                        </Badge>
                      </HStack>
                      
                      <Text fontSize="sm" color="gray.600">
                        Phần thưởng: {achievement.reward} coins
                      </Text>
                      
                      <Button
                        size="sm"
                        colorScheme={achievement.earned ? 'green' : 'blue'}
                        isDisabled={!achievement.earned}
                        onClick={() => claimAchievement(achievement.id)}
                        w="full"
                      >
                        {achievement.earned ? 'Đã nhận' : 'Chưa đạt được'}
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          </TabPanel>

          {/* Weekly Challenges Tab */}
          <TabPanel>
            <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
              {weeklyChallenges.map(challenge => {
                const percentage = getProgressPercentage(challenge.progress, challenge.target);
                const isCompleted = challenge.progress >= challenge.target;
                
                return (
                  <Card key={challenge.id} variant="outline">
                    <CardBody>
                      <VStack spacing={4} align="start">
                        <HStack justify="space-between" w="full">
                          <Text fontWeight="bold">{challenge.name}</Text>
                          <Badge colorScheme={isCompleted ? 'green' : 'orange'}>
                            {isCompleted ? 'Hoàn thành' : 'Đang thực hiện'}
                          </Badge>
                        </HStack>
                        
                        <Text fontSize="sm" color="gray.600">{challenge.description}</Text>
                        
                        <Box w="full">
                          <HStack justify="space-between" mb={2}>
                            <Text fontSize="sm">Tiến độ: {challenge.progress}/{challenge.target}</Text>
                            <Text fontSize="sm" fontWeight="bold">{challenge.reward} coins</Text>
                          </HStack>
                          <Progress value={percentage} colorScheme={isCompleted ? 'green' : 'orange'} />
                        </Box>
                        
                        <Text fontSize="xs" color="gray.500">
                          Hạn chót: {challenge.deadline}
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </Grid>
          </TabPanel>

          {/* Earning History Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Text fontSize="lg" fontWeight="bold">Lịch sử kiếm coin</Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="start">
                  {earningsHistory.map((earning, index) => (
                    <HStack key={index} justify="space-between" w="full" p={3} bg="gray.50" rounded="md">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{earning.method}</Text>
                        <Text fontSize="sm" color="gray.600">{earning.date}</Text>
                      </VStack>
                      <HStack spacing={2}>
                        <Icon as={earning.type === 'coins' ? FaCoins : FaGem} color={earning.type === 'coins' ? 'gold' : 'blue'} />
                        <Text fontWeight="bold">{earning.amount}</Text>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
} 