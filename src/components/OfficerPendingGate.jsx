import React from "react";
import { FaClock } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext.jsx";
import "./OfficerPendingGate.css";

/**
 * Matches the reference repo pattern (PersonnelPendingGate):
 * for officers whose account is still pending approval, show a consistent
 * status header instead of the page content.
 */
export default function OfficerPendingGate({ children }) {
  const { user } = useAuth();
  const isOfficer = user?.role === "officer";
  const isPending = user?.status === "pending";

  if (!isOfficer || !isPending) {
    return children;
  }

  return (
    <div className="officer-pending-gate-page">
      <div className="officer-pending-gate-status-header">
        <div className="officer-pending-gate-status-icon" aria-hidden="true">
          <FaClock />
        </div>
        <div className="officer-pending-gate-status-text">
          <h2 className="officer-pending-gate-status-title">Account status: Pending</h2>
          <p className="officer-pending-gate-status-desc">
            Your account is awaiting approval by an administrator. You will be notified once your account has been reviewed.
          </p>
        </div>
      </div>
    </div>
  );
}

