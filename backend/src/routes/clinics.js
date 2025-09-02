const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase, TABLES } = require('../config/supabase');
const { authenticateToken, requireAdmin, asyncHandler } = require('../middleware/auth');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateClinicData = [
  body('name').trim().notEmpty().withMessage('Clinic name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('website').optional().isURL().withMessage('Valid website URL is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('services').optional().isArray().withMessage('Services must be an array'),
  body('operatingHours').optional().isObject().withMessage('Operating hours must be an object'),
  body('isActive').optional().isBoolean().withMessage('Is active must be a boolean')
];

const validateClinicUpdate = [
  body('name').optional().trim().notEmpty().withMessage('Clinic name cannot be empty'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('website').optional().isURL().withMessage('Valid website URL is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('services').optional().isArray().withMessage('Services must be an array'),
  body('operatingHours').optional().isObject().withMessage('Operating hours must be an object'),
  body('isActive').optional().isBoolean().withMessage('Is active must be a boolean')
];

// Get all clinics (with filtering and pagination)
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from(TABLES.CLINICS)
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (isActive !== undefined) {
      query = query.eq('isActive', isActive === 'true');
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: clinics, error, count } = await query;

    if (error) {
      throw new ValidationError('Failed to fetch clinics');
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        clinics,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount: count,
          limit: parseInt(limit),
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    throw error;
  }
}));

// Get clinic by ID
router.get('/:clinicId', asyncHandler(async (req, res) => {
  const { clinicId } = req.params;

  try {
    const { data: clinic, error } = await supabase
      .from(TABLES.CLINICS)
      .select('*')
      .eq('id', clinicId)
      .single();

    if (error || !clinic) {
      throw new NotFoundError('Clinic not found');
    }

    res.json({
      success: true,
      data: { clinic }
    });
  } catch (error) {
    throw error;
  }
}));

// Create new clinic
router.post('/', requireAdmin, validateClinicData, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const clinicData = {
    ...req.body,
    createdBy: req.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const { data: clinic, error } = await supabase
      .from(TABLES.CLINICS)
      .insert(clinicData)
      .select()
      .single();

    if (error) {
      throw new ValidationError('Failed to create clinic');
    }

    res.status(201).json({
      success: true,
      message: 'Clinic created successfully',
      data: { clinic }
    });
  } catch (error) {
    throw error;
  }
}));

// Update clinic
router.put('/:clinicId', requireAdmin, validateClinicUpdate, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { clinicId } = req.params;
  const updates = {
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  try {
    const { data: clinic, error } = await supabase
      .from(TABLES.CLINICS)
      .update(updates)
      .eq('id', clinicId)
      .select()
      .single();

    if (error || !clinic) {
      throw new NotFoundError('Clinic not found');
    }

    res.json({
      success: true,
      message: 'Clinic updated successfully',
      data: { clinic }
    });
  } catch (error) {
    throw error;
  }
}));

// Delete clinic
router.delete('/:clinicId', requireAdmin, asyncHandler(async (req, res) => {
  const { clinicId } = req.params;

  try {
    const { data: clinic, error } = await supabase
      .from(TABLES.CLINICS)
      .delete()
      .eq('id', clinicId)
      .select()
      .single();

    if (error || !clinic) {
      throw new NotFoundError('Clinic not found');
    }

    res.json({
      success: true,
      message: 'Clinic deleted successfully'
    });
  } catch (error) {
    throw error;
  }
}));

// Get clinic's doctors
router.get('/:clinicId/doctors', asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const { page = 1, limit = 20, specialization } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from(TABLES.DOCTORS)
      .select(`
        *,
        users (id, firstName, lastName, email, phone)
      `, { count: 'exact' })
      .eq('clinicId', clinicId);

    if (specialization) {
      query = query.eq('specialization', specialization);
    }

    const { data: doctors, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ValidationError('Failed to fetch clinic doctors');
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        doctors,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount: count,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    throw error;
  }
}));

// Get clinic's appointments
router.get('/:clinicId/appointments', asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const { page = 1, limit = 20, date, status } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from(TABLES.APPOINTMENTS)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone),
        doctors (id, specialization, users (id, firstName, lastName))
      `, { count: 'exact' })
      .eq('clinicId', clinicId);

    if (date) {
      query = query.eq('appointmentDate', date);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: appointments, error, count } = await query
      .order('appointmentDate', { ascending: true })
      .order('appointmentTime', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ValidationError('Failed to fetch clinic appointments');
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount: count,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    throw error;
  }
}));

// Get clinic statistics
router.get('/:clinicId/stats', asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    // Get doctor count
    const { count: doctorCount, error: doctorError } = await supabase
      .from(TABLES.DOCTORS)
      .select('*', { count: 'exact', head: true })
      .eq('clinicId', clinicId);

    if (doctorError) {
      throw new ValidationError('Failed to fetch doctor statistics');
    }

    // Get appointment statistics
    let appointmentQuery = supabase
      .from(TABLES.APPOINTMENTS)
      .select('status, appointmentDate, type')
      .eq('clinicId', clinicId);

    if (startDate) {
      appointmentQuery = appointmentQuery.gte('appointmentDate', startDate);
    }
    if (endDate) {
      appointmentQuery = appointmentQuery.lte('appointmentDate', endDate);
    }

    const { data: appointments, error: appointmentError } = await appointmentQuery;

    if (appointmentError) {
      throw new ValidationError('Failed to fetch appointment statistics');
    }

    // Calculate statistics
    const stats = {
      totalDoctors: doctorCount,
      appointments: {
        total: appointments.length,
        byStatus: appointments.reduce((acc, apt) => {
          acc[apt.status] = (acc[apt.status] || 0) + 1;
          return acc;
        }, {}),
        byType: appointments.reduce((acc, apt) => {
          acc[apt.type] = (acc[apt.type] || 0) + 1;
          return acc;
        }, {}),
        byDate: appointments.reduce((acc, apt) => {
          acc[apt.appointmentDate] = (acc[apt.appointmentDate] || 0) + 1;
          return acc;
        }, {})
      }
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    throw error;
  }
}));

// Search clinics
router.get('/search/clinics', asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    throw new ValidationError('Search query is required');
  }

  try {
    const { data: clinics, error } = await supabase
      .from(TABLES.CLINICS)
      .select('id, name, address, phone, email, isActive')
      .or(`name.ilike.%${q}%,address.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(parseInt(limit))
      .order('name', { ascending: true });

    if (error) {
      throw new ValidationError('Failed to search clinics');
    }

    res.json({
      success: true,
      data: { clinics }
    });
  } catch (error) {
    throw error;
  }
}));

// Get clinic services
router.get('/:clinicId/services', asyncHandler(async (req, res) => {
  const { clinicId } = req.params;

  try {
    const { data: clinic, error } = await supabase
      .from(TABLES.CLINICS)
      .select('services')
      .eq('id', clinicId)
      .single();

    if (error || !clinic) {
      throw new NotFoundError('Clinic not found');
    }

    res.json({
      success: true,
      data: { services: clinic.services || [] }
    });
  } catch (error) {
    throw error;
  }
}));

// Get clinic operating hours
router.get('/:clinicId/operating-hours', asyncHandler(async (req, res) => {
  const { clinicId } = req.params;

  try {
    const { data: clinic, error } = await supabase
      .from(TABLES.CLINICS)
      .select('operatingHours')
      .eq('id', clinicId)
      .single();

    if (error || !clinic) {
      throw new NotFoundError('Clinic not found');
    }

    res.json({
      success: true,
      data: { operatingHours: clinic.operatingHours || {} }
    });
  } catch (error) {
    throw error;
  }
}));

module.exports = router;
