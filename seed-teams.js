const fs = require('fs');
const config = require('./config');
const db = require('./db');

async function seed() {
  await db.init();

  if (!fs.existsSync(config.teamsFile)) {
    console.error(`Team file not found: ${config.teamsFile}`);
    console.error('Create a teams.json file with format: [{ "team_number": 123, "team_name": "...", "school": "...", "city": "...", "state": "..." }]');
    process.exit(1);
  }

  const raw = fs.readFileSync(config.teamsFile, 'utf-8');
  let teams;

  // Support both JSON and simple CSV (team_number,team_name,school,city,state)
  if (config.teamsFile.endsWith('.csv') || raw.trim().startsWith('team_number')) {
    const lines = raw.trim().split('\n');
    const header = lines[0].split(',').map(h => h.trim());
    teams = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      const obj = {};
      header.forEach((h, i) => { obj[h] = vals[i] || ''; });
      obj.team_number = parseInt(obj.team_number, 10);
      return obj;
    });
  } else {
    teams = JSON.parse(raw);
  }

  console.log(`Seeding ${teams.length} teams...`);

  db.run('DELETE FROM teams');

  for (const t of teams) {
    db.run(
      'INSERT OR REPLACE INTO teams (team_number, team_name, school, city, state, country) VALUES (?, ?, ?, ?, ?, ?)',
      [t.team_number, t.team_name || '', t.school || '', t.city || '', t.state || '', t.country || 'USA']
    );
  }

  db.persist();
  console.log(`Done. ${teams.length} teams loaded.`);
  db.close();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
