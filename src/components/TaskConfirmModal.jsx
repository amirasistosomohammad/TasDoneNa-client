import React, { useEffect, useCallback, useState } from "react";
import Portal from "./Portal.jsx";

/**
 * Task confirmation modal – matches LogoutConfirmModal and Personnel Directory modals.
 * Same UI/UX structure for consistency across the system.
 */
const TaskConfirmModal = ({
  isOpen,
  title,
  subtitle,
  bodyText,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmVariant = "confirm", // "confirm" | "danger"
  loadingLabel = "Processing…",
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    if (closing) return;
    onCancel?.();
  }, [onCancel, isLoading, closing]);

  const handleConfirm = useCallback(() => {
    if (isLoading) return;
    onConfirm?.();
  }, [onConfirm, isLoading]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") handleClose();
    },
    [handleClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const confirmBtnClass =
    confirmVariant === "danger"
      ? "btn modal-reject-btn account-approvals-detail-close-btn"
      : "btn modal-confirm-btn account-approvals-detail-close-btn";

  return (
    <Portal>
      <div
        className="account-approvals-detail-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-confirm-title"
        tabIndex={-1}
      >
        <div
          className={`account-approvals-detail-backdrop modal-backdrop-animation${closing ? " exit" : ""}`}
          onClick={handleClose}
          aria-hidden
        />
        <div
          className={`account-approvals-detail-modal task-confirm-modal modal-content-animation${closing ? " exit" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="account-approvals-detail-header">
            <div className="account-approvals-detail-header-text">
              <h5 id="task-confirm-title" className="mb-0 fw-semibold">
                {title}
              </h5>
              {subtitle && (
                <div className="account-approvals-detail-subtitle">
                  <span className="account-approvals-detail-name">{subtitle}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn-close-custom"
              onClick={handleClose}
              aria-label="Close"
              disabled={isLoading}
            >
              ×
            </button>
          </div>
          <div className="account-approvals-detail-body">
            <p className="account-approvals-action-help mb-0">{bodyText}</p>
          </div>
          <div className="account-approvals-detail-footer">
            <button
              type="button"
              className="btn btn-light account-approvals-detail-close-btn"
              onClick={handleClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={confirmBtnClass}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden />
                  {loadingLabel}
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default TaskConfirmModal;
