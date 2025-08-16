import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
// import { usePets } from './PetContext';
import toast from 'react-hot-toast';

const ItemApplicationContext = createContext();

export const useItemApplication = () => {
  const context = useContext(ItemApplicationContext);
  if (!context) {
    throw new Error('useItemApplication must be used within an ItemApplicationProvider');
  }
  return context;
};

export const ItemApplicationProvider = ({ children }) => {
  const { user } = useAuth();
  const { changeTheme, unlockTheme } = useTheme();
  // const { adoptPet } = usePets();
  
  const [equippedItems, setEquippedItems] = useState({
    avatar: null,
    background: null,
    decorations: [],
    stickers: [],
    accessories: [],
    activeBoosts: []
  });

  // Load equipped items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('equippedItems');
    if (saved && saved !== 'undefined' && saved !== 'null') {
      try {
        setEquippedItems(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing equipped items:', error);
        setEquippedItems([]);
      }
    }
  }, []);

  const saveEquippedItems = (items) => {
    setEquippedItems(items);
    localStorage.setItem('equippedItems', JSON.stringify(items));
  };

  const applyItem = async (item) => {
    try {
      const { applyFunction, ...metadata } = item.metadata || {};

      switch (applyFunction) {
        case 'changeTheme':
          if (metadata.themeId) {
            unlockTheme(metadata.themeId);
            changeTheme(metadata.themeId);
            toast.success(`Theme "${item.name}" applied! 🎨`);
          }
          break;

        case 'adoptPet':
          if (metadata.species) {
            // await adoptPet(item.id, item.name);
            toast.success(`Pet "${item.name}" adopted! 🐾`);
          }
          break;

        case 'changeAvatar':
          if (metadata.avatarId) {
            const newItems = { ...equippedItems, avatar: item };
            saveEquippedItems(newItems);
            toast.success(`Avatar "${item.name}" equipped! 👤`);
          }
          break;

        case 'changeBackground':
          if (metadata.backgroundId) {
            const newItems = { ...equippedItems, background: item };
            saveEquippedItems(newItems);
            applyBackgroundEffect(metadata);
            toast.success(`Background "${item.name}" applied! 🖼️`);
          }
          break;

        case 'addDecoration':
          if (metadata.decorationId) {
            const newItems = {
              ...equippedItems,
              decorations: [...equippedItems.decorations, item]
            };
            saveEquippedItems(newItems);
            applyDecorationEffect(metadata);
            toast.success(`Decoration "${item.name}" placed! ✨`);
          }
          break;

        case 'addSticker':
          if (metadata.stickerId) {
            const newItems = {
              ...equippedItems,
              stickers: [...equippedItems.stickers, item]
            };
            saveEquippedItems(newItems);
            applyStickerEffect(metadata);
            toast.success(`Sticker "${item.name}" applied! 🏷️`);
          }
          break;

        case 'equipAccessory':
          if (metadata.accessoryId) {
            const newItems = {
              ...equippedItems,
              accessories: [...equippedItems.accessories, item]
            };
            saveEquippedItems(newItems);
            applyAccessoryEffect(metadata);
            toast.success(`Accessory "${item.name}" equipped! 💍`);
          }
          break;

        case 'activateBoost':
          if (metadata.boostId) {
            const newItems = {
              ...equippedItems,
              activeBoosts: [...equippedItems.activeBoosts, { ...item, activatedAt: Date.now() }]
            };
            saveEquippedItems(newItems);
            applyBoostEffect(metadata);
            toast.success(`Boost "${item.name}" activated! ⚡`);
            
            // Remove boost after duration
            setTimeout(() => {
              removeBoost(item.id);
            }, metadata.duration || 300000);
          }
          break;

        default:
          toast.success(`${item.name} used! 🎉`);
      }
    } catch (error) {
      console.error('Error applying item:', error);
      toast.error('Failed to apply item');
    }
  };

  const removeItem = (itemId, category) => {
    const newItems = { ...equippedItems };
    
    switch (category) {
      case 'avatar':
        newItems.avatar = null;
        break;
      case 'background':
        newItems.background = null;
        removeBackgroundEffect();
        break;
      case 'decoration':
        newItems.decorations = newItems.decorations.filter(item => item.id !== itemId);
        break;
      case 'sticker':
        newItems.stickers = newItems.stickers.filter(item => item.id !== itemId);
        break;
      case 'accessory':
        newItems.accessories = newItems.accessories.filter(item => item.id !== itemId);
        break;
      case 'boost':
        newItems.activeBoosts = newItems.activeBoosts.filter(item => item.id !== itemId);
        break;
    }
    
    saveEquippedItems(newItems);
    toast.success('Item removed!');
  };

  const removeBoost = (boostId) => {
    const newItems = {
      ...equippedItems,
      activeBoosts: equippedItems.activeBoosts.filter(item => item.id !== boostId)
    };
    saveEquippedItems(newItems);
    toast.success('Boost expired!');
  };

  // Effect application functions
  const applyBackgroundEffect = (metadata) => {
    const root = document.documentElement;
    if (metadata.effect === 'focus_boost') {
      root.style.setProperty('--focus-opacity', '1.1');
    } else if (metadata.effect === 'calm_mind') {
      root.style.setProperty('--calm-filter', 'hue-rotate(180deg)');
    } else if (metadata.effect === 'innovation_boost') {
      root.style.setProperty('--innovation-glow', '0 0 20px rgba(0, 255, 255, 0.5)');
    }
  };

  const removeBackgroundEffect = () => {
    const root = document.documentElement;
    root.style.removeProperty('--focus-opacity');
    root.style.removeProperty('--calm-filter');
    root.style.removeProperty('--innovation-glow');
  };

  const applyDecorationEffect = (metadata) => {
    if (metadata.effect === 'ambient_light') {
      document.body.classList.add('ambient-light');
    } else if (metadata.effect === 'knowledge_boost') {
      document.body.classList.add('knowledge-boost');
    } else if (metadata.effect === 'mystical_aura') {
      document.body.classList.add('mystical-aura');
    }
  };

  const applyStickerEffect = (metadata) => {
    if (metadata.effect === 'motivation_boost') {
      document.body.classList.add('motivation-boost');
    } else if (metadata.effect === 'pride_boost') {
      document.body.classList.add('pride-boost');
    } else if (metadata.effect === 'magical_trail') {
      document.body.classList.add('magical-trail');
    }
  };

  const applyAccessoryEffect = (metadata) => {
    if (metadata.effect === 'ai_assistant') {
      document.body.classList.add('ai-assistant');
    } else if (metadata.effect === 'spell_casting') {
      document.body.classList.add('spell-casting');
    } else if (metadata.effect === 'royal_authority') {
      document.body.classList.add('royal-authority');
    }
  };

  const applyBoostEffect = (metadata) => {
    if (metadata.effect === 'double_xp') {
      document.body.classList.add('double-xp');
    } else if (metadata.effect === 'enhanced_focus') {
      document.body.classList.add('enhanced-focus');
    } else if (metadata.effect === 'slow_time') {
      document.body.classList.add('slow-time');
    }
  };

  const isItemEquipped = (itemId, category) => {
    switch (category) {
      case 'avatar':
        return equippedItems.avatar?.id === itemId;
      case 'background':
        return equippedItems.background?.id === itemId;
      case 'decoration':
        return equippedItems.decorations.some(item => item.id === itemId);
      case 'sticker':
        return equippedItems.stickers.some(item => item.id === itemId);
      case 'accessory':
        return equippedItems.accessories.some(item => item.id === itemId);
      case 'boost':
        return equippedItems.activeBoosts.some(item => item.id === itemId);
      default:
        return false;
    }
  };

  const getActiveBoosts = () => {
    return equippedItems.activeBoosts.filter(boost => {
      const duration = boost.metadata?.duration || 300000;
      const activatedAt = boost.activatedAt || 0;
      return Date.now() - activatedAt < duration;
    });
  };

  return (
    <ItemApplicationContext.Provider value={{
      equippedItems,
      applyItem,
      removeItem,
      isItemEquipped,
      getActiveBoosts
    }}>
      {children}
    </ItemApplicationContext.Provider>
  );
}; 