import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import examRoutes from './routes/examRoutes.js';
import proctorRoutes from './routes/proctorRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors({
  origin: '*', // In production, replace with specific origins for better security
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());

// Serve static frontend files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// API Health Check (moved to /api/health)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Live Proctoring Backend Server is running.',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/proctor', proctorRoutes);

// 404 Route Not Found handler
app.use(notFound);

// Centralized error handling middleware
app.use(errorHandler);

// Start server (conditional for local running vs. Vercel serverless environment)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`👉 Health check: http://localhost:${PORT}/`);
  });
}

export default app;
