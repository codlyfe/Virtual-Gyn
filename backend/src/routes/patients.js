const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { supabase, dbHelpers, TABLES } = require('../config/supabase');
const { authenticateToken, requireDoctor, canAccessPatient, asyncHandler } = require('../middleware/auth');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validatePatientData = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('emergencyContact').optional().isObject().withMessage('Emergency contact must be an object'),
  body('medicalHistory').optional().isArray().withMessage('Medical history must be an array'),
  body('allergies').optional().isArray().withMessage('Allergies must be an array'),
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Valid blood type is required')
];

const validatePatientUpdate = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth is required'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required')
];

// Get all patients (with pagination and filtering)
router.get('/', requireDoctor, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    search, 
    gender, 
    bloodType,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from(TABLES.PATIENTS)
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (gender) {
      query = query.eq('gender', gender);
    }
    if (bloodType) {
      query = query.eq('bloodType', bloodType);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: patients, error, count } = await query;

    if (error) {
      throw new ValidationError('Failed to fetch patients');
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        patients,
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

// Get patient by ID
router.get('/:patientId', canAccessPatient, asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  try {
    const { data: patient, error } = await supabase
      .from(TABLES.PATIENTS)
      .select(`
        *,
        medical_records (*),
        appointments (*)
      `)
      .eq('id', patientId)
      .single();

    if (error || !patient) {
      throw new NotFoundError('Patient not found');
    }

    res.json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    throw error;
  }
}));

// Create new patient
router.post('/', requireDoctor, validatePatientData, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const patientData = {
    ...req.body,
    createdBy: req.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const { data: patient, error } = await supabase
      .from(TABLES.PATIENTS)
      .insert(patientData)
      .select()
      .single();

    if (error) {
      throw new ValidationError('Failed to create patient');
    }

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: { patient }
    });
  } catch (error) {
    throw error;
  }
}));

// Update patient
router.put('/:patientId', canAccessPatient, validatePatientUpdate, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { patientId } = req.params;
  const updates = {
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  try {
    const { data: patient, error } = await supabase
      .from(TABLES.PATIENTS)
      .update(updates)
      .eq('id', patientId)
      .select()
      .single();

    if (error || !patient) {
      throw new NotFoundError('Patient not found');
    }

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: { patient }
    });
  } catch (error) {
    throw error;
  }
}));

// Delete patient (soft delete)
router.delete('/:patientId', requireDoctor, asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  try {
    const { data: patient, error } = await supabase
      .from(TABLES.PATIENTS)
      .update({ 
        isActive: false, 
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', patientId)
      .select()
      .single();

    if (error || !patient) {
      throw new NotFoundError('Patient not found');
    }

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    throw error;
  }
}));

// Get patient medical records
router.get('/:patientId/medical-records', canAccessPatient, asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { data: records, error, count } = await supabase
      .from(TABLES.MEDICAL_RECORDS)
      .select('*', { count: 'exact' })
      .eq('patientId', patientId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ValidationError('Failed to fetch medical records');
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        records,
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

// Get patient appointments
router.get('/:patientId/appointments', canAccessPatient, asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from(TABLES.APPOINTMENTS)
      .select(`
        *,
        doctors (id, firstName, lastName, specialization)
      `, { count: 'exact' })
      .eq('patientId', patientId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: appointments, error, count } = await query
      .order('appointmentDate', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ValidationError('Failed to fetch appointments');
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

// Search patients
router.get('/search/patients', requireDoctor, asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    throw new ValidationError('Search query is required');
  }

  try {
    const { data: patients, error } = await supabase
      .from(TABLES.PATIENTS)
      .select('id, firstName, lastName, email, phone, dateOfBirth')
      .or(`firstName.ilike.%${q}%,lastName.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(parseInt(limit))
      .order('firstName', { ascending: true });

    if (error) {
      throw new ValidationError('Failed to search patients');
    }

    res.json({
      success: true,
      data: { patients }
    });
  } catch (error) {
    throw error;
  }
}));

// Get patient statistics
router.get('/:patientId/stats', canAccessPatient, asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  try {
    // Get appointment count by status
    const { data: appointmentStats, error: appointmentError } = await supabase
      .from(TABLES.APPOINTMENTS)
      .select('status')
      .eq('patientId', patientId);

    if (appointmentError) {
      throw new ValidationError('Failed to fetch appointment statistics');
    }

    // Get medical records count
    const { count: recordCount, error: recordError } = await supabase
      .from(TABLES.MEDICAL_RECORDS)
      .select('*', { count: 'exact', head: true })
      .eq('patientId', patientId);

    if (recordError) {
      throw new ValidationError('Failed to fetch medical record statistics');
    }

    // Calculate appointment statistics
    const appointmentCounts = appointmentStats.reduce((acc, appointment) => {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      totalAppointments: appointmentStats.length,
      appointmentByStatus: appointmentCounts,
      totalMedicalRecords: recordCount,
      lastAppointment: appointmentStats.length > 0 ? 
        appointmentStats.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))[0] : null
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    throw error;
  }
}));

module.exports = router;
