import React, { useEffect, useState } from 'react';
import { Box, Button, Input, Textarea, VStack, HStack, Spinner, Heading, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select } from '@chakra-ui/react';
import api from '../api';

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ content: '', rating: 5, targetType: '', targetId: '' });
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await api.orchestrator({ function_call: { entity: 'feedback', action: 'list' } });
      setFeedbacks(res.data.feedbacks || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch feedbacks',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await api.orchestrator({
        function_call: {
          entity: 'feedback',
          action: editingFeedback ? 'update' : 'create',
          data: editingFeedback ? { ...formData, id: editingFeedback.id } : formData
        }
      });
      
      if (editingFeedback) {
        setFeedbacks(prev => prev.map(f => f.id === editingFeedback.id ? response.data.feedback : f));
      } else {
        setFeedbacks(prev => [...prev, response.data.feedback]);
      }
      
      setFormData({ title: '', description: '', type: 'suggestion', priority: 'medium' });
      setEditingFeedback(null);
      
      toast({
        title: 'Success',
        description: `Feedback ${editingFeedback ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to save feedback',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (f) => {
    setEditingFeedback(f);
    setFormData({
      title: f.title,
      description: f.description,
      type: f.type,
      priority: f.priority
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      await api.orchestrator({
        function_call: { entity: 'feedback', action: 'delete', data: { id } }
      });
      
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      toast({
        title: 'Success',
        description: 'Feedback deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete feedback',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (<Box p={4} maxW="800px" mx="auto">
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">Feedback</Heading>
        <Button colorScheme="teal" onClick={() => { setEditing(null); setForm({ content: '', rating: 5, targetType: '', targetId: '' }); onOpen(); }}>Tạo feedback</Button>
      </HStack>
      {loading ? <Spinner /> : (
        <VStack spacing={4} align="stretch">
          {feedbacks.length === 0 && <Box>Chưa có feedback nào.</Box>}
          {feedbacks.map(f => (
            <Box key={f._id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm" _hover={{ boxShadow: 'md' }}>
              <HStack justify="space-between">
                <Box>
                  <Heading size="md">{f.user?.name || 'Người dùng'}</Heading>
                  <Box>{f.content}</Box>
                  <Box fontSize="sm">Đánh giá: {f.rating}/5</Box>
                  <Box fontSize="sm" color="gray.500">{f.targetType} - {f.targetId}</Box>
                </Box>
                <HStack>
                  <Button size="sm" onClick={() => handleEdit(f)}>Sửa</Button>
                  <Button size="sm" colorScheme="red" onClick={() => handleDelete(f._id)}>Xóa</Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Sửa feedback' : 'Tạo feedback'}</ModalHeader>
          <ModalBody>
            <VStack spacing={3}>
              <Textarea placeholder="Nội dung" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              <Input type="number" min={1} max={5} placeholder="Đánh giá (1-5)" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} />
              <Input placeholder="Loại đối tượng (course, mentor, event, ...)" value={form.targetType} onChange={e => setForm(f => ({ ...f, targetType: e.target.value }))} />
              <Input placeholder="ID đối tượng" value={form.targetId} onChange={e => setForm(f => ({ ...f, targetId: e.target.value }))} />
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