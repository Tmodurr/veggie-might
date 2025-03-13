// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/users`,
          { withCredentials: true }
        );
        setData(response.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="dashboard">
      <div className="user-info">
        <h2>Welcome, {user?.name || 'User'}</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
      
      <div className="data-section">
        <h3>User Data</h3>
        {loading ? (
          <p>Loading data...</p>
        ) : (
          <ul>
            {data.map(item => (
              <li key={item.id}>{item.name} - {item.email}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}