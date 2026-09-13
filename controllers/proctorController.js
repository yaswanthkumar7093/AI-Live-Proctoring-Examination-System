import sql from '../config/db.js';
import { ApiError } from '../middleware/errorMiddleware.js';

/**
 * Submit a webcam/proctor log
 * POST /api/proctor/log
 * Access: Student only
 */
export const createProctorLog = async (req, res, next) => {
  try {
    const { session_id, event_type, details, is_suspicious = false } = req.body;

    if (!session_id || !event_type) {
      throw new ApiError(400, 'Please provide session_id and event_type.');
    }

    // Verify session exists, belongs to student, and is active
    const [session] = await sql`
      SELECT id, user_id, status FROM exam_sessions WHERE id = ${session_id}
    `;

    if (!session) throw new ApiError(404, 'Exam session not found.');
    if (session.user_id !== req.user.id) throw new ApiError(403, 'Unauthorized to post logs to this session.');
    if (session.status !== 'started') throw new ApiError(400, 'Cannot post logs to a completed exam session.');

    // Create proctoring log
    const [log] = await sql`
      INSERT INTO proctoring_logs (session_id, event_type, details, is_suspicious)
      VALUES (
        ${session_id},
        ${event_type},
        ${details ? details.trim() : null},
        ${is_suspicious}
      )
      RETURNING *
    `;

    let alert = null;

    // Auto-create alert if suspicious
    if (is_suspicious) {
      let severity = 'medium';
      if (['face_missing', 'multiple_faces', 'webcam_disconnected'].includes(event_type)) {
        severity = 'high';
      } else if (event_type === 'tab_switch') {
        severity = 'low';
      }

      const message = `Suspicious behavior flagged: ${event_type.replace(/_/g, ' ')}.`;

      const [newAlert] = await sql`
        INSERT INTO alerts (session_id, log_id, message, severity)
        VALUES (${session_id}, ${log.id}, ${message}, ${severity})
        RETURNING *
      `;
      alert = newAlert;
    }

    return res.status(201).json({
      success: true,
      message: 'Proctor log submitted successfully.',
      data: { log, alert },
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
    const sessions = await sql`
      SELECT
        es.id,
        es.status,
        es.started_at,
        json_build_object(
          'id', u.id, 'name', u.name, 'email', u.email
        ) AS users,
        json_build_object(
          'id', e.id, 'title', e.title, 'duration', e.duration
        ) AS exams
      FROM exam_sessions es
      JOIN users u ON u.id = es.user_id
      JOIN exams e ON e.id = es.exam_id
      WHERE es.status = 'started'
      ORDER BY es.started_at DESC
    `;

    return res.status(200).json({ success: true, data: sessions });
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
    const logs = await sql`
      SELECT * FROM proctoring_logs
      WHERE session_id = ${req.params.id}
      ORDER BY timestamp ASC
    `;

    return res.status(200).json({ success: true, data: logs });
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
    const alerts = await sql`
      SELECT
        a.id,
        a.message,
        a.severity,
        a.is_resolved,
        a.created_at,
        a.session_id,
        json_build_object(
          'id',           es.id,
          'status',       es.status,
          'completed_at', es.completed_at,
          'users',        json_build_object('id', u.id, 'name', u.name, 'email', u.email),
          'exams',        json_build_object('id', e.id, 'title', e.title)
        ) AS exam_sessions,
        json_build_object(
          'id',         pl.id,
          'event_type', pl.event_type,
          'details',    pl.details,
          'timestamp',  pl.timestamp
        ) AS proctoring_logs
      FROM alerts a
      JOIN exam_sessions es ON es.id = a.session_id
      JOIN users u  ON u.id  = es.user_id
      JOIN exams e  ON e.id  = es.exam_id
      LEFT JOIN proctoring_logs pl ON pl.id = a.log_id
      WHERE a.is_resolved = false
      ORDER BY a.created_at DESC
    `;

    // Filter: drop alerts where exam completed more than 30 minutes ago
    const now = Date.now();
    const active = alerts.filter((a) => {
      const s = a.exam_sessions;
      if (s?.status === 'completed' && s?.completed_at) {
        return (now - new Date(s.completed_at).getTime()) / 60000 <= 30;
      }
      return true;
    });

    return res.status(200).json({ success: true, data: active });
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
    const [alert] = await sql`
      UPDATE alerts SET is_resolved = true
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    if (!alert) throw new ApiError(404, 'Alert not found.');

    return res.status(200).json({
      success: true,
      message: 'Alert marked as resolved.',
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};
