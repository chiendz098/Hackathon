import React, { useEffect, useState } from 'react';
import { Box, Button, Input, Textarea, VStack, HStack, Spinner, Heading, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@chakra-ui/react';
import api from '../api';

export default function Event() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', startTime: '', endTime: '', location: '' });
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.orchestrator({ function_call: { entity: 'event', action: 'list' } });
      setEvents(res.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch events',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await api.orchestrator({
        function_call: {
          entity: 'event',
          action: editingEvent ? 'update' : 'create',
          data: editingEvent ? { ...formData, id: editingEvent.id } : formData
        }
      });
      
      if (editingEvent) {
        setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? response.data.event : ev));
      } else {
        setEvents(prev => [...prev, response.data.event]);
      }
      
      setFormData({ title: '', description: '', startDate: '', endDate: '', location: '' });
      setEditingEvent(null);
      
      toast({
        title: 'Success',
        description: `Event ${editingEvent ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error',
        description: 'Failed to save event',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ev) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title,
      description: ev.description,
      startDate: ev.startDate,
      endDate: ev.endDate,
      location: ev.location
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await api.orchestrator({
        function_call: { entity: 'event', action: 'delete', data: { id } }
      });
      
      setEvents(prev => prev.filter(ev => ev.id !== id));
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (<Box p={4} maxW="800px" mx="auto">
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">Sự kiện</Heading>
        <Button colorScheme="teal" onClick={() => { setEditing(null); setForm({ title: '', description: '', startTime: '', endTime: '', location: '' }); onOpen(); }}>Tạo sự kiện</Button>
      </HStack>
      {loading ? <Spinner /> : (
        <VStack spacing={4} align="stretch">
          {events.length === 0 && <Box>Chưa có sự kiện nào.</Box>}
          {events.map(ev => (
            <Box key={ev._id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm" _hover={{ boxShadow: 'md' }}>
              <HStack justify="space-between">
                <Box>
                  <Heading size="md">{ev.title}</Heading>
                  <Box>{ev.description}</Box>
                  <Box fontSize="sm" color="gray.500">{ev.startTime?.slice(0, 16)} - {ev.endTime?.slice(0, 16)}</Box>
                  <Box fontSize="sm">Địa điểm: {ev.location}</Box>
                </Box>
                <HStack>
                  <Button size="sm" onClick={() => handleEdit(ev)}>Sửa</Button>
                  <Button size="sm" colorScheme="red" onClick={() => handleDelete(ev._id)}>Xóa</Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Sửa sự kiện' : 'Tạo sự kiện'}</ModalHeader>
          <ModalBody>
            <VStack spacing={3}>
              <Input placeholder="Tiêu đề" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <Textarea placeholder="Mô tả" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <Input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              <Input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
              <Input placeholder="Địa điểm" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
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