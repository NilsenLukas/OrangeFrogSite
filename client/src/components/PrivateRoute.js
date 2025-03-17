import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { auth } = useContext(AuthContext);
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (auth.resetRequired) {
    return <Navigate to="/reset-password" replace />;
  }

  if (auth.completeProfile) {
    return <Navigate to="/complete-profile" replace />;
  }

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isUserRoute = location.pathname.startsWith('/user');

  if (isAdminRoute && auth.role !== 'admin') {
    return <Navigate to="/user-dashboard" replace />;
  }

  if (isUserRoute && auth.role !== 'user') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Redirect invalid admin pages to /admin/dashboard
  if (isAdminRoute && !['/admin/dashboard', '/admin/settings', '/admin/users'].includes(location.pathname)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to={auth.role === 'admin' ? '/admin' : '/user-dashboard'} replace />;
  }

  return children;
};

export default PrivateRoute;
