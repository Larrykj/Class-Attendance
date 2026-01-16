# Class Attendance Backend

A backend application for a Class Attendance system built with Node.js and TypeScript. This system provides APIs for QR code recognition, face detection, and attendance management with real-time updates.

## Features

- RESTful APIs for attendance management
- QR code generation and recognition
- Face detection for attendance verification
- Real-time updates using WebSockets
- Role-based access control (admin, teacher, student)
- JWT-based authentication
- PostgreSQL database integration with Sequelize ORM
- Comprehensive error handling and logging

## Project Structure

- **src/**: Source code directory
  - **config/**: Configuration files
  - **controllers/**: API controllers for handling requests
  - **db/**: Database configuration and models
  - **middlewares/**: Express middlewares
  - **routes/**: API routes
  - **services/**: Business logic
  - **types/**: TypeScript type definitions
  - **utils/**: Utility functions
- **tests/**: Test files
- **.env**: Environment variables (not committed to repository)
- **.env.example**: Example environment variables
- **nodemon.json**: Nodemon configuration for development
- **tsconfig.json**: TypeScript configuration
- **jest.config.js**: Jest testing configuration

## API Endpoints

- **Auth**
  - POST /api/auth/login - User login
  - POST /api/auth/register - User registration
  
- **Users**
  - GET /api/users - Get all users
  - GET /api/users/:id - Get user by ID
  - PUT /api/users/:id - Update user
  - DELETE /api/users/:id - Delete user

- **Classes**
  - GET /api/classes - Get all classes
  - GET /api/classes/:id - Get class by ID
  - POST /api/classes - Create a new class
  - PUT /api/classes/:id - Update class
  - DELETE /api/classes/:id - Delete class

- **Attendance**
  - GET /api/attendance - Get all attendance records
  - GET /api/attendance/class/:classId - Get attendance records by class
  - POST /api/attendance/qr - Mark attendance using QR code
  - POST /api/attendance/face - Mark attendance using face recognition

- **QR Code**
  - GET /api/qrcode/generate/:classId - Generate QR code for a class

- **Face Detection**
  - POST /api/face-detection/verify - Verify face for attendance