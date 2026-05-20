import supabase from '../config/supabase.js';
import { ApiError } from '../middleware/errorMiddleware.js';

/**
 * Submit a webcam/proctor log from student client
 * POST /api/proctor/log
 * Access: Student only
 */
export const createProctorLog = async (req, res, next) => {
  try {
    const { session_id, event_type, details, is_suspicious = false } = req.body;

    if (!session_id || !event_type) {
      throw new ApiError(400, 'Please provide session_id and event_type.');
    }

    // Verify session exists, belongs to the student, and is active
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('id, user_id, status')
      .eq('id', session_id)
      .maybeSingle();

    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      throw new ApiError(404, 'Exam session not found.');
    }

    if (session.user_id !== req.user.id) {
      throw new ApiError(403, 'Unauthorized to post logs to this session.');
    }

    if (session.status !== 'started') {
      throw new ApiError(400, 'Cannot post logs to a completed exam session.');
    }

    // Create the proctoring log
    const { data: log, error: logError } = await supabase
      .from('proctoring_logs')
      .insert([
        {
          session_id,
          event_type,
          details: details ? details.trim() : null,
          is_suspicious,
        },
      ])
      .select('*')
      .single();

    if (logError) {
      throw logError;
    }

    let alert = null;

    // Automatically create a cheating alert if suspicious
    if (is_suspicious) {
      let severity = 'medium';
      if (event_type === 'face_missing' || event_type === 'multiple_faces' || event_type === 'webcam_disconnected') {
        severity = 'high';
      } else if (event_type === 'tab_switch') {
        severity = 'low';
      }

      const message = `Suspicious behavior flagged: ${event_type.replace('_', ' ')}.`;

      const { data: newAlert, error: alertError } = await supabase
        .from('alerts')
        .insert([
          {
            session_id,
            log_id: log.id,
            message,
            severity,
          },
        ])
        .select('*')
        .single();

      if (alertError) {
        throw alertError;
      }
      alert = newAlert;
    }

    return res.status(201).json({
      success: true,
      message: 'Proctor log submitted successfully.',
      data: {
        log,
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
    // Select sessions with student and exam details
    const { data: sessions, error } = await supabase
      .from('exam_sessions')
      .select(`
        id,
        status,
        started_at,
        users (id, name, email),
        exams (id, title, duration)
      `)
      .eq('status', 'started')
      .order('started_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: sessions,
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
    const sessionId = req.params.id;

    const { data: logs, error } = await supabase
      .from('proctoring_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: logs,
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
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select(`
        id,
        message,
        severity,
        is_resolved,
        created_at,
        exam_sessions (
          id,
          users (id, name, email),
          exams (id, title)
        ),
        proctoring_logs (
          id,
          event_type,
          details,
          timestamp
        )
      `)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: alerts,
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
    const alertId = req.params.id;

    const { data: alert, error } = await supabase
      .from('alerts')
      .update({ is_resolved: true })
      .eq('id', alertId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!alert) {
      throw new ApiError(404, 'Alert not found.');
    }

    return res.status(200).json({
      success: true,
      message: 'Alert marked as resolved.',
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};
