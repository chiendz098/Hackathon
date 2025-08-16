# 🚀 Hướng dẫn Deployment AI Learning Platform

## 📋 Chuẩn bị

### 1. Cài đặt công cụ cần thiết:
```bash
# Cài ngrok (nếu chưa có)
# Tải từ: https://ngrok.com/download

# Cài localtunnel (thay thế ngrok)
npm install -g localtunnel

# Cài Vercel CLI
npm install -g vercel
```

## 🔧 Bước 1: Chạy Backend Services

### Terminal 1 - Backend chính (port 5001):
```bash
cd hackathon/backend
npm install
npm start
```

### Terminal 2 - Chatbot (port 8000):
```bash
cd hackathon/chatbot_final
pip install -r requirements.txt
python app.py
```

## 🌐 Bước 2: Tạo Public URLs

### Cách A: Sử dụng Localtunnel (Khuyến nghị)

#### Terminal 3 - Localtunnel cho Backend:
```bash
lt --port 5001 --subdomain ai-learning-backend
```
→ URL: `https://ai-learning-backend.loca.lt`

#### Terminal 4 - Localtunnel cho Chatbot:
```bash
lt --port 8000 --subdomain ai-learning-chatbot
```
→ URL: `https://ai-learning-chatbot.loca.lt`

### Cách B: Sử dụng Ngrok (Cần tài khoản)

#### Tạo file ngrok.yml:
```yaml
version: "2"
authtoken: YOUR_NGROK_AUTH_TOKEN
tunnels:
  backend:
    addr: 5001
    proto: http
    subdomain: ai-learning-backend
  chatbot:
    addr: 8000
    proto: http
    subdomain: ai-learning-chatbot
```

#### Chạy ngrok:
```bash
ngrok start --all
```

## 🎯 Bước 3: Deploy Frontend lên Vercel

### 1. Cập nhật Environment Variables:
Tạo file `.env.production` trong `hackathon/frontend/`:
```env
VITE_API_URL=https://ai-learning-backend.loca.lt
VITE_CHATBOT_URL=https://ai-learning-chatbot.loca.lt
VITE_APP_NAME=AI Learning Platform
VITE_APP_VERSION=2.0.0
```

### 2. Deploy:
```bash
cd hackathon/frontend
vercel --prod
```

### 3. Cấu hình Environment Variables trên Vercel:
- Vào Vercel Dashboard
- Chọn project
- Settings → Environment Variables
- Thêm các biến môi trường

## 🔄 Bước 4: Cập nhật Backend Environment

### Tạo file `.env` trong `hackathon/backend/`:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ai_learning_platform

# JWT
JWT_SECRET=your_jwt_secret

# CORS
CORS_ORIGIN=https://your-vercel-app.vercel.app

# Chatbot
CHATBOT_URL=https://ai-learning-chatbot.loca.lt
CHATBOT_API_URL=https://ai-learning-chatbot.loca.lt

# Server
PORT=5001
NODE_ENV=production
```

## ✅ Kiểm tra Deployment

### 1. Test Backend:
```bash
curl https://ai-learning-backend.loca.lt/health
```

### 2. Test Chatbot:
```bash
curl https://ai-learning-chatbot.loca.lt/
```

### 3. Test Frontend:
- Truy cập URL Vercel
- Kiểm tra login/register
- Test các tính năng chính

## 🛠️ Troubleshooting

### Lỗi CORS:
- Đã cấu hình `origin: true` trong backend
- Kiểm tra environment variables

### Lỗi API Connection:
- Kiểm tra URLs trong environment variables
- Đảm bảo backend và chatbot đang chạy
- Kiểm tra localtunnel/ngrok status

### Lỗi Database:
- Đảm bảo MySQL đang chạy
- Kiểm tra connection string
- Run migrations nếu cần

## 📱 URLs cuối cùng:

- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://ai-learning-backend.loca.lt`
- **Chatbot API**: `https://ai-learning-chatbot.loca.lt`
- **Backend Health**: `https://ai-learning-backend.loca.lt/health`
- **Chatbot Health**: `https://ai-learning-chatbot.loca.lt/`

## 🔒 Security Notes:

- CORS đã được cấu hình cho production
- JWT tokens được sử dụng cho authentication
- File uploads có size limits
- Rate limiting đã được implement 