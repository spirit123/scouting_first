// === Fetch Team Stats from The Blue Alliance API ===
// Usage: TBA_KEY=your_api_key node fetch-stats.js
//
// Get your free API key at: https://www.thebluealliance.com/account
// Set it as: TBA_KEY=xxxx node fetch-stats.js
// Or create a .env file with: TBA_KEY=xxxx

const fs = require('fs');
const path = require('path');
const https = require('https');
const config = require('./config');

const TBA_KEY = process.env.TBA_KEY || '';
const TBA_BASE = 'https://www.thebluealliance.com/api/v3';
const YEAR = process.env.TBA_YEAR || '2025';

if (!TBA_KEY) {
  console.error('ERROR: TBA API key required.');
  console.error('Get one free at: https://www.thebluealliance.com/account');
  console.error('Usage: TBA_KEY=your_key node fetch-stats.js');
  process.exit(1);
}

function tbaFetch(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(TBA_BASE + endpoint);
    const opts = {
      hostname: url.hostname,
      path: url.pathname,
      headers: { 'X-TBA-Auth-Key': TBA_KEY },
    };

    https.get(opts, (res) => {
      if (res.statusCode === 401) {
        reject(new Error('Invalid TBA API key'));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response for ${endpoint}: ${data.slice(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function tierFromComposite(c) {
  if (c >= 70) return 'elite';
  if (c >= 55) return 'strong';
  if (c >= 40) return 'average';
  if (c >= 25) return 'below_avg';
  return 'developing';
}

async function run() {
  // Read team list
  const teamsFile = config.teamsFile;
  if (!fs.existsSync(teamsFile)) {
    console.error(`Team file not found: ${teamsFile}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(teamsFile, 'utf-8');
  const lines = raw.trim().split('\n').filter(l => l.trim());
  const header = lines[0].split(',').map(h => h.trim());
  const teamNumbers = lines.slice(1).map(line => {
    const vals = line.split(',');
    return parseInt(vals[0].trim(), 10);
  }).filter(n => !isNaN(n));

  console.log(`Fetching stats for ${teamNumbers.length} teams (year: ${YEAR})...\n`);

  const stats = [];
  let fetched = 0;

  for (const num of teamNumbers) {
    fetched++;
    process.stdout.write(`[${fetched}/${teamNumbers.length}] Team ${num}... `);

    try {
      // Get team info (rookie year, etc.)
      const teamInfo = await tbaFetch(`/team/frc${num}`);
      const rookieYear = teamInfo.rookie_year || null;

      // Get team's events for this year
      const events = await tbaFetch(`/team/frc${num}/events/${YEAR}`);
      const completedEvents = events
        .filter(e => e.event_type <= 5) // regionals, districts, etc. (not offseason)
        .filter(e => {
          // Check if event has ended (end_date in the past)
          if (!e.end_date) return false;
          return new Date(e.end_date) < new Date();
        })
        .sort((a, b) => new Date(b.end_date) - new Date(a.end_date));

      if (completedEvents.length === 0) {
        console.log('no completed events');
        // Still save basic info
        stats.push({
          team_number: num,
          opr: null,
          win_rate: null,
          avg_score: null,
          avg_rp: null,
          composite: rookieYear ? Math.min(35, 22 + (2026 - rookieYear) * 0.6) : 22,
          tier: 'developing',
          record: null,
          source_event: null,
          rank_at_event: null,
          rookie_year: rookieYear,
          scouting_notes: completedEvents.length === 0 ? 'No completed events this season' : '',
        });
        await sleep(200);
        continue;
      }

      // Use the most recent completed event
      const latestEvent = completedEvents[0];
      const eventKey = latestEvent.key;
      const eventName = latestEvent.short_name || latestEvent.name;

      // Get OPR for this event
      let opr = null;
      try {
        const oprs = await tbaFetch(`/event/${eventKey}/oprs`);
        if (oprs && oprs.oprs && oprs.oprs[`frc${num}`] != null) {
          opr = Math.round(oprs.oprs[`frc${num}`] * 100) / 100;
        }
      } catch (e) {}

      // Get rankings for this event
      let record = null;
      let rank = null;
      let totalTeams = null;
      let avgRp = null;
      try {
        const rankings = await tbaFetch(`/event/${eventKey}/rankings`);
        if (rankings && rankings.rankings) {
          totalTeams = rankings.rankings.length;
          const teamRank = rankings.rankings.find(r => r.team_key === `frc${num}`);
          if (teamRank) {
            rank = teamRank.rank;
            const rec = teamRank.record;
            if (rec) record = `${rec.wins}-${rec.losses}-${rec.ties}`;
            if (teamRank.sort_orders && teamRank.sort_orders.length > 0) {
              avgRp = Math.round(teamRank.sort_orders[0] * 100) / 100;
            }
          }
        }
      } catch (e) {}

      // Calculate win rate from record
      let winRate = null;
      if (record) {
        const parts = record.split('-').map(Number);
        const total = parts[0] + parts[1] + parts[2];
        if (total > 0) winRate = Math.round(((parts[0] + 0.5 * parts[2]) / total) * 1000) / 10;
      }

      // Calculate composite score (simplified)
      let composite = 30; // base
      if (opr != null) {
        // Normalize OPR: assume max ~200, scale to 0-100
        composite = Math.min(100, Math.max(0, (opr / 200) * 100)) * 0.35;
      }
      if (winRate != null) {
        composite += (winRate / 100) * 0.20 * 100;
      }
      if (rank != null && totalTeams) {
        const rankPct = (1 - (rank - 1) / Math.max(1, totalTeams - 1)) * 100;
        composite += rankPct * 0.10;
      }
      if (avgRp != null) {
        // Normalize RP: max ~4.5, scale to 0-100
        composite += Math.min(100, (avgRp / 4.5) * 100) * 0.10;
      }
      if (rookieYear) {
        const experience = Math.min(30, 2026 - rookieYear);
        composite += (experience / 30) * 100 * 0.05;
      }
      if (completedEvents.length > 1) {
        composite += Math.min(100, completedEvents.length * 33) * 0.05;
      }
      composite = Math.round(composite * 10) / 10;

      const tier = tierFromComposite(composite);

      // Build scouting notes
      const notes = [];
      if (completedEvents.length > 1) notes.push(`${completedEvents.length} events played`);
      if (rookieYear === parseInt(YEAR)) notes.push('ROOKIE');
      if (opr != null && opr > 150) notes.push('Elite scorer');
      if (opr != null && opr < 0) notes.push('Negative OPR');
      if (winRate != null && winRate >= 80) notes.push('Dominant record');

      const rankStr = rank && totalTeams ? `${rank}/${totalTeams}` : null;

      console.log(`OPR=${opr || '?'}, ${record || '?'}, ${tier} (${composite})`);

      stats.push({
        team_number: num,
        opr,
        win_rate: winRate,
        avg_score: null,
        avg_rp: avgRp,
        composite,
        tier,
        record,
        source_event: eventName,
        rank_at_event: rankStr,
        rookie_year: rookieYear,
        scouting_notes: notes.join('. '),
      });

    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      stats.push({
        team_number: num,
        opr: null, win_rate: null, avg_score: null, avg_rp: null,
        composite: 25, tier: 'developing', record: null,
        source_event: null, rank_at_event: null, rookie_year: null,
        scouting_notes: `Fetch error: ${err.message}`,
      });
    }

    // Rate limit: TBA allows ~10 req/sec, we do ~3 per team
    await sleep(300);
  }

  // Write output
  const outFile = path.join(__dirname, 'team_stats.json');
  fs.writeFileSync(outFile, JSON.stringify(stats, null, 2));
  console.log(`\nDone! Wrote ${stats.length} team stats to ${outFile}`);
  console.log(`Now run: node seed-teams.js`);
}

run().catch(err => {
  console.error('Fetch failed:', err);
  process.exit(1);
});
