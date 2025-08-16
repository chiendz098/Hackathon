const sequelize = require('../config/database');

// Import core models
const User = require('./User')(sequelize);
const Todo = require('./Todo')(sequelize);
const Post = require('./Post')(sequelize);

const Achievement = require('./Achievement')(sequelize);
const UserAchievement = require('./UserAchievement')(sequelize);
const UserProgress = require('./UserProgress')(sequelize);
const Group = require('./Group')(sequelize);
const GroupMembers = require('./GroupMembers')(sequelize);
const GroupInvitation = require('./GroupInvitation')(sequelize);
const TodoCollaboration = require('./TodoCollaboration')(sequelize);
const TodoInsight = require('./TodoInsight')(sequelize);
const Message = require('./Message')(sequelize);
const Notification = require('./Notification')(sequelize);
const Comment = require('./Comment')(sequelize);
const TodoComment = require('./TodoComment')(sequelize);
const Vote = require('./Vote')(sequelize);
const TimeEntry = require('./TimeEntry')(sequelize);
const UserProfile = require('./UserProfile')(sequelize);
const Friendship = require('./Friendship')(sequelize);
const ActivityFeed = require('./ActivityFeed')(sequelize);

// Import classroom models
const Classroom = require('./Classroom')(sequelize);
const ClassroomStudent = require('./ClassroomStudent')(sequelize);
const TodoAssignment = require('./TodoAssignment')(sequelize);
const TodoSubmission = require('./TodoSubmission')(sequelize);

// Import gamification models
const ShopItem = require('./ShopItem')(sequelize);
const UserPurchase = require('./UserPurchase');
const Pet = require('./Pet')(sequelize);
const UserPet = require('./UserPet')(sequelize);
const DailyReward = require('./DailyReward')(sequelize);
const UserDailyReward = require('./UserDailyReward')(sequelize);
const UserAnalytics = require('./UserAnalytics')(sequelize);
const FocusSession = require('./FocusSession')(sequelize);
const Theme = require('./Theme')(sequelize);
const ProfileDecoration = require('./ProfileDecoration')(sequelize);

// Import new models (these are already initialized)
const UserDecoration = require('./UserDecoration');
const Decoration = require('./Decoration');
const UserEffect = require('./UserEffect');

// Import chat models
const ChatRoom = require('./ChatRoom')(sequelize);
const ChatParticipant = require('./ChatParticipant')(sequelize);
const ChatMessage = require('./ChatMessage')(sequelize);
const MessageReaction = require('./MessageReaction')(sequelize);
const MessageRead = require('./MessageRead')(sequelize);
const CallSession = require('./CallSession')(sequelize);

// Import advanced chat models
const MessageEditHistory = require('./MessageEditHistory')(sequelize);
const PinnedMessage = require('./PinnedMessage')(sequelize);
const ScheduledMessage = require('./ScheduledMessage')(sequelize);
const ChatModerator = require('./ChatModerator')(sequelize);
const ChatBan = require('./ChatBan')(sequelize);
const ChatMute = require('./ChatMute')(sequelize);
const PushNotification = require('./PushNotification')(sequelize);

// Import chatbot models
const ChatbotConversation = require('./ChatbotConversation')(sequelize);
const ChatbotMessage = require('./ChatbotMessage')(sequelize);



// Setup models object
const models = {
  // Core models
  User, Todo, Post,
  Achievement, UserAchievement, UserProgress, Group, GroupMembers, GroupInvitation, 
  TodoCollaboration, TodoInsight, Message, Notification, Comment, TodoComment, Vote, TimeEntry, UserProfile, Friendship, ActivityFeed,
  // Classroom models
  Classroom, ClassroomStudent, TodoAssignment, TodoSubmission,
  // Gamification models
  ShopItem, UserPurchase, Pet, UserPet, DailyReward, UserDailyReward,
  UserAnalytics, FocusSession, Theme, ProfileDecoration,
  // New models
  UserDecoration, Decoration, UserEffect,
  // Chat models
  ChatRoom, ChatParticipant, ChatMessage, MessageReaction, MessageRead, CallSession,
  // Advanced chat models
  MessageEditHistory, PinnedMessage, ScheduledMessage, ChatModerator, ChatBan, ChatMute, PushNotification,
  // Chatbot models
  ChatbotConversation, ChatbotMessage,

};

// Setup associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// Database connection function
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Sync database with models - temporarily disabled due to schema issues
    // await sequelize.sync({ alter: true, force: false });
    console.log('⚠️ Database sync disabled - using manual schema management');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Force reload User model to clear cache
const reloadUserModel = () => {
  // Clear require cache for User model
  delete require.cache[require.resolve('./User')];
  
  // Reload User model
  const newUser = require('./User')(sequelize);
  
  // Update models object
  models.User = newUser;
  
  // Re-run associations for User
  if (newUser.associate) {
    newUser.associate(models);
  }
  
  console.log('✅ User model reloaded successfully');
  return newUser;
};

module.exports = {
  sequelize,
  connectDB,
  reloadUserModel,
  ...models
};