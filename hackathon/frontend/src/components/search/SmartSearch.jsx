import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const SmartSearch = ({ isOpen, onClose, onSelectResult }) => {
  const { theme, currentTheme } = useTheme();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all', // all, tasks, notes, subjects, tags
    subject: 'all',
    priority: 'all',
    dateRange: 'all'
  });
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length > 0) {
      const debounceTimer = setTimeout(() => {
        performSearch(query);
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setResults([]);
    }
  }, [query, filters]);

  useEffect(() => {
    // Load search history
    const history = localStorage.getItem(`searchHistory_${user?.id}`);
    if (history && history !== 'undefined' && history !== 'null') {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (error) {
        console.error('Error parsing search history:', error);
        setSearchHistory([]);
      }
    }
  }, [user]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          query: searchQuery,
          filters,
          userId: user?.id
        })
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.results);
      } else {
        console.error('Search failed:', data.message);
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };



  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelectResult = (result) => {
    // Add to search history
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem(`searchHistory_${user?.id}`, JSON.stringify(newHistory));

    onSelectResult?.(result);
    onClose();
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'task': return '📝';
      case 'note': return '📄';
      case 'subject': return '📚';
      case 'tag': return '🏷️';
      case 'calendar': return '📅';
      default: return '🔍';
    }
  };

  const getResultTypeColor = (type) => {
    switch (type) {
      case 'task': return currentTheme === 'neon' ? 'text-cyan-400' : 'text-blue-600';
      case 'note': return currentTheme === 'neon' ? 'text-green-400' : 'text-green-600';
      case 'subject': return currentTheme === 'neon' ? 'text-purple-400' : 'text-purple-600';
      case 'tag': return currentTheme === 'neon' ? 'text-yellow-400' : 'text-yellow-600';
      default: return currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`max-w-3xl w-full max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl ${
            currentTheme === 'neon' 
              ? 'bg-gray-900 border border-cyan-500/30' 
              : 'bg-white border border-gray-200'
          }`}
          initial={{ scale: 0.9, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className={`p-6 border-b ${
            currentTheme === 'neon' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-2xl">🔍</span>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search tasks, notes, subjects, tags..."
                className={`w-full pl-12 pr-4 py-4 text-lg rounded-xl border-2 transition-all duration-300 ${
                  currentTheme === 'neon'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
              {loading && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { key: 'type', label: 'All Types', value: 'all' },
                { key: 'type', label: 'Tasks', value: 'tasks' },
                { key: 'type', label: 'Notes', value: 'notes' },
                { key: 'type', label: 'Subjects', value: 'subjects' }
              ].map((filter) => (
                <button
                  key={`${filter.key}-${filter.value}`}
                  onClick={() => setFilters(prev => ({ ...prev, [filter.key]: filter.value }))}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filters[filter.key] === filter.value
                      ? currentTheme === 'neon'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-blue-500 text-white'
                      : currentTheme === 'neon'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {query.length === 0 ? (
              <div className="p-6">
                {searchHistory.length > 0 && (
                  <div>
                    <h3 className={`text-sm font-semibold mb-3 ${
                      currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Recent Searches
                    </h3>
                    <div className="space-y-2">
                      {searchHistory.slice(0, 5).map((historyItem, index) => (
                        <button
                          key={index}
                          onClick={() => setQuery(historyItem)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            currentTheme === 'neon'
                              ? 'hover:bg-gray-800 text-gray-300'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-gray-500">🕒</span>
                            <span>{historyItem}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`mt-6 text-center ${
                  currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <div className="text-4xl mb-2">🔍</div>
                  <p>Start typing to search your tasks, notes, and more</p>
                  <div className="mt-4 text-sm">
                    <p>Try searching for:</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {['math homework', 'physics notes', 'urgent tasks', '#calculus'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setQuery(suggestion)}
                          className={`px-2 py-1 text-xs rounded-full ${
                            currentTheme === 'neon'
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : results.length === 0 && !loading ? (
              <div className={`p-6 text-center ${
                currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <div className="text-4xl mb-2">😔</div>
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-2">Try different keywords or check your filters</p>
              </div>
            ) : (
              <div className="p-2">
                {results.map((result, index) => (
                  <motion.button
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                      selectedIndex === index
                        ? currentTheme === 'neon'
                          ? 'bg-cyan-500/20 border-2 border-cyan-500/50'
                          : 'bg-blue-50 border-2 border-blue-200'
                        : currentTheme === 'neon'
                          ? 'hover:bg-gray-800 border-2 border-transparent'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{getResultIcon(result.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`font-semibold truncate ${
                            currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {result.title}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-200'
                          } ${getResultTypeColor(result.type)}`}>
                            {result.type}
                          </span>
                        </div>
                        
                        <p className={`text-sm mb-2 ${
                          currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {result.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs">
                          {result.subject && (
                            <span className={currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'}>
                              📚 {result.subject}
                            </span>
                          )}
                          {result.priority && (
                            <span className={getPriorityColor(result.priority)}>
                              {result.priority.toUpperCase()}
                            </span>
                          )}
                          {result.dueDate && (
                            <span className={currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'}>
                              📅 {new Date(result.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex space-x-1">
                              {result.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className={`px-1 py-0.5 rounded text-xs ${
                                    currentTheme === 'neon'
                                      ? 'bg-gray-700 text-gray-300'
                                      : 'bg-gray-200 text-gray-600'
                                  }`}
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className={`text-xs ${
                        currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {Math.round(result.relevanceScore * 100)}% match
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`p-4 border-t text-xs ${
            currentTheme === 'neon' 
              ? 'border-gray-700 text-gray-400' 
              : 'border-gray-200 text-gray-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                Use ↑↓ to navigate, Enter to select, Esc to close
              </div>
              <div>
                {results.length > 0 && `${results.length} results`}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SmartSearch;
