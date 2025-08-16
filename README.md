# FPT COMPASS Hub - AI Learning Platform

A comprehensive AI-powered learning platform with gamification, real-time collaboration, and advanced features.

## 🚀 Quick Start

### Frontend (Vercel Deployment)
The frontend is configured for deployment on Vercel with the following backend APIs:

- **Backend API**: https://ai-learning-backend.loca.lt
- **Chatbot API**: https://ai-learning-chatbot.loca.lt

### Environment Variables
Create a `.env.local` file in the `hackathon/frontend/` directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://risphrngpdhesslhjcin.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc3Bocm5ncGRoZXNzbGhqY2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNzY4OTgsImV4cCI6MjA2OTg1Mjg5OH0.mD7ecOITZqH5NSNioUS8NOpz20UH8BZJnIrOj6uxcyI

# API Configuration
VITE_API_URL=https://ai-learning-backend.loca.lt
VITE_SOCKET_URL=https://ai-learning-backend.loca.lt

# App Configuration
VITE_APP_NAME=FPT COMPASS Hub
VITE_APP_VERSION=2.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false

# Chatbot Configuration
VITE_CHATBOT_URL=https://ai-learning-chatbot.loca.lt
```

## 📁 Project Structure

```
hackathon/
├── frontend/          # React + Vite frontend
├── backend/           # Node.js + Express backend
└── chatbot_final/     # Python chatbot
```

## 🛠️ Features

- **AI-Powered Learning**: Advanced chatbot and AI assistance
- **Gamification**: XP system, achievements, pets, and leaderboards
- **Real-time Collaboration**: Live chat, group todos, and focus rooms
- **Task Management**: Advanced todo system with time tracking
- **Social Features**: Posts, comments, and user profiles
- **Analytics**: Learning progress tracking and insights

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Local with ngrok)
1. Start backend server: `cd hackathon/backend && npm start`
2. Start chatbot: `cd hackathon/chatbot_final && python app.py`
3. Use ngrok to expose local servers

## 🔧 Development

```bash
# Frontend
cd hackathon/frontend
npm install
npm run dev

# Backend
cd hackathon/backend
npm install
npm start

# Chatbot
cd hackathon/chatbot_final
pip install -r requirements.txt
python app.py
```

## 📝 License

This project is part of the FPT COMPASS Hackathon. 