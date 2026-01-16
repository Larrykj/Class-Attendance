// import { Collection } from 'mongodb';
// import { getMongoDb } from '../db/mongo';
import logger from '../config/logger';

export type AttendanceMethodUsed = 'face' | 'qr' | 'manual';

export interface AttendanceLog {
  studentId: number;
  classId: number;
  attendanceId?: number;
  timestamp: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  methodUsed: AttendanceMethodUsed;
  latitude?: number | null;
  longitude?: number | null;
  deviceId?: string | null;
  source: 'online' | 'offline';
  syncStatus: 'pending' | 'synced' | 'failed';
  metadata?: Record<string, unknown>;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

const COLLECTION_NAME = 'attendance_logs';

// const getCollection = async (): Promise<Collection<AttendanceLog>> => {
//   const db = await getMongoDb();
//   return db.collection<AttendanceLog>(COLLECTION_NAME);
// };

export interface LogAttendancePayload {
  studentId: number;
  classId: number;
  attendanceId?: number;
  timestamp?: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  methodUsed: AttendanceMethodUsed;
  latitude?: number | null;
  longitude?: number | null;
  deviceId?: string | null;
  source?: 'online' | 'offline';
  syncStatus?: 'pending' | 'synced' | 'failed';
  metadata?: Record<string, unknown>;
}

export const logAttendance = async (payload: LogAttendancePayload): Promise<void> => {
  try {
    // MongoDB logging is disabled - collection not available
    logger.info('Attendance logging skipped (MongoDB not available)', payload);
  } catch (error) {
    logger.error('Error logging attendance:', error);
  }
};
