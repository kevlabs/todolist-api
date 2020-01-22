DROP TABLE IF EXISTS reminders CASCADE;
DROP TYPE IF EXISTS reminder_status CASCADE;

CREATE TYPE reminder_status AS ENUM ('Pending', 'Sent', 'Cancelled');

CREATE TABLE reminders (
  id SERIAL PRIMARY KEY NOT NULL,
  task_id INTEGER REFERENCES tasks(id),
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  due_at TIMESTAMPTZ DEFAULT NULL,
  status reminder_status DEFAULT 'Pending',
  is_deleted BOOLEAN DEFAULT FALSE,
  CHECK (due_at > created_at)
);