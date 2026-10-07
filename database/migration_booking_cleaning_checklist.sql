BEGIN;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS booking_id INTEGER UNIQUE REFERENCES bookings(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION add_booking_cleaning_checklist() RETURNS trigger AS $$
DECLARE
  checklist_id INTEGER;
BEGIN
  IF NEW.status <> 'approved' THEN RETURN NEW; END IF;
  INSERT INTO checklists (title, description, assigned_roles, booking_id)
  VALUES ('Cleaning & Checkout — Booking #' || NEW.id,
    'Default cleaning steps from the Marae Guide for ' || NEW.start_date || ' to ' || NEW.end_date || '.',
    ARRAY['member', 'caretaker', 'manager', 'admin']::TEXT[], NEW.id)
  ON CONFLICT (booking_id) DO NOTHING RETURNING id INTO checklist_id;
  IF checklist_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO checklist_items (checklist_id, text, position)
  SELECT checklist_id, title || ': ' || step,
         (row_number() OVER (ORDER BY content_id, ordinal) - 1)::INTEGER
  FROM (
    SELECT c.id AS content_id, c.title, lines.ordinal,
      btrim(regexp_replace(lines.line, '^[[:space:]]*[•●*-][[:space:]]*', '')) AS step
    FROM content_items c
    CROSS JOIN LATERAL regexp_split_to_table(c.body, E'\r?\n') WITH ORDINALITY AS lines(line, ordinal)
    WHERE c.placement = 'arrival' AND c.block_type = 'section'
      AND c.category IN ('cleaning', 'Arrival Guide Cleaning & Checkout')
  ) steps WHERE step <> '';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_cleaning_checklist ON bookings;
CREATE TRIGGER booking_cleaning_checklist AFTER INSERT OR UPDATE OF status ON bookings
FOR EACH ROW EXECUTE FUNCTION add_booking_cleaning_checklist();
-- Give already-approved bookings the same default without overwriting existing copies.
UPDATE bookings SET status = status WHERE status = 'approved';
COMMIT;
