const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const teamCount = db.get('SELECT COUNT(*) as count FROM teams');
  const photoCount = db.get('SELECT COUNT(*) as count FROM photos');
  const scoutCount = db.get('SELECT COUNT(DISTINCT scout_name) as count FROM photos WHERE scout_name IS NOT NULL');

  res.json({
    ok: true,
    teamCount: teamCount ? teamCount.count : 0,
    photoCount: photoCount ? photoCount.count : 0,
    scoutCount: scoutCount ? scoutCount.count : 0,
    uptime: Math.floor(process.uptime()),
  });
});

module.exports = router;
