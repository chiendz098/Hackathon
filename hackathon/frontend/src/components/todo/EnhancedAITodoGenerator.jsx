import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Textarea,
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
  Tooltip,
  Progress,
  Divider,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { 
  FiSend, 
  FiTarget, 
  FiClock, 
  FiTrendingUp, 
  FiBookOpen,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiCalendar,
  FiStar
} from 'react-icons/fi';
import { generateEnhancedTodos } from '../../api';

const MotionBox = motion.create ? motion.create(Box) : motion(Box);
const MotionCard = motion.create ? motion.create(Card) : motion(Card);

export default function EnhancedAITodoGenerator({ onTodosGenerated }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const _toast = useToast();

  const _handleGenerate = async () => {
    if (!input.trim()) {
      _toast({
        title: 'Vui lòng nhập yêu cầu',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await generateEnhancedTodos(input, {
        timestamp: new Date().toISOString(),
        userPreferences: {
          preferredStudyTime: 'morning',
          difficultyLevel: 'intermediate'
        }
      });

      setResult(response.data?.data || response.data);
      
      if (response.data.success && (response.data.createdTodos > 0 || response.data.data?.createdTodos > 0)) {
        _toast({
          title: 'Thành công!',
          description: response.data.message || response.data.data?.message,
          status: 'success',
          duration: 5000,
        });
        
        if (onTodosGenerated) {
          onTodosGenerated(response.data.todos || response.data.data?.todos);
        }
      }
    } catch (error) {
      console.error('Error generating todos:', error);
      _toast({
        title: 'Lỗi',
        description: 'Không thể tạo kế hoạch học tập. Vui lòng thử lại.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const _handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      _handleGenerate();
    }
  };

  const _examplePrompts = [
    "Thi sinh học tuần sau",
    "Học React trong 2 tuần",
    "Chuẩn bị bài thuyết trình về AI",
    "Lộ trình học Python cơ bản",
    "Ôn tập toán cao cấp cho kỳ thi cuối kỳ"
  ];

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <HStack spacing={3}>
            <Box p={2} bg="blue.100" borderRadius="lg">
              <FiTarget color="blue" size={20} />
            </Box>
            <VStack align="start" spacing={0}>
              <Heading size="md" color="blue.600">
                🤖 AI Todo Generator
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Mô tả mục tiêu học tập của bạn bằng ngôn ngữ tự nhiên
              </Text>
            </VStack>
          </HStack>
        </CardHeader>

        <CardBody>
          <VStack spacing={4} align="stretch">
            {/* Input Section */}
            <Box>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={_handleKeyPress}
                placeholder="Ví dụ: 'Tôi muốn học React trong 2 tuần để làm dự án cuối kỳ' hoặc 'Chuẩn bị thi sinh học tuần sau'"
                rows={3}
                resize="vertical"
                bg="gray.50"
                border="2px solid"
                borderColor="gray.200"
                _focus={{
                  borderColor: "blue.400",
                  bg: "white",
                  boxShadow: "0 0 0 1px blue.400"
                }}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                💡 Tip: Nhấn Ctrl+Enter để tạo nhanh
              </Text>
            </Box>

            {/* Example Prompts */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                Ví dụ nhanh:
              </Text>
              <Wrap spacing={2}>
                {_examplePrompts.map((prompt, index) => (
                  <WrapItem key={index}>
                    <Tag
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      cursor="pointer"
                      onClick={() => setInput(prompt)}
                      _hover={{ bg: "blue.50" }}
                    >
                      <TagLabel>{prompt}</TagLabel>
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>

            {/* Generate Button */}
            <Button
              onClick={_handleGenerate}
              isLoading={loading}
              loadingText="Đang tạo kế hoạch..."
              colorScheme="blue"
              size="lg"
              leftIcon={<FiSend />}
              isDisabled={!input.trim()}
              _hover={{ transform: "translateY(-1px)" }}
              transition="all 0.2s"
            >
              Tạo Kế Hoạch Học Tập
            </Button>

            {/* Results Section */}
            {result && (
              <MotionCard
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                variant="outline"
                borderColor="green.200"
              >
                <CardBody>
                  {result.success ? (
                    <VStack spacing={4} align="stretch">
                      {/* Success Summary */}
                      <Alert status="success" borderRadius="lg">
                        <AlertIcon />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">
                            ✅ Đã tạo {result.createdTodos} task thành công!
                          </Text>
                          <Text fontSize="sm">
                            {result.message}
                          </Text>
                        </VStack>
                      </Alert>

                      {/* Analysis Summary */}
                      {result.analysis && (
                        <Box p={4} bg="blue.50" borderRadius="lg">
                          <HStack justify="space-between" mb={3}>
                            <Text fontWeight="bold" color="blue.700">
                              📊 Phân Tích Yêu Cầu
                            </Text>
                            <IconButton
                              icon={showDetails ? <FiChevronUp /> : <FiChevronDown />}
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowDetails(!showDetails)}
                            />
                          </HStack>
                          
                          <HStack spacing={4} wrap="wrap">
                            <Badge colorScheme="blue" variant="subtle">
                              <FiBookOpen style={{ marginRight: 4 }} />
                              {result.analysis.subject}
                            </Badge>
                            <Badge colorScheme="green" variant="subtle">
                              <FiClock style={{ marginRight: 4 }} />
                              {result.analysis.timeframe}
                            </Badge>
                            <Badge colorScheme="purple" variant="subtle">
                              <FiTrendingUp style={{ marginRight: 4 }} />
                              {result.analysis.difficulty}
                            </Badge>
                          </HStack>

                          <Collapse in={showDetails}>
                            <VStack spacing={2} align="stretch" mt={3}>
                              <Text fontSize="sm">
                                <strong>Mục tiêu:</strong> {result.analysis.goals?.join(', ')}
                              </Text>
                              <Text fontSize="sm">
                                <strong>Loại task:</strong> {result.analysis.taskType}
                              </Text>
                            </VStack>
                          </Collapse>
                        </Box>
                      )}

                      {/* Study Plan Overview */}
                      {result.studyPlan && (
                        <Box p={4} bg="green.50" borderRadius="lg">
                          <Text fontWeight="bold" color="green.700" mb={2}>
                            📚 Kế Hoạch Học Tập
                          </Text>
                          <VStack spacing={2} align="stretch">
                            <HStack>
                              <FiCalendar />
                              <Text fontSize="sm">
                                <strong>Thời gian:</strong> {result.studyPlan.totalDuration}
                              </Text>
                            </HStack>
                            <HStack>
                              <FiClock />
                              <Text fontSize="sm">
                                <strong>Cam kết hàng ngày:</strong> {result.studyPlan.dailyTimeCommitment}
                              </Text>
                            </HStack>
                            <HStack>
                              <FiCheckCircle />
                              <Text fontSize="sm">
                                <strong>Số task:</strong> {result.studyPlan.tasks?.length || 0}
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>
                      )}

                      {/* Recommendations */}
                      {result.recommendations && (
                        <Box p={4} bg="yellow.50" borderRadius="lg">
                          <Text fontWeight="bold" color="yellow.700" mb={2}>
                            💡 Gợi Ý Học Tập
                          </Text>
                          <VStack spacing={2} align="stretch">
                            {result.recommendations.studyTips?.map((tip, index) => (
                              <Text key={index} fontSize="sm">
                                • {tip}
                              </Text>
                            ))}
                          </VStack>
                        </Box>
                      )}
                    </VStack>
                  ) : (
                    <Alert status="error">
                      <AlertIcon />
                      <Text>Không thể tạo kế hoạch học tập. Vui lòng thử lại.</Text>
                    </Alert>
                  )}
                </CardBody>
              </MotionCard>
            )}
          </VStack>
        </CardBody>
      </Card>
    </MotionBox>
  );
}
