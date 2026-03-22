import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { api } from "../../services/api.js";
import { showAlert, showToast } from "../../services/notificationService.js";
import { FaClipboardList, FaPlus, FaSyncAlt, FaList, FaClock, FaCheckCircle } from "react-icons/fa";
import Portal from "../../components/Portal.jsx";
import PersonnelTaskSchedule from "../../components/personnel/PersonnelTaskSchedule.jsx";

const formatStatNumber = (n) => {
  if (n == null || typeof n !== "number" || Number.isNaN(n)) return "—";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return n.toLocaleString();
};

/**
 * Personnel (officer) task list — own tasks only.
 * Fetches from /api/tasks (officer endpoint).
 */
const MyTasksPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullAmountModal, setFullAmountModal] = useState(null);
  const [fullAmountModalClosing, setFullAmountModalClosing] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/tasks");
      setTasks(data.tasks || []);
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to load tasks."
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return { total, pending, completed };
  }, [tasks]);

  const handleEdit = (task) => {
    navigate("/my-tasks/create", { state: { editTask: task } });
  };

  const handleView = (task) => {
    navigate(`/my-tasks/${task.id}`);
  };

  const handleStatusChange = async (task, newStatus) => {
    if (newStatus === "completed") {
      const result = await Swal.fire({
        title: "Mark as Completed?",
        text: `Mark "${task.title}" as completed? This task will be included in your accomplishment reports.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, mark as completed",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#2d5a27",
        cancelButtonColor: "#6c757d",
        background: "#fff",
        color: "#243047",
      });

      if (!result.isConfirmed) return;
    } else if (task.status === "completed" && newStatus === "pending") {
      const result = await Swal.fire({
        title: "Reopen Task?",
        text: `Change "${task.title}" status from completed? This task will no longer appear in accomplishment reports until completed again.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, reopen",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#ffc107",
        cancelButtonColor: "#6c757d",
        background: "#fff",
        color: "#243047",
      });

      if (!result.isConfirmed) return;
    }

    try {
      await api.put(`/tasks/${task.id}`, { status: newStatus });
      const statusLabel = newStatus === "completed" ? "completed" : newStatus === "pending" ? "reopened" : newStatus;
      showToast.success(`Task ${statusLabel} successfully!`);
      fetchTasks();
    } catch (err) {
      showAlert.error("Error", err.data?.message || err.message || "Failed to update task status.");
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4">
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
          <span className="account-approvals-page-icon">
            <FaClipboardList aria-hidden />
          </span>
          Task schedule
        </h1>
        <div className="account-approvals-page-actions d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm task-btn-primary d-inline-flex align-items-center gap-2"
            onClick={() => navigate("/my-tasks/create")}
          >
            <FaPlus aria-hidden />
            Create task
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
            onClick={fetchTasks}
            disabled={loading}
          >
            <span className={loading ? "spinner-border spinner-border-sm" : ""} aria-hidden />
            {!loading && <span>Refresh</span>}
          </button>
        </div>
      </div>

      {/* Summary stats panel – corporate / government style (matches Personnel directory) */}
      <div className="personnel-stats-panel mb-4">
        <div className="row g-3">
          <div className="col-6 col-md-3 col-lg">
            <div className="personnel-stats-card personnel-stats-card-total">
              <div className="personnel-stats-card-icon" aria-hidden>
                <FaList />
              </div>
              <div className="personnel-stats-card-body">
                <span className="personnel-stats-card-label">Total tasks</span>
                <div className="personnel-stats-card-value-row">
                  <span className="personnel-stats-card-value">
                    {loading ? "—" : formatStatNumber(stats.total)}
                  </span>
                  {!loading && (
                    <button
                      type="button"
                      className="personnel-stats-view-full"
                      onClick={() => setFullAmountModal({ label: "Total tasks", value: stats.total })}
                      aria-label="See exact count for Total tasks"
                    >
                      See exact count
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3 col-lg">
            <div className="personnel-stats-card task-stats-card-pending">
              <div className="personnel-stats-card-icon" aria-hidden>
                <FaClock />
              </div>
              <div className="personnel-stats-card-body">
                <span className="personnel-stats-card-label">Pending</span>
                <div className="personnel-stats-card-value-row">
                  <span className="personnel-stats-card-value">
                    {loading ? "—" : formatStatNumber(stats.pending)}
                  </span>
                  {!loading && (
                    <button
                      type="button"
                      className="personnel-stats-view-full"
                      onClick={() => setFullAmountModal({ label: "Pending", value: stats.pending })}
                      aria-label="See exact count for Pending"
                    >
                      See exact count
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3 col-lg">
            <div className="personnel-stats-card personnel-stats-card-active">
              <div className="personnel-stats-card-icon" aria-hidden>
                <FaCheckCircle />
              </div>
              <div className="personnel-stats-card-body">
                <span className="personnel-stats-card-label">Completed</span>
                <div className="personnel-stats-card-value-row">
                  <span className="personnel-stats-card-value">
                    {loading ? "—" : formatStatNumber(stats.completed)}
                  </span>
                  {!loading && (
                    <button
                      type="button"
                      className="personnel-stats-view-full"
                      onClick={() => setFullAmountModal({ label: "Completed", value: stats.completed })}
                      aria-label="See exact count for Completed"
                    >
                      See exact count
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {fullAmountModal && (
        <Portal>
          <div
            className="account-approvals-detail-overlay"
            aria-modal="true"
            role="dialog"
            aria-labelledby="full-amount-modal-title"
          >
            <div
              className={`account-approvals-detail-backdrop modal-backdrop-animation${fullAmountModalClosing ? " exit" : ""}`}
              onClick={() => {
                if (!fullAmountModalClosing) {
                  setFullAmountModalClosing(true);
                  setTimeout(() => {
                    setFullAmountModal(null);
                    setFullAmountModalClosing(false);
                  }, 200);
                }
              }}
              aria-hidden
            />
            <div className={`account-approvals-detail-modal personnel-full-amount-modal modal-content-animation${fullAmountModalClosing ? " exit" : ""}`}>
              <div className="account-approvals-detail-header">
                <h5 id="full-amount-modal-title" className="mb-0 fw-semibold personnel-full-amount-modal-title">
                  {fullAmountModal.label}
                </h5>
                <button
                  type="button"
                  className="btn-close-custom"
                  onClick={() => {
                    if (!fullAmountModalClosing) {
                      setFullAmountModalClosing(true);
                      setTimeout(() => {
                        setFullAmountModal(null);
                        setFullAmountModalClosing(false);
                      }, 200);
                    }
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="personnel-full-amount-modal-body">
                <p className="personnel-full-amount-modal-value mb-0" aria-live="polite">
                  {fullAmountModal.value.toLocaleString()}
                </p>
              </div>
              <div className="account-approvals-detail-footer">
                <button
                  type="button"
                  className="btn btn-primary account-approvals-detail-close-btn"
                  onClick={() => {
                    if (!fullAmountModalClosing) {
                      setFullAmountModalClosing(true);
                      setTimeout(() => {
                        setFullAmountModal(null);
                        setFullAmountModalClosing(false);
                      }, 200);
                    }
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      <PersonnelTaskSchedule
        tasks={tasks}
        loading={loading}
        onRefresh={fetchTasks}
        onEdit={handleEdit}
        onView={handleView}
        onStatusChange={handleStatusChange}
        apiBase="/tasks"
        emptyMessage="No tasks yet. Create your first task using the Create task button above."
      />
    </div>
  );
};

export default MyTasksPage;
