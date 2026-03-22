import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { api } from "../../services/api.js";
import { showAlert, showToast } from "../../services/notificationService.js";
import { FaFileAlt, FaSyncAlt, FaEye, FaCheckCircle, FaSearch, FaCalendarAlt, FaUser, FaUndo } from "react-icons/fa";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const getMonthName = (month) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
};

const statusBadgeClass = (status) => {
  switch (status) {
    case "noted":
      return "badge bg-success";
    case "submitted":
      return "badge bg-warning text-dark";
    case "draft":
    default:
      return "badge bg-secondary";
  }
};

const statusLabel = (status) => {
  switch (status) {
    case "noted":
      return "Approved";
    case "submitted":
      return "Submitted";
    case "draft":
    default:
      return "Draft";
  }
};

/**
 * Admin accomplishment reports page — view and approve reports from all personnel.
 * Phase 3.4
 */
const AccomplishmentReportsPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("submitted"); // Default to submitted
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState("");
  const [personnelFilter, setPersonnelFilter] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/accomplishment-reports");
      setReports(data.reports || []);
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to load accomplishment reports."
      );
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = useMemo(() => {
    let base = reports || [];
    
    if (statusFilter !== "all") {
      base = base.filter((r) => r.status === statusFilter);
    }
    
    if (yearFilter) {
      base = base.filter((r) => r.year === yearFilter);
    }
    
    if (monthFilter) {
      base = base.filter((r) => r.month === parseInt(monthFilter));
    }
    
    if (personnelFilter) {
      base = base.filter((r) => r.user_id === parseInt(personnelFilter));
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter(
        (r) =>
          (r.user?.name && r.user.name.toLowerCase().includes(q)) ||
          (r.user?.email && r.user.email.toLowerCase().includes(q)) ||
          getMonthName(r.month).toLowerCase().includes(q) ||
          String(r.year).includes(q) ||
          (r.remarks && r.remarks.toLowerCase().includes(q))
      );
    }
    
    return base;
  }, [reports, statusFilter, yearFilter, monthFilter, personnelFilter, searchQuery]);

  const handleNote = async (report) => {
    if (report.status !== "submitted") {
      showAlert.error(
        "Cannot Approve",
        "Only submitted reports can be approved."
      );
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: "Approve Accomplishment Report",
      html: `
        <div class="text-start">
          <p class="text-muted mb-3">
            <strong>Personnel:</strong> ${report.user?.name || "—"} <br>
            <strong>Period:</strong> ${getMonthName(report.month)} ${report.year}
          </p>
          
          <label for="swal-admin-remarks" class="form-label mt-3">Remarks (Optional)</label>
          <textarea id="swal-admin-remarks" class="swal2-textarea" placeholder="Add your notes or remarks..."></textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Approve Report",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2d5a27",
      cancelButtonColor: "#6c757d",
      background: "#fff",
      color: "#243047",
      preConfirm: () => {
        const adminRemarks = document.getElementById("swal-admin-remarks").value.trim();
        return { admin_remarks: adminRemarks };
      },
    });

    if (!formValues) return;

    setActionLoading(report.id);
    try {
      await api.post(`/admin/accomplishment-reports/${report.id}/note`, formValues);
      showToast.success("Accomplishment report approved successfully.");
      fetchReports();
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to approve report."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleView = (report) => {
    navigate(`/admin/accomplishment-reports/${report.id}`);
  };

  const availableYears = useMemo(() => {
    const years = new Set();
    reports.forEach((r) => years.add(r.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [reports]);

  const availablePersonnel = useMemo(() => {
    const personnelMap = new Map();
    reports.forEach((r) => {
      if (r.user) {
        personnelMap.set(r.user_id, r.user);
      }
    });
    return Array.from(personnelMap.values()).sort((a, b) => 
      (a.name || "").localeCompare(b.name || "")
    );
  }, [reports]);

  const submittedCount = useMemo(() => 
    reports.filter((r) => r.status === "submitted").length,
    [reports]
  );

  return (
    <div className="container-fluid px-3 px-md-4">
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
          <span className="account-approvals-page-icon">
            <FaFileAlt aria-hidden />
          </span>
          Accomplishment Reports
          {submittedCount > 0 && (
            <span className="badge bg-warning text-dark ms-2">
              {submittedCount} Pending
            </span>
          )}
        </h1>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
          onClick={fetchReports}
          disabled={loading}
        >
          <span className={loading ? "spinner-border spinner-border-sm" : ""} aria-hidden />
          {!loading && <span>Refresh</span>}
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm account-approvals-card mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label small text-muted">Search</label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaSearch className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by personnel, month, year..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="noted">Approved</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted">Year</label>
              <select
                className="form-select"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value ? parseInt(e.target.value) : "")}
              >
                <option value="">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted">Month</label>
              <select
                className="form-select"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNum = i + 1;
                  return (
                    <option key={monthNum} value={monthNum}>
                      {getMonthName(monthNum)}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small text-muted">Personnel</label>
              <select
                className="form-select"
                value={personnelFilter}
                onChange={(e) => setPersonnelFilter(e.target.value)}
              >
                <option value="">All Personnel</option>
                {availablePersonnel.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="card border-0 shadow-sm account-approvals-card">
        <div className="card-body">
          {loading ? (
            <div className="d-flex align-items-center justify-content-center py-5">
              <div className="spinner-border text-primary" role="status" aria-label="Loading" />
            </div>
          ) : filteredReports.length === 0 ? (
            reports.length === 0 ? (
              <div className="text-center py-5">
                <FaFileAlt className="text-muted mb-3" style={{ fontSize: "3rem" }} />
                <p className="text-muted mb-0">No accomplishment reports yet.</p>
              </div>
            ) : (
              <div className="account-approvals-empty-state">
                <div className="account-approvals-empty-state-icon">
                  <FaSearch aria-hidden />
                </div>
                <h3 className="account-approvals-empty-state-title">No matches found</h3>
                <p className="account-approvals-empty-state-text">
                  No reports match your filters. Try different filters or reset to view all reports.
                </p>
                <button
                  type="button"
                  className="btn account-approvals-empty-state-btn"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setYearFilter(new Date().getFullYear());
                    setMonthFilter("");
                    setPersonnelFilter("");
                  }}
                  aria-label="Reset filters to show all reports"
                >
                  <FaUndo className="sb-empty-state-btn-icon" aria-hidden />
                  Reset filters
                </button>
              </div>
            )
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Personnel</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>KRAs</th>
                    <th>Tasks</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => {
                    const totalTasks = report.tasks_summary?.reduce(
                      (sum, kra) => sum + (kra.tasks?.length || 0),
                      0
                    ) || 0;
                    const kraCount = report.tasks_summary?.length || 0;

                    return (
                      <tr key={report.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <FaUser className="text-muted" />
                            <div>
                              <div className="fw-semibold">{report.user?.name || "—"}</div>
                              {report.user?.email && (
                                <div className="small text-muted">{report.user.email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <FaCalendarAlt className="text-muted" />
                            <div>
                              <div className="fw-semibold">{getMonthName(report.month)} {report.year}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={statusBadgeClass(report.status)}>
                            {statusLabel(report.status)}
                          </span>
                          {report.noted_at && (
                            <div className="small text-muted mt-1">
                              Approved: {formatDate(report.noted_at)}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">{kraCount} KRA{kraCount !== 1 ? "s" : ""}</span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">{totalTasks} Task{totalTasks !== 1 ? "s" : ""}</span>
                        </td>
                        <td>
                          <div className="small text-muted">{formatDate(report.created_at)}</div>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleView(report)}
                              title="View report"
                            >
                              <FaEye aria-hidden />
                            </button>
                            {report.status === "submitted" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={() => handleNote(report)}
                                disabled={actionLoading === report.id}
                                title="Approve report"
                              >
                                {actionLoading === report.id ? (
                                  <span className="spinner-border spinner-border-sm" aria-hidden />
                                ) : (
                                  <>
                                    <FaCheckCircle aria-hidden />
                                    <span className="ms-1 d-none d-md-inline">Approve</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccomplishmentReportsPage;
