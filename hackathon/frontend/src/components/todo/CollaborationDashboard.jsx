import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Bell, 
  Share2, 
  FileText, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  Paperclip,
  Smile,
  Image,
  Video,
  File,
  Mic,
  Phone,
  Video as VideoIcon,
  Search,
  Filter,
  Settings,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckSquare,
  Square as SquareIcon,
  Circle,
  MinusCircle,
  PlusCircle,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  GitCompare,
  GitBranchPlus,
  GitCommitPlus,
  GitPullRequestPlus,
  GitMergePlus,
  GitComparePlus,
  GitBranchMinus,
  GitCommitMinus,
  GitPullRequestMinus,
  GitMergeMinus,
  GitCompareMinus,
  UserCheck,
  UserX,
  UserCog,
  Shield,
  Crown,
  Briefcase,
  GraduationCap,
  Heart,
  Palette,
  Code,
  BookOpen,
  Camera,
  Music,
  Gamepad2,
  Utensils,
  Car,
  Plane,
  Train,
  Bus,
  Bike,
  Walk,
  Run,
  Swimming,
  Dumbbell,
  Yoga,
  Meditation,
  Sleep,
  Coffee,
  Wine,
  Beer,
  Cocktail,
  Pizza,
  Hamburger,
  Sushi,
  IceCream,
  Cake,
  Cookie,
  Candy,
  Apple,
  Banana,
  Orange,
  Grape,
  Strawberry,
  Watermelon,
  Pineapple,
  Mango,
  Coconut,
  Avocado,
  Broccoli,
  Carrot,
  Potato,
  Tomato,
  Onion,
  Garlic,
  Ginger,
  Pepper,
  Salt,
  Sugar,
  Flour,
  Egg,
  Milk,
  Cheese,
  Butter,
  Oil,
  Vinegar,
  SoySauce,
  Ketchup,
  Mustard,
  Mayo,
  HotSauce,
  BBQ,
  Ranch,
  Caesar,
  ThousandIsland,
  BlueCheese,
  Italian,
  French,
  Asian,
  Mexican,
  Indian,
  Thai,
  Japanese,
  Chinese,
  Korean,
  Vietnamese,
  Thai,
  Indian,
  Italian,
  French,
  Spanish,
  German,
  British,
  American,
  Canadian,
  Australian,
  Brazilian,
  Argentine,
  Chilean,
  Peruvian,
  Colombian,
  Venezuelan,
  Ecuadorian,
  Bolivian,
  Paraguayan,
  Uruguayan,
  Guyanese,
  Surinamese,
  FrenchGuianese,
  FalklandIslander,
  SouthGeorgian,
  SouthSandwichIslander,
  Tristanian,
  SaintHelenian,
  AscensionIslander,
  GoughIslander,
  InaccessibleIslander,
  NightingaleIslander,
  MiddleIslander,
  StoltenhoffIslander,
  SouthAfrican,
  Namibian,
  Botswanan,
  Zimbabwean,
  Zambian,
  Malawian,
  Mozambican,
  Tanzanian,
  Kenyan,
  Ugandan,
  Rwandan,
  Burundian,
  Congolese,
  CentralAfrican,
  Chadian,
  Cameroonian,
  Nigerian,
  Beninese,
  Togolese,
  Ghanian,
  Ivorian,
  Liberian,
  SierraLeonean,
  Guinean,
  GuineanBissauan,
  Senegalese,
  Gambian,
  Malian,
  Burkinabe,
  Nigerien,
  Chadian,
  Sudanese,
  SouthSudanese,
  Ethiopian,
  Eritrean,
  Djiboutian,
  Somalian,
  Kenyan,
  Ugandan,
  Rwandan,
  Burundian,
  Congolese,
  CentralAfrican,
  Chadian,
  Cameroonian,
  Nigerian,
  Beninese,
  Togolese,
  Ghanian,
  Ivorian,
  Liberian,
  SierraLeonean,
  Guinean,
  GuineanBissauan,
  Senegalese,
  Gambian,
  Malian,
  Burkinabe,
  Nigerien,
  Chadian,
  Sudanese,
  SouthSudanese,
  Ethiopian,
  Eritrean,
  Djiboutian,
  Somalian,
  Kenyan,
  Ugandan,
  Rwandan,
  Burundian,
  Congolese,
  CentralAfrican,
  Chadian,
  Cameroonian,
  Nigerian,
  Beninese,
  Togolese,
  Ghanian,
  Ivorian,
  Liberian,
  SierraLeonean,
  Guinean,
  GuineanBissauan,
  Senegalese,
  Gambian,
  Malian,
  Burkinabe,
  Nigerien,
  Chadian,
  Sudanese,
  SouthSudanese,
  Ethiopian,
  Eritrean,
  Djiboutian,
  Somalian
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

const CollaborationDashboard = ({ group, onUpdate }) => {
  const { user } = useAuth();
  const { get, post } = useApi();
  
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [files, setFiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    type: 'meeting'
  });

  useEffect(() => {
    if (group) {
      loadCollaborationData();
    }
  }, [group]);

  const loadCollaborationData = async () => {
    try {
      // Load members
      const membersResponse = await get(`/groups/${group.id}/members`);
      if (membersResponse?.data) {
        setMembers(membersResponse.data);
      }
      
      // Load messages
      const messagesResponse = await get(`/groups/${group.id}/messages`);
      if (messagesResponse?.data) {
        setMessages(messagesResponse.data);
      }
      
      // Load files
      const filesResponse = await get(`/groups/${group.id}/files`);
      if (filesResponse?.data) {
        setFiles(filesResponse.data);
      }
      
      // Load events
      const eventsResponse = await get(`/groups/${group.id}/events`);
      if (eventsResponse?.data) {
        setEvents(eventsResponse.data);
      }
      
      // Load notifications
      const notificationsResponse = await get(`/groups/${group.id}/notifications`);
      if (notificationsResponse?.data) {
        setNotifications(notificationsResponse.data);
      }
      
    } catch (error) {
      console.error('Error loading collaboration data:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const response = await post(`/groups/${group.id}/messages`, {
        content: newMessage,
        type: 'text'
      });
      
      if (response.success) {
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const createEvent = async () => {
    try {
      const response = await post(`/groups/${group.id}/events`, eventForm);
      
      if (response.success) {
        setEvents(prev => [...prev, response.data]);
        setEventForm({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          type: 'meeting'
        });
        setShowEventForm(false);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const renderChat = () => (
    <div className="flex flex-col h-96">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => {
          // Handle both user_id and userId field names from backend
          const messageUserId = message.user_id || message.userId;
          const messageCreatedAt = message.created_at || message.createdAt;
          
          return (
            <div key={message.id} className={`flex ${messageUserId === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                messageUserId === user.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs opacity-75">
                    {message.user?.name || 'Unknown'}
                  </span>
                  <span className="text-xs opacity-75">
                    {new Date(messageCreatedAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <Paperclip className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <Smile className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(member => (
          <div key={member.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <span className="text-sm font-medium text-gray-600">
                      {member.name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  onlineMembers.includes(member.id) ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{member.name}</h4>
                <p className="text-sm text-gray-500">{member.role}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {onlineMembers.includes(member.id) ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                  <VideoIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFiles = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">Shared Files</h4>
        <button
          onClick={() => setShowFileUpload(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Upload File</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map(file => (
          <div key={file.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">{file.name}</h5>
                <p className="text-sm text-gray-500">{file.size}</p>
                <p className="text-xs text-gray-400">
                  Uploaded by {file.uploadedBy?.name}
                </p>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">Upcoming Events</h4>
        <button
          onClick={() => setShowEventForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Event</span>
        </button>
      </div>
      
      <div className="space-y-3">
        {events.map(event => (
          <div key={event.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">{event.title}</h5>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                event.type === 'meeting' ? 'bg-blue-100 text-blue-700' :
                event.type === 'deadline' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {event.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-3">
      {notifications.map(notification => (
        <div key={notification.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${
              notification.type === 'info' ? 'bg-blue-100 text-blue-600' :
              notification.type === 'success' ? 'bg-green-100 text-green-600' :
              notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
              'bg-red-100 text-red-600'
            }`}>
              {notification.type === 'info' && <Bell className="h-4 w-4" />}
              {notification.type === 'success' && <CheckCircle className="h-4 w-4" />}
              {notification.type === 'warning' && <AlertCircle className="h-4 w-4" />}
              {notification.type === 'error' && <AlertCircle className="h-4 w-4" />}
            </div>
            
            <div className="flex-1">
              <h5 className="font-medium text-gray-900">{notification.title}</h5>
              <p className="text-sm text-gray-600">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
            
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Collaboration Dashboard</h2>
            <p className="text-sm text-gray-500">
              Team communication and coordination for {group?.name}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Settings className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          {[
            { id: 'chat', label: 'Team Chat', icon: MessageSquare },
            { id: 'team', label: 'Team Members', icon: Users },
            { id: 'files', label: 'Shared Files', icon: FileText },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'notifications', label: 'Notifications', icon: Bell }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderChat()}
            </motion.div>
          )}

          {activeTab === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderTeam()}
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div
              key="files"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderFiles()}
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderEvents()}
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderNotifications()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Event Form Modal */}
      <AnimatePresence>
        {showEventForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowEventForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Event</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Event title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Event description"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={eventForm.startDate}
                        onChange={(e) => setEventForm(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="datetime-local"
                        value={eventForm.endDate}
                        onChange={(e) => setEventForm(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type
                    </label>
                    <select
                      value={eventForm.type}
                      onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="meeting">Meeting</option>
                      <option value="deadline">Deadline</option>
                      <option value="milestone">Milestone</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowEventForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createEvent}
                    disabled={!eventForm.title || !eventForm.startDate || !eventForm.endDate}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollaborationDashboard; 