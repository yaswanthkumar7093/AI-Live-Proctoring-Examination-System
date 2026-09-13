import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import examRoutes from './routes/examRoutes.js';
import proctorRoutes from './routes/proctorRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Live Proctoring Backend Server is running.',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    db: 'Neon PostgreSQL',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/proctor', proctorRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`👉 Health: http://localhost:${PORT}/api/health`);
  });
}

export default app;
