import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
// import { useEconomy } from '../../contexts/EconomyContext';
// import { usePets } from '../../contexts/PetContext';
import { useItemApplication } from '../../contexts/ItemApplicationContext';
import toast from 'react-hot-toast';

const ThemeCustomization = ({ isOpen, onClose }) => {
  const { currentTheme, themes, changeTheme } = useTheme();
  // const { 
  //   balance, 
  //   shopItems, 
  //   loading, 
  //   fetchShopItems, 
  //   purchaseItem, 
  //   canAfford,
  //   hasItem 
  // } = useEconomy();
  // const { activePet, refreshPets } = usePets?.() || {};
  const balance = { coins: 0, gems: 0 }; // Default value
  const shopItems = []; // Default value
  const loading = false; // Default value
  const activePet = null; // Default value
  const { applyItem, isItemEquipped } = useItemApplication();
  
  const [activeTab, setActiveTab] = useState('themes');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Load shop items when component mounts
  useEffect(() => {
    if (isOpen && shopItems.length === 0) {
      console.log('🛒 Loading shop items...');
      // fetchShopItems(); // Commented out since useEconomy is disabled
    }
  }, [isOpen]); // Removed fetchShopItems from dependencies

  // Load items when category changes
  useEffect(() => {
    if (isOpen && activeTab === 'shop') {
      // Category changed, filtering existing items
    }
  }, [selectedCategory, activeTab, isOpen]); // Removed shopItems.length from dependencies

  // Safety check for shopItems
  const safeShopItems = Array.isArray(shopItems) ? shopItems : [];
  const filteredItems = selectedCategory === 'all' 
    ? safeShopItems 
    : safeShopItems.filter(item => item && item.category === selectedCategory);

  // Removed console.log statements to reduce noise

  const tabs = [
    { id: 'themes', name: 'Themes', icon: '🎨' },
    { id: 'shop', name: 'Shop', icon: '🛒' }
  ];

  const categories = [
    { id: 'all', name: 'All Items', icon: '🛍️' },
    { id: 'theme', name: 'Themes', icon: '🎨' },
    { id: 'avatar', name: 'Avatars', icon: '👤' },
    { id: 'pet', name: 'Pets', icon: '🐾' },
    { id: 'decoration', name: 'Decorations', icon: '✨' },
    { id: 'background', name: 'Backgrounds', icon: '🖼️' },
    { id: 'sticker', name: 'Stickers', icon: '🏷️' },
    { id: 'boost', name: 'Boosts', icon: '⚡' },
    { id: 'special', name: 'Accessories', icon: '💍' }
  ];

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
      if (item.category === 'theme') {
        const themeId = item.metadata?.themeId;
        if (themeId) {
          toast.success(`Theme "${item.name}" unlocked!`);
          changeTheme(themeId);
        }
      }
      if (item.category === 'accessory' && activePet) {
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
    await applyItem(item);
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'border-gray-300 bg-gray-50',
      rare: 'border-blue-300 bg-blue-50',
      epic: 'border-purple-300 bg-purple-50',
      legendary: 'border-yellow-300 bg-yellow-50'
    };
    return colors[rarity] || colors.common;
  };

  const getRarityGlow = (rarity) => {
    const glows = {
      common: 'shadow-sm',
      rare: 'shadow-blue-200 shadow-lg',
      epic: 'shadow-purple-200 shadow-lg',
      legendary: 'shadow-yellow-200 shadow-xl'
    };
    return glows[rarity] || glows.common;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">🎨 Theme Customization</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Balance */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🪙</span>
                <span className="font-bold text-lg">{balance.coins || 0}</span>
                <span className="text-gray-600">Coins</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                <span className="font-bold text-lg">{balance.gems || 0}</span>
                <span className="text-gray-600">Gems</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'themes' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Current Theme</h3>
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-lg">{currentTheme?.name || 'Default'}</h4>
                        <p className="text-gray-600">{currentTheme?.description || 'Default theme'}</p>
                      </div>
                      <div className="text-4xl">{currentTheme?.icon || '🎨'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Available Themes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {themes?.map((theme) => (
                      <motion.div
                        key={theme.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                          currentTheme?.id === theme.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => changeTheme(theme.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">{theme.icon}</div>
                          <h4 className="font-bold">{theme.name}</h4>
                          <p className="text-sm text-gray-600">{theme.description}</p>
                          {currentTheme?.id === theme.id && (
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium mt-2">
                              ✅ Active
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shop' && (
              <div className="space-y-6">
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-full font-medium transition-all ${
                        selectedCategory === category.id
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-50'
                      }`}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </button>
                  ))}
                </div>

                {/* Items Grid */}
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => (
                      <motion.div
                        key={item.id}
                        className={`bg-white rounded-xl p-4 border-2 ${getRarityColor(item.rarity)} ${getRarityGlow(item.rarity)} cursor-pointer transition-all hover:scale-105`}
                        onClick={() => setSelectedItem(item)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Item Icon/Preview */}
                        <div className="text-center mb-4">
                          <div className="text-4xl mb-2">{item.icon}</div>
                          <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">{item.rarity}</p>
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
                              className={`w-full px-3 py-2 rounded-lg transition-colors text-sm ${
                                isItemEquipped(item.id, item.category)
                                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                            >
                              {isItemEquipped(item.id, item.category) ? 'Equipped' : 'Use'}
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
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Item Detail Modal */}
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
                  className="bg-white rounded-2xl p-6 max-w-md w-full"
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
                    
                    <div className="flex justify-center items-center gap-2 mb-4">
                      <span className="text-2xl font-bold">
                        {selectedItem.currency === 'coins' ? '🪙' : '💎'} {selectedItem.price}
                      </span>
                    </div>

                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      selectedItem.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                      selectedItem.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                      selectedItem.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedItem.rarity}
                    </span>
                  </div>

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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThemeCustomization; 