import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadUser, logout } from '../redux/reducer/authSlice';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const InitializeAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token) {
        dispatch(logout());
        return;
      }

      try {
        // Option 1: Verify token explicitly
        await axios.post('http://localhost:8000/api/token/verify/', { token });
        
        // Token is valid, load user data
        const response = await axios.get('http://localhost:8000/api/user/profile/', {
          headers: { Authorization: `Bearer ${token}` }
        });

        dispatch(loadUser({
          user: response.data,
          token,
          refreshToken
        }));
      } catch (error) {
        console.error('Authentication check failed:', error);
        
        // Try to refresh token if we have a refresh token
        if (refreshToken && error.response?.status === 401) {
          try {
            const refreshResponse = await axios.post('http://localhost:8000/api/token/refresh/', {
              refresh: refreshToken
            });
            
            const newToken = refreshResponse.data.access;
            localStorage.setItem('accessToken', newToken);
            
            // Retry with new token
            const userResponse = await axios.get('http://localhost:8000/api/user/profile/', {
              headers: { Authorization: `Bearer ${newToken}` }
            });
            
            dispatch(loadUser({
              user: userResponse.data,
              token: newToken,
              refreshToken
            }));
            return;
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
        }

        // Clear invalid tokens and logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        dispatch(logout());
        toast.error('Session expired. Please login again.');
        navigate('/login');
      }
    };

    initializeAuth();
  }, [dispatch, navigate]);

  return null;
};

export default InitializeAuth;