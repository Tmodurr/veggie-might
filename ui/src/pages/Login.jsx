// src/pages/Login.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleLogin from '../components/GoogleLogin';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  const handleLoginSuccess = (data) => {
    login(data);
    navigate('/dashboard');
  };
  
  return (
    <div className="login-page">
      <h1>Welcome to the App</h1>
      <p>Please sign in to continue:</p>
      <GoogleLogin onSuccess={handleLoginSuccess} />
    </div>
  );
}