import dotenv from 'dotenv';
dotenv.config();

// Database configuration
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'attendance_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// JWT configuration
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_secret_key_here',
  expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as string,
};

// Server configuration
export const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:3000',
};

// Export all configurations
export default {
  db: dbConfig,
  jwt: jwtConfig,
  server: serverConfig,
};