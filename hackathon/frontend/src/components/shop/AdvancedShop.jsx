import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShoppingCart } from '../../contexts/ShoppingCartContext';
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  List,
  ListItem,
  ListIcon,
  Progress,
  Flex,
  Spacer,
  Tooltip,
  Alert,
  AlertIcon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import {
  FaCoins,
  FaGem,
  FaStar,
  FaShoppingCart,
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
  FaCrown,
  FaMagic,
  FaRocket,
  FaPalette,
  FaPaw,
  FaBolt,
  FaCog,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaImage,
  FaRedo
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { getShopItems, purchaseItem } from '../../api';
import { toast } from 'react-hot-toast';

const AdvancedShop = () => {
  const { user } = useAuth();
  const shopToast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { addToCart, removeFromCart, updateQuantity, getCartTotal, getCartItemCount, purchaseCart, loading: cartLoading } = useShoppingCart();
  
  const [shopItems, setShopItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterRarity, setFilterRarity] = useState('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cart, setCart] = useState([]);
  const [purchasing, setPurchasing] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cartItemQuantities, setCartItemQuantities] = useState({});

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
    themes: FaPalette,
    avatar_frames: FaImage,
    pets: FaPaw,
    boosters: FaBolt,
    decorations: FaStar,
    special: FaMagic
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      // Fetch real shop data from API
      const response = await fetch('/api/shop/items', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShopItems(data.items || []);
          setCategories(data.categories || []);
          setBundles(data.bundles || []);
        } else {
          console.error('Failed to fetch shop data:', data.message);
          setShopItems([]);
          setCategories([]);
          setBundles([]);
        }
      } else {
        console.error('Failed to fetch shop data:', response.status);
        setShopItems([]);
        setCategories([]);
        setBundles([]);
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
      setShopItems([]);
      setCategories([]);
      setBundles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = shopItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = filterRarity === 'all' || item.rarity === filterRarity;
    
    return matchesCategory && matchesSearch && matchesRarity;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
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

  const handleItemClick = (item) => {
    setSelectedItem(item);
    onOpen();
  };

  const handlePurchase = async (item) => {
    if (!user) {
      shopToast({
        title: 'Authentication Required',
        description: 'Please log in to make purchases',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const canAfford = item.price_gems > 0 
      ? (user.gems || 0) >= item.price_gems
      : (user.coins || 0) >= item.price_coins;

    if (!canAfford) {
      shopToast({
        title: 'Insufficient Funds',
        description: item.price_gems > 0 
          ? `You need ${item.price_gems} gems to purchase this item`
          : `You need ${item.price_coins} coins to purchase this item`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setPurchasing(true);
    try {
      // In a real app, you would call the purchase API
      // await purchaseItem(item.id, item.price_gems > 0 ? 'gems' : 'coins');
      
      shopToast({
        title: 'Purchase Successful!',
        description: `You've purchased ${item.name}!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Update user's currency
      // You would typically update this through context or API
      
    } catch (error) {
      console.error('Purchase error:', error);
      shopToast({
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

  // Shopping cart functions
  const handleAddToCart = (item) => {
    addToCart(item, 1);
    shopToast({
      title: 'Added to Cart',
      description: `${item.name} has been added to your cart`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleRemoveFromCart = (itemId) => {
    removeFromCart(itemId);
    shopToast({
      title: 'Removed from Cart',
      description: 'Item has been removed from your cart',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleUpdateQuantity = (itemId, quantity) => {
    updateQuantity(itemId, quantity);
    setCartItemQuantities(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };

  const handlePurchaseCart = async () => {
    setPurchasing(true);
    try {
      const success = await purchaseCart();
      if (success) {
        setShowCart(false);
        shopToast({
          title: 'Purchase Successful!',
          description: 'All items have been purchased and effects applied',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error purchasing cart:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handlePurchaseItem = async (item, quantity = 1) => {
    setPurchasing(true);
    try {
      const success = await purchaseItem(item, quantity);
      if (success) {
        shopToast({
          title: 'Purchase Successful!',
          description: `${item.name} has been purchased and effects applied`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error purchasing item:', error);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <Text className="mt-4 text-gray-600">Loading amazing shop items...</Text>
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
          🛒 Advanced Shop
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover amazing items, themes, pets, and more to enhance your learning experience
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
                <FaShoppingCart className="text-blue-500 text-xl" />
                <Text className="text-lg font-semibold text-gray-900">{cart.length}</Text>
                <Text className="text-sm text-gray-600">Cart</Text>
              </div>
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
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name.toLowerCase().replace(' ', '_')}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>

              {/* Rarity Filter */}
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Shop Items Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
          {sortedItems.map((item, index) => {
            const rarity = rarityConfig[item.rarity];
            const RarityIcon = rarity.icon;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => handleItemClick(item)}
                >
                  {/* Item Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl opacity-20">
                        {item.category === 'themes' && '🎨'}
                        {item.category === 'avatar_frames' && '🖼️'}
                        {item.category === 'pets' && '🐾'}
                        {item.category === 'boosters' && '⚡'}
                        {item.category === 'decorations' && '✨'}
                        {item.category === 'special' && '💎'}
                      </div>
                    </div>
                    {item.is_featured && (
                      <div className="absolute top-2 right-2">
                        <Badge colorScheme="red" className="animate-pulse">
                          <FaStar className="mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardBody>
                    {/* Item Info */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
                        <Badge 
                          colorScheme={rarity.color}
                          className="flex items-center space-x-1"
                        >
                          <RarityIcon className="text-xs" />
                          <span>{item.rarity}</span>
                        </Badge>
                      </div>
                      <Text className="text-sm text-gray-600 mb-3">{item.description}</Text>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {item.price_gems > 0 ? (
                          <>
                            <FaGem className="text-purple-500" />
                            <Text className="font-bold text-purple-600">{item.price_gems}</Text>
                          </>
                        ) : (
                          <>
                            <FaCoins className="text-yellow-500" />
                            <Text className="font-bold text-yellow-600">{item.price_coins}</Text>
                          </>
                        )}
                      </div>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                      >
                        <FaShoppingCart className="mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </Grid>
      </motion.div>

      {/* Item Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="flex items-center">
            {selectedItem && (
              <>
                <div className="mr-3 text-2xl">
                  {selectedItem.category === 'themes' && '🎨'}
                  {selectedItem.category === 'avatar_frames' && '🖼️'}
                  {selectedItem.category === 'pets' && '🐾'}
                  {selectedItem.category === 'boosters' && '⚡'}
                  {selectedItem.category === 'decorations' && '✨'}
                  {selectedItem.category === 'special' && '💎'}
                </div>
                {selectedItem.name}
              </>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody className="pb-6">
            {selectedItem && (
              <div className="space-y-6">
                {/* Item Preview */}
                <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl opacity-20">
                      {selectedItem.category === 'themes' && '🎨'}
                      {selectedItem.category === 'avatar_frames' && '🖼️'}
                      {selectedItem.category === 'pets' && '🐾'}
                      {selectedItem.category === 'boosters' && '⚡'}
                      {selectedItem.category === 'decorations' && '✨'}
                      {selectedItem.category === 'special' && '💎'}
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

                {/* Item Details */}
                <div>
                  <Text className="text-lg font-semibold mb-2">Description</Text>
                  <Text className="text-gray-600">{selectedItem.description}</Text>
                </div>

                {/* Price and Purchase */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {selectedItem.price_gems > 0 ? (
                      <div className="flex items-center space-x-2">
                        <FaGem className="text-purple-500 text-2xl" />
                        <div>
                          <Text className="text-2xl font-bold text-purple-600">{selectedItem.price_gems}</Text>
                          <Text className="text-sm text-gray-600">Gems</Text>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <FaCoins className="text-yellow-500 text-2xl" />
                        <div>
                          <Text className="text-2xl font-bold text-yellow-600">{selectedItem.price_coins}</Text>
                          <Text className="text-sm text-gray-600">Coins</Text>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    colorScheme="green"
                    size="lg"
                    onClick={() => handlePurchase(selectedItem)}
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

      {/* Shopping Cart Modal */}
      <Modal isOpen={showCart} onClose={() => setShowCart(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="flex items-center">
            <FaShoppingCart className="mr-3" />
            Shopping Cart ({getCartItemCount()} items)
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody className="pb-6">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <FaShoppingCart className="text-4xl text-gray-300 mx-auto mb-4" />
                <Text className="text-gray-500">Your cart is empty</Text>
                <Text className="text-sm text-gray-400">Add some items to get started!</Text>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cart Items */}
                {cart.map((item) => (
                  <Card key={item.id} className="border border-gray-200">
                    <CardBody className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Image
                            src={item.image_url || '/shop/placeholder.png'}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                            fallbackSrc="/shop/placeholder.png"
                          />
                          <div>
                            <Text className="font-semibold">{item.name}</Text>
                            <Text className="text-sm text-gray-600">{item.description}</Text>
                            <div className="flex items-center space-x-2 mt-2">
                              {item.price_gems > 0 ? (
                                <Badge colorScheme="purple" className="flex items-center">
                                  <FaGem className="mr-1" />
                                  {item.price_gems * item.quantity}
                                </Badge>
                              ) : (
                                <Badge colorScheme="yellow" className="flex items-center">
                                  <FaCoins className="mr-1" />
                                  {item.price_coins * item.quantity}
                                </Badge>
                              )}
                              <Badge colorScheme={rarityConfig[item.rarity]?.color || 'gray'}>
                                {item.rarity}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {/* Quantity Control */}
                          <NumberInput
                            value={item.quantity}
                            min={1}
                            max={99}
                            onChange={(value) => handleUpdateQuantity(item.id, parseInt(value))}
                            size="sm"
                            className="w-20"
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          
                          {/* Remove Button */}
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => handleRemoveFromCart(item.id)}
                          >
                            <FaTimesCircle />
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
                
                {/* Cart Total */}
                <Card className="bg-gray-50">
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between">
                      <Text className="font-semibold">Total:</Text>
                      <div className="flex items-center space-x-4">
                        {getCartTotal().coins > 0 && (
                          <Badge colorScheme="yellow" className="flex items-center">
                            <FaCoins className="mr-1" />
                            {getCartTotal().coins} Coins
                          </Badge>
                        )}
                        {getCartTotal().gems > 0 && (
                          <Badge colorScheme="purple" className="flex items-center">
                            <FaGem className="mr-1" />
                            {getCartTotal().gems} Gems
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
                
                {/* Purchase Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setShowCart(false)}
                    variant="outline"
                    flex={1}
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    onClick={handlePurchaseCart}
                    colorScheme="green"
                    flex={1}
                    isLoading={purchasing}
                    loadingText="Purchasing..."
                  >
                    Purchase All ({getCartItemCount()} items)
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

export default AdvancedShop; 