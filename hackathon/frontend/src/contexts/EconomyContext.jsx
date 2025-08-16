import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const EconomyContext = createContext();

export const useEconomy = () => {
  const context = useContext(EconomyContext);
  if (!context) {
    throw new Error('useEconomy must be used within an EconomyProvider');
  }
  return context;
};

export const EconomyProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [balance, setBalance] = useState({ coins: 0, gems: 0 });
  const [shopItems, setShopItems] = useState([]);
  const [userPurchases, setUserPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dailyRewardStatus, setDailyRewardStatus] = useState(null);

  // Load user balance and purchases
  useEffect(() => {
    if (user) {
      setBalance({
        coins: user.coins || 0,
        gems: user.gems || 0
      });
      fetchUserPurchases();
      fetchDailyRewardStatus();
    } else {
      // Set default balance when user is not available
      setBalance({
        coins: 0,
        gems: 0
      });
    }
  }, [user]);

  const fetchShopItems = useCallback(async (category = null) => {
    // Prevent multiple simultaneous calls
    if (loading) {
      console.log('🛒 Already loading shop items, skipping...');
      return;
    }
    
    try {
      setLoading(true);
      const url = category ? `/api/shop/items?category=${category}` : '/api/shop/items';
      console.log('🛒 Fetching shop items from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('🛒 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🛒 Shop items received:', data.items?.length || 0, 'items');
        setShopItems(data.items || []);
        setBalance(data.userBalance || { coins: 0, gems: 0 });
      } else {
        console.error('🛒 API error:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('🛒 Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching shop items:', error);
      toast.error('Failed to load shop items');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const fetchUserPurchases = async () => {
    try {
      const response = await fetch('/api/shop/purchases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserPurchases(data.purchases);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const purchaseItem = async (itemId, quantity = 1) => {
    try {
      setLoading(true);
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ itemId, quantity })
      });

      const data = await response.json();

      if (response.ok) {
        setBalance(data.newBalance);
        await fetchUserPurchases();
        
        // Update user context if needed
        if (updateUser && user) {
          updateUser({
            ...user,
            coins: data.newBalance.coins,
            gems: data.newBalance.gems
          });
        }

        toast.success(data.message);
        return { success: true, purchase: data.purchase };
      } else {
        toast.error(data.message);
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error purchasing item:', error);
      toast.error('Purchase failed');
      return { success: false, error: 'Purchase failed' };
    } finally {
      setLoading(false);
    }
  };

  const spendCoins = async (amount, reason = 'Purchase') => {
    try {
      if ((balance?.coins || 0) < amount) {
        throw new Error('Insufficient coins');
      }

      const response = await fetch('/api/gamification/spend-coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount, reason })
      });

      const data = await response.json();

      if (response.ok) {
        setBalance(prev => ({
          ...prev,
          coins: data.remainingCoins
        }));

        // Update user context if needed
        if (updateUser && user) {
          updateUser({
            ...user,
            coins: data.remainingCoins
          });
        }

        toast.success(`Spent ${amount} coins for ${reason}`);
        return { success: true, remainingCoins: data.remainingCoins };
      } else {
        toast.error(data.message || 'Failed to spend coins');
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error spending coins:', error);
      toast.error('Failed to spend coins');
      return { success: false, error: error.message };
    }
  };

  const useConsumableItem = async (purchaseId) => {
    try {
      const response = await fetch(`/api/shop/use/${purchaseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        await fetchUserPurchases();
        toast.success(data.message);
        return { success: true, effects: data.effects };
      } else {
        toast.error(data.message);
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error using consumable item:', error);
      toast.error('Failed to use item');
      return { success: false, error: 'Failed to use item' };
    }
  };

  const fetchDailyRewardStatus = async () => {
    try {
      const response = await fetch('/api/daily-rewards/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDailyRewardStatus(data);
      }
    } catch (error) {
      console.error('Error fetching daily reward status:', error);
    }
  };

  const claimDailyReward = async () => {
    try {
      const response = await fetch('/api/daily-rewards/claim', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setBalance(data.newBalance);
        setDailyRewardStatus(prev => ({
          ...prev,
          canClaim: false,
          alreadyClaimed: true,
          currentStreak: data.newStreak
        }));

        // Update user context
        if (updateUser && user) {
          updateUser({
            ...user,
            coins: data.newBalance.coins,
            gems: data.newBalance.gems,
            xp: data.newBalance.xp,
            dailyStreak: data.newStreak
          });
        }

        toast.success(data.message);
        
        // Show achievements if any
        if (data.achievements && data.achievements.length > 0) {
          data.achievements.forEach(achievement => {
            toast.success(`🏆 ${achievement}`, { duration: 4000 });
          });
        }

        return { success: true, reward: data.reward };
      } else {
        toast.error(data.message);
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      toast.error('Failed to claim reward');
      return { success: false, error: 'Failed to claim reward' };
    }
  };

  const spinWheel = async () => {
    try {
      const response = await fetch('/api/daily-rewards/spin-wheel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setBalance(data.newBalance);
        
        // Update user context
        if (updateUser && user) {
          updateUser({
            ...user,
            coins: data.newBalance.coins,
            gems: data.newBalance.gems,
            xp: data.newBalance.xp
          });
        }

        toast.success(`🎰 ${data.message}`);
        return { 
          success: true, 
          reward: data.reward, 
          remainingSpins: data.remainingSpins 
        };
      } else {
        toast.error(data.message);
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error spinning wheel:', error);
      toast.error('Spin failed');
      return { success: false, error: 'Spin failed' };
    }
  };

  const addCoins = (amount, reason = 'Task completion') => {
    setBalance(prev => ({
      ...prev,
      coins: (prev?.coins || 0) + amount
    }));
    
    if (amount > 0) {
      toast.success(`+${amount} coins! ${reason}`, {
        icon: '🪙',
        duration: 3000
      });
    }
  };

  const addGems = (amount, reason = 'Special reward') => {
    setBalance(prev => ({
      ...prev,
      gems: (prev?.gems || 0) + amount
    }));
    
    if (amount > 0) {
      toast.success(`+${amount} gems! ${reason}`, {
        icon: '💎',
        duration: 3000
      });
    }
  };

  const canAfford = (price, currency = 'coins') => {
    return (balance?.[currency] || 0) >= price;
  };

  const getOwnedItems = (category = null) => {
    let owned = (userPurchases || []).filter(purchase => purchase.isActive);
    if (category) {
      owned = owned.filter(purchase => purchase.item?.category === category);
    }
    return owned;
  };

  const hasItem = (itemId) => {
    if (!userPurchases || !Array.isArray(userPurchases)) {
      return false;
    }
    return userPurchases.some(purchase => 
      purchase.itemId === itemId && purchase.isActive
    );
  };

  const value = {
    balance,
    coins: balance?.coins || 0, // Backward compatibility with safety check
    gems: balance?.gems || 0, // Backward compatibility with safety check
    shopItems,
    userPurchases,
    loading,
    dailyRewardStatus,
    
    // Actions
    fetchShopItems,
    purchaseItem,
    useConsumableItem,
    claimDailyReward,
    spinWheel,
    addCoins,
    addGems,
    spendCoins,
    
    // Utilities
    canAfford,
    getOwnedItems,
    hasItem,
    
    // Refresh functions
    refreshBalance: () => {
      if (user) {
        setBalance({
          coins: user.coins || 0,
          gems: user.gems || 0
        });
      } else {
        setBalance({
          coins: 0,
          gems: 0
        });
      }
    },
    refreshPurchases: fetchUserPurchases,
    refreshDailyRewards: fetchDailyRewardStatus
  };

  return (
    <EconomyContext.Provider value={value}>
      {children}
    </EconomyContext.Provider>
  );
};
