/**
 * Custom error class for API errors.
 * Extends the built-in Error class with an HTTP status code.
 */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle 404 - Route not found.
 */
export const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};

/**
 * Centralized error handling middleware.
 * Catches all errors thrown in the application and sends
 * a consistent JSON error response.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Supabase errors
  if (err.code && err.code.startsWith('PGRST')) {
    statusCode = 400;
    message = `Database query error: ${err.message || ''} ${err.details || ''}`.trim();
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // Log error unconditionally for visibility in Vercel logs
  console.error('❌ Error details:', {
    message: err.message,
    code: err.code,
    details: err.details,
    hint: err.hint,
    stack: err.stack,
    statusCode,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
