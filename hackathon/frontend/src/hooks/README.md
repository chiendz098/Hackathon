# Auto-Scroll Hook Documentation

## useAutoScroll Hook

Hook tùy chỉnh để quản lý auto-scroll cho các component chat, đảm bảo tin nhắn mới nhất luôn hiển thị khi có tin nhắn mới.

### Tính năng

- ✅ Tự động cuộn xuống tin nhắn mới nhất khi mở chat
- ✅ Tự động cuộn khi có tin nhắn mới (nếu user đang ở cuối chat)
- ✅ Không tự động cuộn nếu user đang xem tin nhắn cũ
- ✅ Smooth scrolling với animation mượt mà
- ✅ Có thể tùy chỉnh delay và behavior
- ✅ Tự động cleanup khi component unmount

### Cách sử dụng

```jsx
import useAutoScroll from '../../hooks/useAutoScroll';

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  
  // Sử dụng hook với cấu hình mặc định
  const { messagesEndRef, messagesContainerRef, scrollToBottom, handleScroll } = useAutoScroll(messages);
  
  return (
    <div 
      className="messages-container"
      ref={messagesContainerRef}
      onScroll={handleScroll}
    >
      {messages.map(message => (
        <div key={message.id}>{message.content}</div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
```

### Options

```jsx
const { messagesEndRef, messagesContainerRef, scrollToBottom, handleScroll } = useAutoScroll(messages, {
  enabled: true,              // Bật/tắt auto-scroll
  smooth: true,               // Sử dụng smooth scrolling
  scrollOnMount: true,        // Tự động cuộn khi component mount
  scrollOnNewMessage: true,   // Tự động cuộn khi có tin nhắn mới
  delay: 100                  // Delay trước khi cuộn (ms)
});
```

### Return Values

- `messagesEndRef`: Ref để đặt ở cuối danh sách tin nhắn
- `messagesContainerRef`: Ref để đặt ở container chứa tin nhắn
- `scrollToBottom`: Function để cuộn xuống cuối (có thể force)
- `handleScroll`: Function để handle scroll event
- `isUserScrolling`: Boolean cho biết user có đang cuộn không

### Các Component đã được cập nhật

- ✅ `Chat.jsx` - Trang chat chính
- ✅ `NotionStyleChatBox.jsx` - Chat box kiểu Notion
- ✅ `AIAssistant.jsx` - AI Assistant chat
- ✅ `RealTimeChat.jsx` - Real-time chat
- ✅ `AdvancedChatSystem.jsx` - Advanced chat system
- ✅ `RealTimeCollaboration.jsx` - Real-time collaboration
- ✅ `LearningPlannerChatbot.jsx` - Learning planner chatbot
- ✅ `AIChatTodoCreator.jsx` - AI chat todo creator
- ✅ `EnhancedStudyRoomInterface.jsx` - Study room interface

### Lưu ý

1. Đảm bảo đặt `messagesEndRef` ở cuối danh sách tin nhắn
2. Đặt `messagesContainerRef` ở container có `overflow-y-auto`
3. Gọi `handleScroll` trong `onScroll` event của container
4. Hook sẽ tự động detect khi user cuộn lên để xem tin nhắn cũ
5. Chỉ tự động cuộn khi user đang ở gần cuối chat

### Ví dụ hoàn chỉnh

```jsx
import React, { useState } from 'react';
import useAutoScroll from '../../hooks/useAutoScroll';

const ChatExample = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const { messagesEndRef, messagesContainerRef, scrollToBottom, handleScroll } = useAutoScroll(messages, {
    enabled: true,
    smooth: true,
    scrollOnMount: true,
    scrollOnNewMessage: true,
    delay: 100
  });

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now(),
      content: newMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  return (
    <div className="chat-container">
      {/* Messages Container */}
      <div 
        className="messages-list"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.map(message => (
          <div key={message.id} className="message">
            {message.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="input-area">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Nhập tin nhắn..."
        />
        <button onClick={sendMessage}>Gửi</button>
      </div>
    </div>
  );
};
``` 