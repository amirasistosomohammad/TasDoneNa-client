import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { api } from "../services/api.js";
import {
  FaTachometerAlt,
  FaTasks,
  FaCalendarAlt,
  FaBell,
  FaUserCheck,
  FaClipboardList,
  FaSyncAlt,
} from "react-icons/fa";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPending = user?.status === "pending";
  const isAdmin = user?.role === "admin";

  const [pendingCount, setPendingCount] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingCount = async () => {
    if (!isAdmin) return;
    try {
      const data = await api.get("/admin/pending-users");
      setPendingCount((data.users || []).length);
    } catch {
      setPendingCount(0);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchPendingCount();
    const handler = (e) => {
      if (e.detail?.count !== undefined) setPendingCount(e.detail.count);
    };
    window.addEventListener("account-approvals-updated", handler);
    return () => window.removeEventListener("account-approvals-updated", handler);
  }, [isAdmin]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPendingCount().finally(() => setRefreshing(false));
  };

  return (
    <div className="container-fluid px-3 px-md-4">
      {/* Page header */}
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
          <span className="account-approvals-page-icon">
            <FaTachometerAlt aria-hidden />
          </span>
          Dashboard
        </h1>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <span className="spinner-border spinner-border-sm" aria-hidden />
          ) : (
            <FaSyncAlt aria-hidden />
          )}
          <span>Refresh</span>
        </button>
      </div>

      {/* Alert – account pending approval */}
      {isPending && (
        <div className="card border-0 shadow-sm account-approvals-card mb-4">
          <div className="account-approvals-detail-body">
            <div className="d-flex align-items-start gap-2 p-3 rounded" style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
              <FaBell className="text-warning flex-shrink-0 mt-1" aria-hidden />
              <div>
                <span className="fw-semibold d-block">Account pending approval</span>
                <span className="small text-muted">
                  An administrator will review your account. You will be notified once approved.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview – single card, clean stat grid (corporate / government style) */}
      <div className="card border-0 shadow-sm account-approvals-card dashboard-overview-card mb-4">
        <div className="card-header bg-white border-bottom account-approvals-card-header">
          <h6 className="mb-0 fw-semibold account-approvals-card-title">Task overview</h6>
          <p className="small text-muted mb-0 mt-1">
            Key metrics for the current period.
          </p>
        </div>
        <div className="card-body p-0">
          <div className="dashboard-stat-grid">
            {isAdmin && (
              <div
                className="dashboard-stat-block dashboard-stat-block-link"
                role="button"
                tabIndex={0}
                onClick={() => navigate("/account-approvals")}
                onKeyDown={(e) => e.key === "Enter" && navigate("/account-approvals")}
              >
                <div className="dashboard-stat-block-label">Pending approvals</div>
                <div className="dashboard-stat-block-value">{pendingCount === null ? "—" : pendingCount}</div>
              </div>
            )}
            <div className="dashboard-stat-block">
              <div className="dashboard-stat-block-label">Total tasks</div>
              <div className="dashboard-stat-block-value">0</div>
            </div>
            <div className="dashboard-stat-block">
              <div className="dashboard-stat-block-label">Due this week</div>
              <div className="dashboard-stat-block-value">0</div>
            </div>
            <div className="dashboard-stat-block">
              <div className="dashboard-stat-block-label">Overdue tasks</div>
              <div className="dashboard-stat-block-value">0</div>
            </div>
            <div className="dashboard-stat-block">
              <div className="dashboard-stat-block-label">Approved MOVs</div>
              <div className="dashboard-stat-block-value">0</div>
            </div>
            <div className="dashboard-stat-block">
              <div className="dashboard-stat-block-label">Pending reviews</div>
              <div className="dashboard-stat-block-value">0</div>
            </div>
            <div className="dashboard-stat-block">
              <div className="dashboard-stat-block-label">Completed this month</div>
              <div className="dashboard-stat-block-value">0</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions + Recent activity */}
      <div className="row g-3 mb-4">
        <div className="col-xl-5">
          <div className="card border-0 shadow-sm account-approvals-card h-100">
            <div className="card-header bg-white border-bottom account-approvals-card-header">
              <h6 className="mb-0 fw-semibold account-approvals-card-title">Quick actions</h6>
              <p className="small text-muted mb-0 mt-1">
                Shortcut actions you&apos;ll use most often.
              </p>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0 small dashboard-quick-actions-list">
                <li className="py-2">Create a new task (coming soon)</li>
                <li className="py-2">Add monthly accomplishment report (coming soon)</li>
                <li className="py-2">Upload MOV for a task (coming soon)</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="col-xl-7">
          <div className="card border-0 shadow-sm account-approvals-card h-100">
            <div className="card-header bg-white border-bottom account-approvals-card-header">
              <h6 className="mb-0 fw-semibold account-approvals-card-title">Recent activity</h6>
              <p className="small text-muted mb-0 mt-1">
                Once tasks are added, your latest updates will appear here.
              </p>
            </div>
            <div className="card-body">
              <p className="small text-muted mb-0">
                No recent activity yet. Start by creating a task or submitting a monthly report.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
