import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';

/**
 * Middleware to authenticate requests using JWT.
 * Extracts token from Authorization header, verifies it,
 * and attaches the user object to req.user.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database to ensure they still exist
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user no longer exists.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

/**
 * Middleware for role-based access control.
 * Accepts an array of allowed roles and checks if the
 * authenticated user's role is included.
 *
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'student')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
      });
    }

    next();
  };
};
