import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import { ApiError } from '../middleware/errorMiddleware.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student' } = req.body;

    // 1. Basic validation
    if (!name || !email || !password) {
      throw new ApiError(400, 'Please provide name, email, and password.');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, 'Please provide a valid email address.');
    }

    // Validate password length
    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long.');
    }

    // Validate role
    if (role !== 'student' && role !== 'admin') {
      throw new ApiError(400, "Role must be either 'student' or 'admin'.");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingUser) {
      throw new ApiError(400, 'Email is already registered.');
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user in Supabase users table
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role,
        },
      ])
      .select('id, name, email, role, created_at')
      .single();

    if (insertError) {
      throw insertError;
    }

    // 5. Respond with user info
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
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      throw new ApiError(400, 'Please provide email and password.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Fetch user from Supabase users table
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    // Generic credentials error for security
    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 5. Respond with token and user details
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
    // req.user is set by the authenticate middleware
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};
