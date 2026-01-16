import axios from 'axios';
import { logger } from './logger';

// Base API configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  response => response,
  error => {
    logger.error('API Error', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email, password) => {
    logger.info('API: Login request', { email });
    return api.post('/auth/login', { email, password });
  },

  logout: () => {
    logger.info('API: Logout request');
    return api.post('/auth/logout');
  },

  getProfile: () => {
    logger.info('API: Get profile request');
    return api.get('/auth/profile');
  },
};

export const classesAPI = {
  getClasses: () => {
    logger.info('API: Fetching classes');
    return api.get('/classes');
  },

  getClassDetails: (classId) => {
    logger.info('API: Fetching class details', { classId });
    return api.get(`/classes/${classId}`);
  },

  createClass: (classData) => {
    logger.info('API: Creating class');
    return api.post('/classes', classData);
  },

  updateClass: (classId, classData) => {
    logger.info('API: Updating class', { classId });
    return api.put(`/classes/${classId}`, classData);
  },

  deleteClass: (classId) => {
    logger.info('API: Deleting class', { classId });
    return api.delete(`/classes/${classId}`);
  },
};

export const attendanceAPI = {
  getStudents: (classId) => {
    logger.info('API: Fetching students for class', { classId });
    return api.get(`/classes/${classId}/students`);
  },

  getAttendance: (classId, date) => {
    logger.info('API: Fetching attendance', { classId, date });
    return api.get(`/attendance/${classId}`, { params: { date } });
  },

  saveAttendance: (classId, date, records) => {
    logger.info('API: Saving attendance', { classId, date });
    return api.post(`/attendance/${classId}`, { date, records });
  },

  getAttendanceReport: (classId, startDate, endDate) => {
    logger.info('API: Fetching attendance report', { classId, startDate, endDate });
    return api.get(`/attendance/${classId}/report`, {
      params: { startDate, endDate }
    });
  },
};

export default api;