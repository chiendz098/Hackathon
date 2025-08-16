import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useApi from '../../hooks/useApi';
import {
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Brain,
  Zap,
  Lightbulb,
  Clock,
  Target,
  Calendar,
  BookOpen,
  Users,
  GraduationCap,
  User,
  Plus,
  X,
  Check,
  AlertCircle,
  Info,
  Sparkles,
  Rocket,
  Star,
  Award,
  Trophy,
  Flame,
  Coffee,
  Music,
  Timer,
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Save,
  Share2,
  Download,
  Upload,
  Lock,
  Unlock
} from 'lucide-react';

const ChatbotTodoCreator = ({ onTodoCreated, onClose }) => {
  const { post } = useApi();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedTodoType, setSelectedTodoType] = useState('personal');
  const [generatedTodo, setGeneratedTodo] = useState(null);
  const [showGeneratedTodo, setShowGeneratedTodo] = useState(false);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Quick suggestions for users
  const quickSuggestions = [
    {
      text: "Tạo todo chuẩn bị thi môn Toán",
      icon: "📚",
      type: "personal"
    },
    {
      text: "Tạo dự án nhóm cho môn Lập trình",
      icon: "💻",
      type: "group"
    },
    {
      text: "Tạo bài tập về nhà cho lớp 10A",
      icon: "🎓",
      type: "teacher_assignment"
    },
    {
      text: "Tạo lịch học hàng ngày",
      icon: "📅",
      type: "personal"
    },
    {
      text: "Tạo todo nghiên cứu cho luận văn",
      icon: "🔬",
      type: "personal"
    },
    {
      text: "Tạo kế hoạch ôn thi cuối kỳ",
      icon: "🎯",
      type: "personal"
    }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'vi-VN';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInputMessage(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
    }

    // Add welcome message
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: 'Xin chào! Tôi là AI Assistant. Tôi có thể giúp bạn tạo todo một cách thông minh. Hãy mô tả công việc bạn muốn làm và tôi sẽ tạo todo phù hợp cho bạn!',
        timestamp: new Date()
      }
    ]);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message to chatbot API
      const response = await post('/ai/chatbot', {
        prompt: inputMessage,
        context: 'todo_creation',
        todoType: selectedTodoType
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data.message || 'Tôi đã hiểu yêu cầu của bạn. Hãy để tôi tạo todo phù hợp.',
        timestamp: new Date(),
        suggestedTodo: response.data.suggestedTodo
      };

      setMessages(prev => [...prev, botMessage]);

      // If chatbot suggests a todo, show it
      if (response.data.suggestedTodo) {
        setGeneratedTodo(response.data.suggestedTodo);
        setShowGeneratedTodo(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSuggestion = (suggestion) => {
    setInputMessage(suggestion.text);
    setSelectedTodoType(suggestion.type);
    setShowSuggestions(false);
  };

  const handleCreateTodoFromChatbot = async () => {
    if (!generatedTodo) return;

    try {
      setIsLoading(true);
      
      // Create todo using chatbot endpoint
      const response = await post('/todo/chatbot', {
        prompt: inputMessage,
        todoType: selectedTodoType,
        ...generatedTodo
      });

      if (onTodoCreated) {
        onTodoCreated(response.data.todo);
      }

      // Add success message
      const successMessage = {
        id: Date.now(),
        type: 'bot',
        content: '✅ Todo đã được tạo thành công! Bạn có thể xem trong danh sách todo của mình.',
        timestamp: new Date(),
        isSuccess: true
      };

      setMessages(prev => [...prev, successMessage]);
      setShowGeneratedTodo(false);
      setGeneratedTodo(null);
    } catch (error) {
      console.error('Error creating todo:', error);
      
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: '❌ Có lỗi xảy ra khi tạo todo. Vui lòng thử lại.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">AI Todo Creator</h2>
                <p className="text-sm opacity-90">Tạo todo thông minh với AI Assistant</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.isError
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    : message.isSuccess
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'bot' && (
                    <Brain className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    AI đang suy nghĩ...
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        <AnimatePresence>
          {showSuggestions && messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-4"
            >
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                  Gợi ý nhanh
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSuggestion(suggestion)}
                      className="p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{suggestion.icon}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {suggestion.text}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Todo Preview */}
        <AnimatePresence>
          {showGeneratedTodo && generatedTodo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-4"
            >
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Todo được tạo bởi AI
                  </h3>
                  <button
                    onClick={() => setShowGeneratedTodo(false)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{generatedTodo.title}</span>
                  </div>
                  {generatedTodo.description && (
                    <div className="flex items-start space-x-2">
                      <BookOpen className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {generatedTodo.description}
                      </span>
                    </div>
                  )}
                  {generatedTodo.estimatedTime && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {generatedTodo.estimatedTime} phút
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={handleCreateTodoFromChatbot}
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Đang tạo...' : 'Tạo Todo'}
                  </button>
                  <button
                    onClick={() => setShowGeneratedTodo(false)}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Mô tả công việc bạn muốn làm..."
                className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-gray-300 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                disabled={isLoading}
              />
              <button
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
                  isRecording 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Info className="w-3 h-3" />
              <span>Nhấn Enter để gửi, hoặc sử dụng giọng nói</span>
            </div>
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              {showSuggestions ? 'Ẩn' : 'Hiện'} gợi ý
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatbotTodoCreator; 