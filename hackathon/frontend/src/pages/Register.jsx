import React, { useState, useEffect } from 'react';
import { Box, Button, Input, Heading, Stack, Text, useToast } from '@chakra-ui/react';
import { useLocation, useNavigate  } from 'react-router-dom';
import { register as apiRegister } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async () => {
    try {
      setLoading(true);
      const res = await apiRegister(name, email, password);
      
      if (res.data.success) {
        toast({
          title: 'Success',
          description: 'Registration successful! Please log in.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Registration failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="sm" mx="auto" mt={16} p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
      <Heading mb={6} textAlign="center">Đăng ký</Heading>
      <Stack spacing={4}>
        <Input placeholder="Họ tên" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input placeholder="Mật khẩu" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <Button colorScheme="teal" isLoading={loading} onClick={handleRegister}>Đăng ký</Button>
      </Stack>
      <Text mt={4} textAlign="center">Đã có tài khoản? <a href="/login" style={{color: '#3182ce'}}>Đăng nhập</a></Text>
    </Box>
  );
} 