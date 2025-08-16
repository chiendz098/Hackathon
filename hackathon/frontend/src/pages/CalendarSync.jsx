import { useEffect, useState  } from 'react';
import { Box, Heading, Button, Text, useToast } from '@chakra-ui/react';
import { syncCalendar } from '../api';

export default function CalendarSync() {
  const [result, setResult] = useState('');
  const toast = useToast();

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await syncCalendar();
      
      toast({
        title: 'Calendar Synced!',
        description: 'Your calendar has been synchronized successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync calendar',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Box>
      <Heading mb={4}>Đồng bộ Google Calendar</Heading>
      <Text mb={4}>Tính năng này sẽ đồng bộ to-do/lịch học với Google Calendar của bạn. (Cần cấu hình OAuth, API key)</Text>
      <Button colorScheme="blue" onClick={handleSync}>Đồng bộ ngay</Button>
      {result && <Text mt={4}>{result}</Text>}
      <Text mt={8} color="gray.500" fontSize="sm">TODO: Cần cấu hình Google OAuth, lấy access_token từ user, dùng googleapis để đồng bộ. Xem hướng dẫn <a href="https://developers.google.com/calendar/api/quickstart/nodejs" target="_blank" rel="noopener noreferrer" style={{color: '#3182ce'}}>tại đây</a>.</Text>
    </Box>
  );
} 