const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const config = require('./config');

let db = null;
let persistTimer = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS teams (
    team_number     INTEGER PRIMARY KEY,
    team_name       TEXT NOT NULL,
    school          TEXT,
    city            TEXT,
    state           TEXT,
    country         TEXT DEFAULT 'USA',
    robot_image_url TEXT
);

CREATE TABLE IF NOT EXISTS entries (
    uuid            TEXT PRIMARY KEY,
    team_number     INTEGER NOT NULL,
    role            TEXT,
    filename        TEXT,
    scout_name      TEXT,
    notes           TEXT,
    created_at      TEXT NOT NULL,
    synced_at       TEXT NOT NULL DEFAULT (datetime('now')),
    file_size       INTEGER,
    passes_bumps    TEXT,
    under_trenches  TEXT,
    climb_level     TEXT,
    FOREIGN KEY (team_number) REFERENCES teams(team_number)
);

CREATE INDEX IF NOT EXISTS idx_entries_team ON entries(team_number);
CREATE INDEX IF NOT EXISTS idx_entries_scout ON entries(scout_name);

CREATE TABLE IF NOT EXISTS team_stats (
    team_number   INTEGER PRIMARY KEY,
    opr           REAL,
    win_rate      REAL,
    avg_score     REAL,
    avg_rp        REAL,
    composite     REAL,
    tier          TEXT,
    record        TEXT,
    source_event  TEXT,
    rank_at_event TEXT,
    rookie_year   INTEGER,
    scouting_notes TEXT,
    FOREIGN KEY (team_number) REFERENCES teams(team_number)
);

CREATE TABLE IF NOT EXISTS team_thumbnails (
    team_number   INTEGER PRIMARY KEY,
    photo_source  TEXT NOT NULL,
    FOREIGN KEY (team_number) REFERENCES teams(team_number)
);

CREATE TABLE IF NOT EXISTS scouts (
    name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS assignments (
    team_number INTEGER NOT NULL,
    scout_name  TEXT NOT NULL,
    PRIMARY KEY (team_number, scout_name),
    FOREIGN KEY (team_number) REFERENCES teams(team_number),
    FOREIGN KEY (scout_name) REFERENCES scouts(name)
);

`;

function persist() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  fs.writeFileSync(config.dbPath, buffer);
}

function debouncedPersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(persist, 100);
}

async function init() {
  const SQL = await initSqlJs();

  if (fs.existsSync(config.dbPath)) {
    const fileBuffer = fs.readFileSync(config.dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('Database loaded from disk');
  } else {
    db = new SQL.Database();
    console.log('New database created');
  }

  db.run(SCHEMA);
  migrate();
  persist();
  return db;
}

function migrate() {
  const cols = all("PRAGMA table_info(entries)").map(r => r.name);
  if (!cols.includes('passes_bumps')) {
    db.run('ALTER TABLE entries ADD COLUMN passes_bumps TEXT');
  }
  if (!cols.includes('under_trenches')) {
    db.run('ALTER TABLE entries ADD COLUMN under_trenches TEXT');
  }
  if (!cols.includes('climb_level')) {
    db.run('ALTER TABLE entries ADD COLUMN climb_level TEXT');
  }
}

function run(sql, params = []) {
  const result = db.run(sql, params);
  debouncedPersist();
  return result;
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function close() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (db) {
    persist();
    db.close();
    db = null;
  }
}

module.exports = { init, run, get, all, close, persist };
