import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Exam title is required.'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required.'],
      min: [1, 'Duration must be a positive integer.'],
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

const Exam = mongoose.models.Exam || mongoose.model('Exam', examSchema);
export default Exam;
