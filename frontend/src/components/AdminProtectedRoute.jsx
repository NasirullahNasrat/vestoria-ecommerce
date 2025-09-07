// src/components/AdminProtectedRoute.js
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../utils/adminAuth';

const AdminProtectedRoute = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default AdminProtectedRoute;