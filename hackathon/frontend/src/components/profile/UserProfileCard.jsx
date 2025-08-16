import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  IconButton,
  Tooltip,
  Progress,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
  Link,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react';
import { motion, AnimatePresence   } from 'framer-motion';
import {
  FiUser,
  FiMapPin,
  FiGlobe,
  FiCalendar,
  FiMail,
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiMessageCircle,
  FiSettings,
  FiShare2,
  FiEye,
  FiHeart,
  FiAward,
  FiTrophy,
  FiZap,
  FiTarget,
  FiClock,
  FiStar,
  FiShield,
  FiEdit,
  FiCamera,
  FiExternalLink,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import { sendFriendRequest, getUserProfile, updateProfile } from '../../api';

const _MotionBox = motion.create(Box);
const _MotionCard = motion.create(Card);

export default function UserProfileCard({ userId, isOwnProfile = false, onProfileUpdate }) {
  const { user } = useAuth();
  const { userProgress } = useGamification();
  const _toast = useToast();
  
  // State management
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  
  // Modal controls
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  
  useEffect(() => {
    fetchProfile();
  }, [userId]);
  
  const _fetchProfile = async () => {
    try {
      setLoading(true);
      const _response = await getUserProfile(userId);
      setProfile(response.data.profile);
      setFriendshipStatus(response.data.friendshipStatus);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: '❌ Lỗi tải profile',
        description: 'Không thể tải thông tin người dùng',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const _handleSendFriendRequest = async () => {
    try {
      setSendingRequest(true);
      await sendFriendRequest(userId);
      setFriendshipStatus('pending');
      
      toast({
        title: '✅ Đã gửi lời mời kết bạn',
        description: 'Lời mời kết bạn đã được gửi thành công',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: '❌ Lỗi gửi lời mời',
        description: error.response?.data?.message || 'Không thể gửi lời mời kết bạn',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSendingRequest(false);
    }
  };
  
  const _getOnlineStatusColor = (_status) => {
    switch (status) {
      case 'online': return 'green';
      case 'away': return 'yellow';
      case 'busy': return 'red';
      default: return 'gray';
    }
  };
  
  const _getOnlineStatusText = (_status) => {
    switch (status) {
      case 'online': return 'Đang online';
      case 'away': return 'Vắng mặt';
      case 'busy': return 'Bận';
      default: return 'Offline';
    }
  };
  
  const _formatLastActive = (_lastActive) => {
    if (!lastActive) return 'Chưa xác định';
    
    const _now = new Date();
    const _lastActiveDate = new Date(lastActive);
    const _diffInMinutes = Math.floor((now - lastActiveDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };
  
  if (loading) {
    return (
      <Card>
        <CardBody>
          <VStack spacing={4} py={8}>
            <Avatar size="xl" />
            <Text>Đang tải profile...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }
  
  if (!profile) {
    return (
      <Card>
        <CardBody>
          <VStack spacing={4} py={8}>
            <Text>Không tìm thấy profile</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (<MotionCard
      initial={{ opacity: 0, _y: 20 }}
      animate={{ opacity: 1, _y: 0 }}
      transition={{ duration: 0.5 }}
      overflow="hidden"
    >
      {/* Cover Image */}
      {profile.coverImage && (
        <Box position="relative" h="200px">
          <Image
            src={profile.coverImage}
            alt="Cover"
            w="full"
            h="full"
            objectFit="cover"
          />
          {isOwnProfile && (
            <IconButton
              icon={<FiCamera />}
              position="absolute"
              top={4}
              right={4}
              size="sm"
              colorScheme="whiteAlpha"
              variant="solid"
              onClick={() => {/* Handle cover upload */}}
            />
          )}
        </Box>
      )}
      
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Profile Header */}
          <Flex justify="space-between" align="start">
            <HStack spacing={4} align="start">
              <Box position="relative">
                <Avatar
                  size="xl"
                  name={profile.displayName || profile.user?.name}
                  src={profile.avatar}
                  border="4px solid white"
                  shadow="lg"
                />
                {/* Online Status Indicator */}
                <Box
                  position="absolute"
                  bottom={2}
                  right={2}
                  w={4}
                  h={4}
                  bg={`${getOnlineStatusColor(profile.onlineStatus)}.500`}
                  borderRadius="full"
                  border="2px solid white"
                />
                {isOwnProfile && (<IconButton
                    icon={<FiCamera />}
                    position="absolute"
                    bottom={0}
                    right={0}
                    size="sm"
                    colorScheme="blue"
                    borderRadius="full"
                    onClick={() => {/* Handle avatar upload */}}
                  />
                )}
              </Box>
              
              <VStack align="start" spacing={2}>
                <HStack spacing={2}>
                  <Text fontSize="2xl" fontWeight="bold">
                    {profile.displayName || profile.user?.name}
                  </Text>
                  {profile.isVerified && (
                    <Tooltip label="Tài khoản đã xác thực">
                      <Box color="blue.500">
                        <FiShield size={20} />
                      </Box>
                    </Tooltip>
                  )}
                </HStack>
                
                <HStack spacing={2}>
                  <Badge colorScheme={getOnlineStatusColor(profile.onlineStatus)} size="sm">
                    {getOnlineStatusText(profile.onlineStatus)}
                  </Badge>
                  {profile.statusMessage && (
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">
                      "{profile.statusMessage}"
                    </Text>
                  )}
                </HStack>
                
                <Text fontSize="sm" color="gray.500">
                  Hoạt động lần cuối: {formatLastActive(profile.lastActive)}
                </Text>
                
                {profile.bio && (
                  <Text color="gray.700" maxW="400px">
                    {profile.bio}
                  </Text>
                )}
                
                {/* Location and Website */}
                <VStack align="start" spacing={1}>
                  {profile.location && (
                    <HStack spacing={2} fontSize="sm" color="gray.600">
                      <FiMapPin />
                      <Text>{profile.location}</Text>
                    </HStack>
                  )}
                  {profile.website && (
                    <HStack spacing={2} fontSize="sm" color="gray.600">
                      <FiGlobe />
                      <Link href={profile.website} isExternal color="blue.500">
                        {profile.website}
                        <FiExternalLink style={{ display: 'inline', marginLeft: 4 }} />
                      </Link>
                    </HStack>
                  )}
                  <HStack spacing={2} fontSize="sm" color="gray.600">
                    <FiCalendar />
                    <Text>Tham gia {new Date(profile.user?.createdAt).toLocaleDateString('vi-VN')}</Text>
                  </HStack>
                </VStack>
              </VStack>
            </HStack>
            
            {/* Action Buttons */}
            <VStack spacing={2}>
              {isOwnProfile ? (
                <Button
                  leftIcon={<FiEdit />}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  onClick={onEditOpen}
                >
                  Chỉnh sửa
                </Button>
              ) : (
                <VStack spacing={2}>
                  {friendshipStatus === null && (
                    <Button
                      leftIcon={<FiUserPlus />}
                      colorScheme="blue"
                      size="sm"
                      onClick={handleSendFriendRequest}
                      isLoading={sendingRequest}
                      loadingText="Đang gửi..."
                    >
                      Kết bạn
                    </Button>
                  )}
                  
                  {friendshipStatus === 'pending' && (
                    <Button
                      leftIcon={<FiClock />}
                      colorScheme="yellow"
                      variant="outline"
                      size="sm"
                      disabled
                    >
                      Đã gửi lời mời
                    </Button>
                  )}
                  
                  {friendshipStatus === 'accepted' && (
                    <HStack spacing={2}>
                      <Button
                        leftIcon={<FiUserCheck />}
                        colorScheme="green"
                        variant="outline"
                        size="sm"
                        disabled
                      >
                        Bạn bè
                      </Button>
                      <Button
                        leftIcon={<FiMessageCircle />}
                        colorScheme="blue"
                        size="sm"
                      >
                        Nhắn tin
                      </Button>
                    </HStack>
                  )}
                </VStack>
              )}
              
              <HStack spacing={1}>
                <Tooltip label="Chia sẻ profile">
                  <IconButton
                    icon={<FiShare2 />}
                    size="sm"
                    variant="ghost"
                  />
                </Tooltip>
                <Tooltip label="Báo cáo">
                  <IconButton
                    icon={<FiEye />}
                    size="sm"
                    variant="ghost"
                  />
                </Tooltip>
              </HStack>
            </VStack>
          </Flex>
          
          <Divider />
          
          {/* Stats Section */}
          {profile.stats && (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Stat textAlign="center" p={3} bg="blue.50" borderRadius="lg">
                <StatLabel fontSize="sm">Level</StatLabel>
                <StatNumber color="blue.600" fontSize="xl">
                  {profile.stats.currentLevel || 1}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  {profile.stats.totalXP || 0} XP
                </StatHelpText>
              </Stat>
              
              <Stat textAlign="center" p={3} bg="green.50" borderRadius="lg">
                <StatLabel fontSize="sm">Chuỗi ngày</StatLabel>
                <StatNumber color="green.600" fontSize="xl">
                  {profile.stats.currentStreak || 0}
                </StatNumber>
                <StatHelpText fontSize="xs">ngày liên tiếp</StatHelpText>
              </Stat>
              
              <Stat textAlign="center" p={3} bg="purple.50" borderRadius="lg">
                <StatLabel fontSize="sm">Nhiệm vụ</StatLabel>
                <StatNumber color="purple.600" fontSize="xl">
                  {profile.stats.tasksCompleted || 0}
                </StatNumber>
                <StatHelpText fontSize="xs">đã hoàn thành</StatHelpText>
              </Stat>
              
              <Stat textAlign="center" p={3} bg="orange.50" borderRadius="lg">
                <StatLabel fontSize="sm">Thành tích</StatLabel>
                <StatNumber color="orange.600" fontSize="xl">
                  {profile.stats.achievementsCount || 0}
                </StatNumber>
                <StatHelpText fontSize="xs">đã đạt được</StatHelpText>
              </Stat>
            </SimpleGrid>
          )}
          
          {/* Skills and Interests */}
          {(profile.skills?.length > 0 || profile.interests?.length > 0) && (
            <VStack align="stretch" spacing={3}>
              {profile.skills?.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>
                    Kỹ năng
                  </Text>
                  <Wrap>
                    {profile.skills.map((skill, index) => (
                      <WrapItem key={index}>
                        <Tag size="sm" colorScheme="blue" variant="subtle">
                          <TagLabel>{skill}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}
              
              {profile.interests?.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>
                    Sở thích
                  </Text>
                  <Wrap>
                    {profile.interests.map((interest, index) => (
                      <WrapItem key={index}>
                        <Tag size="sm" colorScheme="green" variant="subtle">
                          <TagLabel>{interest}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}
            </VStack>
          )}
          
          {/* Custom Badges */}
          {profile.customBadges?.length > 0 && (
            <Box>
              <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>
                Huy hiệu đặc biệt
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                {profile.customBadges.map((badge, index) => (
                  <Badge key={index} colorScheme="gold" variant="solid" px={2} py={1}>
                    {badge.icon} {badge.name}
                  </Badge>
                ))}
              </HStack>
            </Box>
          )}
        </VStack>
      </CardBody>
    </MotionCard>
  );
}

// Profile Edit Modal Component
const _ProfileEditModal = ({ isOpen, onClose, profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    website: profile?.website || '',
    skills: profile?.skills || [],
    interests: profile?.interests || [],
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateProfile(formData);
      onUpdate();
      onClose();

      toast({
        title: '✅ Cập nhật thành công',
        description: 'Profile đã được cập nhật',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: '❌ Lỗi cập nhật',
        description: error.response?.data?.message || 'Không thể cập nhật profile',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Chỉnh sửa Profile</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              {/* Form fields would go here */}
              <Text>Form chỉnh sửa profile sẽ được implement ở đây</Text>

              <HStack spacing={3} w="full" justify="end">
                <Button variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={loading}
                  loadingText="Đang lưu..."
                >
                  Lưu thay đổi
                </Button>
              </HStack>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
