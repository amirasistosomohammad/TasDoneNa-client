import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArchive, FaDownload, FaEye, FaFileAlt, FaSearch } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { api } from "../../services/api.js";
import { showAlert, showToast } from "../../services/notificationService.js";
import Portal from "../../components/Portal.jsx";
import "./FilesArchive.css";

const formatFileSize = (bytes) => {
  const b = Number(bytes || 0);
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateTime = (isoLike) => {
  if (!isoLike) return "—";
  try {
    const d = new Date(isoLike);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(isoLike);
  }
};

export default function FilesArchive() {
  const { user } = useAuth();
  const isOfficer = user?.role === "officer";

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("uploaded_at"); // uploaded_at | file_name | file_size
  const [dir, setDir] = useState("desc"); // asc | desc
  const [scope, setScope] = useState("all"); // all | active | archived

  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [actionFileId, setActionFileId] = useState(null);
  const [fullAmountModal, setFullAmountModal] = useState(null); // { label, value }
  const [fullAmountModalClosing, setFullAmountModalClosing] = useState(false);

  const activeList = useMemo(() => {
    let list = files || [];

    if (scope === "active") {
      list = list.filter((f) => !f.archived_at);
    } else if (scope === "archived") {
      list = list.filter((f) => !!f.archived_at);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((f) => {
        const name = (f.file_name || "").toLowerCase();
        const task = (f.task_title || "").toLowerCase();
        return name.includes(q) || task.includes(q);
      });
    }

    list = [...list].sort((a, b) => {
      if (sort === "file_name") {
        return dir === "asc"
          ? (a.file_name || "").localeCompare(b.file_name || "")
          : (b.file_name || "").localeCompare(a.file_name || "");
      }
      if (sort === "file_size") {
        const av = Number(a.file_size || 0);
        const bv = Number(b.file_size || 0);
        return dir === "asc" ? av - bv : bv - av;
      }
      // uploaded_at (default)
      const ad = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
      const bd = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
      return dir === "asc" ? ad - bd : bd - ad;
    });

    return list;
  }, [dir, files, query, scope, sort]);

  const fetchArchive = useCallback(async () => {
    if (!isOfficer) return;
    setLoading(true);
    try {
      const data = await api.get("/files-archive");
      setFiles(data?.files || []);
      setStats(data?.stats || null);
    } catch (err) {
      setFiles([]);
      setStats(null);
      showAlert.error(
        "Error",
        err?.data?.message || err.message || "Failed to load files archive."
      );
    } finally {
      setLoading(false);
    }
  }, [isOfficer]);

  useEffect(() => {
    fetchArchive();
  }, [fetchArchive]);

  const downloadBlob = async (fileId) => {
    const token = localStorage.getItem("access_token");
    const baseUrl = api.baseUrl.replace(/\/$/, "");
    const url = `${baseUrl}/api/files-archive/${fileId}/download`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to download file");
    }
    return response.blob();
  };

  const handleDownload = async (fileId, fileName) => {
    setActionFileId(fileId);
    try {
      const blob = await downloadBlob(fileId);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName || "file";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      showToast.success("File downloaded successfully.");
    } catch (err) {
      showAlert.error("Error", err.message || "Failed to download file.");
    } finally {
      setActionFileId(null);
    }
  };

  const handleViewFile = async (fileId) => {
    setActionFileId(fileId);
    try {
      const blob = await downloadBlob(fileId);
      const viewUrl = window.URL.createObjectURL(blob);
      window.open(viewUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(viewUrl), 60_000);
    } catch (err) {
      showAlert.error("Error", err.message || "Failed to open file.");
    } finally {
      setActionFileId(null);
    }
  };

  if (!isOfficer) {
    return (
      <div className="container-fluid px-3 px-md-4 py-4">
        <div className="calendar-pending-note">
          <p className="mb-0">Document archive is available for personnel only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-md-4">
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
          <span className="account-approvals-page-icon" aria-hidden>
            <FaArchive />
          </span>
          Document archive
        </h1>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
          onClick={fetchArchive}
          disabled={loading}
        >
          <span className={loading ? "spinner-border spinner-border-sm" : ""} aria-hidden />
          {!loading && <span>Refresh</span>}
        </button>
      </div>

      <div className="files-archive-banner mb-3">
        <div className="files-archive-banner-icon" aria-hidden>
          <FaArchive />
        </div>
        <div className="files-archive-banner-body">
          <div className="files-archive-banner-title">Document archive</div>
          <div className="files-archive-banner-subtitle">
            View and search all files you have submitted across assigned and personal tasks, in one
            organized archive.
          </div>
        </div>
      </div>

      <div className="personnel-stats-panel mb-3">
        <div className="row g-3">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="personnel-stats-card personnel-stats-card-total">
              <div className="personnel-stats-card-icon" aria-hidden>
                <FaFileAlt />
              </div>
              <div className="personnel-stats-card-body">
                <span className="personnel-stats-card-label">Total files</span>
                <div className="personnel-stats-card-value-row">
                  <span className="personnel-stats-card-value">
                    {loading ? "—" : stats?.total ?? 0}
                  </span>
                  {!loading && (
                    <button
                      type="button"
                      className="personnel-stats-view-full"
                      onClick={() =>
                        setFullAmountModal({
                          label: "Total files",
                          value: stats?.total ?? 0,
                        })
                      }
                      aria-label="See exact count for Total files"
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

      {fullAmountModal && (
        <Portal>
          <div
            className="account-approvals-detail-overlay"
            aria-modal="true"
            role="dialog"
            aria-labelledby="full-amount-modal-title"
          >
            <div
              className={`account-approvals-detail-backdrop modal-backdrop-animation${
                fullAmountModalClosing ? " exit" : ""
              }`}
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
            <div
              className={`account-approvals-detail-modal personnel-full-amount-modal modal-content-animation${
                fullAmountModalClosing ? " exit" : ""
              }`}
            >
              <div className="account-approvals-detail-header">
                <h5
                  id="full-amount-modal-title"
                  className="mb-0 fw-semibold personnel-full-amount-modal-title"
                >
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
                  {Number(fullAmountModal.value || 0).toLocaleString()}
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
        <div className="card-header bg-white border-bottom account-approvals-card-header files-archive-card-header">
          <div className="files-archive-search-row">
            <div className="input-group input-group-sm files-archive-search">
              <span className="input-group-text" aria-hidden>
                <FaSearch />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="form-control"
                placeholder="Search by file name or task name…"
                aria-label="Search files"
              />
            </div>

            <div className="files-archive-sort-row">
              <select
                className="form-select form-select-sm files-archive-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort by"
              >
                <option value="uploaded_at">Newest</option>
                <option value="file_name">File name</option>
                <option value="file_size">File size</option>
              </select>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}
                aria-label="Toggle sort direction"
                title="Toggle sort direction"
              >
                {dir === "asc" ? "Asc" : "Desc"}
              </button>
              <select
                className="form-select form-select-sm files-archive-scope-select"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                aria-label="Archive scope"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="small text-muted mt-2 mb-0">Loading archive…</p>
            </div>
          ) : activeList.length === 0 ? (
            <div className="account-approvals-empty-state">
              <div className="account-approvals-empty-state-icon">
                <FaArchive aria-hidden />
              </div>
              <h3 className="account-approvals-empty-state-title">No files found</h3>
              <p className="account-approvals-empty-state-text">
                Upload MOVs inside a task, then manage them here in your archive.
              </p>
              <Link to="/my-tasks" className="btn account-approvals-empty-state-btn">
                Go to my tasks
              </Link>
            </div>
          ) : (
            <div className="files-archive-feed p-3">
              {activeList.map((f) => {
                const when = f.archived_at || f.uploaded_at;
                return (
                  <div key={f.id} className="files-archive-file-card">
                    <div className="files-archive-file-top">
                      <div className="files-archive-file-left">
                        <div className="files-archive-file-icon" aria-hidden>
                          <FaFileAlt />
                        </div>
                        <div className="files-archive-file-head">
                          <div className="files-archive-file-name">{f.file_name}</div>
                          <div className="files-archive-file-sub">
                            <span
                              className="files-archive-file-task text-truncate"
                              title={f.task_title || ""}
                            >
                              {f.task_title || "Task"}
                            </span>
                            <span className="files-archive-file-badge">UPLOAD</span>
                          </div>
                        </div>
                      </div>
                      <div className="files-archive-file-right">
                        <span className="files-archive-file-date">{formatDateTime(when)}</span>
                      </div>
                    </div>

                    <div className="files-archive-file-meta">
                      <div className="files-archive-file-meta-row">
                        <span className="files-archive-file-meta-label">File type:</span>{" "}
                        <span className="files-archive-file-meta-value">{f.file_type || "—"}</span>
                      </div>
                      <div className="files-archive-file-meta-row">
                        <span className="files-archive-file-meta-label">File size:</span>{" "}
                        <span className="files-archive-file-meta-value">
                          {formatFileSize(f.file_size)}
                        </span>
                      </div>
                    </div>

                    <div className="files-archive-file-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                        onClick={() => handleViewFile(f.id)}
                        disabled={actionFileId === f.id}
                      >
                        <FaEye aria-hidden />
                        View file
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
                        onClick={() => handleDownload(f.id, f.file_name)}
                        disabled={actionFileId === f.id}
                      >
                        <FaDownload aria-hidden />
                        Download
                      </button>
                      <Link to={`/my-tasks/${f.task_id}`} className="btn btn-outline-secondary btn-sm">
                        View task
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

