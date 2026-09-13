import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import { ApiError } from '../middleware/errorMiddleware.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    await connectDB();

    const { name, email, password, role = 'student' } = req.body;

    // 1. Basic validation
    if (!name || !email || !password) {
      throw new ApiError(400, 'Please provide name, email, and password.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, 'Please provide a valid email address.');
    }

    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long.');
    }

    if (role !== 'student' && role !== 'admin') {
      throw new ApiError(400, "Role must be either 'student' or 'admin'.");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ApiError(400, 'Email is already registered.');
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    // 5. Respond (exclude password)
    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    // Handle Mongoose duplicate key error
    if (error.code === 11000) {
      return next(new ApiError(400, 'Email is already registered.'));
    }
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    await connectDB();

    const { email, password, role } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Please provide email and password.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Fetch user (include password for comparison)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    // Enforce role match if provided
    if (role && user.role !== role) {
      throw new ApiError(
        401,
        `Invalid account type selected. You are registered as an ${user.role.toUpperCase()}.`
      );
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get authenticated user profile
 * GET /api/auth/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};
