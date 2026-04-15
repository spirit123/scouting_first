const fs = require('fs');
const path = require('path');
const config = require('./config');
const db = require('./db');

async function seed() {
  await db.init();

  const teamsFile = config.teamsFile;
  if (!fs.existsSync(teamsFile)) {
    console.error(`Team file not found: ${teamsFile}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(teamsFile, 'utf-8');
  let teams;

  if (teamsFile.endsWith('.csv')) {
    const lines = raw.trim().split('\n').filter(l => l.trim());
    const header = lines[0].split(',').map(h => h.trim());
    teams = lines.slice(1).map(line => {
      // Handle commas inside team names by simple split (no quoted fields in this data)
      const vals = line.split(',').map(v => v.trim());
      const obj = {};
      header.forEach((h, i) => { obj[h] = vals[i] || ''; });
      obj.team_number = parseInt(obj.team_number, 10);
      // Normalize: state_prov -> state
      if (obj.state_prov && !obj.state) obj.state = obj.state_prov;
      return obj;
    }).filter(t => !isNaN(t.team_number));
  } else {
    teams = JSON.parse(raw);
  }

  console.log(`Seeding ${teams.length} teams...`);

  db.run('DELETE FROM teams');

  for (const t of teams) {
    db.run(
      'INSERT OR REPLACE INTO teams (team_number, team_name, school, city, state, country, robot_image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [t.team_number, t.team_name || '', t.school || '', t.city || '', t.state || t.state_prov || '', t.country || 'USA', t.robot_image_url || null]
    );
  }

  // Load team stats if available
  const statsFile = path.join(__dirname, 'team_stats.json');
  if (fs.existsSync(statsFile)) {
    const stats = JSON.parse(fs.readFileSync(statsFile, 'utf-8'));
    console.log(`Loading stats for ${stats.length} teams...`);
    db.run('DELETE FROM team_stats');
    for (const s of stats) {
      db.run(
        'INSERT OR REPLACE INTO team_stats (team_number, opr, win_rate, avg_score, avg_rp, composite, tier, record, source_event, rank_at_event, rookie_year, scouting_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [s.team_number, s.opr, s.win_rate, s.avg_score, s.avg_rp, s.composite, s.tier, s.record, s.source_event, s.rank_at_event, s.rookie_year, s.scouting_notes]
      );
    }
    console.log(`Stats loaded for ${stats.length} teams.`);
  }

  db.persist();
  console.log(`Done. ${teams.length} teams loaded.`);
  db.close();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
