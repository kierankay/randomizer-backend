\c randomizer 

DROP TABLE IF EXISTS cohorts CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS pairs CASCADE;
DROP TABLE IF EXISTS password_tokens CASCADE;

CREATE TABLE cohorts (
  cohort_name TEXT PRIMARY KEY
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  cohort TEXT NOT NULL REFERENCES cohorts
);

CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  project TEXT,
  date DATE DEFAULT NOW(),
  cohort TEXT NOT NULL REFERENCES cohorts
);

CREATE TABLE pairs (
  student1_id INTEGER NOT NULL REFERENCES students,
  student2_id INTEGER REFERENCES students,
  group_id INTEGER NOT NULL REFERENCES groups,
  PRIMARY KEY (student1_id, group_id)
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
)

CREATE TABLE password_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users,
  hashed_token TEXT UNIQUE NOT NULL,
  valid BOOLEAN NOT NULL DEFAULT TRUE,
  date DATE DEFAULT NOW()
)