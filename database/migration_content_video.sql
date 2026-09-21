-- database/migration_content_video.sql
-- Adds an optional YouTube video URL to content_items, ported from the
-- teammate's arrival-items branch. Any content item can have a video
-- attached (most useful for arrival guide sections), rendered as an
-- embedded player under the item's body wherever it's shown.
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS video_url TEXT;
