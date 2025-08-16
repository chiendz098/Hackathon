import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Grid,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Text,
  Button,
  Badge,
  VStack,
  HStack,
  Image,
  Icon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Spacer,
  Tooltip,
  Alert,
  AlertIcon,
  Avatar,
  AvatarBadge,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import {
  FaCrown,
  FaStar,
  FaGem,
  FaCoins,
  FaHeart,
  FaEye,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaFilter,
  FaSearch,
  FaSort,
  FaGift,
  FaMagic,
  FaStar,
  FaPalette,
  FaImage,
  FaTrophy,
  FaMedal,
  FaAward,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaPlus,
  FaMinus,
  FaCog,
  FaInfoCircle,
  FaShoppingCart,
  FaEquip,
  FaUnequip
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const ProfileDecorations = () => {
  const { user } = useAuth();
  const decorationToast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [decorations, setDecorations] = useState([]);
  const [userDecorations, setUserDecorations] = useState([]);
  const [equippedDecorations, setEquippedDecorations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDecoration, setSelectedDecoration] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterRarity, setFilterRarity] = useState('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [equipping, setEquipping] = useState(false);

  // Rarity colors and icons
  const rarityConfig = {
    common: { color: 'gray', icon: FaStar, bg: 'gray.100', textColor: 'gray.800' },
    rare: { color: 'blue', icon: FaStar, bg: 'blue.100', textColor: 'blue.800' },
    epic: { color: 'purple', icon: FaStar, bg: 'purple.100', textColor: 'purple.800' },
    legendary: { color: 'orange', icon: FaCrown, bg: 'orange.100', textColor: 'orange.800' },
    mythic: { color: 'red', icon: FaCrown, bg: 'red.100', textColor: 'red.800' }
  };

  // Category icons
  const categoryIcons = {
    frames: FaImage,
    banners: FaPalette,
    badges: FaMedal,
    effects: FaStar,
    titles: FaAward,
    backgrounds: FaImage,
    animations: FaMagic
  };

  useEffect(() => {
    fetchDecorations();
  }, []);

  const fetchDecorations = async () => {
    try {
      setLoading(true);
      // Fetch real decorations data from API
      const response = await fetch('/api/decorations/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDecorations(data.decorations || []);
        } else {
          console.error('Failed to fetch decorations:', data.message);
          setDecorations([]);
        }
      } else {
        console.error('Failed to fetch decorations:', response.status);
        setDecorations([]);
      }
    } catch (error) {
      console.error('Error fetching decorations:', error);
      setDecorations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDecorations = decorations.filter(decoration => {
    const matchesCategory = activeCategory === 'all' || decoration.category === activeCategory;
    const matchesSearch = decoration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         decoration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = filterRarity === 'all' || decoration.rarity === filterRarity;
    
    return matchesCategory && matchesSearch && matchesRarity;
  });

  const sortedDecorations = [...filteredDecorations].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return a.price_coins - b.price_coins;
      case 'price_high':
        return b.price_coins - a.price_coins;
      case 'rarity':
        const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleDecorationClick = (decoration) => {
    setSelectedDecoration(decoration);
    onOpen();
  };

  const handlePurchase = async (decoration) => {
    if (!user) {
      decorationToast({
        title: 'Authentication Required',
        description: 'Please log in to make purchases',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const canAfford = decoration.price_gems > 0 
      ? (user.gems || 0) >= decoration.price_gems
      : (user.coins || 0) >= decoration.price_coins;

    if (!canAfford) {
      decorationToast({
        title: 'Insufficient Funds',
        description: decoration.price_gems > 0 
          ? `You need ${decoration.price_gems} gems to purchase this decoration`
          : `You need ${decoration.price_coins} coins to purchase this decoration`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setPurchasing(true);
    try {
      // In a real app, you would call the purchase API
      // await purchaseDecoration(decoration.id, decoration.price_gems > 0 ? 'gems' : 'coins');
      
      decorationToast({
        title: 'Purchase Successful!',
        description: `You've purchased ${decoration.name}!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Add to user decorations
      setUserDecorations(prev => [...prev, { ...decoration, is_equipped: false }]);
      
    } catch (error) {
      console.error('Purchase error:', error);
      decorationToast({
        title: 'Purchase Failed',
        description: 'There was an error processing your purchase',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setPurchasing(false);
      onClose();
    }
  };

  const handleEquip = async (decoration) => {
    setEquipping(true);
    try {
      // In a real app, you would call the equip API
      // await equipDecoration(decoration.id, decoration.type);
      
      decorationToast({
        title: 'Decoration Equipped!',
        description: `${decoration.name} is now active on your profile!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Update equipped status
      setUserDecorations(prev => 
        prev.map(d => ({
          ...d,
          is_equipped: d.id === decoration.id ? true : d.is_equipped
        }))
      );
      
    } catch (error) {
      console.error('Equip error:', error);
      decorationToast({
        title: 'Equip Failed',
        description: 'There was an error equipping the decoration',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setEquipping(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <Text className="mt-4 text-gray-600">Loading beautiful decorations...</Text>
        </div>
      </Box>
    );
  }

  return (
    <Box className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 mb-4">
          ✨ Profile Decorations
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Customize your profile with beautiful animated decorations, frames, and effects
        </p>
      </motion.div>

      {/* User Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="bg-white shadow-lg">
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <FaCoins className="text-yellow-500 text-2xl" />
                  <div>
                    <Text className="text-2xl font-bold text-gray-900">{user?.coins || 0}</Text>
                    <Text className="text-sm text-gray-600">Coins</Text>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FaGem className="text-purple-500 text-2xl" />
                  <div>
                    <Text className="text-2xl font-bold text-gray-900">{user?.gems || 0}</Text>
                    <Text className="text-sm text-gray-600">Gems</Text>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FaStar className="text-blue-500 text-xl" />
                <Text className="text-lg font-semibold text-gray-900">{userDecorations.length}</Text>
                <Text className="text-sm text-gray-600">Decorations</Text>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Category Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="bg-white shadow-lg">
          <CardBody>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeCategory === 'all'
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>🌟</span>
                <span>All</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.category}
                  onClick={() => setActiveCategory(category.category)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeCategory === category.category
                      ? 'bg-purple-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.category}</span>
                  <Badge colorScheme="purple" className="ml-1">{category.count}</Badge>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="bg-white shadow-lg">
          <CardBody>
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search decorations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Rarity Filter */}
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Rarities</option>
                {Object.keys(rarityConfig).map(rarity => (
                  <option key={rarity} value={rarity}>
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rarity">Sort by Rarity</option>
              </select>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Decorations Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
          {sortedDecorations.map((decoration, index) => {
            const rarity = rarityConfig[decoration.rarity];
            const RarityIcon = rarity.icon;
            const CategoryIcon = categoryIcons[decoration.category];
            
            return (
              <motion.div
                key={decoration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => handleDecorationClick(decoration)}
                >
                  {/* Decoration Preview */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl animate-pulse">
                        {decoration.category === 'frames' && '🖼️'}
                        {decoration.category === 'banners' && '🎨'}
                        {decoration.category === 'badges' && '🏅'}
                        {decoration.category === 'effects' && '✨'}
                        {decoration.category === 'titles' && '👑'}
                        {decoration.category === 'backgrounds' && '🖼️'}
                        {decoration.category === 'animations' && '🎭'}
                      </div>
                    </div>
                    {decoration.is_featured && (
                      <div className="absolute top-2 left-2">
                        <Badge colorScheme="red" className="animate-pulse">
                          <FaStar className="mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge colorScheme="purple">
                        <CategoryIcon className="mr-1" />
                        {decoration.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge 
                        colorScheme={rarity.color}
                        className="flex items-center space-x-1"
                      >
                        <RarityIcon className="text-xs" />
                        <span>{decoration.rarity}</span>
                      </Badge>
                    </div>
                  </div>

                  <CardBody>
                    {/* Decoration Info */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <Text className="text-lg font-bold text-gray-900">{decoration.name}</Text>
                      </div>
                      <Text className="text-sm text-gray-600 mb-3">{decoration.description}</Text>
                      
                      {/* Effects Preview */}
                      {decoration.effects && decoration.effects.features && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {decoration.effects.features.slice(0, 3).map((feature, idx) => (
                            <Badge key={idx} colorScheme="blue" size="sm">
                              {feature.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                          {decoration.effects.features.length > 3 && (
                            <Badge colorScheme="gray" size="sm">
                              +{decoration.effects.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {decoration.price_gems > 0 ? (
                          <>
                            <FaGem className="text-purple-500" />
                            <Text className="font-bold text-purple-600">{decoration.price_gems}</Text>
                          </>
                        ) : (
                          <>
                            <FaCoins className="text-yellow-500" />
                            <Text className="font-bold text-yellow-600">{decoration.price_coins}</Text>
                          </>
                        )}
                      </div>
                      <Button
                        size="sm"
                        colorScheme="purple"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchase(decoration);
                        }}
                      >
                        <FaShoppingCart className="mr-1" />
                        Purchase
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </Grid>
      </motion.div>

      {/* Decoration Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="flex items-center">
            {selectedDecoration && (
              <>
                <div className="mr-3 text-2xl">
                  {selectedDecoration.category === 'frames' && '🖼️'}
                  {selectedDecoration.category === 'banners' && '🎨'}
                  {selectedDecoration.category === 'badges' && '🏅'}
                  {selectedDecoration.category === 'effects' && '✨'}
                  {selectedDecoration.category === 'titles' && '👑'}
                  {selectedDecoration.category === 'backgrounds' && '🖼️'}
                  {selectedDecoration.category === 'animations' && '🎭'}
                </div>
                {selectedDecoration.name}
              </>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody className="pb-6">
            {selectedDecoration && (
              <div className="space-y-6">
                {/* Decoration Preview */}
                <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl animate-pulse">
                      {selectedDecoration.category === 'frames' && '🖼️'}
                      {selectedDecoration.category === 'banners' && '🎨'}
                      {selectedDecoration.category === 'badges' && '🏅'}
                      {selectedDecoration.category === 'effects' && '✨'}
                      {selectedDecoration.category === 'titles' && '👑'}
                      {selectedDecoration.category === 'backgrounds' && '🖼️'}
                      {selectedDecoration.category === 'animations' && '🎭'}
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4 flex space-x-2">
                    <Button size="sm" variant="outline">
                      <FaPlay className="mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline">
                      <FaVolumeUp className="mr-1" />
                    </Button>
                  </div>
                </div>

                {/* Decoration Details */}
                <div>
                  <Text className="text-lg font-semibold mb-2">Description</Text>
                  <Text className="text-gray-600">{selectedDecoration.description}</Text>
                </div>

                {/* Effects */}
                {selectedDecoration.effects && (
                  <div>
                    <Text className="text-lg font-semibold mb-2">Effects</Text>
                    <div className="flex flex-wrap gap-2">
                      {selectedDecoration.effects.features?.map((feature, index) => (
                        <Badge key={index} colorScheme="purple">
                          {feature.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price and Actions */}
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-4">
                    {selectedDecoration.price_gems > 0 ? (
                      <div className="flex items-center space-x-2">
                        <FaGem className="text-purple-500 text-2xl" />
                        <div>
                          <Text className="text-2xl font-bold text-purple-600">{selectedDecoration.price_gems}</Text>
                          <Text className="text-sm text-gray-600">Gems</Text>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <FaCoins className="text-yellow-500 text-2xl" />
                        <div>
                          <Text className="text-2xl font-bold text-yellow-600">{selectedDecoration.price_coins}</Text>
                          <Text className="text-sm text-gray-600">Coins</Text>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    colorScheme="green"
                    size="lg"
                    onClick={() => handlePurchase(selectedDecoration)}
                    isLoading={purchasing}
                    loadingText="Purchasing..."
                  >
                    <FaShoppingCart className="mr-2" />
                    Purchase Now
                  </Button>
                </div>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProfileDecorations; 