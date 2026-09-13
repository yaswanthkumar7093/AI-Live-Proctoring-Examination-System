import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import examRoutes from './routes/examRoutes.js';
import proctorRoutes from './routes/proctorRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import connectDB from './config/db.js';

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Live Proctoring Backend Server is running.',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    db: 'MongoDB',
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/proctor', proctorRoutes);

// 404 handler
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

// Start server (only in non-Vercel environments)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
    });
  });
}

export default app;
