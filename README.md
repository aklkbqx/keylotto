# 🎰 KeyLotto - แอปตรวจหวยสายมู

<div align="center">
  <img src="https://via.placeholder.com/200x200/FFD700/FF0000?text=KeyLotto" alt="KeyLotto Logo" width="200" />
  
  **แอปตรวจหวยที่มากกว่าการตรวจ... มาพร้อมความฮาและกำลังใจ!**
  
  [![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?logo=react)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-52-000020?logo=expo)](https://expo.dev/)
  [![Bun](https://img.shields.io/badge/Bun-1.0-000000?logo=bun)](https://bun.sh/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
</div>

## 📖 Overview

**KeyLotto (หวยมีคีย์)** คือแอปพลิเคชันตรวจหวยที่ไม่ใช่แค่บอกผลว่าถูกหรือไม่ถูก แต่มาพร้อมกับ:

- 🎯 **ระบบตรวจเฉียดรางวัล** - วิเคราะห์ว่าคุณเฉียดรางวัลแค่ไหน (สลับตำแหน่ง, เลขกลับ, ผิดแค่ 1-2 ตัว)
- 😂 **ข้อความฮาๆ กวนๆ** - ปลอบใจเมื่อไม่ถูก, ยินดีเมื่อถูกรางวัล
- 📸 **สแกน QR Code & OCR** - ตรวจจากภาพถ่ายหรือ QR Code บนใบลอตเตอรี่
- 📊 **ประวัติการตรวจ** - เก็บสถิติว่าคุณเฉียดรางวัลบ่อยแค่ไหน
- 🔮 **ทำนายฝัน** - ตีความฝันเป็นเลขเด็ด
- 📰 **ข่าวเลขดัง** - รวบรวมข่าวเลขเด็ดจากสำนักข่าวชั้นนำ

## 🚀 Features

### Phase 1: Core Features ✅
- ✅ ตรวจหวยด้วยเลข 6 หลัก
- ✅ เลือกงวดที่ต้องการตรวจ
- ✅ ระบบวิเคราะห์เฉียดรางวัล (Near-miss Detection)
  - สลับตำแหน่ง (Swapped Positions)
  - เลขกลับ (Reversed Number)
  - เลขเลื่อนตำแหน่ง (Position Shift)
  - ผิดไม่เกิน 2 ตัว (Hamming Distance)
- ✅ ข้อความตอบกลับแบบ Dynamic (ฮา/กวน/ให้กำลังใจ)
- ✅ บันทึกประวัติการตรวจ
- ✅ แชร์ผลลัพธ์

### Phase 2: Camera & Gallery 🚧
- ✅ สแกน QR Code จากกล้อง
- ✅ เลือกรูปจากแกลเลอรี่
- 🚧 OCR จากภาพถ่าย
- 🚧 แชร์รูปพร้อมผลลัพธ์

### Phase 3: Extra Features 📅
- ✅ ข่าวเลขเด็ด
- ✅ ทำนายฝัน
- 📅 ถ่ายทอดสดหวยออก
- 📅 AI สุ่มเลขจากรูปแผงลอตเตอรี่
- 📅 ระบบสะสมแต้ม/รางวัล

## 🏗️ Tech Stack

### Frontend (Mobile App)
- **Framework:** React Native + Expo (SDK 52)
- **Navigation:** Expo Router (File-based routing)
- **State Management:** Zustand
- **Styling:** Tailwind CSS (twrnc)
- **UI Components:** Custom themed components
- **API Client:** Custom API_UTILS with retry logic
- **Icons:** @expo/vector-icons
- **Animations:** Lottie React Native

### Backend (API Server)
- **Runtime:** Bun
- **Framework:** Elysia.js
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** JWT
- **Web Scraping:** Cheerio
- **OCR Service:** Python (EasyOCR + OpenCV)
- **Push Notifications:** Expo Server SDK
- **Documentation:** Swagger (built-in)

### DevOps
- **Container:** Docker & Docker Compose
- **Environment:** Development & Production configs
- **CI/CD:** GitHub Actions (planned)

## 📁 Project Structure

```
KeyLotto/
├── frontend/                # React Native + Expo App
│   ├── app/                # Expo Router screens
│   │   ├── (auth)/         # Authentication flow
│   │   ├── user/           # Main app screens
│   │   │   ├── _layout.tsx # Tab navigation
│   │   │   ├── lottery-check.tsx
│   │   │   ├── scan.tsx
│   │   │   ├── history.tsx
│   │   │   ├── news.tsx
│   │   │   └── profile.tsx
│   │   └── _layout.tsx
│   ├── libs/               # Shared libraries
│   │   ├── components/     # Reusable components
│   │   ├── config/         # App configuration
│   │   ├── hooks/          # Custom hooks
│   │   ├── stores/         # Zustand stores
│   │   └── utils/          # Utilities & API_UTILS
│   └── assets/             # Images, fonts, etc.
│
├── backend/                 # Bun + Elysia API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   │   ├── auth.ts
│   │   │   ├── lottery.ts
│   │   │   └── user.ts
│   │   ├── services/       # Business logic
│   │   │   ├── LottoService.ts
│   │   │   └── OcrService.ts
│   │   ├── db/            # Database connection
│   │   └── index.ts       # Main server
│   ├── drizzle/           # Database schema
│   ├── ocr-service/       # Python OCR service
│   └── public/            # Static files
│
└── docker-compose.yml      # Container orchestration
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ or Bun 1.0+
- PostgreSQL 15+
- Python 3.9+ (for OCR service)
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
bun install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
bun run db:migrate

# Seed initial data
bun run seed

# Start development server
bun run dev
```

Backend will run on:
- API: http://localhost:3000
- Swagger Docs: http://localhost:3001

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your API URL

# For iOS (Mac only)
cd ios && pod install && cd ..

# Start Expo
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

### Docker Setup (Optional)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 🔑 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/keylotto

# JWT
JWT_SECRET=your-secret-key

# OCR Service
OCR_SERVICE_URL=http://localhost:8000

# Ports
API_PORT=3000
DOCS_PORT=3001
```

### Frontend (.env)
```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_API_VERSION=v1

# Features Toggle
EXPO_PUBLIC_ENABLE_OCR=true
EXPO_PUBLIC_ENABLE_PUSH=true
```

## 📱 Screenshots

<div align="center">
  <img src="https://via.placeholder.com/250x500/FFD700/FF0000?text=Home" alt="Home" width="200" />
  <img src="https://via.placeholder.com/250x500/FFD700/FF0000?text=Check" alt="Check" width="200" />
  <img src="https://via.placeholder.com/250x500/FFD700/FF0000?text=Result" alt="Result" width="200" />
  <img src="https://via.placeholder.com/250x500/FFD700/FF0000?text=History" alt="History" width="200" />
</div>

## 🎨 Design System

### Theme: "สายมู" (Mystical Lucky)
- **Primary Colors:** Gold (#FFD700), Red (#DC2626)
- **Typography:** Kanit (Thai), Aboreto (Display)
- **Components:** Glass morphism, Gradients, Animations
- **Icons:** Lucky symbols (🎰🔮⭐️🍀)

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Lottery
- `GET /api/lottery/results` - Get lottery results
- `POST /api/lottery/check` - Check lottery number
- `POST /api/lottery/scan` - Scan QR/Image
- `GET /api/lottery/history` - Get check history
- `GET /api/lottery/news` - Get lottery news
- `POST /api/lottery/dream` - Dream interpretation

### User
- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/stats` - Get statistics
- `PUT /api/user/settings` - Update settings

## 🧪 Testing

```bash
# Backend tests
cd backend
bun test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📈 Performance

- **API Response Time:** < 200ms average
- **App Launch Time:** < 2 seconds
- **OCR Processing:** < 3 seconds
- **Database Queries:** Optimized with indexes
- **Caching:** Redis for frequently accessed data

## 🔐 Security

- JWT Authentication with refresh tokens
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention (Parameterized queries)
- XSS protection
- HTTPS enforcement in production
- Secure storage for sensitive data

## 🚢 Deployment

### Backend Deployment
- **Platform:** Railway / Render / AWS
- **Database:** Supabase / Neon / AWS RDS
- **OCR Service:** Docker container

### Mobile App Deployment
- **iOS:** App Store via EAS Build
- **Android:** Google Play via EAS Build
- **OTA Updates:** Expo Updates

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Lottery data from [GLO (กองสลากฯ)](https://www.glo.or.th/)
- Web scraping from Sanook.com
- Thai fonts from Google Fonts
- Icons from Expo Vector Icons

## 📞 Contact

- **Developer:** Your Name
- **Email:** your.email@example.com
- **GitHub:** [@yourusername](https://github.com/yourusername)

## 🗺️ Roadmap

- [x] Phase 1: Core lottery checking
- [x] Phase 2: QR/Camera scanning
- [ ] Phase 3: Social features
- [ ] Phase 4: AI predictions
- [ ] Phase 5: Gamification
- [ ] Phase 6: Multi-language support

---

<div align="center">
  Made with ❤️ and 🍀 for Thai lottery players
  
  **"เฉียดแล้วเฉียดอีก... วันหนึ่งต้องถูก!"** 
</div>