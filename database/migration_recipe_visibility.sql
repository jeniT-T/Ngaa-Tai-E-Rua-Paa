-- database/migration_recipe_visibility.sql
--
-- Fixes a gap from migration_client_content.sql: the Combi Oven scrambled-
-- eggs recipe was originally added as a library-only item (placement =
-- NULL), which requires a login to see -- a guest at the marae with no
-- account (arriving via the guest link/QR code) had no way to view it at
-- all. Moves it onto the arrival guide instead (placement = 'arrival',
-- category = 'general' -- the "equipment & facilities used during your
-- stay" group), which is served from the same unauthenticated endpoint the
-- guest link already uses. It still shows up in the logged-in Content
-- Library too, since that page isn't filtered by placement.
--
-- Only run this if you already ran migration_client_content.sql before
-- this fix -- if you're running migration_client_content.sql for the
-- first time, it already inserts the recipe correctly and this is a no-op.

UPDATE content_items
SET placement = 'arrival', category = 'general', updated_at = NOW()
WHERE title = 'Combi Oven: Scrambled Eggs' AND placement IS NULL;
