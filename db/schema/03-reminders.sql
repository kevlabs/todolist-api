DROP TABLE IF EXISTS reminders CASCADE;

CREATE TABLE reminders (
  id SERIAL PRIMARY KEY NOT NULL,
  task_id INTEGER REFERENCES tasks(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  due_at TIMESTAMPTZ DEFAULT NULL,
  is_deleted BOOLEAN DEFAULT FALSE
);