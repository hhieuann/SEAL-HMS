import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    // Not logged in, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Logged in but role not allowed -> 403 Forbidden
    return <Navigate to="/403" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
