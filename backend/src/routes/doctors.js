const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase, TABLES } = require('../config/supabase');
const { authenticateToken, requireAdmin, asyncHandler } = require('../middleware/auth');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateDoctorData = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
  body('qualifications').optional().isArray().withMessage('Qualifications must be an array'),
  body('experience').optional().isInt({ min: 0 }).withMessage('Experience must be a positive integer'),
  body('clinicId').optional().isUUID().withMessage('Valid clinic ID is required'),
  body('availability').optional().isObject().withMessage('Availability must be an object'),
  body('consultationFee').optional().isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number')
];

const validateDoctorUpdate = [
  body('specialization').optional().trim().notEmpty().withMessage('Specialization cannot be empty'),
  body('licenseNumber').optional().trim().notEmpty().withMessage('License number cannot be empty'),
  body('qualifications').optional().isArray().withMessage('Qualifications must be an array'),
  body('experience').optional().isInt({ min: 0 }).withMessage('Experience must be a positive integer'),
  body('clinicId').optional().isUUID().withMessage('Valid clinic ID is required'),
  body('availability').optional().isObject().withMessage('Availability must be an object'),
  body('consultationFee').optional().isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number')
];

// Get all doctors (with filtering and pagination)
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    specialization, 
    clinicId,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from(TABLES.DOCTORS)
      .select(`
        *,
        users (id, firstName, lastName, email, phone),
        clinics (id, name, address)
      `, { count: 'exact' });

    // Apply filters
    if (specialization) {
      query = query.eq('specialization', specialization);
    }
    if (clinicId) {
      query = query.eq('clinicId', clinicId);
    }
    if (search) {
      query = query.or(`users.firstName.ilike.%${search}%,users.lastName.ilike.%${search}%,specialization.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: doctors, error, count } = await query;

    if (error) {
      throw new ValidationError('Failed to fetch doctors');
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

// Get doctor by ID
router.get('/:doctorId', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  try {
    const { data: doctor, error } = await supabase
      .from(TABLES.DOCTORS)
      .select(`
        *,
        users (id, firstName, lastName, email, phone, dateOfBirth, gender),
        clinics (id, name, address, phone, email)
      `)
      .eq('id', doctorId)
      .single();

    if (error || !doctor) {
      throw new NotFoundError('Doctor not found');
    }

    res.json({
      success: true,
      data: { doctor }
    });
  } catch (error) {
    throw error;
  }
}));

// Create new doctor
router.post('/', requireAdmin, validateDoctorData, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const doctorData = {
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const { data: doctor, error } = await supabase
      .from(TABLES.DOCTORS)
      .insert(doctorData)
      .select(`
        *,
        users (id, firstName, lastName, email, phone),
        clinics (id, name, address)
      `)
      .single();

    if (error) {
      throw new ValidationError('Failed to create doctor profile');
    }

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      data: { doctor }
    });
  } catch (error) {
    throw error;
  }
}));

// Update doctor
router.put('/:doctorId', requireAdmin, validateDoctorUpdate, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { doctorId } = req.params;
  const updates = {
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  try {
    const { data: doctor, error } = await supabase
      .from(TABLES.DOCTORS)
      .update(updates)
      .eq('id', doctorId)
      .select(`
        *,
        users (id, firstName, lastName, email, phone),
        clinics (id, name, address)
      `)
      .single();

    if (error || !doctor) {
      throw new NotFoundError('Doctor not found');
    }

    res.json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: { doctor }
    });
  } catch (error) {
    throw error;
  }
}));

// Delete doctor
router.delete('/:doctorId', requireAdmin, asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  try {
    const { data: doctor, error } = await supabase
      .from(TABLES.DOCTORS)
      .delete()
      .eq('id', doctorId)
      .select()
      .single();

    if (error || !doctor) {
      throw new NotFoundError('Doctor not found');
    }

    res.json({
      success: true,
      message: 'Doctor profile deleted successfully'
    });
  } catch (error) {
    throw error;
  }
}));

// Get doctor's appointments
router.get('/:doctorId/appointments', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { page = 1, limit = 20, status, date } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from(TABLES.APPOINTMENTS)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone)
      `, { count: 'exact' })
      .eq('doctorId', doctorId);

    if (status) {
      query = query.eq('status', status);
    }
    if (date) {
      query = query.eq('appointmentDate', date);
    }

    const { data: appointments, error, count } = await query
      .order('appointmentDate', { ascending: true })
      .order('appointmentTime', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ValidationError('Failed to fetch doctor appointments');
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

// Get doctor's schedule
router.get('/:doctorId/schedule', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ValidationError('Start date and end date are required');
  }

  try {
    const { data: appointments, error } = await supabase
      .from(TABLES.APPOINTMENTS)
      .select(`
        id, appointmentDate, appointmentTime, duration, status, type,
        patients (id, firstName, lastName, email, phone)
      `)
      .eq('doctorId', doctorId)
      .gte('appointmentDate', startDate)
      .lte('appointmentDate', endDate)
      .order('appointmentDate', { ascending: true })
      .order('appointmentTime', { ascending: true });

    if (error) {
      throw new ValidationError('Failed to fetch doctor schedule');
    }

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    throw error;
  }
}));

// Get doctor's medical records
router.get('/:doctorId/medical-records', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { page = 1, limit = 20, startDate, endDate } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from(TABLES.MEDICAL_RECORDS)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone)
      `, { count: 'exact' })
      .eq('doctorId', doctorId);

    if (startDate) {
      query = query.gte('visitDate', startDate);
    }
    if (endDate) {
      query = query.lte('visitDate', endDate);
    }

    const { data: records, error, count } = await query
      .order('visitDate', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ValidationError('Failed to fetch doctor medical records');
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

// Get doctor statistics
router.get('/:doctorId/stats', asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    // Get appointment statistics
    let appointmentQuery = supabase
      .from(TABLES.APPOINTMENTS)
      .select('status, appointmentDate, type')
      .eq('doctorId', doctorId);

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

    // Get medical record statistics
    let recordQuery = supabase
      .from(TABLES.MEDICAL_RECORDS)
      .select('visitDate, diagnosis, patientId')
      .eq('doctorId', doctorId);

    if (startDate) {
      recordQuery = recordQuery.gte('visitDate', startDate);
    }
    if (endDate) {
      recordQuery = recordQuery.lte('visitDate', endDate);
    }

    const { data: records, error: recordError } = await recordQuery;

    if (recordError) {
      throw new ValidationError('Failed to fetch medical record statistics');
    }

    // Calculate statistics
    const stats = {
      appointments: {
        total: appointments.length,
        byStatus: appointments.reduce((acc, apt) => {
          acc[apt.status] = (acc[apt.status] || 0) + 1;
          return acc;
        }, {}),
        byType: appointments.reduce((acc, apt) => {
          acc[apt.type] = (acc[apt.type] || 0) + 1;
          return acc;
        }, {})
      },
      medicalRecords: {
        total: records.length,
        uniquePatients: new Set(records.map(r => r.patientId)).size,
        commonDiagnoses: records.reduce((acc, record) => {
          if (record.diagnosis) {
            acc[record.diagnosis] = (acc[record.diagnosis] || 0) + 1;
          }
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

// Search doctors
router.get('/search/doctors', asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    throw new ValidationError('Search query is required');
  }

  try {
    const { data: doctors, error } = await supabase
      .from(TABLES.DOCTORS)
      .select(`
        id, specialization, licenseNumber, experience, consultationFee,
        users (id, firstName, lastName, email, phone),
        clinics (id, name, address)
      `)
      .or(`users.firstName.ilike.%${q}%,users.lastName.ilike.%${q}%,specialization.ilike.%${q}%`)
      .limit(parseInt(limit))
      .order('users.firstName', { ascending: true });

    if (error) {
      throw new ValidationError('Failed to search doctors');
    }

    res.json({
      success: true,
      data: { doctors }
    });
  } catch (error) {
    throw error;
  }
}));

module.exports = router;
