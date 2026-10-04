-- database/migration_content_gallery_type.sql
--
-- Adds a third content_items.block_type: 'gallery' — a plain admin-uploaded
-- photo in a page's image strip (no title/body rendered alongside it), used
-- to convert the History page's Top.jpg/Flag.jpg gallery and the Health &
-- Safety page's evacuation-plan image from hardcoded files into normal,
-- admin-editable content items (see ContentManagementPage.jsx, HistoryPage.jsx,
-- HealthAndSafetyPage.jsx). These were the last two hardcoded images left
-- over from §13's "admin can upload images everywhere" round.
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_block_type_check;
ALTER TABLE content_items ADD CONSTRAINT content_items_block_type_check
  CHECK (block_type IN ('heading', 'section', 'gallery'));
