CREATE TABLE runs (
  id TEXT PRIMARY KEY NOT NULL,
  automation_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  inputs_json TEXT NOT NULL DEFAULT '{}',
  output TEXT NOT NULL DEFAULT '',
  error TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL,
  finished_at TEXT,
  FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
);

CREATE INDEX runs_automation_id_started_at_index
ON runs (automation_id, started_at DESC);
