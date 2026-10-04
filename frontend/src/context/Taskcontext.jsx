import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext.jsx";

const TaskContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

// Backend rows use snake_case and a DATE column that serializes as a full
// ISO timestamp (e.g. "2026-10-03T00:00:00.000Z") — trim it back down to
// the plain "yyyy-MM-dd" string the calendar/schedule pages already filter
// and sort by, so nothing downstream needs to change.
function mapTask(row) {
  return {
    id: String(row.id),
    title: row.title,
    date: typeof row.date === "string" ? row.date.slice(0, 10) : row.date,
    startTime: row.start_time || "",
    endTime: row.end_time || "",
    urgency: row.urgency || "medium",
    notes: row.notes || "",
    completed: row.completed,
    createdAt: row.created_at,
  };
}

// Previously per-browser localStorage (one caretaker, one browser, fine at
// the time) — now backed by the shared `caretaker_tasks` table so
// caretaker and manager see and work from the exact same list, since
// there's only one caretaker and the manager needs the same view. See
// database/migration_caretaker_tasks.sql. The consumer-facing API
// (tasks/addTask/updateTask/completeTask/deleteTask) is unchanged —
// CalendarCaretaker.jsx and ScheduleCaretaker.jsx needed no rewrites.
// Only caretaker/manager/admin can read this at all (see
// backend/routes/caretakerTasks.js) — checking the role here too, before
// ever calling fetch, means a member or logged-out visitor never fires a
// request that the backend would just 401/403 anyway.
const STAFF_ROLES = new Set(["caretaker", "manager", "admin"]);

export function TaskProvider({ children }) {
  const { user } = useAuth();
  const isStaff = user && STAFF_ROLES.has(user.role);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Deliberately a plain function returning a promise chain, not an async
  // function — every setState call below sits inside a .then()/.catch()
  // callback (deferred to a microtask), never synchronously in the
  // function's own call frame. That matters because this gets called
  // directly from the mount effect below: an async function that sets
  // state *before* its first `await` would run that part synchronously
  // during the effect, which is exactly the anti-pattern the project's
  // own set-state-in-effect lint rule flags (see useSiteSettings.js for
  // the same shape, and the project doc's note on two pre-existing
  // instances of the opposite, synchronous version that were cleaned up
  // alongside this).
  const refresh = useCallback(() => {
    if (!isStaff) {
      return Promise.resolve().then(() => {
        setTasks([]);
        setLoading(false);
      });
    }
    return fetch(`${API_BASE}/caretaker-tasks`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setTasks((data.tasks || []).map(mapTask));
      })
      .catch(() => {
        // A transient network blip shouldn't wipe out whatever's already
        // loaded — just leave the existing list in place and try again
        // next time something changes.
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isStaff]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTask = useCallback(
    async (taskData) => {
      try {
        const res = await fetch(`${API_BASE}/caretaker-tasks`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (res.ok) await refresh();
      } catch {
        // swallow — the dialog that called this already closed optimistically;
        // a failed save just means the task won't appear after refresh.
      }
    },
    [refresh]
  );

  const updateTask = useCallback(
    async (taskId, changes) => {
      try {
        const res = await fetch(`${API_BASE}/caretaker-tasks/${taskId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        });
        if (res.ok) await refresh();
      } catch {
        // see addTask
      }
    },
    [refresh]
  );

  const completeTask = useCallback(
    async (taskId) => {
      try {
        const res = await fetch(`${API_BASE}/caretaker-tasks/${taskId}/complete`, {
          method: "PATCH",
          credentials: "include",
        });
        if (res.ok) await refresh();
      } catch {
        // see addTask
      }
    },
    [refresh]
  );

  const deleteTask = useCallback(
    async (taskId) => {
      try {
        const res = await fetch(`${API_BASE}/caretaker-tasks/${taskId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) await refresh();
      } catch {
        // see addTask
      }
    },
    [refresh]
  );

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        addTask,
        updateTask,
        completeTask,
        deleteTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  return useContext(TaskContext);
}
