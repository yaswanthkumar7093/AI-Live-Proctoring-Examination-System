import connectDB from '../config/db.js';
import ExamSession from '../models/ExamSession.js';
import ProctoringLog from '../models/ProctoringLog.js';
import Alert from '../models/Alert.js';
import { ApiError } from '../middleware/errorMiddleware.js';

/**
 * Submit a webcam/proctor log from student client
 * POST /api/proctor/log
 * Access: Student only
 */
export const createProctorLog = async (req, res, next) => {
  try {
    await connectDB();

    const { session_id, event_type, details, is_suspicious = false } = req.body;

    if (!session_id || !event_type) {
      throw new ApiError(400, 'Please provide session_id and event_type.');
    }

    // Verify session exists, belongs to student, and is active
    const session = await ExamSession.findById(session_id);

    if (!session) {
      throw new ApiError(404, 'Exam session not found.');
    }

    if (session.user_id.toString() !== req.user.id.toString()) {
      throw new ApiError(403, 'Unauthorized to post logs to this session.');
    }

    if (session.status !== 'started') {
      throw new ApiError(400, 'Cannot post logs to a completed exam session.');
    }

    // Create proctoring log
    const log = await ProctoringLog.create({
      session_id,
      event_type,
      details: details ? details.trim() : null,
      is_suspicious,
    });

    let alert = null;

    // Auto-create cheating alert if suspicious
    if (is_suspicious) {
      let severity = 'medium';
      if (
        event_type === 'face_missing' ||
        event_type === 'multiple_faces' ||
        event_type === 'webcam_disconnected'
      ) {
        severity = 'high';
      } else if (event_type === 'tab_switch') {
        severity = 'low';
      }

      const message = `Suspicious behavior flagged: ${event_type.replace(/_/g, ' ')}.`;

      const newAlert = await Alert.create({
        session_id,
        log_id: log._id,
        message,
        severity,
      });

      alert = {
        id: newAlert._id,
        session_id: newAlert.session_id,
        log_id: newAlert.log_id,
        message: newAlert.message,
        severity: newAlert.severity,
        is_resolved: newAlert.is_resolved,
        created_at: newAlert.created_at,
      };
    }

    return res.status(201).json({
      success: true,
      message: 'Proctor log submitted successfully.',
      data: {
        log: {
          id: log._id,
          session_id: log.session_id,
          event_type: log.event_type,
          details: log.details,
          is_suspicious: log.is_suspicious,
          timestamp: log.timestamp,
        },
        alert,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active exam sessions for monitoring
 * GET /api/proctor/sessions
 * Access: Admin only
 */
export const getActiveSessions = async (req, res, next) => {
  try {
    await connectDB();

    const sessions = await ExamSession.find({ status: 'started' })
      .sort({ started_at: -1 })
      .populate('user_id', 'id name email')
      .populate('exam_id', 'id title duration')
      .lean();

    // Shape response to match the frontend's expected structure
    const formatted = sessions.map((s) => ({
      id: s._id,
      status: s.status,
      started_at: s.started_at,
      users: s.user_id
        ? { id: s.user_id._id, name: s.user_id.name, email: s.user_id.email }
        : null,
      exams: s.exam_id
        ? { id: s.exam_id._id, title: s.exam_id.title, duration: s.exam_id.duration }
        : null,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get proctor logs for a specific session
 * GET /api/proctor/sessions/:id/logs
 * Access: Admin only
 */
export const getSessionLogs = async (req, res, next) => {
  try {
    await connectDB();

    const sessionId = req.params.id;

    const logs = await ProctoringLog.find({ session_id: sessionId })
      .sort({ timestamp: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: logs.map((l) => ({
        id: l._id,
        session_id: l.session_id,
        event_type: l.event_type,
        details: l.details,
        is_suspicious: l.is_suspicious,
        timestamp: l.timestamp,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all unresolved alerts
 * GET /api/proctor/alerts
 * Access: Admin only
 */
export const getAlerts = async (req, res, next) => {
  try {
    await connectDB();

    const alerts = await Alert.find({ is_resolved: false })
      .sort({ created_at: -1 })
      .populate({
        path: 'session_id',
        select: 'status completed_at user_id exam_id',
        populate: [
          { path: 'user_id', select: 'name email' },
          { path: 'exam_id', select: 'title' },
        ],
      })
      .populate('log_id', 'event_type details timestamp')
      .lean();

    // Filter out alerts where exam completed more than 30 minutes ago
    const now = new Date();
    const activeAlerts = alerts.filter((alert) => {
      const session = alert.session_id;
      if (session && session.status === 'completed' && session.completed_at) {
        const diffMinutes = (now - new Date(session.completed_at)) / (1000 * 60);
        return diffMinutes <= 30;
      }
      return true;
    });

    // Shape to match Supabase-style nested structure the frontend expects
    const formatted = activeAlerts.map((alert) => {
      const session = alert.session_id || {};
      const user = session.user_id || {};
      const exam = session.exam_id || {};
      const log = alert.log_id || {};

      return {
        id: alert._id,
        message: alert.message,
        severity: alert.severity,
        is_resolved: alert.is_resolved,
        created_at: alert.created_at,
        session_id: session._id || null,
        exam_sessions: {
          id: session._id,
          status: session.status,
          completed_at: session.completed_at,
          users: { id: user._id, name: user.name, email: user.email },
          exams: { id: exam._id, title: exam.title },
        },
        proctoring_logs: {
          id: log._id,
          event_type: log.event_type,
          details: log.details,
          timestamp: log.timestamp,
        },
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve a cheating alert
 * PUT /api/proctor/alerts/:id/resolve
 * Access: Admin only
 */
export const resolveAlert = async (req, res, next) => {
  try {
    await connectDB();

    const alertId = req.params.id;

    const alert = await Alert.findByIdAndUpdate(
      alertId,
      { is_resolved: true },
      { new: true }
    );

    if (!alert) {
      throw new ApiError(404, 'Alert not found.');
    }

    return res.status(200).json({
      success: true,
      message: 'Alert marked as resolved.',
      data: {
        id: alert._id,
        message: alert.message,
        severity: alert.severity,
        is_resolved: alert.is_resolved,
        created_at: alert.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};
