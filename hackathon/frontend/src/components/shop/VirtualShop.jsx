import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEconomy } from '../../contexts/EconomyContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usePets } from '../../contexts/PetContext';
import toast from 'react-hot-toast';

const VirtualShop = () => {
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
    isAnimated: false,
    isCollectible: false,
    isPremium: false
  });

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

  useEffect(() => {
    // Load items khi component mount và khi đổi category
    fetchShopItems(selectedCategory === 'all' ? null : selectedCategory);
  }, [selectedCategory]); // Remove fetchShopItems from dependencies

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
          // Optionally switch theme
          changeTheme(themeId);
        }
      }
      if (item.category === 'accessory' && activePet) {
        // Auto-equip accessory to active pet
        try {
          await fetch(`/api/pets/customize/${activePet.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ accessories: [...(activePet.customization?.accessories||[]), item.metadata?.accessoryId] })
          });
          refreshPets && refreshPets();
          toast.success('Accessory equipped to your pet!');
        } catch {}
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
          // Switch active pet
          if (item.metadata?.petId) {
            toast.success(`Pet "${item.name}" selected!`);
          }
          break;

        case 'accessory':
          if (activePet && item.metadata?.accessoryId) {
            // Apply to active pet
            try {
              await fetch(`/api/pets/customize/${activePet.id}`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json', 
                  Authorization: `Bearer ${localStorage.getItem('token')}` 
                },
                body: JSON.stringify({ 
                  accessories: [...(activePet.customization?.accessories||[]), item.metadata.accessoryId] 
                })
              });
              refreshPets && refreshPets();
              toast.success(`Accessory "${item.name}" equipped!`);
            } catch (error) {
              console.error('Error equipping accessory:', error);
              toast.error('Failed to equip accessory');
            }
          }
          break;

        case 'decoration':
        case 'background':
        case 'sticker':
          // These would be applied to the UI/background
          toast.success(`${item.name} applied to your profile!`);
          break;

        case 'boost':
          // Apply boost effects
          toast.success(`Boost "${item.name}" activated!`);
          break;

        default:
          toast.success(`${item.name} used!`);
      }
    } catch (error) {
      console.error('Error using item:', error);
      toast.error('Failed to use item');
    }
  };

  // Enhanced rarity colors with new rarities
  const getRarityColor = (rarity) => {
    const colors = {
      common: 'border-gray-300 bg-gray-50',
      rare: 'border-blue-300 bg-blue-50',
      epic: 'border-purple-300 bg-purple-50',
      legendary: 'border-yellow-300 bg-yellow-50',
      mythical: 'border-red-300 bg-red-50',
      exclusive: 'border-indigo-300 bg-indigo-50'
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

  // Enhanced filtering
  const filteredItems = shopItems
    .filter(item => {
      if (filters.rarity !== 'all' && item.rarity !== filters.rarity) return false;
      if (filters.isAnimated && !item.isAnimated) return false;
      if (filters.isCollectible && !item.isCollectible) return false;
      if (filters.isPremium && !item.isPremium) return false;
      return true;
    });

  // Get enhanced badges for items
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
    <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🛍️ Enhanced Virtual Shop
          </motion.h1>
        <p className="text-lg text-gray-600 mb-6">Purchase themes, pets, and decorations with enhanced features!</p>
          
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

          {/* Content */}
          <div className="p-6">
        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category.id
                  ? `${category.color} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.icon} {category.name}
            </motion.button>
          ))}
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filters:</span>
            
            <select
              value={filters.rarity}
              onChange={(e) => setFilters({...filters, rarity: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
              <option value="mythical">Mythical</option>
              <option value="exclusive">Exclusive</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAnimated"
                checked={filters.isAnimated}
                onChange={(e) => setFilters({...filters, isAnimated: e.target.checked})}
                className="w-4 h-4"
              />
              <label htmlFor="isAnimated" className="text-sm">Animated Only</label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCollectible"
                checked={filters.isCollectible}
                onChange={(e) => setFilters({...filters, isCollectible: e.target.checked})}
                className="w-4 h-4"
              />
              <label htmlFor="isCollectible" className="text-sm">Collectible Only</label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPremium"
                checked={filters.isPremium}
                onChange={(e) => setFilters({...filters, isPremium: e.target.checked})}
                className="w-4 h-4"
              />
              <label htmlFor="isPremium" className="text-sm">Premium Only</label>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            layout
          >
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`bg-white rounded-xl p-4 border-2 ${getRarityColor(item.rarity)} ${getRarityGlow(item.rarity)} cursor-pointer transition-all hover:scale-105`}
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Item Icon/Preview */}
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{item.icon}</div>
                    <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{item.rarity}</p>
                  </div>

                  {/* Enhanced Badges */}
                  <div className="flex flex-wrap gap-1 mb-3 justify-center">
                    {getItemBadges(item).slice(0, 3).map((badge, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
                      >
                        {badge.text}
                      </span>
                    ))}
                  </div>

                  {/* Price */}
                  <div className="flex justify-center items-center gap-2 mb-3">
                    <span className="font-bold text-lg">
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
          </motion.div>
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
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
                    <span className="text-2xl font-bold">
                      {selectedItem.currency === 'coins' ? '🪙' : '💎'} {selectedItem.price}
                    </span>
                  </div>

                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${
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

export default VirtualShop;
