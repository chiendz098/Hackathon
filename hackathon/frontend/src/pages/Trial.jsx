import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  useToast,
  Card,
  CardBody,
  Heading,
  Badge,
  Progress,
  Divider,
  Radio,
  RadioGroup,
  Stack
} from '@chakra-ui/react';
import { getTrialCourses, getTrialCoursesByMajor, submitTrialQuiz } from '../api';

export default function Trial() {
  const [major, setMajor] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [majors, setMajors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [result, setResult] = useState(null);

  const toast = useToast();

  const fetchTrialCourses = async () => {
    try {
      setLoading(true);
      const response = await getTrialCourses();
      setMajors(response.data.majors || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch trial courses',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialCourses();
  }, []);

  useEffect(() => {
    if (major) {
      const selectedMajor = majors.find(m => m.value === major);
      if (selectedMajor) {
        setCourses(selectedMajor.courses || []);
        const firstCourse = selectedMajor.courses[0];
        if (firstCourse) {
          setSelectedCourse(firstCourse);
        }
      }
    }
  }, [major, majors]);

  const handleSubmit = async () => {
    if (!selectedCourse || Object.keys(answers).length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a course and answer all questions',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      const response = await submitTrialQuiz(selectedCourse.id, answers);
      setResult(response.data);
      toast({
        title: 'Success',
        description: 'Quiz submitted successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit quiz',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box p={6} maxW="800px" mx="auto" textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Đang tải dữ liệu khóa học...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="800px" mx="auto">
              <Heading mb={6} textAlign="center">Học thử các ngành tại FPT COMPASS</Heading>

      <VStack spacing={6} align="stretch">
        <Box>
          <Text mb={2} fontWeight="bold">Chọn ngành học:</Text>
          <Select placeholder="Chọn ngành học" value={major} onChange={e => setMajor(e.target.value)}>
            {majors.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </Box>

        {selectedCourse && (
          <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
            <HStack justify="space-between" mb={2}>
              <Heading size="md">{selectedCourse.title}</Heading>
              {selectedCourse.mentor && (
                <Badge colorScheme="green">
                  Mentor: {selectedCourse.mentor.user?.name}
                </Badge>
              )}
            </HStack>
            <Text color="gray.600">{selectedCourse.description}</Text>
          </Box>
        )}
        {quiz.length > 0 && !result && (
          <Box>
            <Heading size="lg" mb={4}>Bài kiểm tra</Heading>
            <Stack spacing={4}>
              {quiz.map((q, i) => (
                <Box key={i} p={4} borderWidth={1} borderRadius="md" bg="white">
                  <Text fontWeight="bold" mb={3}>Câu {i+1}: {q.question}</Text>
                  <Stack spacing={2}>
                    {q.options.map(opt => (
                      <Button
                        key={opt}
                        variant={answers[i] === opt ? 'solid' : 'outline'}
                        colorScheme="blue"
                        justifyContent="flex-start"
                        onClick={() => setAnswers(a => a.map((v, idx) => idx === i ? opt : v))}
                      >
                        {opt}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              ))}
              <Button
                colorScheme="green"
                size="lg"
                onClick={handleSubmit}
                isLoading={submitting}
                loadingText="Đang nộp bài..."
              >
                Nộp bài kiểm tra
              </Button>
            </Stack>
          </Box>
        )}
        {result && (
          <Box p={6} borderWidth={2} borderRadius="lg" bg="gray.50">
            <VStack spacing={4} align="stretch">
              <Box textAlign="center">
                <Heading size="lg" color="blue.600">Kết quả bài kiểm tra</Heading>
                <HStack justify="center" mt={2}>
                  <Badge colorScheme={result.percentage >= 70 ? 'green' : result.percentage >= 50 ? 'yellow' : 'red'} fontSize="lg" p={2}>
                    {result.correct}/{result.total} câu đúng ({result.percentage}%)
                  </Badge>
                </HStack>
              </Box>

              <Box>
                <Heading size="md" mb={3}>Chi tiết từng câu:</Heading>
                <Stack spacing={3}>
                  {result.feedback.map((f, i) => (
                    <Box key={i} p={4} borderWidth={1} borderRadius="md" bg={f.isCorrect ? 'green.50' : 'red.50'}>
                      <VStack align="stretch" spacing={2}>
                        <Text fontWeight="bold">Câu {i+1}: {f.question}</Text>
                        <HStack>
                          <Text><b>Đáp án của bạn:</b></Text>
                          <Badge colorScheme={f.isCorrect ? 'green' : 'red'}>
                            {f.your || 'Chưa chọn'}
                          </Badge>
                        </HStack>
                        <HStack>
                          <Text><b>Đáp án đúng:</b></Text>
                          <Badge colorScheme="green">{f.correct}</Badge>
                        </HStack>
                        {f.explanation && (
                          <Text color="gray.600"><b>Giải thích:</b> {f.explanation}</Text>
                        )}
                      </VStack>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Button
                colorScheme="blue"
                onClick={() => {
                  setResult(null);
                  setAnswers(Array(quiz.length).fill(''));
                }}
              >
                Làm lại bài kiểm tra
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}