import connectDB from '../config/db.js';
import Exam from '../models/Exam.js';
import ExamSession from '../models/ExamSession.js';
import { ApiError } from '../middleware/errorMiddleware.js';

/**
 * Create a new exam
 * POST /api/exams
 * Access: Admin only
 */
export const createExam = async (req, res, next) => {
  try {
    await connectDB();

    const { title, description, duration } = req.body;

    if (!title || !duration) {
      throw new ApiError(400, 'Please provide exam title and duration (in minutes).');
    }

    const parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      throw new ApiError(400, 'Duration must be a positive integer.');
    }

    const exam = await Exam.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      duration: parsedDuration,
      created_by: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Exam created successfully.',
      data: {
        id: exam._id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        created_by: exam.created_by,
        created_at: exam.created_at,
      },
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
    await connectDB();

    const exams = await Exam.find().sort({ created_at: -1 }).lean();

    return res.status(200).json({
      success: true,
      data: exams.map((e) => ({
        id: e._id,
        title: e.title,
        description: e.description,
        duration: e.duration,
        created_by: e.created_by,
        created_at: e.created_at,
      })),
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
    await connectDB();

    const examId = req.params.id;

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new ApiError(404, 'Exam not found.');
    }

    // Check for existing active session
    const existingSession = await ExamSession.findOne({
      user_id: req.user.id,
      exam_id: examId,
      status: 'started',
    });

    if (existingSession) {
      throw new ApiError(400, 'You already have an active session for this exam.');
    }

    const session = await ExamSession.create({
      user_id: req.user.id,
      exam_id: examId,
      status: 'started',
    });

    return res.status(201).json({
      success: true,
      message: 'Exam session started successfully.',
      data: {
        id: session._id,
        user_id: session.user_id,
        exam_id: session.exam_id,
        status: session.status,
        started_at: session.started_at,
        completed_at: session.completed_at,
      },
    });
  } catch (error) {
    // Handle Mongoose duplicate key (unique index)
    if (error.code === 11000) {
      return next(new ApiError(400, 'You already have an active session for this exam.'));
    }
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
    await connectDB();

    const examId = req.params.id;

    const session = await ExamSession.findOneAndUpdate(
      {
        user_id: req.user.id,
        exam_id: examId,
        status: 'started',
      },
      {
        status: 'completed',
        completed_at: new Date(),
      },
      { new: true }
    );

    if (!session) {
      throw new ApiError(404, 'No active exam session found to submit.');
    }

    return res.status(200).json({
      success: true,
      message: 'Exam session submitted successfully.',
      data: {
        id: session._id,
        user_id: session.user_id,
        exam_id: session.exam_id,
        status: session.status,
        started_at: session.started_at,
        completed_at: session.completed_at,
      },
    });
  } catch (error) {
    next(error);
  }
};
