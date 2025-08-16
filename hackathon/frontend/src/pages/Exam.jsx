import React, { useEffect, useState } from 'react';
import { Box, Button, Input, Textarea, VStack, HStack, Spinner, Heading, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@chakra-ui/react';
import api from '../api';

export default function Exam() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', startTime: '', endTime: '' });
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.orchestrator({ function_call: { entity: 'exam', action: 'list' } });
      setExams(res.data.exams || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch exams',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(); }, []);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await api.orchestrator({
        function_call: {
          entity: 'exam',
          action: editingExam ? 'update' : 'create',
          data: editingExam ? { ...formData, id: editingExam.id } : formData
        }
      });
      
      if (editingExam) {
        setExams(prev => prev.map(ex => ex.id === editingExam.id ? response.data.exam : ex));
      } else {
        setExams(prev => [...prev, response.data.exam]);
      }
      
      setFormData({ title: '', description: '', duration: 60, totalQuestions: 10 });
      setEditingExam(null);
      
      toast({
        title: 'Success',
        description: `Exam ${editingExam ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving exam:', error);
      toast({
        title: 'Error',
        description: 'Failed to save exam',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ex) => {
    setEditingExam(ex);
    setFormData({
      title: ex.title,
      description: ex.description,
      duration: ex.duration,
      totalQuestions: ex.totalQuestions
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    
    try {
      await api.orchestrator({
        function_call: { entity: 'exam', action: 'delete', data: { id } }
      });
      
      setExams(prev => prev.filter(ex => ex.id !== id));
      toast({
        title: 'Success',
        description: 'Exam deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete exam',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (<Box p={4} maxW="800px" mx="auto">
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">Bài kiểm tra</Heading>
        <Button colorScheme="teal" onClick={() => { setEditing(null); setForm({ title: '', description: '', startTime: '', endTime: '' }); onOpen(); }}>Tạo bài kiểm tra</Button>
      </HStack>
      {loading ? <Spinner /> : (
        <VStack spacing={4} align="stretch">
          {exams.length === 0 && <Box>Chưa có bài kiểm tra nào.</Box>}
          {exams.map(ex => (
            <Box key={ex._id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm" _hover={{ boxShadow: 'md' }}>
              <HStack justify="space-between">
                <Box>
                  <Heading size="md">{ex.title}</Heading>
                  <Box>{ex.description}</Box>
                  <Box fontSize="sm" color="gray.500">{ex.startTime?.slice(0, 16)} - {ex.endTime?.slice(0, 16)}</Box>
                </Box>
                <HStack>
                  <Button size="sm" onClick={() => handleEdit(ex)}>Sửa</Button>
                  <Button size="sm" colorScheme="red" onClick={() => handleDelete(ex._id)}>Xóa</Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Sửa bài kiểm tra' : 'Tạo bài kiểm tra'}</ModalHeader>
          <ModalBody>
            <VStack spacing={3}>
              <Input placeholder="Tiêu đề" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <Textarea placeholder="Mô tả" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <Input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              <Input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
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