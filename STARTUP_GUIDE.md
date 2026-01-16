# 🚀 Face Attendance System - Startup Guide

## Quick Start (3 Steps)

### 1. Start Backend Server
```bash
cd backend
npm run dev
```
**Expected:** Server running on http://localhost:3000

### 2. Start ML Service
```bash
# From project root
uvicorn ml_service.main:app --host 0.0.0.0 --port 8000 --reload
```
**Expected:** ML Service running on http://localhost:8000

### 3. Start Web Frontend
```bash
# From project root
npm run dev
```
**Expected:** Frontend running on http://localhost:5173

---

## ✅ Verify Services

```bash
# Check Backend
curl http://localhost:3000/health

# Check ML Service
curl http://localhost:8000/

# Check Frontend
# Open browser: http://localhost:5173
```

---

## 🎯 Using the System

### For Students

1. **Register Your Face**
   - Login at http://localhost:5173
   - Click "Register Face" in navigation
   - Allow camera access
   - Complete liveness challenge (follow on-screen instructions)
   - Capture your face photo

2. **Mark Attendance**
   - Navigate to "Face Attendance"
   - Select your class
   - Click "Mark Attendance"
   - System will recognize you automatically

### For Teachers

1. **Create Classes**
   - Login at http://localhost:5173
   - Navigate to "Classes"
   - Create new class with code and schedule

2. **Enroll Students**
   - Select class
   - Add students by ID

3. **View Attendance**
   - Real-time attendance tracking
   - Export reports

---

## 📱 Mobile App (React Native)

```bash
cd mobile
npx expo start
```

Scan QR code with Expo Go app on your phone.

---

## 🔧 Troubleshooting

### Backend won't start (Port 3000 in use)
```bash
# Kill process on port 3000
npx kill-port 3000
# Then restart backend
```

### ML Service errors
- Ensure Python dependencies installed: `pip install -r ml_service/requirements.txt`
- First run downloads DeepFace model (~92MB) - be patient

### Database connection errors
- Ensure MySQL is running
- Check credentials in `backend/.env`
- Create database: `CREATE DATABASE attendance_db;`

### Frontend can't connect to backend
- Verify backend is running on port 3000
- Check browser console for CORS errors
- Ensure `VITE_API_URL` in `.env` points to `http://localhost:3000/api`

---

## 🧪 Test Credentials

**Student:**
- Email: `e2e_student2@test.com`
- Password: `Test123!`

**Teacher:**
- Email: `e2e_teacher2@test.com`
- Password: `Test123!`

---

## 📊 System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│ ML Service  │
│  Port 5173  │     │  Port 3000  │     │  Port 8000  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   MySQL     │
                    │  Database   │
                    └─────────────┘
```

---

## 🎨 Features Implemented

✅ Face Registration with liveness detection  
✅ Face-based attendance marking  
✅ QR code attendance (mobile)  
✅ Real-time WebSocket updates  
✅ Teacher dashboard  
✅ Student attendance history  
✅ Parent portal  
✅ Offline sync (mobile)  

---

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register user

### Face Recognition
- `POST /api/users/:id/face-data` - Register face
- `POST /api/attendance/face` - Mark attendance via face
- `POST /liveness` (ML Service) - Liveness detection

### Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class
- `POST /api/classes/:id/enroll` - Enroll students

---

## 🔐 Security Features

- JWT authentication
- Face data encryption in database
- Liveness detection (anti-spoofing)
- HTTPS ready (production)
- Role-based access control

---

## 📞 Support

For issues, check:
1. All services running (3 terminals)
2. Database connection
3. Browser console for errors
4. Backend logs for API errors
