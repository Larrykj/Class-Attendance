import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import './index.css';

// Simple initial reducer (will be expanded later)
const rootReducer = {
  auth: (state = { user: null, isAuthenticated: false }, action) => {
    switch (action.type) {
      case 'LOGIN':
        return { ...state, user: action.payload, isAuthenticated: true };
      case 'LOGOUT':
        return { ...state, user: null, isAuthenticated: false };
      default:
        return state;
    }
  },
  classes: (state = { list: [] }, action) => {
    switch (action.type) {
      case 'SET_CLASSES':
        return { ...state, list: action.payload };
      default:
        return state;
    }
  },
  attendance: (state = { records: {} }, action) => {
    switch (action.type) {
      case 'SET_ATTENDANCE':
        return { ...state, records: { ...state.records, ...action.payload } };
      default:
        return state;
    }
  },
};

const store = configureStore({
  reducer: rootReducer,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);