import mongoose from 'mongoose';

const proctoringLogSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSession',
      required: true,
    },
    event_type: {
      type: String,
      required: true,
      // e.g. 'face_missing', 'multiple_faces', 'tab_switch', 'looking_away', 'webcam_disconnected'
    },
    details: {
      type: String,
      trim: true,
      default: null,
    },
    is_suspicious: {
      type: Boolean,
      default: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

const ProctoringLog =
  mongoose.models.ProctoringLog || mongoose.model('ProctoringLog', proctoringLogSchema);
export default ProctoringLog;
