const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/teams — full team list
router.get('/', (req, res) => {
  const teams = db.all(`
    SELECT t.*,
      COUNT(e.uuid) as entry_count,
      COUNT(e.filename) as photo_count,
      (SELECT e2.uuid FROM entries e2 WHERE e2.team_number = t.team_number AND e2.filename IS NOT NULL ORDER BY e2.created_at DESC LIMIT 1) as latest_photo_uuid
    FROM teams t
    LEFT JOIN entries e ON t.team_number = e.team_number
    GROUP BY t.team_number
    ORDER BY t.team_number
  `);
  res.json(teams);
});

// GET /api/teams/:num — single team with counts
router.get('/:num', (req, res) => {
  const num = parseInt(req.params.num, 10);
  if (isNaN(num)) return res.status(400).json({ error: 'Invalid team number' });

  const team = db.get(`
    SELECT t.*,
      COUNT(e.uuid) as entry_count,
      COUNT(e.filename) as photo_count
    FROM teams t
    LEFT JOIN entries e ON t.team_number = e.team_number
    WHERE t.team_number = ?
    GROUP BY t.team_number
  `, [num]);

  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json(team);
});

module.exports = router;
