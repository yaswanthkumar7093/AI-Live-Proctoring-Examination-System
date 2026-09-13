import mongoose from 'mongoose';

const examSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    exam_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    status: {
      type: String,
      enum: ['started', 'completed'],
      default: 'started',
    },
    started_at: {
      type: Date,
      default: Date.now,
    },
    completed_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
  }
);

// Enforce unique active session per user+exam (mirrors SQL UNIQUE constraint)
examSessionSchema.index(
  { user_id: 1, exam_id: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'started' } }
);

const ExamSession =
  mongoose.models.ExamSession || mongoose.model('ExamSession', examSessionSchema);
export default ExamSession;
