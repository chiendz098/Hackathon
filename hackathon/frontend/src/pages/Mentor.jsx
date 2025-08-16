import React, { useEffect, useState } from 'react';
import { Box, Button, Input, Textarea, VStack, HStack, Spinner, Heading, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Tag } from '@chakra-ui/react';
import api from '../api';

export default function Mentor() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ bio: '', expertise: '' });
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const res = await api.orchestrator({ function_call: { entity: 'mentor', action: 'list' } });
      setMentors(res.data.mentors || []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch mentors',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMentors(); }, []);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await api.orchestrator({
        function_call: {
          entity: 'mentor',
          action: editingMentor ? 'update' : 'create',
          data: editingMentor ? { ...formData, id: editingMentor.id } : formData
        }
      });
      
      if (editingMentor) {
        setMentors(prev => prev.map(m => m.id === editingMentor.id ? response.data.mentor : m));
      } else {
        setMentors(prev => [...prev, response.data.mentor]);
      }
      
      setFormData({ name: '', email: '', expertise: '', bio: '' });
      setEditingMentor(null);
      
      toast({
        title: 'Success',
        description: `Mentor ${editingMentor ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving mentor:', error);
      toast({
        title: 'Error',
        description: 'Failed to save mentor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (m) => {
    setEditingMentor(m);
    setFormData({
      name: m.name,
      email: m.email,
      expertise: m.expertise,
      bio: m.bio
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this mentor?')) return;
    
    try {
      await api.orchestrator({
        function_call: { entity: 'mentor', action: 'delete', data: { id } }
      });
      
      setMentors(prev => prev.filter(m => m.id !== id));
      toast({
        title: 'Success',
        description: 'Mentor deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting mentor:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete mentor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (<Box p={4} maxW="800px" mx="auto">
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">Mentor</Heading>
        <Button colorScheme="teal" onClick={() => { setEditing(null); setForm({ bio: '', expertise: '' }); onOpen(); }}>Tạo mentor</Button>
      </HStack>
      {loading ? <Spinner /> : (
        <VStack spacing={4} align="stretch">
          {mentors.length === 0 && <Box>Chưa có mentor nào.</Box>}
          {mentors.map(m => (
            <Box key={m._id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm" _hover={{ boxShadow: 'md' }}>
              <HStack justify="space-between">
                <Box>
                  <Heading size="md">{m.user?.name || 'Mentor'}</Heading>
                  <Box>{m.bio}</Box>
                  <Box fontSize="sm">Chuyên môn: {m.expertise?.map(t => <Tag key={t} mr={1}>{t}</Tag>)}</Box>
                </Box>
                <HStack>
                  <Button size="sm" onClick={() => handleEdit(m)}>Sửa</Button>
                  <Button size="sm" colorScheme="red" onClick={() => handleDelete(m._id)}>Xóa</Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Sửa mentor' : 'Tạo mentor'}</ModalHeader>
          <ModalBody>
            <VStack spacing={3}>
              <Textarea placeholder="Giới thiệu" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              <Input placeholder="Chuyên môn (cách nhau bởi dấu phẩy)" value={form.expertise} onChange={e => setForm(f => ({ ...f, expertise: e.target.value }))} />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleSubmit} colorScheme="teal">Lưu</Button>
            <Button onClick={onClose} ml={2}>Hủy</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 