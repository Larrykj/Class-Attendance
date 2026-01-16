import React from 'react';

function StudentCard({ student, onMarkAttendance, attendanceStatus }) {
  const { id, name, email, profileImage } = student;
  
  const statusColors = {
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    late: 'bg-yellow-100 text-yellow-800',
    undefined: 'bg-gray-100 text-gray-800'
  };
  
  const statusColor = statusColors[attendanceStatus] || statusColors.undefined;
  
  return (
    <div className="card flex items-center space-x-4" data-testid="student-card">
      <div className="flex-shrink-0">
        {profileImage ? (
          <img 
            src={profileImage} 
            alt={name} 
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="flex-grow">
        <h3 className="font-bold">{name}</h3>
        <p className="text-sm text-gray-600">{email}</p>
      </div>
      
      <div className="flex-shrink-0">
        <div className="flex space-x-2">
          <button 
            onClick={() => onMarkAttendance(id, 'present')}
            className={`px-3 py-1 rounded ${attendanceStatus === 'present' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'}`}
          >
            Present
          </button>
          <button 
            onClick={() => onMarkAttendance(id, 'absent')}
            className={`px-3 py-1 rounded ${attendanceStatus === 'absent' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800'}`}
          >
            Absent
          </button>
          <button 
            onClick={() => onMarkAttendance(id, 'late')}
            className={`px-3 py-1 rounded ${attendanceStatus === 'late' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800'}`}
          >
            Late
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentCard;