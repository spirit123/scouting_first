const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/teams — full team list
router.get('/', (req, res) => {
  const teams = db.all(`
    SELECT t.*,
      COUNT(e.uuid) as entry_count,
      COUNT(e.filename) as photo_count,
      (SELECT e2.uuid FROM entries e2 WHERE e2.team_number = t.team_number AND e2.filename IS NOT NULL ORDER BY e2.created_at DESC LIMIT 1) as latest_photo_uuid,
      th.photo_source as thumbnail_source,
      s.opr, s.win_rate, s.avg_score, s.avg_rp, s.composite, s.tier,
      s.record, s.source_event, s.rank_at_event, s.rookie_year, s.scouting_notes
    FROM teams t
    LEFT JOIN entries e ON t.team_number = e.team_number
    LEFT JOIN team_thumbnails th ON t.team_number = th.team_number
    LEFT JOIN team_stats s ON t.team_number = s.team_number
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
      COUNT(e.filename) as photo_count,
      s.opr, s.win_rate, s.avg_score, s.avg_rp, s.composite, s.tier,
      s.record, s.source_event, s.rank_at_event, s.rookie_year, s.scouting_notes
    FROM teams t
    LEFT JOIN entries e ON t.team_number = e.team_number
    LEFT JOIN team_stats s ON t.team_number = s.team_number
    WHERE t.team_number = ?
    GROUP BY t.team_number
  `, [num]);

  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json(team);
});

// POST /api/teams/:num/thumbnail — set which photo to use as thumbnail
router.post('/:num/thumbnail', (req, res) => {
  const num = parseInt(req.params.num, 10);
  if (isNaN(num)) return res.status(400).json({ error: 'Invalid team number' });

  const { photoSource } = req.body; // UUID or "default"
  if (!photoSource) return res.status(400).json({ error: 'photoSource required' });

  db.run('INSERT OR REPLACE INTO team_thumbnails (team_number, photo_source) VALUES (?, ?)', [num, photoSource]);
  res.json({ ok: true });
});

module.exports = router;
