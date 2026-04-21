const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/export/csv
router.get('/csv', (req, res) => {
  const entries = db.all(`
    SELECT e.uuid, e.team_number, t.team_name, e.role, e.scout_name, e.notes, e.created_at, e.synced_at, e.file_size,
           e.passes_bumps, e.under_trenches,
           CASE WHEN e.filename IS NOT NULL THEN 1 ELSE 0 END as has_photo
    FROM entries e
    LEFT JOIN teams t ON e.team_number = t.team_number
    ORDER BY e.team_number, e.created_at
  `);

  const header = 'uuid,team_number,team_name,role,scout_name,notes,created_at,synced_at,has_photo,file_size,passes_bumps,under_trenches';
  const rows = entries.map(e => {
    const esc = (v) => {
      if (v == null) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [e.uuid, e.team_number, e.team_name, e.role, e.scout_name, e.notes, e.created_at, e.synced_at, e.has_photo, e.file_size, e.passes_bumps, e.under_trenches]
      .map(esc).join(',');
  });

  const csv = [header, ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="ftc-scout-export.csv"');
  res.send(csv);
});

// GET /api/export/json
router.get('/json', (req, res) => {
  const teams = db.all('SELECT * FROM teams ORDER BY team_number');
  const entries = db.all('SELECT * FROM entries ORDER BY team_number, created_at');
  res.json({ exportedAt: new Date().toISOString(), teams, entries });
});

// GET /api/export/html — printable report
router.get('/html', (req, res) => {
  const teams = db.all(`
    SELECT t.*, COUNT(e.uuid) as entry_count, COUNT(e.filename) as photo_count
    FROM teams t
    LEFT JOIN entries e ON t.team_number = e.team_number
    GROUP BY t.team_number
    ORDER BY t.team_number
  `);

  const entries = db.all('SELECT * FROM entries ORDER BY team_number, created_at');

  const entriesByTeam = {};
  for (const e of entries) {
    if (!entriesByTeam[e.team_number]) entriesByTeam[e.team_number] = [];
    entriesByTeam[e.team_number].push(e);
  }

  const roleColors = { scorer: '#4caf50', feeder: '#2196f3', defender: '#ff9800' };

  let html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FTC Scout Report</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
  h1 { text-align: center; color: #1a1a2e; }
  .stats { text-align: center; color: #666; margin-bottom: 30px; }
  .team { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 20px; page-break-inside: avoid; }
  .team h2 { margin: 0 0 8px 0; color: #16213e; }
  .team .info { color: #666; font-size: 14px; margin-bottom: 12px; }
  .role-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; color: white; font-size: 12px; font-weight: 600; }
  .photos { display: flex; flex-wrap: wrap; gap: 10px; }
  .photo { width: 200px; }
  .photo img { width: 100%; height: 150px; object-fit: cover; border-radius: 4px; }
  .entry { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
  .no-data { color: #999; font-style: italic; }
  @media print { .team { break-inside: avoid; } }
</style></head><body>
<h1>FTC Scout Report</h1>
<p class="stats">Generated: ${new Date().toLocaleString()} | Teams: ${teams.length} | Entries: ${entries.length}</p>`;

  for (const team of teams) {
    const teamEntries = entriesByTeam[team.team_number] || [];
    html += `<div class="team">
  <h2>Team ${team.team_number} — ${team.team_name || 'Unknown'}</h2>
  <div class="info">${[team.city, team.state, team.country].filter(Boolean).join(', ')}</div>`;

    if (teamEntries.length === 0) {
      html += `<div class="no-data">No scouting data</div>`;
    } else {
      // Show photos
      const withPhotos = teamEntries.filter(e => e.filename);
      if (withPhotos.length > 0) {
        html += `<div class="photos">`;
        for (const e of withPhotos) {
          html += `<div class="photo"><img src="/api/entries/${e.uuid}/image" alt="Team ${e.team_number}" loading="lazy"></div>`;
        }
        html += `</div>`;
      }

      // Show entries
      for (const e of teamEntries) {
        const roles = e.role ? String(e.role).split(',').map(s => s.trim()).filter(Boolean) : [];
        const badges = roles.map(r => {
          const color = roleColors[r] || '#999';
          return `<span class="role-badge" style="background:${color}">${r}</span>`;
        }).join(' ');
        const capBadges = [];
        if (e.passes_bumps === 'yes') capBadges.push('<span style="color:#4caf50;">🚧✓</span>');
        else if (e.passes_bumps === 'no') capBadges.push('<span style="color:#c62828;">🚧✗</span>');
        if (e.under_trenches === 'yes') capBadges.push('<span style="color:#4caf50;">🕳️✓</span>');
        else if (e.under_trenches === 'no') capBadges.push('<span style="color:#c62828;">🕳️✗</span>');
        html += `<div class="entry">
          ${badges}
          <strong>${e.scout_name || 'Unknown'}</strong> — ${e.notes || 'No notes'}
          ${capBadges.length ? ' ' + capBadges.join(' ') : ''}
          <span style="color:#999; font-size:12px;">(${e.created_at})</span>
        </div>`;
      }
    }
    html += `</div>`;
  }

  html += `</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = router;
