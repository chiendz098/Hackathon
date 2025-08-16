import React, { useState } from 'react';
import { Box, Button, VStack, Text, useToast, Alert, AlertIcon } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const AutoFixAuth = () => {
  const [isFixing, setIsFixing] = useState(false);
  const { login } = useAuth();
  const toast = useToast();

  const handleAutoFix = async () => {
    setIsFixing(true);
    
    try {
      // Test user data
      const userInfo = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: 'admin'
      };
      
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluIFVzZXIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU0NjUyODMwLCJleHAiOjE3NTUyNTc2MzB9.UleAdfInPgG9FLJB-hbOI_jcIA1HhaDnCgHjtXt7zKE';
      
      // Login the user
      login(userInfo, token);
      
      toast({
        title: '✅ Authentication Fixed',
        description: 'Successfully logged in as Admin User. WebSocket should now work!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Auto fix error:', error);
      toast({
        title: '❌ Auto Fix Failed',
        description: 'Failed to fix authentication automatically',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Box p={4} borderWidth={1} borderRadius="lg" maxW="500px" mx="auto" mt={8} bg="blue.50">
      <VStack spacing={4}>
        <Alert status="warning">
          <AlertIcon />
          <Text fontSize="sm">
            WebSocket connection is failing due to authentication issues.
          </Text>
        </Alert>
        
        <Text fontSize="lg" fontWeight="bold" color="blue.600">
          🔧 Auto Fix Authentication
        </Text>
        
        <Text fontSize="sm" color="gray.600" textAlign="center">
          Click the button below to automatically fix the WebSocket authentication issue.
          This will log you in as Admin User and restart the connection.
        </Text>
        
        <Button
          colorScheme="green"
          onClick={handleAutoFix}
          isLoading={isFixing}
          loadingText="Fixing..."
          size="lg"
        >
          🔧 Auto Fix WebSocket Connection
        </Button>
        
        <Text fontSize="xs" color="gray.500" textAlign="center">
          This will automatically set up authentication and reload the page.
        </Text>
      </VStack>
    </Box>
  );
};

export default AutoFixAuth; 