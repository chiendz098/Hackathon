import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Users, Shield, Clock, Star, Search, 
  Settings, Plus, ArrowLeft, Crown, Bell, Pin, Reply, Edit, Link, Forward, Eye
} from 'lucide-react';
import AdvancedChatSystem from '../components/chat/AdvancedChatSystem';

const AdvancedChatDemo = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showChat, setShowChat] = useState(false);
  
  // Mock data for demo
  const demoRooms = [
    {
      id: 1,
      name: 'General Discussion',
      type: 'group',
      participants: 15,
      lastMessage: 'Hello everyone! 👋',
      lastMessageTime: '2 min ago',
      unreadCount: 3,
      isPinned: false
    },
    {
      id: 2,
      name: 'Project Alpha Team',
      type: 'group',
      participants: 8,
      lastMessage: 'Meeting scheduled for tomorrow',
      lastMessageTime: '1 hour ago',
      unreadCount: 0,
      isPinned: true
    },
    {
      id: 3,
      name: 'Study Group - Math',
      type: 'group',
      participants: 12,
      lastMessage: 'Can someone help with calculus?',
      lastMessageTime: '3 hours ago',
      unreadCount: 7,
      isPinned: false
    },
    {
      id: 4,
      name: 'Private Chat with John',
      type: 'private',
      participants: 2,
      lastMessage: 'Thanks for the help!',
      lastMessageTime: '1 day ago',
      unreadCount: 0,
      isPinned: false
    }
  ];

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Message Reactions',
      description: 'React to messages with emojis (👍❤️😂 etc.)',
      color: 'bg-blue-500'
    },
    {
      icon: <Reply className="w-6 h-6" />,
      title: 'Reply to Messages',
      description: 'Reply to specific messages with threading',
      color: 'bg-green-500'
    },
    {
      icon: <Edit className="w-6 h-6" />,
      title: 'Edit & Delete',
      description: 'Edit and delete messages with edit history',
      color: 'bg-yellow-500'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Mention Users',
      description: 'Mention users with @username',
      color: 'bg-purple-500'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Scheduled Messages',
      description: 'Schedule messages to be sent later',
      color: 'bg-indigo-500'
    },
    {
      icon: <Pin className="w-6 h-6" />,
      title: 'Pin Messages',
      description: 'Pin important messages for easy access',
      color: 'bg-red-500'
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Push Notifications',
      description: 'Real-time push notifications (PWA)',
      color: 'bg-pink-500'
    },
    {
      icon: <Link className="w-6 h-6" />,
      title: 'Link Preview',
      description: 'Automatic link previews in messages',
      color: 'bg-teal-500'
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Self-destruct Messages',
      description: 'Messages that disappear after X seconds',
      color: 'bg-orange-500'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Admin Controls',
      description: 'Moderator controls (mute, kick, ban)',
      color: 'bg-gray-500'
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: 'Message Search',
      description: 'Search messages by text, sender, date',
      color: 'bg-cyan-500'
    },
    {
      icon: <Forward className="w-6 h-6" />,
      title: 'Message Forwarding',
      description: 'Forward messages to other chats',
      color: 'bg-emerald-500'
    }
  ];

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedRoom(null);
  };

  if (showChat && selectedRoom) {
    return (
      <AdvancedChatSystem
        roomId={selectedRoom.id}
        roomName={selectedRoom.name}
        onClose={handleCloseChat}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Advanced Chat System Demo
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600"
          >
            Experience the next generation of chat features
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Features Overview */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Star className="w-6 h-6 mr-2 text-yellow-500" />
                Advanced Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className={`p-2 rounded-lg text-white ${feature.color}`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Chat Rooms */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <MessageSquare className="w-6 h-6 mr-2 text-blue-500" />
              Chat Rooms
            </h2>
            
            <div className="space-y-3">
              {demoRooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => handleRoomSelect(room)}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{room.name}</h3>
                      {room.isPinned && (
                        <Pin className="w-4 h-4 text-yellow-500" />
                      )}
                      {room.type === 'private' && (
                        <Shield className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {room.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1 truncate">
                    {room.lastMessage}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{room.participants} participants</span>
                    <span>{room.lastMessageTime}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <button className="w-full mt-4 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center">
              <Plus className="w-4 h-4 mr-2" />
              Create New Room
            </button>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">4</div>
            <div className="text-gray-600">Active Rooms</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">37</div>
            <div className="text-gray-600">Total Participants</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-2">12</div>
            <div className="text-gray-600">Advanced Features</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-500 mb-2">∞</div>
            <div className="text-gray-600">Possibilities</div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-600" />
            How to Test
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Getting Started:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Click on any chat room to open the advanced chat interface</li>
                <li>• Try sending messages and using reactions</li>
                <li>• Test reply, edit, and delete functionality</li>
                <li>• Schedule messages for future delivery</li>
                <li>• Pin important messages</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Advanced Features:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Use @mentions to tag users</li>
                <li>• Search through message history</li>
                <li>• Forward messages to other rooms</li>
                <li>• Test moderator controls (if you have permissions)</li>
                <li>• Experience real-time notifications</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdvancedChatDemo; 