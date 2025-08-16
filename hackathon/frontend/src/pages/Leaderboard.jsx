import { useEffect, useState   } from 'react';
import { getLeaderboard } from '../api';
import { useToast, Box, Heading, Stack, Text, Badge, Spinner, Alert, AlertIcon  } from '@chakra-ui/react';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getLeaderboard()
      .then(res => {
        console.log('Leaderboard API response:', res);
        if (res.success && Array.isArray(res.leaderboard)) {
          setUsers(res.leaderboard);
        } else if (res.success && Array.isArray(res.data)) {
          setUsers(res.data);
        } else {
          console.log('No valid leaderboard data found:', res);
          setUsers([]);
        }
      })
      .catch(err => {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard');
        setUsers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="xl" />
        <Text mt={4}>Loading leaderboard...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (!Array.isArray(users) || users.length === 0) {
    return (
      <Box>
        <Heading mb={4}>Bảng xếp hạng</Heading>
        <Text>No leaderboard data available.</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading mb={4}>Bảng xếp hạng</Heading>
      <Stack spacing={3}>
        {users.map((user, i) => (
          <Box key={user.id || user._id || i} p={4} borderWidth={1} borderRadius="md" display="flex" alignItems="center" gap={4}>
            <Text fontWeight="bold" fontSize="lg">#{i+1}</Text>
            <Text flex={1}>{user.name || user.displayName || 'Unknown User'}</Text>
            <Text color="teal.500" fontWeight="bold">{user.points || user.totalXP || 0} điểm</Text>
            {user.badges && Array.isArray(user.badges) && user.badges.map(badge => (
              <Badge key={badge} colorScheme="yellow" ml={2}>{badge}</Badge>
            ))}
          </Box>
        ))}
      </Stack>
    </Box>
  );
} 