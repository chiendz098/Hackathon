import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Badge,
  Progress,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Divider,
  IconButton,
  Tooltip,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { motion, AnimatePresence   } from 'framer-motion';
import {
  FiTrophy,
  FiMedal,
  FiAward,
  FiStar,
  FiTrendingUp,
  FiUsers,
  FiCalendar,
  FiTarget,
  FiZap,
  FiCrown,
  FiGift,
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiHeart,
  FiThumbsUp,
  FiShare2,
  FiFilter,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import { getLeaderboard, getUserProfile } from '../../api';

const _MotionBox = motion.create(Box);
const _MotionCard = motion.create(Card);

export default function EnhancedLeaderboard() {
  const { user } = useAuth();
  const { userProgress } = useGamification();
  const _toast = useToast();
  
  // State management
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [categoryFilter, setCategoryFilter] = useState('overall');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Modal controls
  const { isOpen: isProfileOpen, onOpen: onProfileOpen, onClose: onProfileClose } = useDisclosure();
  
  // Leaderboard categories
  const _categories = [
    { id: 'overall', name: 'Tổng thể', icon: FiTrophy, color: 'gold' },
    { id: 'xp', name: 'Kinh nghiệm', icon: FiZap, color: 'blue' },
    { id: 'tasks', name: 'Nhiệm vụ', icon: FiTarget, color: 'green' },
    { id: 'streak', name: 'Chuỗi ngày', icon: FiCalendar, color: 'orange' },
    { id: 'study_time', name: 'Thời gian học', icon: FiTrendingUp, color: 'purple' },
  ];
  
  // Time filters
  const _timeFilters = [
    { id: 'daily', name: 'Hôm nay' },
    { id: 'weekly', name: 'Tuần này' },
    { id: 'monthly', name: 'Tháng này' },
    { id: 'all_time', name: 'Mọi thời gian' },
  ];
  
  useEffect(() => {
    fetchLeaderboardData();
  }, [timeFilter, categoryFilter]);
  
  const _fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const _response = await getLeaderboard({
        timeframe: timeFilter,
        category: categoryFilter,
        limit: 50
      });
      
      setLeaderboardData(response.data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: '❌ Lỗi tải bảng xếp hạng',
        description: 'Không thể tải dữ liệu bảng xếp hạng',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const _handleUserClick = async (_userData) => {
    try {
      const response = await getUserProfile(userData.userId);
      setSelectedUser(response.data);
      onProfileOpen();
    } catch (error) {
      toast({
        title: '❌ Lỗi tải profile',
        description: 'Không thể tải thông tin người dùng',
        status: 'error',
        duration: 3000,
      });
    }
  };
  
  const _getRankIcon = (_rank) => {
    switch (rank) {
      case 1: return <FiCrown color="gold" size={24} />;
      case 2: return <FiMedal color="silver" size={20} />;
      case 3: return <FiAward color="#CD7F32" size={18} />;
      default: return <Text fontWeight="bold" color="gray.500">#{rank}</Text>;
    }
  };
  
  const _getRankColor = (_rank) => {
    switch (rank) {
      case 1: return 'yellow';
      case 2: return 'gray';
      case 3: return 'orange';
      default: return 'blue';
    }
  };
  
  const _getProgressColor = (_rank) => {
    switch (rank) {
      case 1: return 'yellow';
      case 2: return 'gray';
      case 3: return 'orange';
      default: return 'blue';
    }
  };
  
  // Filter leaderboard data based on search
  const _filteredData = leaderboardData.filter(item =>
    item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Find current user's position
  const _currentUserRank = leaderboardData.findIndex(item => item.userId === user?.id) + 1;
  const _currentUserData = leaderboardData.find(item => item.userId === user?.id);

  return (
    <Box>
      {/* Header Section */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        mb={6}
      >
        <Card bg="gradient-to-r from-yellow-50 to-orange-50" borderColor="yellow.200" borderWidth="2px">
          <CardBody>
            <VStack spacing={4}>
              <HStack spacing={3}>
                <Box p={3} bg="yellow.100" borderRadius="full">
                  <FiTrophy size={32} color="orange" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                    🏆 Bảng Xếp Hạng
                  </Text>
                  <Text color="gray.600">
                    Cạnh tranh và thể hiện thành tích học tập của bạn
                  </Text>
                </VStack>
              </HStack>
              
              {/* Current User Stats */}
              {currentUserData && (
                <Card w="full" bg="white" borderColor="yellow.300">
                  <CardBody>
                    <HStack justify="space-between">
                      <HStack spacing={4}>
                        <Avatar 
                          name={user?.name} 
                          size="md" 
                          bg="yellow.500"
                        />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold">{user?.name}</Text>
                          <HStack spacing={2}>
                            <Badge colorScheme={getRankColor(currentUserRank)} size="sm">
                              Hạng #{currentUserRank}
                            </Badge>
                            <Badge colorScheme="blue" size="sm">
                              {currentUserData.totalXP || 0} XP
                            </Badge>
                          </HStack>
                        </VStack>
                      </HStack>
                      
                      <VStack align="end" spacing={1}>
                        <Text fontSize="sm" color="gray.600">Tiến độ level</Text>
                        <Progress 
                          value={((currentUserData.totalXP || 0) % 1000) / 10} 
                          colorScheme="yellow" 
                          size="sm" 
                          w="100px"
                          borderRadius="full"
                        />
                        <Text fontSize="xs" color="gray.500">
                          Level {Math.floor((currentUserData.totalXP || 0) / 1000) + 1}
                        </Text>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </CardBody>
        </Card>
      </MotionBox>

      {/* Filters and Search */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        mb={6}
      >
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <HStack justify="space-between" w="full" flexWrap="wrap" spacing={4}>
                <HStack spacing={3}>
                  <Select 
                    value={timeFilter} 
                    onChange={(e) => setTimeFilter(e.target.value)}
                    size="sm"
                    w="150px"
                  >
                    {timeFilters.map(filter => (
                      <option key={filter.id} value={filter.id}>
                        {filter.name}
                      </option>
                    ))}
                  </Select>
                  
                  <Select 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    size="sm"
                    w="150px"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </HStack>
                
                <HStack spacing={2}>
                  <InputGroup size="sm" w="200px">
                    <InputLeftElement>
                      <FiSearch color="gray" />
                    </InputLeftElement>
                    <Input
                      placeholder="Tìm kiếm người dùng..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                  
                  <Tooltip label="Làm mới">
                    <IconButton
                      icon={<FiRefreshCw />}
                      size="sm"
                      variant="outline"
                      onClick={fetchLeaderboardData}
                      isLoading={loading}
                    />
                  </Tooltip>
                </HStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </MotionBox>

      {/* Leaderboard Content */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <FiTrophy />
                <Text>Bảng xếp hạng</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FiUsers />
                <Text>Thống kê</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FiGift />
                <Text>Giải thưởng</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Main Leaderboard */}
            <TabPanel p={0}>
              {loading ? (
                <Card>
                  <CardBody>
                    <VStack spacing={4} py={8}>
                      <Spinner size="xl" color="blue.500" />
                      <Text>Đang tải bảng xếp hạng...</Text>
                    </VStack>
                  </CardBody>
                </Card>
              ) : filteredData.length === 0 ? (
                <Card>
                  <CardBody>
                    <Alert status="info">
                      <AlertIcon />
                      <Text>Không tìm thấy dữ liệu bảng xếp hạng.</Text>
                    </Alert>
                  </CardBody>
                </Card>
              ) : (
                <VStack spacing={3} align="stretch">
                  <AnimatePresence>
                    {filteredData.map((item, index) => (
                      <MotionCard
                        key={item.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        variant={item.userId === user?.id ? "solid" : "outline"}
                        bg={item.userId === user?.id ? "blue.50" : "white"}
                        borderColor={item.userId === user?.id ? "blue.200" : "gray.200"}
                        _hover={{ 
                          shadow: 'md', 
                          transform: 'translateY(-2px)',
                          borderColor: 'blue.300'
                        }}
                        cursor="pointer"
                        onClick={() => handleUserClick(item)}
                      >
                        <CardBody py={4}>
                          <HStack justify="space-between">
                            <HStack spacing={4}>
                              <Box minW="40px" textAlign="center">
                                {getRankIcon(index + 1)}
                              </Box>
                              
                              <Avatar 
                                name={item.user?.name || 'User'} 
                                size="md"
                                bg={`${getRankColor(index + 1)}.500`}
                              />
                              
                              <VStack align="start" spacing={1}>
                                <HStack spacing={2}>
                                  <Text fontWeight="bold" fontSize="lg">
                                    {item.user?.name || 'Unknown User'}
                                  </Text>
                                  {item.userId === user?.id && (
                                    <Badge colorScheme="blue" size="sm">Bạn</Badge>
                                  )}
                                  {index < 3 && (
                                    <Badge colorScheme={getRankColor(index + 1)} size="sm">
                                      Top {index + 1}
                                    </Badge>
                                  )}
                                </HStack>
                                
                                <HStack spacing={3} fontSize="sm" color="gray.600">
                                  <HStack spacing={1}>
                                    <FiZap size={14} />
                                    <Text>{item.totalXP || 0} XP</Text>
                                  </HStack>
                                  <HStack spacing={1}>
                                    <FiTarget size={14} />
                                    <Text>{item.tasksCompleted || 0} tasks</Text>
                                  </HStack>
                                  <HStack spacing={1}>
                                    <FiCalendar size={14} />
                                    <Text>{item.currentStreak || 0} ngày</Text>
                                  </HStack>
                                </HStack>
                              </VStack>
                            </HStack>
                            
                            <VStack align="end" spacing={2}>
                              <Text fontSize="lg" fontWeight="bold" color={`${getRankColor(index + 1)}.600`}>
                                Level {Math.floor((item.totalXP || 0) / 1000) + 1}
                              </Text>
                              <Progress 
                                value={((item.totalXP || 0) % 1000) / 10} 
                                colorScheme={getProgressColor(index + 1)} 
                                size="sm" 
                                w="100px"
                                borderRadius="full"
                              />
                              <HStack spacing={2}>
                                <Tooltip label="Xem profile">
                                  <IconButton
                                    icon={<FiEye />}
                                    size="xs"
                                    variant="ghost"
                                    onClick={(_e) => {
                                      e.stopPropagation();
                                      handleUserClick(item);
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip label="Thích">
                                  <IconButton
                                    icon={<FiHeart />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                  />
                                </Tooltip>
                              </HStack>
                            </VStack>
                          </HStack>
                        </CardBody>
                      </MotionCard>
                    ))}
                  </AnimatePresence>
                </VStack>
              )}
            </TabPanel>

            {/* Statistics Tab */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                <Card>
                  <CardBody textAlign="center">
                    <VStack spacing={3}>
                      <Box p={3} bg="blue.100" borderRadius="full">
                        <FiUsers size={24} color="blue" />
                      </Box>
                      <Text fontWeight="bold">Tổng người dùng</Text>
                      <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                        {leaderboardData.length}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardBody textAlign="center">
                    <VStack spacing={3}>
                      <Box p={3} bg="green.100" borderRadius="full">
                        <FiZap size={24} color="green" />
                      </Box>
                      <Text fontWeight="bold">Tổng XP</Text>
                      <Text fontSize="2xl" fontWeight="bold" color="green.600">
                        {leaderboardData.reduce((sum, item) => sum + (item.totalXP || 0), 0).toLocaleString()}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardBody textAlign="center">
                    <VStack spacing={3}>
                      <Box p={3} bg="purple.100" borderRadius="full">
                        <FiTarget size={24} color="purple" />
                      </Box>
                      <Text fontWeight="bold">Tổng nhiệm vụ</Text>
                      <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                        {leaderboardData.reduce((sum, item) => sum + (item.tasksCompleted || 0), 0).toLocaleString()}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            {/* Rewards Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Text>
                    Hệ thống giải thưởng và phần thưởng đang được phát triển. 
                    Sẽ bao gồm các phần thưởng hấp dẫn cho top performers!
                  </Text>
                </Alert>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card bg="yellow.50" borderColor="yellow.200">
                    <CardBody>
                      <VStack spacing={3}>
                        <FiCrown size={32} color="gold" />
                        <Text fontWeight="bold" color="yellow.700">Vương miện vàng</Text>
                        <Text fontSize="sm" color="gray.600" textAlign="center">
                          Dành cho người đứng đầu bảng xếp hạng tổng thể
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card bg="gray.50" borderColor="gray.200">
                    <CardBody>
                      <VStack spacing={3}>
                        <FiMedal size={32} color="silver" />
                        <Text fontWeight="bold" color="gray.700">Huy chương bạc</Text>
                        <Text fontSize="sm" color="gray.600" textAlign="center">
                          Dành cho người đứng thứ 2 bảng xếp hạng
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </MotionBox>

      {/* User Profile Modal */}
      <Modal isOpen={isProfileOpen} onClose={onProfileClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={3}>
              <Avatar name={selectedUser?.name} size="md" />
              <VStack align="start" spacing={0}>
                <Text>{selectedUser?.name}</Text>
                <Text fontSize="sm" color="gray.500">{selectedUser?.email}</Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedUser && (
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={2} spacing={4}>
                  <Stat>
                    <StatLabel>Tổng XP</StatLabel>
                    <StatNumber>{selectedUser.totalXP || 0}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Level</StatLabel>
                    <StatNumber>{Math.floor((selectedUser.totalXP || 0) / 1000) + 1}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Nhiệm vụ hoàn thành</StatLabel>
                    <StatNumber>{selectedUser.tasksCompleted || 0}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Chuỗi ngày</StatLabel>
                    <StatNumber>{selectedUser.currentStreak || 0}</StatNumber>
                  </Stat>
                </SimpleGrid>
                
                <Divider />
                
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Thông tin chi tiết và thành tích sẽ được hiển thị ở đây
                </Text>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
