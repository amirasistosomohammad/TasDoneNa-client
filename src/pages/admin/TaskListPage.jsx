import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api.js";
import { showAlert } from "../../services/notificationService.js";
import { FaClipboardList, FaPlus, FaSyncAlt } from "react-icons/fa";
import TaskList from "../../components/admin/TaskList.jsx";

/**
 * Task List page — separate route, same structure as Personnel directory (Officers).
 * Mirrors the Create Travel Order / Travel Order List pattern: list on one page, create on another.
 */
const TaskListPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/tasks");
      setTasks(data.tasks || []);
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || "Failed to load tasks."
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleEdit = (task) => {
    navigate("/task-management/create", { state: { editTask: task } });
  };

  return (
    <div className="container-fluid px-3 px-md-4">
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
          <span className="account-approvals-page-icon">
            <FaClipboardList aria-hidden />
          </span>
          Task list
        </h1>
        <div className="account-approvals-page-actions d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm task-btn-primary d-inline-flex align-items-center gap-2"
            onClick={() => navigate("/task-management/create")}
          >
            <FaPlus aria-hidden />
            Create task
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
            onClick={fetchTasks}
            disabled={loading}
          >
            <span className={loading ? "spinner-border spinner-border-sm" : ""} aria-hidden />
            {!loading && <span>Refresh</span>}
          </button>
        </div>
      </div>

      <TaskList
        tasks={tasks}
        loading={loading}
        onRefresh={fetchTasks}
        onEdit={handleEdit}
      />
    </div>
  );
};

export default TaskListPage;
