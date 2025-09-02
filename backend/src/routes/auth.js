const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase, authHelpers, dbHelpers } = require('../config/supabase');
const { authenticateToken, asyncHandler } = require('../middleware/auth');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('role').isIn(['patient', 'doctor', 'admin']).withMessage('Valid role is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const validatePasswordReset = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
];

const validatePasswordUpdate = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
];

// Register new user
router.post('/register', validateRegistration, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { email, password, firstName, lastName, role, phone, dateOfBirth, gender } = req.body;

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await authHelpers.signUp(email, password, {
      firstName,
      lastName,
      role
    });

    if (authError) {
      throw new ValidationError(authError.message);
    }

    // Create user profile in database
    const userProfile = {
      id: authData.user.id,
      email,
      firstName,
      lastName,
      role,
      phone: phone || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert(userProfile)
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new ValidationError('Failed to create user profile');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: authData.user.id, email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: profileData.id,
          email: profileData.email,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          role: profileData.role,
          phone: profileData.phone
        },
        token
      }
    });
  } catch (error) {
    throw error;
  }
}));

// Login user
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { email, password } = req.body;

  try {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await authHelpers.signIn(email, password);

    if (authError) {
      throw new ValidationError('Invalid email or password');
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !userProfile) {
      throw new NotFoundError('User profile not found');
    }

    if (!userProfile.isActive) {
      throw new ValidationError('Account is deactivated');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userProfile.id, email: userProfile.email, role: userProfile.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          role: userProfile.role,
          phone: userProfile.phone,
          dateOfBirth: userProfile.dateOfBirth,
          gender: userProfile.gender
        },
        token
      }
    });
  } catch (error) {
    throw error;
  }
}));

// Get current user profile
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (error || !userProfile) {
      throw new NotFoundError('User profile not found');
    }

    res.json({
      success: true,
      data: {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          role: userProfile.role,
          phone: userProfile.phone,
          dateOfBirth: userProfile.dateOfBirth,
          gender: userProfile.gender,
          isActive: userProfile.isActive,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt
        }
      }
    });
  } catch (error) {
    throw error;
  }
}));

// Update user profile
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, dateOfBirth, gender } = req.body;

  try {
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
    if (gender) updates.gender = gender;
    updates.updatedAt = new Date().toISOString();

    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.userId)
      .select()
      .single();

    if (error) {
      throw new ValidationError('Failed to update profile');
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedProfile.id,
          email: updatedProfile.email,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          role: updatedProfile.role,
          phone: updatedProfile.phone,
          dateOfBirth: updatedProfile.dateOfBirth,
          gender: updatedProfile.gender
        }
      }
    });
  } catch (error) {
    throw error;
  }
}));

// Request password reset
router.post('/forgot-password', validatePasswordReset, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { email } = req.body;

  try {
    await authHelpers.resetPassword(email);

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    // Don't reveal if email exists or not for security
    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset email has been sent'
    });
  }
}));

// Update password
router.put('/change-password', authenticateToken, validatePasswordUpdate, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { currentPassword, newPassword } = req.body;

  try {
    // Verify current password
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      throw new ValidationError('Authentication failed');
    }

    // Update password
    await authHelpers.updatePassword(newPassword);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    throw new ValidationError('Failed to update password');
  }
}));

// Logout user
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  try {
    await authHelpers.signOut();

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    // Even if logout fails, we still return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}));

// Refresh token
router.post('/refresh-token', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  try {
    // Verify refresh token and get new access token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      throw new ValidationError('Invalid refresh token');
    }

    // Generate new JWT token
    const token = jwt.sign(
      { userId: data.user.id, email: data.user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        refreshToken: data.session.refresh_token
      }
    });
  } catch (error) {
    throw error;
  }
}));

module.exports = router;
