const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');
const config = require('../config');

// GET /api/export/csv — download CSV of all photo metadata
router.get('/csv', (req, res) => {
  const photos = db.all(`
    SELECT p.uuid, p.team_number, t.team_name, p.scout_name, p.notes, p.taken_at, p.synced_at, p.file_size
    FROM photos p
    LEFT JOIN teams t ON p.team_number = t.team_number
    ORDER BY p.team_number, p.taken_at
  `);

  const header = 'uuid,team_number,team_name,scout_name,notes,taken_at,synced_at,file_size';
  const rows = photos.map(p => {
    const escape = (v) => {
      if (v == null) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [p.uuid, p.team_number, p.team_name, p.scout_name, p.notes, p.taken_at, p.synced_at, p.file_size]
      .map(escape).join(',');
  });

  const csv = [header, ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="ftc-scout-export.csv"');
  res.send(csv);
});

// GET /api/export/json — full data dump
router.get('/json', (req, res) => {
  const teams = db.all('SELECT * FROM teams ORDER BY team_number');
  const photos = db.all('SELECT * FROM photos ORDER BY team_number, taken_at');
  res.json({ exportedAt: new Date().toISOString(), teams, photos });
});

// GET /api/export/html — printable HTML report with thumbnails
router.get('/html', (req, res) => {
  const teams = db.all(`
    SELECT t.*, COUNT(p.uuid) as photo_count
    FROM teams t
    LEFT JOIN photos p ON t.team_number = p.team_number
    GROUP BY t.team_number
    ORDER BY t.team_number
  `);

  const photos = db.all('SELECT * FROM photos ORDER BY team_number, taken_at');

  // Group photos by team
  const photosByTeam = {};
  for (const p of photos) {
    if (!photosByTeam[p.team_number]) photosByTeam[p.team_number] = [];
    photosByTeam[p.team_number].push(p);
  }

  // Build HTML
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FTC Scout Report</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
  h1 { text-align: center; color: #1a1a2e; }
  .stats { text-align: center; color: #666; margin-bottom: 30px; }
  .team { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 20px; page-break-inside: avoid; }
  .team h2 { margin: 0 0 8px 0; color: #16213e; }
  .team .info { color: #666; font-size: 14px; margin-bottom: 12px; }
  .photos { display: flex; flex-wrap: wrap; gap: 10px; }
  .photo { width: 200px; }
  .photo img { width: 100%; height: 150px; object-fit: cover; border-radius: 4px; }
  .photo .caption { font-size: 12px; color: #666; margin-top: 4px; }
  .no-photos { color: #999; font-style: italic; }
  @media print { .team { break-inside: avoid; } }
</style>
</head>
<body>
<h1>FTC Scout Report</h1>
<p class="stats">Generated: ${new Date().toLocaleString()} | Teams: ${teams.length} | Photos: ${photos.length}</p>
`;

  for (const team of teams) {
    const teamPhotos = photosByTeam[team.team_number] || [];
    html += `<div class="team">
  <h2>Team ${team.team_number} — ${team.team_name || 'Unknown'}</h2>
  <div class="info">${[team.school, team.city, team.state].filter(Boolean).join(', ')}</div>`;

    if (teamPhotos.length === 0) {
      html += `  <div class="no-photos">No photos</div>\n`;
    } else {
      html += `  <div class="photos">\n`;
      for (const p of teamPhotos) {
        html += `    <div class="photo">
      <img src="/api/photos/${p.uuid}/image" alt="Team ${p.team_number}" loading="lazy">
      <div class="caption">${p.scout_name || 'Unknown scout'} — ${p.notes || 'No notes'}</div>
    </div>\n`;
      }
      html += `  </div>\n`;
    }
    html += `</div>\n`;
  }

  html += `</body></html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = router;
