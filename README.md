# AI Live Proctoring Examination System

A production-ready AI-powered live proctoring system built with **Node.js**, **Express.js**, **Neon PostgreSQL**, and deployed on **Vercel**.

## 🌐 Live Application

> **👉 https://ai-proctoring-backend.vercel.app**

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js |
| Database | Neon Serverless PostgreSQL |
| Authentication | JWT + bcryptjs |
| AI Face Detection | TensorFlow.js + BlazeFace (client-side) |
| Deployment | Vercel (Serverless) |

---

## 📂 Project Structure

```
├── config/
│   └── db.js                 # Neon PostgreSQL client (HTTP-based, zero IP restrictions)
├── controllers/
│   ├── authController.js     # Register, login, profile
│   ├── examController.js     # Create, list, start, submit exams
│   └── proctorController.js  # Logs, sessions, alerts management
├── middleware/
│   ├── authMiddleware.js     # JWT validation & role-based auth
│   └── errorMiddleware.js    # Centralized error handling
├── routes/
│   ├── authRoutes.js
│   ├── examRoutes.js
│   └── proctorRoutes.js
├── public/
│   ├── index.html            # Login / Register portal
│   ├── dashboard.html        # Student exam + Admin control panel
│   ├── css/style.css
│   └── js/
│       ├── app.js            # Auth + dashboard init
│       ├── proctor.js        # TensorFlow.js AI face detection
│       └── admin.js          # Admin live monitoring
├── setup-db.mjs              # One-time Neon schema setup script
├── server.js                 # Express app entry point
├── vercel.json               # Vercel deployment config
└── .env.example              # Environment variable template
```

---

## 🔐 API Endpoints

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/api/auth/register` | Public | Register student or admin |
| `POST` | `/api/auth/login` | Public | Login with role check |
| `GET`  | `/api/auth/profile` | Authenticated | Get current user profile |

### Exams
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `GET`  | `/api/exams` | Authenticated | List all exams |
| `POST` | `/api/exams` | Admin | Create new exam |
| `POST` | `/api/exams/:id/start` | Student | Start exam session |
| `POST` | `/api/exams/:id/submit` | Student | Submit exam |

### Proctoring
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/api/proctor/log` | Student | Submit webcam/AI event log |
| `GET`  | `/api/proctor/sessions` | Admin | View active exam sessions |
| `GET`  | `/api/proctor/sessions/:id/logs` | Admin | View session activity logs |
| `GET`  | `/api/proctor/alerts` | Admin | View unresolved cheating alerts |
| `PUT`  | `/api/proctor/alerts/:id/resolve` | Admin | Resolve an alert |

---

## 🛠️ Local Setup

```bash
# 1. Clone and install
git clone https://github.com/yaswanthkumar7093/AI-Live-Proctoring-Examination-System.git
cd AI-Live-Proctoring-Examination-System
npm install

# 2. Configure environment
cp .env.example .env
# Fill in DATABASE_URL from https://neon.tech and JWT_SECRET

# 3. Create database tables
node setup-db.mjs

# 4. Start server
npm run dev
```

---

## ⚡ Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Set these environment variables on Vercel:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — Random secure string
- `JWT_EXPIRES_IN` — e.g. `7d`
- `NODE_ENV` — `production`
