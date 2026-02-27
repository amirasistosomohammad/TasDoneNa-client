import React, { useState, useEffect } from "react";
import { api } from "../../services/api.js";
import { showAlert, showToast } from "../../services/notificationService.js";

const TaskForm = ({ task, officers, onSuccess, onCancel }) => {
  const isEdit = !!task;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    mfo: "",
    kra: "",
    kra_weight: "",
    objective: "",
    movs: [""],
    due_date: "",
    cutoff_date: "",
    assigned_to: "",
    priority: "medium",
    timeline_start: "",
    timeline_end: "",
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        mfo: task.mfo || "",
        kra: task.kra || "",
        kra_weight: task.kra_weight != null ? String(task.kra_weight) : "",
        objective: task.objective || "",
        movs: Array.isArray(task.movs) && task.movs.length > 0 ? [...task.movs] : [""],
        due_date: task.due_date ? task.due_date.slice(0, 10) : "",
        cutoff_date: task.cutoff_date ? task.cutoff_date.slice(0, 10) : "",
        assigned_to: task.assigned_to != null ? String(task.assigned_to) : "",
        priority: task.priority || "medium",
        timeline_start: task.timeline_start ? task.timeline_start.slice(0, 10) : "",
        timeline_end: task.timeline_end ? task.timeline_end.slice(0, 10) : "",
      });
    }
  }, [task]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addMov = () => {
    setForm((prev) => ({ ...prev, movs: [...prev.movs, ""] }));
  };

  const removeMov = (index) => {
    setForm((prev) => ({
      ...prev,
      movs: prev.movs.filter((_, i) => i !== index),
    }));
  };

  const updateMov = (index, value) => {
    setForm((prev) => ({
      ...prev,
      movs: prev.movs.map((v, i) => (i === index ? value : v)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showAlert.error("Validation", "Title is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        mfo: form.mfo.trim() || null,
        kra: form.kra.trim() || null,
        kra_weight: form.kra_weight ? parseFloat(form.kra_weight) : null,
        objective: form.objective.trim() || null,
        movs: form.movs.filter((m) => m.trim()).length > 0 ? form.movs.filter((m) => m.trim()) : null,
        due_date: form.due_date || null,
        cutoff_date: form.cutoff_date || null,
        assigned_to: form.assigned_to ? parseInt(form.assigned_to, 10) : null,
        priority: form.priority,
        timeline_start: form.timeline_start || null,
        timeline_end: form.timeline_end || null,
      };

      if (isEdit) {
        await api.put(`/admin/tasks/${task.id}`, payload);
        showToast.success("Task updated successfully.");
      } else {
        await api.post("/admin/tasks", payload);
        showToast.success("Task created successfully.");
      }
      onSuccess?.();
    } catch (err) {
      showAlert.error(
        "Error",
        err.data?.message || err.message || (isEdit ? "Failed to update task." : "Failed to create task.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="card border-0 shadow-sm account-approvals-card">
        <div className="card-header bg-white border-bottom account-approvals-card-header">
          <h6 className="mb-0 fw-semibold account-approvals-card-title">
            {isEdit ? "Edit task" : "Create new task"}
          </h6>
          <p className="small text-muted mb-0 mt-1">
            {isEdit ? "Update task details and IPCRF fields." : "Add a new task with MFO, KRA, objectives, and MOVs."}
          </p>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12">
              <label htmlFor="task-title" className="account-approvals-action-label">
                Title <span className="text-danger">*</span>
              </label>
              <input
                id="task-title"
                type="text"
                className="form-control"
                placeholder="Task title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="col-12">
              <label htmlFor="task-description" className="account-approvals-action-label">
                Description <span className="text-muted">(optional)</span>
              </label>
              <textarea
                id="task-description"
                className="form-control account-approvals-action-textarea"
                rows={3}
                placeholder="Task description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="task-mfo" className="account-approvals-action-label">
                MFO <span className="text-muted">(optional)</span>
              </label>
              <input
                id="task-mfo"
                type="text"
                className="form-control"
                placeholder="Major Final Output"
                value={form.mfo}
                onChange={(e) => update("mfo", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="task-kra" className="account-approvals-action-label">
                KRA <span className="text-muted">(optional)</span>
              </label>
              <input
                id="task-kra"
                type="text"
                className="form-control"
                placeholder="Key Result Area"
                value={form.kra}
                onChange={(e) => update("kra", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="task-kra-weight" className="account-approvals-action-label">
                KRA weight (%) <span className="text-muted">(optional)</span>
              </label>
              <input
                id="task-kra-weight"
                type="number"
                className="form-control"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g. 15"
                value={form.kra_weight}
                onChange={(e) => update("kra_weight", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="task-priority" className="account-approvals-action-label">
                Priority
              </label>
              <select
                id="task-priority"
                className="form-select"
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
                disabled={loading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="col-12">
              <label htmlFor="task-objective" className="account-approvals-action-label">
                Objective <span className="text-muted">(optional)</span>
              </label>
              <textarea
                id="task-objective"
                className="form-control account-approvals-action-textarea"
                rows={2}
                placeholder="Task objective"
                value={form.objective}
                onChange={(e) => update("objective", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="col-12">
              <label className="account-approvals-action-label">
                MOVs (Means of Verification) <span className="text-muted">(optional)</span>
              </label>
              <p className="account-approvals-action-help small mb-2">
                Add one or more means of verification. Leave empty to remove.
              </p>
              {form.movs.map((mov, index) => (
                <div key={index} className="d-flex gap-2 mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`MOV ${index + 1}`}
                    value={mov}
                    onChange={(e) => updateMov(index, e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary flex-shrink-0"
                    onClick={() => removeMov(index)}
                    disabled={form.movs.length <= 1 || loading}
                    aria-label="Remove MOV"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={addMov}
                disabled={loading}
              >
                + Add MOV
              </button>
            </div>
            <div className="col-md-4">
              <label htmlFor="task-due-date" className="account-approvals-action-label">
                Due date <span className="text-muted">(optional)</span>
              </label>
              <input
                id="task-due-date"
                type="date"
                className="form-control"
                value={form.due_date}
                onChange={(e) => update("due_date", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="task-cutoff-date" className="account-approvals-action-label">
                Cutoff date <span className="text-muted">(optional)</span>
              </label>
              <input
                id="task-cutoff-date"
                type="date"
                className="form-control"
                value={form.cutoff_date}
                onChange={(e) => update("cutoff_date", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="task-assigned-to" className="account-approvals-action-label">
                Assign to
              </label>
              <select
                id="task-assigned-to"
                className="form-select"
                value={form.assigned_to}
                onChange={(e) => update("assigned_to", e.target.value)}
                disabled={loading}
              >
                <option value="">All officers</option>
                {(officers || []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="task-timeline-start" className="account-approvals-action-label">
                Timeline start <span className="text-muted">(optional)</span>
              </label>
              <input
                id="task-timeline-start"
                type="date"
                className="form-control"
                value={form.timeline_start}
                onChange={(e) => update("timeline_start", e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="task-timeline-end" className="account-approvals-action-label">
                Timeline end <span className="text-muted">(optional)</span>
              </label>
              <input
                id="task-timeline-end"
                type="date"
                className="form-control"
                value={form.timeline_end}
                onChange={(e) => update("timeline_end", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="task-form-actions d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-sm task-btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden />
                  {isEdit ? "Updating…" : "Creating…"}
                </>
              ) : (
                isEdit ? "Update task" : "Create task"
              )}
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default TaskForm;
