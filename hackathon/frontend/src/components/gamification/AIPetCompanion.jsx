import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  useToast,
  Badge,
  CircularProgress,
  CircularProgressLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Input,
  FormControl,
  FormLabel,
  Select,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserProgress, feedPet } from '../../api';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

// Pet types with different personalities and reactions
const PET_TYPES = {
  cat: {
    emoji: '🐱',
    name: 'Mèo',
    personality: 'Độc lập và thông minh',
    happyMessages: [
      'Meo meo! Tôi rất hạnh phúc khi bạn học tập chăm chỉ! 😸',
      'Purr purr... Bạn làm tốt lắm! 🐾',
      'Mèo con của bạn tự hào về bạn! 😻',
      'Meo! Tiếp tục như vậy nhé! 🎯'
    ],
    sadMessages: [
      'Meo... Tôi nhớ bạn quá. Hãy học tập đi! 😿',
      'Mèo con buồn vì bạn không hoàn thành task... 😾',
      'Meo meo... Tôi cần bạn chăm sóc nhiều hơn! 🙀'
    ],
    encourageMessages: [
      'Meo! Bạn có thể làm được! Tôi tin bạn! 💪',
      'Hãy cố gắng lên! Mèo con sẽ ở đây ủng hộ bạn! 🌟',
      'Đừng bỏ cuộc! Chúng ta cùng nhau vượt qua! 🚀'
    ]
  },
  dog: {
    emoji: '🐶',
    name: 'Chó',
    personality: 'Trung thành và nhiệt tình',
    happyMessages: [
      'Woof woof! Chủ nhân giỏi quá! 🐕',
      'Gâu gâu! Tôi rất vui khi thấy bạn học tập chăm chỉ! 🦮',
      'Yay! Chúng ta cùng tiến bộ nhé! 🐾',
      'Gâu! Bạn là số 1! 🏆'
    ],
    sadMessages: [
      'Gâu... Sao bạn không học bài vậy? 😢',
      'Huhu... Tôi muốn chơi với bạn sau khi bạn học xong! 🐕‍🦺',
      'Gâu gâu... Đừng bỏ bê việc học nhé! 🐶'
    ],
    encourageMessages: [
      'Cố lên bạn ơi! Tôi luôn ở bên cạnh bạn! 💖',
      'Gâu gâu! Chúng ta cùng cố gắng nào! ⭐',
      'Bạn là giỏi nhất! Tiếp tục phấn đấu! 🌟'
    ]
  }
};

export default function AIPetCompanion() {
  const [pet, setPet] = useState({
    type: 'cat',
    name: 'Mimi',
    level: 1,
    exp: 0,
    happiness: 100,
    energy: 100,
    lastInteraction: new Date()
  });
  
  const [userProgress, setUserProgress] = useState({
    tasksCompleted: 0,
    studyTime: 0,
    streak: 0
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchUserProgress();
    const interval = setInterval(updatePetState, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchUserProgress = async () => {
    try {
      const response = await getUserProgress();
      setUserProgress(response.data);
      updatePetHappiness(response.data);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const updatePetState = () => {
    setPet(prevPet => {
      const timeSinceLastInteraction = (new Date() - new Date(prevPet.lastInteraction)) / 1000 / 60; // minutes
      const energyDecrease = Math.floor(timeSinceLastInteraction / 30) * 5; // -5 energy every 30 minutes
      const happinessDecrease = Math.floor(timeSinceLastInteraction / 60) * 10; // -10 happiness every hour

      return {
        ...prevPet,
        energy: Math.max(0, prevPet.energy - energyDecrease),
        happiness: Math.max(0, prevPet.happiness - happinessDecrease)
      };
    });
  };

  const updatePetHappiness = (progress) => {
    setPet(prevPet => {
      let happinessIncrease = 0;
      
      // Increase happiness based on completed tasks
      if (progress.tasksCompleted > userProgress.tasksCompleted) {
        happinessIncrease += 10;
      }
      
      // Increase happiness based on study time
      if (progress.studyTime > userProgress.studyTime) {
        happinessIncrease += 5;
      }
      
      // Bonus for maintaining streak
      if (progress.streak > userProgress.streak) {
        happinessIncrease += 15;
      }

      return {
        ...prevPet,
        happiness: Math.min(100, prevPet.happiness + happinessIncrease),
        exp: prevPet.exp + happinessIncrease,
        lastInteraction: new Date()
      };
    });
  };

  const handleFeedPet = async () => {
    if (pet.energy >= 100) {
      toast({
        title: 'Thú cưng không đói',
        description: `${pet.name} đang no rồi!`,
        status: 'info',
        duration: 3000
      });
      return;
    }

    setLoading(true);
    try {
      await feedPet(pet.id);
      setPet(prevPet => ({
        ...prevPet,
        energy: Math.min(100, prevPet.energy + 20),
        happiness: Math.min(100, prevPet.happiness + 10),
        lastInteraction: new Date()
      }));

        toast({
        title: 'Cho ăn thành công',
        description: `${pet.name} rất vui và no bụng!`,
          status: 'success',
        duration: 3000
        });
    } catch (error) {
      console.error('Error feeding pet:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cho thú cưng ăn',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const getPetMessage = () => {
    const petType = PET_TYPES[pet.type];
    
    if (pet.happiness < 30) {
      return petType.sadMessages[Math.floor(Math.random() * petType.sadMessages.length)];
    } else if (pet.happiness > 70) {
      return petType.happyMessages[Math.floor(Math.random() * petType.happyMessages.length)];
    } else {
      return petType.encourageMessages[Math.floor(Math.random() * petType.encourageMessages.length)];
    }
  };

  const renderPetStatus = () => (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <Badge colorScheme="purple">Level {pet.level}</Badge>
        <Badge colorScheme="blue">EXP: {pet.exp}/100</Badge>
      </HStack>
      
      <FormControl>
        <FormLabel>Hạnh phúc</FormLabel>
        <Progress
          value={pet.happiness}
          colorScheme={pet.happiness > 70 ? 'green' : pet.happiness > 30 ? 'yellow' : 'red'}
          hasStripe
        />
      </FormControl>

      <FormControl>
        <FormLabel>Năng lượng</FormLabel>
        <Progress
          value={pet.energy}
          colorScheme={pet.energy > 70 ? 'blue' : pet.energy > 30 ? 'orange' : 'red'}
          hasStripe
        />
      </FormControl>
          </VStack>
  );

  return (
      <Card>
        <CardHeader>
        <Heading size="md">Thú cưng AI của bạn</Heading>
        </CardHeader>
        <CardBody>
        <VStack spacing={6}>
          {/* Pet Avatar */}
                  <MotionBox
            animate={{
              y: [0, -10, 0],
              rotate: pet.happiness > 70 ? [0, -5, 5, -5, 0] : 0
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            fontSize="6xl"
                      cursor="pointer"
            onClick={onOpen}
                    >
            {PET_TYPES[pet.type].emoji}
                  </MotionBox>

          {/* Pet Name */}
          <Text fontSize="xl" fontWeight="bold">
            {pet.name}
                      </Text>

                  {/* Pet Message */}
          <Alert status={pet.happiness > 70 ? 'success' : pet.happiness > 30 ? 'info' : 'warning'}>
            <AlertIcon />
            {getPetMessage()}
          </Alert>

          {/* Pet Status */}
          {renderPetStatus()}

          {/* Actions */}
              <Button
                colorScheme="green"
                onClick={handleFeedPet}
            isLoading={loading}
            isDisabled={pet.energy >= 100}
            width="full"
          >
            Cho ăn 🍖
              </Button>
          </VStack>
        </CardBody>

      {/* Pet Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Thông tin thú cưng</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} pb={6}>
              <Text>
                <strong>Loại:</strong> {PET_TYPES[pet.type].name}
              </Text>
              <Text>
                <strong>Tính cách:</strong> {PET_TYPES[pet.type].personality}
              </Text>
              <Divider />
              <SimpleGrid columns={2} spacing={4} width="full">
                <Stat>
                  <StatLabel>Nhiệm vụ hoàn thành</StatLabel>
                  <StatNumber>{userProgress.tasksCompleted}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Thời gian học</StatLabel>
                  <StatNumber>{Math.floor(userProgress.studyTime / 60)}h</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Chuỗi ngày học</StatLabel>
                  <StatNumber>{userProgress.streak} ngày</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Tương tác cuối</StatLabel>
                  <StatNumber>
                    {new Date(pet.lastInteraction).toLocaleTimeString()}
                  </StatNumber>
                </Stat>
              </SimpleGrid>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Card>
  );
}
