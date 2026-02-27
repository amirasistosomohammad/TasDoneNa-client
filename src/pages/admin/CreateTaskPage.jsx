import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../services/api.js";
import { FaPlus, FaArrowLeft } from "react-icons/fa";
import TaskForm from "../../components/admin/TaskForm.jsx";

/**
 * Create Task page — separate route, same structure as Create Travel Order in personnel.
 * Standalone form page with card layout, back link to Task List.
 */
const CreateTaskPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editTask = location.state?.editTask ?? null;
  const [officers, setOfficers] = useState([]);

  const fetchOfficers = useCallback(async () => {
    try {
      const data = await api.get("/admin/tasks/officers");
      setOfficers(data.officers || []);
    } catch (err) {
      setOfficers([]);
    }
  }, []);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  const handleSuccess = () => {
    navigate("/task-management", { replace: true });
  };

  const handleCancel = () => {
    navigate("/task-management");
  };

  return (
    <div className="container-fluid px-3 px-md-4">
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
            onClick={() => navigate("/task-management")}
            aria-label="Back to task list"
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
        officers={officers}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default CreateTaskPage;
