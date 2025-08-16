import React from 'react';
import { useToast, Box,
  HStack,
  VStack,
  Button,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Text,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Checkbox,
  CheckboxGroup,
  Divider,
  Tooltip,
  useColorModeValue,
 } from '@chakra-ui/react';
import {
  FiPlus,
  FiFilter,
  FiSearch,
  FiGrid,
  FiList,
  FiColumns,
  FiCalendar,
  FiTrendingUp,
  FiCheckSquare,
  FiSquare,
  FiTrash2,
  FiX,
  FiCheck,
  FiStar,
} from 'react-icons/fi';

export default function TodoControls({
  viewMode,
  setViewMode,
  filter,
  setFilter,
  sortBy,
  setSortBy,
  onAddClick,
  selectedCount = 0,
  totalCount = 0,
  onSelectAll,
  onBulkAction,
  showBulkActions,
  setShowBulkActions,
}) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSelectAll = () => {
    if (onSelectAll) {
      onSelectAll();
    }
  };

  const handleBulkAction = (_action) => {
    if (onBulkAction) {
      onBulkAction(_action);
    }
  };

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      mb={6}
      shadow="sm"
    >
      <HStack justify="space-between" align="center" wrap="wrap" spacing={4}>
        {/* Left side - View controls */}
        <HStack spacing={2}>
          <Tooltip label="Grid View">
            <IconButton
              icon={<FiGrid />}
              variant={viewMode === 'grid' ? 'solid' : 'ghost'}
              colorScheme={viewMode === 'grid' ? 'blue' : 'gray'}
              onClick={() => setViewMode('grid')}
              size="sm"
            />
          </Tooltip>
          
          <Tooltip label="List View">
            <IconButton
              icon={<FiList />}
              variant={viewMode === 'list' ? 'solid' : 'ghost'}
              colorScheme={viewMode === 'list' ? 'blue' : 'gray'}
              onClick={() => setViewMode('list')}
              size="sm"
            />
          </Tooltip>
          
          <Tooltip label="Kanban View">
            <IconButton
              icon={<FiColumns />}
              variant={viewMode === 'kanban' ? 'solid' : 'ghost'}
              colorScheme={viewMode === 'kanban' ? 'blue' : 'gray'}
              onClick={() => setViewMode('kanban')}
              size="sm"
            />
          </Tooltip>
          
          <Tooltip label="Calendar View">
            <IconButton
              icon={<FiCalendar />}
              variant={viewMode === 'calendar' ? 'solid' : 'ghost'}
              colorScheme={viewMode === 'calendar' ? 'blue' : 'gray'}
              onClick={() => setViewMode('calendar')}
              size="sm"
            />
          </Tooltip>
        </HStack>

        {/* Center - Search and filters */}
        <HStack spacing={2} flex={1} maxW="600px" mx={4}>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search todos..."
              bg={useColorModeValue('gray.50', 'gray.700')}
              borderColor={borderColor}
            />
          </InputGroup>
          
          <Popover placement="bottom-start">
            <PopoverTrigger>
              <IconButton
                icon={<FiFilter />}
                variant="outline"
                size="sm"
                aria-label="Filter"
              />
            </PopoverTrigger>
            <PopoverContent p={4}>
              <PopoverArrow />
              <PopoverBody>
                <VStack spacing={3} align="stretch">
                  <Text fontWeight="bold">Filter by Status</Text>
                  <Select
                    size="sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Todos</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </Select>
                  
                  <Divider />
                  
                  <Text fontWeight="bold">Filter by Priority</Text>
                  <CheckboxGroup>
                    <VStack align="start" spacing={2}>
                      <Checkbox value="urgent">Urgent</Checkbox>
                      <Checkbox value="high">High</Checkbox>
                      <Checkbox value="medium">Medium</Checkbox>
                      <Checkbox value="low">Low</Checkbox>
                    </VStack>
                  </CheckboxGroup>
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
          
          <Popover placement="bottom-start">
            <PopoverTrigger>
              <IconButton
                icon={<FiTrendingUp />}
                variant="outline"
                size="sm"
                aria-label="Sort"
              />
            </PopoverTrigger>
            <PopoverContent p={4}>
              <PopoverArrow />
              <PopoverBody>
                <VStack spacing={3} align="stretch">
                  <Text fontWeight="bold">Sort by</Text>
                  <Select
                    size="sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="createdAt">Date Created</option>
                    <option value="updatedAt">Date Updated</option>
                    <option value="deadline">Deadline</option>
                    <option value="priority">Priority</option>
                    <option value="title">Title</option>
                    <option value="category">Category</option>
                  </Select>
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </HStack>

        {/* Right side - Actions */}
        <HStack spacing={2}>
          {/* Selection controls */}
          {showBulkActions && (
            <HStack spacing={2}>
              <Text fontSize="sm" color="gray.600">
                {selectedCount} of {totalCount} selected
              </Text>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSelectAll}
                leftIcon={selectedCount === totalCount ? <FiCheckSquare /> : <FiSquare />}
              >
                {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
              </Button>
              
              <Popover placement="bottom-end">
                <PopoverTrigger>
                  <Button size="sm" colorScheme="blue" variant="outline">
                    Actions ({selectedCount})
                  </Button>
                </PopoverTrigger>
                <PopoverContent p={2}>
                  <PopoverArrow />
                  <PopoverBody>
                    <VStack spacing={1} align="stretch">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleBulkAction('complete')}
                        leftIcon={<FiCheck />}
                        justifyContent="start"
                      >
                        Mark Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleBulkAction('delete')}
                        leftIcon={<FiTrash2 />}
                        justifyContent="start"
                        colorScheme="red"
                      >
                        Delete Selected
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleBulkAction('priority-high')}
                        leftIcon={<FiStar />}
                        justifyContent="start"
                      >
                        Set High Priority
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleBulkAction('priority-medium')}
                        leftIcon={<FiStar />}
                        justifyContent="start"
                      >
                        Set Medium Priority
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleBulkAction('priority-low')}
                        leftIcon={<FiStar />}
                        justifyContent="start"
                      >
                        Set Low Priority
                      </Button>
                    </VStack>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowBulkActions(false)}
                leftIcon={<FiX />}
              >
                Cancel
              </Button>
            </HStack>
          )}
          
          {/* Add new todo button */}
          <Button
            colorScheme="blue"
            leftIcon={<FiPlus />}
            onClick={onAddClick}
            size="sm"
          >
            Add Todo
          </Button>
          
          {/* Bulk selection toggle */}
          {!showBulkActions && totalCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBulkActions(true)}
              leftIcon={<FiCheckSquare />}
            >
              Select
            </Button>
          )}
        </HStack>
      </HStack>
    </Box>
  );
}
