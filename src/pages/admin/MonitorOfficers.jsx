import React, { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { api } from "../../services/api.js";
import { showToast } from "../../services/notificationService.js";
import {
  FaDesktop,
  FaSync,
  FaSpinner,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChevronDown,
  FaChevronRight,
  FaSearch,
  FaUndo,
  FaEye,
  FaFile,
  FaDownload,
} from "react-icons/fa";
import "../../components/personnel/MyTasksSchedule.css";
import "./MonitorOfficers.css";

const normalizeAvatarUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const baseUrl = api.baseUrl.replace(/\/$/, "");
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
};

function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(ymd) {
  if (!ymd) return "—";
  try {
    const dateStr = /[\sT]/.test(ymd) ? ymd : ymd + "T12:00:00";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return ymd;
  }
}

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(num);
}

function formatCountFull(n) {
  return (Number(n) || 0).toLocaleString();
}

function displayPriority(priority) {
  return (priority || "medium").charAt(0).toUpperCase() + (priority || "medium").slice(1);
}

export default function MonitorOfficers() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [schoolFilter, setSchoolFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState(new Set());
  const [kpiModalStat, setKpiModalStat] = useState(null);
  const [kpiModalClosing, setKpiModalClosing] = useState(false);
  const [viewTaskModal, setViewTaskModal] = useState(null);
  const [viewTaskModalClosing, setViewTaskModalClosing] = useState(false);

  const filteredOfficers = useMemo(() => {
    let list = officers;
    if (schoolFilter) {
      list = list.filter((o) => (o.school_name || "") === schoolFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const name = (o.name || "").toLowerCase();
        const email = (o.email || "").toLowerCase();
        const empId = (o.employee_id || "").toLowerCase();
        const position = (o.position || "").toLowerCase();
        const school = (o.school_name || "").toLowerCase();
        const division = (o.division || "").toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          empId.includes(q) ||
          position.includes(q) ||
          school.includes(q) ||
          division.includes(q)
        );
      });
    }
    return list;
  }, [officers, schoolFilter, searchQuery]);

  const kpiCounts = useMemo(
    () => ({
      pending: filteredOfficers.reduce((s, o) => s + (o.pending_count || 0), 0),
      missing: filteredOfficers.reduce((s, o) => s + (o.missing_count || 0), 0),
      completed: filteredOfficers.reduce((s, o) => s + (o.completed_count || 0), 0),
      officers: filteredOfficers.length,
    }),
    [filteredOfficers]
  );

  const fetchAllOfficers = useCallback(async () => {
    try {
      const res = await api.get("/admin/monitor-officers");
      setOfficers(res.officers || []);
      setSchools(res.schools || []);
    } catch (err) {
      showToast.error(err?.message || "Failed to load officer data.");
      setOfficers([]);
      setSchools([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAllOfficers().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchAllOfficers]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAllOfficers();
    } finally {
      setRefreshing(false);
    }
  }, [fetchAllOfficers]);

  useEffect(() => {
    if (!kpiModalStat) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !kpiModalClosing) {
        setKpiModalClosing(true);
        setTimeout(() => {
          setKpiModalClosing(false);
          setKpiModalStat(null);
        }, 200);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [kpiModalStat, kpiModalClosing]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const closeKpiModal = () => {
    if (kpiModalClosing) return;
    setKpiModalClosing(true);
    setTimeout(() => {
      setKpiModalClosing(false);
      setKpiModalStat(null);
    }, 200);
  };

  const closeViewTaskModal = () => {
    if (viewTaskModalClosing) return;
    setViewTaskModalClosing(true);
    setTimeout(() => {
      setViewTaskModalClosing(false);
      setViewTaskModal(null);
    }, 200);
  };

  useEffect(() => {
    if (!viewTaskModal) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !viewTaskModalClosing) closeViewTaskModal();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [viewTaskModal, viewTaskModalClosing]);

  return (
    <div className="container-fluid px-3 px-md-4">
      <div className="monitor-officers-page">
        <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
          <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
            <span className="account-approvals-page-icon monitor-officers-title-icon">
              <FaDesktop aria-hidden />
            </span>
            Monitor personnel
          </h1>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
            onClick={handleRefresh}
            disabled={loading}
          >
            {refreshing ? (
              <FaSpinner className="spinner" aria-hidden />
            ) : (
              <FaSync aria-hidden />
            )}
            Refresh
          </button>
        </div>

        <p className="small text-muted mb-3">
          View task progress and activity across all personnel. Filter and search below.
        </p>

        {loading ? (
          <div className="activity-logs-loading monitor-officers-loading">
            <FaSpinner className="spinner" aria-hidden />
            Loading officer data…
          </div>
        ) : (
          <>
            <div className="card border-0 shadow-sm account-approvals-card monitor-officers-card">
              <div className="card-header bg-white border-bottom account-approvals-card-header">
                <h6 className="mb-0 fw-semibold account-approvals-card-title">Search & filter</h6>
              </div>
              <div className="account-approvals-filter-panel">
                <div className="account-approvals-filter-row">
                  <label htmlFor="monitor-officers-search" className="account-approvals-search-label">
                    Search
                  </label>
                  <div className="account-approvals-search-wrap">
                    <span className="account-approvals-search-icon-wrap" aria-hidden>
                      <FaSearch className="account-approvals-search-icon" />
                    </span>
                    <span className="account-approvals-search-input-wrap">
                      <input
                        id="monitor-officers-search"
                        type="search"
                        className="account-approvals-search-input"
                        placeholder="Search by name, email, school or division"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search officers"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          className="account-approvals-search-clear"
                          onClick={() => setSearchQuery("")}
                          aria-label="Clear search"
                          title="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <label htmlFor="monitor-officers-school" className="account-approvals-search-label mb-0">
                      School
                    </label>
                    <select
                      id="monitor-officers-school"
                      className="form-select form-select-sm account-approvals-per-page-select monitor-officers-filter-select"
                      value={schoolFilter}
                      onChange={(e) => setSchoolFilter(e.target.value)}
                      disabled={loading}
                      aria-label="Filter by school"
                    >
                      <option value="">All schools</option>
                      {schools.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(searchQuery || schoolFilter) && (
                    <span className="account-approvals-results-text">
                      {filteredOfficers.length} result{filteredOfficers.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {officers.length === 0 ? (
              <div className="card border-0 shadow-sm account-approvals-card">
                <div className="text-center py-5 px-3">
                  <p className="text-muted mb-0">No officers</p>
                  <p className="small text-muted mt-1">
                    {schoolFilter
                      ? `No active personnel found for ${schoolFilter}.`
                      : "No active personnel. Approve registrations to see officers here."}
                  </p>
                </div>
              </div>
            ) : filteredOfficers.length === 0 ? (
              <div className="card border-0 shadow-sm account-approvals-card">
                <div className="account-approvals-empty-state">
                  <div className="account-approvals-empty-state-icon">
                    <FaSearch aria-hidden />
                  </div>
                  <h3 className="account-approvals-empty-state-title">No officers match your search</h3>
                  <p className="account-approvals-empty-state-text">
                    Try different keywords or clear the search and school filter.
                  </p>
                  <button
                    type="button"
                    className="btn account-approvals-empty-state-btn"
                    onClick={() => {
                      setSearchQuery("");
                      setSchoolFilter("");
                    }}
                    aria-label="Clear filters"
                  >
                    <FaUndo className="sb-empty-state-btn-icon" aria-hidden />
                    Clear filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="personnel-stats-panel mb-4">
                  <div className="row g-3">
                    <div className="col-6 col-md-3 col-lg">
                      <div className="personnel-stats-card monitor-officers-stats-pending">
                        <div className="personnel-stats-card-icon" aria-hidden>
                          <FaClock />
                        </div>
                        <div className="personnel-stats-card-body">
                          <span className="personnel-stats-card-label">Pending</span>
                          <div className="personnel-stats-card-value-row">
                            <span className="personnel-stats-card-value">{formatCount(kpiCounts.pending)}</span>
                            <button
                              type="button"
                              className="personnel-stats-view-full"
                              onClick={() => setKpiModalStat("pending")}
                              aria-label="See exact count for Pending"
                            >
                              See exact count
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3 col-lg">
                      <div className="personnel-stats-card personnel-stats-card-rejected">
                        <div className="personnel-stats-card-icon" aria-hidden>
                          <FaExclamationTriangle />
                        </div>
                        <div className="personnel-stats-card-body">
                          <span className="personnel-stats-card-label">Missing (overdue)</span>
                          <div className="personnel-stats-card-value-row">
                            <span className="personnel-stats-card-value">{formatCount(kpiCounts.missing)}</span>
                            <button
                              type="button"
                              className="personnel-stats-view-full"
                              onClick={() => setKpiModalStat("missing")}
                              aria-label="See exact count for Missing"
                            >
                              See exact count
                            </button>
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
                            <span className="personnel-stats-card-value">{formatCount(kpiCounts.completed)}</span>
                            <button
                              type="button"
                              className="personnel-stats-view-full"
                              onClick={() => setKpiModalStat("completed")}
                              aria-label="See exact count for Completed"
                            >
                              See exact count
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3 col-lg">
                      <div className="personnel-stats-card personnel-stats-card-total">
                        <div className="personnel-stats-card-icon" aria-hidden>
                          <FaDesktop />
                        </div>
                        <div className="personnel-stats-card-body">
                          <span className="personnel-stats-card-label">Officers</span>
                          <div className="personnel-stats-card-value-row">
                            <span className="personnel-stats-card-value">{formatCount(kpiCounts.officers)}</span>
                            <button
                              type="button"
                              className="personnel-stats-view-full"
                              onClick={() => setKpiModalStat("officers")}
                              aria-label="See exact count for Officers"
                            >
                              See exact count
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-0 shadow-sm account-approvals-card">
                  <div className="card-body p-0">
                    <div className="personnel-dir-cards-container">
                      <div className="personnel-dir-cards-grid monitor-officers-officers-grid">
                  {filteredOfficers.map((officer) => (
                    <div key={officer.id} className="personnel-dir-card-col monitor-officers-card-col">
                    <OfficerCard
                      officer={officer}
                      expanded={expanded.has(officer.id)}
                      onToggle={() => toggleExpand(officer.id)}
                      formatDate={formatDate}
                      getInitials={getInitials}
                      buildAvatarUrl={normalizeAvatarUrl}
                      onViewTask={(userTask, officerName, officerId, isOverdue, isCompleted) =>
                        setViewTaskModal({ userTask, officerName, officerId, isOverdue, isCompleted })
                      }
                    />
                    </div>
                  ))}
                  </div>
                </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {kpiModalStat &&
          createPortal(
            <div
              className="account-approvals-detail-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="kpi-modal-title"
              onKeyDown={(e) => e.key === "Escape" && !kpiModalClosing && closeKpiModal()}
            >
              <div
                className={`account-approvals-detail-backdrop modal-backdrop-animation${kpiModalClosing ? " exit" : ""}`}
                onClick={closeKpiModal}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !kpiModalClosing) closeKpiModal();
                }}
                role="button"
                tabIndex={0}
                aria-label="Close"
              />
              <div
                className={`personnel-dir-modal modal-content-animation${kpiModalClosing ? " exit" : ""}`}
                style={{ maxWidth: "22rem" }}
              >
                <div className="personnel-dir-modal-header">
                  <div className="personnel-dir-modal-header-text">
                    <h5 id="kpi-modal-title" className="personnel-dir-modal-title mb-0">
                      {kpiModalStat === "pending" && "Pending tasks"}
                      {kpiModalStat === "missing" && "Missing (overdue)"}
                      {kpiModalStat === "completed" && "Completed tasks"}
                      {kpiModalStat === "officers" && "Officers"}
                    </h5>
                    <div className="personnel-dir-modal-subtitle">Full count for current filters</div>
                  </div>
                  <button
                    type="button"
                    className="personnel-dir-modal-close"
                    onClick={closeKpiModal}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="personnel-dir-modal-body text-center py-4">
                  <p className="monitor-officers-kpi-modal-value mb-2">
                    {formatCountFull(
                      kpiModalStat === "pending"
                        ? kpiCounts.pending
                        : kpiModalStat === "missing"
                          ? kpiCounts.missing
                          : kpiModalStat === "completed"
                            ? kpiCounts.completed
                            : kpiCounts.officers
                    )}
                  </p>
                  <p className="small text-muted mb-0">
                    {kpiModalStat === "pending" && "Pending task assignments"}
                    {kpiModalStat === "missing" && "Overdue task assignments"}
                    {kpiModalStat === "completed" && "Completed task submissions"}
                    {kpiModalStat === "officers" && "Personnel in view"}
                  </p>
                </div>
                <div className="personnel-dir-modal-footer">
                  <button type="button" className="personnel-dir-btn-close" onClick={closeKpiModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {viewTaskModal &&
          createPortal(
            <TaskDetailModal
              data={viewTaskModal}
              closing={viewTaskModalClosing}
              onClose={closeViewTaskModal}
              formatDate={formatDate}
              displayPriority={displayPriority}
            />,
            document.body
          )}
      </div>
    </div>
  );
}

function TaskDetailModal({ data, closing, onClose, formatDate, displayPriority }) {
  const { userTask, officerName, officerId, isOverdue, isCompleted } = data || {};
  const task = userTask?.task || userTask;
  const taskId = task?.id || userTask?.task_id;
  const [fullTask, setFullTask] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(true);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .get(`/admin/tasks/${taskId}`)
      .then((res) => {
        if (!cancelled) setFullTask(res.task);
      })
      .catch(() => {
        if (!cancelled) setFullTask(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useEffect(() => {
    if (!taskId) {
      setFilesLoading(false);
      return;
    }
    let cancelled = false;
    const params = officerId ? { user_id: officerId } : {};
    api
      .get(`/admin/tasks/${taskId}/files`, { params })
      .then((res) => {
        if (!cancelled) setFiles(res.files || []);
      })
      .catch(() => {
        if (!cancelled) setFiles([]);
      })
      .finally(() => {
        if (!cancelled) setFilesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId, officerId]);

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const token = localStorage.getItem("access_token");
      const baseUrl = api.baseUrl.replace(/\/$/, "");
      const url = `${baseUrl}/api/admin/tasks/${taskId}/files/${fileId}/download`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to download");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      showToast.success("File downloaded.");
    } catch (err) {
      showToast.error(err?.message || "Failed to download file.");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!task && !userTask) return null;

  const displayTask = fullTask || task;
  const taskTitle = displayTask?.title ?? "Task";
  const statusLabel = isCompleted ? "Completed" : isOverdue ? "Overdue" : "Pending";
  const statusClass = isCompleted ? "monitor-officers-badge-completed" : isOverdue ? "monitor-officers-badge-missing" : "monitor-officers-badge-pending";

  return (
    <div
      className="account-approvals-detail-overlay personnel-dir-overlay monitor-officers-task-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="monitor-officers-task-modal-title"
      onKeyDown={(e) => e.key === "Escape" && !closing && onClose?.()}
    >
      <div
        className={`account-approvals-detail-backdrop modal-backdrop-animation${closing ? " exit" : ""}`}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Enter" && !closing && onClose?.()}
        role="button"
        tabIndex={0}
        aria-label="Close"
      />
      <div className={`personnel-dir-wrap monitor-officers-task-modal-wrap modal-content-animation${closing ? " exit" : ""}`}>
        <div className="personnel-dir-modal monitor-officers-task-modal">
          <div className="personnel-dir-modal-header">
            <div className="personnel-dir-modal-header-text">
              <h5 id="monitor-officers-task-modal-title" className="personnel-dir-modal-title mb-0">
                Task details
              </h5>
              <div className="personnel-dir-modal-subtitle">
                {taskTitle}
                {officerName ? ` · Assigned to ${officerName}` : ""}
              </div>
            </div>
            <button type="button" className="personnel-dir-modal-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          <div className="personnel-dir-modal-body">
            <dl className="personnel-dir-details-grid">
              <div className="personnel-dir-details-row">
                <dt>Status</dt>
                <dd>
                  <span className={`monitor-officers-badge ${statusClass}`}>{statusLabel}</span>
                </dd>
              </div>
              <div className="personnel-dir-details-row">
                <dt>Priority</dt>
                <dd>{displayPriority?.(displayTask?.priority) ?? "Medium"}</dd>
              </div>
              <div className="personnel-dir-details-row">
                <dt>MFO</dt>
                <dd>{displayTask?.mfo || "—"}</dd>
              </div>
              <div className="personnel-dir-details-row">
                <dt>KRA</dt>
                <dd>{displayTask?.kra || "—"}</dd>
              </div>
              <div className="personnel-dir-details-row">
                <dt>KRA weight</dt>
                <dd>{displayTask?.kra_weight != null ? `${displayTask.kra_weight}%` : "—"}</dd>
              </div>
              <div className="personnel-dir-details-row">
                <dt>Assigned to</dt>
                <dd>{officerName || "—"}</dd>
              </div>
              <div className="personnel-dir-details-row">
                <dt>Due date</dt>
                <dd>{formatDate(userTask?.due_date || displayTask?.due_date)}</dd>
              </div>
              <div className="personnel-dir-details-row">
                <dt>Created at</dt>
                <dd>{formatDate(displayTask?.created_at)}</dd>
              </div>
              <div className="personnel-dir-details-row">
                <dt>Updated at</dt>
                <dd>{formatDate(displayTask?.updated_at)}</dd>
              </div>
              {displayTask?.description && (
                <div className="personnel-dir-details-row personnel-dir-details-row-full">
                  <dt>Description</dt>
                  <dd>{displayTask.description}</dd>
                </div>
              )}
              {displayTask?.objective && (
                <div className="personnel-dir-details-row personnel-dir-details-row-full">
                  <dt>Objective</dt>
                  <dd>{displayTask.objective}</dd>
                </div>
              )}
              {Array.isArray(displayTask?.movs) && displayTask.movs.filter(Boolean).length > 0 && (
                <div className="personnel-dir-details-row personnel-dir-details-row-full">
                  <dt>MOVs</dt>
                  <dd>
                    <ul className="mb-0 ps-3">
                      {displayTask.movs.filter(Boolean).map((mov, i) => (
                        <li key={i}>{mov}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              <div className="personnel-dir-details-row personnel-dir-details-row-full">
                <dt>Uploaded files</dt>
                <dd>
                  {filesLoading ? (
                    <span className="small text-muted">Loading files…</span>
                  ) : files.length === 0 ? (
                    <span className="small text-muted">No files uploaded yet.</span>
                  ) : (
                    <ul className="monitor-officers-task-files-list mb-0 ps-0 list-unstyled">
                      {files.map((f) => (
                        <li key={f.id} className="monitor-officers-task-file-item">
                          <span className="monitor-officers-task-file-name">
                            <FaFile aria-hidden />
                            {f.file_name}
                          </span>
                          <span className="monitor-officers-task-file-meta">
                            {formatFileSize(f.file_size)}
                            {f.uploaded_at && ` · ${formatDate(f.uploaded_at)}`}
                          </span>
                          <button
                            type="button"
                            className="monitor-officers-task-file-download"
                            onClick={() => handleDownloadFile(f.id, f.file_name)}
                            title="Download"
                            aria-label={`Download ${f.file_name}`}
                          >
                            <FaDownload aria-hidden />
                            Download
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
            </dl>
          </div>
          <div className="personnel-dir-modal-footer">
            <button type="button" className="personnel-dir-btn-close" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function filterTasksBySearch(list, query) {
  if (!query || !query.trim()) return list;
  const q = query.trim().toLowerCase();
  return list.filter((ut) => {
    const t = ut?.task || ut;
    const title = (t?.title || "").toLowerCase();
    const kra = (t?.kra || "").toLowerCase();
    const mfo = (t?.mfo || "").toLowerCase();
    const desc = (t?.description || "").toLowerCase();
    return title.includes(q) || kra.includes(q) || mfo.includes(q) || desc.includes(q);
  });
}

function OfficerCard({ officer, expanded, onToggle, formatDate, getInitials, buildAvatarUrl, onViewTask }) {
  const pending = officer.pending || [];
  const missing = officer.missing || [];
  const completed = officer.completed || [];
  const LIST_PREVIEW_LIMIT = 5;
  const [showAllPending, setShowAllPending] = useState(false);
  const [showAllMissing, setShowAllMissing] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [sectionPendingOpen, setSectionPendingOpen] = useState(true);
  const [sectionOverdueOpen, setSectionOverdueOpen] = useState(true);
  const [sectionCompletedOpen, setSectionCompletedOpen] = useState(true);
  const [taskSearchQuery, setTaskSearchQuery] = useState("");

  const hasTasks = pending.length + missing.length + completed.length > 0;
  const avatarSrc = buildAvatarUrl(officer.profile_avatar_url || officer.avatar_url);

  const pendingFiltered = filterTasksBySearch(pending, taskSearchQuery);
  const missingFiltered = filterTasksBySearch(missing, taskSearchQuery);
  const completedFiltered = filterTasksBySearch(completed, taskSearchQuery);

  const pendingItems = showAllPending ? pendingFiltered : pendingFiltered.slice(0, LIST_PREVIEW_LIMIT);
  const missingItems = showAllMissing ? missingFiltered : missingFiltered.slice(0, LIST_PREVIEW_LIMIT);
  const completedItems = showAllCompleted ? completedFiltered : completedFiltered.slice(0, LIST_PREVIEW_LIMIT);

  const hasSearch = !!taskSearchQuery.trim();
  const anyFilteredResults = pendingFiltered.length + missingFiltered.length + completedFiltered.length > 0;

  return (
    <div className="monitor-officers-officer-card">
      <div className="monitor-officers-officer-header">
        <div className="monitor-officers-officer-avatar-wrap">
          {avatarSrc ? (
            <img src={avatarSrc} alt={officer.name} className="monitor-officers-officer-avatar" />
          ) : (
            <div className="monitor-officers-officer-initials">{getInitials(officer.name)}</div>
          )}
        </div>
        <div className="monitor-officers-officer-info">
          <div className="monitor-officers-officer-name">{officer.name}</div>
          {officer.email && (
            <div className="monitor-officers-officer-email">{officer.email}</div>
          )}
          {officer.school_name && (
            <div className="monitor-officers-officer-meta">{officer.school_name}</div>
          )}
          {officer.position && (
            <div className="monitor-officers-officer-meta">{officer.position}</div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="monitor-officers-expand-btn"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`monitor-officers-expand-${officer.id}`}
      >
        <span className="monitor-officers-expand-label">
          <FaChevronRight className="monitor-officers-expand-chevron-left" aria-hidden />
          {expanded ? "Hide" : "View"} task progress
        </span>
        <span className="monitor-officers-expand-right">
          <span className="monitor-officers-icon-count monitor-officers-count-pending">
            <FaClock aria-hidden />
            <span>{officer.pending_count || 0}</span>
          </span>
          <span className="monitor-officers-icon-count monitor-officers-count-missing">
            <FaExclamationTriangle aria-hidden />
            <span>{officer.missing_count || 0}</span>
          </span>
          <span className="monitor-officers-icon-count monitor-officers-count-completed">
            <FaCheckCircle aria-hidden />
            <span>{officer.completed_count || 0}</span>
          </span>
          <FaChevronDown
            className={`monitor-officers-expand-icon${expanded ? "" : " collapsed"}`}
            aria-hidden
          />
        </span>
      </button>
      <div
        id={`monitor-officers-expand-${officer.id}`}
        className={`monitor-officers-expand-body${expanded ? "" : " collapsed"}`}
        aria-hidden={!expanded}
      >
        <div className="monitor-officers-expand-body-inner">
        <div className="monitor-officers-task-list">
          {!hasTasks ? (
            <p className="monitor-officers-no-tasks">No tasks assigned.</p>
          ) : (
            <>
              <div className="monitor-officers-task-search-wrap">
                <label htmlFor={`monitor-officers-task-search-${officer.id}`} className="visually-hidden">
                  Search tasks
                </label>
                <span className="monitor-officers-task-search-icon" aria-hidden>
                  <FaSearch />
                </span>
                <input
                  id={`monitor-officers-task-search-${officer.id}`}
                  type="text"
                  role="searchbox"
                  className="monitor-officers-task-search-input"
                  placeholder="Search tasks by title, KRA, MFO…"
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  aria-label="Search tasks"
                />
                {taskSearchQuery && (
                  <button
                    type="button"
                    className="monitor-officers-task-search-clear"
                    onClick={() => setTaskSearchQuery("")}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              {hasSearch && !anyFilteredResults ? (
                <p className="monitor-officers-no-tasks">No tasks match your search.</p>
              ) : (
                <>
                  {pendingFiltered.length > 0 && (
                    <div className="monitor-officers-task-section monitor-officers-task-section-pending">
                      <button
                        type="button"
                        className="monitor-officers-task-section-header"
                        onClick={() => setSectionPendingOpen((v) => !v)}
                        aria-expanded={sectionPendingOpen}
                        aria-controls={`monitor-officers-pending-${officer.id}`}
                      >
                        <FaClock aria-hidden />
                        <span>Pending ({pendingFiltered.length})</span>
                        <FaChevronDown className={`monitor-officers-task-section-chevron${sectionPendingOpen ? " open" : ""}`} aria-hidden />
                      </button>
                      <div
                        id={`monitor-officers-pending-${officer.id}`}
                        className={`monitor-officers-task-section-body${sectionPendingOpen ? "" : " collapsed"}`}
                        aria-hidden={!sectionPendingOpen}
                      >
                        <div className="monitor-officers-task-section-body-inner">
                          {pendingItems.map((ut, idx) => (
                            <TaskItem key={ut.id} userTask={ut} officerName={officer.name} officerId={officer.id} formatDate={formatDate} displayPriority={displayPriority} isOverdue={false} isCompleted={false} onView={onViewTask} isLast={idx === pendingItems.length - 1} />
                          ))}
                          {pendingFiltered.length > LIST_PREVIEW_LIMIT && (
                            <button type="button" className="monitor-officers-show-more" onClick={() => setShowAllPending((v) => !v)}>
                              {showAllPending ? "Show less" : `Show all (${pendingFiltered.length})`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {missingFiltered.length > 0 && (
                    <div className="monitor-officers-task-section monitor-officers-task-section-overdue">
                      <button
                        type="button"
                        className="monitor-officers-task-section-header"
                        onClick={() => setSectionOverdueOpen((v) => !v)}
                        aria-expanded={sectionOverdueOpen}
                        aria-controls={`monitor-officers-overdue-${officer.id}`}
                      >
                        <FaExclamationTriangle aria-hidden />
                        <span>Overdue ({missingFiltered.length})</span>
                        <FaChevronDown className={`monitor-officers-task-section-chevron${sectionOverdueOpen ? " open" : ""}`} aria-hidden />
                      </button>
                      <div
                        id={`monitor-officers-overdue-${officer.id}`}
                        className={`monitor-officers-task-section-body${sectionOverdueOpen ? "" : " collapsed"}`}
                        aria-hidden={!sectionOverdueOpen}
                      >
                        <div className="monitor-officers-task-section-body-inner">
                          {missingItems.map((ut, idx) => (
                            <TaskItem key={ut.id} userTask={ut} officerName={officer.name} officerId={officer.id} formatDate={formatDate} displayPriority={displayPriority} isOverdue isCompleted={false} onView={onViewTask} isLast={idx === missingItems.length - 1} />
                          ))}
                          {missingFiltered.length > LIST_PREVIEW_LIMIT && (
                            <button type="button" className="monitor-officers-show-more" onClick={() => setShowAllMissing((v) => !v)}>
                              {showAllMissing ? "Show less" : `Show all (${missingFiltered.length})`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {completedFiltered.length > 0 && (
                    <div className="monitor-officers-task-section monitor-officers-task-section-completed">
                      <button
                        type="button"
                        className="monitor-officers-task-section-header"
                        onClick={() => setSectionCompletedOpen((v) => !v)}
                        aria-expanded={sectionCompletedOpen}
                        aria-controls={`monitor-officers-completed-${officer.id}`}
                      >
                        <FaCheckCircle aria-hidden />
                        <span>Completed ({completedFiltered.length})</span>
                        <FaChevronDown className={`monitor-officers-task-section-chevron${sectionCompletedOpen ? " open" : ""}`} aria-hidden />
                      </button>
                      <div
                        id={`monitor-officers-completed-${officer.id}`}
                        className={`monitor-officers-task-section-body${sectionCompletedOpen ? "" : " collapsed"}`}
                        aria-hidden={!sectionCompletedOpen}
                      >
                        <div className="monitor-officers-task-section-body-inner">
                          {completedItems.map((ut, idx) => (
                            <TaskItem key={ut.id} userTask={ut} officerName={officer.name} officerId={officer.id} formatDate={formatDate} displayPriority={displayPriority} isOverdue={false} isCompleted onView={onViewTask} isLast={idx === completedItems.length - 1} />
                          ))}
                          {completedFiltered.length > LIST_PREVIEW_LIMIT && (
                            <button type="button" className="monitor-officers-show-more" onClick={() => setShowAllCompleted((v) => !v)}>
                              {showAllCompleted ? "Show less" : `Show all (${completedFiltered.length})`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

function TaskItem({ userTask, officerName, officerId, formatDate, displayPriority, isOverdue, isCompleted, onView, isLast }) {
  const task = userTask?.task || userTask;
  const dueDate = userTask?.due_date || task?.due_date;

  const handleView = () => {
    if (userTask && onView) onView(userTask, officerName, officerId, isOverdue, isCompleted);
  };

  return (
    <div className={`my-tasks-schedule-item ${isOverdue ? "overdue" : ""} ${isCompleted ? "completed" : ""}`}>
      {!isLast && <div className="my-tasks-schedule-item-line" aria-hidden />}
      <div className="my-tasks-schedule-item-dot" aria-hidden />
      <div
        className="my-tasks-schedule-item-content"
        role="button"
        tabIndex={0}
        onClick={handleView}
        onKeyDown={(e) => e.key === "Enter" && handleView()}
        aria-label={`View ${task?.title ?? "Task"}`}
      >
        <div className="my-tasks-schedule-item-header">
          <span className="my-tasks-schedule-item-date">{formatDate(dueDate)}</span>
          <span className={`my-tasks-schedule-item-badge status-${isCompleted ? "completed" : isOverdue ? "overdue" : "pending"}`}>
            {isCompleted ? "Completed" : isOverdue ? "Overdue" : "Pending"}
          </span>
        </div>
        <h6 className="my-tasks-schedule-item-title">{task?.title ?? "Task"}</h6>
        <div className="my-tasks-schedule-item-meta">
          {task?.kra && <span className="my-tasks-schedule-item-kra">{task.kra}</span>}
          <span className="my-tasks-schedule-item-priority">{displayPriority?.(task?.priority) ?? "Medium"}</span>
        </div>
        {isOverdue && (
          <span className="my-tasks-schedule-item-badge overdue">Overdue</span>
        )}
        <div className="my-tasks-schedule-item-actions">
          <button
            type="button"
            className="my-tasks-schedule-item-btn view"
            onClick={(e) => {
              e.stopPropagation();
              handleView();
            }}
            title="View details"
            aria-label="View details"
          >
            <FaEye aria-hidden />
            <span className="my-tasks-schedule-btn-text">View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
