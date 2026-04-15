// === FTC Scout — Diagnostic Tests ===
// Run: node test.js

const http = require('http');

const BASE = 'http://localhost:3000';

function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: opts.method || 'GET',
      headers: opts.headers || {},
    };

    const req = http.request(reqOpts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data, json: () => JSON.parse(data) });
      });
    });

    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

// Multipart form builder (minimal, for testing)
function buildMultipart(fields, files) {
  const boundary = '----TestBoundary' + Date.now();
  let body = '';

  for (const [name, value] of Object.entries(fields)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${name}"\r\n\r\n`;
    body += `${value}\r\n`;
  }

  for (const [name, { filename, content }] of Object.entries(files)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`;
    body += `Content-Type: image/jpeg\r\n\r\n`;
    body += `${content}\r\n`;
  }

  body += `--${boundary}--\r\n`;
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

async function run() {
  console.log('=== FTC Scout Diagnostic Tests ===');
  console.log(`Server: ${BASE}\n`);

  // --- Test 1: Server is running ---
  console.log('Test 1: Server status');
  try {
    const res = await fetch(`${BASE}/api/status`);
    const data = res.json();
    assert(res.status === 200, 'Status endpoint returns 200');
    assert(data.ok === true, 'Status ok: true');
    assert(data.teamCount > 0, `Teams loaded: ${data.teamCount}`);
    console.log(`  Info: ${data.teamCount} teams, ${data.entryCount} entries\n`);
  } catch (e) {
    console.log(`  ✗ FAIL: Cannot reach server at ${BASE}`);
    console.log('  Make sure the server is running: node server.js\n');
    process.exit(1);
  }

  // --- Test 2: Teams API ---
  console.log('Test 2: Teams API');
  const teamsRes = await fetch(`${BASE}/api/teams`);
  const teams = teamsRes.json();
  assert(teamsRes.status === 200, 'GET /api/teams returns 200');
  assert(Array.isArray(teams), 'Returns an array');
  assert(teams.length > 0, `Has ${teams.length} teams`);
  const team16 = teams.find(t => t.team_number === 16);
  assert(!!team16, 'Team 16 (Bomb Squad) exists');
  if (team16) {
    assert(team16.team_name === 'Bomb Squad', `Team 16 name: ${team16.team_name}`);
    assert(team16.robot_image_url != null, `Team 16 has robot_image_url`);
  }
  console.log('');

  // --- Test 3: Sync entry WITHOUT photo ---
  console.log('Test 3: Sync entry without photo');
  const entry1 = {
    uuid: 'test-' + Date.now() + '-1',
    teamNumber: 16,
    role: 'scorer',
    scoutName: 'TestScout',
    notes: 'Test notes for scorer',
    createdAt: new Date().toISOString(),
  };
  const form1 = buildMultipart({
    metadata: JSON.stringify([entry1]),
  }, {});
  const sync1 = await fetch(`${BASE}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': form1.contentType },
    body: form1.body,
  });
  const sync1Data = sync1.json();
  assert(sync1.status === 200, 'Sync returns 200');
  assert(sync1Data.synced.length === 1, `Synced 1 entry`);
  assert(sync1Data.synced[0] === entry1.uuid, 'Correct UUID synced');
  assert(sync1Data.errors.length === 0, 'No errors');
  console.log('');

  // --- Test 4: Sync entry WITH photo ---
  console.log('Test 4: Sync entry with photo');
  const entry2 = {
    uuid: 'test-' + Date.now() + '-2',
    teamNumber: 16,
    role: 'defender',
    scoutName: 'TestScout',
    notes: 'Defender test notes',
    createdAt: new Date().toISOString(),
  };
  const form2 = buildMultipart({
    metadata: JSON.stringify([entry2]),
  }, {
    [`photo_${entry2.uuid}`]: { filename: `${entry2.uuid}.jpg`, content: 'FAKE_JPEG_DATA' },
  });
  const sync2 = await fetch(`${BASE}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': form2.contentType },
    body: form2.body,
  });
  const sync2Data = sync2.json();
  assert(sync2.status === 200, 'Sync returns 200');
  assert(sync2Data.synced.length === 1, 'Synced 1 entry with photo');
  console.log('');

  // --- Test 5: Query entries for team 16 ---
  console.log('Test 5: Query entries for team 16');
  const entriesRes = await fetch(`${BASE}/api/entries?team=16`);
  const entries = entriesRes.json();
  assert(entriesRes.status === 200, 'GET /api/entries?team=16 returns 200');
  assert(Array.isArray(entries), 'Returns an array');
  assert(entries.length >= 2, `Has ${entries.length} entries (expected >= 2)`);

  const found1 = entries.find(e => e.uuid === entry1.uuid);
  const found2 = entries.find(e => e.uuid === entry2.uuid);
  assert(!!found1, 'Entry 1 (scorer, no photo) found');
  if (found1) {
    assert(found1.role === 'scorer', `Entry 1 role: ${found1.role}`);
    assert(found1.scout_name === 'TestScout', `Entry 1 scout: ${found1.scout_name}`);
    assert(found1.notes === 'Test notes for scorer', `Entry 1 notes: ${found1.notes}`);
    assert(found1.has_photo === 0, `Entry 1 has_photo: ${found1.has_photo} (expected 0)`);
  }
  assert(!!found2, 'Entry 2 (defender, with photo) found');
  if (found2) {
    assert(found2.role === 'defender', `Entry 2 role: ${found2.role}`);
    assert(found2.has_photo === 1, `Entry 2 has_photo: ${found2.has_photo} (expected 1)`);
  }
  console.log('');

  // --- Test 6: Verify latest entry is returned first ---
  console.log('Test 6: Entry ordering (latest first)');
  assert(entries[0].created_at >= entries[entries.length - 1].created_at,
    'Entries ordered by created_at DESC');
  const latestEntry = entries[0];
  console.log(`  Latest entry: uuid=${latestEntry.uuid}, role=${latestEntry.role}, notes="${latestEntry.notes}"`);
  console.log('');

  // --- Test 7: Duplicate detection ---
  console.log('Test 7: Duplicate detection');
  const form3 = buildMultipart({
    metadata: JSON.stringify([entry1]),
  }, {});
  const sync3 = await fetch(`${BASE}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': form3.contentType },
    body: form3.body,
  });
  const sync3Data = sync3.json();
  assert(sync3Data.duplicates.length === 1, 'Duplicate detected');
  assert(sync3Data.synced.length === 0, 'Nothing new synced');
  console.log('');

  // --- Test 8: Export CSV ---
  console.log('Test 8: Export CSV');
  const csvRes = await fetch(`${BASE}/api/export/csv`);
  assert(csvRes.status === 200, 'CSV export returns 200');
  const csv = csvRes.body;
  assert(csv.includes('role'), 'CSV header contains role column');
  assert(csv.includes('scorer'), 'CSV contains scorer entry');
  assert(csv.includes('defender'), 'CSV contains defender entry');
  console.log('');

  // --- Test 9: Client-side pre-fill logic simulation ---
  console.log('Test 9: Simulate client-side pre-fill logic');
  // This is what the scout view does when selecting a team
  const allEntries = entries;
  const sorted = [...allEntries].sort((a, b) => {
    const timeA = a.createdAt || a.created_at || '';
    const timeB = b.createdAt || b.created_at || '';
    return timeB.localeCompare(timeA);
  });
  const latest = sorted[0];
  assert(!!latest, 'Latest entry found by sort');
  if (latest) {
    assert(!!latest.role, `Latest entry has role: "${latest.role}"`);
    assert(latest.notes != null, `Latest entry has notes: "${latest.notes}"`);
    console.log(`  Pre-fill would set: role="${latest.role}", notes="${latest.notes}"`);

    // Check the field names — this is likely the bug!
    console.log(`  Entry field names: ${Object.keys(latest).join(', ')}`);
    assert('created_at' in latest || 'createdAt' in latest,
      'Entry has timestamp field (created_at or createdAt)');
    assert('role' in latest, 'Entry has role field');
    assert('notes' in latest, 'Entry has notes field');
    assert('scout_name' in latest || 'scoutName' in latest,
      'Entry has scout name field');
  }
  console.log('');

  // --- Test 10: Teams API includes photo UUID and thumbnail ---
  console.log('Test 10: Teams API photo/thumbnail fields');
  const teamsRes2 = await fetch(`${BASE}/api/teams`);
  const teams2 = teamsRes2.json();
  const team16b = teams2.find(t => t.team_number === 16);
  assert(!!team16b, 'Team 16 found in teams list');
  if (team16b) {
    assert('latest_photo_uuid' in team16b, 'Teams API includes latest_photo_uuid field');
    assert('thumbnail_source' in team16b, 'Teams API includes thumbnail_source field');
    assert(team16b.latest_photo_uuid === entry2.uuid,
      `latest_photo_uuid is the photo entry: ${team16b.latest_photo_uuid}`);
    assert(team16b.entry_count >= 2, `entry_count >= 2: ${team16b.entry_count}`);
    assert(team16b.photo_count >= 1, `photo_count >= 1 (only entries with files): ${team16b.photo_count}`);
  }
  console.log('');

  // --- Test 11: Entry without photo has no image endpoint ---
  console.log('Test 11: Entry without photo returns 404 for image');
  const noPhotoImg = await fetch(`${BASE}/api/entries/${entry1.uuid}/image`);
  assert(noPhotoImg.status === 404, `No-photo entry image returns 404 (got ${noPhotoImg.status})`);
  console.log('');

  // --- Test 12: Entry with photo serves image ---
  console.log('Test 12: Entry with photo serves image');
  const withPhotoImg = await fetch(`${BASE}/api/entries/${entry2.uuid}/image`);
  assert(withPhotoImg.status === 200, `Photo entry image returns 200 (got ${withPhotoImg.status})`);
  console.log('');

  // --- Test 13: Set team thumbnail ---
  console.log('Test 13: Set team thumbnail');
  const thumbRes = await fetch(`${BASE}/api/teams/16/thumbnail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoSource: entry2.uuid }),
  });
  assert(thumbRes.status === 200, 'Set thumbnail returns 200');

  // Verify thumbnail is reflected in teams API
  const teamsRes3 = await fetch(`${BASE}/api/teams`);
  const teams3 = teamsRes3.json();
  const team16c = teams3.find(t => t.team_number === 16);
  assert(team16c.thumbnail_source === entry2.uuid,
    `Thumbnail source set to photo UUID: ${team16c.thumbnail_source}`);

  // Set thumbnail to "default" (pre-loaded image)
  await fetch(`${BASE}/api/teams/16/thumbnail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoSource: 'default' }),
  });
  const teamsRes4 = await fetch(`${BASE}/api/teams`);
  const team16d = teamsRes4.json().find(t => t.team_number === 16);
  assert(team16d.thumbnail_source === 'default',
    `Thumbnail source set to "default": ${team16d.thumbnail_source}`);
  console.log('');

  // --- Test 14: Thumbnail priority logic (client-side simulation) ---
  console.log('Test 14: Simulate thumbnail priority logic');
  // This mirrors the gallery view logic
  function getGalleryImage(team) {
    if (team.thumbnail_source === 'default') {
      return team.robot_image_url || '';
    } else if (team.thumbnail_source) {
      return `/api/entries/${team.thumbnail_source}/image`;
    } else if (team.latest_photo_uuid) {
      return `/api/entries/${team.latest_photo_uuid}/image`;
    } else {
      return team.robot_image_url || '';
    }
  }

  // Case 1: thumbnail set to specific photo
  const c1 = { thumbnail_source: 'some-uuid', latest_photo_uuid: 'other', robot_image_url: 'http://img.jpg' };
  assert(getGalleryImage(c1) === '/api/entries/some-uuid/image', 'Chosen thumbnail wins');

  // Case 2: thumbnail set to "default"
  const c2 = { thumbnail_source: 'default', latest_photo_uuid: 'some-uuid', robot_image_url: 'http://img.jpg' };
  assert(getGalleryImage(c2) === 'http://img.jpg', '"default" thumbnail uses pre-loaded image');

  // Case 3: no thumbnail set, has scout photo
  const c3 = { thumbnail_source: null, latest_photo_uuid: 'photo-uuid', robot_image_url: 'http://img.jpg' };
  assert(getGalleryImage(c3) === '/api/entries/photo-uuid/image', 'Falls back to latest scout photo');

  // Case 4: no thumbnail, no scout photo, has pre-loaded image
  const c4 = { thumbnail_source: null, latest_photo_uuid: null, robot_image_url: 'http://img.jpg' };
  assert(getGalleryImage(c4) === 'http://img.jpg', 'Falls back to pre-loaded image');

  // Case 5: nothing at all
  const c5 = { thumbnail_source: null, latest_photo_uuid: null, robot_image_url: null };
  assert(getGalleryImage(c5) === '', 'No image returns empty string');
  console.log('');

  // --- Test 15: Scout image priority (client-side simulation) ---
  console.log('Test 15: Simulate scout view image priority');
  // This mirrors the scout view _loadTeamData logic
  function getScoutImage(localEntries, team) {
    const localWithPhoto = localEntries.find(e => e.imageBlob);
    if (localWithPhoto) return 'local-blob';
    if (team.latestPhotoUuid) return 'server-photo';
    if (team.robotImageUrl) return 'pre-loaded';
    return 'none';
  }

  // Case 1: local photo exists (even if not synced)
  assert(getScoutImage([{ imageBlob: 'blob' }], { latestPhotoUuid: 'x', robotImageUrl: 'y' }) === 'local-blob',
    'Local unsynced photo takes priority');

  // Case 2: no local photo, server photo exists
  assert(getScoutImage([], { latestPhotoUuid: 'x', robotImageUrl: 'y' }) === 'server-photo',
    'Server photo is second priority');

  // Case 3: no photos at all, pre-loaded exists
  assert(getScoutImage([], { latestPhotoUuid: null, robotImageUrl: 'y' }) === 'pre-loaded',
    'Pre-loaded image is third priority');

  // Case 4: nothing
  assert(getScoutImage([], { latestPhotoUuid: null, robotImageUrl: null }) === 'none',
    'No image when nothing available');

  // Case 5: local photo without blob (entry saved without photo) should NOT count
  assert(getScoutImage([{ imageBlob: null }, { imageBlob: undefined }], { latestPhotoUuid: null, robotImageUrl: 'y' }) === 'pre-loaded',
    'Local entries without imageBlob do not count as photos');
  console.log('');

  // --- Test 16: Scout management ---
  console.log('Test 16: Scout management');
  // Add scouts
  const s1 = await fetch(`${BASE}/api/scouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'TestScoutA' }),
  });
  assert(s1.status === 200, 'Add scout A');

  const s2 = await fetch(`${BASE}/api/scouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'TestScoutB' }),
  });
  assert(s2.status === 200, 'Add scout B');

  // Duplicate scout
  const s3 = await fetch(`${BASE}/api/scouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'TestScoutA' }),
  });
  assert(s3.status === 409, `Duplicate scout returns 409 (got ${s3.status})`);

  // List scouts
  const scoutList = await fetch(`${BASE}/api/scouts`);
  const scouts = scoutList.json();
  assert(scouts.some(s => s.name === 'TestScoutA'), 'TestScoutA in scout list');
  assert(scouts.some(s => s.name === 'TestScoutB'), 'TestScoutB in scout list');
  console.log('');

  // --- Test 17: Auto-assign ---
  console.log('Test 17: Auto-assign teams to scouts');
  const autoRes = await fetch(`${BASE}/api/scouts/assignments/auto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ perTeam: 2 }),
  });
  const autoData = autoRes.json();
  assert(autoRes.status === 200, 'Auto-assign returns 200');
  assert(autoData.ok === true, 'Auto-assign ok');
  assert(autoData.perTeam === 2, 'perTeam is 2');
  assert(autoData.summary.length >= 2, `Summary has ${autoData.summary.length} scouts`);

  // Each scout should have assignments
  for (const s of autoData.summary) {
    assert(s.assignedCount > 0, `${s.name} has ${s.assignedCount} assignments`);
  }

  // Check assignments for TestScoutA
  const aRes = await fetch(`${BASE}/api/scouts/assignments?scout=TestScoutA`);
  const aData = aRes.json();
  assert(Array.isArray(aData), 'Assignments is an array');
  assert(aData.length > 0, `TestScoutA has ${aData.length} assignments`);
  assert(aData[0].team_number > 0, 'Assignment has team_number');
  assert(aData[0].team_name !== undefined, 'Assignment has team_name');
  assert('completed' in aData[0], 'Assignment has completed field');

  // Verify each team has exactly 2 scouts
  const allAssignRes = await fetch(`${BASE}/api/scouts/assignments`);
  const allAssign = allAssignRes.json();
  const teamCounts = {};
  for (const a of allAssign) {
    teamCounts[a.team_number] = (teamCounts[a.team_number] || 0) + 1;
  }
  const allHaveTwo = Object.values(teamCounts).every(c => c === 2);
  assert(allHaveTwo, `All teams have exactly 2 scouts assigned`);
  console.log('');

  // --- Test 18: Assignment completion tracking ---
  console.log('Test 18: Assignment completion tracking');
  // TestScoutA is assigned to team 16 (from auto-assign). entry1 was made by "TestScout" not "TestScoutA"
  // So team 16 should NOT be completed for TestScoutA
  const a16 = aData.find(a => a.team_number === 16);
  if (a16) {
    assert(a16.completed === 0, `Team 16 not completed for TestScoutA (entry was by "TestScout")`);
  }

  // Sync an entry as TestScoutA for one of their assigned teams
  const assignedTeam = aData[0].team_number;
  const completionEntry = {
    uuid: 'test-completion-' + Date.now(),
    teamNumber: assignedTeam,
    role: 'scorer',
    scoutName: 'TestScoutA',
    notes: 'Completion test',
    createdAt: new Date().toISOString(),
  };
  const compForm = buildMultipart({
    metadata: JSON.stringify([completionEntry]),
  }, {});
  await fetch(`${BASE}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': compForm.contentType },
    body: compForm.body,
  });

  // Now check if that assignment is marked completed
  const aRes2 = await fetch(`${BASE}/api/scouts/assignments?scout=TestScoutA`);
  const aData2 = aRes2.json();
  const completedAssignment = aData2.find(a => a.team_number === assignedTeam);
  assert(completedAssignment && completedAssignment.completed === 1,
    `Team ${assignedTeam} now completed for TestScoutA`);
  console.log('');

  // --- Cleanup ---
  console.log('Cleanup: removing test data');
  await fetch(`${BASE}/api/entries/${entry1.uuid}`, { method: 'DELETE' });
  await fetch(`${BASE}/api/entries/${entry2.uuid}`, { method: 'DELETE' });
  await fetch(`${BASE}/api/entries/${completionEntry.uuid}`, { method: 'DELETE' });
  await fetch(`${BASE}/api/scouts/TestScoutA`, { method: 'DELETE' });
  await fetch(`${BASE}/api/scouts/TestScoutB`, { method: 'DELETE' });
  // Reset thumbnail
  await fetch(`${BASE}/api/teams/16/thumbnail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoSource: 'default' }),
  });
  console.log('  Done\n');

  // --- Summary ---
  console.log('========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('\nFailed tests may indicate the pre-fill bug.');
  } else {
    console.log('\nAll server-side tests pass.');
    console.log('If the pre-fill still fails in the browser, check the browser console for errors.');
    console.log('The issue is likely in the IndexedDB read or field name mismatch between local/server entries.');
  }
  console.log('========================================');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
