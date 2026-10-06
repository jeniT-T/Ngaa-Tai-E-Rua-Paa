-- Allow each checklist to be assigned to one or more user roles.
-- Existing checklists keep the default of all roles, preserving their
-- current visibility until someone changes the assignment.
ALTER TABLE checklists
  ADD COLUMN IF NOT EXISTS assigned_roles TEXT[] NOT NULL
  DEFAULT ARRAY['member', 'caretaker', 'manager', 'admin']::TEXT[];
