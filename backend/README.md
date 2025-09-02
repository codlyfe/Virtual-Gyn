# Uganda Gynecology Platform - Backend API

A comprehensive Node.js/Express backend API for the Uganda Gynecology Platform, built with Supabase for database management and authentication.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Patient Management**: Complete CRUD operations for patient records
- **Appointment Scheduling**: Appointment booking, management, and conflict detection
- **Medical Records**: Secure medical record management with history tracking
- **Doctor Management**: Doctor profiles, specializations, and schedules
- **Clinic Management**: Multi-clinic support with operating hours and services
- **Security**: Rate limiting, CORS, helmet security headers, input validation
- **File Upload**: Secure file upload and storage with Supabase Storage
- **Search & Filtering**: Advanced search and filtering capabilities
- **Pagination**: Efficient data pagination for large datasets
- **Error Handling**: Comprehensive error handling and logging

## 📋 Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn
- Supabase account and project
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd uganda-gynae-platform/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy the environment example file
   cp env.example .env.local
   
   # Edit the environment variables
   nano .env.local
   ```

4. **Configure Environment Variables**
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── supabase.js          # Supabase client configuration
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── errorHandler.js      # Error handling middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── patients.js          # Patient management routes
│   │   ├── appointments.js      # Appointment management routes
│   │   ├── medicalRecords.js    # Medical record routes
│   │   ├── doctors.js           # Doctor management routes
│   │   └── clinics.js           # Clinic management routes
│   └── index.js                 # Main application entry point
├── package.json                 # Dependencies and scripts
├── env.example                  # Environment variables template
└── README.md                    # This file
```

## 🔧 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run build` - Build the application for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "patient",
  "phone": "+256123456789"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Patient Endpoints

#### Get All Patients
```http
GET /api/patients?page=1&limit=20&search=john&gender=female
Authorization: Bearer <token>
```

#### Create Patient
```http
POST /api/patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "dateOfBirth": "1990-01-01",
  "gender": "female",
  "phone": "+256123456789",
  "email": "jane@example.com",
  "address": "Kampala, Uganda"
}
```

#### Get Patient by ID
```http
GET /api/patients/:patientId
Authorization: Bearer <token>
```

### Appointment Endpoints

#### Get All Appointments
```http
GET /api/appointments?page=1&limit=20&status=scheduled&doctorId=123
Authorization: Bearer <token>
```

#### Create Appointment
```http
POST /api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-uuid",
  "doctorId": "doctor-uuid",
  "appointmentDate": "2024-01-15",
  "appointmentTime": "14:30",
  "duration": 60,
  "type": "consultation",
  "reason": "Regular checkup"
}
```

#### Update Appointment Status
```http
PATCH /api/appointments/:appointmentId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

### Medical Records Endpoints

#### Get Medical Records
```http
GET /api/medical-records?page=1&limit=20&patientId=123
Authorization: Bearer <token>
```

#### Create Medical Record
```http
POST /api/medical-records
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-uuid",
  "doctorId": "doctor-uuid",
  "visitDate": "2024-01-15",
  "chiefComplaint": "Abdominal pain",
  "diagnosis": "Menstrual cramps",
  "treatment": "Pain medication prescribed",
  "notes": "Patient reports regular menstrual cycle"
}
```

### Doctor Endpoints

#### Get All Doctors
```http
GET /api/doctors?page=1&limit=20&specialization=gynecology
```

#### Create Doctor
```http
POST /api/doctors
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "specialization": "Gynecology",
  "licenseNumber": "MD123456",
  "qualifications": ["MBChB", "MSc Gynecology"],
  "experience": 10,
  "consultationFee": 50000
}
```

### Clinic Endpoints

#### Get All Clinics
```http
GET /api/clinics?page=1&limit=20&search=kampala
```

#### Create Clinic
```http
POST /api/clinics
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Kampala Women's Clinic",
  "address": "Plot 123, Kampala Road, Kampala",
  "phone": "+256123456789",
  "email": "info@kampalawomensclinic.com",
  "services": ["Gynecology", "Obstetrics", "Family Planning"],
  "operatingHours": {
    "monday": "08:00-17:00",
    "tuesday": "08:00-17:00",
    "wednesday": "08:00-17:00",
    "thursday": "08:00-17:00",
    "friday": "08:00-17:00",
    "saturday": "09:00-13:00"
  }
}
```

## 🔐 Authentication & Authorization

### JWT Token Format
```json
{
  "userId": "user-uuid",
  "email": "user@example.com",
  "role": "doctor"
}
```

### Role-Based Access Control

- **Admin**: Full access to all endpoints
- **Doctor**: Access to patient data, appointments, medical records
- **Patient**: Access to own data only

### Protected Routes
All routes except authentication endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## 🗄️ Database Schema

### Core Tables

#### Users
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `firstName` (String)
- `lastName` (String)
- `role` (Enum: patient, doctor, admin)
- `phone` (String)
- `dateOfBirth` (Date)
- `gender` (Enum: male, female, other)
- `isActive` (Boolean)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

#### Patients
- `id` (UUID, Primary Key)
- `firstName` (String)
- `lastName` (String)
- `dateOfBirth` (Date)
- `gender` (Enum: male, female, other)
- `phone` (String)
- `email` (String)
- `address` (String)
- `emergencyContact` (JSON)
- `medicalHistory` (JSON)
- `allergies` (JSON)
- `bloodType` (Enum)
- `isActive` (Boolean)
- `createdBy` (UUID, Foreign Key)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

#### Appointments
- `id` (UUID, Primary Key)
- `patientId` (UUID, Foreign Key)
- `doctorId` (UUID, Foreign Key)
- `clinicId` (UUID, Foreign Key)
- `appointmentDate` (Date)
- `appointmentTime` (Time)
- `duration` (Integer)
- `type` (Enum)
- `status` (Enum)
- `reason` (String)
- `notes` (String)
- `createdBy` (UUID, Foreign Key)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

#### Medical Records
- `id` (UUID, Primary Key)
- `patientId` (UUID, Foreign Key)
- `doctorId` (UUID, Foreign Key)
- `visitDate` (Date)
- `chiefComplaint` (String)
- `diagnosis` (String)
- `treatment` (String)
- `prescriptions` (JSON)
- `vitalSigns` (JSON)
- `notes` (String)
- `followUpDate` (Date)
- `createdBy` (UUID, Foreign Key)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

## 🔒 Security Features

- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for protection
- **Input Validation**: Comprehensive request validation
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Granular permission control
- **Error Handling**: Secure error responses

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "auth"
```

## 📊 Monitoring & Logging

The application includes comprehensive logging:

- **Request Logging**: HTTP request/response logging with Morgan
- **Error Logging**: Detailed error logging with stack traces
- **Performance Monitoring**: Response time tracking
- **Health Checks**: `/health` endpoint for monitoring

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- Authentication and authorization
- Patient management
- Appointment scheduling
- Medical records
- Doctor and clinic management

---

**Built with ❤️ for the Uganda Gynecology Platform**
