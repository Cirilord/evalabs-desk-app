ALTER TABLE automations ADD COLUMN script_source TEXT NOT NULL DEFAULT 'inline';

ALTER TABLE automations ADD COLUMN script_path TEXT;
