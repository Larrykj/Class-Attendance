import { Attendance, Class, User } from '../db/models';
import { UserRole } from '../db/models/user.model';
import logger from '../config/logger';
import { Op } from 'sequelize';
import { Request } from 'express';

/**
 * Generate attendance report for a class
 */
export const generateReport = async (
  classId: number,
  startDate?: string,
  endDate?: string,
  user?: Express.Request['user']
): Promise<any> => {
  try {
    // Check if class exists
    const classData = await Class.findByPk(classId);
    if (!classData) {
      throw new Error('Class not found');
    }
    
    // Authorization check for teachers
    if (user?.role === UserRole.TEACHER && classData.teacherId !== user.id) {
      throw new Error('Access denied. You can only generate reports for your own classes.');
    }
    
    // Build date range filter
    const dateFilter: any = {};
    
    if (startDate && endDate) {
      dateFilter[Op.between] = [startDate, endDate];
    } else if (startDate) {
      dateFilter[Op.gte] = startDate;
    } else if (endDate) {
      dateFilter[Op.lte] = endDate;
    }
    
    // Get all students enrolled in the class
    const students = await (classData as any).getStudents({
      attributes: ['id', 'firstName', 'lastName', 'email']
    });
    
    if (students.length === 0) {
      return {
        classInfo: {
          id: classData.id,
          name: classData.name,
          code: classData.code
        },
        dateRange: {
          startDate: startDate || 'all',
          endDate: endDate || 'all'
        },
        students: [],
        summary: {
          totalStudents: 0,
          attendanceRate: 0
        }
      };
    }
    
    // Get all attendance records for the class in the date range
    const attendanceRecords = await Attendance.findAll({
      where: {
        classId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
      },
      order: [['date', 'ASC']]
    });
    
    // Get all unique dates for which attendance was taken
    const attendanceDates = [...new Set(attendanceRecords.map(record => record.date.toISOString().split('T')[0]))];
    
    // Build student attendance reports
    const studentReports = students.map((student: any) => {
      // Get all attendance records for this student
      const studentAttendance = attendanceRecords.filter(
        record => record.studentId === student.id
      );
      
      // Calculate attendance statistics
      const totalClasses = attendanceDates.length;
      const attendedClasses = studentAttendance.filter(record => record.status === 'present').length;
      const lateClasses = studentAttendance.filter(record => record.status === 'late').length;
      const absentClasses = studentAttendance.filter(record => record.status === 'absent').length;
      const excusedClasses = studentAttendance.filter(record => record.status === 'excused').length;
      
      // Calculate attendance rate
      const attendanceRate = totalClasses > 0
        ? ((attendedClasses + lateClasses) / totalClasses) * 100
        : 0;
      
      return {
        studentId: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        attendance: {
          total: totalClasses,
          present: attendedClasses,
          late: lateClasses,
          absent: absentClasses,
          excused: excusedClasses,
          attendanceRate: Math.round(attendanceRate * 10) / 10 // Round to 1 decimal place
        },
        records: studentAttendance.map(record => ({
          date: record.date,
          status: record.status,
          method: record.verificationMethod
        }))
      };
    });
    
    // Calculate overall class statistics
    const totalStudents = students.length;
    const totalClasses = attendanceDates.length;
    let overallAttendanceRate = 0;
    
    if (totalStudents > 0 && totalClasses > 0) {
      const totalPossibleAttendances = totalStudents * totalClasses;
      const totalActualAttendances = attendanceRecords.filter(
        record => record.status === 'present' || record.status === 'late'
      ).length;
      
      overallAttendanceRate = (totalActualAttendances / totalPossibleAttendances) * 100;
    }
    
    return {
      classInfo: {
        id: classData.id,
        name: classData.name,
        code: classData.code,
        schedule: classData.schedule
      },
      dateRange: {
        startDate: startDate || 'all',
        endDate: endDate || 'all',
        attendanceDates
      },
      students: studentReports,
      summary: {
        totalStudents,
        totalDates: attendanceDates.length,
        attendanceRate: Math.round(overallAttendanceRate * 10) / 10 // Round to 1 decimal place
      }
    };
  } catch (error) {
    logger.error('Error generating attendance report:', error);
    throw error;
  }
};

export default {
  generateReport,
};