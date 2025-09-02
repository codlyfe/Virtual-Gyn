const jwt = require('jsonwebtoken');
const { supabase, authHelpers } = require('../config/supabase');

// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          error: 'Invalid token',
          message: 'Token is invalid or expired'
        });
      }

      try {
        // Get user from Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
          return res.status(401).json({
            error: 'User not found',
            message: 'User associated with this token not found'
          });
        }

        // Add user to request object
        req.user = user;
        req.userId = user.id;
        next();
      } catch (supabaseError) {
        console.error('Supabase auth error:', supabaseError);
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Failed to verify user authentication'
        });
      }
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable'
    });
  }
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User must be authenticated'
        });
      }

      // Get user profile from database to check role
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !userProfile) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'User profile not found'
        });
      }

      const userRole = userProfile.role;
      
      if (!roles.includes(userRole)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Required roles: ${roles.join(', ')}. Your role: ${userRole}`
        });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Role verification failed'
      });
    }
  };
};

// Middleware to check if user is a doctor
const requireDoctor = requireRole(['doctor', 'admin']);

// Middleware to check if user is an admin
const requireAdmin = requireRole(['admin']);

// Middleware to check if user can access patient data
const canAccessPatient = async (req, res, next) => {
  try {
    const patientId = req.params.patientId || req.body.patientId;
    
    if (!patientId) {
      return res.status(400).json({
        error: 'Patient ID required',
        message: 'Patient ID must be provided'
      });
    }

    // Check if user is admin or doctor
    if (req.userRole === 'admin' || req.userRole === 'doctor') {
      return next();
    }

    // For patients, check if they're accessing their own data
    if (req.userRole === 'patient' && req.userId === patientId) {
      return next();
    }

    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only access your own patient data'
    });
  } catch (error) {
    console.error('Patient access check error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Access verification failed'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    // Verify token and set user if valid
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (!err) {
        try {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (!error && user) {
            req.user = user;
            req.userId = user.id;
          }
        } catch (supabaseError) {
          console.error('Optional auth Supabase error:', supabaseError);
        }
      }
      next();
    });
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue even if there's an error
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireDoctor,
  requireAdmin,
  canAccessPatient,
  optionalAuth
};
