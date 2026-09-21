-- database/migration_password_reset.sql
-- Run this against an existing database that was created before password-reset
-- support was added. Safe to run more than once (IF NOT EXISTS guards).

ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
