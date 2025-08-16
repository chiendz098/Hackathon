import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Avatar,
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { motion, AnimatePresence   } from 'framer-motion';
import {
  FiMessageCircle,
  FiSend,
  FiBookOpen,
  FiLightbulb,
  FiHelpCircle,
  FiTarget,
  FiRefreshCw,
  FiSettings,
  FiMic,
  FiMicOff,
  FiCopy,
  FiThumbsUp,
  FiThumbsDown,
  FiStar,
  FiZap,
  FiTrendingUp,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { 
  askAI, 
  generateStudyPlan, 
  getRecommendations, 
  generateQuiz,
  getAIStatus 
} from '../../api';
import useAutoScroll from '../../hooks/useAutoScroll';

const _MotionBox = motion.create(Box);
const _MotionCard = motion.create(Card);

export default function AIAssistant() {
  const { user } = useAuth();
  const _toast = useToast();
  
  // State management
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAIStatus] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [studyPlan, setStudyPlan] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [quiz, setQuiz] = useState(null);
  
  // Form states
  const [studyPreferences, setStudyPreferences] = useState({
    goals: '',
    availableTime: '1-2 giờ/ngày',
    learningStyle: 'visual',
    subjects: []
  });
  
  const [quizSettings, setQuizSettings] = useState({
    topic: '',
    difficulty: 'medium',
    questionCount: 5
  });
  
  // Refs
  const _inputRef = useRef(null);
  
  // Auto-scroll hook
  const { messagesEndRef, messagesContainerRef, scrollToBottom, forceScrollToBottom, handleScroll } = useAutoScroll(messages, {
    enabled: true,
    smooth: true,
    scrollOnMount: true,
    scrollOnNewMessage: true,
    delay: 100
  });
  
  // Modal controls
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  
  // Color scheme
  const _cardBg = useColorModeValue('white', 'gray.800');
  const _messageBg = useColorModeValue('blue.50', 'blue.900');
  const _aiMessageBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    fetchAIStatus();
    // Add welcome message
    setMessages([
      {
        id: 1,
        type: 'ai',
        content: `Xin chào ${user?.name || 'bạn'}! 👋 Tôi là AI Assistant, sẵn sàng hỗ trợ bạn trong việc học tập. Tôi có thể giúp bạn:

• 📚 Tạo kế hoạch học tập cá nhân hóa
• 💡 Đưa ra gợi ý cải thiện hiệu quả học tập  
• ❓ Trả lời câu hỏi về bài học
• 📝 Tạo bài quiz để ôn tập
• 💬 Trò chuyện về các chủ đề học tập

Bạn muốn tôi hỗ trợ gì hôm nay?`,
        timestamp: new Date()
      }
    ]);
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAIStatus = async () => {
    try {
      const response = await getAIStatus();
      setAIStatus(response.data);
    } catch (error) {
      console.error('Error fetching AI status:', error);
    }
  };

  // Force scroll to bottom when messages are first loaded
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        forceScrollToBottom();
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, forceScrollToBottom]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await askAI(inputMessage.trim());
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      
      _toast({
        title: '❌ Lỗi AI Assistant',
        description: 'Không thể gửi tin nhắn. Vui lòng thử lại.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const _handleGenerateStudyPlan = async () => {
    if (!studyPreferences.goals.trim()) {
      _toast({
        title: '⚠️ Thiếu thông tin',
        description: 'Vui lòng nhập mục tiêu học tập',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const _response = await generateStudyPlan(studyPreferences);
      setStudyPlan(response.data);
      
      _toast({
        title: '✅ Tạo kế hoạch thành công',
        description: 'Kế hoạch học tập đã được tạo',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating study plan:', error);
      _toast({
        title: '❌ Lỗi tạo kế hoạch',
        description: 'Không thể tạo kế hoạch học tập',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const _handleGetRecommendations = async () => {
    setIsLoading(true);
    try {
      const _response = await getRecommendations();
      setRecommendations(response.data.recommendations || []);
      
      _toast({
        title: '✅ Tạo gợi ý thành công',
        description: 'Gợi ý cải thiện đã được tạo',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      _toast({
        title: '❌ Lỗi tạo gợi ý',
        description: 'Không thể tạo gợi ý cải thiện',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const _handleGenerateQuiz = async () => {
    if (!quizSettings.topic.trim()) {
      _toast({
        title: '⚠️ Thiếu thông tin',
        description: 'Vui lòng nhập chủ đề quiz',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const _response = await generateQuiz(
        quizSettings.topic,
        quizSettings.difficulty,
        quizSettings.questionCount
      );
      setQuiz(response.data.quiz);
      
      _toast({
        title: '✅ Tạo quiz thành công',
        description: 'Quiz đã được tạo',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating quiz:', error);
      _toast({
        title: '❌ Lỗi tạo quiz',
        description: 'Không thể tạo quiz',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const _handleKeyPress = (_e) => {
    if (_e.key === 'Enter' && !_e.shiftKey) {
      _e.preventDefault();
      handleSendMessage();
    }
  };

  const _copyToClipboard = (_text) => {
    navigator.clipboard.writeText(_text);
    _toast({
      title: '✅ Đã sao chép',
      description: 'Nội dung đã được sao chép vào clipboard',
      status: 'success',
      duration: 2000,
    });
  };

  if (!aiStatus) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={4}>Đang khởi tạo AI Assistant...</Text>
      </Box>
    );
  }

  if (!aiStatus.enabled) {
    return (
      <Alert status="warning">
        <AlertIcon />
        AI Assistant hiện tại không khả dụng. Vui lòng thử lại sau.
      </Alert>
    );
  }

  return (
    <Box h="100vh" display="flex" flexDirection="column">
      {/* Header */}
      <Card mb={4}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Avatar 
                size="md" 
                bg="blue.500" 
                icon={<FiZap size={20} />}
              />
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight="bold">
                  🤖 AI Learning Assistant
                </Text>
                <HStack spacing={2}>
                  <Badge colorScheme="green" size="sm">
                    {aiStatus.model}
                  </Badge>
                  <Badge colorScheme="blue" size="sm">
                    Online
                  </Badge>
                </HStack>
              </VStack>
            </HStack>
            
            <HStack spacing={2}>
              <Tooltip label="Cài đặt">
                <IconButton
                  icon={<FiSettings />}
                  size="sm"
                  variant="outline"
                  onClick={onSettingsOpen}
                />
              </Tooltip>
              <Tooltip label="Làm mới">
                <IconButton
                  icon={<FiRefreshCw />}
                  size="sm"
                  variant="outline"
                  onClick={fetchAIStatus}
                />
              </Tooltip>
            </HStack>
          </Flex>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs 
        index={activeTab} 
        onChange={setActiveTab} 
        variant="enclosed" 
        colorScheme="blue"
        flex="1"
        display="flex"
        flexDirection="column"
      >
        <TabList>
          <Tab>
            <HStack spacing={2}>
              <FiMessageCircle />
              <Text>Trò chuyện</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <FiBookOpen />
              <Text>Kế hoạch học tập</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <FiLightbulb />
              <Text>Gợi ý cải thiện</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <FiHelpCircle />
              <Text>Tạo Quiz</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels flex="1" display="flex">
          {/* Chat Tab */}
          <TabPanel flex="1" display="flex" flexDirection="column" p={0}>
            <Box 
              flex="1" 
              overflowY="auto" 
              p={4} 
              bg={_cardBg} 
              borderRadius="md"
              ref={messagesContainerRef}
              onScroll={handleScroll}
            >
              <VStack spacing={4} align="stretch">
                <AnimatePresence>
                  {messages.map((message) => (
                    <_MotionBox
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Flex justify={message.type === 'user' ? 'flex-end' : 'flex-start'}>
                        <Box
                          maxW="80%"
                          bg={message.type === 'user' ? _messageBg : _aiMessageBg}
                          p={3}
                          borderRadius="lg"
                          borderBottomRightRadius={message.type === 'user' ? 'sm' : 'lg'}
                          borderBottomLeftRadius={message.type === 'ai' ? 'sm' : 'lg'}
                          position="relative"
                        >
                          <Text whiteSpace="pre-wrap" fontSize="sm">
                            {message.content}
                          </Text>
                          
                          <HStack justify="space-between" mt={2} spacing={2}>
                            <Text fontSize="xs" color="gray.500">
                              {message.timestamp.toLocaleTimeString('vi-VN')}
                            </Text>
                            
                            {message.type === 'ai' && (
                              <HStack spacing={1}>
                                <Tooltip label="Sao chép">
                                  <IconButton
                                    icon={<FiCopy />}
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => _copyToClipboard(message.content)}
                                  />
                                </Tooltip>
                                <Tooltip label="Hữu ích">
                                  <IconButton
                                    icon={<FiThumbsUp />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="green"
                                  />
                                </Tooltip>
                                <Tooltip label="Không hữu ích">
                                  <IconButton
                                    icon={<FiThumbsDown />}
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                  />
                                </Tooltip>
                              </HStack>
                            )}
                          </HStack>
                        </Box>
                      </Flex>
                    </_MotionBox>
                  ))}
                </AnimatePresence>
                
                {isLoading && (
                  <Flex justify="flex-start">
                    <Box bg={_aiMessageBg} p={3} borderRadius="lg">
                      <HStack spacing={2}>
                        <Spinner size="sm" />
                        <Text fontSize="sm">AI đang suy nghĩ...</Text>
                      </HStack>
                    </Box>
                  </Flex>
                )}
                
                <div ref={messagesEndRef} />
              </VStack>
            </Box>
            
            {/* Chat Input */}
            <Box p={4} bg={_cardBg} borderRadius="md" mt={4}>
              <HStack spacing={3}>
                <Textarea
                  ref={_inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={_handleKeyPress}
                  placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
                  resize="none"
                  rows={2}
                  disabled={isLoading}
                />
                <VStack spacing={2}>
                  <Button
                    leftIcon={<FiSend />}
                    colorScheme="blue"
                    onClick={handleSendMessage}
                    isLoading={isLoading}
                    loadingText="Gửi..."
                    disabled={!inputMessage.trim()}
                  >
                    Gửi
                  </Button>
                </VStack>
              </HStack>
            </Box>
          </TabPanel>

          {/* Study Plan Tab */}
          <TabPanel flex="1" p={4}>
            <VStack spacing={6} align="stretch">
              <Card>
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold">
                    📚 Tạo Kế Hoạch Học Tập Cá Nhân Hóa
                  </Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        Mục tiêu học tập của bạn:
                      </Text>
                      <Textarea
                        value={studyPreferences.goals}
                        onChange={(e) => setStudyPreferences(prev => ({
                          ...prev,
                          goals: e.target.value
                        }))}
                        placeholder="Ví dụ: Cải thiện điểm số môn Toán, chuẩn bị kỳ thi cuối kỳ..."
                        rows={3}
                      />
                    </Box>
                    
                    <HStack spacing={4}>
                      <Box flex="1">
                        <Text fontSize="sm" fontWeight="medium" mb={2}>
                          Thời gian có sẵn:
                        </Text>
                        <Select
                          value={studyPreferences.availableTime}
                          onChange={(e) => setStudyPreferences(prev => ({
                            ...prev,
                            availableTime: e.target.value
                          }))}
                        >
                          <option value="30 phút/ngày">30 phút/ngày</option>
                          <option value="1 giờ/ngày">1 giờ/ngày</option>
                          <option value="1-2 giờ/ngày">1-2 giờ/ngày</option>
                          <option value="2-3 giờ/ngày">2-3 giờ/ngày</option>
                          <option value="3+ giờ/ngày">3+ giờ/ngày</option>
                        </Select>
                      </Box>
                      
                      <Box flex="1">
                        <Text fontSize="sm" fontWeight="medium" mb={2}>
                          Phong cách học:
                        </Text>
                        <Select
                          value={studyPreferences.learningStyle}
                          onChange={(e) => setStudyPreferences(prev => ({
                            ...prev,
                            learningStyle: e.target.value
                          }))}
                        >
                          <option value="visual">Thị giác</option>
                          <option value="auditory">Thính giác</option>
                          <option value="kinesthetic">Vận động</option>
                          <option value="reading">Đọc viết</option>
                          <option value="mixed">Hỗn hợp</option>
                        </Select>
                      </Box>
                    </HStack>
                    
                    <Button
                      leftIcon={<FiTarget />}
                      colorScheme="blue"
                      onClick={_handleGenerateStudyPlan}
                      isLoading={isLoading}
                      loadingText="Đang tạo kế hoạch..."
                    >
                      Tạo Kế Hoạch Học Tập
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
              
              {studyPlan && (
                <_MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <CardHeader>
                    <HStack justify="space-between">
                      <Text fontSize="lg" fontWeight="bold">
                        �� Kế Hoạch Học Tập Của Bạn
                      </Text>
                      <Button
                        size="sm"
                        leftIcon={<FiCopy />}
                        variant="outline"
                        onClick={() => _copyToClipboard(studyPlan.studyPlan)}
                      >
                        Sao chép
                      </Button>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <Text whiteSpace="pre-wrap" fontSize="sm">
                      {studyPlan.studyPlan}
                    </Text>
                  </CardBody>
                </_MotionCard>
              )}
            </VStack>
          </TabPanel>

          {/* Recommendations Tab */}
          <TabPanel flex="1" p={4}>
            <VStack spacing={6} align="stretch">
              <Card>
                <CardHeader>
                  <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="bold">
                      💡 Gợi Ý Cải Thiện Hiệu Quả Học Tập
                    </Text>
                    <Button
                      leftIcon={<FiTrendingUp />}
                      colorScheme="purple"
                      onClick={_handleGetRecommendations}
                      isLoading={isLoading}
                      loadingText="Đang phân tích..."
                    >
                      Tạo Gợi Ý
                    </Button>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Text color="gray.600" fontSize="sm">
                    AI sẽ phân tích hoạt động học tập gần đây của bạn và đưa ra những gợi ý cải thiện cá nhân hóa.
                  </Text>
                </CardBody>
              </Card>
              
              {recommendations.length > 0 && (
                <VStack spacing={4} align="stretch">
                  <AnimatePresence>
                    {recommendations.map((rec, index) => (
                      <_MotionCard
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        borderLeft="4px solid"
                        borderLeftColor={
                          rec.priority === 'high' ? 'red.500' :
                          rec.priority === 'medium' ? 'orange.500' : 'green.500'
                        }
                      >
                        <CardBody>
                          <VStack align="start" spacing={3}>
                            <HStack justify="space-between" w="full">
                              <Text fontWeight="bold" fontSize="md">
                                {rec.title}
                              </Text>
                              <Badge 
                                colorScheme={
                                  rec.priority === 'high' ? 'red' :
                                  rec.priority === 'medium' ? 'orange' : 'green'
                                }
                                size="sm"
                              >
                                {rec.priority === 'high' ? 'Cao' :
                                 rec.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                              </Badge>
                            </HStack>
                            
                            <Text fontSize="sm" color="gray.600">
                              {rec.description}
                            </Text>
                            
                            <Box p={3} bg="blue.50" borderRadius="md" w="full">
                              <Text fontSize="sm" fontWeight="medium" color="blue.700" mb={1}>
                                🎯 Cách thực hiện:
                              </Text>
                              <Text fontSize="sm" color="blue.600">
                                {rec.action}
                              </Text>
                            </Box>
                            
                            <Box p={3} bg="green.50" borderRadius="md" w="full">
                              <Text fontSize="sm" fontWeight="medium" color="green.700" mb={1}>
                                ✨ Lợi ích:
                              </Text>
                              <Text fontSize="sm" color="green.600">
                                {rec.benefit}
                              </Text>
                            </Box>
                          </VStack>
                        </CardBody>
                      </_MotionCard>
                    ))}
                  </AnimatePresence>
                </VStack>
              )}
            </VStack>
          </TabPanel>

          {/* Quiz Tab */}
          <TabPanel flex="1" p={4}>
            <VStack spacing={6} align="stretch">
              <Card>
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold">
                    📝 Tạo Quiz Ôn Tập
                  </Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        Chủ đề:
                      </Text>
                      <Input
                        value={quizSettings.topic}
                        onChange={(e) => setQuizSettings(prev => ({
                          ...prev,
                          topic: e.target.value
                        }))}
                        placeholder="Ví dụ: Phương trình bậc hai, Lịch sử Việt Nam..."
                      />
                    </Box>
                    
                    <HStack spacing={4}>
                      <Box flex="1">
                        <Text fontSize="sm" fontWeight="medium" mb={2}>
                          Độ khó:
                        </Text>
                        <Select
                          value={quizSettings.difficulty}
                          onChange={(e) => setQuizSettings(prev => ({
                            ...prev,
                            difficulty: e.target.value
                          }))}
                        >
                          <option value="easy">Dễ</option>
                          <option value="medium">Trung bình</option>
                          <option value="hard">Khó</option>
                        </Select>
                      </Box>
                      
                      <Box flex="1">
                        <Text fontSize="sm" fontWeight="medium" mb={2}>
                          Số câu hỏi:
                        </Text>
                        <Select
                          value={quizSettings.questionCount}
                          onChange={(e) => setQuizSettings(prev => ({
                            ...prev,
                            questionCount: parseInt(e.target.value)
                          }))}
                        >
                          <option value={3}>3 câu</option>
                          <option value={5}>5 câu</option>
                          <option value={10}>10 câu</option>
                          <option value={15}>15 câu</option>
                          <option value={20}>20 câu</option>
                        </Select>
                      </Box>
                    </HStack>
                    
                    <Button
                      leftIcon={<FiHelpCircle />}
                      colorScheme="green"
                      onClick={_handleGenerateQuiz}
                      isLoading={isLoading}
                      loadingText="Đang tạo quiz..."
                    >
                      Tạo Quiz
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
              
              {quiz && (
                <_MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <CardHeader>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontSize="lg" fontWeight="bold">
                          {quiz.title}
                        </Text>
                        <HStack spacing={2}>
                          <Badge colorScheme="blue" size="sm">
                            {quiz.topic}
                          </Badge>
                          <Badge colorScheme="orange" size="sm">
                            {quiz.difficulty === 'easy' ? 'Dễ' : 
                             quiz.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                          </Badge>
                          <Badge colorScheme="green" size="sm">
                            {quiz.questions?.length || 0} câu
                          </Badge>
                        </HStack>
                      </VStack>
                      <Button
                        size="sm"
                        leftIcon={<FiCopy />}
                        variant="outline"
                        onClick={() => _copyToClipboard(JSON.stringify(quiz, null, 2))}
                      >
                        Sao chép
                      </Button>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      {quiz.questions?.map((question, index) => (
                        <Box key={index} p={4} bg="gray.50" borderRadius="md">
                          <VStack align="start" spacing={3}>
                            <Text fontWeight="bold" fontSize="md">
                              Câu {index + 1}: {question.question}
                            </Text>
                            
                            <VStack align="start" spacing={2} w="full">
                              {Object.entries(question.options || {}).map(([key, value]) => (
                                <HStack key={key} spacing={3} w="full">
                                  <Badge 
                                    colorScheme={key === question.correctAnswer ? 'green' : 'gray'}
                                    size="sm"
                                    minW="20px"
                                  >
                                    {key}
                                  </Badge>
                                  <Text fontSize="sm" flex="1">
                                    {value}
                                  </Text>
                                  {key === question.correctAnswer && (
                                    <Badge colorScheme="green" size="sm">
                                      Đúng
                                    </Badge>
                                  )}
                                </HStack>
                              ))}
                            </VStack>
                            
                            {question.explanation && (
                              <Box p={3} bg="blue.50" borderRadius="md" w="full">
                                <Text fontSize="sm" fontWeight="medium" color="blue.700" mb={1}>
                                  💡 Giải thích:
                                </Text>
                                <Text fontSize="sm" color="blue.600">
                                  {question.explanation}
                                </Text>
                              </Box>
                            )}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </_MotionCard>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Cài đặt AI Assistant</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Trạng thái AI:
                </Text>
                <HStack spacing={2}>
                  <Badge colorScheme={aiStatus.enabled ? 'green' : 'red'} size="sm">
                    {aiStatus.enabled ? 'Hoạt động' : 'Không hoạt động'}
                  </Badge>
                  <Badge colorScheme="blue" size="sm">
                    {aiStatus.model}
                  </Badge>
                </HStack>
              </Box>
              
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Tính năng khả dụng:
                </Text>
                <VStack align="start" spacing={1}>
                  {Object.entries(aiStatus.features || {}).map(([feature, enabled]) => (
                    <HStack key={feature} spacing={2}>
                      <Badge colorScheme={enabled ? 'green' : 'gray'} size="sm">
                        {enabled ? '✓' : '✗'}
                      </Badge>
                      <Text fontSize="sm">
                        {feature === 'studyPlan' ? 'Kế hoạch học tập' :
                         feature === 'recommendations' ? 'Gợi ý cải thiện' :
                         feature === 'questionAnswering' ? 'Trả lời câu hỏi' :
                         feature === 'quizGeneration' ? 'Tạo quiz' :
                         feature === 'chatbot' ? 'Trò chuyện' : feature}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
              
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Giới hạn sử dụng:
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {aiStatus.rateLimit?.maxRequests || 20} yêu cầu mỗi {Math.round((aiStatus.rateLimit?.windowMs || 900000) / 60000)} phút
                </Text>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
