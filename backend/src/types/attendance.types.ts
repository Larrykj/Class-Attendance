import { VerificationMethod } from '../db/models/attendance.model';

export interface AttendanceDto {
  id: number;
  classId: number;
  studentId: number;
  date: string | Date;
  status: string;
  verificationMethod: VerificationMethod;
  verifiedBy?: number;
  notes?: string;
  createdAt: string | Date;
}

export interface AttendanceCreationDto {
  classId: number;
  studentId: number;
  date: string | Date;
  status: string;
  verificationMethod: VerificationMethod;
  verifiedBy?: number;
  notes?: string;
}

export interface AttendanceUpdateDto {
  status?: string;
  notes?: string;
}

export interface QRAttendanceDto {
  qrCodeData: string;
  studentId?: number;
}

export interface FaceAttendanceDto {
  classId: number;
  imageData: string;
}