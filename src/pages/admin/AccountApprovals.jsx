import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import { api } from "../../services/api.js";
import { showAlert, showToast } from "../../services/notificationService.js";
import { FaUserCheck, FaUserTimes, FaSyncAlt, FaClipboardList, FaEye, FaSearch } from "react-icons/fa";
import Portal from "../../components/Portal.jsx";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const AccountApprovals = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailUser, setDetailUser] = useState(null);
  const [detailModalClosing, setDetailModalClosing] = useState(false);
  const detailOverlayRef = React.useRef(null);
  const [approveUser, setApproveUser] = useState(null);
  const [approveRemarks, setApproveRemarks] = useState("");
  const [approveModalClosing, setApproveModalClosing] = useState(false);
  const [rejectUser, setRejectUser] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [rejectModalClosing, setRejectModalClosing] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/pending-users");
      setUsers(data.users || []);
      setCurrentPage(1);
      window.dispatchEvent(new CustomEvent("account-approvals-updated", { detail: { count: (data.users || []).length } }));
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to load pending users."
      );
      setUsers([]);
      window.dispatchEvent(new CustomEvent("account-approvals-updated", { detail: { count: 0 } }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.trim().toLowerCase();
    return users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.employee_id && String(u.employee_id).toLowerCase().includes(q)) ||
        (u.position && u.position.toLowerCase().includes(q)) ||
        (u.division && u.division.toLowerCase().includes(q)) ||
        (u.school_name && u.school_name.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  const totalPages = useMemo(
    () => Math.ceil(filteredUsers.length / pageSize) || 1,
    [filteredUsers.length, pageSize]
  );
  const displayedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage((p) => Math.max(1, Math.min(p, totalPages)));
  }, [totalPages, searchQuery, pageSize]);

  useEffect(() => {
    if (!detailUser) return;
    const t = setTimeout(() => detailOverlayRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [detailUser]);

  const handleApprove = async (user, remarks) => {
    setActionLoading(user.id);
    try {
      await api.post(`/admin/users/${user.id}/approve`, { remarks: remarks || "" });
      showToast.success(`${user.name} has been approved.`);
      setDetailUser(null);
      setApproveUser(null);
      setApproveRemarks("");
      await fetchPending();
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to approve user."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const doReject = async (user, reason) => {
    setActionLoading(user.id);
    try {
      await api.post(`/admin/users/${user.id}/reject`, { reason: reason || "" });
      showToast.success("User rejected.");
      setDetailUser(null);
      setRejectUser(null);
      setRejectRemarks("");
      await fetchPending();
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to reject user."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openApproveModal = (user) => {
    setDetailUser(null);
    setRejectUser(null);
    setApproveUser(user);
    setApproveRemarks("");
    setApproveModalClosing(false);
  };

  const closeApproveModal = () => {
    if (!approveUser || actionLoading !== null) return;
    setApproveModalClosing(true);
    setTimeout(() => {
      setApproveUser(null);
      setApproveRemarks("");
      setApproveModalClosing(false);
    }, 200);
  };

  const confirmApprove = async () => {
    if (!approveUser || actionLoading !== null) return;

    const result = await Swal.fire({
      title: "Approve personnel?",
      text: `This will allow ${approveUser.name} to sign in and use the system.`,
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

    await handleApprove(approveUser, approveRemarks);
  };

  const openRejectModal = (user) => {
    setDetailUser(null);
    setApproveUser(null);
    setRejectUser(user);
    setRejectRemarks("");
    setRejectModalClosing(false);
  };

  const closeRejectModal = () => {
    if (!rejectUser || actionLoading !== null) return;
    setRejectModalClosing(true);
    setTimeout(() => {
      setRejectUser(null);
      setRejectRemarks("");
      setRejectModalClosing(false);
    }, 200);
  };

  const confirmReject = async () => {
    if (!rejectUser || actionLoading !== null) return;

    const result = await Swal.fire({
      title: "Reject personnel?",
      text: `This will prevent ${rejectUser.name} from signing in until approved again.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reject",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#b91c1c",
      cancelButtonColor: "#6c757d",
      background: "#fff",
      color: "#243047",
    });

    if (!result.isConfirmed) {
      return;
    }

    await doReject(rejectUser, rejectRemarks);
  };

  const handleDetailClose = () => {
    if (actionLoading !== null) return;
    setDetailModalClosing(true);
    setTimeout(() => {
      setDetailUser(null);
      setDetailModalClosing(false);
    }, 200);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="container-fluid px-3 px-md-4">
      {/* Page header */}
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
          <span className="account-approvals-page-icon">
            <FaClipboardList aria-hidden />
          </span>
          Account approvals
        </h1>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
          onClick={fetchPending}
          disabled={loading}
        >
          <FaSyncAlt className={loading ? "spinner" : ""} aria-hidden />
          Refresh
        </button>
      </div>

      <div className="card border-0 shadow-sm account-approvals-card">
        <div className="card-header bg-white border-bottom account-approvals-card-header">
          <h6 className="mb-0 fw-semibold account-approvals-card-title">
            Pending personnel
          </h6>
          <p className="small text-muted mb-0 mt-1">
            Review new personnel registrations and record your approval decisions.
          </p>
        </div>

        {/* Search – corporate style, fully responsive */}
        {!loading && users.length > 0 && (
          <div className="account-approvals-filter-panel">
            <div className="account-approvals-filter-row">
              <label htmlFor="account-approvals-search-input" className="account-approvals-search-label">
                Search
              </label>
              <div className="account-approvals-search-wrap">
                <span className="account-approvals-search-icon-wrap" aria-hidden>
                  <FaSearch className="account-approvals-search-icon" />
                </span>
                <span className="account-approvals-search-input-wrap">
                  <input
                    id="account-approvals-search-input"
                    type="search"
                    className="account-approvals-search-input"
                    placeholder="Filter by name, email or position"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search pending personnel"
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
              {searchQuery && (
                <span className="account-approvals-results-text">
                  {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}
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
              <p className="small text-muted mt-2 mb-0">Loading pending users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5 px-3">
              <p className="text-muted mb-0">No pending approvals.</p>
              <p className="small text-muted mt-1">
                New personnel registrations will appear here after they verify their email.
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="account-approvals-empty-state">
              <div className="account-approvals-empty-state-icon">
                <FaSearch aria-hidden />
              </div>
              <h3 className="account-approvals-empty-state-title">No matches found</h3>
              <p className="account-approvals-empty-state-text">
                No pending personnel match your search. Try different keywords or clear the filter.
              </p>
              <button
                type="button"
                className="btn btn-sm account-approvals-empty-state-btn"
                onClick={() => setSearchQuery("")}
              >
                Clear search
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
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedUsers.map((u, index) => (
                      <tr key={u.id}>
                        <td className="account-approvals-col-num text-center text-muted fw-medium">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="account-approvals-col-actions">
                          <div className="d-flex gap-1 flex-nowrap align-items-center justify-content-start account-approvals-action-btns">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary account-approvals-btn-icon"
                              onClick={() => setDetailUser(u)}
                              title="View details"
                              aria-label="View details"
                            >
                              <FaEye aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-success account-approvals-btn-icon"
                              onClick={() => openApproveModal(u)}
                              disabled={actionLoading !== null}
                              title="Approve"
                              aria-label="Approve"
                            >
                              {actionLoading === u.id ? (
                                <span className="spinner-border spinner-border-sm" aria-hidden />
                              ) : (
                                <FaUserCheck aria-hidden />
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger account-approvals-btn-icon"
                              onClick={() => openRejectModal(u)}
                              disabled={actionLoading !== null}
                              title="Reject"
                              aria-label="Reject"
                            >
                              {actionLoading === u.id ? (
                                <span className="spinner-border spinner-border-sm" aria-hidden />
                              ) : (
                                <FaUserTimes aria-hidden />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="account-approvals-cell-text fw-semibold" title={u.name}>
                          {u.name}
                        </td>
                        <td className="account-approvals-cell-text" title={u.email}>
                          {u.email}
                        </td>
                        <td className="account-approvals-cell-text small text-muted">
                          {formatDate(u.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination – per page + page nav, always when there are results */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-3 border-top account-approvals-pagination">
                <div className="d-flex flex-wrap align-items-center gap-3 account-approvals-pagination-left">
                  <span className="small text-muted">
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length}
                  </span>
                  <div className="d-flex align-items-center gap-2 account-approvals-per-page">
                    <label htmlFor="account-approvals-per-page-select" className="small text-muted mb-0">
                      Per page
                    </label>
                    <select
                      id="account-approvals-per-page-select"
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
                <nav aria-label="Account approvals pagination" className="account-approvals-pagination-nav">
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

      {/* Detail modal – Portal (CPC-style) + backdrop/content animations */}
      {detailUser && (
        <Portal>
          <div
            className="account-approvals-detail-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-detail-title"
            tabIndex={-1}
            onKeyDown={(e) => e.key === "Escape" && handleDetailClose()}
            ref={detailOverlayRef}
          >
            <div
              className={`account-approvals-detail-backdrop modal-backdrop-animation${detailModalClosing ? " exit" : ""}`}
              onClick={handleDetailClose}
              aria-hidden
            />
            <div className={`account-approvals-detail-modal modal-content-animation${detailModalClosing ? " exit" : ""}`}>
              <div className="account-approvals-detail-header">
                <div className="account-approvals-detail-header-text">
                  <h5 id="account-detail-title" className="mb-0 fw-semibold">
                    Officer details
                  </h5>
                  <div className="account-approvals-detail-subtitle">
                    <span className="account-approvals-detail-name">{detailUser.name}</span>
                    {detailUser.email ? <span className="account-approvals-detail-email">• {detailUser.email}</span> : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close-custom"
                  onClick={handleDetailClose}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="account-approvals-detail-body">
                <div className="account-approvals-detail-grid" role="list">
                  <div className="account-approvals-detail-field" role="listitem">
                    <div className="account-approvals-detail-label">Employee ID</div>
                    <div className="account-approvals-detail-value">{detailUser.employee_id || "—"}</div>
                  </div>
                  <div className="account-approvals-detail-field" role="listitem">
                    <div className="account-approvals-detail-label">Position</div>
                    <div className="account-approvals-detail-value">{detailUser.position || "—"}</div>
                  </div>
                  <div className="account-approvals-detail-field" role="listitem">
                    <div className="account-approvals-detail-label">Division</div>
                    <div className="account-approvals-detail-value">{detailUser.division || "—"}</div>
                  </div>
                  <div className="account-approvals-detail-field" role="listitem">
                    <div className="account-approvals-detail-label">School</div>
                    <div className="account-approvals-detail-value">{detailUser.school_name || "—"}</div>
                  </div>
                  <div className="account-approvals-detail-field account-approvals-detail-field-full" role="listitem">
                    <div className="account-approvals-detail-label">Registered</div>
                    <div className="account-approvals-detail-value">{formatDate(detailUser.created_at)}</div>
                  </div>
                </div>
              </div>
              <div className="account-approvals-detail-footer">
                <button
                  type="button"
                  className="btn btn-primary account-approvals-detail-close-btn"
                  onClick={handleDetailClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Approve modal – remarks + confirmation */}
      {approveUser && (
        <Portal>
          <div
            className="account-approvals-detail-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="approve-officer-title"
          >
            <div
              className={`account-approvals-detail-backdrop modal-backdrop-animation${approveModalClosing ? " exit" : ""}`}
              onClick={closeApproveModal}
              aria-hidden
            />
            <div className={`account-approvals-detail-modal modal-content-animation${approveModalClosing ? " exit" : ""}`}>
              <div className="account-approvals-detail-header">
                <div className="account-approvals-detail-header-text">
                  <h5 id="approve-officer-title" className="mb-0 fw-semibold">
                    Approve personnel
                  </h5>
                  <div className="account-approvals-detail-subtitle">
                    <span className="account-approvals-detail-name">{approveUser.name}</span>
                    {approveUser.email ? <span className="account-approvals-detail-email">• {approveUser.email}</span> : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close-custom"
                  onClick={closeApproveModal}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="account-approvals-detail-body">
                <p className="account-approvals-action-help">
                  After approval, this personnel account will be able to sign in and use TasDoneNa.
                  You can optionally record why the account was approved.
                </p>
                <div className="mb-3">
                  <label htmlFor="approve-remarks" className="account-approvals-action-label">
                    Approval remarks <span className="text-muted">(optional)</span>
                  </label>
                  <textarea
                    id="approve-remarks"
                    className="form-control account-approvals-action-textarea"
                    rows={3}
                    placeholder="Add any internal notes about this approval (optional)."
                    value={approveRemarks}
                    onChange={(e) => setApproveRemarks(e.target.value)}
                    disabled={actionLoading !== null}
                  />
                </div>
              </div>
              <div className="account-approvals-detail-footer">
                <button
                  type="button"
                  className="btn btn-light account-approvals-detail-close-btn"
                  onClick={closeApproveModal}
                  disabled={actionLoading !== null}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn modal-confirm-btn account-approvals-detail-close-btn"
                  onClick={confirmApprove}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === approveUser.id ? (
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

      {/* Reject modal – remarks + confirmation (portal) */}
      {rejectUser && (
        <Portal>
          <div
            className="account-approvals-detail-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-officer-title"
          >
            <div
              className={`account-approvals-detail-backdrop modal-backdrop-animation${rejectModalClosing ? " exit" : ""}`}
              onClick={closeRejectModal}
              aria-hidden
            />
            <div className={`account-approvals-detail-modal modal-content-animation${rejectModalClosing ? " exit" : ""}`}>
              <div className="account-approvals-detail-header">
                <div className="account-approvals-detail-header-text">
                  <h5 id="reject-officer-title" className="mb-0 fw-semibold">
                    Reject personnel
                  </h5>
                  <div className="account-approvals-detail-subtitle">
                    <span className="account-approvals-detail-name">{rejectUser.name}</span>
                    {rejectUser.email ? <span className="account-approvals-detail-email">• {rejectUser.email}</span> : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close-custom"
                  onClick={closeRejectModal}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="account-approvals-detail-body">
                <p className="account-approvals-action-help">
                  The personnel account will not be able to sign in until it is approved again.
                  Provide a brief explanation so this decision is clear in their profile.
                </p>
                <div className="mb-3">
                  <label htmlFor="reject-remarks" className="account-approvals-action-label">
                    Rejection remarks <span className="text-muted">(optional, shown to the personnel)</span>
                  </label>
                  <textarea
                    id="reject-remarks"
                    className="form-control account-approvals-action-textarea"
                    rows={3}
                    placeholder="Add a brief explanation for this decision (optional)."
                    value={rejectRemarks}
                    onChange={(e) => setRejectRemarks(e.target.value)}
                    disabled={actionLoading !== null}
                  />
                </div>
              </div>
              <div className="account-approvals-detail-footer">
                <button
                  type="button"
                  className="btn btn-light account-approvals-detail-close-btn"
                  onClick={closeRejectModal}
                  disabled={actionLoading !== null}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn modal-reject-btn account-approvals-detail-close-btn"
                  onClick={confirmReject}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === rejectUser.id ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden />
                      <span>Rejecting…</span>
                    </>
                  ) : (
                    "Reject personnel"
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

export default AccountApprovals;
