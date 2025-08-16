import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useEconomy } from '../../contexts/EconomyContext';
import { usePets } from '../../contexts/PetContext';
import toast from 'react-hot-toast';
import './UltimateShopSystem.css';

const UltimateShopSystem = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { balance, spendCoins, spendGems } = useEconomy();
  const { 
    petShop, 
    petAccessories, 
    petThemes, 
    petFood, 
    petToys, 
    petTraining, 
    petBonding,
    buyPet,
    buyAccessory,
    buyAccessory: buyPetAccessory
  } = usePets();
  
  const [currentView, setCurrentView] = useState('pets');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  // Shop categories
  const categories = [
    { id: 'pets', name: 'Pets', icon: '🐾', color: 'from-blue-500 to-blue-600' },
    { id: 'accessories', name: 'Accessories', icon: '🎀', color: 'from-purple-500 to-purple-600' },
    { id: 'themes', name: 'Themes', icon: '🎨', color: 'from-pink-500 to-pink-600' },
    { id: 'food', name: 'Food', icon: '🍖', color: 'from-orange-500 to-orange-600' },
    { id: 'toys', name: 'Toys', icon: '🎾', color: 'from-green-500 to-green-600' },
    { id: 'training', name: 'Training', icon: '🎓', color: 'from-indigo-500 to-indigo-600' },
    { id: 'bonding', name: 'Bonding', icon: '💕', color: 'from-red-500 to-red-600' },
    { id: 'special', name: 'Special', icon: '⭐', color: 'from-yellow-500 to-yellow-600' }
  ];
      
  // Sample shop data
  const shopData = {
    pets: [
      {
        id: 1,
        name: 'Buddy',
        species: 'dog',
        rarity: 'common',
        price: 0,
        currency: 'coins',
        description: 'A loyal companion for new users',
        image: '/pets/dog.png',
        abilities: ['loyalty_boost', 'study_motivation'],
        stats: { happiness: 80, energy: 70, intelligence: 60, loyalty: 90 }
      },
      {
        id: 2,
        name: 'Whiskers',
        species: 'cat',
        rarity: 'common',
        price: 50,
        currency: 'coins',
        description: 'A curious and intelligent feline friend',
        image: '/pets/cat.png',
        abilities: ['focus_boost', 'stress_relief'],
        stats: { happiness: 75, energy: 80, intelligence: 85, loyalty: 70 }
      },
      {
        id: 3,
        name: 'Sparkle',
        species: 'unicorn',
        rarity: 'epic',
        price: 500,
        currency: 'coins',
        description: 'A magical unicorn that brings luck and inspiration',
        image: '/pets/unicorn.png',
        abilities: ['luck_boost', 'creativity_boost', 'magic_powers'],
        stats: { happiness: 95, energy: 90, intelligence: 95, loyalty: 85 }
      },
      {
        id: 4,
        name: 'Dragon',
        species: 'dragon',
        rarity: 'legendary',
        price: 1000,
        currency: 'gems',
        description: 'A powerful dragon companion with fire abilities',
        image: '/pets/dragon.png',
        abilities: ['fire_powers', 'strength_boost', 'protection'],
        stats: { happiness: 90, energy: 95, intelligence: 90, loyalty: 95 }
      }
    ],
    accessories: [
      {
        id: 1,
        name: 'Golden Collar',
        type: 'collar',
        rarity: 'rare',
        price: 100,
        currency: 'coins',
        description: 'A beautiful golden collar for your pet',
        image: '/accessories/collar.png',
        effects: { loyalty: 10, style: 20 }
      },
      {
        id: 2,
        name: 'Magic Hat',
        type: 'hat',
        rarity: 'epic',
        price: 300,
        currency: 'coins',
        description: 'A magical hat that enhances intelligence',
        image: '/accessories/hat.png',
        effects: { intelligence: 15, magic: 25 }
      },
      {
        id: 3,
        name: 'Crystal Wings',
        type: 'wings',
        rarity: 'legendary',
        price: 1000,
        currency: 'gems',
        description: 'Beautiful crystal wings for flying pets',
        image: '/accessories/wings.png',
        effects: { energy: 30, flight: 50 }
      }
    ],
    themes: [
      {
        id: 1,
        name: 'Forest Theme',
        rarity: 'common',
        price: 50,
        currency: 'coins',
        description: 'A natural forest environment for your pet',
        image: '/themes/forest.png',
        effects: { happiness: 10, nature: 20 }
      },
      {
        id: 2,
        name: 'Space Theme',
        rarity: 'epic',
        price: 400,
        currency: 'coins',
        description: 'An out-of-this-world space environment',
        image: '/themes/space.png',
        effects: { intelligence: 20, exploration: 30 }
      },
      {
        id: 3,
        name: 'Royal Palace',
        rarity: 'legendary',
        price: 1500,
        currency: 'gems',
        description: 'A luxurious royal palace setting',
        image: '/themes/palace.png',
        effects: { loyalty: 25, luxury: 40 }
      }
    ],
    food: [
      {
        id: 1,
        name: 'Basic Kibble',
        type: 'food',
        rarity: 'common',
        price: 10,
        currency: 'coins',
        description: 'Basic pet food for daily nutrition',
        image: '/food/kibble.png',
        effects: { hunger: -20, energy: 10 }
      },
      {
        id: 2,
        name: 'Premium Feast',
        type: 'food',
        rarity: 'rare',
        price: 50,
        currency: 'coins',
        description: 'Premium food that boosts happiness',
        image: '/food/feast.png',
        effects: { hunger: -40, happiness: 20, energy: 15 }
      },
      {
        id: 3,
        name: 'Magic Elixir',
        type: 'food',
        rarity: 'epic',
        price: 200,
        currency: 'coins',
        description: 'Magical elixir with powerful effects',
        image: '/food/elixir.png',
        effects: { hunger: -60, happiness: 30, energy: 25, intelligence: 15 }
      }
    ],
    toys: [
      {
        id: 1,
        name: 'Basic Ball',
        type: 'toy',
        rarity: 'common',
        price: 15,
        currency: 'coins',
        description: 'A simple ball for playing',
        image: '/toys/ball.png',
        effects: { energy: -10, happiness: 15 }
      },
      {
        id: 2,
        name: 'Interactive Puzzle',
        type: 'toy',
        rarity: 'rare',
        price: 75,
        currency: 'coins',
        description: 'A puzzle toy that boosts intelligence',
        image: '/toys/puzzle.png',
        effects: { energy: -15, happiness: 20, intelligence: 10 }
      },
      {
        id: 3,
        name: 'Magic Wand',
        type: 'toy',
        rarity: 'epic',
        price: 250,
        currency: 'coins',
        description: 'A magical wand for special playtime',
        image: '/toys/wand.png',
        effects: { energy: -20, happiness: 30, magic: 25 }
      }
    ],
    training: [
      {
        id: 1,
        name: 'Basic Training',
        type: 'training',
        rarity: 'common',
        price: 25,
        currency: 'coins',
        description: 'Basic obedience training',
        image: '/training/basic.png',
        effects: { intelligence: 10, obedience: 15 }
      },
      {
        id: 2,
        name: 'Advanced Training',
        type: 'training',
        rarity: 'rare',
        price: 100,
        currency: 'coins',
        description: 'Advanced skills and tricks',
        image: '/training/advanced.png',
        effects: { intelligence: 20, skills: 25, obedience: 20 }
      },
      {
        id: 3,
        name: 'Master Training',
        type: 'training',
        rarity: 'epic',
        price: 400,
        currency: 'coins',
        description: 'Master-level training program',
        image: '/training/master.png',
        effects: { intelligence: 35, skills: 40, obedience: 30, leadership: 20 }
      }
    ],
    bonding: [
      {
        id: 1,
        name: 'Quality Time',
        type: 'bonding',
        rarity: 'common',
        price: 20,
        currency: 'coins',
        description: 'Spend quality time with your pet',
        image: '/bonding/time.png',
        effects: { loyalty: 15, happiness: 20 }
      },
      {
        id: 2,
        name: 'Deep Bonding',
        type: 'bonding',
        rarity: 'rare',
        price: 80,
        currency: 'coins',
        description: 'Deep emotional bonding session',
        image: '/bonding/deep.png',
        effects: { loyalty: 25, happiness: 30, trust: 20 }
      },
      {
        id: 3,
        name: 'Soul Connection',
        type: 'bonding',
        rarity: 'epic',
        price: 300,
        currency: 'coins',
        description: 'Create a deep soul connection',
        image: '/bonding/soul.png',
        effects: { loyalty: 40, happiness: 45, trust: 35, magic: 25 }
      }
    ],
    special: [
      {
        id: 1,
        name: 'Mystery Box',
        type: 'special',
        rarity: 'rare',
        price: 100,
        currency: 'coins',
        description: 'A mystery box with random rewards',
        image: '/special/mystery.png',
        effects: { random: true }
      },
      {
        id: 2,
        name: 'Lucky Charm',
        type: 'special',
        rarity: 'epic',
        price: 500,
        currency: 'coins',
        description: 'A charm that brings good luck',
        image: '/special/charm.png',
        effects: { luck: 50, happiness: 20 }
      },
      {
        id: 3,
        name: 'Wish Crystal',
        type: 'special',
        rarity: 'legendary',
        price: 2000,
        currency: 'gems',
        description: 'A crystal that grants wishes',
        image: '/special/crystal.png',
        effects: { wishes: 1, magic: 100 }
      }
    ]
  };

  // Get current category data
  const getCurrentCategoryData = () => {
    return shopData[currentView] || [];
  };

  // Filter and sort items
  const getFilteredAndSortedItems = () => {
    let items = getCurrentCategoryData();
    
    // Apply search filter
    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply rarity filter
    if (filterRarity !== 'all') {
      items = items.filter(item => item.rarity === filterRarity);
    }
    
    // Apply sorting
    items.sort((a, b) => {
    switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
      case 'price':
        return a.price - b.price;
      case 'rarity':
          const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
          return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      default:
          return 0;
    }
  });
  
    return items;
  };

  // Handle item purchase
  const handlePurchase = async (item) => {
    setSelectedItem(item);
    setShowPurchaseModal(true);
  };
  
  const confirmPurchase = async () => {
    if (!selectedItem) return;
    
    setIsLoading(true);
    try {
      let success = false;
      
      if (currentView === 'pets') {
        success = await buyPet(selectedItem.id);
      } else if (currentView === 'accessories') {
        success = await buyAccessory(selectedItem.id);
      } else {
        // Handle other item types
        success = true;
      }
      
      if (success) {
        toast.success(`${selectedItem.name} purchased successfully! 🎉`);
        setShowPurchaseModal(false);
        setShowConfirmationModal(true);
        
        // Add to cart for confirmation
        setCart(prev => [...prev, selectedItem]);
      }
    } catch (error) {
      toast.error('Purchase failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add to cart
  const addToCart = (item) => {
    setCart(prev => [...prev, item]);
    toast.success(`${item.name} added to cart! 🛒`);
  };

  // Remove from cart
  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };
  
  // Get total cart value
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      if (item.currency === 'gems') {
        return total + item.price;
      }
      return total + item.price;
    }, 0);
  };

  // Get rarity color
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
  }
  };

  // Render item card
  const renderItemCard = (item) => {
    const canAfford = item.currency === 'gems' ? balance.gems >= item.price : balance.coins >= item.price;
  
  return (
      <motion.div
        key={item.id}
        className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300"
        whileHover={{ y: -5 }}
      >
        <div className="relative">
          <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <div className="text-6xl">{item.image ? '🖼️' : '📦'}</div>
          </div>
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRarityColor(item.rarity)}`}>
              {item.rarity.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{item.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{item.description}</p>
          
          {item.effects && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">Effects:</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(item.effects).map(([key, value]) => (
                  <span key={key} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    {key}: +{value}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1">
              <span className="text-lg">{item.currency === 'gems' ? '💎' : '💰'}</span>
              <span className="font-bold text-gray-900">{item.price}</span>
            </div>
            <span className="text-sm text-gray-500 capitalize">{item.currency}</span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handlePurchase(item)}
              disabled={!canAfford || isLoading}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                canAfford
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Processing...' : canAfford ? 'Buy Now' : 'Cannot Afford'}
            </button>
            <button
              onClick={() => addToCart(item)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              title="Add to Cart"
            >
              🛒
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
        className="bg-white rounded-2xl shadow-2xl w-11/12 h-5/6 max-w-7xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🏪 Ultimate Shop System</h1>
              <p className="text-blue-100">Buy amazing items for your pets</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <span>💰 {balance.coins}</span>
                  <span>💎 {balance.gems}</span>
                </div>
              </div>
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
              >
                🛒 Cart ({cart.length})
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setCurrentView(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                  currentView === category.id
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg scale-105`
                    : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-md'
                }`}
                whileHover={{ scale: currentView === category.id ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
      >
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
              
            <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="rarity">Sort by Rarity</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full">
            {/* Main Shop Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {getFilteredAndSortedItems().map(item => renderItemCard(item))}
              </div>
              
              {getFilteredAndSortedItems().length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No items found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters</p>
                </div>
              )}
            </div>

            {/* Shopping Cart Sidebar */}
            <AnimatePresence>
              {showCart && (
      <motion.div
                  className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto"
                  initial={{ x: 300 }}
                  animate={{ x: 0 }}
                  exit={{ x: 300 }}
      >
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Shopping Cart</h3>
                    
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🛒</div>
                        <p className="text-gray-500">Your cart is empty</p>
                      </div>
        ) : (
                      <>
                        <div className="space-y-3 mb-4">
                          {cart.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                              <div className="text-2xl">{item.image ? '🖼️' : '📦'}</div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-600">{item.currency === 'gems' ? '💎' : '💰'} {item.price}</div>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-gray-900">Total:</span>
                            <span className="font-bold text-gray-900">
                              {getCartTotal()} {cart[0]?.currency === 'gems' ? '💎' : '💰'}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => {/* Handle checkout */}}
                            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Checkout
                          </button>
                        </div>
                      </>
        )}
                  </div>
      </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {/* Purchase Modal */}
          {showPurchaseModal && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Purchase</h3>
                <div className="text-center mb-6">
                  <div className="text-6xl mb-2">{selectedItem?.image ? '🖼️' : '📦'}</div>
                  <h4 className="text-lg font-bold text-gray-900">{selectedItem?.name}</h4>
                  <p className="text-sm text-gray-600">{selectedItem?.description}</p>
                  <div className="mt-3">
                    <span className="text-2xl font-bold text-gray-900">
                      {selectedItem?.currency === 'gems' ? '💎' : '💰'} {selectedItem?.price}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPurchaseModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPurchase}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Confirm Purchase'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
                )}
                
          {/* Confirmation Modal */}
          {showConfirmationModal && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl p-6 max-w-md w-full mx-4 text-center"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Purchase Successful!</h3>
                <p className="text-gray-600 mb-6">Thank you for your purchase!</p>
                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Continue Shopping
                </button>
              </motion.div>
            </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default UltimateShopSystem; 