import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { io } from 'socket.io-client';

const FocusPartyRooms = ({ isOpen, onClose }) => {
  const { theme, currentTheme } = useTheme();
  const { user } = useAuth();
  const [activeRooms, setActiveRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [pomodoroTimer, setPomodoroTimer] = useState({ minutes: 25, seconds: 0, isActive: false, isBreak: false });
  const [participants, setParticipants] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ name: '', subject: '', maxParticipants: 8, isPrivate: false });
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize socket connection
      socketRef.current = io('/focus-rooms', {
        auth: { token: localStorage.getItem('token') }
      });

      socketRef.current.on('roomsList', setActiveRooms);
      socketRef.current.on('roomJoined', handleRoomJoined);
      socketRef.current.on('newMessage', handleNewMessage);
      socketRef.current.on('participantJoined', handleParticipantJoined);
      socketRef.current.on('participantLeft', handleParticipantLeft);
      socketRef.current.on('timerSync', handleTimerSync);

      fetchActiveRooms();

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let interval = null;
    if (pomodoroTimer.isActive) {
      interval = setInterval(() => {
        setPomodoroTimer(prev => {
          if (prev.seconds === 0) {
            if (prev.minutes === 0) {
              // Timer finished
              const newIsBreak = !prev.isBreak;
              const newMinutes = newIsBreak ? 5 : 25; // 5 min break, 25 min work
              
              // Notify room about timer completion
              if (socketRef.current && currentRoom) {
                socketRef.current.emit('timerCompleted', {
                  roomId: currentRoom.id,
                  isBreak: newIsBreak
                });
              }
              
              return {
                minutes: newMinutes,
                seconds: 0,
                isActive: false,
                isBreak: newIsBreak
              };
            } else {
              return {
                ...prev,
                minutes: prev.minutes - 1,
                seconds: 59
              };
            }
          } else {
            return {
              ...prev,
              seconds: prev.seconds - 1
            };
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pomodoroTimer.isActive, currentRoom]);

  const fetchActiveRooms = async () => {
    try {
      const response = await fetch('/api/focus-rooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setActiveRooms(data.rooms);
      } else {
        console.error('Failed to fetch rooms:', data.message);
        setActiveRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setActiveRooms([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRoomJoined = (roomData) => {
    setCurrentRoom(roomData.room);
    setParticipants(roomData.participants);
    setMessages(roomData.messages || []);
    setPomodoroTimer(roomData.timer || { minutes: 25, seconds: 0, isActive: false, isBreak: false });
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleParticipantJoined = (participant) => {
    setParticipants(prev => [...prev, participant]);
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      content: `${participant.name} joined the room`,
      timestamp: new Date()
    }]);
  };

  const handleParticipantLeft = (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    setParticipants(prev => prev.filter(p => p.id !== participantId));
    if (participant) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `${participant.name} left the room`,
        timestamp: new Date()
      }]);
    }
  };

  const handleTimerSync = (timerData) => {
    setPomodoroTimer(timerData);
  };

  const joinRoom = (roomId) => {
    if (socketRef.current) {
      socketRef.current.emit('joinRoom', roomId);
    }
  };

  const leaveRoom = () => {
    if (socketRef.current && currentRoom) {
      socketRef.current.emit('leaveRoom', currentRoom.id);
      setCurrentRoom(null);
      setParticipants([]);
      setMessages([]);
      setPomodoroTimer({ minutes: 25, seconds: 0, isActive: false, isBreak: false });
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current || !currentRoom) return;

    const message = {
      roomId: currentRoom.id,
      content: newMessage,
      timestamp: new Date()
    };

    socketRef.current.emit('sendMessage', message);
    setNewMessage('');
  };

  const startTimer = () => {
    if (socketRef.current && currentRoom) {
      socketRef.current.emit('startTimer', currentRoom.id);
      setPomodoroTimer(prev => ({ ...prev, isActive: true }));
    }
  };

  const pauseTimer = () => {
    if (socketRef.current && currentRoom) {
      socketRef.current.emit('pauseTimer', currentRoom.id);
      setPomodoroTimer(prev => ({ ...prev, isActive: false }));
    }
  };

  const resetTimer = () => {
    if (socketRef.current && currentRoom) {
      socketRef.current.emit('resetTimer', currentRoom.id);
      setPomodoroTimer({ minutes: 25, seconds: 0, isActive: false, isBreak: false });
    }
  };

  const createRoom = async () => {
    if (!newRoomData.name.trim()) return;

    try {
      const response = await fetch('/api/focus-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newRoomData)
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateRoom(false);
        setNewRoomData({ name: '', subject: '', maxParticipants: 8, isPrivate: false });
        fetchActiveRooms();
        joinRoom(data.room.id);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const formatTime = (minutes, seconds) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSubjectEmoji = (subject) => {
    const emojiMap = {
      'Mathematics': '🔢',
      'Physics': '⚛️',
      'Chemistry': '🧪',
      'Biology': '🧬',
      'Programming': '💻',
      'Literature': '📚',
      'History': '📜',
      'Art': '🎨',
      'Music': '🎵'
    };
    return emojiMap[subject] || '📖';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`max-w-6xl w-full max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
            currentTheme === 'neon' 
              ? 'bg-gray-900 border border-cyan-500/30' 
              : 'bg-white border border-gray-200'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 border-b ${
            currentTheme === 'neon' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${
                  currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                }`}>
                  🎯 Focus Party Rooms
                </h2>
                <p className={`mt-1 ${
                  currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {currentRoom ? `In room: ${currentRoom.name}` : 'Join a focus room or create your own'}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {!currentRoom && (
                  <button
                    onClick={() => setShowCreateRoom(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentTheme === 'neon'
                        ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    + Create Room
                  </button>
                )}
                
                {currentRoom && (
                  <button
                    onClick={leaveRoom}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentTheme === 'neon'
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    Leave Room
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className={`p-2 rounded-full transition-colors ${
                    currentTheme === 'neon' 
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {!currentRoom ? (
            /* Room List */
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeRooms.map((room) => (
                  <motion.div
                    key={room.id}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                      currentTheme === 'neon'
                        ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => joinRoom(room.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getSubjectEmoji(room.subject)}</span>
                        <div>
                          <h3 className={`font-semibold ${
                            currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {room.name}
                          </h3>
                          <p className={`text-sm ${
                            currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {room.subject}
                          </p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        room.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {room.isActive ? 'Active' : 'Waiting'}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${
                          currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Participants
                        </span>
                        <span className={`text-sm font-medium ${
                          currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {room.participants}/{room.maxParticipants}
                        </span>
                      </div>

                      <div className={`w-full bg-gray-200 rounded-full h-2 ${
                        currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(room.participants / room.maxParticipants) * 100}%` }}
                        />
                      </div>

                      {room.currentTimer && (
                        <div className={`text-center p-3 rounded-lg ${
                          currentTheme === 'neon' ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <div className={`text-lg font-mono font-bold ${
                            room.currentTimer.isBreak 
                              ? 'text-green-500' 
                              : currentTheme === 'neon' ? 'text-cyan-400' : 'text-blue-600'
                          }`}>
                            {formatTime(room.currentTimer.minutes, room.currentTimer.seconds)}
                          </div>
                          <div className={`text-xs ${
                            currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {room.currentTimer.isBreak ? 'Break Time' : 'Focus Time'}
                          </div>
                        </div>
                      )}

                      <div className={`text-xs ${
                        currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Host: {room.host}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {activeRooms.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                  }`}>
                    No Active Rooms
                  </h3>
                  <p className={`mb-4 ${
                    currentTheme === 'neon' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Be the first to create a focus room!
                  </p>
                  <button
                    onClick={() => setShowCreateRoom(true)}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      currentTheme === 'neon'
                        ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    Create First Room
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Room Interface */
            <div className="flex h-[calc(90vh-120px)]">
              {/* Main Area */}
              <div className="flex-1 flex flex-col">
                {/* Pomodoro Timer */}
                <div className={`p-6 border-b ${
                  currentTheme === 'neon' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className="text-center">
                    <div className={`text-6xl font-mono font-bold mb-4 ${
                      pomodoroTimer.isBreak 
                        ? 'text-green-500' 
                        : currentTheme === 'neon' ? 'text-cyan-400' : 'text-blue-600'
                    }`}>
                      {formatTime(pomodoroTimer.minutes, pomodoroTimer.seconds)}
                    </div>
                    
                    <div className={`text-lg font-semibold mb-4 ${
                      currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {pomodoroTimer.isBreak ? '☕ Break Time' : '🎯 Focus Time'}
                    </div>
                    
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={pomodoroTimer.isActive ? pauseTimer : startTimer}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          currentTheme === 'neon'
                            ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {pomodoroTimer.isActive ? '⏸️ Pause' : '▶️ Start'}
                      </button>
                      <button
                        onClick={resetTimer}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          currentTheme === 'neon'
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-500 text-white hover:bg-gray-600'
                        }`}
                      >
                        🔄 Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((message) => {
                      // Handle both user_id and userId field names from backend
                      const messageUserId = message.user_id || message.userId;
                      
                      return (
                        <div
                          key={message.id}
                          className={`${
                            message.type === 'system' 
                              ? 'text-center' 
                              : messageUserId === user?.id 
                                ? 'flex justify-end' 
                                : 'flex justify-start'
                          }`}
                        >
                          {message.type === 'system' ? (
                            <div className={`text-sm italic ${
                              currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {message.content}
                            </div>
                          ) : (
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              messageUserId === user?.id
                                ? currentTheme === 'neon'
                                  ? 'bg-cyan-500 text-white'
                                  : 'bg-blue-500 text-white'
                                : currentTheme === 'neon'
                                  ? 'bg-gray-700 text-white'
                                  : 'bg-gray-200 text-gray-900'
                            }`}>
                              <div className="font-semibold text-xs mb-1">
                                {message.userName}
                              </div>
                              <div>{message.content}</div>
                              <div className={`text-xs mt-1 opacity-75`}>
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className={`p-4 border-t ${
                    currentTheme === 'neon' ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                          currentTheme === 'neon'
                            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          !newMessage.trim()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : currentTheme === 'neon'
                              ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants Sidebar */}
              <div className={`w-64 p-4 border-l ${
                currentTheme === 'neon' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
              }`}>
                <h3 className={`font-semibold mb-4 ${
                  currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                }`}>
                  Participants ({participants.length})
                </h3>
                
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg ${
                        currentTheme === 'neon' ? 'bg-gray-700' : 'bg-white'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        participant.isHost 
                          ? 'bg-yellow-500 text-white' 
                          : currentTheme === 'neon'
                            ? 'bg-cyan-500 text-white'
                            : 'bg-blue-500 text-white'
                      }`}>
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${
                          currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {participant.name}
                          {participant.isHost && ' 👑'}
                        </div>
                        <div className={`text-xs ${
                          participant.isActive 
                            ? 'text-green-500' 
                            : currentTheme === 'neon' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {participant.isActive ? 'Active' : 'Away'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Create Room Modal */}
          <AnimatePresence>
            {showCreateRoom && (
              <motion.div
                className="absolute inset-0 bg-black/50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className={`p-6 rounded-xl max-w-md w-full mx-4 ${
                    currentTheme === 'neon' ? 'bg-gray-800 border border-cyan-500/30' : 'bg-white'
                  }`}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                >
                  <h3 className={`text-xl font-bold mb-4 ${
                    currentTheme === 'neon' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Create Focus Room
                  </h3>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Room name"
                      value={newRoomData.name}
                      onChange={(e) => setNewRoomData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        currentTheme === 'neon'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    
                    <select
                      value={newRoomData.subject}
                      onChange={(e) => setNewRoomData(prev => ({ ...prev, subject: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        currentTheme === 'neon'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select subject</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Programming">Programming</option>
                      <option value="Literature">Literature</option>
                      <option value="History">History</option>
                      <option value="Other">Other</option>
                    </select>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
                      }`}>
                        Max Participants: {newRoomData.maxParticipants}
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="20"
                        value={newRoomData.maxParticipants}
                        onChange={(e) => setNewRoomData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newRoomData.isPrivate}
                        onChange={(e) => setNewRoomData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                        className="rounded"
                      />
                      <span className={`text-sm ${
                        currentTheme === 'neon' ? 'text-white' : 'text-gray-700'
                      }`}>
                        Private room (invite only)
                      </span>
                    </label>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowCreateRoom(false)}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                        currentTheme === 'neon' 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createRoom}
                      disabled={!newRoomData.name.trim()}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        !newRoomData.name.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : currentTheme === 'neon'
                            ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Create Room
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FocusPartyRooms;
