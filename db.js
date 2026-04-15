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

CREATE TABLE IF NOT EXISTS photos (
    uuid        TEXT PRIMARY KEY,
    team_number INTEGER NOT NULL,
    filename    TEXT NOT NULL,
    scout_name  TEXT,
    notes       TEXT,
    taken_at    TEXT NOT NULL,
    synced_at   TEXT NOT NULL DEFAULT (datetime('now')),
    file_size   INTEGER,
    FOREIGN KEY (team_number) REFERENCES teams(team_number)
);

CREATE INDEX IF NOT EXISTS idx_photos_team ON photos(team_number);
CREATE INDEX IF NOT EXISTS idx_photos_scout ON photos(scout_name);
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
  persist();
  return db;
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
