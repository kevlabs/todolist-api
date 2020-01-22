DROP TABLE IF EXISTS tasks CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;

CREATE TYPE task_status AS ENUM ('Started', 'Not started', 'Completed', 'Inactive', 'Overdue');

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY NOT NULL,
  -- user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  due_at TIMESTAMPTZ DEFAULT NULL,
  status task_status DEFAULT 'Not started',
  is_deleted BOOLEAN DEFAULT FALSE,
  CHECK (due_at > created_at)
);