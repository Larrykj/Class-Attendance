import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import AttendanceList from '../components/AttendanceList';
import { logger } from '../utils/logger';

function AttendancePage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const classes = useSelector((state) => state.classes.list);
  
  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        logger.info('Loading attendance data', { classId, date });
        
        // Find the class info
        const foundClass = classes.find(c => c.id === classId);
        if (!foundClass) {
          throw new Error('Class not found');
        }
        
        setClassData(foundClass);
        
        // In a real app, you'd fetch from an API
        // Mock data fetch
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockStudents = [
          {
            id: 's1',
            name: 'Alice Johnson',
            email: 'alice.j@example.com',
            profileImage: null
          },
          {
            id: 's2',
            name: 'Bob Smith',
            email: 'bob.smith@example.com',
            profileImage: null
          },
          {
            id: 's3',
            name: 'Carol White',
            email: 'carol.w@example.com',
            profileImage: null
          },
          {
            id: 's4',
            name: 'David Brown',
            email: 'david.b@example.com',
            profileImage: null
          },
          {
            id: 's5',
            name: 'Eva Green',
            email: 'eva.g@example.com',
            profileImage: null
          }
        ];
        
        setStudents(mockStudents);
        logger.info('Attendance data loaded successfully', { studentCount: mockStudents.length });
      } catch (err) {
        logger.error('Error loading attendance data', { error: err });
        setError(err.message || 'Failed to load attendance data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAttendanceData();
  }, [classId, classes, date]);
  
  const handleDateChange = (e) => {
    setDate(e.target.value);
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading attendance data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-6">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
        <button 
          onClick={handleGoBack}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <button 
            onClick={handleGoBack}
            className="text-primary hover:text-primary-dark mb-2"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold">{classData?.name}</h1>
          <p className="text-gray-600">
            {classData?.subject} • Room {classData?.room} • {classData?.time}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <label htmlFor="date" className="block text-gray-700 mb-1">Attendance Date</label>
          <input
            id="date"
            type="date"
            className="input"
            value={date}
            onChange={handleDateChange}
          />
        </div>
      </div>
      
      <AttendanceList
        students={students}
        classId={classId}
        date={date}
      />
    </div>
  );
}

export default AttendancePage;