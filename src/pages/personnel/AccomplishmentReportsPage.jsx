import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { api } from "../../services/api.js";
import { showAlert, showToast } from "../../services/notificationService.js";
import { FaFileAlt, FaPlus, FaSyncAlt, FaEye, FaEdit, FaSearch, FaCalendarAlt, FaUndo } from "react-icons/fa";

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
 * Personnel accomplishment reports page — generate and submit monthly reports.
 * Phase 3.2
 */
const AccomplishmentReportsPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/accomplishment-reports");
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
    
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter(
        (r) =>
          getMonthName(r.month).toLowerCase().includes(q) ||
          String(r.year).includes(q) ||
          (r.remarks && r.remarks.toLowerCase().includes(q))
      );
    }
    
    return base;
  }, [reports, statusFilter, yearFilter, searchQuery]);

  const handleGenerateReport = async () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const { value: formValues } = await Swal.fire({
      title: "Generate Accomplishment Report",
      html: `
        <div class="text-start">
          <label for="swal-year" class="form-label mt-3">Year</label>
          <input id="swal-year" class="swal2-input" type="number" value="${currentYear}" min="2020" max="2100" placeholder="Year">
          
          <label for="swal-month" class="form-label mt-3">Month</label>
          <select id="swal-month" class="swal2-select">
            ${Array.from({ length: 12 }, (_, i) => {
              const monthNum = i + 1;
              const monthName = getMonthName(monthNum);
              return `<option value="${monthNum}" ${monthNum === currentMonth ? "selected" : ""}>${monthName}</option>`;
            }).join("")}
          </select>
          
          <label for="swal-remarks" class="form-label mt-3">Remarks (Optional)</label>
          <textarea id="swal-remarks" class="swal2-textarea" placeholder="Additional remarks..."></textarea>
          
          <label for="swal-status" class="form-label mt-3">Status</label>
          <select id="swal-status" class="swal2-select">
            <option value="draft">Draft (Save for later)</option>
            <option value="submitted">Submit for approval</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Generate Report",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#152A45",
      cancelButtonColor: "#6c757d",
      background: "#fff",
      color: "#243047",
      preConfirm: () => {
        const year = parseInt(document.getElementById("swal-year").value);
        const month = parseInt(document.getElementById("swal-month").value);
        const remarks = document.getElementById("swal-remarks").value.trim();
        const status = document.getElementById("swal-status").value;
        
        if (!year || year < 2020 || year > 2100) {
          Swal.showValidationMessage("Please enter a valid year (2020-2100)");
          return false;
        }
        
        if (!month || month < 1 || month > 12) {
          Swal.showValidationMessage("Please select a valid month");
          return false;
        }
        
        // Prevent generating reports for future months
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        if (year > currentYear || (year === currentYear && month > currentMonth)) {
          Swal.showValidationMessage("Cannot generate reports for future months");
          return false;
        }
        
        return { year, month, remarks, status };
      },
    });

    if (!formValues) return;

    setGenerating(true);
    try {
      const data = await api.post("/accomplishment-reports", formValues);
      showToast.success(
        formValues.status === "submitted"
          ? "Accomplishment report generated and submitted successfully."
          : "Accomplishment report generated successfully."
      );
      fetchReports();
      
      // Show preview if submitted
      if (formValues.status === "submitted" && data.report) {
        await Swal.fire({
          title: "Report Generated",
          html: `
            <p class="text-start">Your accomplishment report for ${getMonthName(formValues.month)} ${formValues.year} has been generated and submitted.</p>
            <p class="text-start small text-muted">The report includes ${data.report.tasks_summary?.length || 0} KRA(s) with completed tasks.</p>
          `,
          icon: "success",
          confirmButtonColor: "#152A45",
          background: "#fff",
          color: "#243047",
        });
      }
    } catch (err) {
      if (err.data?.message?.includes("already exists")) {
        showAlert.error(
          "Report Exists",
          `An accomplishment report for ${getMonthName(formValues.month)} ${formValues.year} already exists. Please edit the existing report instead.`
        );
      } else if (err.data?.message?.includes("future months")) {
        showAlert.error(
          "Invalid Date",
          "Cannot generate reports for future months. Please select a current or past month."
        );
      } else if (err.data?.message?.includes("No completed tasks")) {
        showAlert.error(
          "No Tasks Found",
          "No completed tasks found for this month. Please complete some tasks first or create a draft report."
        );
      } else {
        showAlert.error(
          "Error",
          err.data?.message || err.message || "Failed to generate accomplishment report."
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleView = (report) => {
    navigate(`/accomplishment-reports/${report.id}`);
  };

  const handleEdit = async (report) => {
    if (report.status !== "draft") {
      showAlert.error(
        "Cannot Edit",
        "Only draft reports can be edited. Submitted reports cannot be modified."
      );
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: "Edit Accomplishment Report",
      html: `
        <div class="text-start">
          <p class="text-muted">${getMonthName(report.month)} ${report.year}</p>
          
          <label for="swal-remarks" class="form-label mt-3">Remarks</label>
          <textarea id="swal-remarks" class="swal2-textarea" placeholder="Additional remarks...">${report.remarks || ""}</textarea>
          
          <label for="swal-status" class="form-label mt-3">Status</label>
          <select id="swal-status" class="swal2-select">
            <option value="draft" ${report.status === "draft" ? "selected" : ""}>Draft</option>
            <option value="submitted" ${report.status === "submitted" ? "selected" : ""}>Submit for approval</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update Report",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#152A45",
      cancelButtonColor: "#6c757d",
      background: "#fff",
      color: "#243047",
      preConfirm: () => {
        const remarks = document.getElementById("swal-remarks").value.trim();
        const status = document.getElementById("swal-status").value;
        return { remarks, status };
      },
    });

    if (!formValues) return;

    try {
      await api.put(`/accomplishment-reports/${report.id}`, formValues);
      showToast.success(
        formValues.status === "submitted"
          ? "Report updated and submitted successfully."
          : "Report updated successfully."
      );
      fetchReports();
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to update report."
      );
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set();
    reports.forEach((r) => years.add(r.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [reports]);

  return (
    <div className="container-fluid px-3 px-md-4">
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
          <span className="account-approvals-page-icon">
            <FaFileAlt aria-hidden />
          </span>
          Accomplishment reports
        </h1>
        <div className="account-approvals-page-actions d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm task-btn-primary d-inline-flex align-items-center gap-2"
            onClick={handleGenerateReport}
            disabled={generating}
          >
            {generating ? (
              <>
                <span className="spinner-border spinner-border-sm" aria-hidden />
                Generating...
              </>
            ) : (
              <>
                <FaPlus aria-hidden />
                Generate Report
              </>
            )}
          </button>
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
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm account-approvals-card mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small text-muted">Search</label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaSearch className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by month, year, remarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
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
            <div className="col-md-3">
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
                <p className="text-muted mb-0">
                  No accomplishment reports yet. Generate your first report using the Generate Report button above.
                </p>
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
                    <th>Month/Year</th>
                    <th>Status</th>
                    <th>KRAs</th>
                    <th>Tasks</th>
                    <th>Created</th>
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
                              Noted: {formatDate(report.noted_at)}
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
                              aria-label={`View report for ${getMonthName(report.month)} ${report.year}`}
                            >
                              <FaEye aria-hidden />
                            </button>
                            {report.status === "draft" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleEdit(report)}
                                title="Edit report"
                              >
                                <FaEdit aria-hidden />
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
