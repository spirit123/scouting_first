const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');
const config = require('../config');

// GET /api/photos — list photo metadata, optional ?team=NUM
router.get('/', (req, res) => {
  const team = req.query.team ? parseInt(req.query.team, 10) : null;

  let photos;
  if (team) {
    photos = db.all(
      'SELECT uuid, team_number, scout_name, notes, taken_at, synced_at, file_size FROM photos WHERE team_number = ? ORDER BY taken_at DESC',
      [team]
    );
  } else {
    photos = db.all(
      'SELECT uuid, team_number, scout_name, notes, taken_at, synced_at, file_size FROM photos ORDER BY taken_at DESC'
    );
  }

  res.json(photos);
});

// GET /api/photos/:uuid/image — serve the actual JPEG
router.get('/:uuid/image', (req, res) => {
  const photo = db.get('SELECT filename FROM photos WHERE uuid = ?', [req.params.uuid]);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });

  const filePath = path.join(config.uploadsDir, photo.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });

  res.sendFile(filePath);
});

// DELETE /api/photos/:uuid — remove a photo
router.delete('/:uuid', (req, res) => {
  const photo = db.get('SELECT filename FROM photos WHERE uuid = ?', [req.params.uuid]);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });

  // Delete file
  const filePath = path.join(config.uploadsDir, photo.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete DB record
  db.run('DELETE FROM photos WHERE uuid = ?', [req.params.uuid]);

  res.json({ ok: true });
});

module.exports = router;
