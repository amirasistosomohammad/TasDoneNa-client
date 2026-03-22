import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaClock, FaCheckCircle, FaList } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { api } from "../../services/api.js";
import Portal from "../../components/Portal.jsx";
import "./Calendar.css";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function ymdLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthYearTitle(date) {
  try {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
}

function formatShortDate(ymd) {
  if (!ymd) return "—";
  try {
    const d = new Date(ymd + "T12:00:00");
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return ymd;
  }
}

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildCalendarGrid(referenceDate) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const firstDayOfWeek = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday

  const cells = [];
  const todayStr = ymdLocal(new Date());

  const startDate = new Date(year, month, 1 - firstDayOfWeek);

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const iso = ymdLocal(d);
    const inCurrentMonth = m === month;

    cells.push({
      date: d,
      dateStr: iso,
      label: day,
      inCurrentMonth,
      isToday: iso === todayStr,
    });
  }

  return cells;
}

function isOverdue(task) {
  return (
    task?.status !== "completed" &&
    task?.due_date &&
    task.due_date < ymdLocal(new Date())
  );
}

/**
 * Personnel Calendar – monthly view of task due dates.
 * Adapted from TheMidTaskApp; uses TasDoneNa color scheme and task structure.
 */
export default function Calendar() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [monthDate, setMonthDate] = useState(() => startOfDay(new Date()));
  const [selectedDateStr, setSelectedDateStr] = useState(() => ymdLocal(new Date()));
  const [fullAmountModal, setFullAmountModal] = useState(null); // { label, value }
  const [fullAmountModalClosing, setFullAmountModalClosing] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (user?.role !== "officer") {
      setLoading(false);
      setTasks([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get("/tasks");
      setTasks(data?.tasks || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const isOfficer = user?.role === "officer";

  const calendarCells = useMemo(() => buildCalendarGrid(monthDate), [monthDate]);

  const tasksByDate = useMemo(() => {
    const map = {};
    for (const task of tasks || []) {
      const key = task?.due_date ? task.due_date.slice(0, 10) : null;
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        const an = (a.title || "").toLowerCase();
        const bn = (b.title || "").toLowerCase();
        return an.localeCompare(bn);
      });
    });
    return map;
  }, [tasks]);

  const selectedTasks = useMemo(
    () => tasksByDate[selectedDateStr] || [],
    [tasksByDate, selectedDateStr]
  );

  const stats = useMemo(() => {
    let pending = 0;
    let overdue = 0;
    let completed = 0;
    for (const task of tasks || []) {
      if (task.status === "completed") {
        completed++;
      } else if (isOverdue(task)) {
        overdue++;
      } else if (task.status === "pending" || task.status === "in_progress") {
        pending++;
      }
    }
    return { pending, overdue, completed };
  }, [tasks]);

  const handlePrevMonth = () => {
    setMonthDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return startOfDay(d);
    });
  };

  const handleNextMonth = () => {
    setMonthDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return startOfDay(d);
    });
  };

  const handleToday = () => {
    const today = startOfDay(new Date());
    setMonthDate(today);
    setSelectedDateStr(ymdLocal(today));
  };

  if (!isOfficer) {
    return (
      <div className="container-fluid px-3 px-md-4 py-4">
        <div className="calendar-pending-note">
          <p className="mb-0">Calendar is available for personnel only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-md-4">
      {/* Page header – same as Personnel directory */}
      <div className="account-approvals-page-header d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4 mb-3">
        <h1 className="h4 mb-0 fw-bold d-flex align-items-center gap-2 account-approvals-page-title">
          <span className="account-approvals-page-icon" aria-hidden>
            <FaCalendarAlt />
          </span>
          Work calendar
        </h1>
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

      {/* Summary stats panel – same as Personnel directory (personnel-stats-card) */}
      <div className="personnel-stats-panel mb-4">
        <div className="row g-3">
          <div className="col-6 col-md-3 col-lg">
            <div className="personnel-stats-card task-stats-card-pending">
              <div className="personnel-stats-card-icon" aria-hidden>
                <FaList />
              </div>
              <div className="personnel-stats-card-body">
                <span className="personnel-stats-card-label">Pending</span>
                <div className="personnel-stats-card-value-row">
                  <span className="personnel-stats-card-value">
                    {loading ? "—" : stats.pending}
                  </span>
                  {!loading && (
                    <button
                      type="button"
                      className="personnel-stats-view-full"
                      onClick={() => setFullAmountModal({ label: "Pending", value: stats.pending })}
                      aria-label="See exact count for Pending"
                    >
                      See exact count
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3 col-lg">
            <div className="personnel-stats-card personnel-stats-card-rejected">
              <div className="personnel-stats-card-icon" aria-hidden>
                <FaClock />
              </div>
              <div className="personnel-stats-card-body">
                <span className="personnel-stats-card-label">Overdue</span>
                <div className="personnel-stats-card-value-row">
                  <span className="personnel-stats-card-value">
                    {loading ? "—" : stats.overdue}
                  </span>
                  {!loading && (
                    <button
                      type="button"
                      className="personnel-stats-view-full"
                      onClick={() => setFullAmountModal({ label: "Overdue", value: stats.overdue })}
                      aria-label="See exact count for Overdue"
                    >
                      See exact count
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3 col-lg">
            <div className="personnel-stats-card personnel-stats-card-active">
              <div className="personnel-stats-card-icon" aria-hidden>
                <FaCheckCircle />
              </div>
              <div className="personnel-stats-card-body">
                <span className="personnel-stats-card-label">Completed</span>
                <div className="personnel-stats-card-value-row">
                  <span className="personnel-stats-card-value">
                    {loading ? "—" : stats.completed}
                  </span>
                  {!loading && (
                    <button
                      type="button"
                      className="personnel-stats-view-full"
                      onClick={() => setFullAmountModal({ label: "Completed", value: stats.completed })}
                      aria-label="See exact count for Completed"
                    >
                      See exact count
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {fullAmountModal && (
        <Portal>
          <div
            className="account-approvals-detail-overlay"
            aria-modal="true"
            role="dialog"
            aria-labelledby="full-amount-modal-title"
          >
            <div
              className={`account-approvals-detail-backdrop modal-backdrop-animation${fullAmountModalClosing ? " exit" : ""}`}
              onClick={() => {
                if (!fullAmountModalClosing) {
                  setFullAmountModalClosing(true);
                  setTimeout(() => {
                    setFullAmountModal(null);
                    setFullAmountModalClosing(false);
                  }, 200);
                }
              }}
              aria-hidden
            />
            <div className={`account-approvals-detail-modal personnel-full-amount-modal modal-content-animation${fullAmountModalClosing ? " exit" : ""}`}>
              <div className="account-approvals-detail-header">
                <h5 id="full-amount-modal-title" className="mb-0 fw-semibold personnel-full-amount-modal-title">
                  {fullAmountModal.label}
                </h5>
                <button
                  type="button"
                  className="btn-close-custom"
                  onClick={() => {
                    if (!fullAmountModalClosing) {
                      setFullAmountModalClosing(true);
                      setTimeout(() => {
                        setFullAmountModal(null);
                        setFullAmountModalClosing(false);
                      }, 200);
                    }
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="personnel-full-amount-modal-body">
                <p className="personnel-full-amount-modal-value mb-0" aria-live="polite">
                  {Number(fullAmountModal.value || 0).toLocaleString()}
                </p>
              </div>
              <div className="account-approvals-detail-footer">
                <button
                  type="button"
                  className="btn btn-primary account-approvals-detail-close-btn"
                  onClick={() => {
                    if (!fullAmountModalClosing) {
                      setFullAmountModalClosing(true);
                      setTimeout(() => {
                        setFullAmountModal(null);
                        setFullAmountModalClosing(false);
                      }, 200);
                    }
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      <div className="card border-0 shadow-sm account-approvals-card">
        <div className="card-header bg-white border-bottom account-approvals-card-header d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-2">
          <div>
            <h6 className="mb-0 fw-semibold account-approvals-card-title">
              {formatMonthYearTitle(monthDate)}
            </h6>
            <p className="small text-muted mb-0 mt-1">
              Monitor task due dates in a structured monthly calendar view.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center justify-content-center"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <FaChevronLeft />
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-2"
              onClick={handleToday}
            >
              Today
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center justify-content-center"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="small text-muted mt-2 mb-0">Loading calendar…</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="account-approvals-empty-state">
          <div className="account-approvals-empty-state-icon">
            <FaCalendarAlt aria-hidden />
          </div>
          <h3 className="account-approvals-empty-state-title">No tasks yet</h3>
          <p className="account-approvals-empty-state-text">
            Create your first task using the Create task button in the My tasks section to see it on this calendar.
          </p>
          <Link to="/my-tasks/create" className="btn account-approvals-empty-state-btn">
            Create task
          </Link>
        </div>
      ) : (
        <div className="calendar-layout p-3">
          <div className="calendar-grid-card">
            <div className="calendar-grid-header">
              {weekdayLabels.map((label) => (
                <div key={label} className="calendar-weekday">
                  {label}
                </div>
              ))}
            </div>
            <div className="calendar-grid-body">
              {calendarCells.map((cell) => {
                const dayTasks = tasksByDate[cell.dateStr] || [];
                const isSelected = cell.dateStr === selectedDateStr;
                return (
                  <div
                    key={cell.dateStr}
                    role="button"
                    tabIndex={0}
                    className={`calendar-day-cell ${!cell.inCurrentMonth ? "calendar-day-outside" : ""} ${cell.isToday ? "calendar-day-today" : ""} ${isSelected ? "calendar-day-selected" : ""}`}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedDateStr(cell.dateStr);
                      }
                    }}
                    aria-label={`${cell.label}${cell.isToday ? " (Today)" : ""}, ${dayTasks.length} task${dayTasks.length !== 1 ? "s" : ""}`}
                  >
                    <div className="calendar-day-label-row">
                      <span className="calendar-day-number">{cell.label}</span>
                      {cell.isToday && <span className="calendar-day-pill">Today</span>}
                    </div>
                    <div className="calendar-day-events">
                      {dayTasks.slice(0, 3).map((task) => {
                        const isCompleted = task.status === "completed";
                        const statusClass = isCompleted
                          ? "calendar-event-completed"
                          : isOverdue(task)
                            ? "calendar-event-overdue"
                            : "calendar-event-pending";
                        return (
                          <div
                            key={task.id}
                            className={`calendar-event-pill ${statusClass}`}
                            title={task.title}
                          >
                            <span className="calendar-event-dot" aria-hidden />
                            <span className="calendar-event-text">{task.title || "Task"}</span>
                          </div>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <span className="calendar-event-more">+{dayTasks.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="calendar-side-panel">
            <div className="calendar-side-header">
              <h2 className="calendar-side-title">
                Tasks on {formatShortDate(selectedDateStr)}
              </h2>
              <p className="calendar-side-subtitle">
                {selectedTasks.length === 0
                  ? "No tasks due on this date."
                  : `${selectedTasks.length} task${selectedTasks.length !== 1 ? "s" : ""} due on this date.`}
              </p>
            </div>
            {selectedTasks.length === 0 ? (
              <p className="calendar-side-empty">
                Choose another date on the calendar to view its tasks.
              </p>
            ) : (
              <ul className="calendar-side-list">
                {selectedTasks.map((task) => {
                  const statusText =
                    task.status === "completed"
                      ? "Completed"
                      : isOverdue(task)
                        ? "Overdue"
                        : "Pending";
                  return (
                    <li key={task.id} className="calendar-side-item">
                      <Link
                        to={`/my-tasks/${task.id}`}
                        className="calendar-side-link"
                      >
                        <div className="calendar-side-main">
                          <span className="calendar-side-task-name">{task.title || "Task"}</span>
                          <span className="calendar-side-status">{statusText}</span>
                        </div>
                        <div className="calendar-side-meta">
                          <span>Due {formatShortDate(task.due_date)}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
          )}
        </div>
      </div>
    </div>
  );
}
