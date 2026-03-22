import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Portal from "../../components/Portal.jsx";
import {
  FaClipboard,
  FaSync,
  FaSpinner,
  FaSearch,
  FaEye,
  FaUndo,
} from "react-icons/fa";
import { api } from "../../services/api.js";
import { showToast } from "../../services/notificationService.js";
import "./ActivityLogs.css";

const PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const dateStr = d.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timeStr = d.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return iso;
  }
}

function humanizeAction(action) {
  if (!action) return "—";
  return String(action)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function actionTone(action) {
  const a = (action || "").toLowerCase();
  if (a.includes("rejected") || a.includes("reject") || a.includes("failed")) return "danger";
  if (a.includes("approved") || a.includes("approve") || a.includes("completed") || a.includes("activated") || a.includes("login")) return "success";
  if (a.includes("deactivated") || a.includes("deleted")) return "muted";
  if (a.includes("backup")) return "accent";
  return "primary";
}

export default function ActivityLogs() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allLogs, setAllLogs] = useState([]);
  const [availableActions, setAvailableActions] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [perPage, setPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const hasLoadedRef = useRef(false);
  const [detailsLog, setDetailsLog] = useState(null);
  const [detailsModalClosing, setDetailsModalClosing] = useState(false);
  const detailsOverlayRef = useRef(null);

  const fetchLogs = useCallback(async () => {
    const res = await api.get("/admin/activity-logs?all=1");
    setAllLogs(Array.isArray(res?.logs) ? res.logs : []);
    setAvailableActions(Array.isArray(res?.actions) ? res.actions : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isInitial = !hasLoadedRef.current;
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    fetchLogs()
      .catch((err) => {
        if (cancelled) return;
        showToast.error(err?.message || "Failed to load activity logs.");
        setAllLogs([]);
        if (isInitial) setAvailableActions([]);
      })
      .finally(() => {
        if (cancelled) return;
        hasLoadedRef.current = true;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, fetchLogs]);

  const filteredLogs = useMemo(() => {
    let base = allLogs;
    if (actionFilter) {
      base = base.filter((log) => (log?.action || "") === actionFilter);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      base = base.filter((log) => {
        const d = log?.created_at ? new Date(log.created_at) : null;
        return d && d >= from;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      base = base.filter((log) => {
        const d = log?.created_at ? new Date(log.created_at) : null;
        return d && d <= to;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter((log) => {
        const desc = (log?.description || "").toLowerCase();
        const action = (log?.action || "").toLowerCase();
        const name = (log?.actor?.name || "").toLowerCase();
        const email = (log?.actor?.email || "").toLowerCase();
        return desc.includes(q) || action.includes(q) || name.includes(q) || email.includes(q);
      });
    }
    return base;
  }, [allLogs, actionFilter, dateFrom, dateTo, searchQuery]);

  const totalPages = useMemo(
    () => Math.ceil(filteredLogs.length / perPage) || 1,
    [filteredLogs.length, perPage]
  );

  const displayedLogs = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredLogs.slice(start, start + perPage);
  }, [filteredLogs, currentPage, perPage]);

  useEffect(() => {
    setCurrentPage((p) => Math.max(1, Math.min(p, totalPages)));
  }, [totalPages, searchQuery, actionFilter, dateFrom, dateTo, perPage]);

  const goToPage = (page) => {
    const p = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(p);
  };

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const hasActiveFilters = !!(searchQuery.trim() || actionFilter || dateFrom || dateTo);

  const actionOptions = useMemo(() => {
    const base = Array.isArray(availableActions) ? availableActions : [];
    return base.filter(Boolean).map(String);
  }, [availableActions]);

  const totalItems = filteredLogs.length;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  const closeDetails = useCallback(() => {
    setDetailsModalClosing(true);
    setTimeout(() => {
      setDetailsModalClosing(false);
      setDetailsLog(null);
    }, 200);
  }, []);

  useEffect(() => {
    if (!detailsLog) return;
    const t = setTimeout(() => detailsOverlayRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [detailsLog]);

  return (
    <div className="container-fluid px-3 px-md-4">
      <div className="activity-logs-page">
        <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
          <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
            <span className="account-approvals-page-icon">
              <FaClipboard aria-hidden />
            </span>
            Activity logs
          </h1>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
            onClick={handleRefresh}
            disabled={loading}
          >
            {refreshing ? <FaSpinner className="spinner" aria-hidden /> : <FaSync aria-hidden />}
            Refresh
          </button>
        </div>

        <div className="card border-0 shadow-sm account-approvals-card activity-logs-card">
          <div className="card-header bg-white border-bottom account-approvals-card-header">
            <h6 className="mb-0 fw-semibold account-approvals-card-title">
              All activity
            </h6>
            <p className="small text-muted mb-0 mt-1">
              Review system activity for auditing. Filter by action, date range, or search by description and user.
            </p>
          </div>
          {!loading && allLogs.length > 0 && (
            <div className="account-approvals-filter-panel">
              <div className="account-approvals-filter-row">
                <label htmlFor="activity-logs-search" className="account-approvals-search-label">
                  Search
                </label>
                <div className="account-approvals-search-wrap">
                  <span className="account-approvals-search-icon-wrap" aria-hidden>
                    <FaSearch className="account-approvals-search-icon" />
                  </span>
                  <span className="account-approvals-search-input-wrap">
                    <input
                      id="activity-logs-search"
                      type="search"
                      className="account-approvals-search-input"
                      placeholder="Search by description or user"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search activity logs"
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
                  <label htmlFor="activity-logs-action" className="account-approvals-search-label mb-0">
                    Action
                  </label>
                  <select
                    id="activity-logs-action"
                    className="form-select form-select-sm account-approvals-per-page-select"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    aria-label="Filter by action"
                    disabled={loading}
                  >
                    <option value="">All actions</option>
                    {actionOptions.map((a) => (
                      <option key={a} value={a}>
                        {humanizeAction(a)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <label htmlFor="activity-logs-date-from" className="account-approvals-search-label mb-0">
                    From
                  </label>
                  <input
                    id="activity-logs-date-from"
                    type="date"
                    className="form-control form-control-sm"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    aria-label="Filter from date"
                  />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <label htmlFor="activity-logs-date-to" className="account-approvals-search-label mb-0">
                    To
                  </label>
                  <input
                    id="activity-logs-date-to"
                    type="date"
                    className="form-control form-control-sm"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    aria-label="Filter to date"
                  />
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setSearchQuery("");
                      setActionFilter("");
                      setDateFrom("");
                      setDateTo("");
                    }}
                  >
                    Clear filters
                  </button>
                )}
                {searchQuery && (
                  <span className="account-approvals-results-text">
                    {filteredLogs.length} result{filteredLogs.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="card-body p-0">
            {loading ? (
              <div className="activity-logs-loading">
                <FaSpinner className="spinner" aria-hidden />
                Loading activity logs…
              </div>
            ) : allLogs.length === 0 ? (
              <div className="text-center py-5 px-3">
                <p className="text-muted mb-0">No activity logs found</p>
                <p className="small text-muted mt-1">
                  No logs are available yet. Activity will appear as users sign in and actions are performed in the system.
                </p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="account-approvals-empty-state">
                <div className="account-approvals-empty-state-icon">
                  <FaSearch aria-hidden />
                </div>
                <h3 className="account-approvals-empty-state-title">No matches found</h3>
                <p className="account-approvals-empty-state-text">
                  No logs match your current filters. Try clearing filters or adjusting the date range.
                </p>
                <button
                  type="button"
                  className="btn account-approvals-empty-state-btn"
                  onClick={() => {
                    setSearchQuery("");
                    setActionFilter("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  aria-label="Reset filters to show all logs"
                >
                  <FaUndo className="sb-empty-state-btn-icon" aria-hidden />
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="activity-logs-table-container">
                  <div className="activity-logs-table-wrap account-approvals-table-wrap table-responsive">
                    <table className="table activity-logs-table account-approvals-table mb-0">
                      <thead className="table-light">
                        <tr>
                          <th scope="col" className="account-approvals-col-num text-center">#</th>
                          <th scope="col" className="account-approvals-col-actions activity-logs-col-actions">Details</th>
                          <th scope="col">Date & time</th>
                          <th scope="col">Actor</th>
                          <th scope="col">Action</th>
                          <th scope="col">Description</th>
                          <th scope="col">IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedLogs.map((log, idx) => {
                          const actorName = log?.actor?.name || (log?.actor ? "User" : "System");
                          const actorEmail = log?.actor?.email || "";
                          const action = log?.action || "";
                          const tone = actionTone(action);
                          return (
                            <tr key={log.id}>
                              <td className="account-approvals-col-num text-center text-muted fw-medium">{startItem + idx}</td>
                              <td className="account-approvals-col-actions">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary account-approvals-btn-icon activity-logs-btn-details"
                                  onClick={() => setDetailsLog(log)}
                                  aria-label="View log details"
                                  title="View details"
                                >
                                  <FaEye aria-hidden />
                                </button>
                              </td>
                              <td>{formatDateTime(log?.created_at)}</td>
                              <td className="activity-logs-actor">
                                <div className="activity-logs-actor-name">{actorName}</div>
                                {actorEmail && (
                                  <div className="activity-logs-actor-email">{actorEmail}</div>
                                )}
                              </td>
                              <td>
                                <span className={`activity-logs-action-badge activity-logs-action-${tone}`}>
                                  {humanizeAction(action)}
                                </span>
                              </td>
                              <td className="activity-logs-desc">{log?.description || "—"}</td>
                              <td>{log?.ip_address || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-3 border-top account-approvals-pagination">
                  <div className="d-flex flex-wrap align-items-center gap-3 account-approvals-pagination-left">
                    <span className="small text-muted">
                      Showing {startItem}–{endItem} of {totalItems}
                    </span>
                    <div className="d-flex align-items-center gap-2 account-approvals-per-page">
                      <label htmlFor="activity-logs-per-page-select" className="small text-muted mb-0">
                        Per page
                      </label>
                      <select
                        id="activity-logs-per-page-select"
                        className="form-select form-select-sm account-approvals-per-page-select"
                        value={perPage}
                        onChange={(e) => {
                          setPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        aria-label="Items per page"
                      >
                        {PER_PAGE_OPTIONS.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <nav aria-label="Activity logs pagination" className="account-approvals-pagination-nav">
                    <ul className="pagination pagination-sm mb-0 flex-wrap justify-content-center">
                      <li className="page-item">
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => goToPage(currentPage - 1)}
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
                            onClick={() => goToPage(page)}
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
                          onClick={() => goToPage(currentPage + 1)}
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
      </div>

      {detailsLog && (
        <Portal>
          <div
            ref={detailsOverlayRef}
            className={`personnel-dir-overlay${detailsModalClosing ? " exit" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-log-detail-title"
            tabIndex={-1}
            onKeyDown={(e) => e.key === "Escape" && closeDetails()}
          >
            <div
              className={`personnel-dir-backdrop modal-backdrop-animation${detailsModalClosing ? " exit" : ""}`}
              onClick={closeDetails}
              aria-hidden
            />
            <div className={`personnel-dir-wrap modal-content-animation${detailsModalClosing ? " exit" : ""}`}>
              <div className="personnel-dir-modal">
                <div className="personnel-dir-modal-header">
                  <div className="personnel-dir-modal-header-text">
                    <h5 id="activity-log-detail-title" className="personnel-dir-modal-title">
                      Activity log details
                    </h5>
                    <div className="personnel-dir-modal-subtitle">
                      {formatDateTime(detailsLog?.created_at)} · {detailsLog?.ip_address || "IP —"}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="personnel-dir-modal-close"
                    onClick={closeDetails}
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>
                <div className="personnel-dir-modal-body">
                  <dl className="personnel-dir-details-grid">
                    <div className="personnel-dir-details-row">
                      <dt>Actor</dt>
                      <dd>
                        {detailsLog?.actor?.name || "System"}
                        {detailsLog?.actor?.email ? ` · ${detailsLog.actor.email}` : ""}
                      </dd>
                    </div>
                    <div className="personnel-dir-details-row">
                      <dt>Action</dt>
                      <dd>{humanizeAction(detailsLog?.action || "—")}</dd>
                    </div>
                    <div className="personnel-dir-details-row">
                      <dt>Description</dt>
                      <dd>{detailsLog?.description || "—"}</dd>
                    </div>
                  </dl>
                </div>
                <div className="personnel-dir-modal-footer">
                  <button
                    type="button"
                    className="personnel-dir-btn-close"
                    onClick={closeDetails}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
