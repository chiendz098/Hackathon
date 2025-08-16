import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Flex,
  IconButton,
  Tooltip,
  Progress,
  Divider,
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
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Switch,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  CircularProgress,
  CircularProgressLabel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay,
  FiPause,
  FiSquare,
  FiUsers,
  FiMessageCircle,
  FiSettings,
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiShare,
  FiVolume2,
  FiVolumeX,
  FiClock,
  FiTarget,
  FiTrendingUp,
  FiSend,
  FiMoreVertical,
  FiUserPlus,
  FiUserMinus,
  FiShield,
  FiEye,
  FiEyeOff,
  FiHeart,
  FiThumbsUp,
  FiSmile,
  FiCoffee,
  FiZap,
  FiStar,
  FiAward,
  FiBookOpen,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiX,
  FiMaximize2,
  FiMinimize2,
  FiWifi,
  FiWifiOff,
  FiRefreshCw,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useStudyRoom } from '../../contexts/StudyRoomContext';
import { supabase } from '../../config/supabase';
import io from 'socket.io-client';
import useAutoScroll from '../../hooks/useAutoScroll';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

// Enhanced Study Room Interface Component
export default function EnhancedStudyRoomInterface({ room, onLeave }) {
  const { user } = useAuth();
  const { addPoints } = useGamification();
  const { 
    currentRoom, 
    participants, 
    messages, 
    typingUsers, 
    isConnected, 
    sendMessage, 
    sendTypingStatus,
    updateUserPresence 
  } = useStudyRoom();
  
  const toast = useToast();
  const socket = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Auto-scroll hook
  const { messagesEndRef, messagesContainerRef, scrollToBottom, forceScrollToBottom, handleScroll } = useAutoScroll(messages, {
    enabled: true,
    smooth: true,
    scrollOnMount: true,
    scrollOnNewMessage: true,
    delay: 100
  });
  
  const [inputMessage, setInputMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [focusTimer, setFocusTimer] = useState({
    isRunning: false,
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    sessionType: 'work' // 'work', 'shortBreak', 'longBreak'
  });
  const [roomStats, setRoomStats] = useState({
    totalStudyTime: 0,
    completedTasks: 0,
    activeParticipants: 0,
    focusScore: 0
  });
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const [roomSettings, setRoomSettings] = useState({
    notifications: true,
    soundEffects: true,
    focusMode: false,
    autoBreaks: true,
    showTyping: true,
    showPresence: true
  });
  const [connectionStatus, setConnectionStatus] = useState('connecting');

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

  // Initialize WebSocket connection
  useEffect(() => {
    if (!room || !user) return;

    // Connect to WebSocket for real-time features
    socket.current = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      query: {
        roomId: room.id,
        userId: user.id,
        token: localStorage.getItem('token')
      }
    });

    socket.current.on('connect', () => {
      setConnectionStatus('connected');
      toast({
        title: 'Kết nối thành công',
        status: 'success',
        duration: 2000
      });
    });

    socket.current.on('disconnect', () => {
      setConnectionStatus('disconnected');
      toast({
        title: 'Mất kết nối',
        description: 'Đang thử kết nối lại...',
        status: 'warning',
        duration: null
      });
    });

    socket.current.on('connect_error', (error) => {
      setConnectionStatus('error');
      console.error('WebSocket connection error:', error);
    });

    // WebSocket event handlers
    socket.current.on('focus_timer_update', handleFocusTimerUpdate);
    socket.current.on('room_stats_update', handleRoomStatsUpdate);
    socket.current.on('participant_activity', handleParticipantActivity);
    socket.current.on('screen_share_start', handleScreenShareStart);
    socket.current.on('screen_share_stop', handleScreenShareStop);

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [room, user, toast]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus timer countdown
  useEffect(() => {
    let interval;
    if (focusTimer.isRunning && focusTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setFocusTimer(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          
          if (newTimeLeft <= 0) {
            // Session completed
            handleSessionComplete(prev.sessionType);
            return { ...prev, isRunning: false, timeLeft: 0 };
          }
          
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusTimer.isRunning, focusTimer.timeLeft]);

  // Typing indicator with debounce
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (inputMessage.trim()) {
      sendTypingStatus(true);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 1500);
    } else {
      sendTypingStatus(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [inputMessage, sendTypingStatus]);

  // Event Handlers
  const handleFocusTimerUpdate = (timerData) => {
    setFocusTimer(timerData);
  };

  const handleRoomStatsUpdate = (stats) => {
    setRoomStats(stats);
  };

  const handleParticipantActivity = (data) => {
    // Handle participant activity updates
    console.log('Participant activity:', data);
  };

  const handleScreenShareStart = (data) => {
    setIsScreenSharing(true);
    toast({
      title: 'Chia sẻ màn hình',
      description: `${data.userName} đang chia sẻ màn hình`,
      status: 'info',
      duration: 3000
    });
  };

  const handleScreenShareStop = (data) => {
    setIsScreenSharing(false);
    toast({
      title: 'Dừng chia sẻ màn hình',
      description: `${data.userName} đã dừng chia sẻ màn hình`,
      status: 'info',
      duration: 3000
    });
  };

  const handleSessionComplete = (sessionType) => {
    if (sessionType === 'work') {
      // Award points for completed work session
      addPoints(10, 'Completed work session');
      toast({
        title: 'Phiên học hoàn thành!',
        description: 'Bạn đã nhận được 10 điểm',
        status: 'success',
        duration: 3000
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const result = await sendMessage(inputMessage.trim());
    if (result.success) {
      setInputMessage('');
      // Clear typing status
      sendTypingStatus(false);
    }
  };

  const handleStartFocusTimer = () => {
    if (socket.current) {
      socket.current.emit('start_focus_timer', {
        roomId: room.id,
        sessionType: 'work'
      });
    }
    setFocusTimer(prev => ({ ...prev, isRunning: true }));
  };

  const handleStopFocusTimer = () => {
    if (socket.current) {
      socket.current.emit('stop_focus_timer', { roomId: room.id });
    }
    setFocusTimer(prev => ({ ...prev, isRunning: false }));
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (socket.current) {
      socket.current.emit('toggle_mute', { roomId: room.id, isMuted: !isMuted });
    }
  };

  const handleToggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    if (socket.current) {
      socket.current.emit('toggle_video', { roomId: room.id, isVideoOff: !isVideoOff });
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setIsScreenSharing(true);
        
        if (socket.current) {
          socket.current.emit('screen_share_start', { roomId: room.id });
        }
        
        toast({
          title: 'Chia sẻ màn hình',
          description: 'Bắt đầu chia sẻ màn hình',
          status: 'success',
          duration: 2000
        });
      } else {
        // Stop screen sharing
        setIsScreenSharing(false);
        
        if (socket.current) {
          socket.current.emit('screen_share_stop', { roomId: room.id });
        }
        
        toast({
          title: 'Dừng chia sẻ màn hình',
          description: 'Đã dừng chia sẻ màn hình',
          status: 'info',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast({
        title: 'Lỗi chia sẻ màn hình',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleLeaveRoom = async () => {
    try {
      // Update presence
      await updateUserPresence('offline');
      
      // Disconnect WebSocket
      if (socket.current) {
        socket.current.disconnect();
      }
      
      // Call parent leave handler
      onLeave();
      
      toast({
        title: 'Đã rời phòng',
        status: 'info',
        duration: 2000
      });
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  // Render functions
  const renderConnectionStatus = () => {
    const statusConfig = {
      connecting: { icon: FiRefreshCw, color: 'yellow', text: 'Đang kết nối...' },
      connected: { icon: FiWifi, color: 'green', text: 'Đã kết nối' },
      disconnected: { icon: FiWifiOff, color: 'red', text: 'Mất kết nối' },
      error: { icon: FiAlertCircle, color: 'red', text: 'Lỗi kết nối' }
    };

    const config = statusConfig[connectionStatus];
    const Icon = config.icon;

    return (
      <HStack spacing={2}>
        <Icon color={`${config.color}.500`} />
        <Text fontSize="sm" color={`${config.color}.500`}>
          {config.text}
        </Text>
      </HStack>
    );
  };

  const renderParticipantList = () => (
    <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
      {participants.map(participant => (
        <HStack key={participant.id} spacing={3} p={2} bg="gray.50" borderRadius="md">
          <Avatar 
            size="sm" 
            name={participant.name} 
            src={participant.avatar}
            status={participant.isActive ? 'online' : 'offline'}
          />
          <VStack spacing={0} align="start" flex={1}>
            <HStack>
              <Text fontWeight="medium" fontSize="sm">{participant.name}</Text>
              {typingUsers[participant.userId] && (
                <Badge colorScheme="purple" size="sm">typing…</Badge>
              )}
            </HStack>
            <Text fontSize="xs" color="gray.500">
              {participant.role === 'host' ? 'Chủ phòng' : 'Thành viên'}
            </Text>
          </VStack>
          <Badge 
            colorScheme={participant.isActive ? 'green' : 'gray'} 
            size="sm"
          >
            {participant.isActive ? 'Online' : 'Away'}
          </Badge>
        </HStack>
      ))}
    </VStack>
  );

  const renderChat = () => (
    <VStack spacing={4} h="full">
      <Box 
        flex={1} 
        w="full" 
        overflowY="auto" 
        p={4}
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        <AnimatePresence>
          {messages.map(message => (
            <MotionBox
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              mb={4}
              alignSelf={message.user_id === user.id ? 'flex-end' : 'flex-start'}
            >
              <HStack spacing={2} alignItems="flex-start">
                {message.user_id !== user.id && (
                  <Avatar 
                    size="sm" 
                    name={message.user_name || 'User'} 
                    src={message.user_avatar} 
                  />
                )}
                <VStack spacing={1} align={message.user_id === user.id ? 'flex-end' : 'flex-start'}>
                  <Text fontSize="xs" color="gray.500">
                    {message.user_name || 'User'}
                  </Text>
                  <Box 
                    bg={message.user_id === user.id ? 'blue.500' : 'gray.100'} 
                    color={message.user_id === user.id ? 'white' : 'black'} 
                    px={3} 
                    py={2} 
                    borderRadius="lg" 
                    maxW="300px"
                    wordBreak="break-word"
                  >
                    <Text>{message.content}</Text>
                  </Box>
                  <Text fontSize="xs" color="gray.500">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </Text>
                </VStack>
              </HStack>
            </MotionBox>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Typing indicators */}
      {Object.keys(typingUsers).length > 0 && (
        <Box px={4} py={2}>
          <Text fontSize="sm" color="gray.500" fontStyle="italic">
            {Object.values(typingUsers).map(u => u.name).join(', ')} đang nhập...
          </Text>
        </Box>
      )}
      
      <HStack w="full" p={4}>
        <Input 
          value={inputMessage} 
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Nhập tin nhắn..." 
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={!isConnected}
        />
        <IconButton 
          icon={<FiSend />} 
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || !isConnected}
          colorScheme="blue"
        />
      </HStack>
    </VStack>
  );

  const renderControls = () => (
    <HStack spacing={4} justify="center" p={4}>
      <Tooltip label={isMuted ? 'Bật mic' : 'Tắt mic'}>
        <IconButton
          icon={isMuted ? <FiMicOff /> : <FiMic />}
          onClick={handleToggleMute}
          colorScheme={isMuted ? 'red' : 'gray'}
          size="lg"
        />
      </Tooltip>
      
      <Tooltip label={isVideoOff ? 'Bật camera' : 'Tắt camera'}>
        <IconButton
          icon={isVideoOff ? <FiVideoOff /> : <FiVideo />}
          onClick={handleToggleVideo}
          colorScheme={isVideoOff ? 'red' : 'gray'}
          size="lg"
        />
      </Tooltip>
      
      <Tooltip label={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}>
        <IconButton
          icon={<FiShare />}
          onClick={handleToggleScreenShare}
          colorScheme={isScreenSharing ? 'green' : 'gray'}
          size="lg"
        />
      </Tooltip>
      
      <Tooltip label="Cài đặt">
        <IconButton
          icon={<FiSettings />}
                        onClick={onSettingsOpen}
          colorScheme="gray"
          size="lg"
        />
      </Tooltip>
      
      <Tooltip label="Rời phòng">
        <IconButton
          icon={<FiX />}
          onClick={handleLeaveRoom}
          colorScheme="red"
          size="lg"
        />
      </Tooltip>
    </HStack>
  );

  const renderFocusTimer = () => (
    <Card>
      <CardBody>
        <VStack spacing={4}>
          <CircularProgress
            value={(focusTimer.timeLeft / focusTimer.totalTime) * 100}
            size="120px"
            thickness="8px"
            color="green.400"
          >
            <CircularProgressLabel>
              {Math.floor(focusTimer.timeLeft / 60)}:{(focusTimer.timeLeft % 60).toString().padStart(2, '0')}
            </CircularProgressLabel>
          </CircularProgress>
          
          <Text fontSize="sm" color="gray.600" textAlign="center">
            {focusTimer.sessionType === 'work' ? 'Thời gian học tập' : 
             focusTimer.sessionType === 'shortBreak' ? 'Nghỉ ngắn' : 'Nghỉ dài'}
          </Text>
          
          <HStack>
            {!focusTimer.isRunning ? (
              <Button
                leftIcon={<FiPlay />}
                onClick={handleStartFocusTimer}
                colorScheme="green"
                size="sm"
              >
                Bắt đầu
              </Button>
            ) : (
              <Button
                leftIcon={<FiSquare />}
                onClick={handleStopFocusTimer}
                colorScheme="red"
                size="sm"
              >
                Dừng
              </Button>
            )}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  const renderStats = () => (
    <SimpleGrid columns={2} spacing={4}>
      <Stat>
        <StatLabel>Thời gian học</StatLabel>
        <StatNumber>{Math.floor(roomStats.totalStudyTime / 60)} phút</StatNumber>
        <StatHelpText>
          <FiTrendingUp /> +{Math.floor(roomStats.totalStudyTime / 60)} phút hôm nay
        </StatHelpText>
      </Stat>
      <Stat>
        <StatLabel>Nhiệm vụ hoàn thành</StatLabel>
        <StatNumber>{roomStats.completedTasks}</StatNumber>
        <StatHelpText>
          <FiCheckCircle /> {roomStats.completedTasks} task
        </StatHelpText>
      </Stat>
      <Stat>
        <StatLabel>Thành viên tích cực</StatLabel>
        <StatNumber>{roomStats.activeParticipants}</StatNumber>
        <StatHelpText>
          <FiUsers /> {participants.length} thành viên
        </StatHelpText>
      </Stat>
      <Stat>
        <StatLabel>Điểm tập trung</StatLabel>
        <StatNumber>{roomStats.focusScore}/100</StatNumber>
        <StatHelpText>
          <FiTarget /> Tập trung cao
        </StatHelpText>
      </Stat>
    </SimpleGrid>
  );

  if (!room) {
    return (
      <Box p={8} textAlign="center">
        <Text>Không tìm thấy thông tin phòng học</Text>
      </Box>
    );
  }

  return (
    <Box h="100vh" bg="gray.50">
      <VStack h="full" spacing={0}>
        {/* Header */}
        <HStack w="full" p={4} bg="white" justify="space-between" borderBottomWidth={1}>
          <HStack>
            <Text fontSize="xl" fontWeight="bold">{room.name}</Text>
            <Badge colorScheme="green">{participants.length} thành viên</Badge>
            {room.subject && (
              <Badge colorScheme="blue">{room.subject}</Badge>
            )}
          </HStack>
          
          <HStack spacing={4}>
            {renderConnectionStatus()}
            <Menu>
              <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" />
              <MenuList>
                <MenuItem onClick={onSettingsOpen}>
                  <FiSettings />
                  <Text ml={2}>Cài đặt</Text>
                </MenuItem>
                <MenuItem onClick={handleLeaveRoom}>
                  <FiX />
                  <Text ml={2}>Rời phòng</Text>
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </HStack>

        {/* Main Content */}
        <Flex flex={1} w="full">
          {/* Left Sidebar - Participants */}
          <Box w="300px" bg="white" borderRightWidth={1} p={4}>
            <VStack spacing={4}>
              <Text fontWeight="bold">Thành viên</Text>
              {renderParticipantList()}
            </VStack>
          </Box>

          {/* Main Area */}
          <Box flex={1}>
            <Tabs h="full">
              <TabList px={4}>
                <Tab>Học tập</Tab>
                <Tab>Thống kê</Tab>
              </TabList>

              <TabPanels h="calc(100% - 40px)">
                <TabPanel h="full">
                  <HStack h="full" spacing={4} p={4}>
                    {/* Video/Screen Share Area */}
                    <Box flex={2} bg="black" borderRadius="lg" position="relative">
                      {isVideoOff ? (
                        <Flex h="full" align="center" justify="center">
                          <Text color="white">Camera đã tắt</Text>
                        </Flex>
                      ) : (
                        <video
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '0.5rem'
                          }}
                          muted
                          autoPlay
                        />
                      )}
                      {renderControls()}
                    </Box>

                    {/* Right Sidebar - Chat & Focus Timer */}
                    <VStack flex={1} h="full" spacing={4}>
                      {renderFocusTimer()}
                      <Box flex={1} w="full" bg="white" borderRadius="lg" overflow="hidden">
                        {renderChat()}
                      </Box>
                    </VStack>
                  </HStack>
                </TabPanel>

                <TabPanel>
                  <Box p={4}>
                    {renderStats()}
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Flex>
      </VStack>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Cài đặt phòng học</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Thông báo</FormLabel>
                <Switch
                  isChecked={roomSettings.notifications}
                  onChange={(e) => setRoomSettings(prev => ({
                    ...prev,
                    notifications: e.target.checked
                  }))}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Âm thanh</FormLabel>
                <Switch
                  isChecked={roomSettings.soundEffects}
                  onChange={(e) => setRoomSettings(prev => ({
                    ...prev,
                    soundEffects: e.target.checked
                  }))}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Chế độ tập trung</FormLabel>
                <Switch
                  isChecked={roomSettings.focusMode}
                  onChange={(e) => setRoomSettings(prev => ({
                    ...prev,
                    focusMode: e.target.checked
                  }))}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Tự động nghỉ</FormLabel>
                <Switch
                  isChecked={roomSettings.autoBreaks}
                  onChange={(e) => setRoomSettings(prev => ({
                    ...prev,
                    autoBreaks: e.target.checked
                  }))}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Hiển thị đang nhập</FormLabel>
                <Switch
                  isChecked={roomSettings.showTyping}
                  onChange={(e) => setRoomSettings(prev => ({
                    ...prev,
                    showTyping: e.target.checked
                  }))}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Hiển thị trạng thái</FormLabel>
                <Switch
                  isChecked={roomSettings.showPresence}
                  onChange={(e) => setRoomSettings(prev => ({
                    ...prev,
                    showPresence: e.target.checked
                  }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
} 