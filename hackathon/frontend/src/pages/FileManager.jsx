import { useEffect, useState  } from 'react';
import { Box, Heading, Stack, Button, Input, Text, Link, useToast } from '@chakra-ui/react';
import { uploadFile, getFileList } from '../api';

export default function FileManager() {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const toast = useToast();

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await api.getFileList();
      setFiles(response.data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch files',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchFiles(); }, []);

  const handleUpload = async () => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await api.uploadFile(formData);
      setFiles(prev => [...prev, response.data]);
      setSelectedFile(null);
      
      toast({
        title: 'Success',
        description: 'File uploaded successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Heading mb={4}>Quản lý tài liệu</Heading>
      <Stack direction="row" mb={4}>
        <Input type="file" onChange={e => setFile(e.target.files[0])} />
        <Button colorScheme="teal" onClick={handleUpload}>Upload</Button>
      </Stack>
      <Stack spacing={3}>
        {files.map(f => (
          <Box key={f.filename} p={3} borderWidth={1} borderRadius="md" display="flex" alignItems="center" justifyContent="space-between">
            <Text>{f.filename}</Text>
            <Link href={f.url} isExternal color="blue.500"><Button size="sm">Tải về</Button></Link>
          </Box>
        ))}
      </Stack>
    </Box>
  );
} 