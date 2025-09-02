// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let error = 'Internal Server Error';

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    error = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    error = 'The provided ID is not valid';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate Entry';
    error = 'A record with this information already exists';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid Token';
    error = 'The authentication token is invalid';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token Expired';
    error = 'The authentication token has expired';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
    error = 'Access denied. Please log in.';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
    error = 'You do not have permission to perform this action';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not Found';
    error = 'The requested resource was not found';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Too Many Requests';
    error = 'Rate limit exceeded. Please try again later.';
  } else if (err.name === 'SupabaseError') {
    statusCode = 500;
    message = 'Database Error';
    error = 'A database error occurred';
  } else if (err.status) {
    statusCode = err.status;
    message = err.message || 'Error';
    error = err.error || err.message;
  } else if (err.message) {
    message = err.message;
    error = err.message;
  }

  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Stack:', err.stack);
    console.error('Error Details:', {
      name: err.name,
      code: err.code,
      status: err.status,
      message: err.message
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      details: error,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        name: err.name,
        code: err.code
      })
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

// Custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Access forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}

class SupabaseError extends Error {
  constructor(message = 'Database operation failed') {
    super(message);
    this.name = 'SupabaseError';
    this.status = 500;
  }
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  SupabaseError,
  asyncHandler
};
