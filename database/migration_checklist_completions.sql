CREATE TABLE IF NOT EXISTS checklist_completions (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  checklist_id INTEGER REFERENCES checklists(id) ON DELETE SET NULL,
  checklist_title TEXT NOT NULL,
  completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  completed_by_name TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  items JSONB NOT NULL,
  UNIQUE (booking_id, checklist_id)
);
