import React, { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  addDays,
  format,
  parseISO,
  subDays,
} from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTasks } from "../../context/TaskContext.jsx";
import "./ScheduleCaretaker.css";

const priorityStyles = {
  urgent: { name: "Urgent", color: "#ef4444", background: "#fee2e2", border: "#ef4444" },
  high: { name: "High", color: "#f59e0b", background: "#fef3c7", border: "#f59e0b" },
  medium: { name: "Medium", color: "#3b82f6", background: "#dbeafe", border: "#3b82f6" },
  low: { name: "Low", color: "#10b981", background: "#d1fae5", border: "#10b981" },
};

const TIMELINE_START_HOUR = 6;
const TIMELINE_END_HOUR = 22;
const HOUR_HEIGHT = 72;

const timelineHours = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
  (_, i) => TIMELINE_START_HOUR + i
);

export default function ScheduleCaretaker() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tasks, addTask, updateTask, completeTask, deleteTask } = useTasks();

  const selectedDate = searchParams.get("date")
    ? parseISO(searchParams.get("date"))
    : new Date();

  const selectedDateString = format(selectedDate, "yyyy-MM-dd");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const dayTasks = useMemo(() => {
    return tasks
      .filter((task) => task.date === selectedDateString)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  }, [tasks, selectedDateString]);

  const completedCount = dayTasks.filter((task) => task.completed).length;

  const changeDate = (date) => {
    navigate(`/caretaker/schedule?date=${format(date, "yyyy-MM-dd")}`);
  };

  const handleSaveTask = (taskData, task = null) => {
    if (task) {
      updateTask(task.id, taskData);
    } else {
      addTask(taskData);
    }

    setAddDialogOpen(false);
    setEditingTask(null);
  };

  const confirmDelete = () => {
    if (!taskToDelete) return;
    deleteTask(taskToDelete.id);
    setTaskToDelete(null);
  };

  return (
    <div className="schedule-caretaker-page">
      <div className="schedule-top-panel">
        <div className="schedule-header">
          <div>
            <h1>Daily Timeline</h1>
            <p>
              {dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"} · {completedCount} done
            </p>
          </div>

          <div className="schedule-date-navigation">
            <button type="button" onClick={() => changeDate(subDays(selectedDate, 1))}>
              <ChevronLeft size={20} />
            </button>

            <div className="schedule-current-date">{format(selectedDate, "EEE, MMM d")}</div>

            <button type="button" onClick={() => changeDate(addDays(selectedDate, 1))}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="schedule-priority-legend">
          {Object.entries(priorityStyles).map(([key, priority]) => (
            <span
              key={key}
              style={{
                color: priority.color,
                borderColor: priority.border,
                background: priority.background,
              }}
            >
              <i style={{ background: priority.color }} />
              {priority.name}
            </span>
          ))}
        </div>
      </div>

      <div className="schedule-timeline">
        <div className="schedule-time-column">
          {timelineHours.map((hour) => (
            <div key={hour} className="schedule-time-label">
              {formatHour(hour)}
            </div>
          ))}
        </div>

        <div
          className="schedule-timeline-content"
          style={{ height: timelineHours.length * HOUR_HEIGHT }}
        >
          {timelineHours.map((hour) => (
            <div
              key={hour}
              className="schedule-hour-line"
              style={{ height: HOUR_HEIGHT }}
            />
          ))}

          {dayTasks.length === 0 && (
            <div className="schedule-no-tasks">
              <h2>
                <Clock size={38} />
                No tasks scheduled
              </h2>
              <p>No tasks for {format(selectedDate, "d MMMM yyyy")}.</p>
            </div>
          )}

          {dayTasks.map((task) => {
            const priority = priorityStyles[task.urgency] || priorityStyles.medium;
            const position = getTaskPosition(task.startTime, task.endTime);
            const duration = calculateDuration(task.startTime, task.endTime);

            return (
              <div
                key={task.id}
                className={`schedule-event ${task.completed ? "schedule-event-completed" : ""}`}
                style={{
                  top: position.top,
                  height: position.height,
                  background: priority.background,
                  borderLeft: `5px solid ${priority.color}`,
                }}
              >
                <div className="schedule-event-main">
                  <div className="schedule-event-info">
                    <h3>{task.title}</h3>
                    <div className="schedule-event-meta">
                      <span style={{ color: priority.color }}>{priority.name}</span>
                      {task.startTime && task.endTime && (
                        <span>
                          {formatTime(task.startTime)} – {formatTime(task.endTime)}
                        </span>
                      )}
                      {duration && <span>{duration}</span>}
                    </div>
                  </div>

                  {!task.completed && (
                    <div className="schedule-event-buttons">
                      <button type="button" onClick={() => setEditingTask({ ...task })}>
                        <Edit3 size={15} />
                      </button>
                      <button type="button" onClick={() => setTaskToDelete(task)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {task.notes && position.height > 85 && (
                  <p className="schedule-event-notes">{task.notes}</p>
                )}

                <button
                  type="button"
                  className="schedule-event-complete"
                  disabled={task.completed}
                  onClick={() => completeTask(task.id)}
                >
                  <Check size={14} />
                  {task.completed ? "Completed" : "Mark done"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="schedule-floating-add"
        onClick={() => setAddDialogOpen(true)}
      >
        <Plus size={27} />
      </button>

      {addDialogOpen && (
        <TaskDialog
          selectedDate={selectedDate}
          onClose={() => setAddDialogOpen(false)}
          onSave={(taskData) => handleSaveTask(taskData)}
        />
      )}

      {editingTask && (
        <TaskDialog
          selectedDate={selectedDate}
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(taskData) => handleSaveTask(taskData, editingTask)}
        />
      )}

      {taskToDelete && (
        <div className="schedule-modal-overlay">
          <div className="schedule-delete-dialog">
            <div className="schedule-delete-icon">
              <Trash2 size={24} />
            </div>

            <h2>Delete Task?</h2>
            <strong>{taskToDelete.title}</strong>
            <p>Are you sure you want to delete this task? This action cannot be undone.</p>

            <div className="schedule-delete-actions">
              <button type="button" className="schedule-cancel-button" onClick={() => setTaskToDelete(null)}>
                Cancel
              </button>
              <button type="button" className="schedule-delete-confirm" onClick={confirmDelete}>
                Delete Task
              </button>
            </div>
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

  const submitTask = (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Please enter a task name.");
      return;
    }

    if (!startTime) {
      setError("Please enter a start time.");
      return;
    }

    if (!endTime) {
      setError("Please enter a finish time.");
      return;
    }

    if (endTime <= startTime) {
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
    <div className="schedule-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="schedule-task-dialog">
        <div className="schedule-dialog-header">
          <div>
            <h2>{task ? "Edit Task" : "Add New Task"}</h2>
            <p>{task ? "Update your task details." : "Create a new task."}</p>
          </div>

          <button type="button" onClick={onClose}>
            <X size={21} />
          </button>
        </div>

        <form onSubmit={submitTask}>
          <div className="schedule-form-group">
            <label>What needs to be done?</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Garden cleaning"
              autoFocus
            />
          </div>

          <div className="schedule-form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="schedule-form-group">
            <label>How urgent is this task?</label>
            <div className="schedule-urgency-options">
              {Object.entries(priorityStyles).map(([key, priority]) => (
                <button
                  key={key}
                  type="button"
                  className={urgency === key ? "schedule-urgency-selected" : ""}
                  style={{
                    "--urgency-color": priority.color,
                    "--urgency-background": priority.background,
                  }}
                  onClick={() => setUrgency(key)}
                >
                  <span style={{ background: priority.color }} />
                  {priority.name}
                </button>
              ))}
            </div>
          </div>

          <div className="schedule-time-row">
            <div className="schedule-form-group">
              <label>Start time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>

            <div className="schedule-form-group">
              <label>Finish time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          {startTime && endTime && endTime > startTime && (
            <div className="schedule-duration-preview">
              <Clock size={16} />
              Estimated duration: <strong>{calculateDuration(startTime, endTime)}</strong>
            </div>
          )}

          <div className="schedule-form-group">
            <label>Additional notes</label>
            <textarea
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional information..."
            />
          </div>

          {error && <p className="schedule-form-error">{error}</p>}

          <div className="schedule-dialog-actions">
            <button type="button" className="schedule-cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="schedule-save-button">
              {task ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getTaskPosition(startTime, endTime) {
  if (!startTime || !endTime) {
    return { top: 0, height: HOUR_HEIGHT };
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const timelineStart = TIMELINE_START_HOUR * 60;

  const topMinutes = startTotal - timelineStart;
  const durationMinutes = endTotal - startTotal;
  const pixelsPerMinute = HOUR_HEIGHT / 60;

  return {
    top: Math.max(topMinutes * pixelsPerMinute, 0),
    height: Math.max(durationMinutes * pixelsPerMinute, 46),
  };
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

function formatTime(time) {
  if (!time) return "";
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return format(date, "h:mm a");
}

function formatHour(hour) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return format(date, "h:mm a");
}