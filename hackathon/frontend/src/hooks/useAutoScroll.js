import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for auto-scrolling chat messages to bottom
 * @param {Array} messages - Array of messages to watch for changes
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether auto-scroll is enabled (default: true)
 * @param {boolean} options.smooth - Whether to use smooth scrolling (default: true)
 * @param {boolean} options.scrollOnMount - Whether to scroll on component mount (default: true)
 * @param {boolean} options.scrollOnNewMessage - Whether to scroll when new message arrives (default: true)
 * @param {number} options.delay - Delay in ms before scrolling (default: 100)
 * @returns {Object} - { messagesEndRef, scrollToBottom, scrollToTop }
 */
const useAutoScroll = (messages, options = {}) => {
  const {
    enabled = true,
    smooth = true,
    scrollOnMount = true,
    scrollOnNewMessage = true,
    delay = 100
  } = options;

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Scroll to bottom function
  const scrollToBottom = useCallback((force = false) => {
    if (!enabled && !force) return;
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: smooth ? 'smooth' : 'auto',
          block: 'end',
          inline: 'nearest'
        });
      }
      
      // Alternative method: scroll container to bottom if scrollIntoView doesn't work
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        container.scrollTop = container.scrollHeight;
      }
    }, delay);
  }, [enabled, smooth, delay]);

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, [smooth]);

  // Check if user is scrolling
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    isUserScrollingRef.current = !isAtBottom;
  }, []);

  // Scroll on mount - Force scroll to bottom when component first loads
  useEffect(() => {
    if (scrollOnMount && enabled) {
      // Use a longer delay for initial scroll to ensure DOM is ready
      const initialScrollTimeout = setTimeout(() => {
        scrollToBottom(true); // Force scroll on mount
      }, 200);
      
      return () => clearTimeout(initialScrollTimeout);
    }
  }, [scrollOnMount, enabled, scrollToBottom]);

  // Scroll on new messages
  useEffect(() => {
    if (!scrollOnNewMessage || !enabled) return;
    
    const currentMessageCount = messages?.length || 0;
    const previousMessageCount = lastMessageCountRef.current;
    
    // Only scroll if new messages were added (not on initial load)
    if (currentMessageCount > previousMessageCount && previousMessageCount > 0) {
      // Check if user is near bottom before auto-scrolling
      if (!isUserScrollingRef.current) {
        scrollToBottom();
      }
    }
    
    lastMessageCountRef.current = currentMessageCount;
  }, [messages, scrollOnNewMessage, enabled, scrollToBottom]);

  // Additional effect for initial messages load - ensures scroll to bottom on first render
  useEffect(() => {
    if (messages && messages.length > 0 && enabled) {
      // Small delay to ensure DOM is fully rendered
      const initialMessagesTimeout = setTimeout(() => {
        scrollToBottom(true);
      }, 100);
      
      return () => clearTimeout(initialMessagesTimeout);
    }
  }, [messages?.length, enabled, scrollToBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Force immediate scroll to bottom (useful for initial load)
  const forceScrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'auto',
        block: 'end',
        inline: 'nearest'
      });
    }
    
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  return {
    messagesEndRef,
    messagesContainerRef,
    scrollToBottom,
    scrollToTop,
    handleScroll,
    forceScrollToBottom,
    isUserScrolling: isUserScrollingRef.current
  };
};

export default useAutoScroll; 