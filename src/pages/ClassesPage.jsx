import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ClassCard from '../components/ClassCard';

function ClassesPage() {
  const classes = useSelector((state) => state.classes.list);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  const filteredClasses = classes.filter(classItem => {
    // Apply search filter
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply category filter
    if (filter === 'all') return matchesSearch;
    return matchesSearch && classItem.subject.toLowerCase() === filter.toLowerCase();
  });
  
  const subjects = [...new Set(classes.map(c => c.subject.toLowerCase()))];
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Classes</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="mb-4 md:mb-0 flex-grow">
            <label htmlFor="search" className="block text-gray-700 mb-1">Search Classes</label>
            <input
              id="search"
              type="text"
              className="input"
              placeholder="Search by class name or subject"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="w-full md:w-1/3">
            <label htmlFor="filter" className="block text-gray-700 mb-1">Filter by Subject</label>
            <select
              id="filter"
              className="input"
              value={filter}
              onChange={handleFilterChange}
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option 
                  key={subject} 
                  value={subject}
                >
                  {subject.charAt(0).toUpperCase() + subject.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Classes ({filteredClasses.length})</h2>
        <button className="btn btn-primary">
          + Add Class
        </button>
      </div>
      
      {filteredClasses.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">No classes found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map(classInfo => (
            <ClassCard key={classInfo.id} classInfo={classInfo} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ClassesPage;