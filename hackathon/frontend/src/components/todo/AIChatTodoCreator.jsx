import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import useAutoScroll from '../../hooks/useAutoScroll';

const AIChatTodoCreator = ({ onTodoCreated, onClose }) => {
  const { theme, currentTheme } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your AI assistant. Tell me what you need to do and I'll help you create the perfect task. You can say things like:\n\n• \"I need to study for my math exam next Friday\"\n• \"Write a 1000-word essay about climate change\"\n• \"Practice piano for 30 minutes daily\"\n\nWhat would you like to work on?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  
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

  const quickPrompts = [
    "Study for upcoming exam",
    "Write an essay",
    "Complete homework assignment",
    "Practice a skill",
    "Read a book chapter",
    "Prepare presentation"
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: inputMessage,
          context: 'todo_creation'
        })
      });

      const data = await response.json();
      if (data.success) {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response,
          timestamp: new Date(),
          suggestions: data.suggestions || []
        };

        setMessages(prev => [...prev, aiResponse]);
        if (data.suggestions) {
          setSuggestedTasks(data.suggestions);
        }
      } else {
        throw new Error(data.message || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I had trouble processing that. Could you try rephrasing your request?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessing(false);
    }
  };



  const createTaskFromSuggestion = async (taskData) => {
    try {
      const response = await fetch('/api/todo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(taskData)
      });

      const data = await response.json();
      if (data.success) {
        onTodoCreated(data.todo);
        
        // Add success message
        const successMessage = {
          id: Date.now(),
          type: 'ai',
          content: `✅ Great! I've created the task "${taskData.title}" for you. You earned ${data.xpEarned} XP and ${data.coinsEarned} coins!`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
        setSuggestedTasks([]);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Close Button */}
      {onClose && (
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className={`text-lg font-semibold ${
            currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
          }`}>
            AI Assistant
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              currentTheme === 'neon'
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Chat Messages */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-4"
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
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                message.type === 'user'
                  ? currentTheme === 'neon'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-blue-500 text-white'
                  : currentTheme === 'neon'
                    ? 'bg-gray-800 text-white border border-gray-700'
                    : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="flex items-start space-x-3">
                  {message.type === 'ai' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      🤖
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="whitespace-pre-line">{message.content}</p>
                    
                    {/* Task Suggestions */}
                    {message.suggestions && (
                      <div className="mt-4 space-y-3">
                        {message.suggestions.map((task, index) => (
                          <motion.div
                            key={index}
                            className={`p-4 rounded-lg border-2 ${
                              currentTheme === 'neon'
                                ? 'bg-gray-700 border-gray-600'
                                : 'bg-white border-gray-200'
                            }`}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className={`font-semibold ${
                                  currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {task.title}
                                </h4>
                                <div className="flex items-center space-x-4 mt-2 text-sm">
                                  <span className={`px-2 py-1 rounded-full ${
                                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {task.priority}
                                  </span>
                                  <span className={currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'}>
                                    📚 {task.subject}
                                  </span>
                                  <span className={currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'}>
                                    ⏱️ {task.estimatedTime}min
                                  </span>
                                  <span className={currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'}>
                                    ⭐ {task.difficulty}/5
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => createTaskFromSuggestion(task)}
                                className={`ml-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                                  currentTheme === 'neon'
                                    ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                              >
                                Create Task
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-white/70' : 
                      currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className={`p-4 rounded-2xl ${
              currentTheme === 'neon'
                ? 'bg-gray-800 text-white border border-gray-700'
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  🤖
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-6 py-2">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInputMessage(prompt)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                currentTheme === 'neon'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className={`p-6 border-t ${
        currentTheme === 'neon' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Tell me what you need to do..."
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
              currentTheme === 'neon'
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            disabled={isProcessing}
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isProcessing}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              !inputMessage.trim() || isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : currentTheme === 'neon'
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            whileHover={{ scale: !inputMessage.trim() || isProcessing ? 1 : 1.05 }}
            whileTap={{ scale: !inputMessage.trim() || isProcessing ? 1 : 0.95 }}
          >
            {isProcessing ? '⏳' : '🚀'}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AIChatTodoCreator;
