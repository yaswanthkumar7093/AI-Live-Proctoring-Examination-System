import express from 'express';
import { createExam, getExams, startExam, submitExam } from '../controllers/examController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all exam routes
router.use(authenticate);

// Publicly readable for all logged-in users (Student & Admin)
router.get('/', getExams);

// Admin-only route
router.post('/', authorize('admin'), createExam);

// Student-only routes
router.post('/:id/start', authorize('student'), startExam);
router.post('/:id/submit', authorize('student'), submitExam);

export default router;
