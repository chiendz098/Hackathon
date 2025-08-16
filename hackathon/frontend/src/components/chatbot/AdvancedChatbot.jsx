import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { sendChatbotMessage, createConversation } from '../../api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import useAutoScroll from '../../hooks/useAutoScroll';
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
  Lightbulb
} from 'lucide-react';

const AdvancedChatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: `Xin chào ${user?.name || 'bạn'}! 👋 Tôi là FBot - Trợ lý AI thông minh của bạn. 

Tôi có thể giúp bạn:
🎓 **Tư vấn giáo dục** - Thông tin trường học, học phí, tuyển sinh
📋 **Quản lý công việc** - Tạo, sửa, xóa todo và lịch trình
📊 **Phân tích hiệu suất** - Báo cáo tiến độ và tư vấn cải thiện
🔍 **Tìm kiếm thông tin** - Web search và tạo lộ trình học tập

Hãy cho tôi biết bạn cần gì nhé!`,
      timestamp: new Date(),
      agent: 'welcome'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [currentAgent, setCurrentAgent] = useState(null);
  
  // Auto-scroll hook
  const { messagesEndRef, messagesContainerRef, scrollToBottom, forceScrollToBottom } = useAutoScroll(messages, {
    enabled: true,
    smooth: true,
    scrollOnMount: true,
    scrollOnNewMessage: true,
    delay: 100
  });

  // Initialize conversation when component mounts
  useEffect(() => {
    console.log('🔍 Component mounted, user:', user?.name);
    console.log('🔍 Current conversationId:', conversationId);
    console.log('🔍 User token exists:', !!localStorage.getItem('token'));
    console.log('🔍 User object:', user);
    
    const initConversation = async () => {
      try {
        console.log('🔍 Creating conversation...');
        const token = localStorage.getItem('token');
        console.log('🔍 Token:', token ? token.substring(0, 20) + '...' : 'No token');
        
        const response = await createConversation();
        console.log('🔍 Create conversation response:', response);
        console.log('🔍 Response data:', response.data);
        console.log('🔍 Response status:', response.status);
        
        if (response.data?.success) {
          setConversationId(response.data.data.conversationId);
          console.log('✅ Created new conversation:', response.data.data.conversationId);
        } else {
          console.error('❌ Failed to create conversation:', response);
          console.error('❌ Response data:', response.data);
        }
      } catch (error) {
        console.error('❌ Error creating conversation:', error);
        console.error('❌ Error details:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        console.error('❌ Error message:', error.message);
      }
    };

    console.log('🔍 Checking conditions for initConversation:');
    console.log('  - !conversationId:', !conversationId);
    console.log('  - user exists:', !!user);
    console.log('  - user.name:', user?.name);
    
    if (!conversationId && user) {
      console.log('🔍 Conditions met, calling initConversation...');
      initConversation();
    } else {
      console.log('🔍 Conditions not met for initConversation');
    }
  }, [conversationId, user]);

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

  const handleSendMessage = useCallback(async () => {
    console.log('🔍 handleSendMessage called:', { 
      inputMessage: inputMessage.trim(), 
      isLoading, 
      conversationId,
      user: user?.name 
    });
    
    // Add immediate visual feedback
    console.log('🔍 Adding user message to UI immediately');
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => {
      console.log('🔍 Previous messages count:', prev.length);
      const newMessages = [...prev, userMessage];
      console.log('🔍 New messages count:', newMessages.length);
      return newMessages;
    });
    // If no conversationId, try to create one
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      try {
        console.log('🔍 No conversationId, creating new conversation...');
        const response = await createConversation();
        console.log('🔍 createConversation response:', response);
        if (response.data?.success) {
          currentConversationId = response.data.data.conversationId;
          setConversationId(currentConversationId);
          console.log('✅ Created new conversation for sending:', currentConversationId);
        } else {
          console.error('❌ Failed to create conversation for sending');
          console.error('❌ Response:', response);
          return;
        }
      } catch (error) {
        console.error('❌ Error creating conversation for sending:', error);
        console.error('❌ Error details:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        return;
      }
    }
    
    if (!inputMessage.trim() || isLoading) {
      console.log('❌ Cannot send message:', { 
        hasInput: !!inputMessage.trim(), 
        isLoading
      });
      return;
    }

    try {
      console.log('🔍 Sending message to chatbot API...');
      console.log('🔍 Conversation ID:', currentConversationId);
      console.log('🔍 Message:', inputMessage);
      
      const response = await sendChatbotMessage(currentConversationId, inputMessage);
      
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';
      let finalMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        console.log('🔍 Raw chunk received:', chunk);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.trim()) {
            console.log('🔍 Processing line:', line);
            try {
              // Handle Server-Sent Events format: "data: {...}"
              let jsonStr = line;
              if (line.startsWith('data: ')) {
                jsonStr = line.substring(6);
              }
              const data = JSON.parse(jsonStr);
              console.log('🔍 Parsed data:', data);
              
              if (data.type === 'chunk') {
                streamedContent = data.content;
                // Update the message in real-time
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.type === 'bot' && lastMessage.isStreaming) {
                    lastMessage.content = streamedContent;
                  } else {
                    newMessages.push({
                      id: Date.now() + 1,
                      type: 'bot',
                      content: streamedContent,
                      timestamp: new Date(),
                      isStreaming: true,
                      agent: currentAgent
                    });
                  }
                  return newMessages;
                });
              } else if (data.type === 'final') {
                finalMessage = data.content;
                // Finalize the message
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.type === 'bot') {
                    lastMessage.content = finalMessage;
                    lastMessage.isStreaming = false;
                    lastMessage.agent = currentAgent;
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.warn('Failed to parse streaming data:', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại hoặc kiểm tra kết nối mạng.',
        timestamp: new Date(),
        agent: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentAgent(null);
    }
  }, [inputMessage, isLoading, conversationId, currentAgent, createConversation]);

  const handleKeyDown = (e) => {
    console.log('🔍 KeyDown event:', e.key, e.shiftKey);
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('🔍 Sending message via Enter key');
      console.log('🔍 Current state:', { inputMessage, isLoading, conversationId });
      handleSendMessage();
    }
  };

  const quickActions = [
    {
      icon: <BookOpen className="w-4 h-4" />,
      text: "Thông tin tuyển sinh",
      action: "Cho tôi biết thông tin tuyển sinh đại học FPT"
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      text: "Tạo todo mới",
      action: "Tạo một todo mới cho tôi"
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      text: "Phân tích hiệu suất",
      action: "Phân tích hiệu suất học tập của tôi"
    },
    {
      icon: <Search className="w-4 h-4" />,
      text: "Tìm kiếm thông tin",
      action: "Tìm kiếm thông tin về lập trình web"
    }
  ];

  const handleQuickAction = (action) => {
    setInputMessage(action);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">FBot AI Assistant</h2>
            <p className="text-sm text-blue-100">Trợ lý thông minh đa năng</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm">Online</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-white/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                console.log('🔍 Quick action clicked:', action.text);
                handleQuickAction(action.action);
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-600"
            >
              {action.icon}
              <span>{action.text}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        {/* Debug info */}
        <div className="text-xs text-gray-500 mb-2">
          Messages count: {messages.length} | Loading: {isLoading ? 'true' : 'false'} | Conversation: {conversationId || 'none'}
        </div>
        <AnimatePresence>
          {messages.map((message, index) => {
            console.log('🔍 Rendering message:', { id: message.id, type: message.type, content: message.content.substring(0, 50) });
            return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    getAgentIcon(message.agent)
                  )}
                </div>
                
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  {message.type === 'bot' && message.agent && message.agent !== 'welcome' && message.agent !== 'error' && (
                    <div className="flex items-center space-x-2 mb-2 text-xs text-gray-500 dark:text-gray-400">
                      {getAgentIcon(message.agent)}
                      <span>{getAgentName(message.agent)}</span>
                    </div>
                  )}
                  
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                    )}
                  </div>
                  
                  <div className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn của bạn..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              rows="1"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              console.log('🔍 Send button clicked');
              console.log('🔍 Current state:', { inputMessage, isLoading, conversationId });
              handleSendMessage();
            }}
            disabled={!inputMessage.trim() || isLoading}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          {!conversationId ? (
            <span className="text-orange-500">Đang khởi tạo cuộc trò chuyện...</span>
          ) : (
            <>
              Nhấn Enter để gửi, Shift + Enter để xuống dòng
              <br />
              <span className="text-green-500">✅ Sẵn sàng gửi tin nhắn</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedChatbot; 