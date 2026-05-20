import express from 'express';
import {
  createProctorLog,
  getActiveSessions,
  getSessionLogs,
  getAlerts,
  resolveAlert,
} from '../controllers/proctorController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all proctoring routes
router.use(authenticate);

// Student-only route to submit webcam status/proctoring logs
router.post('/log', authorize('student'), createProctorLog);

// Admin-only routes for monitoring
router.get('/sessions', authorize('admin'), getActiveSessions);
router.get('/sessions/:id/logs', authorize('admin'), getSessionLogs);
router.get('/alerts', authorize('admin'), getAlerts);
router.put('/alerts/:id/resolve', authorize('admin'), resolveAlert);

export default router;
