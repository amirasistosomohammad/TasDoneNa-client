import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api.js";
import { showAlert, showToast } from "../../services/notificationService.js";
import {
  FaClipboardList,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaSyncAlt,
  FaUndo,
  FaChevronDown,
  FaCalendarAlt,
} from "react-icons/fa";
import TaskConfirmModal from "../TaskConfirmModal.jsx";
import "./MyTasksSchedule.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatMonthYear = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
};

const displayStatus = (status) => {
  const s = status || "pending";
  if (s === "in_progress") return "Pending";
  return s.replace(/_/g, " ");
};

const displayPriority = (priority) => {
  return (priority || "medium").charAt(0).toUpperCase() + (priority || "medium").slice(1);
};

function groupTasksByMonth(tasks) {
  const groups = {};
  for (const t of tasks) {
    const key = t.due_date ? t.due_date.slice(0, 7) : "no_date";
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => {
      if (a === "no_date") return 1;
      if (b === "no_date") return -1;
      return a.localeCompare(b);
    })
    .map(([monthKey, taskList]) => ({
      monthKey,
      monthLabel: monthKey === "no_date" ? "No due date" : formatMonthYear(taskList[0]?.due_date),
      tasks: taskList.sort((a, b) => (a.due_date || "").localeCompare(b.due_date || "")),
    }));
}

function isOverdue(task) {
  return (
    task?.status !== "completed" &&
    task?.due_date &&
    task.due_date < new Date().toISOString().slice(0, 10)
  );
}

/**
 * Personnel My Tasks – Task Schedule layout (corporate/government style).
 * Inspired by MidTaskApp Timeline; adapted for TasDoneNa data and color scheme.
 */
const PersonnelTaskSchedule = ({
  tasks = [],
  loading,
  onRefresh,
  onEdit,
  onView,
  onStatusChange,
  apiBase = "/tasks",
  emptyMessage = "No tasks yet. Create your first task using the Create task button above.",
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kraFilter, setKraFilter] = useState("");
  const [collapsedMonths, setCollapsedMonths] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null); // { task, newStatus }
  const [statusConfirmLoading, setStatusConfirmLoading] = useState(false);

  const filteredTasks = useMemo(() => {
    let base = tasks || [];
    if (statusFilter !== "all") {
      base = base.filter((t) => t.status === statusFilter);
    }
    if (kraFilter.trim()) {
      const k = kraFilter.trim().toLowerCase();
      base = base.filter((t) => t.kra && t.kra.toLowerCase().includes(k));
    }
    if (!searchQuery.trim()) return base;
    const q = searchQuery.trim().toLowerCase();
    return base.filter(
      (t) =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.mfo && t.mfo.toLowerCase().includes(q)) ||
        (t.kra && t.kra.toLowerCase().includes(q)) ||
        (t.objective && t.objective.toLowerCase().includes(q))
    );
  }, [tasks, searchQuery, statusFilter, kraFilter]);

  const grouped = useMemo(() => groupTasksByMonth(filteredTasks), [filteredTasks]);

  const handleView = (t) => {
    if (onView) onView(t);
    else navigate(`/my-tasks/${t.id}`);
  };

  const handleEdit = (t) => {
    if (onEdit) onEdit(t);
    else navigate("/my-tasks/create", { state: { editTask: t } });
  };

  const handleDeleteClick = (t) => {
    setDeleteConfirmTask(t);
  };

  const closeDeleteModal = useCallback(() => {
    setDeleteConfirmTask(null);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmTask) return;
    setActionLoading(deleteConfirmTask.id);
    try {
      await api.delete(`${apiBase}/${deleteConfirmTask.id}`);
      showToast.success("Task deleted successfully.");
      closeDeleteModal();
      onRefresh?.();
    } catch (err) {
      showAlert.error("Error", err.data?.message || err.message || "Failed to delete task.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChangeClick = (t, newStatus) => {
    setStatusConfirm({ task: t, newStatus });
  };

  const closeStatusModal = useCallback(() => {
    setStatusConfirm(null);
  }, []);

  const handleStatusConfirm = async () => {
    if (!statusConfirm) return;
    const { task, newStatus } = statusConfirm;
    setStatusConfirmLoading(true);
    try {
      await api.put(`${apiBase}/${task.id}`, { status: newStatus });
      const label = newStatus === "completed" ? "completed" : newStatus === "pending" ? "reopened" : newStatus;
      showToast.success(`Task ${label} successfully!`);
      closeStatusModal();
      onRefresh?.();
    } catch (err) {
      showAlert.error("Error", err.data?.message || err.message || "Failed to update task status.");
    } finally {
      setStatusConfirmLoading(false);
    }
  };

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setKraFilter("");
  }, []);

  if (loading) {
    return (
      <div className="my-tasks-schedule-loading">
        <div className="spinner-border text-primary" role="status" aria-hidden />
        <span>Loading tasks…</span>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="my-tasks-schedule-empty">
        <FaClipboardList className="my-tasks-schedule-empty-icon" aria-hidden />
        <h3 className="my-tasks-schedule-empty-title">No tasks yet</h3>
        <p className="my-tasks-schedule-empty-desc">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="my-tasks-schedule">
      <div className="card border-0 shadow-sm account-approvals-card">
        <div className="card-header bg-white border-bottom account-approvals-card-header">
          <h6 className="mb-0 fw-semibold account-approvals-card-title">My tasks</h6>
          <p className="small text-muted mb-0 mt-1">
            Browse and manage tasks. Filter by status or KRA, view details, or mark as completed.
          </p>
        </div>

        {/* Filters panel – always visible when tasks exist (matches Personnel Directory) */}
        <div className="account-approvals-filter-panel">
        <div className="account-approvals-filter-row">
          <label htmlFor="my-tasks-search-input" className="account-approvals-search-label">
            Search
          </label>
          <div className="account-approvals-search-wrap">
            <span className="account-approvals-search-icon-wrap" aria-hidden>
              <FaSearch className="account-approvals-search-icon" />
            </span>
            <span className="account-approvals-search-input-wrap">
              <input
                id="my-tasks-search-input"
                type="search"
                className="account-approvals-search-input"
                placeholder="Filter by title, MFO, KRA or objective"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search tasks"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="account-approvals-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="my-tasks-status-filter" className="account-approvals-search-label mb-0">
              Status
            </label>
            <select
              id="my-tasks-status-filter"
              className="form-select form-select-sm account-approvals-per-page-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="my-tasks-kra-filter" className="account-approvals-search-label mb-0">
              KRA
            </label>
            <input
              id="my-tasks-kra-filter"
              type="text"
              className="form-control form-control-sm"
              placeholder="Filter by KRA"
              value={kraFilter}
              onChange={(e) => setKraFilter(e.target.value)}
              aria-label="Filter by KRA"
              style={{ maxWidth: "140px" }}
            />
          </div>
          {(searchQuery || statusFilter !== "all" || kraFilter.trim()) && (
            <span className="account-approvals-results-text">
              {filteredTasks.length} result{filteredTasks.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

        <div className="card-body p-0">
          {/* No matches – show empty state but keep filters visible above */}
          {filteredTasks.length === 0 ? (
            <div className="my-tasks-schedule-empty">
          <FaSearch className="my-tasks-schedule-empty-icon" aria-hidden />
          <h3 className="my-tasks-schedule-empty-title">No matches found</h3>
          <p className="my-tasks-schedule-empty-desc">
            No tasks match your filters. Try different keywords or reset filters.
          </p>
          <button
            type="button"
            className="my-tasks-schedule-reset-btn"
            onClick={resetFilters}
            aria-label="Reset filters"
          >
            <FaUndo aria-hidden />
          Reset filters
        </button>
            </div>
          ) : (
            <div className="my-tasks-schedule-timeline">
          {grouped.map(({ monthKey, monthLabel, tasks: monthTasks }) => {
            const isCollapsed = !!collapsedMonths[monthKey];
            return (
              <div key={monthKey} className={`my-tasks-schedule-month-group ${isCollapsed ? "collapsed" : ""}`}>
                <button
                  type="button"
                  className="my-tasks-schedule-month-header"
                  onClick={() =>
                    setCollapsedMonths((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }))
                  }
                  aria-expanded={!isCollapsed}
                  aria-controls={`my-tasks-month-${monthKey}`}
                >
                  <div className="my-tasks-schedule-month-title-wrap">
                    <FaCalendarAlt className="my-tasks-schedule-month-icon" aria-hidden />
                    <h5 className="my-tasks-schedule-month-title">{monthLabel}</h5>
                    <span className="my-tasks-schedule-month-count">
                      {monthTasks.length} task{monthTasks.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="my-tasks-schedule-month-chevron" aria-hidden>
                    <FaChevronDown />
                  </span>
                </button>
                <div
                  id={`my-tasks-month-${monthKey}`}
                  className={`my-tasks-schedule-month-body ${isCollapsed ? "collapsed" : ""}`}
                >
                  <div className="my-tasks-schedule-month-body-inner">
                    <div className="my-tasks-schedule-track">
                    {monthTasks.map((task, idx) => (
                      <TaskScheduleItem
                        key={task.id}
                        task={task}
                        isLast={idx === monthTasks.length - 1}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        onStatusChange={handleStatusChangeClick}
                        actionLoading={actionLoading}
                      />
                    ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
            </div>
          )}
        </div>
      </div>

      {/* Delete task modal – matches LogoutConfirmModal / Personnel Directory */}
      <TaskConfirmModal
        isOpen={!!deleteConfirmTask}
        title="Delete task?"
        subtitle={deleteConfirmTask?.title}
        bodyText={`"${deleteConfirmTask?.title || ""}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteModal}
        isLoading={actionLoading === deleteConfirmTask?.id}
        loadingLabel="Deleting…"
      />

      {/* Reopen task modal */}
      {statusConfirm?.newStatus === "pending" && (
        <TaskConfirmModal
          isOpen={!!statusConfirm}
          title="Reopen task?"
          subtitle={statusConfirm?.task?.title}
          bodyText={`Change "${statusConfirm?.task?.title || ""}" status from completed? This task will no longer appear in accomplishment reports until completed again.`}
          confirmLabel="Yes, reopen"
          cancelLabel="Cancel"
          confirmVariant="confirm"
          onConfirm={handleStatusConfirm}
          onCancel={closeStatusModal}
          isLoading={statusConfirmLoading}
          loadingLabel="Reopening…"
        />
      )}

      {/* Mark as completed modal */}
      {statusConfirm?.newStatus === "completed" && (
        <TaskConfirmModal
          isOpen={!!statusConfirm}
          title="Mark as completed?"
          subtitle={statusConfirm?.task?.title}
          bodyText={`Mark "${statusConfirm?.task?.title || ""}" as completed? This task will be included in your accomplishment reports.`}
          confirmLabel="Yes, mark as completed"
          cancelLabel="Cancel"
          confirmVariant="confirm"
          onConfirm={handleStatusConfirm}
          onCancel={closeStatusModal}
          isLoading={statusConfirmLoading}
          loadingLabel="Marking as completed…"
        />
      )}
    </div>
  );
};

function TaskScheduleItem({
  task,
  isLast,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  actionLoading,
}) {
  const overdue = isOverdue(task);
  const completed = task.status === "completed";

  return (
    <div
      className={`my-tasks-schedule-item ${overdue ? "overdue" : ""} ${completed ? "completed" : ""}`}
    >
      {!isLast && <div className="my-tasks-schedule-item-line" aria-hidden />}
      <div className="my-tasks-schedule-item-dot" aria-hidden />
      <div
        className="my-tasks-schedule-item-content"
        role="button"
        tabIndex={0}
        onClick={() => onView(task)}
        onKeyDown={(e) => e.key === "Enter" && onView(task)}
        aria-label={`View ${task.title}`}
      >
        <div className="my-tasks-schedule-item-header">
          <span className="my-tasks-schedule-item-date">{formatDate(task.due_date)}</span>
          <span className={`my-tasks-schedule-item-badge status-${task.status || "pending"}`}>
            {displayStatus(task.status)}
          </span>
        </div>
        <h6 className="my-tasks-schedule-item-title">{task.title}</h6>
        <div className="my-tasks-schedule-item-meta">
          {task.kra && <span className="my-tasks-schedule-item-kra">{task.kra}</span>}
          <span className="my-tasks-schedule-item-priority">{displayPriority(task.priority)}</span>
        </div>
        {overdue && (
          <span className="my-tasks-schedule-item-badge overdue">Overdue</span>
        )}
        <div className="my-tasks-schedule-item-actions">
          <button
            type="button"
            className="my-tasks-schedule-item-btn view"
            onClick={(e) => {
              e.stopPropagation();
              onView(task);
            }}
            title="View details"
            aria-label="View details"
          >
            <FaEye aria-hidden />
            <span className="my-tasks-schedule-btn-text">View</span>
          </button>
          <button
            type="button"
            className="my-tasks-schedule-item-btn edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            title="Edit"
            aria-label="Edit"
          >
            <FaEdit aria-hidden />
            <span className="my-tasks-schedule-btn-text">Edit</span>
          </button>
          {task.status !== "completed" && onStatusChange && (
            <button
              type="button"
              className="my-tasks-schedule-item-btn complete"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task, "completed");
              }}
              title="Mark as completed"
              aria-label="Mark as completed"
            >
              <FaCheckCircle aria-hidden />
              <span className="my-tasks-schedule-btn-text">Done</span>
            </button>
          )}
          {task.status === "completed" && onStatusChange && (
            <button
              type="button"
              className="my-tasks-schedule-item-btn reopen"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task, "pending");
              }}
              title="Reopen"
              aria-label="Reopen task"
            >
              <FaSyncAlt aria-hidden />
              <span className="my-tasks-schedule-btn-text">Reopen</span>
            </button>
          )}
          <button
            type="button"
            className="my-tasks-schedule-item-btn delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            disabled={actionLoading === task.id}
            title="Delete"
            aria-label="Delete"
          >
            {actionLoading === task.id ? (
              <span className="spinner-border spinner-border-sm" aria-hidden />
            ) : (
              <FaTrash aria-hidden />
            )}
            <span className="my-tasks-schedule-btn-text">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PersonnelTaskSchedule;
