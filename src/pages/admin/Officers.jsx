import React, { useState, useEffect, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import { api } from "../../services/api.js";
import { showAlert, showToast } from "../../services/notificationService.js";
import { FaClipboardList, FaSearch, FaEye, FaUserCheck, FaUserTimes, FaUsers, FaCheckCircle, FaPauseCircle, FaTimesCircle, FaTrash, FaExclamationTriangle, FaUndo } from "react-icons/fa";
import Portal from "../../components/Portal.jsx";

const normalizeAvatarUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const baseUrl = api.baseUrl.replace(/\/$/, "");
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/** Display status for Personnel directory: Active, Deactivated, or Rejected */
const getDisplayStatus = (o) => {
  if (o.status === "rejected") return "Rejected";
  if (o.status === "approved") return o.is_active ? "Active" : "Deactivated";
  return o.status || "—";
};

/**
 * Format stat numbers for large data: thousands separators, compact K/M for very large.
 * Keeps cards readable and layout-safe at scale.
 */
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

const Officers = () => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailOfficer, setDetailOfficer] = useState(null);
  const [detailModalClosing, setDetailModalClosing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [reapproveOfficer, setReapproveOfficer] = useState(null);
  const [reapproveRemarks, setReapproveRemarks] = useState("");
  const [reapproveModalClosing, setReapproveModalClosing] = useState(false);
  const [deactivateOfficer, setDeactivateOfficer] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivateModalClosing, setDeactivateModalClosing] = useState(false);
  const [activateOfficer, setActivateOfficer] = useState(null);
  const [activateRemarks, setActivateRemarks] = useState("");
  const [activateModalClosing, setActivateModalClosing] = useState(false);
  const [deleteOfficer, setDeleteOfficer] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteModalClosing, setDeleteModalClosing] = useState(false);
  const [fullAmountModal, setFullAmountModal] = useState(null);
  const [fullAmountModalClosing, setFullAmountModalClosing] = useState(false);

  const fetchOfficers = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.get("/admin/officers");
      const list = data.officers || [];
      setOfficers(list);
      if (!silent) setCurrentPage(1);
      return list;
    } catch (err) {
      if (!silent) {
        showAlert.error(
          "Error",
          err.data?.message || err.message || "Failed to load officers."
        );
        setOfficers([]);
      }
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  /* Polling: refetch officers every 10s so admin sees personnel profile updates (avatar, name, etc.) without refresh */
  useEffect(() => {
    const POLL_INTERVAL = 10000;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchOfficers({ silent: true });
      }
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchOfficers]);

  /* Sync detailOfficer with fresh data when officers list is updated (e.g. from polling) */
  useEffect(() => {
    if (!detailOfficer || officers.length === 0) return;
    const fresh = officers.find((o) => o.id === detailOfficer.id);
    if (fresh) setDetailOfficer(fresh);
  }, [officers, detailOfficer?.id]);

  const stats = useMemo(() => {
    const nonPending = officers.filter((o) => o.status !== "pending");
    const active = nonPending.filter((o) => o.status === "approved" && o.is_active).length;
    const deactivated = nonPending.filter((o) => o.status === "approved" && !o.is_active).length;
    const rejected = officers.filter((o) => o.status === "rejected").length;
    return {
      total: nonPending.length,
      active,
      deactivated,
      rejected,
    };
  }, [officers]);

  const filteredOfficers = useMemo(() => {
    let base = officers.filter((o) => o.status !== "pending");
    if (statusFilter === "Active") {
      base = base.filter((o) => o.status === "approved" && o.is_active);
    } else if (statusFilter === "Deactivated") {
      base = base.filter((o) => o.status === "approved" && !o.is_active);
    } else if (statusFilter === "Rejected") {
      base = base.filter((o) => o.status === "rejected");
    }
    if (!searchQuery.trim()) return base;
    const q = searchQuery.trim().toLowerCase();
    return base.filter((o) =>
      (o.name && o.name.toLowerCase().includes(q)) ||
      (o.email && o.email.toLowerCase().includes(q)) ||
      (o.employee_id && String(o.employee_id).toLowerCase().includes(q)) ||
      (o.position && o.position.toLowerCase().includes(q)) ||
      (o.division && o.division.toLowerCase().includes(q)) ||
      (o.school_name && o.school_name.toLowerCase().includes(q))
    );
  }, [officers, searchQuery, statusFilter]);

  const totalPages = useMemo(
    () => Math.ceil(filteredOfficers.length / pageSize) || 1,
    [filteredOfficers.length, pageSize]
  );

  const displayedOfficers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOfficers.slice(start, start + pageSize);
  }, [filteredOfficers, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage((p) => Math.max(1, Math.min(p, totalPages)));
  }, [totalPages, searchQuery, pageSize]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      const dateStr_formatted = d.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const timeStr = d.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${dateStr_formatted}, ${timeStr}`;
    } catch {
      return dateStr || "—";
    }
  };

  const closeDetailModal = () => {
    setDetailModalClosing(true);
    setTimeout(() => {
      setDetailOfficer(null);
      setDetailModalClosing(false);
    }, 200);
  };

  const statusBadgeClass = (displayStatus) => {
    switch (displayStatus) {
      case "Active":
        return "officers-status-badge officers-status-approved";
      case "Deactivated":
        return "officers-status-badge officers-status-deactivated";
      case "Rejected":
        return "officers-status-badge officers-status-rejected";
      case "approved":
        return "officers-status-badge officers-status-approved";
      case "rejected":
        return "officers-status-badge officers-status-rejected";
      case "pending":
      default:
        return "officers-status-badge officers-status-pending";
    }
  };

  const openReapproveModal = (officer) => {
    setReapproveOfficer(officer);
    setReapproveRemarks("");
    setReapproveModalClosing(false);
  };

  const closeReapproveModal = () => {
    if (!reapproveOfficer || actionLoading !== null) return;
    setReapproveModalClosing(true);
    setTimeout(() => {
      setReapproveOfficer(null);
      setReapproveRemarks("");
      setReapproveModalClosing(false);
    }, 200);
  };

  const confirmReapprove = async () => {
    if (!reapproveOfficer || actionLoading !== null) return;

    const result = await Swal.fire({
      title: "Approve personnel account?",
      text: `This will allow ${reapproveOfficer.name} to sign in and use the system.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, approve",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#0f1f33",
      cancelButtonColor: "#6c757d",
      background: "#fff",
      color: "#243047",
    });

    if (!result.isConfirmed) {
      return;
    }

    setActionLoading(reapproveOfficer.id);
    try {
      await api.post(`/admin/users/${reapproveOfficer.id}/approve`, {
        remarks: reapproveRemarks || "",
      });
      showToast.success(`${reapproveOfficer.name} has been approved.`);
      setReapproveOfficer(null);
      setReapproveRemarks("");
      await fetchOfficers();
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to approve personnel."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openDeactivateModal = (officer) => {
    setDeactivateOfficer(officer);
    setDeactivateReason("");
    setDeactivateModalClosing(false);
  };

  const closeDeactivateModal = () => {
    if (!deactivateOfficer || actionLoading !== null) return;
    setDeactivateModalClosing(true);
    setTimeout(() => {
      setDeactivateOfficer(null);
      setDeactivateReason("");
      setDeactivateModalClosing(false);
    }, 200);
  };

  const confirmDeactivate = async () => {
    if (!deactivateOfficer || actionLoading !== null) return;

    const result = await Swal.fire({
      title: "Deactivate personnel account?",
      text: `This will prevent ${deactivateOfficer.name} from signing in until the account is activated again.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, deactivate",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#b91c1c",
      cancelButtonColor: "#6c757d",
      background: "#fff",
      color: "#243047",
    });

    if (!result.isConfirmed) {
      return;
    }

    setActionLoading(deactivateOfficer.id);
    try {
      await api.post(`/admin/users/${deactivateOfficer.id}/deactivate`, {
        reason: deactivateReason || "",
      });
      showToast.success("Personnel account deactivated.");
      setDeactivateOfficer(null);
      setDeactivateReason("");
      await fetchOfficers();
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to deactivate personnel."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openActivateModal = (officer) => {
    setActivateOfficer(officer);
    setActivateRemarks("");
    setActivateModalClosing(false);
  };

  const closeActivateModal = () => {
    if (!activateOfficer || actionLoading !== null) return;
    setActivateModalClosing(true);
    setTimeout(() => {
      setActivateOfficer(null);
      setActivateRemarks("");
      setActivateModalClosing(false);
    }, 200);
  };

  const confirmActivate = async () => {
    if (!activateOfficer || actionLoading !== null) return;

    setActionLoading(activateOfficer.id);
    try {
      await api.post(`/admin/users/${activateOfficer.id}/activate`, {
        remarks: activateRemarks || "",
      });
      showToast.success("Personnel account activated.");
      setActivateOfficer(null);
      setActivateRemarks("");
      await fetchOfficers();
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to activate personnel."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openDeleteModal = (officer) => {
    setDeleteOfficer(officer);
    setDeleteConfirmText("");
    setDeleteModalClosing(false);
  };

  const closeDeleteModal = () => {
    if (!deleteOfficer || actionLoading !== null) return;
    setDeleteModalClosing(true);
    setTimeout(() => {
      setDeleteOfficer(null);
      setDeleteConfirmText("");
      setDeleteModalClosing(false);
    }, 200);
  };

  const confirmDelete = async () => {
    if (!deleteOfficer || actionLoading !== null || deleteConfirmText !== "DELETE") return;

    setActionLoading(deleteOfficer.id);
    try {
      await api.delete(`/admin/users/${deleteOfficer.id}`);
      showToast.success("Personnel removed from directory.");
      setDeleteOfficer(null);
      setDeleteConfirmText("");
      await fetchOfficers();
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to remove personnel."
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4">
      {/* Page header – match Account approvals style */}
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
          <span className="account-approvals-page-icon">
            <FaClipboardList aria-hidden />
          </span>
          Personnel directory
        </h1>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
          onClick={fetchOfficers}
          disabled={loading}
        >
          <span className={loading ? "spinner-border spinner-border-sm" : ""} aria-hidden />
          {!loading && <span>Refresh</span>}
        </button>
      </div>

      {/* Summary stats panel – corporate / government style (4 cards; pending has its own tab) */}
      <div className="personnel-stats-panel mb-4">
        <div className="row g-3">
          <div className="col-6 col-md-3 col-lg">
            <div className="personnel-stats-card personnel-stats-card-total">
              <div className="personnel-stats-card-icon" aria-hidden>
                <FaUsers />
              </div>
              <div className="personnel-stats-card-body">
                <span className="personnel-stats-card-label">Total personnel</span>
                <div className="personnel-stats-card-value-row">
                  <span className="personnel-stats-card-value">
                    {loading ? "—" : formatStatNumber(stats.total)}
                  </span>
                  {!loading && (
                    <button
                      type="button"
                      className="personnel-stats-view-full"
                      onClick={() => setFullAmountModal({ label: "Total personnel", value: stats.total })}
                      aria-label="See exact count for Total personnel"
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
                <span className="personnel-stats-card-label">Active</span>
                <div className="personnel-stats-card-value-row">
                  <span className="personnel-stats-card-value">
                    {loading ? "—" : formatStatNumber(stats.active)}
                  </span>
                  {!loading && (
                    <button
                      type="button"
                      className="personnel-stats-view-full"
                      onClick={() => setFullAmountModal({ label: "Active", value: stats.active })}
                      aria-label="See exact count for Active"
                    >
                      See exact count
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3 col-lg">
            <div className="personnel-stats-card personnel-stats-card-deactivated">
              <div className="personnel-stats-card-icon" aria-hidden>
                <FaPauseCircle />
              </div>
              <div className="personnel-stats-card-body">
                <span className="personnel-stats-card-label">Deactivated</span>
                <div className="personnel-stats-card-value-row">
                  <span className="personnel-stats-card-value">
                    {loading ? "—" : formatStatNumber(stats.deactivated)}
                  </span>
                  {!loading && (
                    <button
                      type="button"
                      className="personnel-stats-view-full"
                      onClick={() => setFullAmountModal({ label: "Deactivated", value: stats.deactivated })}
                      aria-label="See exact count for Deactivated"
                    >
                      See exact count
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3 col-lg">
            <div className="personnel-stats-card personnel-stats-card-rejected">
              <div className="personnel-stats-card-icon" aria-hidden>
                <FaTimesCircle />
              </div>
              <div className="personnel-stats-card-body">
                <span className="personnel-stats-card-label">Rejected</span>
                <div className="personnel-stats-card-value-row">
                  <span className="personnel-stats-card-value">
                    {loading ? "—" : formatStatNumber(stats.rejected)}
                  </span>
                  {!loading && (
                    <button
                      type="button"
                      className="personnel-stats-view-full"
                      onClick={() => setFullAmountModal({ label: "Rejected", value: stats.rejected })}
                      aria-label="See exact count for Rejected"
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

      {/* Full amount modal – Portal */}
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

      <div className="card border-0 shadow-sm account-approvals-card">
        <div className="card-header bg-white border-bottom account-approvals-card-header">
          <h6 className="mb-0 fw-semibold account-approvals-card-title">
            All personnel
          </h6>
          <p className="small text-muted mb-0 mt-1">
            Browse all registered personnel and review their status, affiliation, and registration history.
          </p>
        </div>

        {/* Search / filter panel */}
        {!loading && officers.length > 0 && (
          <div className="account-approvals-filter-panel">
            <div className="account-approvals-filter-row">
              <label htmlFor="officers-search-input" className="account-approvals-search-label">
                Search
              </label>
              <div className="account-approvals-search-wrap">
                <span className="account-approvals-search-icon-wrap" aria-hidden>
                  <FaSearch className="account-approvals-search-icon" />
                </span>
                <span className="account-approvals-search-input-wrap">
                  <input
                    id="officers-search-input"
                    type="search"
                    className="account-approvals-search-input"
                    placeholder="Filter by name, email, division or school"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search personnel"
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
                <label htmlFor="officers-status-filter" className="account-approvals-search-label mb-0">
                  Status
                </label>
                <select
                  id="officers-status-filter"
                  className="form-select form-select-sm account-approvals-per-page-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="all">All</option>
                  <option value="Active">Active</option>
                  <option value="Deactivated">Deactivated</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              {searchQuery && (
                <span className="account-approvals-results-text">
                  {filteredOfficers.length} result{filteredOfficers.length !== 1 ? "s" : ""}
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
              <p className="small text-muted mt-2 mb-0">Loading personnel records...</p>
            </div>
          ) : officers.length === 0 ? (
            <div className="text-center py-5 px-3">
              <p className="text-muted mb-0">No personnel records found.</p>
              <p className="small text-muted mt-1">
                Approved personnel records will appear here after their registration is reviewed.
              </p>
            </div>
          ) : filteredOfficers.length === 0 ? (
            <div className="account-approvals-empty-state">
              <div className="account-approvals-empty-state-icon">
                <FaSearch aria-hidden />
              </div>
              <h3 className="account-approvals-empty-state-title">No matches found</h3>
              <p className="account-approvals-empty-state-text">
                No personnel match your filters. Try different keywords or status, or reset filters to view all records.
              </p>
              <button
                type="button"
                className="btn account-approvals-empty-state-btn"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                aria-label="Reset filters to show all personnel"
              >
                <FaUndo className="sb-empty-state-btn-icon" aria-hidden />
                Reset filters
              </button>
            </div>
          ) : (
            <>
              {/* Card Grid Layout - matching old project structure */}
              <div className="personnel-dir-cards-container">
                <div className="personnel-dir-cards-grid">
                  {displayedOfficers.map((o, index) => {
                    const isActionDisabled = !!deactivateOfficer || !!reapproveOfficer || !!deleteOfficer || !!activateOfficer;
                    return (
                      <div key={o.id} className="personnel-dir-card-col">
                        <div
                          className="personnel-dir-personnel-card"
                          onClick={() => !isActionDisabled && setDetailOfficer(o)}
                          onKeyDown={(e) => {
                            if ((e.key === "Enter" || e.key === " ") && !isActionDisabled) {
                              e.preventDefault();
                              setDetailOfficer(o);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`View details for ${o.name}`}
                        >
                          {/* Top strip: full-width avatar (DATravelApp-style) */}
                          <div className="personnel-dir-card-top-strip">
                            {o.avatar_url || o.profile_avatar_url ? (
                              <img
                                src={normalizeAvatarUrl(o.profile_avatar_url || o.avatar_url)}
                                alt={o.name}
                                className="personnel-dir-card-top-img"
                              />
                            ) : (
                              <div className="personnel-dir-card-top-initials">
                                <span className="personnel-dir-avatar-initials">{getInitials(o.name)}</span>
                              </div>
                            )}
                          </div>

                          {/* Hover actions */}
                          <div className="personnel-dir-card-actions">
                            <button
                              type="button"
                              className="personnel-dir-card-btn personnel-dir-card-btn-view"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailOfficer(o);
                              }}
                              disabled={isActionDisabled}
                              aria-label={`View ${o.name}`}
                              title="View"
                            >
                              <FaEye aria-hidden />
                            </button>
                            {o.status === "rejected" && (
                              <button
                                type="button"
                                className="personnel-dir-card-btn personnel-dir-card-btn-approve"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReapproveModal(o);
                                }}
                                disabled={isActionDisabled}
                                aria-label={`Approve ${o.name}`}
                                title="Approve"
                              >
                                {actionLoading === o.id ? (
                                  <span className="spinner-border spinner-border-sm" aria-hidden />
                                ) : (
                                  <FaUserCheck aria-hidden />
                                )}
                              </button>
                            )}
                            {o.status === "approved" && (
                              o.is_active ? (
                                <button
                                  type="button"
                                  className="personnel-dir-card-btn personnel-dir-card-btn-deactivate"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeactivateModal(o);
                                  }}
                                  disabled={isActionDisabled}
                                  aria-label={`Deactivate ${o.name}`}
                                  title="Deactivate"
                                >
                                  {actionLoading === o.id ? (
                                    <span className="spinner-border spinner-border-sm" aria-hidden />
                                  ) : (
                                    <FaUserTimes aria-hidden />
                                  )}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="personnel-dir-card-btn personnel-dir-card-btn-activate"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openActivateModal(o);
                                  }}
                                  disabled={isActionDisabled}
                                  aria-label={`Activate ${o.name}`}
                                  title="Activate"
                                >
                                  {actionLoading === o.id ? (
                                    <span className="spinner-border spinner-border-sm" aria-hidden />
                                  ) : (
                                    <FaUserCheck aria-hidden />
                                  )}
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              className="personnel-dir-card-btn personnel-dir-card-btn-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(o);
                              }}
                              disabled={isActionDisabled}
                              aria-label={`Delete ${o.name}`}
                              title="Delete"
                            >
                              {actionLoading === o.id ? (
                                <span className="spinner-border spinner-border-sm" aria-hidden />
                              ) : (
                                <FaTrash aria-hidden />
                              )}
                            </button>
                          </div>

                          <div className="personnel-dir-card-body">
                            <div className="personnel-dir-card-name" title={o.name}>
                              {o.name}
                            </div>
                            <div className="personnel-dir-card-email" title={o.email}>
                              {o.email}
                            </div>
                            <div className="personnel-dir-card-divider"></div>
                            <div className="personnel-dir-card-row">
                              <span className="personnel-dir-card-label">Position</span>
                              <span className="personnel-dir-card-value" title={o.position || ""}>
                                {o.position || "—"}
                              </span>
                            </div>
                            <div className="personnel-dir-card-row">
                              <span className="personnel-dir-card-label">Division</span>
                              <span className="personnel-dir-card-value" title={o.division || ""}>
                                {o.division || "—"}
                              </span>
                            </div>
                            <div className="personnel-dir-card-footer">
                              <span className={statusBadgeClass(getDisplayStatus(o))}>
                                {getDisplayStatus(o)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pagination – reuse approvals style */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-3 border-top account-approvals-pagination">
                <div className="d-flex flex-wrap align-items-center gap-3 account-approvals-pagination-left">
                  <span className="small text-muted">
                    Showing {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, filteredOfficers.length)} of {filteredOfficers.length}
                  </span>
                  <div className="d-flex align-items-center gap-2 account-approvals-per-page">
                    <label htmlFor="officers-per-page-select" className="small text-muted mb-0">
                      Per page
                    </label>
                    <select
                      id="officers-per-page-select"
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
                <nav aria-label="Officers pagination" className="account-approvals-pagination-nav">
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

      {/* Officer detail modal – matching old project structure */}
      {detailOfficer && (
        <Portal>
          <div
            className={`personnel-dir-overlay${detailModalClosing ? " exit" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="officer-detail-title"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target === e.currentTarget) {
                closeDetailModal();
              }
            }}
          >
            <div
              className={`personnel-dir-backdrop modal-backdrop-animation${detailModalClosing ? " exit" : ""}`}
              onClick={closeDetailModal}
              aria-hidden
            />
            <div className={`personnel-dir-wrap modal-content-animation${detailModalClosing ? " exit" : ""}`}>
              <div className="personnel-dir-modal">
                <div className="personnel-dir-modal-header">
                  <div className="personnel-dir-modal-header-text">
                    <h5 id="officer-detail-title" className="personnel-dir-modal-title">
                      Personnel details
                    </h5>
                    <div className="personnel-dir-modal-subtitle">
                      {detailOfficer.name}
                      {detailOfficer.email ? ` · ${detailOfficer.email}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="personnel-dir-modal-close"
                    onClick={closeDetailModal}
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>
                <div className="personnel-dir-modal-body">
                  {/* Avatar section */}
                  <div className="personnel-dir-details-avatar-section">
                    {detailOfficer.avatar_url || detailOfficer.profile_avatar_url ? (
                      <div className="personnel-dir-avatar personnel-dir-avatar-lg">
                        <img
                          src={normalizeAvatarUrl(detailOfficer.profile_avatar_url || detailOfficer.avatar_url)}
                          alt={detailOfficer.name}
                        />
                      </div>
                    ) : (
                      <div className="personnel-dir-avatar personnel-dir-avatar-lg">
                        <span className="personnel-dir-avatar-initials">{getInitials(detailOfficer.name)}</span>
                      </div>
                    )}
                  </div>

                  {/* Details grid */}
                  <dl className="personnel-dir-details-grid">
                    <div className="personnel-dir-details-row">
                      <dt>Name</dt>
                      <dd>{detailOfficer.name || "—"}</dd>
                    </div>
                    <div className="personnel-dir-details-row">
                      <dt>Email</dt>
                      <dd>{detailOfficer.email || "—"}</dd>
                    </div>
                    <div className="personnel-dir-details-row">
                      <dt>Status</dt>
                      <dd>
                        <span className={statusBadgeClass(getDisplayStatus(detailOfficer))}>
                          {getDisplayStatus(detailOfficer)}
                        </span>
                      </dd>
                    </div>
                    <div className="personnel-dir-details-row">
                      <dt>Employee ID</dt>
                      <dd>{detailOfficer.employee_id || "—"}</dd>
                    </div>
                    <div className="personnel-dir-details-row">
                      <dt>Position</dt>
                      <dd>{detailOfficer.position || "—"}</dd>
                    </div>
                    <div className="personnel-dir-details-row">
                      <dt>Division</dt>
                      <dd>{detailOfficer.division || "—"}</dd>
                    </div>
                    <div className="personnel-dir-details-row">
                      <dt>School</dt>
                      <dd>{detailOfficer.school_name || "—"}</dd>
                    </div>

                    {/* Status information & remarks block */}
                    {(detailOfficer.status === "approved" || detailOfficer.status === "rejected" || (detailOfficer.status === "approved" && !detailOfficer.is_active)) && (
                      <div className={`personnel-dir-details-remarks-block${detailOfficer.status === "rejected" ? " personnel-dir-details-remarks-rejected" : detailOfficer.status === "approved" && !detailOfficer.is_active ? " personnel-dir-details-remarks-inactive" : ""}`}>
                        <div className="personnel-dir-details-remarks-title">Status information</div>
                        {detailOfficer.status === "approved" && detailOfficer.is_active && (
                          <>
                            {detailOfficer.approved_at && (
                              <div className="personnel-dir-details-remarks-row">
                                <span className="personnel-dir-details-remarks-label">Approved on</span>
                                <span className="personnel-dir-details-remarks-value">{formatDate(detailOfficer.approved_at)}</span>
                              </div>
                            )}
                            <div className="personnel-dir-details-remarks-row personnel-dir-details-remarks-full">
                              <span className="personnel-dir-details-remarks-label">Approval remarks</span>
                              <span className="personnel-dir-details-remarks-value">{detailOfficer.approval_remarks || "No remarks on file."}</span>
                            </div>
                            {detailOfficer.activated_at && (
                              <>
                                <div className="personnel-dir-details-remarks-row">
                                  <span className="personnel-dir-details-remarks-label">Activated on</span>
                                  <span className="personnel-dir-details-remarks-value">{formatDate(detailOfficer.activated_at)}</span>
                                </div>
                                {detailOfficer.activation_remarks && (
                                  <div className="personnel-dir-details-remarks-row personnel-dir-details-remarks-full">
                                    <span className="personnel-dir-details-remarks-label">Activation remarks</span>
                                    <span className="personnel-dir-details-remarks-value">{detailOfficer.activation_remarks}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        )}
                        {detailOfficer.status === "rejected" && (
                          <>
                            {detailOfficer.rejected_at && (
                              <div className="personnel-dir-details-remarks-row">
                                <span className="personnel-dir-details-remarks-label">Rejected on</span>
                                <span className="personnel-dir-details-remarks-value">{formatDate(detailOfficer.rejected_at)}</span>
                              </div>
                            )}
                            <div className="personnel-dir-details-remarks-row personnel-dir-details-remarks-full">
                              <span className="personnel-dir-details-remarks-label">Rejection remarks</span>
                              <span className="personnel-dir-details-remarks-value">{detailOfficer.rejection_reason || "No remarks on file."}</span>
                            </div>
                          </>
                        )}
                        {detailOfficer.status === "approved" && !detailOfficer.is_active && (
                          <>
                            {detailOfficer.deactivated_at && (
                              <div className="personnel-dir-details-remarks-row">
                                <span className="personnel-dir-details-remarks-label">Deactivated on</span>
                                <span className="personnel-dir-details-remarks-value">{formatDate(detailOfficer.deactivated_at)}</span>
                              </div>
                            )}
                            <div className="personnel-dir-details-remarks-row personnel-dir-details-remarks-full">
                              <span className="personnel-dir-details-remarks-label">Deactivation remarks</span>
                              <span className="personnel-dir-details-remarks-value">{detailOfficer.deactivation_reason || "No remarks on file."}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="personnel-dir-details-grid-footer">
                      <div className="personnel-dir-details-row">
                        <dt>Last updated</dt>
                        <dd>{formatDate(detailOfficer.updated_at || detailOfficer.created_at)}</dd>
                      </div>
                    </div>
                  </dl>
                </div>
                <div className="personnel-dir-modal-footer">
                  <button
                    type="button"
                    className="personnel-dir-btn-close"
                    onClick={closeDetailModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Re-approve modal – for rejected personnel */}
      {reapproveOfficer && (
        <Portal>
          <div
            className="account-approvals-detail-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reapprove-officer-title"
          >
            <div
              className={`account-approvals-detail-backdrop modal-backdrop-animation${reapproveModalClosing ? " exit" : ""}`}
              onClick={closeReapproveModal}
              aria-hidden
            />
            <div className={`account-approvals-detail-modal modal-content-animation${reapproveModalClosing ? " exit" : ""}`}>
              <div className="account-approvals-detail-header">
                <div className="account-approvals-detail-header-text">
                  <h5 id="reapprove-officer-title" className="mb-0 fw-semibold">
                    Approve personnel
                  </h5>
                  <div className="account-approvals-detail-subtitle">
                    <span className="account-approvals-detail-name">{reapproveOfficer.name}</span>
                    {reapproveOfficer.email ? (
                      <span className="account-approvals-detail-email">• {reapproveOfficer.email}</span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close-custom"
                  onClick={closeReapproveModal}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="account-approvals-detail-body">
                <p className="account-approvals-action-help">
                  Approving this personnel account will restore access to TasDoneNa. You may record internal remarks for future reference.
                </p>
                <div className="mb-3">
                  <label htmlFor="reapprove-remarks" className="account-approvals-action-label">
                    Approval remarks <span className="text-muted">(optional)</span>
                  </label>
                  <textarea
                    id="reapprove-remarks"
                    className="form-control account-approvals-action-textarea"
                    rows={3}
                    placeholder="Add any internal notes about this approval (optional)."
                    value={reapproveRemarks}
                    onChange={(e) => setReapproveRemarks(e.target.value)}
                    disabled={actionLoading !== null}
                  />
                </div>
              </div>
              <div className="account-approvals-detail-footer">
                <button
                  type="button"
                  className="btn btn-light account-approvals-detail-close-btn"
                  onClick={closeReapproveModal}
                  disabled={actionLoading !== null}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn modal-confirm-btn account-approvals-detail-close-btn"
                  onClick={confirmReapprove}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === reapproveOfficer.id ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden />
                      <span>Approving…</span>
                    </>
                  ) : (
                    "Approve personnel"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete modal – for rejected personnel with no activity */}
      {deleteOfficer && (
        <Portal>
          <div
            className="account-approvals-detail-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-officer-title"
          >
            <div
              className={`account-approvals-detail-backdrop modal-backdrop-animation${deleteModalClosing ? " exit" : ""}`}
              onClick={closeDeleteModal}
              aria-hidden
            />
            <div className={`account-approvals-detail-modal modal-content-animation${deleteModalClosing ? " exit" : ""}`}>
              <div className="account-approvals-detail-header">
                <div className="account-approvals-detail-header-text">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="personnel-delete-warning-icon">
                      <FaExclamationTriangle aria-hidden />
                    </div>
                    <h5 id="delete-officer-title" className="mb-0 fw-semibold">
                      Remove personnel from directory
                    </h5>
                  </div>
                  <div className="account-approvals-detail-subtitle">
                    <span className="account-approvals-detail-name">{deleteOfficer.name}</span>
                    {deleteOfficer.email ? (
                      <span className="account-approvals-detail-email">• {deleteOfficer.email}</span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close-custom"
                  onClick={closeDeleteModal}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="account-approvals-detail-body">
                {/* Warning alert box */}
                <div className="personnel-delete-warning-box">
                  <div className="personnel-delete-warning-header">
                    <FaExclamationTriangle className="personnel-delete-warning-box-icon" aria-hidden />
                    <span className="personnel-delete-warning-title">Permanent Deletion Warning</span>
                  </div>
                  <div className="personnel-delete-warning-content">
                    <p className="personnel-delete-warning-text mb-2">
                      <strong>This action will permanently delete all records associated with this personnel from the system.</strong>
                    </p>
                    <ul className="personnel-delete-warning-list">
                      <li>All personnel profile information</li>
                      <li>All assigned tasks and task history</li>
                      <li>All system activity records</li>
                      <li>All associated data and relationships</li>
                    </ul>
                    <p className="personnel-delete-warning-note mb-0">
                      <strong>This action cannot be undone.</strong>
                    </p>
                  </div>
                </div>

                <div className="mb-3 mt-4">
                  <label htmlFor="delete-confirm-input" className="account-approvals-action-label">
                    Type <strong className="text-danger">DELETE</strong> to confirm removal
                  </label>
                  <input
                    id="delete-confirm-input"
                    type="text"
                    className={`form-control ${deleteConfirmText && deleteConfirmText !== "DELETE" ? "is-invalid" : ""}`}
                    placeholder="Type DELETE to confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    disabled={actionLoading !== null}
                    autoComplete="off"
                  />
                  {deleteConfirmText && deleteConfirmText !== "DELETE" && (
                    <div className="invalid-feedback d-block">
                      Please type exactly "DELETE" to confirm this action.
                    </div>
                  )}
                </div>
              </div>
              <div className="account-approvals-detail-footer">
                <button
                  type="button"
                  className="btn btn-light account-approvals-detail-close-btn"
                  onClick={closeDeleteModal}
                  disabled={actionLoading !== null}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn modal-reject-btn account-approvals-detail-close-btn"
                  onClick={confirmDelete}
                  disabled={actionLoading !== null || deleteConfirmText !== "DELETE"}
                >
                  {actionLoading === deleteOfficer.id ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden />
                      <span>Removing…</span>
                    </>
                  ) : (
                    <>
                      <FaTrash className="me-2" aria-hidden />
                      Remove from directory
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Deactivate modal – for approved, currently active personnel */}
      {deactivateOfficer && (
        <Portal>
          <div
            className="account-approvals-detail-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-officer-title"
          >
            <div
              className={`account-approvals-detail-backdrop modal-backdrop-animation${deactivateModalClosing ? " exit" : ""}`}
              onClick={closeDeactivateModal}
              aria-hidden
            />
            <div className={`account-approvals-detail-modal modal-content-animation${deactivateModalClosing ? " exit" : ""}`}>
              <div className="account-approvals-detail-header">
                <div className="account-approvals-detail-header-text">
                  <h5 id="deactivate-officer-title" className="mb-0 fw-semibold">
                    Deactivate personnel
                  </h5>
                  <div className="account-approvals-detail-subtitle">
                    <span className="account-approvals-detail-name">{deactivateOfficer.name}</span>
                    {deactivateOfficer.email ? (
                      <span className="account-approvals-detail-email">• {deactivateOfficer.email}</span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close-custom"
                  onClick={closeDeactivateModal}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="account-approvals-detail-body">
                <p className="account-approvals-action-help">
                  While deactivated, this personnel account will not be able to sign in. Provide a brief reason so this decision is clear in
                  their profile and on future reviews.
                </p>
                <div className="mb-3">
                  <label htmlFor="deactivate-reason" className="account-approvals-action-label">
                    Deactivation reason <span className="text-muted">(optional)</span>
                  </label>
                  <textarea
                    id="deactivate-reason"
                    className="form-control account-approvals-action-textarea"
                    rows={3}
                    placeholder="Add a brief explanation for this deactivation (optional)."
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                    disabled={actionLoading !== null}
                  />
                </div>
              </div>
              <div className="account-approvals-detail-footer">
                <button
                  type="button"
                  className="btn btn-light account-approvals-detail-close-btn"
                  onClick={closeDeactivateModal}
                  disabled={actionLoading !== null}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn modal-reject-btn account-approvals-detail-close-btn"
                  onClick={confirmDeactivate}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === deactivateOfficer.id ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden />
                      <span>Deactivating…</span>
                    </>
                  ) : (
                    "Deactivate personnel"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Activate modal – for approved, currently inactive personnel */}
      {activateOfficer && (
        <Portal>
          <div
            className="account-approvals-detail-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activate-officer-title"
          >
            <div
              className={`account-approvals-detail-backdrop modal-backdrop-animation${activateModalClosing ? " exit" : ""}`}
              onClick={closeActivateModal}
              aria-hidden
            />
            <div className={`account-approvals-detail-modal modal-content-animation${activateModalClosing ? " exit" : ""}`}>
              <div className="account-approvals-detail-header">
                <div className="account-approvals-detail-header-text">
                  <h5 id="activate-officer-title" className="mb-0 fw-semibold">
                    Activate personnel
                  </h5>
                  <div className="account-approvals-detail-subtitle">
                    <span className="account-approvals-detail-name">{activateOfficer.name}</span>
                    {activateOfficer.email ? (
                      <span className="account-approvals-detail-email">• {activateOfficer.email}</span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close-custom"
                  onClick={closeActivateModal}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="account-approvals-detail-body">
                <p className="account-approvals-action-help">
                  Activating this personnel account will allow them to sign in again. You may record internal remarks for future reference.
                </p>
                <div className="mb-3">
                  <label htmlFor="activate-remarks" className="account-approvals-action-label">
                    Activation remarks <span className="text-muted">(optional)</span>
                  </label>
                  <textarea
                    id="activate-remarks"
                    className="form-control account-approvals-action-textarea"
                    rows={3}
                    placeholder="Add any internal notes about this activation (optional)."
                    value={activateRemarks}
                    onChange={(e) => setActivateRemarks(e.target.value)}
                    disabled={actionLoading !== null}
                  />
                </div>
              </div>
              <div className="account-approvals-detail-footer">
                <button
                  type="button"
                  className="btn btn-light account-approvals-detail-close-btn"
                  onClick={closeActivateModal}
                  disabled={actionLoading !== null}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn modal-confirm-btn account-approvals-detail-close-btn"
                  onClick={confirmActivate}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === activateOfficer.id ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden />
                      <span>Activating…</span>
                    </>
                  ) : (
                    "Activate personnel"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default Officers;

