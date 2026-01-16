import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import ClassCard from '../components/ClassCard';
import { logger } from '../utils/logger';

function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const classes = useSelector((state) => state.classes.list);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        logger.info('Loading dashboard data');
        setError(null);
        
        // In a real app, you'd fetch from an API
        // Mock data fetch
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockClasses = [
          {
            id: '1',
            name: 'Mathematics 101',
            subject: 'Math',
            studentCount: 30,
            time: 'Mon, Wed, Fri 9:00 AM',
            room: 'Room 201'
          },
          {
            id: '2',
            name: 'Introduction to Physics',
            subject: 'Science',
            studentCount: 25,
            time: 'Tue, Thu 10:30 AM',
            room: 'Room 305'
          },
          {
            id: '3',
            name: 'English Literature',
            subject: 'English',
            studentCount: 22,
            time: 'Mon, Wed 1:00 PM',
            room: 'Room 104'
          }
        ];
        
        dispatch({ type: 'SET_CLASSES', payload: mockClasses });
        logger.info('Dashboard data loaded successfully');
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
        logger.error('Error loading dashboard data', { error: err });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [dispatch]);
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-6">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.name || 'Teacher'}</h1>
        <Link to="/classes" className="btn btn-primary">
          Manage Classes
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-3">Today's Classes</h2>
        <p className="text-gray-600">You have {classes.length} classes scheduled for today.</p>
      </div>
      
      <h2 className="text-xl font-bold mb-4">Your Classes</h2>
      
      {classes.length === 0 ? (
        <p className="text-gray-600">No classes available. Add some classes to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(classInfo => (
            <ClassCard key={classInfo.id} classInfo={classInfo} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;