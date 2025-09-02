const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase, TABLES } = require('../config/supabase');
const { authenticateToken, requireDoctor, asyncHandler } = require('../middleware/auth');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateMedicalRecordData = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('doctorId').isUUID().withMessage('Valid doctor ID is required'),
  body('visitDate').isISO8601().withMessage('Valid visit date is required'),
  body('chiefComplaint').trim().notEmpty().withMessage('Chief complaint is required'),
  body('diagnosis').optional().isString().withMessage('Diagnosis must be a string'),
  body('treatment').optional().isString().withMessage('Treatment must be a string'),
  body('prescriptions').optional().isArray().withMessage('Prescriptions must be an array'),
  body('vitalSigns').optional().isObject().withMessage('Vital signs must be an object'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('followUpDate').optional().isISO8601().withMessage('Valid follow-up date is required')
];

const validateMedicalRecordUpdate = [
  body('visitDate').optional().isISO8601().withMessage('Valid visit date is required'),
  body('chiefComplaint').optional().trim().notEmpty().withMessage('Chief complaint cannot be empty'),
  body('diagnosis').optional().isString().withMessage('Diagnosis must be a string'),
  body('treatment').optional().isString().withMessage('Treatment must be a string'),
  body('prescriptions').optional().isArray().withMessage('Prescriptions must be an array'),
  body('vitalSigns').optional().isObject().withMessage('Vital signs must be an object'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('followUpDate').optional().isISO8601().withMessage('Valid follow-up date is required')
];

// Get all medical records (with filtering and pagination)
router.get('/', requireDoctor, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    patientId, 
    doctorId,
    startDate,
    endDate,
    sortBy = 'visitDate',
    sortOrder = 'desc'
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from(TABLES.MEDICAL_RECORDS)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone),
        doctors (id, firstName, lastName, specialization)
      `, { count: 'exact' });

    // Apply filters
    if (patientId) {
      query = query.eq('patientId', patientId);
    }
    if (doctorId) {
      query = query.eq('doctorId', doctorId);
    }
    if (startDate) {
      query = query.gte('visitDate', startDate);
    }
    if (endDate) {
      query = query.lte('visitDate', endDate);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: records, error, count } = await query;

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

// Get medical record by ID
router.get('/:recordId', requireDoctor, asyncHandler(async (req, res) => {
  const { recordId } = req.params;

  try {
    const { data: record, error } = await supabase
      .from(TABLES.MEDICAL_RECORDS)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone, dateOfBirth, gender),
        doctors (id, firstName, lastName, specialization, email, phone)
      `)
      .eq('id', recordId)
      .single();

    if (error || !record) {
      throw new NotFoundError('Medical record not found');
    }

    res.json({
      success: true,
      data: { record }
    });
  } catch (error) {
    throw error;
  }
}));

// Create new medical record
router.post('/', requireDoctor, validateMedicalRecordData, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const recordData = {
    ...req.body,
    createdBy: req.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const { data: record, error } = await supabase
      .from(TABLES.MEDICAL_RECORDS)
      .insert(recordData)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone),
        doctors (id, firstName, lastName, specialization)
      `)
      .single();

    if (error) {
      throw new ValidationError('Failed to create medical record');
    }

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: { record }
    });
  } catch (error) {
    throw error;
  }
}));

// Update medical record
router.put('/:recordId', requireDoctor, validateMedicalRecordUpdate, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { recordId } = req.params;
  const updates = {
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  try {
    const { data: record, error } = await supabase
      .from(TABLES.MEDICAL_RECORDS)
      .update(updates)
      .eq('id', recordId)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone),
        doctors (id, firstName, lastName, specialization)
      `)
      .single();

    if (error || !record) {
      throw new NotFoundError('Medical record not found');
    }

    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: { record }
    });
  } catch (error) {
    throw error;
  }
}));

// Delete medical record
router.delete('/:recordId', requireDoctor, asyncHandler(async (req, res) => {
  const { recordId } = req.params;

  try {
    const { data: record, error } = await supabase
      .from(TABLES.MEDICAL_RECORDS)
      .delete()
      .eq('id', recordId)
      .select()
      .single();

    if (error || !record) {
      throw new NotFoundError('Medical record not found');
    }

    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    });
  } catch (error) {
    throw error;
  }
}));

// Get patient's medical history
router.get('/patient/:patientId/history', requireDoctor, asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { data: records, error, count } = await supabase
      .from(TABLES.MEDICAL_RECORDS)
      .select(`
        *,
        doctors (id, firstName, lastName, specialization)
      `, { count: 'exact' })
      .eq('patientId', patientId)
      .order('visitDate', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ValidationError('Failed to fetch medical history');
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

// Get medical records by date range
router.get('/date-range/records', requireDoctor, asyncHandler(async (req, res) => {
  const { startDate, endDate, patientId, doctorId } = req.query;

  if (!startDate || !endDate) {
    throw new ValidationError('Start date and end date are required');
  }

  try {
    let query = supabase
      .from(TABLES.MEDICAL_RECORDS)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone),
        doctors (id, firstName, lastName, specialization)
      `)
      .gte('visitDate', startDate)
      .lte('visitDate', endDate)
      .order('visitDate', { ascending: false });

    if (patientId) {
      query = query.eq('patientId', patientId);
    }
    if (doctorId) {
      query = query.eq('doctorId', doctorId);
    }

    const { data: records, error } = await query;

    if (error) {
      throw new ValidationError('Failed to fetch medical records');
    }

    res.json({
      success: true,
      data: { records }
    });
  } catch (error) {
    throw error;
  }
}));

// Get medical record statistics
router.get('/stats/overview', requireDoctor, asyncHandler(async (req, res) => {
  const { doctorId, startDate, endDate } = req.query;

  try {
    let query = supabase
      .from(TABLES.MEDICAL_RECORDS)
      .select('visitDate, diagnosis, patientId');

    if (doctorId) {
      query = query.eq('doctorId', doctorId);
    }
    if (startDate) {
      query = query.gte('visitDate', startDate);
    }
    if (endDate) {
      query = query.lte('visitDate', endDate);
    }

    const { data: records, error } = await query;

    if (error) {
      throw new ValidationError('Failed to fetch medical record statistics');
    }

    // Calculate statistics
    const stats = {
      totalRecords: records.length,
      uniquePatients: new Set(records.map(r => r.patientId)).size,
      byDate: records.reduce((acc, record) => {
        acc[record.visitDate] = (acc[record.visitDate] || 0) + 1;
        return acc;
      }, {}),
      commonDiagnoses: records.reduce((acc, record) => {
        if (record.diagnosis) {
          acc[record.diagnosis] = (acc[record.diagnosis] || 0) + 1;
        }
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    throw error;
  }
}));

// Search medical records
router.get('/search/records', requireDoctor, asyncHandler(async (req, res) => {
  const { q, limit = 20 } = req.query;

  if (!q) {
    throw new ValidationError('Search query is required');
  }

  try {
    const { data: records, error } = await supabase
      .from(TABLES.MEDICAL_RECORDS)
      .select(`
        id, visitDate, chiefComplaint, diagnosis, treatment,
        patients (id, firstName, lastName, email),
        doctors (id, firstName, lastName, specialization)
      `)
      .or(`chiefComplaint.ilike.%${q}%,diagnosis.ilike.%${q}%,treatment.ilike.%${q}%,notes.ilike.%${q}%`)
      .limit(parseInt(limit))
      .order('visitDate', { ascending: false });

    if (error) {
      throw new ValidationError('Failed to search medical records');
    }

    res.json({
      success: true,
      data: { records }
    });
  } catch (error) {
    throw error;
  }
}));

module.exports = router;
