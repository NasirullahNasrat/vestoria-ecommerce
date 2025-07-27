import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/reducer/authSlice';
import axios from 'axios';

const AuthPersist = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const user = JSON.parse(localStorage.getItem("user") || "null");
      
      if (token && user) {
        try {
          // Verify token is still valid
          await axios.post("http://localhost:8000/api/token/verify/", { token });
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