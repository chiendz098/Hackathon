import React, { useState, useEffect } from 'react';
import { useToast, Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Button,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Flex,
  Divider,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Tooltip,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
 } from '@chakra-ui/react';
import { motion, AnimatePresence   } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  FiTrendingUp,
  FiClock,
  FiTarget,
  FiZap,
  FiCalendar,
  FiBookOpen,
  FiAward,
  FiUsers,
  FiRefreshCw,
  FiDownload,
  FiShare2,
  FiSettings,
  FiEye,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiSun,
  FiTrendingDown,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import { getInsights, exportAnalytics } from '../../api';

const _MotionBox = motion.create(Box);
const _MotionCard = motion.create(Card);

export default function LearningAnalyticsDashboard() {
  const { user } = useAuth();
  const { userProgress } = useGamification();
  
  // State management
  const [analyticsData, setAnalyticsData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal controls
  const { isOpen: isInsightsOpen, onOpen: onInsightsOpen, onClose: onInsightsClose } = useDisclosure();
  
  // Color scheme
  const _cardBg = useColorModeValue('white', 'gray.800');
  const _borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Chart colors
  const _chartColors = {
    primary: '#3182CE',
    secondary: '#38A169',
    accent: '#D69E2E',
    warning: '#E53E3E',
    info: '#805AD5',
    success: '#48BB78'
  };

  useEffect(() => {
    _fetchAnalytics();
    _fetchInsights();
  }, [timeframe]);

  const _fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Use insights data instead of analytics
      const response = await getInsights({ timeframe });
      if (response.data) {
        setAnalyticsData(response.data);
      } else {
        setAnalyticsData(null);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const _fetchInsights = async () => {
    try {
      const response = await getInsights({ timeframe });
      if (response.data && response.data.insights) {
        setInsights(response.data.insights);
      } else {
        setInsights([]);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      setInsights([]);
    }
  };

  const _handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([_fetchAnalytics(), _fetchInsights()]);
    setRefreshing(false);
  };

  const _handleExport = async () => {
    try {
      const response = await exportAnalytics({ timeframe, format: 'json' });
      if (response.data) {
        // Create downloadable file
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
      link.href = url;
        link.setAttribute('download', `learning-analytics-${timeframe}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  const _getTimeframeLabel = (tf) => {
    const labels = {
      '7d': 'Tuần này',
      '30d': 'Tháng này',
      '90d': '3 tháng',
      '365d': 'Năm này'
    };
    return labels[tf] || tf;
  };

  const _formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const _getInsightIcon = (type) => {
    const icons = {
      'performance': FiTrendingUp,
      'habit': FiTarget,
      'efficiency': FiZap,
      'recommendation': FiSun,
      'warning': FiTrendingDown,
      'achievement': FiAward
    };
    return icons[type] || FiZap;
  };

  const _getInsightColor = (type) => {
    const colors = {
      'performance': 'green',
      'habit': 'blue',
      'efficiency': 'purple',
      'recommendation': 'orange',
      'warning': 'red',
      'achievement': 'yellow'
    };
    return colors[type] || 'gray';
  };

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={4}>Đang tải dữ liệu phân tích...</Text>
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Alert status="error">
        <AlertIcon />
        Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.
      </Alert>
    );
  }

  return (
    <Box p={6}>
      {/* Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        mb={6}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              📊 Learning Analytics Dashboard
            </Text>
            <Text color="gray.600">
              Phân tích chi tiết về quá trình học tập và tiến độ của bạn
            </Text>
          </VStack>
          
          <HStack spacing={3}>
            <Select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              size="sm"
              w="150px"
            >
              <option value="7d">7 ngày</option>
              <option value="30d">30 ngày</option>
              <option value="90d">90 ngày</option>
              <option value="365d">1 năm</option>
            </Select>
            
            <Tooltip label="Làm mới dữ liệu">
              <IconButton
                icon={<FiRefreshCw />}
                size="sm"
                variant="outline"
                onClick={_handleRefresh}
                isLoading={refreshing}
              />
            </Tooltip>
            
            <Tooltip label="Xuất báo cáo">
              <IconButton
                icon={<FiDownload />}
                size="sm"
                variant="outline"
                onClick={_handleExport}
              />
            </Tooltip>
            
            <Button
                              leftIcon={<FiZap />}
              colorScheme="purple"
              size="sm"
              onClick={onInsightsOpen}
            >
              AI Insights
            </Button>
          </HStack>
        </Flex>
      </MotionBox>

      {/* Key Metrics */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        mb={6}
      >
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <MotionCard
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            bg={cardBg}
            borderColor={borderColor}
          >
            <CardBody>
              <Stat>
                <StatLabel fontSize="sm" color="gray.600">
                  <HStack spacing={2}>
                    <FiClock />
                    <Text>Tổng thời gian học</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="blue.600" fontSize="2xl">
                  {_formatDuration(analyticsData.totalStudyTime || 0)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={analyticsData.studyTimeChange >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(analyticsData.studyTimeChange || 0)}% so với kỳ trước
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            bg={cardBg}
            borderColor={borderColor}
          >
            <CardBody>
              <Stat>
                <StatLabel fontSize="sm" color="gray.600">
                  <HStack spacing={2}>
                    <FiTarget />
                    <Text>Nhiệm vụ hoàn thành</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="green.600" fontSize="2xl">
                  {analyticsData.completedTasks || 0}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={analyticsData.taskCompletionChange >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(analyticsData.taskCompletionChange || 0)}% so với kỳ trước
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            bg={cardBg}
            borderColor={borderColor}
          >
            <CardBody>
              <Stat>
                <StatLabel fontSize="sm" color="gray.600">
                  <HStack spacing={2}>
                    <FiZap />
                    <Text>Điểm hiệu suất</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="purple.600" fontSize="2xl">
                  {analyticsData.efficiencyScore || 0}%
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={analyticsData.efficiencyChange >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(analyticsData.efficiencyChange || 0)}% so với kỳ trước
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            bg={cardBg}
            borderColor={borderColor}
          >
            <CardBody>
              <Stat>
                <StatLabel fontSize="sm" color="gray.600">
                  <HStack spacing={2}>
                    <FiCalendar />
                    <Text>Chuỗi ngày học</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="orange.600" fontSize="2xl">
                  {analyticsData.currentStreak || 0}
                </StatNumber>
                <StatHelpText>
                  Kỷ lục: {analyticsData.longestStreak || 0} ngày
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>
        </SimpleGrid>
      </MotionBox>

      {/* Charts and Detailed Analytics */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <FiActivity />
                <Text>Hoạt động học tập</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FiBarChart2 />
                <Text>Hiệu suất</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FiPieChart />
                <Text>Phân bổ thời gian</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FiZap />
                <Text>Phân tích nâng cao</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Activity Tab */}
            <TabPanel p={0} pt={6}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Text fontSize="lg" fontWeight="bold">
                      Thời gian học theo ngày
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analyticsData.dailyStudyTime || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Area
                          type="monotone"
                          dataKey="minutes"
                          stroke={chartColors.primary}
                          fill={chartColors.primary}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                <Card bg={cardBg}>
                  <CardHeader>
                    <Text fontSize="lg" fontWeight="bold">
                      Nhiệm vụ hoàn thành
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.taskCompletion || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="completed" fill={chartColors.success} />
                        <Bar dataKey="created" fill={chartColors.info} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            {/* Performance Tab */}
            <TabPanel p={0} pt={6}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Text fontSize="lg" fontWeight="bold">
                      Điểm hiệu suất theo thời gian
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData.performanceOverTime || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <RechartsTooltip />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke={chartColors.accent}
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                <Card bg={cardBg}>
                  <CardHeader>
                    <Text fontSize="lg" fontWeight="bold">
                      Phân tích kỹ năng
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={analyticsData.skillAnalysis || []}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="skill" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          name="Điểm số"
                          dataKey="score"
                          stroke={chartColors.info}
                          fill={chartColors.info}
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            {/* Time Distribution Tab */}
            <TabPanel p={0} pt={6}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Text fontSize="lg" fontWeight="bold">
                      Phân bổ thời gian theo môn học
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.subjectDistribution || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="minutes"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {(analyticsData.subjectDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={Object.values(chartColors)[index % Object.values(chartColors).length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                <Card bg={cardBg}>
                  <CardHeader>
                    <Text fontSize="lg" fontWeight="bold">
                      Thời gian học theo giờ trong ngày
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.hourlyDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="minutes" fill={chartColors.secondary} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            {/* Advanced Analytics Tab */}
            <TabPanel p={0} pt={6}>
              <VStack spacing={6} align="stretch">
                <Card bg={cardBg}>
                  <CardHeader>
                    <Text fontSize="lg" fontWeight="bold">
                      Phân tích xu hướng học tập
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <VStack spacing={2}>
                        <Text fontSize="sm" color="gray.600">Thời gian học trung bình/ngày</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                          {_formatDuration(analyticsData.avgDailyStudyTime || 0)}
                        </Text>
                        <Progress
                          value={(analyticsData.avgDailyStudyTime || 0) / 120 * 100}
                          colorScheme="blue"
                          size="sm"
                          w="full"
                        />
                      </VStack>
                      
                      <VStack spacing={2}>
                        <Text fontSize="sm" color="gray.600">Tỷ lệ hoàn thành nhiệm vụ</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="green.600">
                          {analyticsData.taskCompletionRate || 0}%
                        </Text>
                        <Progress
                          value={analyticsData.taskCompletionRate || 0}
                          colorScheme="green"
                          size="sm"
                          w="full"
                        />
                      </VStack>
                      
                      <VStack spacing={2}>
                        <Text fontSize="sm" color="gray.600">Điểm tập trung</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                          {analyticsData.focusScore || 0}%
                        </Text>
                        <Progress
                          value={analyticsData.focusScore || 0}
                          colorScheme="purple"
                          size="sm"
                          w="full"
                        />
                      </VStack>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Text fontSize="lg" fontWeight="bold">
                        Mẫu học tập theo tuần
                      </Text>
                    </CardHeader>
                    <CardBody>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analyticsData.weeklyPattern || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="minutes" fill={chartColors.accent} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg}>
                    <CardHeader>
                      <Text fontSize="lg" fontWeight="bold">
                        Thành tích gần đây
                      </Text>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        {(analyticsData.recentAchievements || []).map((achievement, index) => (
                          <HStack key={index} spacing={3} p={2} borderRadius="md" bg="gray.50">
                            <Box color="yellow.500">
                              <FiAward size={20} />
                            </Box>
                            <VStack align="start" spacing={0} flex="1">
                              <Text fontSize="sm" fontWeight="bold">
                                {achievement.name}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                {new Date(achievement.earnedAt).toLocaleDateString('vi-VN')}
                              </Text>
                            </VStack>
                            <Badge colorScheme="yellow" size="sm">
                              +{achievement.xpAwarded} XP
                            </Badge>
                          </HStack>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </MotionBox>

      {/* AI Insights Modal */}
      <Modal isOpen={isInsightsOpen} onClose={onInsightsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
                              <FiZap color="purple" />
              <Text>AI Learning Insights</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              {insights.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  Chưa có đủ dữ liệu để tạo insights. Hãy tiếp tục học tập!
                </Alert>
              ) : (insights.map((insight, index) => {
                  const IconComponent = _getInsightIcon(insight.type);
                  return (
                    <MotionBox
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card borderLeft="4px solid" borderLeftColor={`${_getInsightColor(insight.type)}.500`}>
                        <CardBody>
                          <HStack spacing={3} align="start">
                            <Box color={`${_getInsightColor(insight.type)}.500`} mt={1}>
                              <IconComponent size={20} />
                            </Box>
                            <VStack align="start" spacing={2} flex="1">
                              <HStack justify="space-between" w="full">
                                <Text fontWeight="bold" fontSize="md">
                                  {insight.title}
                                </Text>
                                <Badge colorScheme={_getInsightColor(insight.type)} size="sm">
                                  {insight.type}
                                </Badge>
                              </HStack>
                              <Text fontSize="sm" color="gray.600">
                                {insight.description}
                              </Text>
                              {insight.recommendation && (
                                <Box p={3} bg="blue.50" borderRadius="md" w="full">
                                  <Text fontSize="sm" fontWeight="medium" color="blue.700">
                                    💡 Gợi ý: {insight.recommendation}
                                  </Text>
                                </Box>
                              )}
                            </VStack>
                          </HStack>
                        </CardBody>
                      </Card>
                    </MotionBox>
                  );
                })
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
