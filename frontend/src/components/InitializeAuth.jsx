import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadUser, logout } from '../redux/reducer/authSlice';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getApiUrl } from '../config/env'; // Import the environment utility

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
        // Option 1: Verify token explicitly using environment configuration
        const verifyUrl = getApiUrl('/api/token/verify/');
        await axios.post(verifyUrl, { token });
        
        // Token is valid, load user data using environment configuration
        const profileUrl = getApiUrl('/api/user/profile/');
        const response = await axios.get(profileUrl, {
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
            const refreshUrl = getApiUrl('/api/token/refresh/');
            const refreshResponse = await axios.post(refreshUrl, {
              refresh: refreshToken
            });
            
            const newToken = refreshResponse.data.access;
            localStorage.setItem('accessToken', newToken);
            
            // Retry with new token using environment configuration
            const profileUrl = getApiUrl('/api/user/profile/');
            const userResponse = await axios.get(profileUrl, {
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