import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

/**
 * Protects routes that require admin role.
 * Renders ProtectedRoute first; if authenticated, redirects non-admin to /dashboard.
 */
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  return (
    <ProtectedRoute>
      {!loading && user && user.role !== "admin" ? (
        <Navigate to="/dashboard" replace />
      ) : (
        children
      )}
    </ProtectedRoute>
  );
};

export default AdminRoute;
