import React, { useEffect } from "react";
import Portal from "../Portal.jsx";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const statusBadgeClass = (status) => {
  switch (status) {
    case "completed":
      return "officers-status-badge officers-status-approved";
    case "in_progress":
      return "officers-status-badge officers-status-pending";
    case "cancelled":
      return "officers-status-badge officers-status-rejected";
    case "pending":
    default:
      return "officers-status-badge officers-status-pending";
  }
};

const priorityBadgeClass = (priority) => {
  switch (priority) {
    case "high":
      return "badge task-badge-priority-high";
    case "low":
      return "badge task-badge-priority-low";
    case "medium":
    default:
      return "badge task-badge-priority-medium";
  }
};

const TaskDetailsModal = ({ task, closing, onClose, onEdit }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!task) return null;

  const displayStatus = task.status === "in_progress" ? "In progress" : (task.status || "Pending").replace(/_/g, " ");
  const displayPriority = (task.priority || "medium").charAt(0).toUpperCase() + (task.priority || "medium").slice(1);

  return (
    <Portal>
      <div
        className="account-approvals-detail-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
      >
        <div
          className={`account-approvals-detail-backdrop modal-backdrop-animation${closing ? " exit" : ""}`}
          onClick={onClose}
          aria-hidden
        />
        <div className={`account-approvals-detail-modal modal-content-animation${closing ? " exit" : ""}`}>
          <div className="account-approvals-detail-header">
            <div className="account-approvals-detail-header-text">
              <h5 id="task-detail-title" className="mb-0 fw-semibold">
                Task details
              </h5>
              <div className="account-approvals-detail-subtitle">
                <span className="account-approvals-detail-name">{task.title}</span>
              </div>
            </div>
            <button type="button" className="btn-close-custom" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          <div className="account-approvals-detail-body">
            <div className="account-approvals-detail-grid" role="list">
              <div className="account-approvals-detail-field" role="listitem">
                <div className="account-approvals-detail-label">Status</div>
                <div className="account-approvals-detail-value">
                  <span className={statusBadgeClass(task.status)}>{displayStatus}</span>
                </div>
              </div>
              <div className="account-approvals-detail-field" role="listitem">
                <div className="account-approvals-detail-label">Priority</div>
                <div className="account-approvals-detail-value">
                  <span className={priorityBadgeClass(task.priority)}>{displayPriority}</span>
                </div>
              </div>
              <div className="account-approvals-detail-field" role="listitem">
                <div className="account-approvals-detail-label">MFO</div>
                <div className="account-approvals-detail-value">{task.mfo || "—"}</div>
              </div>
              <div className="account-approvals-detail-field" role="listitem">
                <div className="account-approvals-detail-label">KRA</div>
                <div className="account-approvals-detail-value">{task.kra || "—"}</div>
              </div>
              <div className="account-approvals-detail-field" role="listitem">
                <div className="account-approvals-detail-label">KRA weight</div>
                <div className="account-approvals-detail-value">{task.kra_weight != null ? `${task.kra_weight}%` : "—"}</div>
              </div>
              <div className="account-approvals-detail-field" role="listitem">
                <div className="account-approvals-detail-label">Assigned to</div>
                <div className="account-approvals-detail-value">
                  {task.assignee ? task.assignee.name : "All officers"}
                </div>
              </div>
              <div className="account-approvals-detail-field" role="listitem">
                <div className="account-approvals-detail-label">Due date</div>
                <div className="account-approvals-detail-value">{formatDate(task.due_date)}</div>
              </div>
              <div className="account-approvals-detail-field" role="listitem">
                <div className="account-approvals-detail-label">Cutoff date</div>
                <div className="account-approvals-detail-value">{formatDate(task.cutoff_date)}</div>
              </div>
              {task.description && (
                <div className="account-approvals-detail-field account-approvals-detail-field-full" role="listitem">
                  <div className="account-approvals-detail-label">Description</div>
                  <div className="account-approvals-detail-value">{task.description}</div>
                </div>
              )}
              {task.objective && (
                <div className="account-approvals-detail-field account-approvals-detail-field-full" role="listitem">
                  <div className="account-approvals-detail-label">Objective</div>
                  <div className="account-approvals-detail-value">{task.objective}</div>
                </div>
              )}
              {Array.isArray(task.movs) && task.movs.filter(Boolean).length > 0 && (
                <div className="account-approvals-detail-field account-approvals-detail-field-full" role="listitem">
                  <div className="account-approvals-detail-label">MOVs</div>
                  <ul className="mb-0 ps-3">
                    {task.movs.filter(Boolean).map((mov, i) => (
                      <li key={i} className="account-approvals-detail-value">
                        {mov}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="account-approvals-detail-field account-approvals-detail-field-full" role="listitem">
                <div className="account-approvals-detail-label">Created by</div>
                <div className="account-approvals-detail-value">{task.creator?.name || "—"}</div>
              </div>
            </div>
          </div>
          <div className="account-approvals-detail-footer">
            {onEdit && (
              <button type="button" className="btn task-btn-primary account-approvals-detail-close-btn" onClick={onEdit}>
                Edit
              </button>
            )}
            <button type="button" className="btn btn-light account-approvals-detail-close-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default TaskDetailsModal;
