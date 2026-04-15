const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/scouts — list all scouts with assignment counts
router.get('/', (req, res) => {
  const scouts = db.all(`
    SELECT s.name,
      COUNT(DISTINCT a.team_number) as assigned_count,
      COUNT(DISTINCT e.team_number) as scouted_count
    FROM scouts s
    LEFT JOIN assignments a ON s.name = a.scout_name
    LEFT JOIN entries e ON s.name = e.scout_name AND e.team_number IN (
      SELECT team_number FROM assignments WHERE scout_name = s.name
    )
    GROUP BY s.name
    ORDER BY s.name
  `);
  res.json(scouts);
});

// POST /api/scouts — add a scout
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });

  const trimmed = name.trim();
  const existing = db.get('SELECT name FROM scouts WHERE name = ?', [trimmed]);
  if (existing) return res.status(409).json({ error: 'Scout already exists' });

  db.run('INSERT INTO scouts (name) VALUES (?)', [trimmed]);
  res.json({ ok: true, name: trimmed });
});

// DELETE /api/scouts/:name — remove a scout
router.delete('/:name', (req, res) => {
  db.run('DELETE FROM assignments WHERE scout_name = ?', [req.params.name]);
  db.run('DELETE FROM scouts WHERE name = ?', [req.params.name]);
  res.json({ ok: true });
});

// GET /api/assignments — all assignments, optionally ?scout=NAME
router.get('/assignments', (req, res) => {
  if (req.query.scout) {
    const rows = db.all(`
      SELECT a.team_number, a.scout_name, t.team_name,
        CASE WHEN EXISTS (
          SELECT 1 FROM entries e WHERE e.team_number = a.team_number AND e.scout_name = a.scout_name
        ) THEN 1 ELSE 0 END as completed
      FROM assignments a
      JOIN teams t ON a.team_number = t.team_number
      WHERE a.scout_name = ?
      ORDER BY a.team_number
    `, [req.query.scout]);
    return res.json(rows);
  }

  const rows = db.all(`
    SELECT a.team_number, a.scout_name, t.team_name,
      CASE WHEN EXISTS (
        SELECT 1 FROM entries e WHERE e.team_number = a.team_number AND e.scout_name = a.scout_name
      ) THEN 1 ELSE 0 END as completed
    FROM assignments a
    JOIN teams t ON a.team_number = t.team_number
    ORDER BY a.team_number, a.scout_name
  `);
  res.json(rows);
});

// POST /api/assignments — manually assign { teamNumber, scoutName }
router.post('/assignments', (req, res) => {
  const { teamNumber, scoutName } = req.body;
  if (!teamNumber || !scoutName) return res.status(400).json({ error: 'teamNumber and scoutName required' });

  db.run('INSERT OR IGNORE INTO assignments (team_number, scout_name) VALUES (?, ?)', [teamNumber, scoutName]);
  res.json({ ok: true });
});

// DELETE /api/assignments — remove { teamNumber, scoutName }
router.delete('/assignments', (req, res) => {
  const { teamNumber, scoutName } = req.body;
  if (!teamNumber || !scoutName) return res.status(400).json({ error: 'teamNumber and scoutName required' });

  db.run('DELETE FROM assignments WHERE team_number = ? AND scout_name = ?', [teamNumber, scoutName]);
  res.json({ ok: true });
});

// POST /api/assignments/auto — auto-distribute teams across scouts
// Each team assigned to `perTeam` scouts (default 2)
router.post('/assignments/auto', (req, res) => {
  const perTeam = parseInt(req.body.perTeam, 10) || 2;
  const scouts = db.all('SELECT name FROM scouts ORDER BY name');
  const teams = db.all('SELECT team_number FROM teams ORDER BY team_number');

  if (scouts.length === 0) return res.status(400).json({ error: 'No scouts defined' });
  if (scouts.length < perTeam) return res.status(400).json({ error: `Need at least ${perTeam} scouts for ${perTeam} assignments per team` });

  // Clear existing assignments
  db.run('DELETE FROM assignments');

  // Round-robin: assign each team to `perTeam` different scouts
  let scoutIndex = 0;
  for (const team of teams) {
    for (let i = 0; i < perTeam; i++) {
      const scout = scouts[(scoutIndex + i) % scouts.length];
      db.run('INSERT INTO assignments (team_number, scout_name) VALUES (?, ?)',
        [team.team_number, scout.name]);
    }
    scoutIndex = (scoutIndex + 1) % scouts.length;
  }

  db.persist();

  // Return summary
  const summary = scouts.map(s => {
    const count = db.get('SELECT COUNT(*) as c FROM assignments WHERE scout_name = ?', [s.name]);
    return { name: s.name, assignedCount: count.c };
  });

  res.json({ ok: true, perTeam, summary });
});

module.exports = router;
