import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  sendChatbotMessage, 
  createConversation, 
  getConversationHistory, 
  getUserConversations,
  updateConversationTitle,
  deleteConversation,
  saveMessage,
  cleanupEmptyConversations
} from '../../api';
import ConversationSidebar from './ConversationSidebar';
import ChatArea from './ChatArea';
import toast from 'react-hot-toast';

const ChatbotFullPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [currentAgent, setCurrentAgent] = useState(null);

  // Function to generate smart conversation title
  const generateConversationTitle = (messageContent) => {
    if (!messageContent || messageContent.trim().length === 0) {
      return 'Cuộc trò chuyện mới';
    }

    // Clean the message content
    let cleanContent = messageContent.trim();
    
    // Remove common prefixes
    const prefixesToRemove = ['xin chào', 'hello', 'hi', 'chào', 'hey'];
    for (const prefix of prefixesToRemove) {
      if (cleanContent.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleanContent = cleanContent.substring(prefix.length).trim();
        break;
      }
    }

    // If content is too short after cleaning, use original
    if (cleanContent.length < 3) {
      cleanContent = messageContent.trim();
    }

    // Limit length and add ellipsis if needed
    if (cleanContent.length > 25) {
      return cleanContent.substring(0, 25) + '...';
    }

    return cleanContent || 'Cuộc trò chuyện mới';
  };

  // Load user conversations on mount
  useEffect(() => {
    if (user) {
      console.log('🔍 User loaded, loading conversations...');
      loadUserConversations();
    }
  }, [user]);

  // Only create conversation if user explicitly requests it
  // Remove auto-creation logic

  // Remove fallback auto-creation timer

  // Emergency fallback: only show welcome message if no messages and no current conversation
  useEffect(() => {
    if (user && messages.length === 0 && !isLoading && !currentConversationId) {
      console.log('🔍 Emergency fallback: No messages and no conversation, showing welcome message');
      setMessages([
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
    }
  }, [user, messages.length, isLoading, currentConversationId]);

  const loadUserConversations = async () => {
    try {
      console.log('🔍 Loading user conversations...');
      const response = await getUserConversations();
      
      // Axios response structure
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        console.log('🔍 Conversations loaded:', data.data?.length || 0);
        
        // Use titles from database, fallback to default if not set
        const conversationsWithTitles = (data.data || []).map(conv => ({
          ...conv,
          title: conv.title || 'Cuộc trò chuyện mới',
          messageCount: conv.messageCount || 0,
          updatedAt: conv.updatedAt || conv.startedAt
        }));
        
        // Only set conversations, don't auto-create
        if (data.data && data.data.length > 0) {
          // Filter out empty conversations (no messages)
          const validConversations = conversationsWithTitles.filter(conv => 
            conv.messageCount > 0 || conv.lastMessage !== 'No messages yet'
          );
          
          console.log('🔍 Found', validConversations.length, 'valid conversations');
          setConversations(validConversations);
          
          // Select the first conversation with messages, or the most recent one
          if (validConversations.length > 0) {
            let selectedConversation = validConversations[0];
            for (const conv of validConversations) {
              if (conv.messageCount > 0) {
                selectedConversation = conv;
                break;
              }
            }
            
            console.log('🔍 Selected conversation:', selectedConversation.id);
            setCurrentConversationId(selectedConversation.id);
            await selectConversation(selectedConversation.id);
          }
        } else {
          console.log('🔍 No conversations found, waiting for user to create one');
        }
      } else {
        console.log('🔍 Response not ok, status:', response.status);
        console.log('🔍 Response data:', response.data);
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      // Don't auto-create conversation on error, just log it
    }
  };

  const createNewConversation = async () => {
    try {
      console.log('🔍 Creating new conversation...');
      const response = await createConversation();
      
      // Axios response structure
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        const conversationId = data.data.conversationId;
        console.log('✅ Conversation created:', conversationId);
        
        const newConversation = {
          id: conversationId,
          title: 'Cuộc trò chuyện mới',
          startedAt: new Date(),
          lastMessage: 'Cuộc trò chuyện mới',
          messageCount: 0,
          updatedAt: new Date()
        };

        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversationId(conversationId);
        
        const welcomeMessage = {
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
        };
        
        // Don't auto-set welcome message, let user start the conversation
        setMessages([]);
        console.log('✅ New conversation created, waiting for user input');
      } else {
        console.log('🔍 Response not ok, status:', response.status);
        console.log('🔍 Response data:', response.data);
        if (response.data?.success && response.data?.data?.conversationId) {
          const conversationId = response.data.data.conversationId;
          console.log('✅ Conversation created from response:', conversationId);
          
          const newConversation = {
            id: conversationId,
            title: 'Cuộc trò chuyện mới',
            startedAt: new Date(),
            lastMessage: 'Cuộc trò chuyện mới'
          };

          setConversations(prev => [newConversation, ...prev]);
          setCurrentConversationId(conversationId);
          
          const welcomeMessage = {
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
          };
          
          setMessages([welcomeMessage]);
          console.log('✅ Welcome message set');
        } else {
          console.error('❌ Failed to create conversation: invalid response data');
          toast.error('Không thể tạo cuộc trò chuyện mới');
        }
      }
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      toast.error('Không thể tạo cuộc trò chuyện mới');
    }
  };

  const selectConversation = async (conversationId) => {
    console.log('🔍 Selecting conversation:', conversationId);
    setCurrentConversationId(conversationId);
    
    try {
      // Load conversation history from backend
      const response = await getConversationHistory(conversationId);
      console.log('🔍 Conversation history response:', response.status);
      
      // Axios response structure
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        console.log('🔍 Conversation history data:', data);
        
        const historyMessages = data.data?.messages || [];
        console.log('🔍 History messages count:', historyMessages.length);
        
        if (historyMessages.length > 0) {
          // Convert database format to UI format
          const uiMessages = historyMessages.map((msg, index) => ({
            id: index + 1,
            type: msg.role === 'user' ? 'user' : 'bot',
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            agent: msg.agent || 'generic_agent'
          }));
          
          setMessages(uiMessages);
          console.log('✅ Loaded', uiMessages.length, 'messages from history');
        } else {
          // If no history, show welcome message
          console.log('🔍 No history messages, showing welcome message');
          setMessages([
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
        }
      } else {
        console.log('🔍 Failed to load history, showing welcome message');
        // If no history, show welcome message
        setMessages([
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
      }
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
      // Always show welcome message on error
      setMessages([
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
    }
  };

  const deleteConversationHandler = async (conversationId) => {
    try {
      console.log('🔍 Deleting conversation:', conversationId);
      const response = await deleteConversation(conversationId);
      
      // Axios response structure
      if (response.status >= 200 && response.status < 300) {
        console.log('✅ Conversation deleted successfully');
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        
        if (currentConversationId === conversationId) {
          // If deleting current conversation, create a new one
          await createNewConversation();
        }
        
        toast.success('Đã xóa cuộc trò chuyện');
      } else {
        console.log('🔍 Delete response not ok, status:', response.status);
        console.log('🔍 Response data:', response.data);
        
        // Try to remove from UI anyway if it's a 404 (conversation not found)
        if (response.status === 404) {
          console.log('🔍 Conversation not found, removing from UI');
          setConversations(prev => prev.filter(conv => conv.id !== conversationId));
          
          if (currentConversationId === conversationId) {
            await createNewConversation();
          }
          
          toast.success('Đã xóa cuộc trò chuyện');
        } else {
          toast.error('Không thể xóa cuộc trò chuyện');
        }
      }
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      
      // If it's a 404 error, remove from UI anyway
      if (error.response && error.response.status === 404) {
        console.log('🔍 Conversation not found (404), removing from UI');
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        
        if (currentConversationId === conversationId) {
          await createNewConversation();
        }
        
        toast.success('Đã xóa cuộc trò chuyện');
      } else {
        toast.error('Không thể xóa cuộc trò chuyện');
      }
    }
  };

  const renameConversation = async (conversationId, newTitle) => {
    try {
      console.log('🔍 Renaming conversation:', conversationId, 'to:', newTitle);
      const response = await updateConversationTitle(conversationId, newTitle);
      
      // Axios response structure
      if (response.status >= 200 && response.status < 300) {
        console.log('✅ Conversation renamed successfully in database');
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, title: newTitle, updatedAt: new Date() }
              : conv
          )
        );
        toast.success('Đã đổi tên cuộc trò chuyện');
      } else {
        console.log('🔍 Rename response not ok, status:', response.status);
        console.log('🔍 Response data:', response.data);
        // Still update in local state even if backend fails
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, title: newTitle, updatedAt: new Date() }
              : conv
          )
        );
        toast.success('Đã đổi tên cuộc trò chuyện (local)');
      }
    } catch (error) {
      console.error('❌ Error renaming conversation:', error);
      // Still update in local state even if backend fails
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, title: newTitle, updatedAt: new Date() }
            : conv
        )
      );
      toast.success('Đã đổi tên cuộc trò chuyện (local)');
    }
  };

  const cleanupConversations = async () => {
    try {
      console.log('🔍 Cleaning up empty conversations...');
      const response = await cleanupEmptyConversations();
      
      if (response.status >= 200 && response.status < 300) {
        const deletedCount = response.data.data.deletedCount;
        console.log('✅ Cleaned up', deletedCount, 'empty conversations');
        
        // Reload conversations to reflect changes
        await loadUserConversations();
        
        toast.success(`Đã dọn dẹp ${deletedCount} cuộc trò chuyện trống`);
      } else {
        console.log('🔍 Cleanup response not ok, status:', response.status);
        toast.error('Không thể dọn dẹp cuộc trò chuyện');
      }
    } catch (error) {
      console.error('❌ Error cleaning up conversations:', error);
      toast.error('Không thể dọn dẹp cuộc trò chuyện');
    }
  };

  const handleSendMessage = useCallback(async (userMessage, messageContent) => {
    console.log('🔍 handleSendMessage called:', { 
      currentConversationId, 
      messageContent: messageContent.substring(0, 50),
      userMessage 
    });
    
    // If no conversation, create one first
    if (!currentConversationId) {
      console.log('🔍 No conversation selected, creating new one...');
      await createNewConversation();
      // Wait a bit for conversation to be created
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Show welcome message if this is the first message
    if (messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
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
      };
      setMessages([welcomeMessage, userMessage]);
    }
    
    // Clear any previous streaming state and don't show streaming
    setStreamingMessage('');
    setIsStreaming(false);

    // Update conversation title if this is the first user message (not welcome)
    if (messages.length === 0 || (messages.length === 1 && messages[0].agent === 'welcome')) {
      const conversationTitle = generateConversationTitle(messageContent);
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversationId 
            ? { ...conv, title: conversationTitle }
            : conv
        )
      );
    }

    // Save user message to database
    try {
      await saveMessage(currentConversationId, 'user', messageContent);
    } catch (error) {
      console.error('Error saving user message:', error);
    }

    try {
      console.log('🔍 Sending message to chatbot API...');
      console.log('🔍 Conversation ID:', currentConversationId);
      console.log('🔍 Message:', messageContent);
      
      const response = await sendChatbotMessage(currentConversationId, messageContent);
      
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
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Remove 'data: ' prefix
              const data = JSON.parse(jsonStr);
              
              console.log('🔍 Parsed streaming data:', data);
              
              if (data.type === 'chunk') {
                streamedContent = data.content;
                // Don't show streaming, just collect content
                console.log('🔍 Streaming chunk (hidden):', streamedContent);
              } else if (data.type === 'final') {
                finalMessage = data.content;
                console.log('🔍 Final message:', finalMessage);
                
                // Clear streaming state first
                setStreamingMessage('');
                setIsStreaming(false);
                
                // Then add final message to messages array
                setMessages(prev => [...prev, {
                  id: Date.now() + 1,
                  type: 'bot',
                  content: finalMessage,
                  timestamp: new Date(),
                  agent: currentAgent
                }]);

                // Save bot message to database
                try {
                  await saveMessage(currentConversationId, 'bot', finalMessage, currentAgent);
                } catch (error) {
                  console.error('Error saving bot message:', error);
                }
              }
            } catch (e) {
              console.warn('Failed to parse streaming data:', e);
            }
          }
        }
      }

      // Generate smart conversation title
      const conversationTitle = generateConversationTitle(messageContent);
      
      // Update conversation in UI
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentConversationId 
            ? { 
                ...conv, 
                title: conversationTitle,
                updatedAt: new Date(),
                messageCount: (conv.messageCount || 0) + 2 // user + bot message
              }
            : conv
        )
      );

      // Update conversation title in backend
      try {
        await updateConversationTitle(currentConversationId, conversationTitle);
        console.log('✅ Conversation title updated in database:', conversationTitle);
        
        // Also update in local state immediately
        setConversations(prev => 
          prev.map(conv => 
            conv.id === currentConversationId 
              ? { ...conv, title: conversationTitle }
              : conv
          )
        );
      } catch (error) {
        console.error('❌ Error updating conversation title:', error);
        // Still update in local state even if backend fails
        setConversations(prev => 
          prev.map(conv => 
            conv.id === currentConversationId 
              ? { ...conv, title: conversationTitle }
              : conv
          )
        );
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

      // Save error message to database
      try {
        await saveMessage(currentConversationId, 'bot', errorMessage.content, 'error');
      } catch (saveError) {
        console.error('Error saving error message:', saveError);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
      setCurrentAgent(null);
    }
  }, [currentConversationId, currentAgent]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <AnimatePresence>
        <motion.div
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          exit={{ x: -320 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex-shrink-0"
        >
          <ConversationSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={selectConversation}
            onNewConversation={createNewConversation}
            onDeleteConversation={deleteConversationHandler}
            onRenameConversation={renameConversation}
            onCleanupConversations={cleanupConversations}
          />
        </motion.div>
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatArea
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isStreaming={false}
          streamingMessage=""
          conversationId={currentConversationId}
          onNewConversation={createNewConversation}
        />
      </div>
    </div>
  );
};

export default ChatbotFullPage; 