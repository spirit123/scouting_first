const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const db = require('../db');
const config = require('../config');

const upload = multer({
  dest: path.join(config.uploadsDir, '.tmp'),
  limits: { fileSize: config.maxFileSize },
});

// POST /api/sync — bulk upload from scout
// Expects multipart form with:
//   - metadata: JSON string array of { uuid, teamNumber, role, scoutName, notes, createdAt,
//                                       passesBumps, underTrenches, climbLevel, drivetrain,
//                                       autoStartPosition, autoPerformance, autoActions, autoNotes }
//     passesBumps/underTrenches: 'yes'|'no'|null ; climbLevel: 'L1'|'L2'|'L3'|null
//     drivetrain: 'tank'|'swerve'|'mecanum'|'other'|null
//     autoStartPosition: 'left'|'center'|'right'|null
//     autoPerformance: 'none'|'minimal'|'reliable'|'strong'|null
//     autoActions: CSV of leaves_zone|scores_fuel|climbs_tower|crosses_obstacle
//   - photo_<uuid>: file for each entry that has a photo (optional)
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

  const normTri = (v) => (v === 'yes' || v === 'no') ? v : null;
  const normClimb = (v) => (v === 'L1' || v === 'L2' || v === 'L3') ? v : null;
  const DRIVETRAINS = new Set(['tank', 'swerve', 'mecanum', 'other']);
  const normDrivetrain = (v) => DRIVETRAINS.has(v) ? v : null;
  const POSITIONS = new Set(['left', 'center', 'right']);
  const normPosition = (v) => POSITIONS.has(v) ? v : null;
  const PERFORMANCES = new Set(['none', 'minimal', 'reliable', 'strong']);
  const normPerformance = (v) => PERFORMANCES.has(v) ? v : null;
  const ACTIONS = new Set(['leaves_zone', 'scores_fuel', 'climbs_tower', 'crosses_obstacle']);
  const normActions = (v) => {
    if (!v) return null;
    const parts = String(v).split(',').map(s => s.trim()).filter(s => ACTIONS.has(s));
    return parts.length ? parts.join(',') : null;
  };

  for (const entry of metadata) {
    const { uuid, teamNumber, role, scoutName, notes, createdAt, passesBumps, underTrenches, climbLevel, drivetrain,
            autoStartPosition, autoPerformance, autoActions, autoNotes } = entry;

    if (!uuid || !teamNumber || !createdAt) {
      errors.push({ uuid, reason: 'Missing required fields (uuid, teamNumber, createdAt)' });
      continue;
    }

    // Check for duplicate
    const existing = db.get('SELECT uuid FROM entries WHERE uuid = ?', [uuid]);
    if (existing) {
      duplicates.push(uuid);
      const tempFile = fileMap[`photo_${uuid}`];
      if (tempFile && fs.existsSync(tempFile.path)) {
        fs.unlinkSync(tempFile.path);
      }
      continue;
    }

    try {
      // Handle optional photo
      const file = fileMap[`photo_${uuid}`];
      let filename = null;
      let fileSize = null;

      if (file) {
        const teamDir = path.join(config.uploadsDir, String(teamNumber));
        fs.mkdirSync(teamDir, { recursive: true });

        const ext = path.extname(file.originalname) || '.jpg';
        filename = path.join(String(teamNumber), `${uuid}${ext}`);
        const destPath = path.join(config.uploadsDir, filename);
        fs.renameSync(file.path, destPath);
        fileSize = fs.statSync(destPath).size;
      }

      // Insert into DB
      db.run(
        'INSERT INTO entries (uuid, team_number, role, filename, scout_name, notes, created_at, file_size, passes_bumps, under_trenches, climb_level, drivetrain, auto_start_position, auto_performance, auto_actions, auto_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuid, teamNumber, role || null, filename, scoutName || null, notes || null, createdAt, fileSize, normTri(passesBumps), normTri(underTrenches), normClimb(climbLevel), normDrivetrain(drivetrain), normPosition(autoStartPosition), normPerformance(autoPerformance), normActions(autoActions), autoNotes || null]
      );

      synced.push(uuid);
    } catch (err) {
      errors.push({ uuid, reason: err.message });
      const file = fileMap[`photo_${uuid}`];
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  // Clean up remaining temp files
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
