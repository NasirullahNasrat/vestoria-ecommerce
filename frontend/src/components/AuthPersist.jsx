import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/reducer/authSlice';
import axios from 'axios';
import { getApiUrl } from '../config/env'; // Import the environment utility

const AuthPersist = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const user = JSON.parse(localStorage.getItem("user") || "null");
      
      if (token && user) {
        try {
          // Verify token is still valid using environment configuration
          const verifyUrl = getApiUrl('/api/token/verify/');
          await axios.post(verifyUrl, { token });
          dispatch(loginSuccess(user));
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        }
      }
    };

    initializeAuth();
  }, [dispatch]);

  return null;
};

export default AuthPersist;