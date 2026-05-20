import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/register', register);
router.post('/login', login);

// Protected Routes
router.get('/profile', authenticate, getProfile);

export default router;
