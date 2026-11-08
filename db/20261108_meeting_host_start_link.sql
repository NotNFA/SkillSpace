-- Adds a private Zoom host-start URL. Never expose this column in public meeting payloads.
BEGIN;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS host_start_url TEXT;
COMMIT;
