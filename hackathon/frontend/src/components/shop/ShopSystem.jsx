import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Box, 
  Grid, 
  Card, 
  CardBody, 
  CardFooter, 
  Image, 
  Text, 
  Button, 
  Badge, 
  VStack, 
  HStack, 
  Divider,
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
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { 
  FaCoins, 
  FaGem, 
  FaShoppingCart, 
  FaEye, 
  FaHeart,
  FaPalette,
  FaPaw,
  FaStar,
  FaCrown
} from 'react-icons/fa';

// Shop items data
const SHOP_ITEMS = {
  pets: [
    {
      id: 'cat_rare',
      name: 'Mèo Quý Hiếm',
      type: 'pet',
      category: 'pets',
      price: 500,
      currency: 'coins',
      rarity: 'rare',
      image: '🐱',
      description: 'Mèo quý hiếm với khả năng đặc biệt',
      stats: { happiness: 120, energy: 110, intelligence: 90 },
      unlockLevel: 5
    },
    {
      id: 'dog_legendary',
      name: 'Chó Huyền Thoại',
      type: 'pet',
      category: 'pets',
      price: 1000,
      currency: 'coins',
      rarity: 'legendary',
      image: '🐕',
      description: 'Chó huyền thoại với sức mạnh phi thường',
      stats: { happiness: 150, energy: 140, intelligence: 120 },
      unlockLevel: 10
    },
    {
      id: 'dragon_mythic',
      name: 'Rồng Thần Thoại',
      type: 'pet',
      category: 'pets',
      price: 2500,
      currency: 'gems',
      rarity: 'mythic',
      image: '🐉',
      description: 'Rồng thần thoại với sức mạnh vô song',
      stats: { happiness: 200, energy: 180, intelligence: 150 },
      unlockLevel: 20
    }
  ],
  themes: [
    {
      id: 'dark_theme',
      name: 'Dark Theme',
      type: 'theme',
      category: 'themes',
      price: 200,
      currency: 'coins',
      rarity: 'common',
      image: '🌙',
      description: 'Giao diện tối với thiết kế hiện đại',
      preview: 'dark',
      unlockLevel: 1
    },
    {
      id: 'neon_theme',
      name: 'Neon Theme',
      type: 'theme',
      category: 'themes',
      price: 400,
      currency: 'coins',
      rarity: 'rare',
      image: '✨',
      description: 'Giao diện neon với màu sắc rực rỡ',
      preview: 'neon',
      unlockLevel: 3
    },
    {
      id: 'nature_theme',
      name: 'Nature Theme',
      type: 'theme',
      category: 'themes',
      price: 600,
      currency: 'coins',
      rarity: 'epic',
      image: '🌿',
      description: 'Giao diện thiên nhiên với họa tiết organic',
      preview: 'nature',
      unlockLevel: 5
    }
  ],
  decorations: [
    {
      id: 'golden_frame',
      name: 'Khung Vàng',
      type: 'decoration',
      category: 'decorations',
      price: 150,
      currency: 'coins',
      rarity: 'common',
      image: '🖼️',
      description: 'Khung vàng để trang trí profile',
      slot: 'frame',
      unlockLevel: 1
    },
    {
      id: 'crown_badge',
      name: 'Huy Hiệu Vương Miện',
      type: 'decoration',
      category: 'decorations',
      price: 300,
      currency: 'coins',
      rarity: 'rare',
      image: '👑',
      description: 'Huy hiệu vương miện cho người xuất sắc',
      slot: 'badge',
      unlockLevel: 5
    },
    {
      id: 'rainbow_aura',
      name: 'Hào Quang Cầu Vồng',
      type: 'decoration',
      category: 'decorations',
      price: 800,
      currency: 'gems',
      rarity: 'epic',
      image: '🌈',
      description: 'Hào quang cầu vồng với hiệu ứng đẹp mắt',
      slot: 'aura',
      unlockLevel: 8
    }
  ]
};

const RARITY_COLORS = {
  common: 'gray',
  rare: 'blue',
  epic: 'purple',
  legendary: 'orange',
  mythic: 'red'
};

const RARITY_NAMES = {
  common: 'Thường',
  rare: 'Hiếm',
  epic: 'Hiếm',
  legendary: 'Huyền Thoại',
  mythic: 'Thần Thoại'
};

export default function ShopSystem() {
  const [userCoins, setUserCoins] = useState(0);
  const [userGems, setUserGems] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [cart, setCart] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('pets');
  const [selectedItem, setSelectedItem] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    // Load user data
    loadUserData();
    loadOwnedItems();
  }, []);

  const loadUserData = async () => {
    try {
      // Fetch real user data from API
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUserCoins(userData.coins || 0);
        setUserGems(userData.gems || 0);
        setUserLevel(userData.level || 1);
      } else {
        console.error('Failed to fetch user data:', response.status);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadOwnedItems = async () => {
    try {
      // Fetch real owned items from API
      const response = await fetch('/api/shop/purchases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const ownedItemIds = data.purchases?.map(purchase => purchase.itemId) || [];
        setOwnedItems(ownedItemIds);
      } else {
        console.error('Failed to fetch owned items:', response.status);
        setOwnedItems([]);
      }
    } catch (error) {
      console.error('Error loading owned items:', error);
      setOwnedItems([]);
    }
  };

  const addToCart = (item) => {
    if (cart.find(cartItem => cartItem.id === item.id)) {
      toast({
        title: 'Đã có trong giỏ hàng',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    setCart([...cart, item]);
    toast({
      title: 'Đã thêm vào giỏ hàng',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const canAfford = (item) => {
    if (item.currency === 'coins') {
      return userCoins >= item.price;
    } else if (item.currency === 'gems') {
      return userGems >= item.price;
    }
    return false;
  };

  const canUnlock = (item) => {
    return userLevel >= item.unlockLevel;
  };

  const purchaseItem = async (item) => {
    if (!canAfford(item)) {
      toast({
        title: 'Không đủ tiền',
        description: `Bạn cần ${item.price} ${item.currency === 'coins' ? 'coins' : 'gems'}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!canUnlock(item)) {
      toast({
        title: 'Chưa đủ level',
        description: `Bạn cần level ${item.unlockLevel} để mở khóa item này`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Real API call to purchase item
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          itemId: item.id,
          quantity: 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update user balance from API response
        setUserCoins(data.newBalance?.coins || userCoins);
        setUserGems(data.newBalance?.gems || userGems);
        
        // Add item to owned items
        setOwnedItems([...ownedItems, item.id]);
        
        // Remove from cart
        setCart(cart.filter(cartItem => cartItem.id !== item.id));
        
        toast({
          title: 'Mua thành công!',
          description: `Bạn đã sở hữu ${item.name}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Lỗi mua hàng',
          description: errorData.message || 'Vui lòng thử lại sau',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: 'Lỗi mua hàng',
        description: 'Vui lòng thử lại sau',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const purchaseCart = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Giỏ hàng trống',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    let totalCoins = 0;
    let totalGems = 0;

    cart.forEach(item => {
      if (item.currency === 'coins') {
        totalCoins += item.price;
      } else {
        totalGems += item.price;
      }
    });

    if (totalCoins > userCoins || totalGems > userGems) {
      toast({
        title: 'Không đủ tiền',
        description: 'Vui lòng kiểm tra lại số dư',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Real API call for bulk purchase
      const response = await fetch('/api/shop/purchase-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            itemId: item.id,
            quantity: 1
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update user balance from API response
        setUserCoins(data.newBalance?.coins || userCoins);
        setUserGems(data.newBalance?.gems || userGems);
        
        // Add items to owned items
        const newOwnedItems = cart.map(item => item.id);
        setOwnedItems([...ownedItems, ...newOwnedItems]);
        
        // Clear cart
        setCart([]);
        
        toast({
          title: 'Mua hàng thành công!',
          description: `Đã mua ${cart.length} items`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Lỗi mua hàng',
          description: errorData.message || 'Vui lòng thử lại sau',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Bulk purchase error:', error);
      toast({
        title: 'Lỗi mua hàng',
        description: 'Vui lòng thử lại sau',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openItemDetail = (item) => {
    setSelectedItem(item);
    onOpen();
  };

  const isOwned = (itemId) => {
    return ownedItems.includes(itemId);
  };

  const renderShopItem = (item) => (
    <Card 
      key={item.id} 
      maxW="sm" 
      variant="outline"
      _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
      transition="all 0.2s"
    >
      <CardBody>
        <Box textAlign="center" mb={4}>
          <Text fontSize="4xl" mb={2}>{item.image}</Text>
          <Badge colorScheme={RARITY_COLORS[item.rarity]} mb={2}>
            {RARITY_NAMES[item.rarity]}
          </Badge>
          <Text fontSize="lg" fontWeight="bold" mb={2}>{item.name}</Text>
          <Text fontSize="sm" color="gray.600" mb={3}>{item.description}</Text>
          
          {item.stats && (
            <VStack spacing={1} align="start" mb={3}>
              {Object.entries(item.stats).map(([stat, value]) => (
                <HStack key={stat} spacing={2}>
                  <Text fontSize="xs" color="gray.500" textTransform="capitalize">
                    {stat}:
                  </Text>
                  <Text fontSize="xs" fontWeight="bold">{value}</Text>
                </HStack>
              ))}
            </VStack>
          )}
        </Box>
      </CardBody>

      <CardFooter>
        <VStack spacing={3} w="full">
          <HStack spacing={2} w="full" justify="center">
            <Text fontSize="sm" color="gray.600">Level {item.unlockLevel}</Text>
            <Text fontSize="sm" color="gray.600">•</Text>
            <HStack spacing={1}>
              <Text fontSize="sm" fontWeight="bold">{item.price}</Text>
              {item.currency === 'coins' ? <FaCoins color="gold" /> : <FaGem color="blue" />}
            </HStack>
          </HStack>
          
          <HStack spacing={2} w="full">
            <Tooltip label="Xem chi tiết">
              <IconButton
                icon={<FaEye />}
                size="sm"
                variant="outline"
                onClick={() => openItemDetail(item)}
                flex={1}
              />
            </Tooltip>
            
            {isOwned(item.id) ? (
              <Button size="sm" colorScheme="green" flex={2} isDisabled>
                Đã sở hữu
              </Button>
            ) : (
              <>
                {!canUnlock(item) ? (
                  <Button size="sm" colorScheme="gray" flex={2} isDisabled>
                    Level {item.unlockLevel}
                  </Button>
                ) : !canAfford(item) ? (
                  <Button size="sm" colorScheme="red" flex={2} isDisabled>
                    Không đủ tiền
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    colorScheme="blue" 
                    flex={2}
                    onClick={() => addToCart(item)}
                  >
                    Thêm vào giỏ
                  </Button>
                )}
              </>
            )}
          </HStack>
        </VStack>
      </CardFooter>
    </Card>
  );

  return (
    <Box p={6} maxW="1200px" mx="auto">
      {/* Header */}
      <Box mb={8} textAlign="center">
        <Text fontSize="3xl" fontWeight="bold" mb={2}>🏪 Shop System</Text>
        <Text fontSize="lg" color="gray.600">Mua sắm pet, theme và decoration</Text>
      </Box>

      {/* User Stats */}
      <Card mb={6} bg="blue.50">
        <CardBody>
          <HStack spacing={8} justify="center">
            <HStack spacing={2}>
              <FaCoins color="gold" size={20} />
              <Text fontWeight="bold">{userCoins.toLocaleString()}</Text>
              <Text color="gray.600">Coins</Text>
            </HStack>
            <HStack spacing={2}>
              <FaGem color="blue" size={20} />
              <Text fontWeight="bold">{userGems}</Text>
              <Text color="gray.600">Gems</Text>
            </HStack>
            <HStack spacing={2}>
              <FaStar color="yellow" size={20} />
              <Text fontWeight="bold">Level {userLevel}</Text>
              <Text color="gray.600">Level</Text>
            </HStack>
          </HStack>
        </CardBody>
      </Card>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card mb={6} bg="orange.50" border="2px solid" borderColor="orange.200">
          <CardBody>
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">Giỏ hàng ({cart.length} items)</Text>
                <HStack spacing={4}>
                  <Text fontSize="sm">
                    Coins: {cart.filter(item => item.currency === 'coins').reduce((sum, item) => sum + item.price, 0)}
                  </Text>
                  <Text fontSize="sm">
                    Gems: {cart.filter(item => item.currency === 'gems').reduce((sum, item) => sum + item.price, 0)}
                  </Text>
                </HStack>
              </VStack>
              <HStack spacing={2}>
                <Button size="sm" variant="outline" onClick={() => setCart([])}>
                  Xóa giỏ
                </Button>
                <Button size="sm" colorScheme="green" onClick={purchaseCart}>
                  Mua tất cả
                </Button>
              </HStack>
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* Shop Tabs */}
      <Tabs value={selectedCategory} onChange={setSelectedCategory} variant="enclosed">
        <TabList mb={6}>
          <Tab value="pets">
            <HStack spacing={2}>
              <FaPaw />
              <Text>Pets</Text>
            </HStack>
          </Tab>
          <Tab value="themes">
            <HStack spacing={2}>
              <FaPalette />
              <Text>Themes</Text>
            </HStack>
          </Tab>
          <Tab value="decorations">
            <HStack spacing={2}>
              <FaCrown />
              <Text>Decorations</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="pets">
            <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
              {SHOP_ITEMS.pets.map(renderShopItem)}
            </Grid>
          </TabPanel>
          
          <TabPanel value="themes">
            <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
              {SHOP_ITEMS.themes.map(renderShopItem)}
            </Grid>
          </TabPanel>
          
          <TabPanel value="decorations">
            <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
              {SHOP_ITEMS.decorations.map(renderShopItem)}
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Item Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedItem?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedItem && (
              <VStack spacing={4} align="start">
                <Box textAlign="center" w="full">
                  <Text fontSize="6xl" mb={4}>{selectedItem.image}</Text>
                  <Badge colorScheme={RARITY_COLORS[selectedItem.rarity]} size="lg" mb={2}>
                    {RARITY_NAMES[selectedItem.rarity]}
                  </Badge>
                  <Text fontSize="lg" color="gray.600" mb={4">{selectedItem.description}</Text>
                </Box>
                
                {selectedItem.stats && (
                  <Box w="full">
                    <Text fontWeight="bold" mb={2}>Thông số:</Text>
                    <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                      {Object.entries(selectedItem.stats).map(([stat, value]) => (
                        <HStack key={stat} justify="space-between">
                          <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                            {stat}:
                          </Text>
                          <Text fontSize="sm" fontWeight="bold">{value}</Text>
                        </HStack>
                      ))}
                    </Grid>
                  </Box>
                )}
                
                <Divider />
                
                <HStack justify="space-between" w="full">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="gray.600">Yêu cầu level: {selectedItem.unlockLevel}</Text>
                    <Text fontSize="sm" color="gray.600">
                      Giá: {selectedItem.price} {selectedItem.currency === 'coins' ? 'Coins' : 'Gems'}
                    </Text>
                  </VStack>
                  
                  {!isOwned(selectedItem.id) && canUnlock(selectedItem) && canAfford(selectedItem) && (
                    <Button colorScheme="blue" onClick={() => purchaseItem(selectedItem)}>
                      Mua ngay
                    </Button>
                  )}
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
} 