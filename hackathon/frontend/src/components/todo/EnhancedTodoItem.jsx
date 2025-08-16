import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Checkbox,
  Badge,
  Button,
  Progress,
  useToast,
  Tooltip,
  IconButton,
  Collapse,
  Divider,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { motion, AnimatePresence   } from 'framer-motion';
import { 
  FiCalendar, 
  FiClock, 
  FiFlag,
  FiZap,
  FiStar,
  FiChevronDown,
  FiChevronUp,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';
import { updateTodo } from '../../api';
import { useGamification } from '../../contexts/GamificationContext';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

export default function EnhancedTodoItem({ 
  todo, 
  onUpdate, 
  onDelete, 
  onEdit,
  showGamificationPreview = true 
}) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { showXPNotification, showAchievementNotification } = useGamification();
  const toast = useToast();

  const handleToggleComplete = async () => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    try {
      const updatedTodo = { ...todo, isDone: !todo.isDone };
      const response = await updateTodo(todo.id, updatedTodo);
      
      if (response.data) {
        // Show gamification feedback if task was completed
        if (!todo.isDone && updatedTodo.isDone) {
          // Calculate estimated XP (this would normally come from backend)
          const estimatedXP = calculateEstimatedXP(todo);
          
          // Show XP notification
          setTimeout(() => {
            showXPNotification({
              xpAwarded: estimatedXP,
              reason: 'task_completion',
              levelUp: false, // This would come from backend
              currentXP: 0, // This would come from backend
              xpToNext: 100 // This would come from backend
            });
          }, 500);
          
          toast({
            title: 'Todo Completed!',
            description: `+${estimatedXP} XP earned`,
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        }
        
        if (onUpdate) onUpdate(response.data);
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      toast({
        title: 'Error',
        description: 'Failed to update todo',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const calculateEstimatedXP = (todo) => {
    const baseXP = 10;
    
    // Priority multiplier
    const priorityMultiplier = {
      'low': 0.5,
      'medium': 1,
      'high': 1.5,
      'urgent': 2
    };
    
    const priority = todo.priorityLabel || 'medium';
    const multiplier = priorityMultiplier[priority] || 1;
    
    return Math.round(baseXP * multiplier);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'green.400',
      'medium': 'yellow.400',
      'high': 'orange.400',
      'urgent': 'red.400'
    };
    return colors[priority] || 'gray.400';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isOverdue = todo.deadline && new Date(todo.deadline) < new Date() && !todo.isDone;
  const estimatedXP = calculateEstimatedXP(todo);

  return (
    <MotionCard
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      variant="outline"
      bg={todo.isDone ? 'gray.50' : 'white'}
      borderColor={isOverdue ? 'red.200' : 'gray.200'}
      borderWidth={isOverdue ? '2px' : '1px'}
      _hover={{ 
        boxShadow: 'md',
        borderColor: todo.isDone ? 'green.300' : 'blue.300'
      }}
      opacity={todo.isDone ? 0.7 : 1}
    >
      <CardBody p={4}>
        <VStack spacing={3} align="stretch">
          {/* Main Content */}
          <HStack spacing={3} align="start">
            <MotionBox
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Checkbox
                isChecked={todo.isDone}
                onChange={handleToggleComplete}
                isDisabled={isCompleting}
                colorScheme="green"
                size="lg"
              />
            </MotionBox>
            
            <VStack flex={1} align="start" spacing={2}>
              <HStack justify="space-between" w="full">
                <Text
                  fontSize="md"
                  fontWeight="medium"
                  textDecoration={todo.isDone ? 'line-through' : 'none'}
                  color={todo.isDone ? 'gray.500' : 'gray.800'}
                >
                  {todo.title}
                </Text>
                
                {showGamificationPreview && !todo.isDone && (
                  <Tooltip label={`Estimated XP: ${estimatedXP}`} placement="top">
                    <HStack spacing={1} color="blue.500" fontSize="sm">
                      <FiZap size={14} />
                      <Text fontWeight="bold">+{estimatedXP}</Text>
                    </HStack>
                  </Tooltip>
                )}
              </HStack>
              
              {todo.description && (
                <Text
                  fontSize="sm"
                  color="gray.600"
                  textDecoration={todo.isDone ? 'line-through' : 'none'}
                >
                  {todo.description}
                </Text>
              )}
              
              {/* Progress Bar */}
              {todo.progress > 0 && todo.progress < 100 && (
                <Box w="full">
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="xs" color="gray.500">Progress</Text>
                    <Text fontSize="xs" color="gray.500">{todo.progress}%</Text>
                  </HStack>
                  <Progress 
                    value={todo.progress} 
                    colorScheme="blue" 
                    size="sm" 
                    borderRadius="full"
                  />
                </Box>
              )}
              
              {/* Tags and Metadata */}
              <HStack spacing={2} wrap="wrap">
                {todo.priorityLabel && (
                  <Badge 
                    colorScheme={getPriorityColor(todo.priorityLabel)}
                    variant="subtle"
                    fontSize="xs"
                  >
                    <HStack spacing={1}>
                      <FiFlag size={10} />
                      <Text>{todo.priorityLabel}</Text>
                    </HStack>
                  </Badge>
                )}
                
                {todo.category && (
                  <Badge colorScheme="purple" variant="outline" fontSize="xs">
                    {todo.category}
                  </Badge>
                )}
                
                {todo.deadline && (
                  <Badge 
                    colorScheme={isOverdue ? 'red' : 'blue'} 
                    variant="outline" 
                    fontSize="xs"
                  >
                    <HStack spacing={1}>
                      <FiCalendar size={10} />
                      <Text>{formatDate(todo.deadline)}</Text>
                    </HStack>
                  </Badge>
                )}
                
                {todo.timeSpent > 0 && (
                  <Badge colorScheme="green" variant="outline" fontSize="xs">
                    <HStack spacing={1}>
                      <FiClock size={10} />
                      <Text>{Math.round(todo.timeSpent / 60)}m</Text>
                    </HStack>
                  </Badge>
                )}
              </HStack>
            </VStack>
            
            {/* Action Buttons */}
            <VStack spacing={1}>
              <IconButton
                icon={showDetails ? <FiChevronUp /> : <FiChevronDown />}
                size="sm"
                variant="ghost"
                onClick={() => setShowDetails(!showDetails)}
                aria-label="Toggle details"
              />
              
              {onEdit && (
                <IconButton
                  icon={<FiEdit />}
                  size="sm"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={() => onEdit(todo)}
                  aria-label="Edit task"
                />
              )}
              
              {onDelete && (
                <IconButton
                  icon={<FiTrash2 />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => onDelete(todo.id)}
                  aria-label="Delete task"
                />
              )}
            </VStack>
          </HStack>
          
          {/* Expanded Details */}
          <Collapse in={showDetails}>
            <Box pt={2}>
              <Divider mb={3} />
              <VStack spacing={2} align="start" fontSize="sm" color="gray.600">
                {todo.notes && (
                  <Box>
                    <Text fontWeight="medium" mb={1}>Notes:</Text>
                    <Text>{todo.notes}</Text>
                  </Box>
                )}
                
                <HStack spacing={4}>
                  <Text>
                    <strong>Created:</strong> {formatDate(todo.createdAt)}
                  </Text>
                  {todo.completedAt && (
                    <Text>
                      <strong>Completed:</strong> {formatDate(todo.completedAt)}
                    </Text>
                  )}
                </HStack>
                
                {todo.tags && todo.tags.length > 0 && (
                  <Box>
                    <Text fontWeight="medium" mb={1}>Tags:</Text>
                    <HStack spacing={1} wrap="wrap">
                      {Array.isArray(todo.tags) && todo.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" fontSize="xs">
                          {tag}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                )}
              </VStack>
            </Box>
          </Collapse>
        </VStack>
      </CardBody>
    </MotionCard>
  );
}
