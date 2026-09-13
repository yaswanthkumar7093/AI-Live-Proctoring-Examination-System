import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from '../config/db.js';
import { ApiError } from '../middleware/errorMiddleware.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student' } = req.body;

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

    // Check if user already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;
    if (existing.length > 0) {
      throw new ApiError(400, 'Email is already registered.');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const [newUser] = await sql`
      INSERT INTO users (name, email, password, role)
      VALUES (${name.trim()}, ${normalizedEmail}, ${hashedPassword}, ${role})
      RETURNING id, name, email, role, created_at
    `;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Please provide email and password.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await sql`SELECT * FROM users WHERE email = ${normalizedEmail}`;

    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    if (role && user.role !== role) {
      throw new ApiError(
        401,
        `Invalid account type selected. You are registered as an ${user.role.toUpperCase()}.`
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
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
