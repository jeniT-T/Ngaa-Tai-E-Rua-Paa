-- database/migration_caretaker_tasks.sql
--
-- The caretaker's own task calendar/schedule (CalendarCaretaker.jsx /
-- ScheduleCaretaker.jsx) stored its tasks in per-browser localStorage —
-- fine while only one person ever looked at it, but there's only one
-- caretaker and the manager now needs to see (and work from) the exact
-- same list, which localStorage can't do. This moves that data into the
-- database, shared by anyone who can reach the calendar (caretaker,
-- manager, admin — see backend/routes/caretakerTasks.js).
CREATE TABLE caretaker_tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  -- Plain "HH:MM" strings, not a TIME column — this matches exactly what
  -- the existing <input type="time"> fields already produced under the old
  -- localStorage version, so the frontend's formatting/sorting code (which
  -- does plain string comparisons like `.localeCompare`) needed no changes.
  start_time VARCHAR(5),
  end_time VARCHAR(5),
  urgency VARCHAR(20) NOT NULL DEFAULT 'medium',
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_caretaker_tasks_date ON caretaker_tasks(date);
