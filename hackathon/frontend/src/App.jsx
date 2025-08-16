import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import components
import Header from './components/layout/Header';
// import PetSystemWrapper from './components/pets/PetSystemWrapper';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import ToDo from './pages/ToDo';

import Chat from './pages/Chat';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import CalendarSync from './pages/CalendarSync';
import LearningAnalytics from './pages/LearningAnalytics';
import AIAssistant from './pages/AIAssistant';
import AIScheduler from './pages/AIScheduler';
// import PetCompanion from './pages/PetCompanion';
// import Shop from './pages/Shop';
import Leaderboard from './pages/Leaderboard';
import Achievements from './pages/Achievements';
import FocusRooms from './pages/FocusRooms';
import StudyGroups from './pages/StudyGroups';
import ResourceLibrary from './pages/ResourceLibrary';
import ProgressTracker from './pages/ProgressTracker';
import GoalSetting from './pages/GoalSetting';
import TimeManagement from './pages/TimeManagement';
import StudyTechniques from './pages/StudyTechniques';
import ExamPreparation from './pages/ExamPreparation';
import Collaboration from './pages/Collaboration';
import Feedback from './pages/Feedback';
import Settings from './pages/Settings';
import Help from './pages/Help';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import Gamification from './pages/Gamification';
import AdvancedChatbotPage from './pages/AdvancedChatbotPage';
import Posts from './pages/Posts';
import PostDetail from './pages/PostDetail';
import AdvancedChatDemo from './pages/AdvancedChatDemo';
import { ShoppingCartProvider } from './contexts/ShoppingCartContext';

// Import styles
import './App.css';
import './modern-styles.css';

function App() {
  return (
    <ShoppingCartProvider>
      <div className="App">
        <Header />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
    
            <Route path="/todo" element={<ToDo />} />
            <Route path="/test-todo" element={<div>Test Todo Route Working!</div>} />

            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="/calendar" element={<CalendarSync />} />
            <Route path="/analytics" element={<LearningAnalytics />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/ai-scheduler" element={<AIScheduler />} />
            {/* <Route path="/pet-companion" element={<PetCompanion />} /> */}
            {/* <Route path="/shop" element={<Shop />} /> */}
            <Route path="/advanced-chatbot" element={<AdvancedChatbotPage />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/advanced-chat-demo" element={<AdvancedChatDemo />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/gamification" element={<Gamification />} />
            <Route path="/focus-rooms" element={<FocusRooms />} />
            <Route path="/study-groups" element={<StudyGroups />} />
            <Route path="/resources" element={<ResourceLibrary />} />
            <Route path="/progress" element={<ProgressTracker />} />
            <Route path="/goals" element={<GoalSetting />} />
            <Route path="/time-management" element={<TimeManagement />} />
            <Route path="/study-techniques" element={<StudyTechniques />} />
            <Route path="/exam-prep" element={<ExamPreparation />} />
            <Route path="/collaboration" element={<Collaboration />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Pet System Wrapper - Floating Pet Button */}
        {/* <PetSystemWrapper /> */}

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </ShoppingCartProvider>
  );
}

export default App;

