// src/components/GoogleLogin.jsx
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import axios from 'axios';

export default function GoogleLogin({ onSuccess }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Send token to our API
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/google`,
          { token: tokenResponse.access_token },
          { withCredentials: true }
        );
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Call the success callback
        if (onSuccess) onSuccess(response.data);
      } catch (err) {
        setError('Authentication failed. Please try again.');
        console.error('Login error:', err);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.');
      setLoading(false);
    }
  });

  return (
    <div className="google-login">
      <button 
        onClick={() => login()}
        disabled={loading}
        className="google-btn"
      >
        {loading ? 'Loading...' : 'Sign in with Google'}
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}