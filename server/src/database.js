import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'fitness.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    height REAL NOT NULL,
    weight REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS training_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS training_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sets INTEGER NOT NULL DEFAULT 3,
    reps INTEGER NOT NULL DEFAULT 12,
    completed INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS running_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    distance REAL NOT NULL,
    minutes REAL NOT NULL,
    pace REAL NOT NULL,
    calories INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_training_plans_user_date ON training_plans(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_training_exercises_plan ON training_exercises(plan_id);
  CREATE INDEX IF NOT EXISTS idx_running_records_user_date ON running_records(user_id, date);
`);

// Migrations — safe to re-run (catches duplicate column error)
for (const [sql, label] of [
  ['ALTER TABLE running_records ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0', 'add hidden column'],
  ['ALTER TABLE running_records ADD COLUMN splits TEXT NOT NULL DEFAULT \'[]\'', 'add splits column'],
  ['ALTER TABLE running_records ADD COLUMN type TEXT NOT NULL DEFAULT \'run\'', 'add type column'],
]) {
  try { db.exec(sql); console.log(`Migration OK: ${label}`); }
  catch (e) { if (!e.message.includes('duplicate column')) throw e; }
}

export default db;
