import React from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  FaTasks,
  FaCalendarAlt,
  FaBell,
  FaUserCheck,
  FaClipboardList,
} from "react-icons/fa";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const isPending = user?.status === "pending";

  return (
    <div className="container-fluid px-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <h1 className="h4 mb-0 fw-bold" style={{ color: "#243047" }}>
          Overview
        </h1>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => logout()}
        >
          Sign out
        </button>
      </div>

      {/* Overview card (structure inspired by CPC dashboard) */}
      <div className="card tas-dashboard-overview mb-4 border-0 shadow-sm">
        <div className="tas-dashboard-header d-flex flex-column flex-md-row align-items-md-center justify-content-between">
          <div>
            <h6 className="mb-1 fw-semibold text-white">Overview</h6>
            <p className="mb-0 small text-white-50">
              Task summary for the selected period.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
            <span className="small text-white-50">Period</span>
            <select
              className="form-select form-select-sm tas-dashboard-period-select"
              defaultValue="current_month"
              disabled
            >
              <option value="current_month">Current month</option>
              <option value="last_month">Last month</option>
              <option value="current_year">Current year</option>
            </select>
          </div>
        </div>
        <div className="tas-dashboard-body">
          {/* Alerts bar */}
          {isPending && (
            <div className="tas-dashboard-alert">
              <FaBell className="me-2" />
              <span className="fw-semibold me-2">Account pending approval</span>
              <span className="small">
                An administrator will review your account. You will be notified
                once your account is approved.
              </span>
            </div>
          )}

          {/* Stat tiles row (placeholder metrics) */}
          <div className="row g-3 px-3 py-3 tas-dashboard-stats-row">
            <div className="col-6 col-lg-4 col-xl-2">
              <div className="tas-stat-card">
                <div className="tas-stat-icon tas-stat-icon-primary">
                  <FaTasks />
                </div>
                <div className="tas-stat-label small text-muted">
                  Total tasks
                </div>
                <div className="tas-stat-value fw-bold">0</div>
              </div>
            </div>
            <div className="col-6 col-lg-4 col-xl-2">
              <div className="tas-stat-card">
                <div className="tas-stat-icon tas-stat-icon-secondary">
                  <FaCalendarAlt />
                </div>
                <div className="tas-stat-label small text-muted">
                  Due this week
                </div>
                <div className="tas-stat-value fw-bold">0</div>
              </div>
            </div>
            <div className="col-6 col-lg-4 col-xl-2">
              <div className="tas-stat-card">
                <div className="tas-stat-icon tas-stat-icon-accent">
                  <FaBell />
                </div>
                <div className="tas-stat-label small text-muted">
                  Overdue tasks
                </div>
                <div className="tas-stat-value fw-bold">0</div>
              </div>
            </div>
            <div className="col-6 col-lg-4 col-xl-2">
              <div className="tas-stat-card">
                <div className="tas-stat-icon tas-stat-icon-muted">
                  <FaUserCheck />
                </div>
                <div className="tas-stat-label small text-muted">
                  Approved MOVs
                </div>
                <div className="tas-stat-value fw-bold">0</div>
              </div>
            </div>
            <div className="col-6 col-lg-4 col-xl-2">
              <div className="tas-stat-card">
                <div className="tas-stat-icon tas-stat-icon-muted">
                  <FaClipboardList />
                </div>
                <div className="tas-stat-label small text-muted">
                  Pending reviews
                </div>
                <div className="tas-stat-value fw-bold">0</div>
              </div>
            </div>
            <div className="col-6 col-lg-4 col-xl-2">
              <div className="tas-stat-card">
                <div className="tas-stat-icon tas-stat-icon-muted">
                  <FaTasks />
                </div>
                <div className="tas-stat-label small text-muted">
                  Completed this month
                </div>
                <div className="tas-stat-value fw-bold">0</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second row: quick actions + recent activity (placeholder) */}
      <div className="row g-3 mb-4">
        <div className="col-xl-5">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="mb-1 fw-semibold" style={{ color: "#243047" }}>
                Quick actions
              </h6>
              <p className="small text-muted mb-0">
                Shortcut actions you&apos;ll use most often.
              </p>
            </div>
            <div className="card-body pt-3">
              <ul className="list-unstyled mb-0 small">
                <li className="mb-2">• Create a new task (coming soon)</li>
                <li className="mb-2">
                  • Add monthly accomplishment report (coming soon)
                </li>
                <li>• Upload MOV for a task (coming soon)</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="col-xl-7">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-white border-0 pb-0">
              <h6 className="mb-1 fw-semibold" style={{ color: "#243047" }}>
                Recent activity
              </h6>
              <p className="small text-muted mb-0">
                Once tasks are added, your latest updates will appear here.
              </p>
            </div>
            <div className="card-body pt-3">
              <p className="small text-muted mb-0">
                No recent activity yet. Start by creating a task or submitting a
                monthly report.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
