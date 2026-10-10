import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext.jsx";

const TaskContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;


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


const STAFF_ROLES = new Set(["caretaker", "manager", "admin"]);

export function TaskProvider({ children }) {
  const { user } = useAuth();
  const isStaff = user && STAFF_ROLES.has(user.role);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);


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
