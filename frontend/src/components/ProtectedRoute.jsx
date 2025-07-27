import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles, redirectPath = '/login' }) => {
  const { token, user } = useSelector(state => state.auth);
  
  if (!token) {
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles) {
    const hasRole = allowedRoles.some(role => 
      (role === 'customer' && user?.is_customer) || 
      (role === 'vendor' && user?.is_vendor)
    );
    
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;