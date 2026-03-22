import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { api } from "../../services/api.js";
import { showAlert, showToast } from "../../services/notificationService.js";
import { FaArrowLeft, FaFileAlt, FaCheckCircle, FaClock, FaUser } from "react-icons/fa";

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

/**
 * Admin accomplishment report detail page — view report and approve.
 * Phase 3.4
 */
const AccomplishmentReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchReport() {
      try {
        const data = await api.get(`/admin/accomplishment-reports/${id}`);
        if (!cancelled) setReport(data.report);
      } catch (err) {
        if (!cancelled) {
          showAlert.error("Error", err.data?.message || err.message || "Failed to load report.");
          navigate("/admin/accomplishment-reports", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) fetchReport();
    return () => { cancelled = true; };
  }, [id, navigate]);

  const handleNote = async () => {
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

    setApproving(true);
    try {
      await api.post(`/admin/accomplishment-reports/${report.id}/note`, formValues);
      showToast.success("Accomplishment report approved successfully.");
      // Refresh report data
      const data = await api.get(`/admin/accomplishment-reports/${id}`);
      setReport(data.report);
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to approve report."
      );
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid px-3 px-md-4">
        <div className="d-flex align-items-center justify-content-center py-5">
          <div className="spinner-border text-primary" role="status" aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (!report) return null;

  const statusIcon = report.status === "noted" ? (
    <FaCheckCircle className="text-success" />
  ) : report.status === "submitted" ? (
    <FaClock className="text-warning" />
  ) : (
    <FaFileAlt className="text-secondary" />
  );

  const statusLabel = report.status === "noted" ? "Approved" : report.status === "submitted" ? "Submitted" : "Draft";

  return (
    <div className="container-fluid px-3 px-md-4">
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
            onClick={() => navigate("/admin/accomplishment-reports")}
            aria-label="Back to reports"
          >
            <FaArrowLeft aria-hidden />
            Back
          </button>
          <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
            <span className="account-approvals-page-icon">
              <FaFileAlt aria-hidden />
            </span>
            Accomplishment Report — {getMonthName(report.month)} {report.year}
          </h1>
        </div>
        <div className="d-flex align-items-center gap-2">
          {statusIcon}
          <span className={`badge ${report.status === "noted" ? "bg-success" : report.status === "submitted" ? "bg-warning text-dark" : "bg-secondary"}`}>
            {statusLabel}
          </span>
          {report.status === "submitted" && (
            <button
              type="button"
              className="btn btn-success btn-sm d-inline-flex align-items-center gap-2"
              onClick={handleNote}
              disabled={approving}
            >
              {approving ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden />
                  Approving...
                </>
              ) : (
                <>
                  <FaCheckCircle aria-hidden />
                  Approve Report
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Report Info */}
      <div className="card border-0 shadow-sm account-approvals-card mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="small text-muted">Personnel</div>
              <p className="mb-0 fw-semibold d-flex align-items-center gap-2">
                <FaUser className="text-muted" />
                {report.user?.name || "—"}
              </p>
              {report.user?.email && (
                <p className="small text-muted mb-0">{report.user.email}</p>
              )}
            </div>
            <div className="col-md-4">
              <div className="small text-muted">Period</div>
              <p className="mb-0 fw-semibold">{getMonthName(report.month)} {report.year}</p>
            </div>
            <div className="col-md-4">
              <div className="small text-muted">Status</div>
              <p className="mb-0">
                <span className={`badge ${report.status === "noted" ? "bg-success" : report.status === "submitted" ? "bg-warning text-dark" : "bg-secondary"}`}>
                  {statusLabel}
                </span>
              </p>
            </div>
            <div className="col-md-4">
              <div className="small text-muted">Created</div>
              <p className="mb-0">{formatDate(report.created_at)}</p>
            </div>
            {report.noted_at && (
              <>
                <div className="col-md-4">
                  <div className="small text-muted">Noted By</div>
                  <p className="mb-0">{report.noted_by?.name || "—"}</p>
                </div>
                <div className="col-md-4">
                  <div className="small text-muted">Noted At</div>
                  <p className="mb-0">{formatDate(report.noted_at)}</p>
                </div>
              </>
            )}
            {report.remarks && (
              <div className="col-12">
                <div className="small text-muted">Personnel Remarks</div>
                <p className="mb-0">{report.remarks}</p>
              </div>
            )}
            {report.admin_remarks && (
              <div className="col-12">
                <div className="small text-muted">School Head Remarks</div>
                <p className="mb-0">{report.admin_remarks}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks by KRA */}
      <div className="card border-0 shadow-sm account-approvals-card">
        <div className="card-header bg-white border-bottom account-approvals-card-header">
          <h6 className="mb-0 fw-semibold account-approvals-card-title">Tasks by Key Result Area (KRA)</h6>
        </div>
        <div className="card-body">
          {!report.tasks_summary || report.tasks_summary.length === 0 ? (
            <p className="text-muted mb-0">No tasks found for this period.</p>
          ) : (
            <div className="accordion" id="kraAccordion">
              {report.tasks_summary.map((kraGroup, index) => (
                <div key={index} className="accordion-item border mb-2">
                  <h2 className="accordion-header" id={`kra-${index}`}>
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#collapse-${index}`}
                      aria-expanded={index === 0}
                      aria-controls={`collapse-${index}`}
                    >
                      <div className="d-flex justify-content-between align-items-center w-100 me-3">
                        <div>
                          <span className="fw-semibold">{kraGroup.kra || "Uncategorized"}</span>
                          {kraGroup.kra_weight && (
                            <span className="badge bg-light text-dark ms-2">
                              {kraGroup.kra_weight}% weight
                            </span>
                          )}
                        </div>
                        <span className="badge bg-primary">
                          {kraGroup.tasks?.length || 0} Task{(kraGroup.tasks?.length || 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </button>
                  </h2>
                  <div
                    id={`collapse-${index}`}
                    className={`accordion-collapse collapse ${index === 0 ? "show" : ""}`}
                    aria-labelledby={`kra-${index}`}
                    data-bs-parent="#kraAccordion"
                  >
                    <div className="accordion-body">
                      {!kraGroup.tasks || kraGroup.tasks.length === 0 ? (
                        <p className="text-muted mb-0">No tasks in this KRA.</p>
                      ) : (
                        <div className="list-group list-group-flush">
                          {kraGroup.tasks.map((task, taskIndex) => (
                            <div key={taskIndex} className="list-group-item px-0 py-3 border-bottom">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="mb-1 fw-semibold">{task.title}</h6>
                                {task.completed_at && (
                                  <span className="badge bg-success small">
                                    Completed: {formatDate(task.completed_at)}
                                  </span>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-muted small mb-2">{task.description}</p>
                              )}
                              {task.mfo && (
                                <div className="mb-2">
                                  <span className="small text-muted">MFO: </span>
                                  <span className="small">{task.mfo}</span>
                                </div>
                              )}
                              {task.objective && (
                                <div className="mb-2">
                                  <span className="small text-muted">Objective: </span>
                                  <span className="small">{task.objective}</span>
                                </div>
                              )}
                              {task.movs && task.movs.length > 0 && (
                                <div className="mt-2">
                                  <span className="small text-muted fw-semibold">MOVs:</span>
                                  <ul className="small text-muted mb-0 mt-1">
                                    {task.movs.map((mov, movIndex) => (
                                      <li key={movIndex}>{mov}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {task.due_date && (
                                <div className="mt-2">
                                  <span className="small text-muted">Due Date: </span>
                                  <span className="small">{formatDate(task.due_date)}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccomplishmentReportDetailPage;
