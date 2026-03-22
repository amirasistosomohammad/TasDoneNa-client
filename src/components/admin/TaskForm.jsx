import React, { useState, useEffect, useMemo, useRef } from "react";
import { api } from "../../services/api.js";
import { showAlert, showToast } from "../../services/notificationService.js";
import SearchableComboBox from "../SearchableComboBox.jsx";

function kraValuesEndpoint(apiBase) {
  const base = (apiBase || "/admin/tasks").replace(/\/$/, "");
  return `${base}/kra-values`;
}

const KRA_OPTIONS = [
  "PERSONNEL ADMINISTRATION(30%)",
  "PROPERTY CUSTODIANSHIP (30%)",
  "GENERAL ADMINISTRATIVE SUPPORT(25%)",
  "FINANCIAL MANAGEMENT(10%)",
  "PLUS FACTOR 5%",
];

const INITIAL_FORM = {
  title: "",
  description: "",
  mfo: "",
  kra: "",
  objective: "",
  movs: [""],
  due_date: "",
  assigned_to: "",
  priority: "medium",
  timeline_start: "",
  timeline_end: "",
};

function getInitialForm(task) {
  if (!task) return { ...INITIAL_FORM };
  return {
    title: task.title || "",
    description: task.description || "",
    mfo: task.mfo || "",
    kra: (task.kra && String(task.kra).trim()) ? String(task.kra).trim() : "",
    objective: task.objective || "",
    movs: Array.isArray(task.movs) && task.movs.length > 0 ? [...task.movs] : [""],
    due_date: task.due_date ? task.due_date.slice(0, 10) : "",
    assigned_to: task.assigned_to != null ? String(task.assigned_to) : "",
    priority: task.priority || "medium",
    timeline_start: task.timeline_start ? task.timeline_start.slice(0, 10) : "",
    timeline_end: task.timeline_end ? task.timeline_end.slice(0, 10) : "",
  };
}

function formEquals(a, b) {
  const trim = (s) => (s || "").trim();
  const movsA = (a.movs || [""]).map((m) => trim(m)).filter(Boolean);
  const movsB = (b.movs || [""]).map((m) => trim(m)).filter(Boolean);
  if (movsA.length !== movsB.length) return false;
  for (let i = 0; i < movsA.length; i++) if (movsA[i] !== movsB[i]) return false;
  return (
    trim(a.title) === trim(b.title) &&
    trim(a.description) === trim(b.description) &&
    trim(a.mfo) === trim(b.mfo) &&
    trim(a.kra) === trim(b.kra) &&
    trim(a.objective) === trim(b.objective) &&
    (a.due_date || "") === (b.due_date || "") &&
    (a.assigned_to || "") === (b.assigned_to || "") &&
    (a.priority || "medium") === (b.priority || "medium") &&
    (a.timeline_start || "") === (b.timeline_start || "") &&
    (a.timeline_end || "") === (b.timeline_end || "")
  );
}

const TaskForm = ({ task, officers = [], onSuccess, onCancel, onDirtyChange, apiBase = "/admin/tasks", showAssignTo = true }) => {
  const isEdit = !!task;
  const [loading, setLoading] = useState(false);
  const [kraSuggestions, setKraSuggestions] = useState([]);
  const [form, setForm] = useState(() => getInitialForm(task));

  const hasHydratedRef = useRef(!task);
  useEffect(() => {
    setForm(getInitialForm(task));
    hasHydratedRef.current = true;
  }, [task]);

  const initialForm = useMemo(() => getInitialForm(task), [task]);
  const allowedKraSet = useMemo(() => {
    const s = new Set(KRA_OPTIONS);
    kraSuggestions.forEach((k) => {
      if (typeof k === "string" && k.trim()) s.add(k.trim());
    });
    if (task?.kra && String(task.kra).trim()) s.add(String(task.kra).trim());
    return s;
  }, [task?.kra, kraSuggestions]);

  const isDirty = hasHydratedRef.current && !formEquals(form, initialForm);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    let cancelled = false;
    api
      .get(kraValuesEndpoint(apiBase))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data.kra_values) ? data.kra_values : [];
        const trimmed = list
          .filter((s) => typeof s === "string" && s.trim() !== "")
          .map((s) => s.trim());
        setKraSuggestions([...new Set(trimmed)]);
      })
      .catch(() => {
        if (!cancelled) setKraSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

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

    if (!form.kra || !String(form.kra).trim()) {
      showAlert.error("Validation", "KRA is required.");
      return;
    }

    const kraTrim = String(form.kra).trim();
    if (!allowedKraSet.has(kraTrim)) {
      showAlert.error("Validation", "Please select a valid KRA from the list.");
      return;
    }

    if (form.timeline_start && form.timeline_end && form.timeline_start > form.timeline_end) {
      showAlert.error("Validation", "Timeline start date must be before or equal to end date.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        mfo: form.mfo.trim() || null,
        kra: form.kra.trim(),
        objective: form.objective.trim() || null,
        movs: form.movs.filter((m) => m.trim()).length > 0 ? form.movs.filter((m) => m.trim()) : null,
        due_date: form.due_date || null,
        priority: form.priority,
        timeline_start: form.timeline_start || null,
        timeline_end: form.timeline_end || null,
      };
      if (showAssignTo) {
        payload.assigned_to = form.assigned_to ? parseInt(form.assigned_to, 10) : null;
      }

      if (isEdit) {
        await api.put(`${apiBase}/${task.id}`, payload);
        showToast.success("Task updated successfully.");
      } else {
        await api.post(apiBase, payload);
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
                KRA <span className="text-danger">*</span>
              </label>
              <SearchableComboBox
                id="task-kra"
                name="kra"
                value={form.kra}
                onChange={(v) => update("kra", v)}
                pinnedOptions={KRA_OPTIONS}
                otherOptions={kraSuggestions}
                placeholder="Please select a KRA from the list"
                disabled={loading}
                allowCustomValue={false}
                required
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
            <div className="col-md-6">
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
                aria-label="Due date"
              />
            </div>
            {showAssignTo && (
              <div className="col-md-6">
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
                  {officers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-md-6">
              <label htmlFor="task-timeline-start" className="account-approvals-action-label">
                Timeline start <span className="text-muted">(optional)</span>
              </label>
              <input
                id="task-timeline-start"
                type="date"
                className="form-control"
                value={form.timeline_start}
                max={form.timeline_end || undefined}
                onChange={(e) => {
                  const value = e.target.value;
                  update("timeline_start", value);
                  if (form.timeline_end && value && value > form.timeline_end) {
                    update("timeline_end", value);
                  }
                }}
                disabled={loading}
                aria-label="Timeline start date"
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
                min={form.timeline_start || undefined}
                onChange={(e) => {
                  const value = e.target.value;
                  if (form.timeline_start && value && value < form.timeline_start) {
                    showAlert.warning("Validation", "Timeline end must be after or equal to start date.");
                    return;
                  }
                  update("timeline_end", value);
                }}
                disabled={loading}
                aria-label="Timeline end date"
              />
              {form.timeline_start && form.timeline_end && form.timeline_start > form.timeline_end && (
                <div className="small text-danger mt-1">End date must be after start date</div>
              )}
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
