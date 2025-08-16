import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-learning-backend.loca.lt';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log API configuration
console.log('🔗 API configured with base URL:', API_URL);
console.log('🔗 Full API base URL:', `${API_URL}/api`);

// Add request interceptor for authentication
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Debug logging for POST requests
  if (config.method === 'post' && config.data) {
    console.log('🔍 Request interceptor - URL:', config.url);
    console.log('🔍 Request interceptor - Data:', config.data);
    console.log('🔍 Request interceptor - Data type:', typeof config.data);
    console.log('🔍 Request interceptor - Headers:', config.headers);
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor for error handling
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401) {
    // Log unauthorized access but don't redirect automatically
    console.warn('⚠️ API request unauthorized (401) - token may be invalid or expired');
    // Only redirect if it's not a gamification endpoint
    if (!error.config.url.includes('/gamification') && !error.config.url.includes('/leaderboard')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

// ===== AUTHENTICATION =====
export const login = (email, password) => {
  const data = { email, password };
  console.log('🔍 Login request data:', data);
  console.log('🔍 Login request data type:', typeof data);
  console.log('🔍 Login request data stringified:', JSON.stringify(data));
  return api.post('/auth/login', data);
};
export const register = (name, email, password) => api.post('/auth/register', { name, email, password });
export const refreshToken = () => api.post('/auth/refresh');
export const logout = () => api.post('/auth/logout');

// ===== ENHANCED TODO SYSTEM =====
export const getTodos = (params = {}) => api.get('/todo', { params });
export const addTodo = data => {
  const config = data instanceof FormData ? {
    headers: { 'Content-Type': 'multipart/form-data' }
  } : {};
  return api.post('/todo', data, config);
};
export const updateTodo = (id, data) => {
  const config = data instanceof FormData ? {
    headers: { 'Content-Type': 'multipart/form-data' }
  } : {};
  return api.put(`/todo/${id}`, data, config);
};
export const deleteTodo = id => api.delete(`/todo/${id}`);
export const completeTodo = (id, completionData = {}) => api.post(`/todo/${id}/complete`, completionData);
export const bulkUpdateTodos = (action, todoIds, updateData = {}) =>
  api.post('/todo/bulk', { action, todoIds, updateData });

// Time Tracking
export const startTimer = (todoId, type = 'work', description = '') =>
  api.post(`/todo/${todoId}/timer/start`, { type, description });
export const stopTimer = (todoId) => api.post(`/todo/${todoId}/timer/stop`);
export const getTimeEntries = (todoId) => api.get(`/todo/${todoId}/time-entries`);

// Comments
export const getTodoComments = (todoId) => api.get(`/todo/${todoId}/comments`);
export const addTodoComment = (todoId, content, type = 'comment', metadata = {}) =>
  api.post(`/todo/${todoId}/comments`, { content, type, metadata });

// ===== GAMIFICATION SYSTEM =====
export const getUserProgress = () => api.get('/gamification/progress');
export const getAchievements = () => api.get('/gamification/achievements');
export const awardXP = (amount, reason, taskId) => api.post('/gamification/award-xp', { amount, reason, taskId });
export const spinDailyWheel = () => api.post('/gamification/spin-wheel');
export const spendCoins = (amount, item, itemType) => api.post('/gamification/spend-coins', { amount, item, itemType });
export const feedPet = () => api.post('/gamification/feed-pet');
export const getLeaderboard = () => api.get('/leaderboard');



// ===== PET SYSTEM =====
export const setActivePet = (petId) => api.post('/pets/set-active', { petId });
export const adoptPet = (petId, nickname) => api.post('/pets/adopt', { petId, nickname });
export const getUserPets = () => api.get('/pets/my-pets');
export const getActivePet = () => api.get('/pets/active');
export const getAvailablePets = () => api.get('/pets/available');
export const getPetEvolution = () => api.get('/pets/evolution');
export const getPetAchievements = () => api.get('/pets/achievements');
export const getPetQuests = () => api.get('/pets/quests');
export const getPetEvents = () => api.get('/pets/events');

// New gamification APIs
export const startStudySession = (sessionData) => api.post('/gamification/study-session/start', sessionData);
export const endStudySession = (sessionData) => api.post('/gamification/study-session/end', sessionData);
export const getGamificationStatistics = (timeframe = 'week') => api.get('/gamification/statistics', { params: { timeframe } });
export const getDailyRewards = () => api.get('/daily-rewards');
export const claimDailyReward = (rewardId) => api.post(`/daily-rewards/${rewardId}/claim`);
export const getPetSystem = () => api.get('/pets');
export const interactWithPet = (petId, action) => api.post(`/pets/${petId}/interact`, { action });

export const purchaseItem = (itemId, currency = 'coins') => api.post(`/shop/items/${itemId}/purchase`, { currency });
export const getAchievementProgress = (achievementId) => api.get(`/gamification/achievements/${achievementId}/progress`);
export const getStreakInfo = () => api.get('/gamification/streak');
export const getLevelInfo = () => api.get('/gamification/level');
export const getCoinHistory = () => api.get('/gamification/coins/history');
export const getXPHistory = () => api.get('/gamification/xp/history');

// ===== AI FEATURES =====
// Basic AI Chat
export const askGemini = prompt => api.post('/ai/chatbot', { prompt });
export const chatWithBot = (message, chatHistory = []) => api.post('/chatbot/chat', { message, chatHistory });
export const getChatbotHealth = () => api.get('/chatbot/health');

// Enhanced AI Todo Generator
export const generateEnhancedTodos = (input, context = {}) => api.post('/ai/enhanced-todo-generator', { input, context });

// AI Study Planner
export const generateLearningPlan = (goal, timeframe, currentLevel, preferences) =>
  api.post('/ai/learning-planner', { goal, timeframe, currentLevel, preferences });

// Smart Schedule Optimization
export const optimizeSchedule = (dateRange, preferences, applyOptimizations = false) =>
  api.post('/ai/schedule-optimization', { dateRange, preferences, applyOptimizations });

// AI Assistant Features
export const generateStudyPlan = (preferences = {}) => api.post('/ai/study-plan', { preferences });
export const getAIRecommendations = (context = {}) => api.post('/ai/recommendations', { context });
export const askAIQuestion = (question, context = {}) => api.post('/ai/ask', { question, context });
export const generateQuiz = (topic, difficulty = 'medium', questionCount = 5) => 
  api.post('/ai/quiz', { topic, difficulty, questionCount });
export const getAIStatus = () => api.get('/ai/status');

// AI RAG
export const aiRagChat = prompt => api.post('/ai/rag-chatbot', { prompt });



// ===== NOTIFICATIONS =====
export const getNotifications = () => api.get('/notifications');
export const getUnreadCount = () => api.get('/notifications/unread-count');
export const markAsRead = (id) => api.put(`/notifications/${id}/read`);
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`); // Alias for markAsRead
export const markAllAsRead = () => api.put('/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
export const getNotificationPreferences = () => api.get('/notifications/preferences');
export const updateNotificationPreferences = (preferences) => api.put('/notifications/preferences', preferences);

// ===== PROFILE & USER MANAGEMENT =====
export const getUserProfile = () => api.get('/profile');
export const updateUserProfile = (data) => api.put('/profile', data);
export const uploadAvatar = (formData) => api.post('/profile/avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// ===== ANALYTICS & PROGRESS =====

export const getInsights = (dateRange) => api.get('/analytics/insights', { params: dateRange });
export const exportAnalytics = (params) => api.get('/analytics/export', { params });
export const trackAnalyticsEvent = (eventData) => api.post('/analytics/track', eventData);
export const getProgress = () => api.get('/progress');
export const createProgress = data => api.post('/progress', data);
export const updateProgress = (id, data) => api.put(`/progress/${id}`, data);
export const deleteProgress = id => api.delete(`/progress/${id}`);

// ===== SOCIAL FEATURES =====
// Friends
export const getFriends = () => api.get('/friends');
export const sendFriendRequest = (userId) => api.post('/friends/request', { userId });
export const acceptFriendRequest = (requestId) => api.post('/friends/accept', { requestId });
export const rejectFriendRequest = (requestId) => api.post('/friends/reject', { requestId });
export const removeFriend = (friendId) => api.delete(`/friends/${friendId}`);

// Groups
export const getGroups = () => api.get('/groups');
export const createGroup = data => api.post('/groups', data);
export const addMember = (id, userId) => api.post(`/groups/${id}/add`, { userId });
export const removeMember = (id, userId) => api.post(`/groups/${id}/remove`, { userId });
export const createThread = (id, data) => api.post(`/groups/${id}/thread`, data);
export const acceptGroupInvitation = (groupId, invitationId) => api.post(`/advanced-group-system/invitations/${invitationId}/respond`, { response: 'accept' });
export const rejectGroupInvitation = (groupId, invitationId) => api.post(`/advanced-group-system/invitations/${invitationId}/respond`, { response: 'reject' });
export const getGroupInvitations = () => api.get('/groups/invitations');

// Advanced Group System
export const getAdvancedGroups = () => api.get('/advanced-group-system/groups');
export const createAdvancedGroup = data => api.post('/advanced-group-system/groups', data);
export const getAdvancedGroupInvitations = () => api.get('/advanced-group-system/invitations');
export const sendGroupInvitation = (groupId, data) => api.post(`/advanced-group-system/groups/${groupId}/invitations`, data);
export const getAdvancedGroupTodos = (groupId) => api.get(`/advanced-group-system/groups/${groupId}/todos`);
export const createAdvancedGroupTodo = (groupId, data) => api.post(`/advanced-group-system/groups/${groupId}/todos`, data);
export const updateAdvancedGroupTodo = (groupId, todoId, data) => api.put(`/advanced-group-system/groups/${groupId}/todos/${todoId}`, data);
export const deleteAdvancedGroupTodo = (groupId, todoId) => api.delete(`/advanced-group-system/groups/${groupId}/todos/${todoId}`);

// Posts
export const getForumPosts = () => api.get('/posts');
export const createForumPost = data => api.post('/posts', data);
export const commentForumPost = data => api.post('/posts/comment', data);
export const voteForumPost = data => api.post('/posts/vote', data);

// Thread/Chat
export const getThread = id => api.get(`/thread/${id}`);
export const getMessages = id => api.get(`/thread/${id}/messages`);
export const sendMessage = (id, data) => api.post(`/thread/${id}/message`, data);
export const summarizeThread = id => api.post(`/thread/${id}/summarize`);

// ===== EDUCATIONAL FEATURES =====
// Events
export const getEvents = () => api.get('/event');
export const createEvent = data => api.post('/event', data);
export const updateEvent = (id, data) => api.put(`/event/${id}`, data);
export const deleteEvent = id => api.delete(`/event/${id}`);

// Exams
export const getExams = () => api.get('/exam');
export const createExam = data => api.post('/exam', data);
export const updateExam = (id, data) => api.put(`/exam/${id}`, data);
export const deleteExam = id => api.delete(`/exam/${id}`);

// Resources
export const getResources = () => api.get('/resource');
export const createResource = data => api.post('/resource', data);
export const updateResource = (id, data) => api.put(`/resource/${id}`, data);
export const deleteResource = id => api.delete(`/resource/${id}`);

// Mentor
export const getMentors = () => api.get('/mentor');
export const createMentor = data => api.post('/mentor', data);
export const updateMentor = (id, data) => api.put(`/mentor/${id}`, data);
export const deleteMentor = id => api.delete(`/mentor/${id}`);

// Feedback
export const getFeedbacks = () => api.get('/feedback');
export const createFeedback = data => api.post('/feedback', data);
export const updateFeedback = (id, data) => api.put(`/feedback/${id}`, data);
export const deleteFeedback = id => api.delete(`/feedback/${id}`);

// Trial Courses
export const getTrialCourses = () => api.get('/trial');
export const getTrialCoursesByMajor = (major) => api.get(`/trial/major/${major}`);
export const getTrialCourseQuizzes = (id) => api.get(`/trial/${id}/quizzes`);
export const submitTrialQuiz = (id, answers) => api.post(`/trial/${id}/submit`, { answers });

// ===== AI SCHEDULER =====
export const getAISchedulerRecommendations = () => api.post('/ai-scheduler/recommendations');
export const getAIScheduleAnalysis = (params) => api.get('/ai-scheduler/analysis', { params });
export const applyAIRecommendation = (recommendationId) => api.post(`/ai-scheduler/recommendations/${recommendationId}/apply`);

// ===== UTILITIES =====
// File Management
export const uploadFile = (formData) => api.post('/file/upload', formData, { 
  headers: { 'Content-Type': 'multipart/form-data' } 
});
export const getFileList = () => api.get('/file/list');

// Calendar
export const syncCalendar = data => api.post('/calendar/sync', data);

// Statistics
export const getStatistics = () => api.get('/statistics');
export const getUserStatistics = (userId) => api.get(`/statistics/user/${userId}`);
export const getGroupStatistics = (groupId) => api.get(`/statistics/group/${groupId}`);
export const getSystemStatistics = () => api.get('/statistics/system');

// Bot Configuration
export const getBotConfigurations = () => api.get('/bot-config');
export const getBotConfiguration = (botId) => api.get(`/bot-config/${botId}`);

// Orchestrator
export const orchestrator = async (body) => {
  const token = localStorage.getItem('token');
  const baseUrl = import.meta.env.VITE_API_URL || 'https://ai-learning-backend.loca.lt';
  const res = await axios.post(`${baseUrl}/api/orchestrator/agent`, body, { 
    headers: { Authorization: `Bearer ${token}` } 
  });
  return res.data;
};

// Prompt Enhancer
export const promptEnhancer = async (prompt, context) => {
  const token = localStorage.getItem('token');
  const baseUrl = import.meta.env.VITE_API_URL || 'https://ai-learning-backend.loca.lt';
  const res = await axios.post(`${baseUrl}/api/prompt-enhancer`, { prompt, context }, { 
    headers: { Authorization: `Bearer ${token}` } 
  });
  return res.data.enhancedPrompt;
};

// ===== WEBSOCKET CONNECTION HELPERS =====
export const getWebSocketUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'https://ai-learning-backend.loca.lt';
  return baseUrl.replace('http', 'ws') + '/ws';
};

// ===== ERROR HANDLING HELPERS =====
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      success: false,
      message: error.response.data?.message || 'Server error',
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    // Request made but no response
    return {
      success: false,
      message: 'Network error - no response from server',
      status: 0
    };
  } else {
    // Something else happened
    return {
      success: false,
      message: error.message || 'Unknown error',
      status: 0
    };
  }
};

// ===== RESPONSE HELPERS =====
export const createSuccessResponse = (data, message = 'Success') => ({
  success: true,
  data,
  message
});

export const createErrorResponse = (message, status = 500) => ({
  success: false,
  message,
  status
});

// Advanced Shop APIs
export const getShopItems = (filters = {}) => api.get('/shop/items', { params: filters });
export const getShopCategories = () => api.get('/shop/categories');
export const getShopBundles = () => api.get('/shop/bundles');
export const purchaseShopItem = (itemId, currency = 'coins') => api.post('/shop/purchase', { itemId, currency });
export const getPurchaseHistory = () => api.get('/shop/purchases');
export const getFeaturedItems = () => api.get('/shop/featured');
export const searchShopItems = (query) => api.get('/shop/search', { params: query });

// Advanced Pet APIs
export const getPetCollection = () => api.get('/pets/collection');
export const feedPetAdvanced = (petId, foodType) => api.post(`/pets/${petId}/feed`, { foodType });
export const playWithPet = (petId) => api.post(`/pets/${petId}/play`);
export const trainPet = (petId, trainingType) => api.post(`/pets/${petId}/train`, { trainingType });
export const evolvePet = (petId) => api.post(`/pets/${petId}/evolve`);
export const getPetStats = (petId) => api.get(`/pets/${petId}/stats`);
export const getPetAbilities = (petId) => api.get(`/pets/${petId}/abilities`);

// Profile Decorations APIs
export const getProfileDecorations = (filters = {}) => api.get('/profile-decorations/decorations', { params: filters });
export const getUserDecorations = () => api.get('/profile-decorations/user-decorations');
export const purchaseDecoration = (decorationId, currency = 'coins') => api.post('/profile-decorations/purchase', { decorationId, currency });
export const equipDecoration = (decorationId, slot) => api.post('/profile-decorations/equip', { decorationId, slot });
export const unequipDecoration = (decorationId) => api.post('/profile-decorations/unequip', { decorationId });
export const getEquippedDecorations = () => api.get('/profile-decorations/equipped');
export const getDecorationCategories = () => api.get('/profile-decorations/categories');
export const getFeaturedDecorations = () => api.get('/profile-decorations/featured');
export const searchDecorations = (query) => api.get('/profile-decorations/search', { params: query }); 

// ===== GROUP TODO SYSTEM =====
export const fetchGroupTodos = (groupId) => api.get(`/groupTodo/groups/${groupId}/todos`);
export const createGroupTodo = (groupId, todoData) => api.post(`/groupTodo/groups/${groupId}/todos`, todoData);
export const updateGroupTodo = (groupId, todoId, todoData) => api.put(`/groupTodo/groups/${groupId}/todos/${todoId}`, todoData);
export const deleteGroupTodo = (groupId, todoId) => api.delete(`/groupTodo/groups/${groupId}/todos/${todoId}`);
export const assignGroupTodo = (groupId, todoId, assignments) => api.post(`/groupTodo/groups/${groupId}/todos/${todoId}/assign`, { assignments });
export const updateAssignment = (groupId, todoId, assignmentId, data) => api.patch(`/groupTodo/groups/${groupId}/todos/${todoId}/assignment/${assignmentId}`, data);
export const respondToAssignment = (groupId, todoId, assignmentId, response, reason) => api.post(`/groupTodo/groups/${groupId}/todos/${todoId}/assignment/${assignmentId}/respond`, { response, reason });
export const getGroupAnalytics = (groupId) => api.get(`/groupTodo/groups/${groupId}/todos/analytics`);

// ===== POSTS =====
export const getPosts = (params = {}) => api.get('/posts', { params });
export const createPost = (postData) => api.post('/posts', postData);
export const updatePost = (id, postData) => api.put(`/posts/${id}`, postData);
export const deletePost = (id) => api.delete(`/posts/${id}`);
export const likePost = (id) => api.post(`/posts/${id}/like`);
export const unlikePost = (id) => api.delete(`/posts/${id}/like`);
export const commentOnPost = (id, comment) => api.post(`/posts/${id}/comments`, { content: comment });
export const getPostComments = (id) => api.get(`/posts/${id}/comments`);

// ===== POMODORO SYSTEM =====
export const startPomodoroSession = (todoId, settings = {}) => api.post(`/todo/${todoId}/pomodoro/start`, settings);
export const pausePomodoroSession = (todoId) => api.post(`/todo/${todoId}/pomodoro/pause`);
export const completePomodoroSession = (todoId) => api.post(`/todo/${todoId}/pomodoro/complete`);
export const getPomodoroSessions = (todoId) => api.get(`/todo/${todoId}/pomodoro/sessions`);
export const updatePomodoroSettings = (todoId, settings) => api.put(`/todo/${todoId}/pomodoro/settings`, settings);

// ===== GROUPS =====
export const getMyGroups = () => api.get('/groups/my-groups');
export const updateGroup = (groupId, data) => api.put(`/groups/${groupId}`, data);
export const deleteGroup = (groupId) => api.delete(`/groups/${groupId}`);
export const joinGroup = (groupId) => api.post(`/groups/${groupId}/join`);
export const leaveGroup = (groupId) => api.post(`/groups/${groupId}/leave`);
export const inviteToGroup = (groupId, emails) => api.post(`/groups/${groupId}/invite`, { emails });
export const getGroupMembers = (groupId) => api.get(`/groups/${groupId}/members`);
export const updateMemberRole = (groupId, userId, role) => api.put(`/groups/${groupId}/members/${userId}`, { role });

export default api;

// ===== CHATBOT INTEGRATION =====
export const sendChatbotMessage = (conversationId, message) => {
  return fetch(`${API_URL}/api/chatbot-adapter/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ message })
  });
};

export const createConversation = () => {
  console.log('🔍 createConversation called');
  console.log('🔍 API_URL:', API_URL);
  console.log('🔍 Token exists:', !!localStorage.getItem('token'));
  return api.post('/chatbot-adapter/conversations');
};

export const getConversationHistory = (conversationId) => {
  return api.get(`/chatbot-adapter/conversations/${conversationId}/messages`);
};

export const getUserConversations = () => {
  return api.get('/chatbot-adapter/conversations');
};

export const updateConversationTitle = (conversationId, title) => {
  return api.put(`/chatbot-adapter/conversations/${conversationId}`, { title });
};

export const cleanupEmptyConversations = () => {
  return api.delete('/chatbot-adapter/conversations/cleanup');
};

export const deleteConversation = (conversationId) => {
  return api.delete(`/chatbot-adapter/conversations/${conversationId}`);
};

export const saveMessage = (conversationId, type, content, agent = null) => {
  return api.post('/chatbot-adapter/messages', {
    conversationId,
    type,
    content,
    agent
  });
};

// Enhanced chatbot functions
export const getChatbotStatus = () => {
  return api.get('/chatbot-adapter/status');
};

export const getChatbotAnalytics = (conversationId) => {
  return api.get(`/chatbot-adapter/conversations/${conversationId}/analytics`);
};

export const exportConversation = (conversationId, format = 'json') => {
  return api.get(`/chatbot-adapter/conversations/${conversationId}/export`, {
    params: { format }
  });
};