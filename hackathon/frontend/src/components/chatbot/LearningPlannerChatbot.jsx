import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence  } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import useAutoScroll from '../../hooks/useAutoScroll';

const LearningPlannerChatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Xin chào! Tôi là AI Learning Planner. Tôi sẽ giúp bạn tạo lộ trình học tập cá nhân hóa. Hãy cho tôi biết bạn muốn học gì?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [showPlanConfirmation, setShowPlanConfirmation] = useState(false);
  
  // Auto-scroll hook
  const { messagesEndRef, messagesContainerRef, scrollToBottom, forceScrollToBottom, handleScroll } = useAutoScroll(messages, {
    enabled: true,
    smooth: true,
    scrollOnMount: true,
    scrollOnNewMessage: true,
    delay: 100
  });

  // Force scroll to bottom when messages are first loaded
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        forceScrollToBottom();
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, forceScrollToBottom]);

  const _handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const _userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const _response = await fetch('/api/ai/learning-planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: inputMessage,
          userId: user.id,
          conversationHistory: messages.slice(-5) // Send last 5 messages for context
        })
      });

      if (response.ok) {
        const _data = await response.json();
        
        const _botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.response,
          timestamp: new Date(),
          plan: data.learningPlan || null
        };

        setMessages(prev => [...prev, botMessage]);

        // If a learning plan was generated, show confirmation
        if (data.learningPlan) {
          setCurrentPlan(data.learningPlan);
          setShowPlanConfirmation(true);
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const _errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const _handleConfirmPlan = async () => {
    if (!currentPlan) return;

    try {
      setIsLoading(true);
      const _response = await fetch('/api/ai/create-learning-todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          learningPlan: currentPlan,
          userId: user.id
        })
      });

      if (response.ok) {
        const _data = await response.json();
        const _confirmMessage = {
          id: Date.now(),
          type: 'bot',
          content: `Tuyệt vời! Tôi đã tạo ${data.todosCreated} todo items cho lộ trình học tập của bạn. Bạn có thể xem chúng trong mục To-Do. Chúc bạn học tập hiệu quả! 🎯`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, confirmMessage]);
        setShowPlanConfirmation(false);
        setCurrentPlan(null);
      } else {
        throw new Error('Failed to create todos');
      }
    } catch (error) {
      console.error('Error creating todos:', error);
      const _errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: 'Có lỗi xảy ra khi tạo todo items. Vui lòng thử lại.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const _handleKeyPress = (_e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const _quickPrompts = [
    'Tạo lộ trình học React trong 2 tháng',
    'Học Python cơ bản cho người mới bắt đầu',
    'Chuẩn bị cho kỳ thi cuối kỳ môn Toán',
    'Học tiếng Anh giao tiếp trong 3 tháng',
    'Lộ trình trở thành Full-stack Developer'
  ];

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-4 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold">AI Learning Planner</h3>
            <p className="text-sm opacity-90">Tạo lộ trình học tập cá nhân hóa</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.plan && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      📋 Lộ trình học tập được đề xuất:
                    </h4>
                    <div className="space-y-2">
                      {message.plan.topics?.map((topic, index) => (
                        <div key={index} className="text-sm text-blue-700 dark:text-blue-300">
                          <span className="font-medium">Tuần {index + 1}:</span> {topic}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Plan Confirmation */}
      {showPlanConfirmation && currentPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Xác nhận tạo lộ trình học tập
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Bạn có muốn tôi tạo todo items cho lộ trình này không?
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPlanConfirmation(false)}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleConfirmPlan}
                loading={isLoading}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Prompts */}
      {messages.length === 1 && (
        <div className="p-4 bg-white dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Gợi ý nhanh:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(prompt)}
                className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white dark:bg-gray-700 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập yêu cầu của bạn... (VD: Tạo lộ trình học React trong 2 tháng)"
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            variant="primary"
            className="self-end"
          >
            Gửi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LearningPlannerChatbot;
