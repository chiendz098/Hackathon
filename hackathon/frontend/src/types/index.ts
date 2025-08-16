// Core User Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  coins: number;
  xp: number;
  level: number;
  streak: number;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: ThemeName;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  studySettings: StudySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  studyReminders: boolean;
  achievementAlerts: boolean;
  socialUpdates: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  scheduleVisibility: 'public' | 'friends' | 'private';
  achievementVisibility: 'public' | 'friends' | 'private';
}

export interface StudySettings {
  pomodoroLength: number;
  shortBreakLength: number;
  longBreakLength: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  dailyGoal: number;
}

// Theme Types
export type ThemeName = 'minimal' | 'anime' | 'studio-ghibli' | 'neon' | 'dark' | 'light';

export interface Theme {
  name: ThemeName;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
  };
  animations: {
    duration: string;
    easing: string;
  };
  effects: {
    blur: string;
    shadow: string;
    glow: string;
  };
}

// Todo Types
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'personal' | 'assignment' | 'group' | 'ai-generated';
  subject?: string;
  tags: string[];
  deadline?: string;
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  difficulty: 1 | 2 | 3 | 4 | 5;
  userId: string;
  classroomId?: string;
  assignedBy?: string; // teacher ID
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  aiMetadata?: {
    confidence: number;
    suggestedSchedule?: string;
    learningObjectives?: string[];
    prerequisites?: string[];
  };
}

export interface TodoCreationMethod {
  type: 'manual' | 'ai-chat' | 'teacher-assignment';
  data: any;
}

// AI & Analytics Types
export interface LearningAnalytics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  studyTime: number;
  tasksCompleted: number;
  averageScore: number;
  subjectBreakdown: SubjectAnalytics[];
  learningStyle: LearningStyle;
  recommendations: string[];
  strengths: string[];
  improvementAreas: string[];
  consistency: number; // 0-100
  productivity: number; // 0-100
}

export interface SubjectAnalytics {
  subject: string;
  timeSpent: number;
  tasksCompleted: number;
  averageScore: number;
  difficulty: number;
  engagement: number;
}

export interface LearningStyle {
  visual: number;
  auditory: number;
  kinesthetic: number;
  readingWriting: number;
  dominant: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';
}

// Gamification Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'productivity' | 'social' | 'learning' | 'streak' | 'special';
  requirements: AchievementRequirement[];
  rewards: Reward[];
  unlockedAt?: string;
}

export interface AchievementRequirement {
  type: 'tasks_completed' | 'study_time' | 'streak' | 'score' | 'social';
  value: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
}

export interface Reward {
  type: 'coins' | 'xp' | 'item' | 'theme' | 'badge';
  value: number;
  itemId?: string;
}

export interface VirtualPet {
  id: string;
  name: string;
  type: 'cat' | 'dog' | 'dragon' | 'phoenix' | 'unicorn';
  level: number;
  happiness: number;
  hunger: number;
  energy: number;
  lastFed: string;
  lastPlayed: string;
  accessories: string[];
  evolution: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'avatar' | 'theme' | 'pet' | 'accessory' | 'background';
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  preview?: string;
  requirements?: string[];
}

// Study Room Types
export interface StudyRoom {
  id: string;
  name: string;
  description: string;
  type: 'focus' | 'collaborative' | 'exam-prep' | 'subject-specific';
  subject?: string;
  maxParticipants: number;
  currentParticipants: number;
  isPrivate: boolean;
  password?: string;
  ownerId: string;
  settings: StudyRoomSettings;
  participants: StudyRoomParticipant[];
  createdAt: string;
  isActive: boolean;
}

export interface StudyRoomSettings {
  pomodoroEnabled: boolean;
  pomodoroLength: number;
  breakLength: number;
  allowChat: boolean;
  allowScreenShare: boolean;
  allowFileShare: boolean;
  backgroundMusic: boolean;
  focusMode: boolean;
}

export interface StudyRoomParticipant {
  userId: string;
  username: string;
  avatar?: string;
  joinedAt: string;
  status: 'studying' | 'break' | 'away';
  currentTask?: string;
}

// Calendar & Scheduling Types
export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  type: 'task' | 'class' | 'exam' | 'break' | 'study-session';
  todoId?: string;
  classroomId?: string;
  color: string;
  isAllDay: boolean;
  recurrence?: RecurrenceRule;
  reminders: Reminder[];
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: string;
  count?: number;
}

export interface Reminder {
  type: 'notification' | 'email';
  minutesBefore: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
