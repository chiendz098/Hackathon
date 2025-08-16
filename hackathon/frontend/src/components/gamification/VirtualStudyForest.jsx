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
  SimpleGrid,
  Badge,
  Button,
  useToast,
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
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
} from '@chakra-ui/react';
import { motion, AnimatePresence   } from 'framer-motion';
import { getUserProgress } from '../../api';

const _MotionBox = motion.create(Box);
const _MotionCard = motion.create(Card);

// Tree types based on forest level and ecosystem health
const _TREE_TYPES = [
  { emoji: '🌱', name: 'Mầm non', minLevel: 1, health: 0 },
  { emoji: '🌿', name: 'Cây con', minLevel: 1, health: 20 },
  { emoji: '🌳', name: 'Cây xanh', minLevel: 2, health: 40 },
  { emoji: '🌲', name: 'Cây thông', minLevel: 3, health: 60 },
  { emoji: '🎋', name: 'Tre xanh', minLevel: 4, health: 70 },
  { emoji: '🌴', name: 'Cây dừa', minLevel: 5, health: 80 },
  { emoji: '🎄', name: 'Cây thông Noel', minLevel: 6, health: 90 },
  { emoji: '🌺', name: 'Hoa đào', minLevel: 7, health: 95 },
];

// Forest environments based on level
const _FOREST_ENVIRONMENTS = {
  1: { name: 'Vườn nhỏ', bg: 'green.50', color: 'green.600', description: 'Một khu vườn nhỏ đang bắt đầu phát triển' },
  3: { name: 'Rừng non', bg: 'green.100', color: 'green.700', description: 'Rừng cây đang trong giai đoạn phát triển' },
  5: { name: 'Rừng xanh', bg: 'green.200', color: 'green.800', description: 'Một khu rừng xanh tươi và sinh động' },
  8: { name: 'Rừng cổ thụ', bg: 'emerald.200', color: 'emerald.800', description: 'Rừng với những cây cổ thụ hùng vĩ' },
  10: { name: 'Rừng thiêng', bg: 'teal.200', color: 'teal.800', description: 'Khu rừng thiêng liêng và huyền bí' },
  15: { name: 'Rừng huyền thoại', bg: 'cyan.200', color: 'cyan.800', description: 'Rừng huyền thoại với sức mạnh kỳ diệu' },
};

// Wildlife that appears based on ecosystem health
const _WILDLIFE = [
  { emoji: '🐛', name: 'Sâu bọ', minHealth: 0 },
  { emoji: '🦋', name: 'Bướm', minHealth: 30 },
  { emoji: '🐝', name: 'Ong', minHealth: 50 },
  { emoji: '🐿️', name: 'Sóc', minHealth: 60 },
  { emoji: '🦅', name: 'Đại bàng', minHealth: 70 },
  { emoji: '🦉', name: 'Cú', minHealth: 80 },
  { emoji: '🦌', name: 'Hươu', minHealth: 90 },
  { emoji: '🦄', name: 'Kỳ lân', minHealth: 98 },
];

export default function VirtualStudyForest() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plantingAnimation, setPlantingAnimation] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const _toast = useToast();

  useEffect(() => {
    fetchProgress();
  }, []);

  const _fetchProgress = async () => {
    try {
      const response = await getUserProgress();
      setProgress(response.data.progress);
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin rừng học tập',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const _getForestEnvironment = (_level) => {
    const levels = Object.keys(FOREST_ENVIRONMENTS).map(Number).sort((a, b) => b - a);
    for (const envLevel of levels) {
      if (level >= envLevel) {
        return FOREST_ENVIRONMENTS[envLevel];
      }
    }
    return FOREST_ENVIRONMENTS[1];
  };

  const _getAvailableTrees = (_forestLevel, _ecosystemHealth) => {
    return TREE_TYPES.filter(tree => 
      forestLevel >= tree.minLevel && ecosystemHealth >= tree.health
    );
  };

  const _getVisibleWildlife = (_ecosystemHealth) => {
    return WILDLIFE.filter(animal => ecosystemHealth >= animal.minHealth);
  };

  const _generateForestGrid = () => {
    if (!progress) return [];
    
    const _availableTrees = getAvailableTrees(progress.forestLevel, progress.ecosystemHealth);
    const _grid = [];
    const _gridSize = Math.min(8, Math.max(4, progress.forestLevel + 2)); // 4x4 to 8x8 grid
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      if (i < progress.treesPlanted) {
        // Plant trees based on ecosystem health and variety
        const _treeIndex = Math.floor(Math.random() * availableTrees.length);
        const _tree = availableTrees[treeIndex] || TREE_TYPES[0];
        grid.push({ type: 'tree', ...tree, id: i });
      } else {
        // Empty spots for future trees
        grid.push({ type: 'empty', emoji: '⬜', id: i });
      }
    }
    
    return grid;
  };

  const _getHealthColor = (_health) => {
    if (health >= 90) return 'green';
    if (health >= 70) return 'yellow';
    if (health >= 50) return 'orange';
    return 'red';
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <VStack spacing={4}>
            <CircularProgress isIndeterminate color="green.400" />
            <Text>Đang tải rừng học tập...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardBody>
          <Text>Không thể tải thông tin rừng học tập</Text>
        </CardBody>
      </Card>
    );
  }

  const _environment = getForestEnvironment(progress.forestLevel);
  const _forestGrid = generateForestGrid();
  const _wildlife = getVisibleWildlife(progress.ecosystemHealth);
  const _gridSize = Math.sqrt(forestGrid.length);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <HStack spacing={3}>
            <Box p={2} bg={environment.bg} borderRadius="lg">
              <Text fontSize="20px">🌳</Text>
            </Box>
            <VStack align="start" spacing={0}>
              <Heading size="md" color={environment.color}>
                🌲 Virtual Study Forest
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Rừng học tập ảo - mỗi task hoàn thành sẽ trồng một cây
              </Text>
            </VStack>
          </HStack>
        </CardHeader>

        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* Forest Stats */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Stat>
                <StatLabel>Cây đã trồng</StatLabel>
                <StatNumber color="green.600">{progress.treesPlanted}</StatNumber>
                <StatHelpText>🌱 Từ các task hoàn thành</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Cấp độ rừng</StatLabel>
                <StatNumber color={environment.color}>{progress.forestLevel}</StatNumber>
                <StatHelpText>🏞️ {environment.name}</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Sức khỏe hệ sinh thái</StatLabel>
                <StatNumber color={`${getHealthColor(progress.ecosystemHealth)}.600`}>
                  {Math.round(progress.ecosystemHealth)}%
                </StatNumber>
                <StatHelpText>🌿 Tình trạng môi trường</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Động vật ho야생</StatLabel>
                <StatNumber color="blue.600">{wildlife.length}</StatNumber>
                <StatHelpText>🦋 Loài đã xuất hiện</StatHelpText>
              </Stat>
            </SimpleGrid>

            {/* Forest Environment Info */}
            <Card bg={environment.bg} borderColor={environment.color} borderWidth="2px">
              <CardBody>
                <VStack spacing={3}>
                  <Badge colorScheme={environment.color.split('.')[0]} size="lg" variant="solid">
                    {environment.name}
                  </Badge>
                  <Text fontSize="sm" textAlign="center" color={environment.color}>
                    {environment.description}
                  </Text>
                  
                  {/* Ecosystem Health Bar */}
                  <Box w="full">
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="medium">Sức khỏe hệ sinh thái</Text>
                      <Text fontSize="sm">{Math.round(progress.ecosystemHealth)}%</Text>
                    </HStack>
                    <Progress
                      value={progress.ecosystemHealth}
                      colorScheme={getHealthColor(progress.ecosystemHealth)}
                      size="md"
                      borderRadius="full"
                    />
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Forest Grid */}
            <Box>
              <HStack justify="space-between" mb={4}>
                <Text fontWeight="bold" color="green.700">
                  🌳 Khu rừng của bạn
                </Text>
                <Button size="sm" colorScheme="green" variant="outline" onClick={onOpen}>
                  Xem chi tiết
                </Button>
              </HStack>
              
              <Box
                display="grid"
                gridTemplateColumns={`repeat(${gridSize}, 1fr)`}
                gap={2}
                p={4}
                bg={environment.bg}
                borderRadius="lg"
                border="2px solid"
                borderColor={environment.color}
              >
                <AnimatePresence>
                  {forestGrid.map((cell, index) => (
                    <MotionBox
                      key={cell.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <Tooltip label={cell.name || 'Chưa trồng cây'} placement="top">
                        <Box
                          w="40px"
                          h="40px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="24px"
                          cursor="pointer"
                          borderRadius="md"
                          bg={cell.type === 'tree' ? 'white' : 'gray.100'}
                          _hover={{ bg: cell.type === 'tree' ? 'green.50' : 'gray.200' }}
                          transition="all 0.2s"
                        >
                          {cell.emoji}
                        </Box>
                      </Tooltip>
                    </MotionBox>
                  ))}
                </AnimatePresence>
              </Box>
            </Box>

            {/* Wildlife Section */}
            {wildlife.length > 0 && (
              <Box>
                <Text fontWeight="bold" mb={3} color="blue.700">
                  🦋 Động vật hoang dã
                </Text>
                <HStack spacing={3} flexWrap="wrap">
                  {wildlife.map((animal, index) => (
                    <MotionBox
                      key={animal.name}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.2, duration: 0.5 }}
                    >
                      <Tooltip label={animal.name} placement="top">
                        <Box
                          p={2}
                          bg="blue.50"
                          borderRadius="lg"
                          border="1px solid"
                          borderColor="blue.200"
                          cursor="pointer"
                          _hover={{ bg: 'blue.100', transform: 'translateY(-2px)' }}
                          transition="all 0.2s"
                        >
                          <Text fontSize="24px">{animal.emoji}</Text>
                        </Box>
                      </Tooltip>
                    </MotionBox>
                  ))}
                </HStack>
              </Box>
            )}

            {/* Next Level Progress */}
            <Card variant="outline" borderColor="green.200">
              <CardBody>
                <VStack spacing={3}>
                  <Text fontWeight="bold" color="green.700">
                    🎯 Tiến độ cấp độ rừng tiếp theo
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Trồng thêm {Math.max(0, (progress.forestLevel * 10) - progress.treesPlanted)} cây để lên cấp độ {progress.forestLevel + 1}
                  </Text>
                  <Progress
                    value={(progress.treesPlanted % 10) * 10}
                    colorScheme="green"
                    size="lg"
                    borderRadius="full"
                    w="full"
                  />
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </CardBody>
      </Card>

      {/* Forest Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chi tiết rừng học tập</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={2} spacing={4}>
                <Box>
                  <Text fontWeight="bold" mb={2}>📊 Thống kê</Text>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm">Tổng cây trồng: {progress.treesPlanted}</Text>
                    <Text fontSize="sm">Cấp độ rừng: {progress.forestLevel}</Text>
                    <Text fontSize="sm">Sức khỏe: {Math.round(progress.ecosystemHealth)}%</Text>
                    <Text fontSize="sm">Loại rừng: {environment.name}</Text>
                  </VStack>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>🌱 Loại cây có thể trồng</Text>
                  <VStack align="start" spacing={1}>
                    {getAvailableTrees(progress.forestLevel, progress.ecosystemHealth).map(tree => (
                      <HStack key={tree.name} spacing={2}>
                        <Text>{tree.emoji}</Text>
                        <Text fontSize="sm">{tree.name}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </SimpleGrid>
              
              <Divider />
              
              <Box>
                <Text fontWeight="bold" mb={2}>💡 Mẹo phát triển rừng</Text>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm">• Hoàn thành task đều đặn để trồng cây mới</Text>
                  <Text fontSize="sm">• Duy trì streak để cải thiện sức khỏe hệ sinh thái</Text>
                  <Text fontSize="sm">• Cấp độ rừng cao hơn sẽ mở khóa loại cây mới</Text>
                  <Text fontSize="sm">• Sức khỏe cao sẽ thu hút động vật hoang dã</Text>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </MotionBox>
  );
}
