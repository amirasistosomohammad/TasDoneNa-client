import React, { useMemo, useState, useEffect } from "react";
import Swal from "sweetalert2";
import { api } from "../../services/api.js";
import { showAlert, showToast } from "../../services/notificationService.js";
import { FaEye, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import TaskDetailsModal from "./TaskDetailsModal.jsx";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const statusBadgeClass = (status) => {
  switch (status) {
    case "completed":
      return "officers-status-badge officers-status-approved";
    case "in_progress":
      return "officers-status-badge officers-status-pending";
    case "cancelled":
      return "officers-status-badge officers-status-rejected";
    case "pending":
    default:
      return "officers-status-badge officers-status-pending";
  }
};

const priorityBadgeClass = (priority) => {
  switch (priority) {
    case "high":
      return "badge task-badge-priority-high";
    case "low":
      return "badge task-badge-priority-low";
    case "medium":
    default:
      return "badge task-badge-priority-medium";
  }
};

const TaskList = ({ tasks, loading, onRefresh, onEdit }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kraFilter, setKraFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailTask, setDetailTask] = useState(null);
  const [detailModalClosing, setDetailModalClosing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

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

  const totalPages = useMemo(
    () => Math.ceil(filteredTasks.length / pageSize) || 1,
    [filteredTasks.length, pageSize]
  );

  const displayedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage((p) => Math.max(1, Math.min(p, totalPages)));
  }, [totalPages, searchQuery, statusFilter, kraFilter, pageSize]);

  const closeDetailModal = () => {
    setDetailModalClosing(true);
    setTimeout(() => {
      setDetailTask(null);
      setDetailModalClosing(false);
    }, 200);
  };

  const handleView = (t) => setDetailTask(t);

  const handleEditClick = (t) => {
    closeDetailModal();
    onEdit?.(t);
  };

  const handleDelete = async (t) => {
    const result = await Swal.fire({
      title: "Delete task?",
      text: `"${t.title}" will be permanently removed. This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      background: "#fff",
      color: "#243047",
    });

    if (!result.isConfirmed) return;

    setActionLoading(t.id);
    try {
      await api.delete(`/admin/tasks/${t.id}`);
      showToast.success("Task deleted successfully.");
      onRefresh?.();
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to delete task."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const displayStatus = (status) => {
    if (status === "in_progress") return "In progress";
    return (status || "pending").replace(/_/g, " ");
  };

  const displayPriority = (priority) => {
    return (priority || "medium").charAt(0).toUpperCase() + (priority || "medium").slice(1);
  };

  return (
    <>
      <div className="card border-0 shadow-sm account-approvals-card">
        <div className="card-header bg-white border-bottom account-approvals-card-header">
          <h6 className="mb-0 fw-semibold account-approvals-card-title">All tasks</h6>
          <p className="small text-muted mb-0 mt-1">
            Browse and manage tasks. Filter by status or KRA, edit, or delete tasks.
          </p>
        </div>

        {!loading && (tasks || []).length > 0 && (
          <div className="account-approvals-filter-panel">
            <div className="account-approvals-filter-row">
              <label htmlFor="tasks-search-input" className="account-approvals-search-label">
                Search
              </label>
              <div className="account-approvals-search-wrap">
                <span className="account-approvals-search-icon-wrap" aria-hidden>
                  <FaSearch className="account-approvals-search-icon" />
                </span>
                <span className="account-approvals-search-input-wrap">
                  <input
                    id="tasks-search-input"
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
                <label htmlFor="tasks-status-filter" className="account-approvals-search-label mb-0">
                  Status
                </label>
                <select
                  id="tasks-status-filter"
                  className="form-select form-select-sm account-approvals-per-page-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="d-flex align-items-center gap-2">
                <label htmlFor="tasks-kra-filter" className="account-approvals-search-label mb-0">
                  KRA
                </label>
                <input
                  id="tasks-kra-filter"
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Filter by KRA"
                  value={kraFilter}
                  onChange={(e) => setKraFilter(e.target.value)}
                  aria-label="Filter by KRA"
                  style={{ maxWidth: "140px" }}
                />
              </div>
              {searchQuery && (
                <span className="account-approvals-results-text">
                  {filteredTasks.length} result{filteredTasks.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="small text-muted mt-2 mb-0">Loading tasks...</p>
            </div>
          ) : !tasks || tasks.length === 0 ? (
            <div className="text-center py-5 px-3">
              <p className="text-muted mb-0">No tasks yet.</p>
              <p className="small text-muted mt-1">Create your first task using the Create task link in the sidebar.</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="account-approvals-empty-state">
              <div className="account-approvals-empty-state-icon">
                <FaSearch aria-hidden />
              </div>
              <h3 className="account-approvals-empty-state-title">No matches found</h3>
              <p className="account-approvals-empty-state-text">
                No tasks match your filters. Try different keywords or clear filters.
              </p>
              <button
                type="button"
                className="btn btn-sm account-approvals-empty-state-btn"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setKraFilter("");
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive account-approvals-table-wrap">
                <table className="table table-hover align-middle mb-0 account-approvals-table">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="account-approvals-col-num text-center">
                        #
                      </th>
                      <th scope="col" className="account-approvals-col-actions">
                        Actions
                      </th>
                      <th scope="col">Title</th>
                      <th scope="col">KRA</th>
                      <th scope="col">Status</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Assigned to</th>
                      <th scope="col">Due date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTasks.map((t, index) => (
                      <tr key={t.id}>
                        <td className="account-approvals-col-num text-center text-muted fw-medium">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="account-approvals-col-actions">
                          <div className="d-flex gap-1 flex-nowrap align-items-center account-approvals-action-btns">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary account-approvals-btn-icon"
                              onClick={() => handleView(t)}
                              title="View details"
                              aria-label="View details"
                            >
                              <FaEye aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary account-approvals-btn-icon"
                              onClick={() => onEdit?.(t)}
                              title="Edit"
                              aria-label="Edit"
                            >
                              <FaEdit aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger account-approvals-btn-icon"
                              onClick={() => handleDelete(t)}
                              disabled={actionLoading !== null}
                              title="Delete"
                              aria-label="Delete"
                            >
                              {actionLoading === t.id ? (
                                <span className="spinner-border spinner-border-sm" aria-hidden />
                              ) : (
                                <FaTrash aria-hidden />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="account-approvals-cell-text fw-semibold" title={t.title}>
                          {t.title}
                        </td>
                        <td className="account-approvals-cell-text" title={t.kra || ""}>
                          {t.kra || "—"}
                        </td>
                        <td>
                          <span className={statusBadgeClass(t.status)}>{displayStatus(t.status)}</span>
                        </td>
                        <td>
                          <span className={priorityBadgeClass(t.priority)}>{displayPriority(t.priority)}</span>
                        </td>
                        <td className="account-approvals-cell-text">
                          {t.assignee ? t.assignee.name : "All officers"}
                        </td>
                        <td className="account-approvals-cell-text small text-muted">
                          {formatDate(t.due_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-3 border-top account-approvals-pagination">
                <div className="d-flex flex-wrap align-items-center gap-3 account-approvals-pagination-left">
                  <span className="small text-muted">
                    Showing {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, filteredTasks.length)} of {filteredTasks.length}
                  </span>
                  <div className="d-flex align-items-center gap-2 account-approvals-per-page">
                    <label htmlFor="tasks-per-page-select" className="small text-muted mb-0">
                      Per page
                    </label>
                    <select
                      id="tasks-per-page-select"
                      className="form-select form-select-sm account-approvals-per-page-select"
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      aria-label="Items per page"
                    >
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <nav aria-label="Tasks pagination" className="account-approvals-pagination-nav">
                  <ul className="pagination pagination-sm mb-0 flex-wrap justify-content-center">
                    <li className="page-item">
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        aria-label="Previous page"
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className="page-item">
                        <button
                          type="button"
                          className={`page-link ${currentPage === page ? "active" : ""}`}
                          onClick={() => setCurrentPage(page)}
                          aria-label={`Page ${page}`}
                          aria-current={currentPage === page ? "page" : undefined}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    <li className="page-item">
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        aria-label="Next page"
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>

      {detailTask && (
        <TaskDetailsModal
          task={detailTask}
          closing={detailModalClosing}
          onClose={closeDetailModal}
          onEdit={() => handleEditClick(detailTask)}
        />
      )}
    </>
  );
};

export default TaskList;
