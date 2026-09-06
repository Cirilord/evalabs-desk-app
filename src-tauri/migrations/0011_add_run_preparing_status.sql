CREATE TABLE runs_new (
  id TEXT PRIMARY KEY NOT NULL,
  automation_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('preparing', 'running', 'succeeded', 'failed')),
  inputs_json TEXT NOT NULL DEFAULT '{}',
  logs TEXT NOT NULL DEFAULT '',
  error TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL,
  finished_at TEXT,
  outputs_json TEXT NOT NULL DEFAULT '{}',
  runner_version TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
);

INSERT INTO runs_new (
  id,
  automation_id,
  status,
  inputs_json,
  logs,
  error,
  started_at,
  finished_at,
  outputs_json,
  runner_version
)
SELECT
  id,
  automation_id,
  status,
  inputs_json,
  logs,
  error,
  started_at,
  finished_at,
  outputs_json,
  runner_version
FROM runs;

DROP TABLE runs;
ALTER TABLE runs_new RENAME TO runs;

CREATE INDEX runs_automation_id_started_at_index
ON runs (automation_id, started_at DESC);
