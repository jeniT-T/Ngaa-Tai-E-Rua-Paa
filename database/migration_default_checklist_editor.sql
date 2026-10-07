BEGIN;
CREATE TABLE IF NOT EXISTS default_booking_checklist (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  body TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO default_booking_checklist (id, body)
SELECT 1, COALESCE(string_agg(title || ': ' || step, E'\n' ORDER BY content_id, ordinal), '')
FROM (
  SELECT c.id AS content_id, c.title, lines.ordinal,
    btrim(regexp_replace(lines.line, '^[[:space:]]*[•●*-][[:space:]]*', '')) AS step
  FROM content_items c
  CROSS JOIN LATERAL regexp_split_to_table(c.body, E'\r?\n') WITH ORDINALITY AS lines(line, ordinal)
  WHERE c.placement = 'arrival' AND c.block_type = 'section'
    AND c.category IN ('cleaning', 'Arrival Guide Cleaning & Checkout')
) steps WHERE step <> ''
ON CONFLICT (id) DO UPDATE SET body = EXCLUDED.body, updated_at = NOW()
WHERE btrim(default_booking_checklist.body) = '' AND btrim(EXCLUDED.body) <> '';
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
  SELECT checklist_id, btrim(line), (ordinal - 1)::INTEGER
  FROM default_booking_checklist
  CROSS JOIN LATERAL regexp_split_to_table(body, E'\r?\n') WITH ORDINALITY AS lines(line, ordinal)
  WHERE id = 1 AND btrim(line) <> '';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
