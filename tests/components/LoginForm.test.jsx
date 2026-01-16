import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from '../../src/components/LoginForm';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock redux store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false }, action) => {
        switch (action.type) {
          case 'LOGIN':
            return { ...state, user: action.payload, isAuthenticated: true };
          default:
            return state;
        }
      },
    },
  });
};

describe('LoginForm', () => {
  it('renders login form correctly', () => {
    render(
      <Provider store={createMockStore()}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </Provider>
    );
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('shows validation error when submitting empty form', async () => {
    render(
      <Provider store={createMockStore()}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </Provider>
    );
    
    fireEvent.click(screen.getByTestId('login-button'));
    
    expect(await screen.findByText(/email and password are required/i)).toBeInTheDocument();
  });

  it('shows error message for invalid credentials', async () => {
    render(
      <Provider store={createMockStore()}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </Provider>
    );
    
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'wrong@example.com' },
    });
    
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'wrongpassword' },
    });
    
    fireEvent.click(screen.getByTestId('login-button'));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('dispatches LOGIN action with correct credentials', async () => {
    const store = createMockStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    
    render(
      <Provider store={store}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </Provider>
    );
    
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'teacher@example.com' },
    });
    
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password' },
    });
    
    fireEvent.click(screen.getByTestId('login-button'));
    
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith({
        type: 'LOGIN',
        payload: expect.objectContaining({
          email: 'teacher@example.com',
          role: 'teacher'
        })
      });
    });
  });
});