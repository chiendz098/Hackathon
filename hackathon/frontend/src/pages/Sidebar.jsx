import React from 'react';
import { useToast, Box, VStack, Link as ChakraLink  } from '@chakra-ui/react';
import { useLocation, Link  } from 'react-router-dom';

const navs = [
  { name: 'Todo', path: '/todo', icon: '📝' },
  { name: 'ToDo', path: '/todo', icon: '📝' },
  
  { name: 'Gamification', path: '/gamification', icon: '🎮' },
  { name: 'FBot AI', path: '/advanced-chatbot', icon: '🧠' },
  { name: 'Forum', path: '/forum', icon: '💬' },
  { name: 'Events', path: '/events', icon: '📅' },
  { name: 'Resources', path: '/resources', icon: '📚' },
  { name: 'Profile', path: '/profile', icon: '👤' },
  { name: 'Settings', path: '/settings', icon: '⚙️' }
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <Box as="nav" w={{ base: '100%', md: '220px' }} bg="gray.50" p={4} minH="100vh" boxShadow="md">
      <VStack align="stretch" spacing={2}>
        {navs.map(nav => (
          <ChakraLink
            as={Link}
            to={nav.path}
            key={nav.path}
            fontWeight={location.pathname === nav.path ? 'bold' : 'normal'}
            color={location.pathname === nav.path ? 'teal.500' : 'gray.700'}
            _hover={{ color: 'teal.600' }}
            p={2}
            borderRadius="md"
            bg={location.pathname === nav.path ? 'teal.50' : 'transparent'}
          >
            {nav.name}
          </ChakraLink>
        ))}
      </VStack>
    </Box>
  );
} 