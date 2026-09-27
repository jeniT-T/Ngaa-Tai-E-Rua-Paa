-- database/migration_content_images.sql
--
-- Lets an admin attach their own uploaded image to any content item (a page
-- heading or a section card), instead of images only being able to come
-- from files a developer hardcoded into frontend/public/images/. Pairs with
-- the new POST /api/content/upload endpoint (backend/routes/content.js) and
-- the image picker added to the admin Content Manager.
--
-- image_url stores a relative path like "/uploads/<filename>" returned by
-- the upload endpoint (or, in principle, any absolute image URL an admin
-- pastes in directly). NULL means "no image", same as every other optional
-- content_items field.
--
-- Safe to re-run — ADD COLUMN IF NOT EXISTS is a no-op if already applied.

ALTER TABLE content_items ADD COLUMN IF NOT EXISTS image_url TEXT;
