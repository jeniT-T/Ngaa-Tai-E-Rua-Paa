-- database/migration_remove_arrival_subpages.sql
-- The Gas, WiFi and Accessibility arrival subpages have been removed —
-- their content already exists as items in the main Arrival guide dropdown
-- (or wasn't needed at all). Delete any content_items that were placed on
-- those now-gone pages so they don't sit around orphaned.
DELETE FROM content_items WHERE placement IN ('arrival-gas', 'arrival-wifi', 'arrival-accessibility');
