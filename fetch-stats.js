// === Fetch Team Stats from The Blue Alliance API ===
// Usage: TBA_KEY=your_api_key node fetch-stats.js
//
// Get your free API key at: https://www.thebluealliance.com/account

const fs = require('fs');
const path = require('path');
const https = require('https');
const config = require('./config');

const TBA_KEY = process.env.TBA_KEY || '';
const TBA_BASE = 'https://www.thebluealliance.com/api/v3';
const YEAR = process.env.TBA_YEAR || '2025';
const CONCURRENCY = 10; // parallel requests

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
      if (res.statusCode === 401) { reject(new Error('Invalid TBA API key')); return; }
      if (res.statusCode === 404) { resolve(null); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Parse error for ${endpoint}`)); }
      });
    }).on('error', reject);
  });
}

function tierFromComposite(c) {
  if (c >= 70) return 'elite';
  if (c >= 55) return 'strong';
  if (c >= 40) return 'average';
  if (c >= 25) return 'below_avg';
  return 'developing';
}

// Run promises in batches of `limit`
async function parallel(items, fn, limit) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
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
  const teamNumbers = lines.slice(1).map(line => {
    return parseInt(line.split(',')[0].trim(), 10);
  }).filter(n => !isNaN(n));

  console.log(`Fetching stats for ${teamNumbers.length} teams (year: ${YEAR}, concurrency: ${CONCURRENCY})...\n`);

  // Step 1: Fetch all team info + events in parallel
  console.log('Step 1/3: Fetching team info + events...');
  const teamData = await parallel(teamNumbers, async (num) => {
    try {
      const [info, events] = await Promise.all([
        tbaFetch(`/team/frc${num}`),
        tbaFetch(`/team/frc${num}/events/${YEAR}`),
      ]);
      return { num, info, events: events || [] };
    } catch (e) {
      return { num, info: null, events: [], error: e.message };
    }
  }, CONCURRENCY);
  console.log(`  Got info for ${teamData.filter(t => t.info).length} teams`);

  // Step 2: Identify unique events and fetch OPR + rankings once per event
  console.log('Step 2/3: Fetching event OPRs + rankings...');
  const eventKeys = new Set();
  const teamEventMap = {}; // team_number -> latest event key

  for (const t of teamData) {
    const completed = t.events
      .filter(e => e.event_type <= 5 && e.end_date && new Date(e.end_date) < new Date())
      .sort((a, b) => new Date(b.end_date) - new Date(a.end_date));

    if (completed.length > 0) {
      const latest = completed[0];
      teamEventMap[t.num] = {
        key: latest.key,
        name: latest.short_name || latest.name,
        eventsPlayed: completed.length,
      };
      eventKeys.add(latest.key);
    }
  }

  // Fetch OPR and rankings for each unique event (much fewer than 75)
  const eventOPRs = {};   // event_key -> { frcNNN: opr }
  const eventRanks = {};  // event_key -> { frcNNN: { rank, record, avgRp, total } }

  const uniqueEvents = [...eventKeys];
  console.log(`  ${uniqueEvents.length} unique events to fetch`);

  await parallel(uniqueEvents, async (eventKey) => {
    try {
      const [oprs, rankings] = await Promise.all([
        tbaFetch(`/event/${eventKey}/oprs`),
        tbaFetch(`/event/${eventKey}/rankings`),
      ]);

      if (oprs && oprs.oprs) eventOPRs[eventKey] = oprs.oprs;

      if (rankings && rankings.rankings) {
        const total = rankings.rankings.length;
        eventRanks[eventKey] = {};
        for (const r of rankings.rankings) {
          const rec = r.record;
          eventRanks[eventKey][r.team_key] = {
            rank: r.rank,
            total,
            record: rec ? `${rec.wins}-${rec.losses}-${rec.ties}` : null,
            wins: rec ? rec.wins : 0,
            losses: rec ? rec.losses : 0,
            ties: rec ? rec.ties : 0,
            avgRp: r.sort_orders && r.sort_orders.length > 0
              ? Math.round(r.sort_orders[0] * 100) / 100 : null,
          };
        }
      }
    } catch (e) {
      console.log(`  Warning: failed to fetch ${eventKey}: ${e.message}`);
    }
  }, CONCURRENCY);

  // Step 3: Build stats for each team
  console.log('Step 3/3: Computing stats...\n');
  const stats = [];

  for (const t of teamData) {
    const num = t.num;
    const rookieYear = t.info ? t.info.rookie_year : null;
    const evtInfo = teamEventMap[num];

    if (!evtInfo) {
      // No completed events
      stats.push({
        team_number: num, opr: null, win_rate: null, avg_score: null, avg_rp: null,
        composite: rookieYear ? Math.min(35, 22 + (2026 - rookieYear) * 0.6) : 22,
        tier: 'developing', record: null, source_event: null, rank_at_event: null,
        rookie_year: rookieYear,
        scouting_notes: t.error ? `Fetch error: ${t.error}` : 'No completed events this season',
      });
      continue;
    }

    const oprData = eventOPRs[evtInfo.key] || {};
    const rankData = (eventRanks[evtInfo.key] || {})[`frc${num}`] || {};

    const opr = oprData[`frc${num}`] != null ? Math.round(oprData[`frc${num}`] * 100) / 100 : null;
    const record = rankData.record || null;
    const rank = rankData.rank || null;
    const totalTeams = rankData.total || null;
    const avgRp = rankData.avgRp || null;

    let winRate = null;
    if (record) {
      const total = rankData.wins + rankData.losses + rankData.ties;
      if (total > 0) winRate = Math.round(((rankData.wins + 0.5 * rankData.ties) / total) * 1000) / 10;
    }

    // Composite score
    let composite = 0;
    if (opr != null) composite += Math.min(100, Math.max(0, (opr / 200) * 100)) * 0.35;
    else composite += 15 * 0.35;
    if (winRate != null) composite += (winRate / 100) * 0.20 * 100;
    else composite += 25 * 0.20;
    if (rank != null && totalTeams) {
      composite += (1 - (rank - 1) / Math.max(1, totalTeams - 1)) * 100 * 0.10;
    } else { composite += 25 * 0.10; }
    if (avgRp != null) composite += Math.min(100, (avgRp / 4.5) * 100) * 0.10;
    else composite += 25 * 0.10;
    if (rookieYear) composite += (Math.min(30, 2026 - rookieYear) / 30) * 100 * 0.05;
    if (evtInfo.eventsPlayed > 1) composite += Math.min(100, evtInfo.eventsPlayed * 33) * 0.05;
    composite = Math.round(composite * 10) / 10;

    const tier = tierFromComposite(composite);

    // Auto notes
    const notes = [];
    if (evtInfo.eventsPlayed > 1) notes.push(`${evtInfo.eventsPlayed} events played`);
    if (rookieYear && rookieYear >= parseInt(YEAR)) notes.push('ROOKIE');
    if (opr != null && opr > 150) notes.push('Elite scorer');
    if (opr != null && opr < 0) notes.push('Negative OPR');
    if (winRate != null && winRate >= 80) notes.push('Dominant record');

    const rankStr = rank && totalTeams ? `${rank}/${totalTeams}` : null;

    console.log(`  #${num}: OPR=${opr || '?'}, ${record || '?'}, ${tier} (${composite})`);

    stats.push({
      team_number: num, opr, win_rate: winRate, avg_score: null, avg_rp: avgRp,
      composite, tier, record, source_event: evtInfo.name,
      rank_at_event: rankStr, rookie_year: rookieYear,
      scouting_notes: notes.join('. '),
    });
  }

  const outFile = path.join(__dirname, 'team_stats.json');
  fs.writeFileSync(outFile, JSON.stringify(stats, null, 2));
  console.log(`\nDone! Wrote ${stats.length} team stats to ${outFile}`);
  console.log(`Now run: node seed-teams.js`);
}

run().catch(err => {
  console.error('Fetch failed:', err);
  process.exit(1);
});
