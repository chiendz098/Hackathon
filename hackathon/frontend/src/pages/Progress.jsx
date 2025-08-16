import React, { useEffect, useState } from 'react';
import { Box, Button, Input, VStack, HStack, Spinner, Heading, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Select } from '@chakra-ui/react';
import api from '../api';

export default function Progress() {
  const [progresses, setProgresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ targetType: '', targetId: '', progress: 0, status: 'not started' });
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchProgresses = async () => {
    try {
      setLoading(true);
      const res = await api.orchestrator({ function_call: { entity: 'progress', action: 'list' } });
      setProgresses(res.data.progresses || []);
    } catch (error) {
      console.error('Error fetching progresses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch progresses',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProgresses(); }, []);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await api.orchestrator({
        function_call: {
          entity: 'progress',
          action: editingProgress ? 'update' : 'create',
          data: editingProgress ? { ...formData, id: editingProgress.id } : formData
        }
      });
      
      if (editingProgress) {
        setProgresses(prev => prev.map(p => p.id === editingProgress.id ? response.data.progress : p));
      } else {
        setProgresses(prev => [...prev, response.data.progress]);
      }
      
      setFormData({ title: '', description: '', status: 'in_progress', percentage: 0 });
      setEditingProgress(null);
      
      toast({
        title: 'Success',
        description: `Progress ${editingProgress ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to save progress',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (p) => {
    setEditingProgress(p);
    setFormData({
      title: p.title,
      description: p.description,
      status: p.status,
      percentage: p.percentage
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this progress?')) return;
    
    try {
      await api.orchestrator({
        function_call: { entity: 'progress', action: 'delete', data: { id } }
      });
      
      setProgresses(prev => prev.filter(p => p.id !== id));
      toast({
        title: 'Success',
        description: 'Progress deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete progress',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (<Box p={4} maxW="800px" mx="auto">
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">Tiến độ</Heading>
        <Button colorScheme="teal" onClick={() => { setEditing(null); setForm({ targetType: '', targetId: '', progress: 0, status: 'not started' }); onOpen(); }}>Tạo tiến độ</Button>
      </HStack>
      {loading ? <Spinner /> : (
        <VStack spacing={4} align="stretch">
          {progresses.length === 0 && <Box>Chưa có tiến độ nào.</Box>}
          {progresses.map(p => (
            <Box key={p._id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm" _hover={{ boxShadow: 'md' }}>
              <HStack justify="space-between">
                <Box>
                  <Heading size="md">{p.targetType} - {p.targetId}</Heading>
                  <Box>Tiến độ: {p.progress}%</Box>
                  <Box fontSize="sm">Trạng thái: {p.status}</Box>
                </Box>
                <HStack>
                  <Button size="sm" onClick={() => handleEdit(p)}>Sửa</Button>
                  <Button size="sm" colorScheme="red" onClick={() => handleDelete(p._id)}>Xóa</Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Sửa tiến độ' : 'Tạo tiến độ'}</ModalHeader>
          <ModalBody>
            <VStack spacing={3}>
              <Input placeholder="Loại đối tượng (course, exam, todo, ...)" value={form.targetType} onChange={e => setForm(f => ({ ...f, targetType: e.target.value }))} />
              <Input placeholder="ID đối tượng" value={form.targetId} onChange={e => setForm(f => ({ ...f, targetId: e.target.value }))} />
              <Input type="number" min={0} max={100} placeholder="Tiến độ (%)" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: e.target.value }))} />
              <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="not started">Chưa bắt đầu</option>
                <option value="in progress">Đang thực hiện</option>
                <option value="completed">Hoàn thành</option>
              </Select>
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