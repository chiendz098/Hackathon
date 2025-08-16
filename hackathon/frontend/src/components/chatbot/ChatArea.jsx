import React, { useState, useRef, useEffect, useCallback, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  MessageSquare, 
  Sparkles,
  BookOpen,
  Calendar,
  BarChart3,
  Search,
  Lightbulb,
  Plus,
  Settings,
  Copy,
  Download,
  Share2,
  Check,
  CheckCheck,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sendChatbotMessage } from '../../api';
import useAutoScroll from '../../hooks/useAutoScroll';
import toast from 'react-hot-toast';

const ChatArea = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  conversationId,
  onNewConversation 
}) => {
  const { user } = useAuth();
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messageReactions, setMessageReactions] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTheme, setCurrentTheme] = useState('default');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Auto-scroll hook
  const { messagesEndRef, messagesContainerRef, scrollToBottom, forceScrollToBottom } = useAutoScroll(messages, {
    enabled: true,
    smooth: true,
    scrollOnMount: true,
    scrollOnNewMessage: true,
    delay: 100
  });

  // Force scroll to bottom when messages are first loaded
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        forceScrollToBottom();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [messages.length, forceScrollToBottom]);

  const getAgentIcon = (agent) => {
    switch (agent) {
      case 'rag_agent':
        return <BookOpen className="w-4 h-4" />;
      case 'schedule_agent':
        return <Calendar className="w-4 h-4" />;
      case 'analytic_agent':
        return <BarChart3 className="w-4 h-4" />;
      case 'generic_agent':
        return <Search className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getAgentName = (agent) => {
    switch (agent) {
      case 'rag_agent':
        return 'Tư vấn giáo dục';
      case 'schedule_agent':
        return 'Quản lý công việc';
      case 'analytic_agent':
        return 'Phân tích hiệu suất';
      case 'generic_agent':
        return 'Tìm kiếm thông tin';
      default:
        return 'FBot AI';
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Đã sao chép vào clipboard!');
    } catch (error) {
      toast.error('Không thể sao chép');
    }
  };

  // Message reactions
  const handleReaction = (messageId, reaction) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [reaction]: (prev[messageId]?.[reaction] || 0) + 1
      }
    }));
    toast.success(`Đã ${reaction === 'like' ? 'thích' : reaction === 'dislike' ? 'không thích' : 'đánh dấu'} tin nhắn!`);
  };

  // Filter messages based on search
  const filteredMessages = useMemo(() => 
    messages.filter(message => 
      message.content.toLowerCase().includes(searchQuery.toLowerCase())
    ), [messages, searchQuery]
  );

  // Virtual scrolling: only show last 50 messages for performance
  const visibleMessages = useMemo(() => {
    const startIndex = Math.max(0, filteredMessages.length - 50);
    return filteredMessages.slice(startIndex);
  }, [filteredMessages]);

  // Load more messages when scrolling to top
  const handleScroll = useCallback((e) => {
    const { scrollTop } = e.target;
    if (scrollTop < 100 && !isLoadingMore && filteredMessages.length > 50) {
      setIsLoadingMore(true);
      // Simulate loading more messages
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 500);
    }
  }, [filteredMessages.length, isLoadingMore]);

  // Theme configurations
  const themes = {
    default: {
      userBg: 'bg-blue-500',
      botBg: 'bg-gray-100 dark:bg-gray-800',
      userText: 'text-white',
      botText: 'text-gray-900 dark:text-gray-100'
    },
    blue: {
      userBg: 'bg-blue-600',
      botBg: 'bg-blue-50 dark:bg-blue-900',
      userText: 'text-white',
      botText: 'text-blue-900 dark:text-blue-100'
    },
    green: {
      userBg: 'bg-green-600',
      botBg: 'bg-green-50 dark:bg-green-900',
      userText: 'text-white',
      botText: 'text-green-900 dark:text-green-100'
    },
    purple: {
      userBg: 'bg-purple-600',
      botBg: 'bg-purple-50 dark:bg-purple-900',
      userText: 'text-white',
      botText: 'text-purple-900 dark:text-purple-100'
    }
  };

  const currentThemeConfig = themes[currentTheme];

  const handleSendMessage = useCallback(async () => {
    console.log('🔍 ChatArea handleSendMessage called:', { 
      inputMessage: inputMessage.substring(0, 50), 
      isLoading, 
      conversationId 
    });
    
    if (!inputMessage.trim() || isLoading || !conversationId) {
      console.log('❌ Cannot send message:', { 
        hasInput: !!inputMessage.trim(), 
        isLoading, 
        hasConversation: !!conversationId 
      });
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    const messageContent = inputMessage;
    setInputMessage('');
    // Don't set streaming to true, just show loading
    setIsStreaming(false);
    setStreamingMessage('');

    try {
      console.log('🔍 Calling onSendMessage...');
      // Add user message immediately
      await onSendMessage(userMessage, messageContent);
      
      // Start streaming response
      const response = await sendChatbotMessage(conversationId, messageContent);
      
      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          console.log('🔍 Raw chunk received:', chunk);
          const lines = chunk.split('\n\n');
          
          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              console.log('🔍 Processing line:', line);
              try {
                const data = JSON.parse(line.slice(6));
                console.log('🔍 Parsed data:', data);
                
                if (data.type === 'chunk') {
                  // Completely ignore chunks, don't process them at all
                  console.log('🔍 Chunk received, completely ignored');
                } else if (data.type === 'final') {
                  // Final message received, stop streaming
                  setIsStreaming(false);
                  setStreamingMessage('');
                  console.log('🔍 Final message received, stopping streaming');
                  break;
                } else if (data.type === 'error') {
                  toast.error(data.content);
                  setIsStreaming(false);
                  setStreamingMessage('');
                  break;
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Có lỗi xảy ra khi gửi tin nhắn');
      setIsStreaming(false);
      setStreamingMessage('');
    }
  }, [inputMessage, isLoading, conversationId, onSendMessage]);

  const handleKeyDown = (e) => {
    // Send message with Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    
    // Clear input with Escape
    if (e.key === 'Escape') {
      setInputMessage('');
    }
    
    // Focus search with Ctrl+F
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      const searchInput = document.querySelector('input[placeholder*="Tìm kiếm"]');
      if (searchInput) {
        searchInput.focus();
      }
    }
    
    // New conversation with Ctrl+N
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      onNewConversation();
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Vừa xong';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ngày trước`;
    } else {
      return messageTime.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  // Function to format message content with advanced formatting
  const formatMessageContent = (content) => {
    if (!content) return '';
    
    // Handle tables first
    const tableRegex = /\|(.+)\|/g;
    const tableMatches = [...content.matchAll(tableRegex)];
    
    if (tableMatches.length > 2) {
      // This might be a table, try to parse it
      return formatTableContent(content);
    }
    
    // Handle code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }
      
      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }
    
    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <div key={`part-${index}`} className="my-3">
            <div className="bg-gray-800 text-gray-300 px-3 py-1 text-xs rounded-t-lg border-b border-gray-700 flex justify-between items-center">
              <span>{part.language.toUpperCase()}</span>
              <button
                onClick={() => copyToClipboard(part.content)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Copy code"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-b-lg overflow-x-auto text-sm">
              <code>{part.content}</code>
            </pre>
          </div>
        );
      }
      
      // Format text content
      return (
        <div key={`part-${index}`}>
          {formatTextContent(part.content, index)}
        </div>
      );
    });
  };

  // Function to format table content
  const formatTableContent = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    const tableLines = lines.filter(line => line.includes('|'));
    
    if (tableLines.length < 2) {
      return formatTextContent(content, 0);
    }
    
    const tableData = tableLines.map(line => 
      line.split('|').map(cell => cell.trim()).filter(cell => cell)
    );
    
    // Remove separator line (contains only dashes and pipes)
    const filteredData = tableData.filter(row => 
      !row.every(cell => /^[-|]+$/.test(cell))
    );
    
    if (filteredData.length < 2) {
      return formatTextContent(content, 0);
    }
    
    const headers = filteredData[0];
    const rows = filteredData.slice(1);
    
    return (
      <div className="my-4 overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-600">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Function to format text content with links, bold, italic, lists, etc.
  const formatTextContent = (text, baseIndex) => {
    if (!text) return '';
    
    // Handle lists first
    const lines = text.split('\n');
    const formattedLines = lines.map((line, lineIndex) => {
      // Check for ordered lists (1. 2. 3.)
      if (/^\d+\.\s/.test(line)) {
        const content = line.replace(/^\d+\.\s/, '');
        return (
          <div key={`line-${lineIndex}`} className="flex items-start space-x-2 py-1">
            <span className="text-gray-500 dark:text-gray-400 text-sm mt-1">•</span>
            <span>{formatInlineText(content, `${baseIndex}-line-${lineIndex}`)}</span>
          </div>
        );
      }
      
      // Check for unordered lists (- * •)
      if (/^[-*•]\s/.test(line)) {
        const content = line.replace(/^[-*•]\s/, '');
        return (
          <div key={`line-${lineIndex}`} className="flex items-start space-x-2 py-1">
            <span className="text-gray-500 dark:text-gray-400 text-sm mt-1">•</span>
            <span>{formatInlineText(content, `${baseIndex}-line-${lineIndex}`)}</span>
          </div>
        );
      }
      
      // Regular text line
      return (
        <div key={`line-${lineIndex}`} className="py-1">
          {formatInlineText(line, `${baseIndex}-line-${lineIndex}`)}
        </div>
      );
    });
    
    return <div className="space-y-1">{formattedLines}</div>;
  };

  // Function to format inline text (bold, italic, links)
  const formatInlineText = (text, baseKey) => {
    if (!text) return '';
    
    // Split content into parts: text and links
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    
    return parts.map((part, index) => {
      // Check if this part is a URL
      if (part.match(/^https?:\/\/[^\s]+$/)) {
        return (
          <a
            key={`${baseKey}-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline break-all"
          >
            {part}
          </a>
        );
      }
      
      // Format markdown-style text
      let formattedText = part;
      
      // Bold text (**text** or *text*)
      const formattedParts = formattedText.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((textPart, textIndex) => {
        if (textPart.startsWith('**') && textPart.endsWith('**')) {
          const boldText = textPart.slice(2, -2);
          return (
            <strong key={`${baseKey}-${index}-${textIndex}`} className="font-bold">
              {boldText}
            </strong>
          );
        } else if (textPart.startsWith('*') && textPart.endsWith('*') && textPart.length > 2) {
          const italicText = textPart.slice(1, -1);
          return (
            <em key={`${baseKey}-${index}-${textIndex}`} className="italic">
              {italicText}
            </em>
          );
        }
        return <span key={`${baseKey}-${index}-${textIndex}`}>{textPart}</span>;
      });
      
      return (
        <Fragment key={`${baseKey}-${index}`}>
          {formattedParts}
        </Fragment>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              FBot AI Assistant
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Trợ lý AI thông minh
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onNewConversation}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Cuộc trò chuyện mới"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Cài đặt"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {/* Theme Menu */}
            {showThemeMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">Chọn theme</div>
                  <div className="space-y-2">
                    {Object.keys(themes).map(theme => (
                      <button
                        key={theme}
                        onClick={() => {
                          setCurrentTheme(theme);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          currentTheme === theme
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm trong cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Tìm thấy {filteredMessages.length} tin nhắn
          </div>
        )}
      </div>



      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
        onScroll={handleScroll}
      >
        <AnimatePresence>
          {/* Loading more messages indicator */}
          {isLoadingMore && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center py-4"
            >
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Đang tải tin nhắn cũ...</span>
              </div>
            </motion.div>
          )}

          {visibleMessages.map((message, index) => (
            <motion.div
              key={message.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[90%] sm:max-w-[80%] md:max-w-[70%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-blue-500' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    getAgentIcon(message.agent)
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex flex-col space-y-1 ${
                  message.type === 'user' ? 'items-end' : 'items-start'
                }`}>
                  {/* Agent Name */}
                  {message.type === 'bot' && message.agent && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      {getAgentIcon(message.agent)}
                      <span>{getAgentName(message.agent)}</span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`px-4 py-3 rounded-2xl max-w-full ${
                    message.type === 'user'
                      ? `${currentThemeConfig.userBg} ${currentThemeConfig.userText}`
                      : `${currentThemeConfig.botBg} ${currentThemeConfig.botText}`
                  }`}>
                    <div className="whitespace-pre-wrap break-words">
                      {message.type === 'bot' ? formatMessageContent(message.content) : message.content}
                    </div>
                  </div>

                  {/* Message Actions */}
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <span>{formatTime(message.timestamp)}</span>
                      {message.type === 'bot' && (
                        <span className="text-green-500">✓</span>
                      )}
                    </span>
                    {message.type === 'bot' && (
                      <>
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          title="Chia sẻ"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>
                        <button
                          className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                          title="Bookmark"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Message Reactions */}
                  {message.type === 'bot' && (
                    <div className="flex items-center space-x-1 mt-2">
                      <button
                        onClick={() => handleReaction(message.id, 'like')}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Thích"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{messageReactions[message.id]?.like || 0}</span>
                      </button>
                      <button
                        onClick={() => handleReaction(message.id, 'dislike')}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Không thích"
                      >
                        <ThumbsDown className="w-3 h-3" />
                        <span>{messageReactions[message.id]?.dislike || 0}</span>
                      </button>
                      <button
                        onClick={() => handleReaction(message.id, 'helpful')}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Hữu ích"
                      >
                        <Heart className="w-3 h-3" />
                        <span>{messageReactions[message.id]?.helpful || 0}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Streaming Message - DISABLED - Only show final messages */}
          {/* {isStreaming && streamingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex max-w-[80%] items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                    <div className="whitespace-pre-wrap break-words">
                      {formatMessageContent(streamingMessage)}
                      <span className="inline-block w-2 h-4 bg-gray-400 dark:bg-gray-600 ml-1 animate-pulse"></span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )} */}

          {/* Enhanced Loading Indicator */}
          {isLoading && !isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex max-w-[90%] sm:max-w-[80%] md:max-w-[70%] items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">AI đang suy nghĩ...</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    Đang xử lý yêu cầu của bạn...
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn của bạn... (Hỗ trợ Markdown: **bold**, *italic*, ```code```)"
              className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={isLoading || isStreaming}
            />
            <div className="absolute right-3 bottom-3 text-xs text-gray-400">
              Enter gửi • Shift+Enter xuống dòng • Esc xóa • Ctrl+F tìm kiếm
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Emoji Button */}
            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Emoji"
            >
              😊
            </button>
            
            {/* File Upload Button */}
            <button
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Tải file"
            >
              <Download className="w-5 h-5" />
            </button>
            
            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || isStreaming}
              className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-2xl transition-colors disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Message Status */}
        {isLoading && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>AI đang suy nghĩ...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea; 