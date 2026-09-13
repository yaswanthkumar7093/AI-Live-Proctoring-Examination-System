import jwt from 'jsonwebtoken';
import sql from '../config/db.js';

/**
 * Authenticate JWT and attach user to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. Invalid token format.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [user] = await sql`
      SELECT id, name, email, role, created_at
      FROM users WHERE id = ${decoded.id}
    `;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Token is valid but user no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
    }
    return res.status(500).json({ success: false, message: 'Authentication failed.' });
  }
};

/**
 * Role-based access control
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
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
