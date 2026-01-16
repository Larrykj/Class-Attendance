import React from 'react';
import { Link } from 'react-router-dom';

function ClassCard({ classInfo }) {
  const { id, name, subject, studentCount, time, room } = classInfo;
  
  return (
    <div className="card hover:shadow-lg transition-shadow" data-testid="class-card">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold">{name}</h3>
        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          {subject}
        </span>
      </div>
      
      <div className="text-gray-600 mb-4">
        <p><span className="font-medium">Time:</span> {time}</p>
        <p><span className="font-medium">Room:</span> {room}</p>
        <p><span className="font-medium">Students:</span> {studentCount}</p>
      </div>
      
      <div className="flex justify-between items-center mt-3">
        <Link 
          to={`/attendance/${id}`} 
          className="btn btn-primary"
          data-testid="take-attendance-button"
        >
          Take Attendance
        </Link>
        
        <Link 
          to={`/classes/${id}`}
          className="text-primary hover:text-primary-dark"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default ClassCard;