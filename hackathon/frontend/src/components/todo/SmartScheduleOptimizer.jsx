import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Collapse,
  IconButton,
  Progress,
  Divider,
  Select,
  Switch,
  FormControl,
  FormLabel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Tooltip,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCalendar, 
  FiClock, 
  FiTrendingUp, 
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiSettings,
  FiChevronDown,
  FiChevronUp,
  FiTarget,
  FiZap
} from 'react-icons/fi';
import { optimizeSchedule } from '../../api';

const MotionBox = motion.create ? motion.create(Box) : motion(Box);
const MotionCard = motion.create ? motion.create(Card) : motion(Card);

export default function SmartScheduleOptimizer({ todos, onOptimizationApplied }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [dateRange, setDateRange] = useState('week');
  const [autoApply, setAutoApply] = useState(false);
  const [preferences, setPreferences] = useState({
    workingHours: { start: '09:00', end: '17:00' },
    preferredStudyTime: 'morning',
    maxTasksPerDay: 5,
    breakTime: 15
  });
  const _toast = useToast();

  const _getDateRange = () => {
    const now = new Date();
    const _ranges = {
      week: {
        start: now,
        end: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      },
      month: {
        start: now,
        end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      },
      custom: {
        start: now,
        end: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      }
    };
    return _ranges[dateRange];
  };

  const _handleOptimize = async () => {
    setLoading(true);
    try {
      const response = await optimizeSchedule(
        _getDateRange(),
        preferences,
        autoApply
      );

      setAnalysis(response.data?.data || response.data);
      
      if (response.data.success) {
        _toast({
          title: 'Phân tích hoàn thành!',
          description: response.data.message,
          status: 'success',
          duration: 5000,
        });

        if (autoApply && (response.data.appliedOptimizations?.length > 0 || response.data.data?.appliedOptimizations?.length > 0)) {
          const applied = response.data.appliedOptimizations || response.data.data?.appliedOptimizations || [];
          _toast({
            title: 'Đã áp dụng tối ưu hóa!',
            description: `Đã áp dụng ${applied.length} thay đổi`,
            status: 'info',
            duration: 5000,
          });
          
          if (onOptimizationApplied) {
            onOptimizationApplied();
          }
        }
      }
    } catch (error) {
      console.error('Error optimizing schedule:', error);
      _toast({
        title: 'Lỗi',
        description: 'Không thể phân tích lịch trình. Vui lòng thử lại.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const _getAlertColor = (_type) => {
    switch (_type) {
      case 'critical': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  const _getWorkloadColor = (_distribution) => {
    switch (_distribution) {
      case 'overloaded': return 'red';
      case 'balanced': return 'green';
      case 'underutilized': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <HStack spacing={3}>
            <Box p={2} bg="purple.100" borderRadius="lg">
              <FiZap color="purple" size={20} />
            </Box>
            <VStack align="start" spacing={0}>
              <Heading size="md" color="purple.600">
                🧠 Smart Schedule Optimizer
              </Heading>
              <Text fontSize="sm" color="gray.600">
                AI phân tích và tối ưu hóa lịch trình học tập của bạn
              </Text>
            </VStack>
          </HStack>
        </CardHeader>

        <CardBody>
          <VStack spacing={4} align="stretch">
            {/* Settings */}
            <Box p={4} bg="gray.50" borderRadius="lg">
              <Text fontWeight="bold" mb={3}>⚙️ Cài đặt phân tích</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Khoảng thời gian</FormLabel>
                  <Select 
                    value={dateRange} 
                    onChange={(e) => setDateRange(e.target.value)}
                    size="sm"
                  >
                    <option value="week">7 ngày tới</option>
                    <option value="month">30 ngày tới</option>
                    <option value="custom">14 ngày tới</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">Thời gian học ưa thích</FormLabel>
                  <Select 
                    value={preferences.preferredStudyTime}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      preferredStudyTime: e.target.value
                    })}
                    size="sm"
                  >
                    <option value="morning">Buổi sáng</option>
                    <option value="afternoon">Buổi chiều</option>
                    <option value="evening">Buổi tối</option>
                  </Select>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="auto-apply" mb="0" fontSize="sm">
                    Tự động áp dụng tối ưu hóa
                  </FormLabel>
                  <Switch 
                    id="auto-apply" 
                    isChecked={autoApply}
                    onChange={(e) => setAutoApply(e.target.checked)}
                    colorScheme="purple"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            {/* Analyze Button */}
            <Button
              onClick={_handleOptimize}
              isLoading={loading}
              loadingText="Đang phân tích..."
              colorScheme="purple"
              size="lg"
              leftIcon={<FiRefreshCw />}
              _hover={{ transform: "translateY(-1px)" }}
              transition="all 0.2s"
            >
              Phân Tích & Tối Ưu Hóa
            </Button>

            {/* Results */}
            <AnimatePresence>
              {analysis && (
                <MotionCard
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  variant="outline"
                  borderColor="purple.200"
                >
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {/* Analysis Overview */}
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                        <Stat>
                          <StatLabel>Tổng số task</StatLabel>
                          <StatNumber>{analysis.analysis?.totalTasks || 0}</StatNumber>
                          <StatHelpText>
                            <FiTarget style={{ display: 'inline', marginRight: 4 }} />
                            {analysis.analysis?.totalEstimatedTime || '0 giờ'}
                          </StatHelpText>
                        </Stat>

                        <Stat>
                          <StatLabel>Phân bố công việc</StatLabel>
                          <StatNumber>
                            <Badge 
                              colorScheme={_getWorkloadColor(analysis.analysis?.workloadDistribution)}
                              fontSize="md"
                            >
                              {analysis.analysis?.workloadDistribution === 'balanced' ? 'Cân bằng' :
                               analysis.analysis?.workloadDistribution === 'overloaded' ? 'Quá tải' :
                               analysis.analysis?.workloadDistribution === 'underutilized' ? 'Chưa tối ưu' : 'Không xác định'}
                            </Badge>
                          </StatNumber>
                        </Stat>

                        <Stat>
                          <StatLabel>Gợi ý tối ưu</StatLabel>
                          <StatNumber>{analysis.optimizations?.length || 0}</StatNumber>
                          <StatHelpText>
                            {analysis.appliedOptimizations?.length > 0 && (
                              <>
                                <StatArrow type="increase" />
                                Đã áp dụng {analysis.appliedOptimizations.length}
                              </>
                            )}
                          </StatHelpText>
                        </Stat>
                      </SimpleGrid>

                      <Divider />

                      {/* Conflict Days */}
                      {analysis.analysis?.conflictDays?.length > 0 && (
                        <Box p={4} bg="red.50" borderRadius="lg">
                          <Text fontWeight="bold" color="red.700" mb={2}>
                            ⚠️ Ngày có xung đột ({analysis.analysis.conflictDays.length})
                          </Text>
                          <VStack spacing={2} align="stretch">
                            {analysis.analysis.conflictDays.map((conflict, index) => (
                              <Box key={index} p={2} bg="white" borderRadius="md" border="1px solid" borderColor="red.200">
                                <HStack justify="space-between">
                                  <Text fontSize="sm" fontWeight="medium">
                                    {new Date(conflict.date).toLocaleDateString('vi-VN')}
                                  </Text>
                                  <Badge colorScheme="red" size="sm">
                                    {conflict.tasks} tasks • {conflict.totalTime}
                                  </Badge>
                                </HStack>
                                <Text fontSize="xs" color="red.600">
                                  {conflict.conflictReason}
                                </Text>
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      )}

                      {/* Alerts */}
                      {analysis.alerts?.length > 0 && (
                        <VStack spacing={2} align="stretch">
                          {analysis.alerts.map((alert, index) => (
                            <Alert key={index} status={alert.type === 'critical' ? 'error' : alert.type === 'warning' ? 'warning' : 'info'} borderRadius="lg">
                              <AlertIcon />
                              <Text fontSize="sm">{alert.message}</Text>
                            </Alert>
                          ))}
                        </VStack>
                      )}

                      {/* Optimizations */}
                      {analysis.optimizations?.length > 0 && (
                        <Box>
                          <HStack justify="space-between" mb={3}>
                            <Text fontWeight="bold" color="purple.700">
                              💡 Gợi ý tối ưu hóa ({analysis.optimizations.length})
                            </Text>
                            <IconButton
                              icon={showDetails ? <FiChevronUp /> : <FiChevronDown />}
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowDetails(!showDetails)}
                            />
                          </HStack>
                          
                          <Collapse in={showDetails}>
                            <VStack spacing={2} align="stretch">
                              {analysis.optimizations.map((opt, index) => (
                                <Box key={index} p={3} bg="purple.50" borderRadius="md">
                                  <HStack justify="space-between" mb={1}>
                                    <Badge colorScheme="purple" size="sm">
                                      {opt.type === 'redistribute' ? 'Phân bổ lại' :
                                       opt.type === 'reschedule' ? 'Đổi lịch' :
                                       opt.type === 'priority_change' ? 'Đổi độ ưu tiên' : opt.type}
                                    </Badge>
                                    <Text fontSize="xs" color="gray.600">
                                      Task ID: {opt.taskId}
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm">{opt.reason}</Text>
                                  {opt.suggestedDate && (
                                    <Text fontSize="xs" color="purple.600">
                                      Đề xuất: {new Date(opt.suggestedDate).toLocaleDateString('vi-VN')}
                                    </Text>
                                  )}
                                </Box>
                              ))}
                            </VStack>
                          </Collapse>
                        </Box>
                      )}

                      {/* Tips */}
                      {analysis.recommendations?.tips?.length > 0 && (
                        <Box p={4} bg="blue.50" borderRadius="lg">
                          <Text fontWeight="bold" color="blue.700" mb={2}>
                            💡 Lời khuyên học tập
                          </Text>
                          <List spacing={1}>
                            {analysis.recommendations.tips.map((tip, index) => (
                              <ListItem key={index} fontSize="sm">
                                <ListIcon as={FiCheckCircle} color="blue.500" />
                                {tip}
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </VStack>
                  </CardBody>
                </MotionCard>
              )}
            </AnimatePresence>
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  );
}
