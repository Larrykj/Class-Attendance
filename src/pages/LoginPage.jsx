import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

function LoginPage() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <div className="min-h-[80vh] flex flex-col justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Class Attendance App</h1>
          <p className="text-gray-600 mt-2">Track student attendance with ease</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}

export default LoginPage;