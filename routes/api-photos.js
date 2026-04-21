const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');
const config = require('../config');

// GET /api/entries — list entries, optional ?team=NUM
router.get('/', (req, res) => {
  const team = req.query.team ? parseInt(req.query.team, 10) : null;

  let entries;
  if (team) {
    entries = db.all(
      'SELECT uuid, team_number, role, scout_name, notes, created_at, synced_at, file_size, passes_bumps, under_trenches, climb_level, drivetrain, CASE WHEN filename IS NOT NULL THEN 1 ELSE 0 END as has_photo FROM entries WHERE team_number = ? ORDER BY created_at DESC',
      [team]
    );
  } else {
    entries = db.all(
      'SELECT uuid, team_number, role, scout_name, notes, created_at, synced_at, file_size, passes_bumps, under_trenches, climb_level, drivetrain, CASE WHEN filename IS NOT NULL THEN 1 ELSE 0 END as has_photo FROM entries ORDER BY created_at DESC'
    );
  }

  res.json(entries);
});

// GET /api/entries/:uuid/image — serve the actual JPEG
router.get('/:uuid/image', (req, res) => {
  const entry = db.get('SELECT filename FROM entries WHERE uuid = ?', [req.params.uuid]);
  if (!entry || !entry.filename) return res.status(404).json({ error: 'Photo not found' });

  const filePath = path.join(config.uploadsDir, entry.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });

  res.sendFile(filePath);
});

// DELETE /api/entries/:uuid — remove an entry
router.delete('/:uuid', (req, res) => {
  const entry = db.get('SELECT filename FROM entries WHERE uuid = ?', [req.params.uuid]);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  // Delete file if it exists
  if (entry.filename) {
    const filePath = path.join(config.uploadsDir, entry.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Delete DB record
  db.run('DELETE FROM entries WHERE uuid = ?', [req.params.uuid]);

  res.json({ ok: true });
});

module.exports = router;
