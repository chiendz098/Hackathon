import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEconomy } from '../contexts/EconomyContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePets } from '../contexts/PetContext';
import toast from 'react-hot-toast';

const EnhancedShop = () => {
  const { 
    balance, 
    shopItems, 
    loading, 
    fetchShopItems, 
    purchaseItem, 
    canAfford,
    hasItem 
  } = useEconomy();
  const { changeTheme, unlockedThemes } = useTheme();
  const { activePet, refreshPets } = usePets?.() || {};
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [filters, setFilters] = useState({
    rarity: 'all',
    priceRange: 'all',
    animationQuality: 'all',
    isAnimated: false,
    isCollectible: false,
    isSeasonal: false,
    isEvent: false,
    isPremium: false
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, compact

  // Enhanced categories with new types
  const categories = [
    { id: 'all', name: 'All Items', icon: '🛍️', color: 'bg-gray-500' },
    { id: 'theme', name: 'Themes', icon: '🎨', color: 'bg-purple-500' },
    { id: 'avatar', name: 'Avatars', icon: '👤', color: 'bg-blue-500' },
    { id: 'pet', name: 'Pets', icon: '🐾', color: 'bg-green-500' },
    { id: 'decoration', name: 'Decorations', icon: '✨', color: 'bg-yellow-500' },
    { id: 'background', name: 'Backgrounds', icon: '🖼️', color: 'bg-indigo-500' },
    { id: 'sticker', name: 'Stickers', icon: '🏷️', color: 'bg-pink-500' },
    { id: 'boost', name: 'Boosts', icon: '⚡', color: 'bg-orange-500' },
    { id: 'animation', name: 'Animations', icon: '🎬', color: 'bg-red-500' },
    { id: 'effect', name: 'Effects', icon: '🌟', color: 'bg-teal-500' },
    { id: 'sound', name: 'Sounds', icon: '🔊', color: 'bg-cyan-500' },
    { id: 'interactive', name: 'Interactive', icon: '🎮', color: 'bg-emerald-500' },
    { id: 'collectible', name: 'Collectibles', icon: '💎', color: 'bg-amber-500' },
    { id: 'seasonal', name: 'Seasonal', icon: '🍂', color: 'bg-rose-500' },
    { id: 'event', name: 'Event', icon: '🎉', color: 'bg-violet-500' },
    { id: 'premium', name: 'Premium', icon: '👑', color: 'bg-gold-500' }
  ];

  // Enhanced rarity colors with new rarities
  const getRarityColor = (rarity) => {
    const colors = {
      common: 'border-gray-300 bg-gray-50 text-gray-700',
      rare: 'border-blue-300 bg-blue-50 text-blue-700',
      epic: 'border-purple-300 bg-purple-50 text-purple-700',
      legendary: 'border-yellow-300 bg-yellow-50 text-yellow-700',
      mythical: 'border-red-300 bg-red-50 text-red-700',
      exclusive: 'border-indigo-300 bg-indigo-50 text-indigo-700'
    };
    return colors[rarity] || colors.common;
  };

  const getRarityGlow = (rarity) => {
    const glows = {
      common: 'shadow-sm',
      rare: 'shadow-blue-200 shadow-lg',
      epic: 'shadow-purple-200 shadow-lg',
      legendary: 'shadow-yellow-200 shadow-xl',
      mythical: 'shadow-red-200 shadow-2xl',
      exclusive: 'shadow-indigo-200 shadow-2xl'
    };
    return glows[rarity] || glows.common;
  };

  useEffect(() => {
    fetchShopItems(selectedCategory === 'all' ? null : selectedCategory);
  }, [selectedCategory, fetchShopItems]);

  const handlePurchase = async (item) => {
    if (!canAfford(item.price, item.currency)) {
      toast.error(`Insufficient ${item.currency}!`);
      return;
    }

    if (hasItem(item.id)) {
      toast.error('You already own this item!');
      return;
    }

    setPurchaseLoading(true);
    const result = await purchaseItem(item.id);
    
    if (result.success) {
      // Apply item effects immediately if applicable
      if (item.category === 'theme') {
        const themeId = item.metadata?.themeId;
        if (themeId) {
          toast.success(`Theme "${item.name}" unlocked!`);
          changeTheme(themeId);
        }
      }
      if (item.category === 'pet' && activePet) {
        refreshPets && refreshPets();
        toast.success(`Pet "${item.name}" added to your collection!`);
      }
      setSelectedItem(null);
    }
    
    setPurchaseLoading(false);
  };

  const handleUseItem = async (item) => {
    try {
      switch (item.category) {
        case 'theme':
          if (item.metadata?.themeId) {
            changeTheme(item.metadata.themeId);
            toast.success(`Theme "${item.name}" applied!`);
          }
          break;
        case 'pet':
          toast.success(`Pet "${item.name}" selected!`);
          break;
        case 'animation':
        case 'effect':
        case 'sound':
          toast.success(`${item.name} effect activated!`);
          break;
        default:
          toast.success(`${item.name} used!`);
      }
    } catch (error) {
      console.error('Error using item:', error);
      toast.error('Failed to use item');
    }
  };

  // Enhanced filtering and sorting
  const filteredAndSortedItems = shopItems
    .filter(item => {
      if (filters.rarity !== 'all' && item.rarity !== filters.rarity) return false;
      if (filters.isAnimated && !item.isAnimated) return false;
      if (filters.isCollectible && !item.isCollectible) return false;
      if (filters.isSeasonal && !item.isSeasonal) return false;
      if (filters.isEvent && !item.isEvent) return false;
      if (filters.isPremium && !item.isPremium) return false;
      
      if (filters.priceRange !== 'all') {
        const [min, max] = filters.priceRange.split('-').map(Number);
        if (max && item.price > max) return false;
        if (min && item.price < min) return false;
      }
      
      if (filters.animationQuality !== 'all' && item.animationQuality !== filters.animationQuality) return false;
      
      return true;
    })
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'rarity':
          const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4, mythical: 5, exclusive: 6 };
          aVal = rarityOrder[a.rarity] || 1;
          bVal = rarityOrder[b.rarity] || 1;
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }
      
      if (sortOrder === 'ASC') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const getItemBadges = (item) => {
    const badges = [];
    
    if (item.isAnimated) badges.push({ text: '🎬 Animated', color: 'bg-blue-100 text-blue-800' });
    if (item.isCollectible) badges.push({ text: '💎 Collectible', color: 'bg-purple-100 text-purple-800' });
    if (item.isSeasonal) badges.push({ text: `🍂 ${item.season}`, color: 'bg-green-100 text-green-800' });
    if (item.isEvent) badges.push({ text: '🎉 Event', color: 'bg-red-100 text-red-800' });
    if (item.isPremium) badges.push({ text: `👑 ${item.premiumTier}`, color: 'bg-yellow-100 text-yellow-800' });
    if (item.isBundle) badges.push({ text: '📦 Bundle', color: 'bg-indigo-100 text-indigo-800' });
    if (item.isSubscription) badges.push({ text: '🔄 Subscription', color: 'bg-pink-100 text-pink-800' });
    if (item.animationQuality && item.animationQuality !== 'medium') {
      badges.push({ text: `${item.animationQuality} Quality`, color: 'bg-teal-100 text-teal-800' });
    }
    
    return badges;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-5xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🛍️ Enhanced Shop
          </motion.h1>
          <p className="text-xl text-gray-600 mb-6">Discover amazing items with enhanced features!</p>
          
          {/* Balance Display */}
          <div className="flex justify-center gap-6 mb-6">
            <div className="bg-yellow-50 rounded-full px-6 py-3 border border-yellow-200 shadow-lg">
              <span className="text-yellow-600 font-bold text-lg">🪙 {balance.coins}</span>
            </div>
            <div className="bg-purple-50 rounded-full px-6 py-3 border border-purple-200 shadow-lg">
              <span className="text-purple-600 font-bold text-lg">💎 {balance.gems}</span>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    selectedCategory === category.id
                      ? `${category.color} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {category.icon} {category.name}
                </motion.button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                ⏹️
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                📋
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 rounded ${viewMode === 'compact' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                📱
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <select
              value={filters.rarity}
              onChange={(e) => setFilters({...filters, rarity: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
              <option value="mythical">Mythical</option>
              <option value="exclusive">Exclusive</option>
            </select>

            <select
              value={filters.priceRange}
              onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Prices</option>
              <option value="0-100">0-100</option>
              <option value="100-500">100-500</option>
              <option value="500-1000">500-1000</option>
              <option value="1000-">1000+</option>
            </select>

            <select
              value={filters.animationQuality}
              onChange={(e) => setFilters({...filters, animationQuality: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Qualities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAnimated"
                checked={filters.isAnimated}
                onChange={(e) => setFilters({...filters, isAnimated: e.target.checked})}
                className="w-4 h-4"
              />
              <label htmlFor="isAnimated" className="text-sm">Animated</label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCollectible"
                checked={filters.isCollectible}
                onChange={(e) => setFilters({...filters, isCollectible: e.target.checked})}
                className="w-4 h-4"
              />
              <label htmlFor="isCollectible" className="text-sm">Collectible</label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPremium"
                checked={filters.isPremium}
                onChange={(e) => setFilters({...filters, isPremium: e.target.checked})}
                className="w-4 h-4"
              />
              <label htmlFor="isPremium" className="text-sm">Premium</label>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="rarity">Rarity</option>
              <option value="createdAt">Newest</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              className="p-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              {sortOrder === 'ASC' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Items Display */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
            viewMode === 'list' ? 'grid-cols-1' :
            'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'
          }`}>
            <AnimatePresence>
              {filteredAndSortedItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`bg-white rounded-xl border-2 ${getRarityColor(item.rarity)} ${getRarityGlow(item.rarity)} cursor-pointer transition-all hover:scale-105 ${
                    viewMode === 'list' ? 'p-6' : 'p-4'
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Item Header */}
                  <div className={`text-center ${viewMode === 'compact' ? 'mb-2' : 'mb-4'}`}>
                    <div className={`${viewMode === 'compact' ? 'text-2xl' : 'text-4xl'} mb-2`}>
                      {item.icon}
                    </div>
                    <h3 className={`font-bold text-gray-900 ${
                      viewMode === 'compact' ? 'text-sm' : 'text-lg'
                    }`}>
                      {item.name}
                    </h3>
                    <p className={`text-sm text-gray-600 capitalize ${
                      viewMode === 'compact' ? 'text-xs' : ''
                    }`}>
                      {item.rarity}
                    </p>
                  </div>

                  {/* Enhanced Badges */}
                  {viewMode !== 'compact' && (
                    <div className="flex flex-wrap gap-1 mb-3 justify-center">
                      {getItemBadges(item).map((badge, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
                        >
                          {badge.text}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex justify-center items-center gap-2 mb-3">
                    <span className={`font-bold ${
                      viewMode === 'compact' ? 'text-sm' : 'text-lg'
                    }`}>
                      {item.currency === 'coins' ? '🪙' : '💎'} {item.price}
                    </span>
                  </div>

                  {/* Status & Actions */}
                  <div className="text-center">
                    {hasItem(item.id) ? (
                      <div className="space-y-2">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          ✅ Owned
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUseItem(item);
                          }}
                          className="w-full px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                          Use
                        </button>
                      </div>
                    ) : !canAfford(item.price, item.currency) ? (
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                        💸 Can't Afford
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        🛒 Available
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Enhanced Item Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{selectedItem.icon}</div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedItem.name}
                  </h2>
                  <p className="text-gray-600 mb-4">{selectedItem.description}</p>
                  
                  {/* Enhanced Badges */}
                  <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    {getItemBadges(selectedItem).map((badge, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}
                      >
                        {badge.text}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-center items-center gap-2 mb-4">
                    <span className="text-3xl font-bold">
                      {selectedItem.currency === 'coins' ? '🪙' : '💎'} {selectedItem.price}
                    </span>
                  </div>

                  <span className={`inline-block px-4 py-2 rounded-full text-lg font-medium capitalize ${
                    selectedItem.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                    selectedItem.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                    selectedItem.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                    selectedItem.rarity === 'mythical' ? 'bg-red-100 text-red-800' :
                    selectedItem.rarity === 'exclusive' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedItem.rarity}
                  </span>
                </div>

                {/* Enhanced Item Details */}
                {selectedItem.metadata && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-bold text-lg mb-3">Item Features</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedItem.isAnimated && (
                        <div>
                          <span className="font-medium">Animation Quality:</span> {selectedItem.animationQuality}
                        </div>
                      )}
                      {selectedItem.hasPreview && (
                        <div>
                          <span className="font-medium">Preview Type:</span> {selectedItem.previewType}
                        </div>
                      )}
                      {selectedItem.isCollectible && (
                        <div>
                          <span className="font-medium">Collection:</span> {selectedItem.collectionSet || 'N/A'}
                        </div>
                      )}
                      {selectedItem.isSeasonal && (
                        <div>
                          <span className="font-medium">Season:</span> {selectedItem.season}
                        </div>
                      )}
                      {selectedItem.isEvent && (
                        <div>
                          <span className="font-medium">Event:</span> {selectedItem.eventName}
                        </div>
                      )}
                      {selectedItem.isPremium && (
                        <div>
                          <span className="font-medium">Tier:</span> {selectedItem.premiumTier}
                        </div>
                      )}
                      {selectedItem.isBundle && (
                        <div>
                          <span className="font-medium">Bundle Discount:</span> {selectedItem.bundleDiscount}%
                        </div>
                      )}
                      {selectedItem.isSubscription && (
                        <div>
                          <span className="font-medium">Duration:</span> {selectedItem.subscriptionDuration}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  {!hasItem(selectedItem.id) && (
                    <button
                      onClick={() => handlePurchase(selectedItem)}
                      disabled={!canAfford(selectedItem.price, selectedItem.currency) || purchaseLoading}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {purchaseLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Purchasing...
                        </div>
                      ) : (
                        'Purchase'
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedShop; 