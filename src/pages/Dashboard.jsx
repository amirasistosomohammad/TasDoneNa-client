import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { api } from "../services/api.js";
import AccountStatusPanelReveal from "../components/AccountStatusPanelReveal.jsx";
import {
  FaTachometerAlt,
  FaTasks,
  FaCalendarAlt,
  FaBell,
  FaUserCheck,
  FaClipboardList,
  FaSyncAlt,
  FaPlus,
  FaFileAlt,
  FaUpload,
} from "react-icons/fa";

const getMonthName = (month) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPending = user?.status === "pending";
  const isAdmin = user?.role === "admin";

  const [pendingCount, setPendingCount] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const fetchPendingCount = async () => {
    if (!isAdmin) return;
    try {
      const data = await api.get("/admin/pending-users");
      setPendingCount((data.users || []).length);
    } catch {
      setPendingCount(0);
    }
  };

  const fetchStatistics = async () => {
    if (isPending) return;
    setStatsLoading(true);
    try {
      const endpoint = isAdmin ? "/admin/tasks/statistics" : "/tasks/statistics";
      const data = await api.get(endpoint);
      setStats(data);
    } catch (err) {
      console.error("Failed to load statistics:", err);
      setStats({
        total_tasks: 0,
        pending: 0,
        completed: 0,
        due_this_week: 0,
        overdue: 0,
        completed_this_month: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    if (isPending) return;
    setRecentLoading(true);
    try {
      if (isAdmin) {
        // Admin: Get recent reports
        const reportsData = await api.get("/admin/accomplishment-reports");
        const reports = (reportsData.reports || []).slice(0, 5);
        setRecentReports(reports);
        setRecentTasks([]);
      } else {
        // Personnel: Get recent tasks and reports
        const [tasksData, reportsData] = await Promise.all([
          api.get("/tasks").catch(() => ({ tasks: [] })),
          api.get("/accomplishment-reports").catch(() => ({ reports: [] })),
        ]);
        const tasks = (tasksData.tasks || []).slice(0, 5);
        const reports = (reportsData.reports || []).slice(0, 3);
        setRecentTasks(tasks);
        setRecentReports(reports);
      }
    } catch (err) {
      console.error("Failed to load recent activity:", err);
      setRecentTasks([]);
      setRecentReports([]);
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchPendingCount();
    fetchStatistics();
    fetchRecentActivity();
    const handler = (e) => {
      if (e.detail?.count !== undefined) setPendingCount(e.detail.count);
    };
    window.addEventListener("account-approvals-updated", handler);
    return () => window.removeEventListener("account-approvals-updated", handler);
  }, [isAdmin, isPending]);

  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([
      isAdmin ? fetchPendingCount() : Promise.resolve(),
      fetchStatistics(),
      fetchRecentActivity(),
    ]).finally(() => setRefreshing(false));
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
        <AccountStatusPanelReveal className="card border-0 shadow-sm account-approvals-card mb-4">
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
        </AccountStatusPanelReveal>
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
              <div className="dashboard-stat-block-value">
                {statsLoading ? "—" : stats?.total_tasks || 0}
              </div>
            </div>
            <div className="dashboard-stat-block">
              <div className="dashboard-stat-block-label">Pending</div>
              <div className="dashboard-stat-block-value">
                {statsLoading ? "—" : stats?.pending || 0}
              </div>
            </div>
            <div className="dashboard-stat-block">
              <div className="dashboard-stat-block-label">Completed</div>
              <div className="dashboard-stat-block-value">
                {statsLoading ? "—" : stats?.completed || 0}
              </div>
            </div>
            <div className="dashboard-stat-block">
              <div className="dashboard-stat-block-label">Due this week</div>
              <div className="dashboard-stat-block-value">
                {statsLoading ? "—" : stats?.due_this_week || 0}
              </div>
            </div>
            <div className="dashboard-stat-block">
              <div className="dashboard-stat-block-label">Overdue tasks</div>
              <div className="dashboard-stat-block-value">
                {statsLoading ? "—" : (stats?.overdue || 0)}
              </div>
            </div>
            {!isAdmin && (
              <div className="dashboard-stat-block">
                <div className="dashboard-stat-block-label">Completed this month</div>
                <div className="dashboard-stat-block-value">
                  {statsLoading ? "—" : stats?.completed_this_month || 0}
                </div>
              </div>
            )}
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
                {!isAdmin && (
                  <>
                    <li className="py-2">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-start text-decoration-none"
                        onClick={() => navigate("/my-tasks/create")}
                        style={{ color: "inherit" }}
                      >
                        <FaPlus className="me-2" />
                        Create a new task
                      </button>
                    </li>
                    <li className="py-2">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-start text-decoration-none"
                        onClick={() => navigate("/accomplishment-reports")}
                        style={{ color: "inherit" }}
                      >
                        <FaFileAlt className="me-2" />
                        Accomplishment report (Excel download)
                      </button>
                    </li>
                    <li className="py-2">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-start text-decoration-none"
                        onClick={() => navigate("/my-tasks")}
                        style={{ color: "inherit" }}
                      >
                        <FaTasks className="me-2" />
                        View my tasks
                      </button>
                    </li>
                  </>
                )}
                {isAdmin && (
                  <>
                    <li className="py-2">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-start text-decoration-none"
                        onClick={() => navigate("/account-approvals")}
                        style={{ color: "inherit" }}
                      >
                        <FaUserCheck className="me-2" />
                        Review pending approvals
                      </button>
                    </li>
                    <li className="py-2">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-start text-decoration-none"
                        onClick={() => navigate("/admin/accomplishment-reports")}
                        style={{ color: "inherit" }}
                      >
                        <FaFileAlt className="me-2" />
                        Review accomplishment reports
                      </button>
                    </li>
                    <li className="py-2">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-start text-decoration-none"
                        onClick={() => navigate("/task-management")}
                        style={{ color: "inherit" }}
                      >
                        <FaTasks className="me-2" />
                        View all tasks
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
        <div className="col-xl-7">
          <div className="card border-0 shadow-sm account-approvals-card h-100">
            <div className="card-header bg-white border-bottom account-approvals-card-header">
              <h6 className="mb-0 fw-semibold account-approvals-card-title">Recent activity</h6>
              <p className="small text-muted mb-0 mt-1">
                Your latest tasks and reports.
              </p>
            </div>
            <div className="card-body">
              {recentLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status" aria-label="Loading" />
                </div>
              ) : recentTasks.length === 0 && recentReports.length === 0 ? (
                <p className="small text-muted mb-0">
                  No recent activity yet. Start by creating a task or downloading your monthly accomplishment report.
                </p>
              ) : (
                <div className="list-group list-group-flush">
                  {!isAdmin && recentTasks.length > 0 && (
                    <>
                      <div className="small fw-semibold text-muted mb-2">Recent Tasks</div>
                      {recentTasks.map((task) => (
                        <div
                          key={task.id}
                          className="list-group-item px-0 py-2 border-0 border-bottom"
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/my-tasks/${task.id}`)}
                          onKeyDown={(e) => e.key === "Enter" && navigate(`/my-tasks/${task.id}`)}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="small fw-semibold">{task.title}</div>
                              <div className="small text-muted">
                                {task.kra || "No KRA"} • {task.status === "completed" ? "Completed" : "Pending"}
                              </div>
                            </div>
                            <span className={`badge ${task.status === "completed" ? "bg-success" : "bg-secondary"}`}>
                              {task.status === "completed" ? "Done" : "Pending"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {recentReports.length > 0 && (
                    <>
                      <div className="small fw-semibold text-muted mb-2 mt-3">
                        {isAdmin ? "Recent Reports" : "Recent Reports"}
                      </div>
                      {recentReports.map((report) => (
                        <div
                          key={report.id}
                          className="list-group-item px-0 py-2 border-0 border-bottom"
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(isAdmin ? `/admin/accomplishment-reports/${report.id}` : `/accomplishment-reports/${report.id}`)}
                          onKeyDown={(e) => e.key === "Enter" && navigate(isAdmin ? `/admin/accomplishment-reports/${report.id}` : `/accomplishment-reports/${report.id}`)}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="small fw-semibold">
                                {isAdmin && report.user ? `${report.user.name} - ` : ""}
                                {getMonthName(report.month)} {report.year}
                              </div>
                              <div className="small text-muted">
                                {report.tasks_summary?.length || 0} KRA(s) • {report.status === "noted" ? "Approved" : report.status === "submitted" ? "Submitted" : "Draft"}
                              </div>
                            </div>
                            <span className={`badge ${report.status === "noted" ? "bg-success" : report.status === "submitted" ? "bg-warning text-dark" : "bg-secondary"}`}>
                              {report.status === "noted" ? "Approved" : report.status === "submitted" ? "Pending" : "Draft"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
