import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSession',
      required: true,
    },
    log_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProctoringLog',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    is_resolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
export default Alert;
