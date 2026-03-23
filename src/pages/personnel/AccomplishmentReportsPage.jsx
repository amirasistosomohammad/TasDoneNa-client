import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../services/api.js";
import { showToast } from "../../services/notificationService.js";
import { FaFileAlt, FaCalendarAlt, FaTimes } from "react-icons/fa";
import Portal from "../../components/Portal.jsx";

const getMonthName = (month) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
};

const MODAL_TRANSITION_MS = 300;

/**
 * Personnel accomplishment reports — period + School Head (Certified by), then Excel download.
 */
const AccomplishmentReportsPage = () => {
  const [generating, setGenerating] = useState(false);
  const [genYear, setGenYear] = useState(() => new Date().getFullYear());
  const [genMonth, setGenMonth] = useState(() => new Date().getMonth() + 1);
  const [genErrors, setGenErrors] = useState({});
  const [genSubmitError, setGenSubmitError] = useState("");

  const [shModalOpen, setShModalOpen] = useState(false);
  const [shModalEntered, setShModalEntered] = useState(false);
  const [schoolHeadName, setSchoolHeadName] = useState("");
  const [schoolHeadDesignation, setSchoolHeadDesignation] = useState("");
  const [shFieldErrors, setShFieldErrors] = useState({});
  const [shModalError, setShModalError] = useState("");

  const nameInputRef = useRef(null);
  const closeTimerRef = useRef(null);

  const validatePeriod = () => {
    const e = {};
    const year = genYear === "" ? NaN : parseInt(String(genYear), 10);
    const month = parseInt(String(genMonth), 10);
    const nowY = new Date().getFullYear();
    const nowM = new Date().getMonth() + 1;

    if (!Number.isFinite(year) || year < 2020 || year > 2100) {
      e.year = "Enter a valid year (2020–2100).";
    }
    if (!Number.isFinite(month) || month < 1 || month > 12) {
      e.month = "Select a valid month.";
    }
    if (!e.year && !e.month && (year > nowY || (year === nowY && month > nowM))) {
      e.month = "Cannot generate reports for future months.";
    }
    setGenErrors(e);
    return Object.keys(e).length === 0;
  };

  const closeSchoolHeadModal = useCallback(() => {
    setShModalEntered(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setShModalOpen(false);
      setSchoolHeadName("");
      setSchoolHeadDesignation("");
      setShFieldErrors({});
      setShModalError("");
      closeTimerRef.current = null;
    }, MODAL_TRANSITION_MS);
  }, []);

  useEffect(() => {
    if (!shModalOpen) {
      return undefined;
    }
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setShModalEntered(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, [shModalOpen]);

  useEffect(() => {
    if (shModalOpen && shModalEntered) {
      nameInputRef.current?.focus();
    }
  }, [shModalOpen, shModalEntered]);

  useEffect(() => {
    if (!shModalOpen) {
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSchoolHeadModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shModalOpen, closeSchoolHeadModal]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    []
  );

  const handleOpenSchoolHeadModal = () => {
    setGenSubmitError("");
    if (!validatePeriod()) {
      return;
    }
    setShModalError("");
    setShFieldErrors({});
    setSchoolHeadName("");
    setSchoolHeadDesignation("");
    setShModalEntered(false);
    setShModalOpen(true);
  };

  const validateSchoolHead = () => {
    const e = {};
    if (!schoolHeadName.trim()) {
      e.name = "Enter the school head’s name.";
    }
    if (!schoolHeadDesignation.trim()) {
      e.designation = "Enter the school head’s designation.";
    }
    setShFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirmDownload = () => {
    setShModalError("");
    if (!validateSchoolHead()) {
      return;
    }

    const year = parseInt(String(genYear === "" ? NaN : genYear), 10);
    const month = parseInt(String(genMonth), 10);
    const fallback = `Accomplishment_Report_${year}-${String(month).padStart(2, "0")}.xlsx`;

    setGenerating(true);
    api
      .generateAccomplishmentReportExport(
        {
          year,
          month,
          school_head_name: schoolHeadName.trim(),
          school_head_designation: schoolHeadDesignation.trim(),
        },
        fallback
      )
      .then(() => {
        showToast.success("Report downloaded.");
        closeSchoolHeadModal();
      })
      .catch((err) => {
        if (err.data?.message?.includes("future months")) {
          setShModalError("Cannot generate reports for future months.");
        } else {
          setShModalError(err?.data?.message || err.message || "Could not download the report.");
        }
      })
      .finally(() => setGenerating(false));
  };

  return (
    <div className="container-fluid px-3 px-md-4">
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
          <span className="account-approvals-page-icon">
            <FaFileAlt aria-hidden />
          </span>
          Accomplishment reports
        </h1>
      </div>

      <p className="small text-muted mb-3" style={{ maxWidth: "42rem" }}>
        Choose the year and month, then generate report. You will be asked for the school head’s name and designation
        for the <strong>Certified by</strong> section before the Excel file downloads.
      </p>

      <div className="card border-0 shadow-sm account-approvals-card mb-3">
        <div className="card-body">
          <h2 className="h6 fw-semibold mb-3 text-body account-approvals-card-title">Report options</h2>
          <div className="row g-3">
            <div className="col-md-4 col-lg-3">
              <label htmlFor="acc-report-year" className="form-label small text-muted mb-1 d-flex align-items-center gap-2">
                <FaCalendarAlt className="text-muted flex-shrink-0" aria-hidden />
                Year
              </label>
              <input
                id="acc-report-year"
                type="number"
                className={`form-control ${genErrors.year ? "is-invalid" : ""}`}
                min={2020}
                max={2100}
                value={genYear === "" ? "" : genYear}
                onChange={(e) => {
                  const v = e.target.value;
                  setGenYear(v === "" ? "" : parseInt(v, 10));
                  setGenErrors((prev) => {
                    const next = { ...prev };
                    delete next.year;
                    return next;
                  });
                }}
                aria-invalid={!!genErrors.year}
                aria-describedby={genErrors.year ? "acc-report-year-err" : undefined}
              />
              {genErrors.year && (
                <div id="acc-report-year-err" className="invalid-feedback d-block">
                  {genErrors.year}
                </div>
              )}
            </div>
            <div className="col-md-4 col-lg-3">
              <label htmlFor="acc-report-month" className="form-label small text-muted mb-1 d-flex align-items-center gap-2">
                <FaCalendarAlt className="text-muted flex-shrink-0" aria-hidden />
                Month
              </label>
              <select
                id="acc-report-month"
                className={`form-select ${genErrors.month ? "is-invalid" : ""}`}
                value={genMonth}
                onChange={(e) => {
                  setGenMonth(parseInt(e.target.value, 10));
                  setGenErrors((prev) => {
                    const next = { ...prev };
                    delete next.month;
                    return next;
                  });
                }}
                aria-invalid={!!genErrors.month}
                aria-describedby={genErrors.month ? "acc-report-month-err" : undefined}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNum = i + 1;
                  return (
                    <option key={monthNum} value={monthNum}>
                      {getMonthName(monthNum)}
                    </option>
                  );
                })}
              </select>
              {genErrors.month && (
                <div id="acc-report-month-err" className="invalid-feedback d-block">
                  {genErrors.month}
                </div>
              )}
            </div>
          </div>

          {genSubmitError && (
            <div className="alert alert-danger py-2 px-3 small mt-3 mb-0" role="alert">
              {genSubmitError}
            </div>
          )}

          <div className="mt-3 pt-3 border-top d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-sm task-btn-primary d-inline-flex align-items-center gap-2"
              onClick={handleOpenSchoolHeadModal}
              disabled={generating}
            >
              <FaFileAlt aria-hidden />
              Generate report
            </button>
          </div>
        </div>
      </div>

      {shModalOpen && (
        <Portal>
          <div
            className={`account-approvals-detail-overlay acc-report-sh-modal${shModalEntered ? " acc-report-sh-modal--open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="acc-sh-modal-title"
          >
            <div
              className="account-approvals-detail-backdrop"
              onClick={closeSchoolHeadModal}
              role="presentation"
            />
            <div className="account-approvals-detail-modal">
              <div className="account-approvals-detail-header">
                <div className="account-approvals-detail-header-text">
                  <h2 id="acc-sh-modal-title" className="h6 mb-0 fw-bold text-body">
                    School head (Certified by)
                  </h2>
                  <p className="account-approvals-detail-subtitle mb-0">
                    Enter the name and designation that will appear in the <strong>Certified by</strong> section of the
                    Excel report.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={closeSchoolHeadModal}
                  disabled={generating}
                  aria-label="Close"
                >
                  <FaTimes aria-hidden />
                </button>
              </div>
              <div className="account-approvals-detail-body">
                {shModalError && (
                  <div className="alert alert-danger py-2 small mb-3" role="alert">
                    {shModalError}
                  </div>
                )}
                <div className="mb-3">
                  <label htmlFor="acc-sh-name" className="form-label small fw-semibold text-muted">
                    Name
                  </label>
                  <input
                    ref={nameInputRef}
                    id="acc-sh-name"
                    type="text"
                    className={`form-control ${shFieldErrors.name ? "is-invalid" : ""}`}
                    value={schoolHeadName}
                    onChange={(e) => {
                      setSchoolHeadName(e.target.value);
                      setShFieldErrors((p) => {
                        const n = { ...p };
                        delete n.name;
                        return n;
                      });
                    }}
                    placeholder="Full name"
                    autoComplete="name"
                    disabled={generating}
                  />
                  {shFieldErrors.name && <div className="invalid-feedback d-block">{shFieldErrors.name}</div>}
                </div>
                <div className="mb-0">
                  <label htmlFor="acc-sh-designation" className="form-label small fw-semibold text-muted">
                    Designation
                  </label>
                  <input
                    id="acc-sh-designation"
                    type="text"
                    className={`form-control ${shFieldErrors.designation ? "is-invalid" : ""}`}
                    value={schoolHeadDesignation}
                    onChange={(e) => {
                      setSchoolHeadDesignation(e.target.value);
                      setShFieldErrors((p) => {
                        const n = { ...p };
                        delete n.designation;
                        return n;
                      });
                    }}
                    placeholder="Designation or position"
                    autoComplete="organization-title"
                    disabled={generating}
                  />
                  {shFieldErrors.designation && (
                    <div className="invalid-feedback d-block">{shFieldErrors.designation}</div>
                  )}
                </div>
              </div>
              <div className="account-approvals-detail-footer d-flex flex-wrap gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={closeSchoolHeadModal}
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm task-btn-primary d-inline-flex align-items-center gap-2"
                  onClick={handleConfirmDownload}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <span className="spinner-border spinner-border-sm" aria-hidden />
                      Generating…
                    </>
                  ) : (
                    <>
                      <FaFileAlt aria-hidden />
                      Generate report
                    </>
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

export default AccomplishmentReportsPage;
