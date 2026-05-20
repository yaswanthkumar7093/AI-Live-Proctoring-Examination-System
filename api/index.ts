import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../src/routes/auth.routes';
import examRoutes from '../src/routes/exam.routes';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

export default app;
