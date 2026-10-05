-- database/migration_equipment.sql
--
-- Equipment inventory for the caretaker (S36: "As a caretaker I want to be
-- able to see what equipment is available and its condition"). An earlier
-- placeholder "Equipment Inventory" card existed on the caretaker dashboard
-- early in development but was removed before anything was built behind it
-- (see the project doc) — this is the first real implementation.
--
-- Scoped deliberately lean: just a name and a condition per item, no
-- quantity tracking or maintenance-date scheduling. Caretaker/admin manage
-- the list; manager gets read-only access (see backend/routes/equipment.js).
CREATE TABLE equipment_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  condition VARCHAR(100) NOT NULL DEFAULT 'Good',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_items_name ON equipment_items(name);
