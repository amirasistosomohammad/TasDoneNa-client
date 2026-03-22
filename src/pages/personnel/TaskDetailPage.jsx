import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api.js";
import { showAlert, showToast } from "../../services/notificationService.js";
import { FaArrowLeft, FaEdit, FaTrash, FaUpload, FaFile, FaCheckCircle, FaDownload, FaTimes, FaSyncAlt } from "react-icons/fa";
import TaskConfirmModal from "../../components/TaskConfirmModal.jsx";
import "./TaskDetailPage.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const MAX_SIZE_MB = 10;
const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx";

/**
 * Personnel task detail page — view single task. Phase 2.9.
 * Uses GET /api/tasks/:id (officer endpoint) and file upload.
 */
const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFileModal, setDeleteFileModal] = useState(null); // { fileId, fileName }
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!id) return;
    setFilesLoading(true);
    try {
      const data = await api.get(`/tasks/${id}/files`);
      setFiles(data.files || []);
    } catch (err) {
      console.error("Failed to load files:", err);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    async function fetchTask() {
      try {
        const data = await api.get(`/tasks/${id}`);
        if (!cancelled) setTask(data.task);
      } catch (err) {
        if (!cancelled) {
          showAlert.error("Error", err.data?.message || err.message || "Failed to load task.");
          navigate("/my-tasks", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) fetchTask();
    return () => { cancelled = true; };
  }, [id, navigate]);

  useEffect(() => {
    if (task?.id) fetchFiles();
  }, [task?.id, fetchFiles]);

  if (loading) {
    return (
      <div className="task-detail-page task-detail-loading-wrap">
        <div className="task-detail-loading">
          <div className="spinner-border task-detail-loading-spinner" role="status" aria-label="Loading" />
          <span className="task-detail-loading-text">Loading task…</span>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const displayStatus = task.status === "in_progress" ? "Pending" : (task.status || "Pending").replace(/_/g, " ");
  const displayPriority = (task.priority || "medium").charAt(0).toUpperCase() + (task.priority || "medium").slice(1);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      showAlert.error("Upload error", `File size must be under ${MAX_SIZE_MB} MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`);
      e.target.value = "";
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      showAlert.error("Upload error", `Invalid file type. Allowed types: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.upload(`/tasks/${id}/upload`, formData);
      showToast.success("File uploaded successfully.");
      fetchFiles();
    } catch (err) {
      let errorMessage = "Failed to upload file.";
      if (err.data?.message) {
        errorMessage = err.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.status === 413) {
        errorMessage = "File too large. Maximum size is 10 MB.";
      } else if (err.status === 422) {
        errorMessage = "Invalid file type or format.";
      } else if (err.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      showAlert.error("Upload error", errorMessage);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const token = localStorage.getItem("access_token");
      const baseUrl = api.baseUrl.replace(/\/$/, "");
      const url = `${baseUrl}/api/tasks/${id}/files/${fileId}/download`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to download file");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      showToast.success("File downloaded successfully.");
    } catch (err) {
      showAlert.error("Error", err.message || "Failed to download file.");
    }
  };

  const handleDeleteFileClick = (fileId, fileName) => {
    setDeleteFileModal({ fileId, fileName });
  };

  const handleDeleteFileConfirm = async () => {
    if (!deleteFileModal) return;
    const { fileId } = deleteFileModal;
    setDeletingFileId(fileId);
    try {
      await api.delete(`/tasks/${id}/files/${fileId}`);
      showToast.success("File deleted successfully.");
      setDeleteFileModal(null);
      fetchFiles();
    } catch (err) {
      showAlert.error("Error", err.data?.message || err.message || "Failed to delete file.");
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleMarkCompletedClick = () => {
    if (task.status === "completed") {
      showAlert.info("Task Already Completed", "This task is already marked as completed.");
      return;
    }
    setShowMarkCompleteModal(true);
  };

  const handleMarkCompletedConfirm = async () => {
    setActionLoading(true);
    try {
      await api.put(`/tasks/${task.id}`, { status: "completed" });
      showToast.success("Task marked as completed!");
      setShowMarkCompleteModal(false);
      const data = await api.get(`/tasks/${id}`);
      setTask(data.task);
    } catch (err) {
      showAlert.error("Error", err.data?.message || err.message || "Failed to update task status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenClick = () => setShowReopenModal(true);

  const handleReopenConfirm = async () => {
    setActionLoading(true);
    try {
      await api.put(`/tasks/${task.id}`, { status: "pending" });
      showToast.success("Task reopened successfully.");
      setShowReopenModal(false);
      const data = await api.get(`/tasks/${id}`);
      setTask(data.task);
    } catch (err) {
      showAlert.error("Error", err.data?.message || err.message || "Failed to update task status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = () => setShowDeleteModal(true);

  const handleDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      showToast.success("Task deleted successfully.");
      setShowDeleteModal(false);
      navigate("/my-tasks", { replace: true });
    } catch (err) {
      showAlert.error("Error", err.data?.message || err.message || "Failed to delete task.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 task-detail-page task-detail-content-enter">
      <header className="task-detail-header">
        <div className="task-detail-header-top">
          <button
            type="button"
            className="task-detail-back-btn"
            onClick={() => navigate("/my-tasks")}
            aria-label="Back to my tasks"
          >
            <FaArrowLeft aria-hidden />
            Back
          </button>
          <h1 className="task-detail-title">{task.title}</h1>
          <div className="task-detail-actions">
            {task.status !== "completed" ? (
              <button
                type="button"
                className="task-detail-action-btn complete"
                onClick={handleMarkCompletedClick}
                title="Mark this task as completed"
                aria-label="Mark task as completed"
              >
                <FaCheckCircle aria-hidden />
                Mark as Completed
              </button>
            ) : (
              <button
                type="button"
                className="task-detail-action-btn reopen"
                onClick={handleReopenClick}
                title="Reopen this task"
                aria-label="Reopen task"
              >
                <FaSyncAlt aria-hidden />
                Reopen Task
              </button>
            )}
            <button
              type="button"
              className="task-detail-action-btn edit"
              onClick={() => navigate("/my-tasks/create", { state: { editTask: task } })}
              aria-label="Edit task"
            >
              <FaEdit aria-hidden />
              Edit
            </button>
            <button
              type="button"
              className="task-detail-action-btn delete"
              onClick={handleDeleteClick}
              aria-label="Delete task"
            >
              <FaTrash aria-hidden />
              Delete
            </button>
          </div>
        </div>
      </header>

      <div className="task-detail-card">
        <div className="task-detail-card-body">
          <div className="task-detail-grid">
            <div className="task-detail-field">
              <label className="task-detail-field-label">Status</label>
              <span className={`task-detail-badge status-${task.status === "completed" ? "completed" : "pending"}`}>
                {displayStatus}
              </span>
            </div>
            <div className="task-detail-field">
              <label className="task-detail-field-label">Priority</label>
              <span className="task-detail-badge priority">{displayPriority}</span>
            </div>
            {task.description && (
              <div className="task-detail-field task-detail-field-full">
                <label className="task-detail-field-label">Description</label>
                <div className="task-detail-field-value">{task.description}</div>
              </div>
            )}
            {task.mfo && (
              <div className="task-detail-field">
                <label className="task-detail-field-label">MFO</label>
                <div className="task-detail-field-value">{task.mfo}</div>
              </div>
            )}
            {task.kra && (
              <div className="task-detail-field">
                <label className="task-detail-field-label">KRA</label>
                <div className="task-detail-field-value">{task.kra}</div>
              </div>
            )}
            <div className="task-detail-field">
              <label className="task-detail-field-label">Due date</label>
              <div className="task-detail-field-value">{formatDate(task.due_date)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="task-detail-card">
        <div className="task-detail-card-header">
          <h2 className="task-detail-card-title">MOV (Means of Verification)</h2>
          <p className="task-detail-card-subtitle">Upload supporting documents as proof of completion.</p>
        </div>
        <div className="task-detail-card-body">
          <div className="task-detail-mov-upload">
            <input
              ref={fileInputRef}
              type="file"
              className="d-none"
              accept={ACCEPTED_TYPES}
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <button
              type="button"
              className="task-detail-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Upload MOV file"
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden />
                  Uploading…
                </>
              ) : (
                <>
                  <FaUpload aria-hidden />
                  Upload file
                </>
              )}
            </button>
            <span className="small text-muted">PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (max {MAX_SIZE_MB} MB)</span>
          </div>
          {filesLoading ? (
            <div className="small text-muted">Loading files…</div>
          ) : files.length === 0 ? (
            <p className="small text-muted mb-0">No files uploaded yet.</p>
          ) : (
            <ul className="task-detail-attachment-list">
              {files.map((f) => (
                <li key={f.id} className="task-detail-attachment-item">
                  <FaFile className="task-detail-attachment-icon" aria-hidden />
                  <div className="task-detail-attachment-info">
                    <span className="task-detail-attachment-name" title={f.file_name}>{f.file_name}</span>
                    <span className="task-detail-attachment-size">{formatFileSize(f.file_size)}</span>
                  </div>
                  <div className="task-detail-attachment-actions">
                    <button
                      type="button"
                      className="task-detail-attachment-btn download"
                      onClick={() => handleDownloadFile(f.id, f.file_name)}
                      title="Download file"
                      aria-label="Download file"
                    >
                      <FaDownload aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="task-detail-attachment-btn delete"
                      onClick={() => handleDeleteFileClick(f.id, f.file_name)}
                      disabled={deletingFileId === f.id}
                      title="Delete file"
                      aria-label="Delete file"
                    >
                      {deletingFileId === f.id ? (
                        <span className="spinner-border spinner-border-sm" aria-hidden />
                      ) : (
                        <FaTimes aria-hidden />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <TaskConfirmModal
        isOpen={showMarkCompleteModal}
        title="Mark as completed?"
        subtitle={task?.title}
        bodyText={`Mark "${task?.title || ""}" as completed? This task will be included in your accomplishment reports.`}
        confirmLabel="Yes, mark as completed"
        cancelLabel="Cancel"
        confirmVariant="confirm"
        onConfirm={handleMarkCompletedConfirm}
        onCancel={() => setShowMarkCompleteModal(false)}
        isLoading={actionLoading}
        loadingLabel="Marking as completed…"
      />

      <TaskConfirmModal
        isOpen={showReopenModal}
        title="Reopen task?"
        subtitle={task?.title}
        bodyText={`Change "${task?.title || ""}" status from completed? This task will no longer appear in accomplishment reports until completed again.`}
        confirmLabel="Yes, reopen"
        cancelLabel="Cancel"
        confirmVariant="confirm"
        onConfirm={handleReopenConfirm}
        onCancel={() => setShowReopenModal(false)}
        isLoading={actionLoading}
        loadingLabel="Reopening…"
      />

      <TaskConfirmModal
        isOpen={showDeleteModal}
        title="Delete task?"
        subtitle={task?.title}
        bodyText={`"${task?.title || ""}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={actionLoading}
        loadingLabel="Deleting…"
      />

      <TaskConfirmModal
        isOpen={!!deleteFileModal}
        title="Delete file?"
        subtitle={deleteFileModal?.fileName}
        bodyText={`"${deleteFileModal?.fileName || ""}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleDeleteFileConfirm}
        onCancel={() => setDeleteFileModal(null)}
        isLoading={deleteFileModal && deletingFileId === deleteFileModal?.fileId}
        loadingLabel="Deleting…"
      />
    </div>
  );
};

export default TaskDetailPage;
