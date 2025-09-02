const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
}

// Create Supabase client for client-side operations (with anon key)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Create Supabase admin client for server-side operations (with service role key)
const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Database table names
const TABLES = {
  USERS: 'users',
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  MEDICAL_RECORDS: 'medical_records',
  DOCTORS: 'doctors',
  CLINICS: 'clinics',
  PRESCRIPTIONS: 'prescriptions',
  LAB_RESULTS: 'lab_results',
  MEDICATIONS: 'medications',
  NOTIFICATIONS: 'notifications'
};

// Helper functions for common database operations
const dbHelpers = {
  // User operations
  async getUserById(userId) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createUser(userData) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(userId, updates) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Patient operations
  async getPatients(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from(TABLES.PATIENTS)
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getPatientById(patientId) {
    const { data, error } = await supabase
      .from(TABLES.PATIENTS)
      .select('*')
      .eq('id', patientId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createPatient(patientData) {
    const { data, error } = await supabase
      .from(TABLES.PATIENTS)
      .insert(patientData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Appointment operations
  async getAppointments(doctorId = null, patientId = null, date = null) {
    let query = supabase
      .from(TABLES.APPOINTMENTS)
      .select(`
        *,
        patients (*),
        doctors (*)
      `)
      .order('appointment_date', { ascending: true });

    if (doctorId) query = query.eq('doctor_id', doctorId);
    if (patientId) query = query.eq('patient_id', patientId);
    if (date) query = query.eq('appointment_date', date);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createAppointment(appointmentData) {
    const { data, error } = await supabase
      .from(TABLES.APPOINTMENTS)
      .insert(appointmentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Medical records operations
  async getMedicalRecords(patientId) {
    const { data, error } = await supabase
      .from(TABLES.MEDICAL_RECORDS)
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createMedicalRecord(recordData) {
    const { data, error } = await supabase
      .from(TABLES.MEDICAL_RECORDS)
      .insert(recordData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // File upload helper
  async uploadFile(bucketName, filePath, file) {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    return data;
  },

  // Get file URL
  async getFileUrl(bucketName, filePath) {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }
};

// Authentication helpers
const authHelpers = {
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  TABLES,
  dbHelpers,
  authHelpers
};
