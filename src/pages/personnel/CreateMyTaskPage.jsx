import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useBlocker } from "react-router-dom";
import { FaPlus, FaArrowLeft } from "react-icons/fa";
import TaskForm from "../../components/personnel/PersonnelTaskForm.jsx";
import TaskConfirmModal from "../../components/TaskConfirmModal.jsx";

/**
 * Personnel create/edit task page.
 * Uses /api/tasks (officer endpoint); no assign-to dropdown.
 * Unsaved changes: confirmation modal when leaving with edits (MidTaskApp pattern).
 */
const CreateMyTaskPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editTask = location.state?.editTask ?? null;

  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [stayClicked, setStayClicked] = useState(false); // prevents "pop again" when Stay is clicked
  const [stayClickedForBlocker, setStayClickedForBlocker] = useState(false);
  const allowNavigationRef = useRef(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      if (allowNavigationRef.current) return false;
      return isFormDirty && currentLocation.pathname !== nextLocation.pathname;
    }
  );

  const isBlockerModalOpen = blocker?.state === "blocked";

  useEffect(() => {
    if (!isFormDirty) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFormDirty]);

  useEffect(() => {
    if (blocker?.state === "blocked") setStayClickedForBlocker(false);
  }, [blocker?.state]);

  const handleSuccess = useCallback(() => {
    allowNavigationRef.current = true;
    navigate("/my-tasks", { replace: true });
  }, [navigate]);

  const handleCancelClick = useCallback(() => {
    if (isFormDirty) {
      setStayClicked(false);
      setShowLeaveConfirm(true);
    } else {
      navigate("/my-tasks");
    }
  }, [isFormDirty, navigate]);

  const handleBackClick = useCallback(() => {
    if (isFormDirty) {
      setStayClicked(false);
      setShowLeaveConfirm(true);
    } else {
      navigate("/my-tasks");
    }
  }, [isFormDirty, navigate]);

  const closeLeaveConfirm = useCallback(() => {
    setStayClicked(true);
    setShowLeaveConfirm(false);
  }, []);

  const handleLeaveConfirm = useCallback(() => {
    allowNavigationRef.current = true;
    setShowLeaveConfirm(false);
    navigate("/my-tasks");
  }, [navigate]);

  const handleStayFromBlocker = useCallback(() => {
    if (blocker?.state !== "blocked") return;
    setStayClickedForBlocker(true);
    blocker.reset?.();
  }, [blocker]);

  const handleLeaveFromBlocker = useCallback(() => {
    if (blocker?.state !== "blocked") return;
    blocker.proceed?.();
  }, [blocker]);

  useEffect(() => {
    if (!showLeaveConfirm && blocker?.state !== "blocked") return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showLeaveConfirm) closeLeaveConfirm();
        else handleStayFromBlocker();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showLeaveConfirm, blocker?.state, closeLeaveConfirm, handleStayFromBlocker]);

  return (
    <div className="container-fluid px-3 px-md-4">
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
            onClick={handleBackClick}
            aria-label="Back to my tasks"
          >
            <FaArrowLeft aria-hidden />
            Back
          </button>
          <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
            <span className="account-approvals-page-icon">
              <FaPlus aria-hidden />
            </span>
            {editTask ? "Edit task" : "Create task"}
          </h1>
        </div>
      </div>

      <TaskForm
        task={editTask}
        onSuccess={handleSuccess}
        onCancel={handleCancelClick}
        onDirtyChange={setIsFormDirty}
      />

      {/* Unsaved changes modal – from Back/Cancel button */}
      <TaskConfirmModal
        isOpen={showLeaveConfirm && !stayClicked}
        title="Unsaved changes"
        bodyText="Leaving this page will discard your changes. Do you want to leave?"
        confirmLabel="Leave"
        cancelLabel="Stay"
        confirmVariant="danger"
        onConfirm={handleLeaveConfirm}
        onCancel={closeLeaveConfirm}
      />

      {/* Unsaved changes modal – from sidebar/navigation (useBlocker) */}
      <TaskConfirmModal
        isOpen={isBlockerModalOpen && !stayClickedForBlocker}
        title="Unsaved changes"
        bodyText="Leaving this page will discard your changes. Do you want to leave?"
        confirmLabel="Leave"
        cancelLabel="Stay"
        confirmVariant="danger"
        onConfirm={handleLeaveFromBlocker}
        onCancel={handleStayFromBlocker}
      />
    </div>
  );
};

export default CreateMyTaskPage;
