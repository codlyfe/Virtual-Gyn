const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase, TABLES } = require('../config/supabase');
const { authenticateToken, requireDoctor, asyncHandler } = require('../middleware/auth');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateAppointmentData = [
  body('patientId').isUUID().withMessage('Valid patient ID is required'),
  body('doctorId').isUUID().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid appointment time is required (HH:MM)'),
  body('duration').isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15 and 240 minutes'),
  body('type').isIn(['consultation', 'follow-up', 'emergency', 'routine', 'surgery']).withMessage('Valid appointment type is required'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

const validateAppointmentUpdate = [
  body('appointmentDate').optional().isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid appointment time is required (HH:MM)'),
  body('duration').optional().isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15 and 240 minutes'),
  body('status').optional().isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).withMessage('Valid status is required'),
  body('type').optional().isIn(['consultation', 'follow-up', 'emergency', 'routine', 'surgery']).withMessage('Valid appointment type is required'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

// Get all appointments (with filtering and pagination)
router.get('/', requireDoctor, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    doctorId, 
    patientId,
    date,
    type,
    sortBy = 'appointmentDate',
    sortOrder = 'asc'
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from(TABLES.APPOINTMENTS)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone),
        doctors (id, firstName, lastName, specialization)
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (doctorId) {
      query = query.eq('doctorId', doctorId);
    }
    if (patientId) {
      query = query.eq('patientId', patientId);
    }
    if (date) {
      query = query.eq('appointmentDate', date);
    }
    if (type) {
      query = query.eq('type', type);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: appointments, error, count } = await query;

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

// Get appointment by ID
router.get('/:appointmentId', requireDoctor, asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const { data: appointment, error } = await supabase
      .from(TABLES.APPOINTMENTS)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone, dateOfBirth, gender),
        doctors (id, firstName, lastName, specialization, email, phone)
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      throw new NotFoundError('Appointment not found');
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    throw error;
  }
}));

// Create new appointment
router.post('/', requireDoctor, validateAppointmentData, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const appointmentData = {
    ...req.body,
    createdBy: req.userId,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    // Check for scheduling conflicts
    const { data: conflicts, error: conflictError } = await supabase
      .from(TABLES.APPOINTMENTS)
      .select('id')
      .eq('doctorId', appointmentData.doctorId)
      .eq('appointmentDate', appointmentData.appointmentDate)
      .eq('status', 'scheduled')
      .or(`status.eq.confirmed,status.eq.in-progress`);

    if (conflictError) {
      throw new ValidationError('Failed to check for scheduling conflicts');
    }

    // Simple conflict detection (can be enhanced)
    if (conflicts && conflicts.length > 0) {
      throw new ValidationError('Appointment time conflicts with existing appointments');
    }

    const { data: appointment, error } = await supabase
      .from(TABLES.APPOINTMENTS)
      .insert(appointmentData)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone),
        doctors (id, firstName, lastName, specialization)
      `)
      .single();

    if (error) {
      throw new ValidationError('Failed to create appointment');
    }

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment }
    });
  } catch (error) {
    throw error;
  }
}));

// Update appointment
router.put('/:appointmentId', requireDoctor, validateAppointmentUpdate, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }

  const { appointmentId } = req.params;
  const updates = {
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  try {
    const { data: appointment, error } = await supabase
      .from(TABLES.APPOINTMENTS)
      .update(updates)
      .eq('id', appointmentId)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone),
        doctors (id, firstName, lastName, specialization)
      `)
      .single();

    if (error || !appointment) {
      throw new NotFoundError('Appointment not found');
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment }
    });
  } catch (error) {
    throw error;
  }
}));

// Delete appointment
router.delete('/:appointmentId', requireDoctor, asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const { data: appointment, error } = await supabase
      .from(TABLES.APPOINTMENTS)
      .delete()
      .eq('id', appointmentId)
      .select()
      .single();

    if (error || !appointment) {
      throw new NotFoundError('Appointment not found');
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    throw error;
  }
}));

// Get appointments for today
router.get('/today/schedule', requireDoctor, asyncHandler(async (req, res) => {
  const { doctorId } = req.query;
  const today = new Date().toISOString().split('T')[0];

  try {
    let query = supabase
      .from(TABLES.APPOINTMENTS)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone),
        doctors (id, firstName, lastName, specialization)
      `)
      .eq('appointmentDate', today)
      .in('status', ['scheduled', 'confirmed', 'in-progress'])
      .order('appointmentTime', { ascending: true });

    if (doctorId) {
      query = query.eq('doctorId', doctorId);
    }

    const { data: appointments, error } = await query;

    if (error) {
      throw new ValidationError('Failed to fetch today\'s appointments');
    }

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    throw error;
  }
}));

// Get upcoming appointments
router.get('/upcoming/schedule', requireDoctor, asyncHandler(async (req, res) => {
  const { doctorId, days = 7 } = req.query;
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + parseInt(days));

  try {
    let query = supabase
      .from(TABLES.APPOINTMENTS)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone),
        doctors (id, firstName, lastName, specialization)
      `)
      .gte('appointmentDate', today.toISOString().split('T')[0])
      .lte('appointmentDate', endDate.toISOString().split('T')[0])
      .in('status', ['scheduled', 'confirmed'])
      .order('appointmentDate', { ascending: true })
      .order('appointmentTime', { ascending: true });

    if (doctorId) {
      query = query.eq('doctorId', doctorId);
    }

    const { data: appointments, error } = await query;

    if (error) {
      throw new ValidationError('Failed to fetch upcoming appointments');
    }

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    throw error;
  }
}));

// Update appointment status
router.patch('/:appointmentId/status', requireDoctor, asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;

  if (!['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'].includes(status)) {
    throw new ValidationError('Invalid appointment status');
  }

  try {
    const { data: appointment, error } = await supabase
      .from(TABLES.APPOINTMENTS)
      .update({ 
        status, 
        updatedAt: new Date().toISOString() 
      })
      .eq('id', appointmentId)
      .select(`
        *,
        patients (id, firstName, lastName, email, phone),
        doctors (id, firstName, lastName, specialization)
      `)
      .single();

    if (error || !appointment) {
      throw new NotFoundError('Appointment not found');
    }

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: { appointment }
    });
  } catch (error) {
    throw error;
  }
}));

// Get appointment statistics
router.get('/stats/overview', requireDoctor, asyncHandler(async (req, res) => {
  const { doctorId, startDate, endDate } = req.query;

  try {
    let query = supabase
      .from(TABLES.APPOINTMENTS)
      .select('status, appointmentDate, type');

    if (doctorId) {
      query = query.eq('doctorId', doctorId);
    }
    if (startDate) {
      query = query.gte('appointmentDate', startDate);
    }
    if (endDate) {
      query = query.lte('appointmentDate', endDate);
    }

    const { data: appointments, error } = await query;

    if (error) {
      throw new ValidationError('Failed to fetch appointment statistics');
    }

    // Calculate statistics
    const stats = {
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
