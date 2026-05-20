# AI Live Proctoring Examination System Backend

This repository contains the production-ready Backend Server & Database Setup for the AI Live Proctoring Examination System. Built with Node.js, Express.js, Supabase, and JWT authentication, utilizing the MVC architectural pattern.

## 🚀 Tech Stack
- **Runtime Environment:** Node.js (ES6 Syntax, `"type": "module"`)
- **Web Framework:** Express.js
- **Database / Backend-as-a-Service:** Supabase (PostgreSQL)
- **Security & Authentication:** JSON Web Tokens (JWT), `bcryptjs`
- **Deployment Platform:** Vercel

---

## 📂 Project Structure

```text
backend/
├── config/
│   └── supabase.js        # Reusable Supabase client configuration
├── controllers/
│   └── authController.js  # Registration, login, and profile business logic
├── middleware/
│   ├── authMiddleware.js  # JWT validation & role-based authorization
│   └── errorMiddleware.js # Centralized 404 & general error handling
├── routes/
│   └── authRoutes.js      # REST API route endpoints
├── .env.example           # Template for environment variables
├── .gitignore             # Git ignored patterns
├── package.json           # Project dependencies and startup scripts
├── schema.sql             # SQL schema definitions for Supabase
├── server.js              # Server entry point
└── vercel.json            # Deployment configuration for Vercel
```

---

## 🛠️ Installation & Local Setup

### Prerequisite
Ensure you have **Node.js** (v16+) and an active **Supabase** account.

### 1. Clone the repository and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```
Inside `.env`, configure:
- `SUPABASE_URL`: Your Supabase Project API URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role secret key (enables database operations bypassing Row-Level Security safely on the server).
- `JWT_SECRET`: A secure, random string for signing JWT tokens.
- `PORT`: Server port (defaults to `5000`).

### 3. Setup Supabase Database
1. Go to your Supabase project dashboard.
2. Navigate to the **SQL Editor**.
3. Create a new query, paste the content of [schema.sql](file:///c:/Users/DELL/OneDrive/Desktop/backend%20server/schema.sql), and click **Run**.
This creates the `users` table with constraints enforcing roles to be `student` or `admin` only.

### 4. Run the Server Locally
```bash
# Start development mode with Nodemon
npm run dev

# Start production mode
npm start
```

---

## 🔐 API Endpoints & Postman Examples

### 1. Register a User
- **Method & Route:** `POST /api/auth/register`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "password": "securepassword123",
    "role": "student"
  }
  ```
  *(Note: `role` must be either `"student"` or `"admin"`. If omitted, it defaults to `"student"`.)*
- **Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "data": {
      "id": "e81d770f-155e-42ef-bd72-ccf98fb72671",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "student",
      "created_at": "2026-05-20T10:20:00Z"
    }
  }
  ```

### 2. Login User
- **Method & Route:** `POST /api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "jane.doe@example.com",
    "password": "securepassword123"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "e81d770f-155e-42ef-bd72-ccf98fb72671",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "student",
      "created_at": "2026-05-20T10:20:00Z"
    }
  }
  ```

### 3. Get User Profile
- **Method & Route:** `GET /api/auth/profile`
- **Headers:** 
  - `Authorization: Bearer <YOUR_JWT_TOKEN>`
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "id": "e81d770f-155e-42ef-bd72-ccf98fb72671",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "student",
      "created_at": "2026-05-20T10:20:00Z"
    }
  }
  ```

---

## ⚡ Deployment to Vercel

This application is ready-to-deploy to Vercel using the custom configuration in `vercel.json`.

### Option A: Deployment via Vercel CLI
1. Install Vercel CLI if you haven't: `npm install -g vercel`
2. Run the command inside the project directory:
   ```bash
   vercel
   ```
3. Set your production environment variables when prompted or on the Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` (Optional, e.g. `7d`)
   - `NODE_ENV` (`production`)
4. Deploy to production:
   ```bash
   vercel --prod
   ```

### Option B: Deployment via GitHub (Recommended)
1. Push the repository to GitHub (see below).
2. Go to [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Expand **Environment Variables** and add all values from your local `.env`.
5. Click **Deploy**. Vercel will automatically deploy any subsequent commits to the main branch.

---

## 🐙 GitHub Integration Commands

Follow these steps to initialize and push this project to your GitHub repository:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create the first commit
git commit -m "Initial commit: AI Live Proctoring System backend setup"

# Link your remote GitHub repository
git remote add origin <your-github-repo-url>

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```
