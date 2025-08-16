import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Select,
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
  FormControl,
  FormLabel,
  Textarea,
  SimpleGrid,
  Progress,
  Divider,
  List,
  ListItem,
  ListIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiTarget,
  FiCalendar,
  FiClock,
  FiTrendingUp,
  FiBookOpen,
  FiCheckCircle,
  FiStar,
  FiZap
} from 'react-icons/fi';
import { generateLearningPlan } from '../../api';

const MotionBox = motion.create ? motion.create(Box) : motion(Box);
const MotionCard = motion.create ? motion.create(Card) : motion(Card);

export default function AIStudyPlanner({ onPlanGenerated }) {
  const [formData, setFormData] = useState({
    goal: '',
    timeframe: '',
    currentLevel: 'beginner',
    preferences: {
      studyHours: 2,
      preferredTime: 'morning',
      studyStyle: 'visual'
    }
  });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const toast = useToast();

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleGeneratePlan = async () => {
    if (!formData.goal.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập mục tiêu học tập',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await generateLearningPlan(formData.goal, formData.timeframe, formData.currentLevel, formData.preferences);
      setPlan(response.data);
      
      if (onPlanGenerated) {
        onPlanGenerated(response.data);
      }

      toast({
        title: 'Thành công',
        description: 'Đã tạo kế hoạch học tập',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo kế hoạch học tập',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Form Section */}
      <Card>
        <CardHeader>
            <Heading size="md">Tạo kế hoạch học tập AI</Heading>
        </CardHeader>
        <CardBody>
            <VStack spacing={4}>
                <FormControl>
                <FormLabel>Mục tiêu học tập</FormLabel>
                  <Textarea
                    value={formData.goal}
                    onChange={(e) => handleInputChange('goal', e.target.value)}
                  placeholder="Ví dụ: Tôi muốn học lập trình web trong 3 tháng"
                  />
                </FormControl>

                  <FormControl>
                <FormLabel>Khung thời gian</FormLabel>
                    <Select
                      value={formData.timeframe}
                      onChange={(e) => handleInputChange('timeframe', e.target.value)}
                    >
                      <option value="">Chọn thời gian</option>
                  <option value="1-week">1 tuần</option>
                  <option value="2-weeks">2 tuần</option>
                  <option value="1-month">1 tháng</option>
                  <option value="3-months">3 tháng</option>
                  <option value="6-months">6 tháng</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                <FormLabel>Trình độ hiện tại</FormLabel>
                    <Select
                      value={formData.currentLevel}
                      onChange={(e) => handleInputChange('currentLevel', e.target.value)}
                >
                  <option value="beginner">Mới bắt đầu</option>
                  <option value="intermediate">Trung bình</option>
                  <option value="advanced">Nâng cao</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                <FormLabel>Số giờ học mỗi ngày</FormLabel>
                <Input
                  type="number"
                      value={formData.preferences.studyHours}
                      onChange={(e) => handleInputChange('preferences.studyHours', parseInt(e.target.value))}
                  min={1}
                  max={12}
                />
                  </FormControl>

                  <FormControl>
                <FormLabel>Thời gian học tốt nhất</FormLabel>
                    <Select
                      value={formData.preferences.preferredTime}
                      onChange={(e) => handleInputChange('preferences.preferredTime', e.target.value)}
                    >
                      <option value="morning">Buổi sáng</option>
                      <option value="afternoon">Buổi chiều</option>
                      <option value="evening">Buổi tối</option>
                  <option value="flexible">Linh hoạt</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                <FormLabel>Phong cách học</FormLabel>
                    <Select
                      value={formData.preferences.studyStyle}
                      onChange={(e) => handleInputChange('preferences.studyStyle', e.target.value)}
                    >
                  <option value="visual">Trực quan (hình ảnh, video)</option>
                  <option value="auditory">Thính giác (nghe giảng)</option>
                  <option value="reading">Đọc hiểu</option>
                      <option value="kinesthetic">Thực hành</option>
                    </Select>
                  </FormControl>

            <Button
                colorScheme="blue"
              onClick={handleGeneratePlan}
              isLoading={loading}
                leftIcon={<FiTarget />}
                width="full"
              >
                Tạo kế hoạch
            </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Generated Plan Section */}
        {plan && (
            <AnimatePresence>
                <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CardHeader>
                <Heading size="md">Kế hoạch học tập của bạn</Heading>
              </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                  {/* Overview */}
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Tổng quan
                              </Text>
                    <Text>{plan.overview}</Text>
                            </Box>

                  <Divider />

                  {/* Timeline */}
                            <Box>
                    <Text fontWeight="bold" mb={2}>
                      Lộ trình học tập
                    </Text>
                    <List spacing={3}>
                      {plan.timeline.map((item, index) => (
                        <ListItem key={index}>
                          <HStack>
                                    <ListIcon as={FiCheckCircle} color="green.500" />
                            <Text>{item}</Text>
                          </HStack>
                                  </ListItem>
                                ))}
                              </List>
                            </Box>

                  <Divider />

                  {/* Resources */}
                            <Box>
                    <Text fontWeight="bold" mb={2}>
                      Tài nguyên học tập
                    </Text>
                    <SimpleGrid columns={[1, 2]} spacing={4}>
                      {plan.resources.map((resource, index) => (
                        <Card key={index} variant="outline">
                          <CardBody>
                            <VStack align="start" spacing={2}>
                              <Heading size="sm">{resource.title}</Heading>
                              <Text fontSize="sm">{resource.description}</Text>
                              <Tag colorScheme="blue" size="sm">
                                <TagLabel>{resource.type}</TagLabel>
                              </Tag>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                            </Box>

                  {/* Progress Tracking */}
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Theo dõi tiến độ
                              </Text>
                    <Progress
                      value={0}
                      colorScheme="blue"
                      hasStripe
                      isAnimated
                      mb={2}
                    />
                    <Text fontSize="sm" color="gray.500">
                      Bắt đầu kế hoạch học tập của bạn
                              </Text>
                            </Box>
                    </VStack>
                  </CardBody>
                </MotionCard>
          </AnimatePresence>
              )}
          </VStack>
    </Box>
  );
}
