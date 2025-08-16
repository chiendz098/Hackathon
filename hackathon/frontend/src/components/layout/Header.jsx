import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
// import { useEconomy } from '../../contexts/EconomyContext';
import LoadingSpinner from '../ui/LoadingSpinner';
// import ThemeCustomization from '../ui/ThemeCustomization';
import NotificationCenter from '../notifications/NotificationCenter';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, currentTheme } = useTheme();
  // const { coins, xp, level } = useEconomy();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/todo', label: 'Todo', icon: '📝' },
    { path: '/advanced-chatbot', label: 'FBot AI', icon: '🧠' },
    { path: '/gamification', label: 'Gamification', icon: '🏆' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin', icon: '⚙️' });
  }

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? currentTheme === 'neon'
              ? 'bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-cyan-500/30'
              : currentTheme === 'minimal'
                ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200'
                : 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200'
            : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 group animate-fade-in-left"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform duration-300 animate-pulse shadow-lg">
              FPT
            </div>
            <span className="text-xl font-bold gradient-text group-hover:scale-105 transition-all duration-300">
              COMPASS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 group animate-fade-in-down stagger-${index + 1} ${
                  location.pathname === item.path
                    ? 'text-blue-600 bg-blue-50 shadow-md'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span className="text-lg group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </span>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Active Indicator */}
                {location.pathname === item.path && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
                )}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4 animate-fade-in-right">
            {/* Theme Selector Button */}
            {/* <motion.button
              onClick={() => setShowThemeSelector(true)}
              className={`p-2 rounded-lg transition-all duration-300 ${
                currentTheme === 'neon'
                  ? 'hover:bg-gray-800 text-cyan-400 hover:text-cyan-300'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-blue-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Change Theme"
              data-theme-button
            >
              <span className="text-xl">🎨</span>
            </motion.button> */}

            {user ? (
              <>
                {/* User Stats */}
                <div className={`hidden sm:flex items-center space-x-3 px-3 py-1 rounded-lg ${
                  currentTheme === 'neon'
                    ? 'bg-gray-800/50 border border-cyan-500/30'
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-500">💰</span>
                    <span className={`text-sm font-medium ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
                    }`}>
                      0
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-500">⭐</span>
                    <span className={`text-sm font-medium ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
                    }`}>
                      0
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-purple-500">🏆</span>
                    <span className={`text-sm font-medium ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
                    }`}>
                      Lv.1
                    </span>
                  </div>
                </div>

                {/* Notification Center */}
                <div className="mr-2">
                  <NotificationCenter />
                </div>

                <div className="relative group">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 group-hover:scale-105 ${
                      currentTheme === 'neon'
                        ? 'hover:bg-gray-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm animate-pulse">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300">
                    {user.name}
                  </span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                    >
                      👤 Profile
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <LoadingSpinner type="dots" size="small" />
                          <span>Logging out...</span>
                        </div>
                      ) : (
                        '🚪 Logout'
                      )}
                    </button>
                  </div>
                </div>
              </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-all duration-300"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden animate-slide-in-down">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white rounded-lg shadow-lg border border-gray-200 mt-2">
              {navItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 animate-fade-in-left stagger-${index + 1} ${
                    location.pathname === item.path
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${theme?.gradients.primary || 'from-blue-500 via-purple-500 to-pink-500'} animate-gradient`} />
    </motion.header>

    {/* Theme Selector Modal */}
    {/* <ThemeCustomization
          isOpen={showThemeSelector}
          onClose={() => setShowThemeSelector(false)}
        /> */}
    </>
  );
};

export default Header;
