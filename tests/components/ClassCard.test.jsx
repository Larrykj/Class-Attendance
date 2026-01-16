import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClassCard from '../../src/components/ClassCard';

describe('ClassCard', () => {
  const mockClassInfo = {
    id: '1',
    name: 'Test Class',
    subject: 'Science',
    studentCount: 25,
    time: 'Mon, Wed 10:00 AM',
    room: '301'
  };

  it('renders class information correctly', () => {
    render(
      <MemoryRouter>
        <ClassCard classInfo={mockClassInfo} />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Test Class')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText(/Mon, Wed 10:00 AM/)).toBeInTheDocument();
    expect(screen.getByText(/Room: 301/)).toBeInTheDocument();
    expect(screen.getByText(/Students: 25/)).toBeInTheDocument();
  });

  it('renders take attendance button with correct link', () => {
    render(
      <MemoryRouter>
        <ClassCard classInfo={mockClassInfo} />
      </MemoryRouter>
    );
    
    const attendanceButton = screen.getByTestId('take-attendance-button');
    expect(attendanceButton).toBeInTheDocument();
    expect(attendanceButton.getAttribute('href')).toBe('/attendance/1');
  });

  it('renders view details link with correct link', () => {
    render(
      <MemoryRouter>
        <ClassCard classInfo={mockClassInfo} />
      </MemoryRouter>
    );
    
    const detailsLink = screen.getByText('View Details');
    expect(detailsLink).toBeInTheDocument();
    expect(detailsLink.getAttribute('href')).toBe('/classes/1');
  });
});