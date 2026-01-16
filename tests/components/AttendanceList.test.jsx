import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AttendanceList from '../../src/components/AttendanceList';

// Mock students data
const mockStudents = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
];

// Mock redux store
const createMockStore = () => {
  return configureStore({
    reducer: {
      attendance: (state = { records: {} }, action) => {
        if (action.type === 'SET_ATTENDANCE') {
          return { ...state, records: { ...state.records, ...action.payload } };
        }
        return state;
      },
    },
  });
};

describe('AttendanceList', () => {
  it('renders the attendance list with correct date', () => {
    const mockDate = '2023-09-15';
    
    render(
      <Provider store={createMockStore()}>
        <AttendanceList
          students={mockStudents}
          classId="class123"
          date={mockDate}
        />
      </Provider>
    );
    
    expect(screen.getByText(`Attendance for ${mockDate}`)).toBeInTheDocument();
    expect(screen.getByText('Present: 0')).toBeInTheDocument();
    expect(screen.getByText('Absent: 0')).toBeInTheDocument();
    expect(screen.getByText('Late: 0')).toBeInTheDocument();
    expect(screen.getByText('Unmarked: 2')).toBeInTheDocument();
  });

  it('renders student cards for each student', () => {
    render(
      <Provider store={createMockStore()}>
        <AttendanceList
          students={mockStudents}
          classId="class123"
          date="2023-09-15"
        />
      </Provider>
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('updates attendance stats when marking attendance', async () => {
    render(
      <Provider store={createMockStore()}>
        <AttendanceList
          students={mockStudents}
          classId="class123"
          date="2023-09-15"
        />
      </Provider>
    );
    
    // Initially all should be unmarked
    expect(screen.getByText('Unmarked: 2')).toBeInTheDocument();
    
    // Find and click the Present button for the first student
    const presentButtons = screen.getAllByText('Present');
    fireEvent.click(presentButtons[0]);
    
    // Find and click the Absent button for the second student
    const absentButtons = screen.getAllByText('Absent');
    fireEvent.click(absentButtons[1]);
    
    // Check that stats are updated
    expect(screen.getByText('Present: 1')).toBeInTheDocument();
    expect(screen.getByText('Absent: 1')).toBeInTheDocument();
    expect(screen.queryByText('Unmarked: 2')).not.toBeInTheDocument();
  });

  it('dispatches SET_ATTENDANCE action when saving', async () => {
    const store = createMockStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    
    render(
      <Provider store={store}>
        <AttendanceList
          students={mockStudents}
          classId="class123"
          date="2023-09-15"
        />
      </Provider>
    );
    
    // Mark students as present and absent
    const presentButtons = screen.getAllByText('Present');
    fireEvent.click(presentButtons[0]);
    
    const absentButtons = screen.getAllByText('Absent');
    fireEvent.click(absentButtons[1]);
    
    // Save attendance
    const saveButton = screen.getByText('Save Attendance');
    fireEvent.click(saveButton);
    
    // Wait for the dispatch to be called
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith({
        type: 'SET_ATTENDANCE',
        payload: {
          'class123-2023-09-15': {
            '1': 'present',
            '2': 'absent'
          }
        }
      });
    });
    
    // Success message should appear
    expect(await screen.findByText('Attendance saved successfully!')).toBeInTheDocument();
  });
});