import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../services/api.js";
import { FaPlus, FaArrowLeft } from "react-icons/fa";
import TaskForm from "../../components/admin/TaskForm.jsx";

/**
 * Personnel create task page.
 * Uses /api/tasks (officer endpoint). No "Assign to" — personnel create for themselves.
 */
const OfficerCreateTaskPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editTask = location.state?.editTask ?? null;

  const handleSuccess = () => {
    navigate("/my-tasks", { replace: true });
  };

  const handleCancel = () => {
    navigate("/my-tasks");
  };

  return (
    <div className="container-fluid px-3 px-md-4">
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
            onClick={() => navigate("/my-tasks")}
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
        officers={[]}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        apiPrefix=""
        showAssignTo={false}
      />
    </div>
  );
};

export default OfficerCreateTaskPage;
