import React, { useEffect, useState } from 'react';
import { Box, Button, VStack, HStack, Spinner, Heading, useToast, Tag } from '@chakra-ui/react';
import api from '../api';

export default function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.orchestrator({ function_call: { entity: 'notification', action: 'list' } });
      setNotifications(res.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch notifications',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (n) => {
    try {
      await api.orchestrator({
        function_call: { entity: 'notification', action: 'markRead', data: { id: n.id } }
      });
      
      setNotifications(prev => prev.map(notif => 
        notif.id === n.id ? { ...notif, isRead: true } : notif
      ));
      
      toast({
        title: 'Success',
        description: 'Notification marked as read',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      await api.orchestrator({
        function_call: { entity: 'notification', action: 'delete', data: { id } }
      });
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({
        title: 'Success',
        description: 'Notification deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4} maxW="800px" mx="auto">
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">Thông báo</Heading>
      </HStack>
      {loading ? <Spinner /> : (
        <VStack spacing={4} align="stretch">
          {notifications.length === 0 && <Box>Chưa có thông báo nào.</Box>}
          {notifications.map(n => (
            <Box key={n._id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm" _hover={{ boxShadow: 'md' }} bg={n.isRead ? 'gray.50' : 'teal.50'}>
              <HStack justify="space-between">
                <Box>
                  <Tag colorScheme={n.isRead ? 'gray' : 'teal'} mr={2}>{n.type || 'Thông báo'}</Tag>
                  {n.content}
                  <Box fontSize="sm" color="gray.500">{new Date(n.createdAt).toLocaleString()}</Box>
                </Box>
                <HStack>
                  {!n.isRead && <Button size="sm" onClick={() => handleMarkRead(n)}>Đánh dấu đã đọc</Button>}
                  <Button size="sm" colorScheme="red" onClick={() => handleDelete(n._id)}>Xóa</Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
} 