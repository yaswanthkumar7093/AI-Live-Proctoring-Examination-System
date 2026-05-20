import supabase from '../config/supabase.js';
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

    const { data: exam, error } = await supabase
      .from('exams')
      .insert([
        {
          title: title.trim(),
          description: description ? description.trim() : null,
          duration: parsedDuration,
          created_by: req.user.id,
        },
      ])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

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
 * Access: Authenticated Users (Student & Admin)
 */
export const getExams = async (req, res, next) => {
  try {
    const { data: exams, error } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

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
    const { data: exam, error: checkError } = await supabase
      .from('exams')
      .select('id')
      .eq('id', examId)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (!exam) {
      throw new ApiError(404, 'Exam not found.');
    }

    // Insert active session
    const { data: session, error } = await supabase
      .from('exam_sessions')
      .insert([
        {
          user_id: req.user.id,
          exam_id: examId,
          status: 'started',
        },
      ])
      .select('*')
      .single();

    if (error) {
      // Catch unique constraint violation (active session already exists)
      if (error.code === '23505') {
        throw new ApiError(400, 'You already have an active session for this exam.');
      }
      throw error;
    }

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

    // Find and update active session
    const { data: session, error } = await supabase
      .from('exam_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', req.user.id)
      .eq('exam_id', examId)
      .eq('status', 'started')
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

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
