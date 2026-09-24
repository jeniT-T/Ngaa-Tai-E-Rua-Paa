import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const TaskContext = createContext();

const STORAGE_KEY = "caretaker-calendar-tasks";

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState(() => {
    try {
      const savedTasks =
        localStorage.getItem(STORAGE_KEY);

      return savedTasks
        ? JSON.parse(savedTasks)
        : [];
    } catch {
      return [];
    }
  });

  // Save every change automatically
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tasks)
    );
  }, [tasks]);

  // Add task
  const addTask = (taskData) => {
    const newTask = {
      id: crypto.randomUUID(),
      ...taskData,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks((previous) => [
      ...previous,
      newTask,
    ]);
  };

  // Update task
  const updateTask = (taskId, changes) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...changes,
            }
          : task
      )
    );
  };

  // Complete task
  const completeTask = (taskId) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: true,
            }
          : task
      )
    );
  };

  // Delete task
  const deleteTask = (taskId) => {
    setTasks((previous) =>
      previous.filter(
        (task) => task.id !== taskId
      )
    );
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
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