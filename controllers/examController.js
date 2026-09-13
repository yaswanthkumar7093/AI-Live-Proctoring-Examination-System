import sql from '../config/db.js';
import { ApiError } from '../middleware/errorMiddleware.js';

/**
 * Create a new exam
 * POST /api/exams
 * Access: Admin only
 */
export const createExam = async (req, res, next) => {
  try {
    const { title, description, duration } = req.body;

    if (!title || !duration) {
      throw new ApiError(400, 'Please provide exam title and duration (in minutes).');
    }

    const parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      throw new ApiError(400, 'Duration must be a positive integer.');
    }

    const [exam] = await sql`
      INSERT INTO exams (title, description, duration, created_by)
      VALUES (
        ${title.trim()},
        ${description ? description.trim() : null},
        ${parsedDuration},
        ${req.user.id}
      )
      RETURNING *
    `;

    return res.status(201).json({
      success: true,
      message: 'Exam created successfully.',
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all available exams
 * GET /api/exams
 * Access: Authenticated Users
 */
export const getExams = async (req, res, next) => {
  try {
    const exams = await sql`
      SELECT * FROM exams ORDER BY created_at DESC
    `;

    return res.status(200).json({
      success: true,
      data: exams,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start an exam session
 * POST /api/exams/:id/start
 * Access: Student only
 */
export const startExam = async (req, res, next) => {
  try {
    const examId = req.params.id;

    // Verify exam exists
    const [exam] = await sql`SELECT id FROM exams WHERE id = ${examId}`;
    if (!exam) {
      throw new ApiError(404, 'Exam not found.');
    }

    // Check for existing active session
    const [existing] = await sql`
      SELECT id FROM exam_sessions
      WHERE user_id = ${req.user.id}
        AND exam_id = ${examId}
        AND status = 'started'
    `;

    if (existing) {
      throw new ApiError(400, 'You already have an active session for this exam.');
    }

    const [session] = await sql`
      INSERT INTO exam_sessions (user_id, exam_id, status)
      VALUES (${req.user.id}, ${examId}, 'started')
      RETURNING *
    `;

    return res.status(201).json({
      success: true,
      message: 'Exam session started successfully.',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit / Complete an exam session
 * POST /api/exams/:id/submit
 * Access: Student only
 */
export const submitExam = async (req, res, next) => {
  try {
    const examId = req.params.id;

    const [session] = await sql`
      UPDATE exam_sessions
      SET status = 'completed', completed_at = NOW()
      WHERE user_id = ${req.user.id}
        AND exam_id = ${examId}
        AND status = 'started'
      RETURNING *
    `;

    if (!session) {
      throw new ApiError(404, 'No active exam session found to submit.');
    }

    return res.status(200).json({
      success: true,
      message: 'Exam session submitted successfully.',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};
