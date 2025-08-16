import { Heading, Button, Stack, Box, Text, Input, useToast } from '@chakra-ui/react';
import { useLocation, Link  } from 'react-router-dom';
import { useEffect, useState   } from 'react';
import { getGroups, createGroup } from '../api';

export default function Group() {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const toast = useToast();

  const fetchGroups = async () => {
    try {
      const response = await getGroups();
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch groups',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleCreate = async () => {
    if (!name) return;
    try {
      await createGroup({ name });
      setName('');
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: 'Failed to create group',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Heading mb={4}>Nhóm học nhóm</Heading>
      <Stack direction="row" mb={4}>
        <Input placeholder="Tên nhóm mới..." value={name} onChange={e => setName(e.target.value)} />
        <Button colorScheme="orange" onClick={handleCreate}>Tạo nhóm mới</Button>
      </Stack>
      <Stack spacing={3}>
        {groups.map(group => (
          <Box key={group._id} p={4} borderWidth={1} borderRadius="md">
            <Text as={Link} to={`/group/${group._id}`}>{group.name}</Text>
          </Box>
        ))}
      </Stack>
    </Box>
  );
} 