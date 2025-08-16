import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Available themes
export const THEMES = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'Clean and modern design',
    colors: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#10B981',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1F2937',
      textSecondary: '#6B7280'
    },
    gradients: {
      primary: 'from-blue-500 to-purple-600',
      secondary: 'from-green-400 to-blue-500',
      accent: 'from-pink-500 to-rose-500'
    },
    animations: {
      duration: 'duration-300',
      easing: 'ease-in-out'
    }
  },
  anime: {
    id: 'anime',
    name: 'Anime',
    description: 'Vibrant anime-inspired colors',
    colors: {
      primary: '#FF6B9D',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      background: '#FFF5F8',
      surface: '#FFFFFF',
      text: '#2D3748',
      textSecondary: '#718096'
    },
    gradients: {
      primary: 'from-pink-400 to-purple-500',
      secondary: 'from-cyan-400 to-teal-500',
      accent: 'from-yellow-400 to-orange-500'
    },
    animations: {
      duration: 'duration-500',
      easing: 'ease-out'
    }
  },
  ghibli: {
    id: 'ghibli',
    name: 'Studio Ghibli',
    description: 'Soft, nature-inspired palette',
    colors: {
      primary: '#8FBC8F',
      secondary: '#DEB887',
      accent: '#F0E68C',
      background: '#F5F5DC',
      surface: '#FFFFFF',
      text: '#2F4F2F',
      textSecondary: '#696969'
    },
    gradients: {
      primary: 'from-green-400 to-emerald-500',
      secondary: 'from-yellow-300 to-amber-400',
      accent: 'from-lime-300 to-green-400'
    },
    animations: {
      duration: 'duration-700',
      easing: 'ease-in-out'
    }
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    description: 'Cyberpunk neon aesthetics',
    colors: {
      primary: '#00FFFF',
      secondary: '#FF00FF',
      accent: '#00FF00',
      background: '#0A0A0A',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC'
    },
    gradients: {
      primary: 'from-cyan-400 to-blue-500',
      secondary: 'from-purple-500 to-pink-500',
      accent: 'from-green-400 to-emerald-500'
    },
    animations: {
      duration: 'duration-300',
      easing: 'ease-in-out'
    }
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Elegant dark theme for your profile',
    colors: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#10B981',
      background: '#1A1A1A',
      surface: '#2D2D2D',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC'
    },
    gradients: {
      primary: 'from-blue-500 to-purple-600',
      secondary: 'from-green-400 to-blue-500',
      accent: 'from-pink-500 to-rose-500'
    },
    animations: {
      duration: 'duration-300',
      easing: 'ease-in-out'
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Breeze',
    description: 'Refreshing blue ocean theme',
    colors: {
      primary: '#0EA5E9',
      secondary: '#06B6D4',
      accent: '#0891B2',
      background: '#F0F9FF',
      surface: '#FFFFFF',
      text: '#0C4A6E',
      textSecondary: '#0369A1'
    },
    gradients: {
      primary: 'from-blue-400 to-cyan-500',
      secondary: 'from-cyan-400 to-blue-500',
      accent: 'from-sky-400 to-blue-500'
    },
    animations: {
      duration: 'duration-500',
      easing: 'ease-in-out'
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Warm sunset gradient theme',
    colors: {
      primary: '#F97316',
      secondary: '#EAB308',
      accent: '#F59E0B',
      background: '#FEF3C7',
      surface: '#FFFFFF',
      text: '#92400E',
      textSecondary: '#B45309'
    },
    gradients: {
      primary: 'from-orange-400 to-red-500',
      secondary: 'from-yellow-400 to-orange-500',
      accent: 'from-amber-400 to-orange-500'
    },
    animations: {
      duration: 'duration-700',
      easing: 'ease-in-out'
    }
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean minimalist design',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#999999',
      background: '#FFFFFF',
      surface: '#FAFAFA',
      text: '#000000',
      textSecondary: '#666666'
    },
    gradients: {
      primary: 'from-gray-800 to-gray-900',
      secondary: 'from-gray-400 to-gray-600',
      accent: 'from-gray-300 to-gray-500'
    },
    animations: {
      duration: 'duration-150',
      easing: 'ease-in'
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentTheme, setCurrentTheme] = useState('default');
  const [unlockedThemes, setUnlockedThemes] = useState(['default']);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load user's theme preferences
  useEffect(() => {
    if (user) {
      setCurrentTheme(user.currentTheme || 'default');
      setUnlockedThemes(user.unlockedThemes || ['default']);
    } else {
      // Load from localStorage for non-authenticated users
      const savedTheme = localStorage.getItem('selectedTheme');
      if (savedTheme && THEMES[savedTheme]) {
        setCurrentTheme(savedTheme);
      }
    }
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    const theme = THEMES[currentTheme];
    if (theme) {
      const root = document.documentElement;
      
      // Set CSS custom properties
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });

      // Set theme class on body
      document.body.className = document.body.className
        .replace(/theme-\w+/g, '')
        .concat(` theme-${currentTheme}`);

      // Save to localStorage
      localStorage.setItem('selectedTheme', currentTheme);
    }
  }, [currentTheme]);

  const changeTheme = async (themeId) => {
    if (!THEMES[themeId]) {
      console.error('Theme not found:', themeId);
      return;
    }

    if (!unlockedThemes.includes(themeId)) {
      console.error('Theme not unlocked:', themeId);
      return;
    }

    setIsTransitioning(true);
    
    // Smooth transition effect
    setTimeout(() => {
      setCurrentTheme(themeId);
      
      // Update user preference on server
      if (user) {
        updateUserTheme(themeId);
      }
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 150);
  };

  const updateUserTheme = async (themeId) => {
    try {
      const response = await fetch('/api/users/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ theme: themeId })
      });

      if (!response.ok) {
        console.error('Failed to update theme preference');
      }
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const unlockTheme = (themeId) => {
    if (!unlockedThemes.includes(themeId)) {
      setUnlockedThemes(prev => [...prev, themeId]);
    }
  };

  const getThemePreview = (themeId) => {
    const theme = THEMES[themeId];
    if (!theme) return null;

    return {
      id: themeId,
      name: theme.name,
      description: theme.description,
      primaryColor: theme.colors.primary,
      secondaryColor: theme.colors.secondary,
      gradient: theme.gradients.primary,
      isUnlocked: unlockedThemes.includes(themeId),
      isCurrent: currentTheme === themeId
    };
  };

  const getAllThemePreviews = () => {
    return Object.keys(THEMES).map(getThemePreview);
  };

  const value = {
    currentTheme,
    theme: THEMES[currentTheme],
    unlockedThemes,
    isTransitioning,
    changeTheme,
    unlockTheme,
    getThemePreview,
    getAllThemePreviews,
    availableThemes: THEMES
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={`theme-${currentTheme} ${isTransitioning ? 'theme-transitioning' : ''}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
