import React, { useEffect, useState } from 'react';
import { Box, Button, Input, Textarea, VStack, HStack, Spinner, Heading, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Tag } from '@chakra-ui/react';
import api from '../api';

export default function Resource() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', fileUrl: '', tags: '' });
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await api.orchestrator({ function_call: { entity: 'resource', action: 'list' } });
      setResources(res.data.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch resources',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await api.orchestrator({
        function_call: {
          entity: 'resource',
          action: editingResource ? 'update' : 'create',
          data: editingResource ? { ...formData, id: editingResource.id } : formData
        }
      });
      
      if (editingResource) {
        setResources(prev => prev.map(r => r.id === editingResource.id ? response.data.resource : r));
      } else {
        setResources(prev => [...prev, response.data.resource]);
      }
      
      setFormData({ title: '', description: '', url: '', type: 'document' });
      setEditingResource(null);
      
      toast({
        title: 'Success',
        description: `Resource ${editingResource ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to save resource',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (r) => {
    setEditingResource(r);
    setFormData({
      title: r.title,
      description: r.description,
      url: r.url,
      type: r.type
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      await api.orchestrator({
        function_call: { entity: 'resource', action: 'delete', data: { id } }
      });
      
      setResources(prev => prev.filter(r => r.id !== id));
      toast({
        title: 'Success',
        description: 'Resource deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resource',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (<Box p={4} maxW="800px" mx="auto">
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">Tài nguyên</Heading>
        <Button colorScheme="teal" onClick={() => { setEditing(null); setForm({ title: '', description: '', fileUrl: '', tags: '' }); onOpen(); }}>Tạo tài nguyên</Button>
      </HStack>
      {loading ? <Spinner /> : (
        <VStack spacing={4} align="stretch">
          {resources.length === 0 && <Box>Chưa có tài nguyên nào.</Box>}
          {resources.map(r => (
            <Box key={r._id} p={4} borderWidth={1} borderRadius="md" boxShadow="sm" _hover={{ boxShadow: 'md' }}>
              <HStack justify="space-between">
                <Box>
                  <Heading size="md">{r.title}</Heading>
                  <Box>{r.description}</Box>
                  <Box fontSize="sm" color="gray.500">{r.fileUrl && <a href={r.fileUrl} target="_blank" rel="noopener noreferrer">Tải về</a>}</Box>
                  <Box fontSize="sm">Tags: {r.tags?.map(t => <Tag key={t} mr={1}>{t}</Tag>)}</Box>
                </Box>
                <HStack>
                  <Button size="sm" onClick={() => handleEdit(r)}>Sửa</Button>
                  <Button size="sm" colorScheme="red" onClick={() => handleDelete(r._id)}>Xóa</Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Sửa tài nguyên' : 'Tạo tài nguyên'}</ModalHeader>
          <ModalBody>
            <VStack spacing={3}>
              <Input placeholder="Tiêu đề" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <Textarea placeholder="Mô tả" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <Input placeholder="Link file (nếu có)" value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} />
              <Input placeholder="Tags (cách nhau bởi dấu phẩy)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
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