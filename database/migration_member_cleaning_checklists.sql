-- Copy each current Cleaning & Checkout guide section into a Member checklist.
-- Run after migration_checklist_roles.sql. Existing checklists are preserved;
-- rerunning this migration does not duplicate or overwrite these checklists.
BEGIN;

DO $$
DECLARE
  section RECORD;
  new_checklist_id INTEGER;
BEGIN
  FOR section IN
    SELECT id, title, body
    FROM content_items
    WHERE placement = 'arrival'
      AND block_type = 'section'
      AND category IN ('cleaning', 'Arrival Guide Cleaning & Checkout')
      AND btrim(body) <> ''
    ORDER BY id
  LOOP
    IF EXISTS (SELECT 1 FROM checklists WHERE title = section.title) THEN
      CONTINUE;
    END IF;

    INSERT INTO checklists (title, description, assigned_roles)
    VALUES (
      section.title,
      'Cleaning & Checkout steps from the Marae Guide.',
      ARRAY['member']::TEXT[]
    )
    RETURNING id INTO new_checklist_id;

    INSERT INTO checklist_items (checklist_id, text, position)
    SELECT new_checklist_id, step, (row_number() OVER (ORDER BY ordinal) - 1)::INTEGER
    FROM (
      SELECT btrim(regexp_replace(line, '^[[:space:]]*[•●*-][[:space:]]*', '')) AS step,
             ordinal
      FROM regexp_split_to_table(section.body, E'\r?\n')
        WITH ORDINALITY AS lines(line, ordinal)
    ) AS steps
    WHERE step <> '';
  END LOOP;
END $$;

COMMIT;
