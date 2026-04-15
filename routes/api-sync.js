const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const db = require('../db');
const config = require('../config');

// Configure multer — store in temp, we'll move files after validation
const upload = multer({
  dest: path.join(config.uploadsDir, '.tmp'),
  limits: { fileSize: config.maxFileSize },
});

// POST /api/sync — bulk upload from scout
// Expects multipart form with:
//   - metadata: JSON string array of { uuid, teamNumber, scoutName, notes, takenAt }
//   - photo_<uuid>: file for each photo
router.post('/', upload.any(), (req, res) => {
  const synced = [];
  const duplicates = [];
  const errors = [];

  let metadata;
  try {
    metadata = JSON.parse(req.body.metadata || '[]');
  } catch (e) {
    return res.status(400).json({ error: 'Invalid metadata JSON' });
  }

  if (!Array.isArray(metadata) || metadata.length === 0) {
    return res.status(400).json({ error: 'metadata must be a non-empty array' });
  }

  // Build a map of uploaded files by fieldname
  const fileMap = {};
  if (req.files) {
    for (const f of req.files) {
      fileMap[f.fieldname] = f;
    }
  }

  for (const entry of metadata) {
    const { uuid, teamNumber, scoutName, notes, takenAt } = entry;

    if (!uuid || !teamNumber || !takenAt) {
      errors.push({ uuid, reason: 'Missing required fields (uuid, teamNumber, takenAt)' });
      continue;
    }

    // Check for duplicate
    const existing = db.get('SELECT uuid FROM photos WHERE uuid = ?', [uuid]);
    if (existing) {
      duplicates.push(uuid);
      // Clean up temp file if uploaded
      const tempFile = fileMap[`photo_${uuid}`];
      if (tempFile && fs.existsSync(tempFile.path)) {
        fs.unlinkSync(tempFile.path);
      }
      continue;
    }

    // Find the uploaded file
    const file = fileMap[`photo_${uuid}`];
    if (!file) {
      errors.push({ uuid, reason: 'No file uploaded for this UUID' });
      continue;
    }

    try {
      // Create team directory
      const teamDir = path.join(config.uploadsDir, String(teamNumber));
      fs.mkdirSync(teamDir, { recursive: true });

      // Move file from temp to final location
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = path.join(String(teamNumber), `${uuid}${ext}`);
      const destPath = path.join(config.uploadsDir, filename);
      fs.renameSync(file.path, destPath);

      // Insert into DB
      const fileSize = fs.statSync(destPath).size;
      db.run(
        'INSERT INTO photos (uuid, team_number, filename, scout_name, notes, taken_at, file_size) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuid, teamNumber, filename, scoutName || null, notes || null, takenAt, fileSize]
      );

      synced.push(uuid);
    } catch (err) {
      errors.push({ uuid, reason: err.message });
      // Clean up temp file on error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  // Clean up any remaining temp files not referenced by metadata
  if (req.files) {
    for (const f of req.files) {
      if (fs.existsSync(f.path)) {
        fs.unlinkSync(f.path);
      }
    }
  }

  db.persist();

  console.log(`Sync: ${synced.length} new, ${duplicates.length} dupes, ${errors.length} errors`);
  res.json({ synced, duplicates, errors });
});

module.exports = router;
