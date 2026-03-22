import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import OfficerPendingGate from "./OfficerPendingGate.jsx";

/**
 * Protects routes that require officer (personnel) role.
 * Redirects admin to /dashboard.
 */
const OfficerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  return (
    <ProtectedRoute>
      {!loading && user && user.role !== "officer" ? (
        <Navigate to="/dashboard" replace />
      ) : (
        <OfficerPendingGate>
          {children}
        </OfficerPendingGate>
      )}
    </ProtectedRoute>
  );
};

export default OfficerRoute;
