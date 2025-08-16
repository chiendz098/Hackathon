import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ShoppingCartContext = createContext();

export const useShoppingCart = () => {
  const context = useContext(ShoppingCartContext);
  if (!context) {
    throw new Error('useShoppingCart must be used within a ShoppingCartProvider');
  }
  return context;
};

export const ShoppingCartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('shoppingCart');
    if (savedCart && savedCart !== 'undefined' && savedCart !== 'null') {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        setCart([]);
        localStorage.removeItem('shoppingCart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
  }, [cart]);

  // Add item to cart
  const addToCart = (item, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        // Add new item to cart
        return [...prevCart, { ...item, quantity }];
      }
    });
    
    toast.success(`${item.name} added to cart!`);
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  // Update item quantity
  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    toast.success('Cart cleared');
  };

  // Get cart total
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.price_gems > 0 ? item.price_gems : item.price_coins;
      const currency = item.price_gems > 0 ? 'gems' : 'coins';
      return total + (price * item.quantity);
    }, { coins: 0, gems: 0 });
  };

  // Get cart item count
  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Purchase items in cart
  const purchaseCart = async () => {
    if (!user) {
      toast.error('Please log in to make purchases');
      return false;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return false;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/shop/purchase-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ items: cart })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Purchase successful!');
        clearCart();
        
        // Refresh user balance if needed
        if (data.newBalance) {
          // You can emit an event or use a callback to update user balance
          window.dispatchEvent(new CustomEvent('userBalanceUpdated', { 
            detail: data.newBalance 
          }));
        }
        
        return true;
      } else {
        toast.error(data.message || 'Purchase failed');
        return false;
      }
    } catch (error) {
      console.error('Error purchasing cart:', error);
      toast.error('Purchase failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Purchase single item
  const purchaseItem = async (item, quantity = 1) => {
    if (!user) {
      toast.error('Please log in to make purchases');
      return false;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/shop/purchase-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          itemId: item.id, 
          quantity,
          currency: item.price_gems > 0 ? 'gems' : 'coins'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${item.name} purchased successfully!`);
        
        // Apply item effects immediately
        await applyItemEffects(item);
        
        // Refresh user balance if needed
        if (data.newBalance) {
          window.dispatchEvent(new CustomEvent('userBalanceUpdated', { 
            detail: data.newBalance 
          }));
        }
        
        return true;
      } else {
        toast.error(data.message || 'Purchase failed');
        return false;
      }
    } catch (error) {
      console.error('Error purchasing item:', error);
      toast.error('Purchase failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Apply item effects after purchase
  const applyItemEffects = async (item) => {
    try {
      const response = await fetch('/api/shop/apply-item-effects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          itemId: item.id,
          effects: item.effects
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Show effect applied message
        if (data.effectsApplied) {
          const effectMessages = data.effectsApplied.map(effect => {
            switch (effect.type) {
              case 'theme':
                return `Theme "${effect.value}" unlocked!`;
              case 'xp_boost':
                return `XP boost activated for ${Math.floor(effect.duration / 60)} minutes!`;
              case 'focus_boost':
                return `Focus boost activated for ${Math.floor(effect.duration / 60)} minutes!`;
              case 'pet_happiness':
                return `Pet happiness increased by ${effect.value}!`;
              case 'luck_boost':
                return `Luck boost activated!`;
              default:
                return `Effect applied: ${effect.type}`;
            }
          });
          
          effectMessages.forEach(message => toast.success(message));
        }
      }
    } catch (error) {
      console.error('Error applying item effects:', error);
    }
  };

  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    purchaseCart,
    purchaseItem
  };

  return (
    <ShoppingCartContext.Provider value={value}>
      {children}
    </ShoppingCartContext.Provider>
  );
}; 