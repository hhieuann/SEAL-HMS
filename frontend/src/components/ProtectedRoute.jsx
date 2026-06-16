import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';

const ProtectedRoute = ({ allowedTypes, children }) => {
  const location = useLocation();
  const userStr = localStorage.getItem('currentUser');
  let userType = null;
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userType = user.type;
    } catch (e) {}
  }

  if (!userStr) {
    // Not logged in, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedTypes && !allowedTypes.includes(userType)) {
    // Logged in but role not allowed -> 403 Forbidden
    return <Navigate to="/403" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
