import React, { useEffect, useCallback, useState } from "react";
import Portal from "./Portal.jsx";

const LogoutConfirmModal = ({ isOpen, onConfirm, onCancel }) => {
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onCancel?.();
    }, 200);
  }, [onCancel]);

  const handleConfirm = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onConfirm?.();
    }, 200);
  }, [onConfirm]);

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

  return (
    <Portal>
      <div
        className="account-approvals-detail-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        tabIndex={-1}
      >
        <div
          className={`account-approvals-detail-backdrop modal-backdrop-animation${closing ? " exit" : ""}`}
          onClick={handleClose}
          aria-hidden
        />
        <div className={`account-approvals-detail-modal modal-content-animation${closing ? " exit" : ""}`}>
          <div className="account-approvals-detail-header">
            <div className="account-approvals-detail-header-text">
              <h5 id="logout-confirm-title" className="mb-0 fw-semibold">
                Sign out?
              </h5>
              <div className="account-approvals-detail-subtitle">
                <span className="account-approvals-detail-name">Confirm sign out from your account</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close-custom"
              onClick={handleClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="account-approvals-detail-body">
            <p className="account-approvals-action-help mb-0">
              Are you sure you want to sign out? You will need to sign in again to access TasDoneNa.
            </p>
          </div>
          <div className="account-approvals-detail-footer">
            <button
              type="button"
              className="btn btn-light account-approvals-detail-close-btn"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary account-approvals-detail-close-btn logout-confirm-signout-btn"
              onClick={handleConfirm}
            >
              Yes, sign out
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default LogoutConfirmModal;
