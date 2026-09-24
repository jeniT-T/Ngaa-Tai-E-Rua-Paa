import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Edit3,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useNavigate } from "react-router-dom";
import { useTasks } from "../../context/TaskContext.jsx";
import "./CalendarCaretaker.css";

const urgencyOptions = {
  low: { label: "Low", color: "#059669", background: "#ecfdf5", border: "#10b981" },
  medium: { label: "Medium", color: "#2563eb", background: "#eff6ff", border: "#3b82f6" },
  high: { label: "High", color: "#d97706", background: "#fffbeb", border: "#f59e0b" },
  urgent: { label: "Urgent", color: "#e11d48", background: "#fff1f2", border: "#fb7185" },
};

export default function CalendarCaretaker() {
  const navigate = useNavigate();
  const { tasks, addTask, updateTask, completeTask, deleteTask } = useTasks();

  const [today, setToday] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    const syncToday = () => {
      const now = new Date();

      setToday((prev) => {
        if (!isSameDay(prev, now)) {
          setSelectedDate(now);
          setCurrentMonth(now);
        }
        return now;
      });
    };

    syncToday();
    const timer = setInterval(syncToday, 60000);
    return () => clearInterval(timer);
  }, []);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedDateString = format(selectedDate, "yyyy-MM-dd");

  const selectedTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => task.date === selectedDateString)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  }, [tasks, selectedDateString]);

  const completedTasks = selectedTasks.filter((task) => task.completed).length;

  const openScheduleForDate = (date) => {
    navigate(`/caretaker/schedule?date=${format(date, "yyyy-MM-dd")}`);
  };

  const handleSaveTask = (taskData, currentTask = null) => {
    if (currentTask) {
      updateTask(currentTask.id, taskData);
    } else {
      addTask(taskData);
    }

    setDialogOpen(false);
    setEditingTask(null);
  };

  const startEditing = (task) => {
    if (task.completed) return;
    setEditingTask(task);
    setDialogOpen(true);
  };

  const requestDeleteTask = (taskId) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.completed) return;
    setTaskToDelete(taskId);
  };

  const confirmDeleteTask = () => {
    if (!taskToDelete) return;

    const task = tasks.find((item) => item.id === taskToDelete);
    if (!task || task.completed) {
      setTaskToDelete(null);
      return;
    }

    deleteTask(taskToDelete);
    setExpandedTaskId(null);
    setTaskToDelete(null);
  };

  const cancelDeleteTask = () => setTaskToDelete(null);

  const deletingTask = tasks.find((task) => task.id === taskToDelete) || null;

  return (
    <div className="caretaker-calendar-page">
      <div className="caretaker-calendar-layout">
        <section className="calendar-panel">
          <div className="calendar-header">
            <div>
              <h2>{format(currentMonth, "MMMM yyyy")}</h2>
              {!isSameMonth(currentMonth, today) && (
                <button type="button" className="today-button" onClick={() => {
                  const now = new Date();
                  setToday(now);
                  setSelectedDate(now);
                  setCurrentMonth(now);
                }}>
                  Today
                </button>
              )}
            </div>

            <div className="calendar-navigation">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setCurrentMonth((month) => subMonths(month, 1))}
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                aria-label="Next month"
                onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="calendar-weekdays">
            {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDate);
              const isOutsideMonth = !isSameMonth(day, currentMonth);
              const tasksOnDay = tasks.filter((task) => task.date === dateKey && !task.completed);

              return (
                <button
                  type="button"
                  key={dateKey}
                  className={[
                    "calendar-day",
                    isToday ? "today" : "",
                    isSelected ? "selected" : "",
                    isOutsideMonth ? "outside-month" : "",
                  ].join(" ")}
                  onClick={() => openScheduleForDate(day)}
                >
                  <span>{format(day, "d")}</span>

                  {tasksOnDay.length > 0 && (
                    <div className="calendar-task-dots">
                      {tasksOnDay.slice(0, 3).map((task) => (
                        <span
                          key={task.id}
                          className="task-dot"
                          style={{ background: urgencyOptions[task.urgency]?.color }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="tasks-panel">
          <div className="task-panel-header">
            <div>
              <h2>{format(selectedDate, "EEEE, MMM d")}</h2>
              <p>
                {selectedTasks.length} {selectedTasks.length === 1 ? "task" : "tasks"} · {completedTasks} done
              </p>
            </div>

            <button
              type="button"
              className="add-task-button"
              onClick={() => {
                setEditingTask(null);
                setDialogOpen(true);
              }}
            >
              <Plus size={18} />
              Task
            </button>
          </div>

          {selectedTasks.length === 0 && (
            <div className="no-tasks">
              <div className="no-task-icon">
                <Check size={30} />
              </div>
              <h3>No tasks for this day</h3>
              <p>Click "+ Task" to add one.</p>
            </div>
          )}

          <div className="task-list">
            {selectedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                expanded={expandedTaskId === task.id}
                onExpand={() =>
                  setExpandedTaskId((current) => (current === task.id ? null : task.id))
                }
                onComplete={() => completeTask(task.id)}
                onEdit={() => startEditing(task)}
                onDelete={() => requestDeleteTask(task.id)}
              />
            ))}
          </div>
        </section>
      </div>

      {dialogOpen && (
        <TaskDialog
          selectedDate={selectedDate}
          task={editingTask}
          onClose={() => {
            setDialogOpen(false);
            setEditingTask(null);
          }}
          onSave={(taskData) => handleSaveTask(taskData, editingTask)}
        />
      )}

      {taskToDelete && deletingTask && (
        <div
          className="delete-dialog-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelDeleteTask();
          }}
        >
          <div className="delete-dialog">
            <div className="delete-dialog-icon">
              <AlertTriangle size={28} />
            </div>

            <h2>Delete Task?</h2>
            <p className="delete-task-name">"{deletingTask.title}"</p>
            <p>Are you sure you want to delete this task? This action cannot be undone.</p>

            <div className="delete-dialog-actions">
              <button type="button" className="delete-cancel-button" onClick={cancelDeleteTask}>
                Cancel
              </button>
              <button type="button" className="delete-confirm-button" onClick={confirmDeleteTask}>
                <Trash2 size={16} />
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, expanded, onExpand, onComplete, onEdit, onDelete }) {
  const urgency = urgencyOptions[task.urgency] || urgencyOptions.medium;

  return (
    <div
      className={`task-card ${task.completed ? "task-completed" : ""}`}
      style={{
        borderColor: task.completed ? "#e5e7eb" : urgency.border,
        background: task.completed ? "#ffffff" : urgency.background,
      }}
    >
      <button type="button" className="task-main" onClick={onExpand}>
        <span
          className="task-color"
          style={{ background: task.completed ? "#9ca3af" : urgency.color }}
        />

        <div className="task-information">
          <h3>{task.title}</h3>

          <div className="task-meta">
            <span
              className="urgency-label"
              style={{ color: task.completed ? "#6b7280" : urgency.color }}
            >
              {task.completed ? "Completed" : urgency.label}
            </span>

            {(task.startTime || task.endTime) && (
              <span className="task-time">
                <Clock size={15} />
                {task.startTime || "--:--"}
                {task.endTime && ` – ${task.endTime}`}
              </span>
            )}

            {task.startTime && task.endTime && (
              <span className="duration">{calculateDuration(task.startTime, task.endTime)}</span>
            )}
          </div>
        </div>

        <div className="expand-icon">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {expanded && (
        <div className="task-expanded">
          <div className="task-notes">
            <strong>Notes</strong>
            <p>{task.notes?.trim() ? task.notes : "No additional notes were added."}</p>
          </div>

          <div className="task-expanded-details">
            <div>
              <span>Date</span>
              <strong>{format(parseISO(task.date), "EEEE, d MMMM yyyy")}</strong>
            </div>

            <div>
              <span>Priority</span>
              <strong style={{ color: task.completed ? "#6b7280" : urgency.color }}>
                {urgency.label}
              </strong>
            </div>

            {task.startTime && (
              <div>
                <span>Start</span>
                <strong>{formatTaskTime(task.startTime)}</strong>
              </div>
            )}

            {task.endTime && (
              <div>
                <span>Finish</span>
                <strong>{formatTaskTime(task.endTime)}</strong>
              </div>
            )}
          </div>

          <div className="task-actions">
            <button
              type="button"
              className="complete-button"
              disabled={task.completed}
              onClick={onComplete}
            >
              <Check size={17} />
              {task.completed ? "Completed" : "Mark done"}
            </button>

            <button
              type="button"
              className="edit-button"
              disabled={task.completed}
              onClick={onEdit}
            >
              <Edit3 size={17} />
              Edit
            </button>

            <button
              type="button"
              className="delete-button"
              disabled={task.completed}
              onClick={onDelete}
            >
              <Trash2 size={17} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskDialog({ selectedDate, task, onClose, onSave }) {
  const [title, setTitle] = useState(task?.title || "");
  const [date, setDate] = useState(task?.date || format(selectedDate, "yyyy-MM-dd"));
  const [urgency, setUrgency] = useState(task?.urgency || "medium");
  const [startTime, setStartTime] = useState(task?.startTime || "");
  const [endTime, setEndTime] = useState(task?.endTime || "");
  const [notes, setNotes] = useState(task?.notes || "");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Please enter a task name.");
      return;
    }

    if (startTime && endTime && endTime <= startTime) {
      setError("Finish time must be after start time.");
      return;
    }

    setError("");

    onSave({
      title: title.trim(),
      date,
      urgency,
      startTime,
      endTime,
      notes: notes.trim(),
    });
  };

  return (
    <div
      className="dialog-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="task-dialog">
        <div className="dialog-header">
          <div>
            <h2>{task ? "Edit Task" : "Add New Task"}</h2>
            <p>{task ? "Update your task." : "Create a new calendar task."}</p>
          </div>

          <button type="button" className="close-dialog" onClick={onClose}>
            <X size={21} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>What needs to be done?</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Fix Oven in the kitchen"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>How urgent is this task?</label>

            <div className="urgency-options">
              {Object.entries(urgencyOptions).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  className={`urgency-option ${urgency === key ? "urgency-selected" : ""}`}
                  style={{
                    "--urgency-color": value.color,
                    "--urgency-bg": value.background,
                  }}
                  onClick={() => setUrgency(key)}
                >
                  <span style={{ background: value.color }} />
                  {value.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Finish time</label>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </div>

          {startTime && endTime && (
            <div className="duration-preview">
              <Clock size={16} />
              Estimated duration: <strong>{calculateDuration(startTime, endTime)}</strong>
            </div>
          )}

          <div className="form-group">
            <label>Additional notes</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Write extra information here..."
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="dialog-actions">
            <button type="button" className="cancel-dialog-button" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="save-task-button">
              {task ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return "";

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const totalMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (totalMinutes <= 0) return "";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function formatTaskTime(time) {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, "h:mm a");
}