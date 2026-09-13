import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address.'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters long.'],
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'admin'],
        message: "Role must be either 'student' or 'admin'.",
      },
      default: 'student',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
