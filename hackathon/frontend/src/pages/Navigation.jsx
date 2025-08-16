import React from 'react';
import { useLocation, Link as RouterLink  } from 'react-router-dom';
import { useToast, Box, Flex, HStack, Link, IconButton, useDisclosure, VStack, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, Button  } from '@chakra-ui/react';

const links = [
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

export default function Navigation() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box bg="teal.500" px={4} color="white" boxShadow="md">
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Box fontWeight="bold" fontSize="xl">FPT UniHub</Box>
        <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
          {links.map(link => (
            <Link as={RouterLink} to={link.path} key={link.path} px={2} py={1} rounded="md" _hover={{ bg: 'teal.600' }}>{link.name}</Link>
          ))}
        </HStack>
        <IconButton
          size="md"
          icon={<span role="img" aria-label="menu">🍔</span>}
          aria-label="Open Menu"
          display={{ md: 'none' }}
          onClick={onOpen}
        />
      </Flex>
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <VStack align="start" spacing={4}>
              {links.map(link => (
                <Button as={RouterLink} to={link.path} key={link.path} w="100%" onClick={onClose}>{link.name}</Button>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
} 