// === Fetch Event Teams + Stats from The Blue Alliance ===
// Usage: TBA_KEY=your_key node fetch-event.js [event_key]
//
// If no event_key given, lists upcoming/recent events to choose from.
// Example: TBA_KEY=xxx node fetch-event.js 2026nvlv
//
// This replaces both the team list CSV and team_stats.json in one step.

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');
const config = require('./config');

const TBA_KEY = process.env.TBA_KEY || '';
const TBA_BASE = 'https://www.thebluealliance.com/api/v3';
const YEAR = process.env.TBA_YEAR || '2025';
const CONCURRENCY = 10;

if (!TBA_KEY) {
  console.error('ERROR: TBA API key required.');
  console.error('Get one free at: https://www.thebluealliance.com/account');
  console.error('Usage: TBA_KEY=your_key node fetch-event.js [event_key]');
  process.exit(1);
}

function tbaFetch(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(TBA_BASE + endpoint);
    https.get({
      hostname: url.hostname,
      path: url.pathname,
      headers: { 'X-TBA-Auth-Key': TBA_KEY },
    }, (res) => {
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

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

async function parallel(items, fn, limit) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    results.push(...await Promise.all(batch.map(fn)));
  }
  return results;
}

function tierFromComposite(c) {
  if (c >= 70) return 'elite';
  if (c >= 55) return 'strong';
  if (c >= 40) return 'average';
  if (c >= 25) return 'below_avg';
  return 'developing';
}

async function listEvents() {
  console.log(`Fetching ${YEAR} events...\n`);
  const events = await tbaFetch(`/events/${YEAR}`);
  if (!events || events.length === 0) {
    console.log('No events found.');
    return null;
  }

  // Sort by date, show upcoming and recent
  const now = new Date();
  const sorted = events
    .filter(e => e.event_type <= 5) // regionals, districts, champs
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  // Find events around now: past 2 weeks + future 4 weeks
  const twoWeeksAgo = new Date(now - 14 * 86400000);
  const fourWeeksOut = new Date(now.getTime() + 28 * 86400000);
  const relevant = sorted.filter(e => {
    const d = new Date(e.start_date);
    return d >= twoWeeksAgo && d <= fourWeeksOut;
  });

  const display = relevant.length > 0 ? relevant : sorted.slice(-20);

  console.log('Events:');
  console.log('─'.repeat(80));
  for (const e of display) {
    const start = e.start_date;
    const end = e.end_date;
    const status = new Date(e.end_date) < now ? 'DONE' : new Date(e.start_date) > now ? 'UPCOMING' : 'LIVE';
    const teamCount = e.team_count || '?';
    console.log(`  ${e.key.padEnd(16)} ${status.padEnd(9)} ${start} to ${end}  ${String(teamCount).padStart(3)} teams  ${e.name}`);
  }
  console.log('─'.repeat(80));
  console.log(`\nShowing ${display.length} of ${sorted.length} events. Use TBA_YEAR=XXXX for a different year.\n`);

  const answer = await ask('Enter event key (e.g. 2026nvlv): ');
  return answer || null;
}

async function fetchEvent(eventKey) {
  console.log(`\n=== Fetching event: ${eventKey} ===\n`);

  // Step 1: Get event info
  const eventInfo = await tbaFetch(`/event/${eventKey}`);
  if (!eventInfo) {
    console.error(`Event "${eventKey}" not found.`);
    process.exit(1);
  }
  console.log(`Event: ${eventInfo.name}`);
  console.log(`Dates: ${eventInfo.start_date} to ${eventInfo.end_date}`);
  console.log(`Location: ${eventInfo.city}, ${eventInfo.state_prov}, ${eventInfo.country}\n`);

  // Step 2: Get teams at this event
  console.log('Fetching teams...');
  const eventTeams = await tbaFetch(`/event/${eventKey}/teams`);
  if (!eventTeams || eventTeams.length === 0) {
    console.error('No teams found for this event.');
    process.exit(1);
  }
  console.log(`  ${eventTeams.length} teams\n`);

  // Step 3: Get OPR and rankings for this event (if available)
  console.log('Fetching event OPR + rankings...');
  const [eventOPRs, eventRankings] = await Promise.all([
    tbaFetch(`/event/${eventKey}/oprs`),
    tbaFetch(`/event/${eventKey}/rankings`),
  ]);

  const hasEventData = !!(eventOPRs && eventOPRs.oprs && Object.keys(eventOPRs.oprs).length > 0);
  console.log(`  Event OPR data: ${hasEventData ? 'available' : 'not yet (event hasn\'t started)'}`);
  console.log(`  Rankings: ${eventRankings && eventRankings.rankings ? eventRankings.rankings.length + ' teams' : 'not yet'}\n`);

  // Build ranking map from this event
  const rankMap = {};
  if (eventRankings && eventRankings.rankings) {
    const total = eventRankings.rankings.length;
    for (const r of eventRankings.rankings) {
      const rec = r.record;
      rankMap[r.team_key] = {
        rank: r.rank, total,
        record: rec ? `${rec.wins}-${rec.losses}-${rec.ties}` : null,
        wins: rec ? rec.wins : 0, losses: rec ? rec.losses : 0, ties: rec ? rec.ties : 0,
        avgRp: r.sort_orders && r.sort_orders.length > 0 ? Math.round(r.sort_orders[0] * 100) / 100 : null,
      };
    }
  }

  // Step 4: For teams without data at this event, fetch from their most recent prior event
  console.log('Fetching prior event data for teams without current event stats...');
  const teamsNeedingPriorData = eventTeams.filter(t => {
    const key = `frc${t.team_number}`;
    return !hasEventData || !(eventOPRs.oprs[key] != null);
  });

  // Fetch events for teams that need prior data
  const priorData = {}; // teamNumber -> { opr, rank, record, ... }
  if (teamsNeedingPriorData.length > 0) {
    console.log(`  ${teamsNeedingPriorData.length} teams need prior event data`);

    const priorResults = await parallel(teamsNeedingPriorData, async (team) => {
      try {
        const events = await tbaFetch(`/team/frc${team.team_number}/events/${YEAR}`);
        if (!events) return { num: team.team_number, data: null };

        const completed = events
          .filter(e => e.key !== eventKey && e.event_type <= 5 && e.end_date && new Date(e.end_date) < new Date())
          .sort((a, b) => new Date(b.end_date) - new Date(a.end_date));

        if (completed.length === 0) return { num: team.team_number, data: null };
        return { num: team.team_number, eventKey: completed[0].key, eventName: completed[0].short_name || completed[0].name, eventsPlayed: completed.length };
      } catch (e) {
        return { num: team.team_number, data: null };
      }
    }, CONCURRENCY);

    // Fetch OPR/rankings for unique prior events
    const priorEventKeys = new Set();
    for (const r of priorResults) {
      if (r.eventKey) priorEventKeys.add(r.eventKey);
    }

    const priorEventData = {};
    await parallel([...priorEventKeys], async (ek) => {
      try {
        const [oprs, ranks] = await Promise.all([
          tbaFetch(`/event/${ek}/oprs`),
          tbaFetch(`/event/${ek}/rankings`),
        ]);
        priorEventData[ek] = { oprs: oprs?.oprs || {}, rankings: {} };
        if (ranks?.rankings) {
          const total = ranks.rankings.length;
          for (const r of ranks.rankings) {
            const rec = r.record;
            priorEventData[ek].rankings[r.team_key] = {
              rank: r.rank, total,
              record: rec ? `${rec.wins}-${rec.losses}-${rec.ties}` : null,
              wins: rec ? rec.wins : 0, losses: rec ? rec.losses : 0, ties: rec ? rec.ties : 0,
              avgRp: r.sort_orders?.[0] ? Math.round(r.sort_orders[0] * 100) / 100 : null,
            };
          }
        }
      } catch (e) {}
    }, CONCURRENCY);

    // Map prior data to teams
    for (const r of priorResults) {
      if (r.eventKey && priorEventData[r.eventKey]) {
        const ed = priorEventData[r.eventKey];
        priorData[r.num] = {
          opr: ed.oprs[`frc${r.num}`] != null ? Math.round(ed.oprs[`frc${r.num}`] * 100) / 100 : null,
          rank: ed.rankings[`frc${r.num}`] || null,
          eventName: r.eventName,
          eventsPlayed: r.eventsPlayed,
        };
      }
    }
    console.log(`  Fetched data from ${priorEventKeys.size} prior events`);
  }

  // Step 5: Build team list CSV and stats
  console.log('\nBuilding team list and stats...\n');

  const teamList = [];
  const stats = [];

  for (const t of eventTeams) {
    const num = t.team_number;
    const key = `frc${num}`;

    // Team list entry
    teamList.push({
      team_number: num,
      team_name: t.nickname || t.name || '',
      city: t.city || '',
      state_prov: t.state_prov || '',
      country: t.country || '',
      robot_image_url: '',
    });

    // Stats: prefer current event data, fall back to prior
    let opr = null, record = null, rank = null, totalTeams = null, avgRp = null;
    let sourceEvent = eventInfo.short_name || eventInfo.name;
    let eventsPlayed = 1;

    if (hasEventData && eventOPRs.oprs[key] != null) {
      opr = Math.round(eventOPRs.oprs[key] * 100) / 100;
    }
    if (rankMap[key]) {
      const rm = rankMap[key];
      record = rm.record;
      rank = rm.rank;
      totalTeams = rm.total;
      avgRp = rm.avgRp;
    }

    // Fall back to prior event data
    if (opr == null && priorData[num]) {
      const pd = priorData[num];
      opr = pd.opr;
      sourceEvent = pd.eventName || sourceEvent;
      eventsPlayed = pd.eventsPlayed || 1;
      if (!record && pd.rank) {
        record = pd.rank.record;
        rank = pd.rank.rank;
        totalTeams = pd.rank.total;
        avgRp = pd.rank.avgRp;
      }
    }

    let winRate = null;
    if (record) {
      const parts = record.split('-').map(Number);
      const total = parts[0] + parts[1] + parts[2];
      if (total > 0) winRate = Math.round(((parts[0] + 0.5 * parts[2]) / total) * 1000) / 10;
    }

    // Composite
    let composite = 0;
    composite += (opr != null ? Math.min(100, Math.max(0, (opr / 200) * 100)) : 15) * 0.35;
    composite += (winRate != null ? winRate : 25) * 0.20;
    if (rank != null && totalTeams) {
      composite += (1 - (rank - 1) / Math.max(1, totalTeams - 1)) * 100 * 0.10;
    } else { composite += 25 * 0.10; }
    composite += (avgRp != null ? Math.min(100, (avgRp / 4.5) * 100) : 25) * 0.10;
    const rookieYear = t.rookie_year;
    if (rookieYear) composite += (Math.min(30, 2026 - rookieYear) / 30) * 100 * 0.05;
    if (eventsPlayed > 1) composite += Math.min(100, eventsPlayed * 33) * 0.05;
    composite = Math.round(composite * 10) / 10;

    const tier = tierFromComposite(composite);

    const notes = [];
    if (eventsPlayed > 1) notes.push(`${eventsPlayed} events played`);
    if (rookieYear && rookieYear >= parseInt(YEAR)) notes.push('ROOKIE');
    if (opr != null && opr > 150) notes.push('Elite scorer');
    if (opr != null && opr < 0) notes.push('Negative OPR');
    if (winRate != null && winRate >= 80) notes.push('Dominant record');

    console.log(`  #${num} ${(t.nickname || '').padEnd(25)} OPR=${String(opr || '?').padEnd(8)} ${(record || '?').padEnd(8)} ${tier} (${composite})`);

    stats.push({
      team_number: num, opr, win_rate: winRate, avg_score: null, avg_rp: avgRp,
      composite, tier, record, source_event: sourceEvent,
      rank_at_event: rank && totalTeams ? `${rank}/${totalTeams}` : null,
      rookie_year: rookieYear,
      scouting_notes: notes.join('. '),
    });
  }

  // Write team list CSV
  const csvHeader = 'team_number,team_name,city,state_prov,country,robot_image_url';
  const csvRows = teamList.map(t =>
    [t.team_number, t.team_name, t.city, t.state_prov, t.country, t.robot_image_url].join(',')
  );
  const csvPath = config.teamsFile;
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'));
  console.log(`\nWrote ${teamList.length} teams to ${csvPath}`);

  // Write stats
  const statsPath = path.join(__dirname, 'team_stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  console.log(`Wrote ${stats.length} team stats to ${statsPath}`);

  // Save event key for reference
  fs.writeFileSync(path.join(__dirname, '.event'), eventKey);

  console.log(`\nDone! Now run: node seed-teams.js && bash scripts/start.sh`);
}

async function run() {
  let eventKey = process.argv[2];

  if (!eventKey) {
    eventKey = await listEvents();
    if (!eventKey) {
      console.log('No event selected.');
      process.exit(0);
    }
  }

  await fetchEvent(eventKey);
}

run().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
