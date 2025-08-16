import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardBody,
  Text,
  VStack,
  HStack,
  Badge,
  Icon,
  Avatar,
  Divider,
  Button,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import {
  FaTrophy,
  FaCheckCircle,
  FaFire,
  FaStar,
  FaCoins,
  FaGem,
  FaBook,
  FaUsers,
  FaBullseye,
  FaMedal,
  FaAward,
  FaGift,
  FaRocket,
  FaLightbulb,
  FaClock,
  FaCalendar,
  FaHeart,
  FaThumbsUp,
  FaComment,
  FaShare,
  FaEye,
  FaFilter,
  FaRedo
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { getGamificationStatistics } from '../../api';

const ActivityFeed = () => {
  const { user } = useAuth();
  const toast = useToast();
  
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [filter, setFilter] = useState('all');

  // Activity types configuration
  const activityTypes = {
    achievement: {
      icon: FaTrophy,
      color: 'yellow',
      bgColor: 'yellow.50',
      textColor: 'yellow.800'
    },
    task: {
      icon: FaCheckCircle,
      color: 'green',
      bgColor: 'green.50',
      textColor: 'green.800'
    },
    streak: {
      icon: FaFire,
      color: 'orange',
      bgColor: 'orange.50',
      textColor: 'orange.800'
    },
    level: {
      icon: FaStar,
      color: 'blue',
      bgColor: 'blue.50',
      textColor: 'blue.800'
    },
    study: {
      icon: FaBook,
      color: 'purple',
      bgColor: 'purple.50',
      textColor: 'purple.800'
    },
    social: {
      icon: FaUsers,
      color: 'teal',
      bgColor: 'teal.50',
      textColor: 'teal.800'
    },
    reward: {
      icon: FaGift,
      color: 'pink',
      bgColor: 'pink.50',
      textColor: 'pink.800'
    },
    milestone: {
      icon: FaAward,
      color: 'red',
      bgColor: 'red.50',
      textColor: 'red.800'
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // Fetch real activities from API
      const response = await fetch('/api/activity/recent', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setActivities(data.activities || []);
        } else {
          console.error('Failed to fetch activities:', data.message);
          setActivities([]);
        }
      } else {
        console.error('Failed to fetch activities:', response.status);
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    // Format timestamp from API
    if (!timeString) return 'Just now';
    
    const date = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const handleLike = (activityId) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId 
        ? { ...activity, likes: activity.likes + 1 }
        : activity
    ));
  };

  const handleComment = (activityId) => {
    toast({
      title: 'Comment Feature',
      description: 'Comment feature coming soon!',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleShare = (activityId) => {
    toast({
      title: 'Share Feature',
      description: 'Share feature coming soon!',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.type === filter;
  });

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
            <Text className="ml-3">Loading activities...</Text>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardBody>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Activity Feed</h3>
          <Button
            onClick={fetchActivities}
            size="sm"
            variant="outline"
                          leftIcon={<FaRedo />}
          >
            Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        <Tabs variant="soft-rounded" colorScheme="blue" className="mb-6">
          <TabList>
            <Tab onClick={() => setFilter('all')}>All</Tab>
            <Tab onClick={() => setFilter('achievement')}>Achievements</Tab>
            <Tab onClick={() => setFilter('task')}>Tasks</Tab>
            <Tab onClick={() => setFilter('study')}>Study</Tab>
            <Tab onClick={() => setFilter('streak')}>Streaks</Tab>
          </TabList>
        </Tabs>

        {/* Activities List */}
        <VStack spacing={4} align="stretch">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity, index) => {
              // Safe fallback for activity type
              const activityType = activityTypes[activity.type] || activityTypes.task;
              const ActivityIcon = activityType?.icon || FaCheckCircle;
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardBody>
                      <div className="flex items-start space-x-4">
                        {/* Avatar */}
                        <Avatar 
                          src={activity.avatar} 
                          name={activity.user}
                          size="md"
                          className="flex-shrink-0"
                        />
                        
                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Badge
                              colorScheme={activityType?.color || 'gray'}
                              className="mr-2"
                            >
                              <ActivityIcon className="w-3 h-3 mr-1" />
                              {activity.type || 'activity'}
                            </Badge>
                            <Text className="text-sm text-gray-500">
                              {formatTime(activity.time)}
                            </Text>
                          </div>
                          
                          <Text className="font-semibold text-gray-900 mb-1">
                            {activity.title || 'Activity'}
                          </Text>
                          
                          <Text className="text-gray-600 mb-3">
                            {activity.description || 'No description available'}
                          </Text>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {activity.reward && (
                                <div className="flex items-center text-green-600">
                                  <FaGift className="w-4 h-4 mr-1" />
                                  <Text className="text-sm font-medium">
                                    {typeof activity.reward === 'object' 
                                      ? `${activity.reward.xp || 0} XP + ${activity.reward.coins || 0} Coins`
                                      : activity.reward
                                    }
                                  </Text>
                                </div>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleLike(activity.id)}
                                leftIcon={<FaHeart />}
                              >
                                {activity.likes || 0}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleComment(activity.id)}
                                leftIcon={<FaComment />}
                              >
                                {activity.comments || 0}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleShare(activity.id)}
                                leftIcon={<FaShare />}
                              >
                                {activity.shares || 0}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <Alert status="info">
              <AlertIcon />
              <Text>No activities found. Start completing tasks to see your activity feed!</Text>
            </Alert>
          )}
        </VStack>

        {/* Load More Button */}
        {filteredActivities.length > 0 && (
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={() => {
                toast({
                  title: 'Load More',
                  description: 'More activities will be loaded soon!',
                  status: 'info',
                  duration: 2000,
                  isClosable: true,
                });
              }}
            >
              Load More Activities
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default ActivityFeed; 