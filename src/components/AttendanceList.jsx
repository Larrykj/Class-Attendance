import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import StudentCard from './StudentCard';
import { logger } from '../utils/logger';

function AttendanceList({ students, classId, date }) {
  const dispatch = useDispatch();
  const [attendance, setAttendance] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  
  const handleMarkAttendance = (studentId, status) => {
    logger.info('Marking attendance', { studentId, status, classId });
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };
  
  const getAttendanceStats = () => {
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      unmarked: 0
    };
    
    students.forEach(student => {
      const status = attendance[student.id];
      if (status) {
        stats[status]++;
      } else {
        stats.unmarked++;
      }
    });
    
    return stats;
  };
  
  const handleSaveAttendance = async () => {
    try {
      setIsSaving(true);
      setSaveStatus(null);
      
      // In a real app, you'd call an API to save the attendance
      logger.info('Saving attendance data', { classId, date, records: attendance });
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update Redux store
      dispatch({
        type: 'SET_ATTENDANCE',
        payload: {
          [`${classId}-${date}`]: attendance
        }
      });
      
      setSaveStatus('success');
      logger.info('Attendance saved successfully');
    } catch (error) {
      setSaveStatus('error');
      logger.error('Error saving attendance', { error });
    } finally {
      setIsSaving(false);
    }
  };
  
  const stats = getAttendanceStats();
  
  return (
    <div className="space-y-6" data-testid="attendance-list">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 md:mb-0">Attendance for {date}</h2>
        
        <div className="flex space-x-4">
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
            Present: {stats.present}
          </div>
          <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
            Absent: {stats.absent}
          </div>
          <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            Late: {stats.late}
          </div>
          {stats.unmarked > 0 && (
            <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
              Unmarked: {stats.unmarked}
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {students.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            onMarkAttendance={handleMarkAttendance}
            attendanceStatus={attendance[student.id]}
          />
        ))}
      </div>
      
      {saveStatus === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Attendance saved successfully!
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error saving attendance. Please try again.
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleSaveAttendance}
          className={`btn btn-primary ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </div>
  );
}

export default AttendanceList;