import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../index';

// Attendance verification methods enum
export enum VerificationMethod {
  QR_CODE = 'qr_code',
  FACE_RECOGNITION = 'face_recognition',
  MANUAL = 'manual',
}

// Attendance attributes interface
export interface AttendanceAttributes {
  id: number;
  classId: number;
  studentId: number;
  date: Date;
  status: string;
  verificationMethod: VerificationMethod;
  verifiedBy?: number | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deviceId?: string | null;
  syncStatus?: 'pending' | 'synced' | 'failed';
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for attendance creation
export interface AttendanceCreationAttributes extends Optional<
  AttendanceAttributes,
  'id' | 'createdAt' | 'updatedAt' | 'verifiedBy' | 'notes' | 'latitude' | 'longitude' | 'deviceId' | 'syncStatus'
> {}

// Attendance model
class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
  public id!: number;
  public classId!: number;
  public studentId!: number;
  public date!: Date;
  public status!: string;
  public verificationMethod!: VerificationMethod;
  public verifiedBy!: number | null;
  public notes!: string | null;
  public latitude!: number | null;
  public longitude!: number | null;
  public deviceId!: string | null;
  public syncStatus!: 'pending' | 'synced' | 'failed';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Attendance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id',
      },
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'present',
      validate: {
        isIn: [['present', 'absent', 'late', 'excused']],
      },
    },
    verificationMethod: {
      type: DataTypes.ENUM(...Object.values(VerificationMethod)),
      allowNull: false,
    },
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    syncStatus: {
      type: DataTypes.ENUM('pending', 'synced', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    tableName: 'attendances',
    timestamps: true,
    indexes: [
      {
        fields: ['classId', 'studentId', 'date'],
        unique: true,
        name: 'attendance_unique_constraint',
      },
    ],
  }
);

export default Attendance;