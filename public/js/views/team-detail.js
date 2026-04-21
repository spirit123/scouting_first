// === Team Detail View ===
const TeamDetailView = {
  async render(container, teamNumber) {
    const num = parseInt(teamNumber, 10);
    const team = Teams.get(num);
    const teamName = team ? team.teamName : 'Unknown Team';
    const teamInfo = team ? [team.city, team.state, team.country].filter(Boolean).join(', ') : '';
    const robotImg = team ? team.robotImageUrl : null;

    container.innerHTML = `
      <div class="card">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <a href="#/gallery" class="back-link" style="padding:0;">←</a>
          <div>
            <div style="font-size:20px; font-weight:700;">Team #${num}</div>
            <div style="font-size:14px; color:var(--text-secondary);">${UI.esc(teamName)}</div>
            ${teamInfo ? `<div style="font-size:12px; color:var(--text-secondary);">${UI.esc(teamInfo)}</div>` : ''}
          </div>
        </div>
        <div id="team-all-photos"></div>
        ${this._renderStats(team)}
        <a href="#/scout/${num}" class="btn btn-primary mt-8">Scout This Team</a>
      </div>
      <div id="team-entries">Loading...</div>
    `;

    await this._loadEntries(num, robotImg);
  },

  async _loadEntries(teamNumber, robotImg) {
    const container = UI.$('#team-entries');
    const photosContainer = UI.$('#team-all-photos');
    let serverEntries = [];

    try {
      const res = await fetch(`/api/entries?team=${teamNumber}`);
      if (res.ok) serverEntries = await res.json();
    } catch (e) {}

    const localEntries = await DB.getEntriesByTeam(teamNumber);
    const localUnsynced = localEntries.filter(e => !e.synced);

    // Collect ALL photos: pre-loaded robot image + local unsynced + server
    // Determine current thumbnail source
    const team = Teams.get(teamNumber);
    const currentThumb = team ? team.thumbnailSource : null;

    const allPhotos = [];
    if (robotImg) {
      allPhotos.push({ src: robotImg, label: 'Team photo', source: 'default' });
    }
    for (const e of localUnsynced) {
      if (e.imageBlob) {
        allPhotos.push({ src: Camera.createPreviewURL(e.imageBlob), label: `${e.scoutName || 'Scout'} (pending sync)`, source: null, pending: true });
      }
    }
    for (const e of serverEntries) {
      if (e.has_photo) {
        allPhotos.push({ src: `/api/entries/${encodeURIComponent(e.uuid)}/image`, label: e.scout_name || 'Scout', source: e.uuid });
      }
    }

    // Render photos grid with thumbnail selector
    if (allPhotos.length > 0) {
      photosContainer.innerHTML = `
        <div style="font-size:12px; color:var(--text-secondary); margin-top:8px; margin-bottom:4px;">Tap a photo to set as team thumbnail</div>
        <div class="photo-grid" style="margin-top:4px;">
        ${allPhotos.map(p => {
          const isSelected = currentThumb ? currentThumb === p.source : (!currentThumb && p.source === allPhotos[allPhotos.length - 1].source);
          return `<div class="photo-thumb ${isSelected ? 'thumb-selected' : ''} ${p.pending ? 'thumb-pending' : ''}" data-source="${UI.esc(p.source || '')}" title="${UI.esc(p.label)}">
            <img src="${UI.esc(p.src)}" alt="${UI.esc(p.label)}" loading="lazy">
            ${isSelected ? '<div class="thumb-badge">★</div>' : ''}
          </div>`;
        }).join('')}
      </div>`;

      photosContainer.querySelectorAll('.photo-thumb').forEach(thumb => {
        thumb.addEventListener('click', async () => {
          const source = thumb.dataset.source;
          if (!source) {
            // Local unsynced photo — can't set as thumbnail yet
            const img = thumb.querySelector('img');
            if (img && img.src) App.showPhotoViewer(img.src);
            return;
          }

          // Set as thumbnail
          const res = await fetch(`/api/teams/${teamNumber}/thumbnail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoSource: source }),
          });

          if (res.ok) {
            // Update local teams cache
            if (team) team.thumbnailSource = source;
            UI.toast('Thumbnail updated', 'success');
            // Refresh the grid to show selection
            await this._loadEntries(teamNumber, robotImg);
          } else {
            UI.toast('Failed to set thumbnail', 'error');
          }
        });
      });
    }

    // Render entries list
    if (serverEntries.length === 0 && localUnsynced.length === 0) {
      UI.showEmpty(container, '📋', 'No scouting data yet for this team');
      return;
    }

    const roleColors = { scorer: '#4caf50', feeder: '#2196f3', defender: '#ff9800' };
    const roleIcons = { scorer: '🎯', feeder: '🤝', defender: '🛡️' };
    let html = '';

    // Capability summary across all entries
    const splitCsv = (val) => val ? String(val).split(',').map(s => s.trim()).filter(Boolean) : [];
    const cap = {
      bumpsYes: 0, bumpsNo: 0,
      trenchesYes: 0, trenchesNo: 0,
      climb: { L1: 0, L2: 0, L3: 0 },
      drive: { tank: 0, swerve: 0, mecanum: 0, other: 0 },
      autoPos: { left: 0, center: 0, right: 0 },
      autoPerf: { none: 0, minimal: 0, reliable: 0, strong: 0 },
      autoAct: { leaves_zone: 0, scores_fuel: 0, climbs_tower: 0, crosses_obstacle: 0 },
    };
    const allForCap = [...localUnsynced, ...serverEntries];
    for (const e of allForCap) {
      const pb = e.passesBumps ?? e.passes_bumps;
      const ut = e.underTrenches ?? e.under_trenches;
      const cl = e.climbLevel ?? e.climb_level;
      const dt = e.drivetrain;
      const ap = e.autoStartPosition ?? e.auto_start_position;
      const af = e.autoPerformance ?? e.auto_performance;
      const aa = splitCsv(e.autoActions ?? e.auto_actions);
      if (pb === 'yes') cap.bumpsYes++; else if (pb === 'no') cap.bumpsNo++;
      if (ut === 'yes') cap.trenchesYes++; else if (ut === 'no') cap.trenchesNo++;
      if (cl === 'L1' || cl === 'L2' || cl === 'L3') cap.climb[cl]++;
      if (dt && cap.drive[dt] !== undefined) cap.drive[dt]++;
      if (ap && cap.autoPos[ap] !== undefined) cap.autoPos[ap]++;
      if (af && cap.autoPerf[af] !== undefined) cap.autoPerf[af]++;
      for (const a of aa) if (cap.autoAct[a] !== undefined) cap.autoAct[a]++;
    }
    const capParts = [];
    if (cap.bumpsYes || cap.bumpsNo) capParts.push(`🚧 Bumps: ${cap.bumpsYes}✓ / ${cap.bumpsNo}✗`);
    if (cap.trenchesYes || cap.trenchesNo) capParts.push(`🕳️ Trenches: ${cap.trenchesYes}✓ / ${cap.trenchesNo}✗`);
    if (cap.climb.L1 || cap.climb.L2 || cap.climb.L3) {
      const parts = [];
      for (const lvl of ['L1', 'L2', 'L3']) if (cap.climb[lvl]) parts.push(`${lvl}×${cap.climb[lvl]}`);
      capParts.push(`🧗 Climb: ${parts.join(', ')}`);
    }
    const driveParts = [];
    for (const dt of ['tank', 'swerve', 'mecanum', 'other']) {
      if (cap.drive[dt]) driveParts.push(`${dt}×${cap.drive[dt]}`);
    }
    if (driveParts.length) capParts.push(`⚙️ Drive: ${driveParts.join(', ')}`);
    const posParts = [];
    for (const p of ['left', 'center', 'right']) if (cap.autoPos[p]) posParts.push(`${p}×${cap.autoPos[p]}`);
    if (posParts.length) capParts.push(`🤖 Auto start: ${posParts.join(', ')}`);
    const perfParts = [];
    for (const p of ['none', 'minimal', 'reliable', 'strong']) if (cap.autoPerf[p]) perfParts.push(`${p}×${cap.autoPerf[p]}`);
    if (perfParts.length) capParts.push(`▶️ Auto: ${perfParts.join(', ')}`);
    const actLabel = { leaves_zone: 'leaves', scores_fuel: 'fuel', climbs_tower: 'tower', crosses_obstacle: 'obstacle' };
    const actParts = [];
    for (const a of ['leaves_zone', 'scores_fuel', 'climbs_tower', 'crosses_obstacle']) {
      if (cap.autoAct[a]) actParts.push(`${actLabel[a]}×${cap.autoAct[a]}`);
    }
    if (actParts.length) capParts.push(`🎯 Auto acts: ${actParts.join(', ')}`);
    if (capParts.length > 0) {
      html += `<div class="card" style="padding:8px; font-size:13px; color:var(--text-secondary);">${capParts.join(' · ')}</div>`;
    }

    // Local unsynced entries
    if (localUnsynced.length > 0) {
      html += `<div class="section-header"><span class="section-title">Pending Upload (${localUnsynced.length})</span></div>`;
      for (const e of localUnsynced) {
        html += this._renderEntry(e, { roleColors, roleIcons, isLocal: true });
      }
    }

    // Server entries
    if (serverEntries.length > 0) {
      html += `<div class="section-header mt-16"><span class="section-title">Synced (${serverEntries.length})</span></div>`;
      for (const e of serverEntries) {
        html += this._renderEntry(e, { roleColors, roleIcons, isLocal: false });
      }
    }

    container.innerHTML = html;
  },

  _renderStats(team) {
    if (!team || team.opr == null) return '';

    const tierColors = { elite: '#ffd700', strong: '#c0c0c0', average: '#cd7f32', below_avg: '#e0e0e0', developing: '#f5f5f5' };

    let html = `<div style="margin-top:10px; padding:10px; background:var(--bg); border-radius:8px; border:1px solid var(--border);">`;
    html += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
      <span style="font-size:14px; font-weight:700;">Stats</span>
      ${team.tier ? `<span class="tier-badge tier-${team.tier}">${team.tier}</span>` : ''}
      ${team.record ? `<span style="font-size:12px; color:var(--text-secondary);">${UI.esc(team.record)}</span>` : ''}
    </div>`;

    html += `<div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom:8px;">`;
    if (team.opr != null) html += `<div class="stat-card" style="padding:8px;"><div class="stat-value" style="font-size:20px;">${team.opr.toFixed(1)}</div><div class="stat-label">OPR</div></div>`;
    if (team.winRate != null) html += `<div class="stat-card" style="padding:8px;"><div class="stat-value" style="font-size:20px;">${team.winRate.toFixed(0)}%</div><div class="stat-label">Win Rate</div></div>`;
    if (team.composite != null) html += `<div class="stat-card" style="padding:8px;"><div class="stat-value" style="font-size:20px;">${team.composite.toFixed(0)}</div><div class="stat-label">Score</div></div>`;
    if (team.rookieYear) html += `<div class="stat-card" style="padding:8px;"><div class="stat-value" style="font-size:20px;">${2026 - team.rookieYear}</div><div class="stat-label">Yrs Exp</div></div>`;
    html += `</div>`;

    if (team.sourceEvent) html += `<div style="font-size:12px; color:var(--text-secondary);">Source: ${UI.esc(team.sourceEvent)} ${team.rankAtEvent ? '(Rank ' + UI.esc(team.rankAtEvent) + ')' : ''}</div>`;
    if (team.scoutingNotes) html += `<div style="font-size:13px; margin-top:4px; font-style:italic;">${UI.esc(team.scoutingNotes)}</div>`;

    html += `</div>`;
    return html;
  },

  _renderEntry(e, { roleColors, roleIcons, isLocal }) {
    const roles = (e.role ? String(e.role).split(',').map(s => s.trim()).filter(Boolean) : []);
    const borderColor = roles.length > 0 ? (roleColors[roles[0]] || '#999') : '#999';
    const scout = (isLocal ? e.scoutName : e.scout_name) || 'Unknown';
    const notes = e.notes || '';
    const time = isLocal ? e.createdAt : e.created_at;
    const hasPhoto = isLocal ? !!e.imageBlob : !!e.has_photo;
    const pb = e.passesBumps ?? e.passes_bumps;
    const ut = e.underTrenches ?? e.under_trenches;
    const cl = e.climbLevel ?? e.climb_level;
    const dt = e.drivetrain;
    const ap = e.autoStartPosition ?? e.auto_start_position;
    const af = e.autoPerformance ?? e.auto_performance;
    const aaRaw = e.autoActions ?? e.auto_actions;
    const aa = aaRaw ? String(aaRaw).split(',').map(s => s.trim()).filter(Boolean) : [];
    const an = e.autoNotes ?? e.auto_notes;

    const roleHtml = roles.length === 0
      ? `<span style="color:#999; font-weight:600;">📋 no role</span>`
      : roles.map(r => {
          const c = roleColors[r] || '#999';
          const ic = roleIcons[r] || '📋';
          return `<span style="font-weight:600; color:${c};">${ic} ${UI.esc(r)}</span>`;
        }).join(' ');

    const capBadges = [];
    if (pb === 'yes') capBadges.push('<span title="Passes bumps" style="color:var(--success); font-size:12px;">🚧✓</span>');
    else if (pb === 'no') capBadges.push('<span title="No bumps" style="color:var(--error); font-size:12px;">🚧✗</span>');
    if (ut === 'yes') capBadges.push('<span title="Under trenches" style="color:var(--success); font-size:12px;">🕳️✓</span>');
    else if (ut === 'no') capBadges.push('<span title="No trenches" style="color:var(--error); font-size:12px;">🕳️✗</span>');
    if (cl) capBadges.push(`<span title="Climb ${cl}" style="color:var(--accent); font-weight:600; font-size:12px;">🧗${cl}</span>`);
    if (dt) capBadges.push(`<span title="Drivetrain: ${dt}" style="color:var(--text-secondary); font-weight:600; font-size:12px;">⚙️${UI.esc(dt)}</span>`);
    if (ap) capBadges.push(`<span title="Auto start: ${ap}" style="color:var(--text-secondary); font-weight:600; font-size:12px;">🤖${ap[0].toUpperCase()}</span>`);
    if (af) capBadges.push(`<span title="Auto performance: ${af}" style="color:var(--text-secondary); font-weight:600; font-size:12px;">▶️${UI.esc(af)}</span>`);
    const actLabel = { leaves_zone: 'leaves', scores_fuel: 'fuel', climbs_tower: 'tower', crosses_obstacle: 'obstacle' };
    for (const a of aa) if (actLabel[a]) capBadges.push(`<span title="Auto action" style="color:var(--accent); font-size:12px;">${actLabel[a]}</span>`);

    return `<div class="card" style="padding:10px; border-left: 4px solid ${borderColor};">
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <div style="flex:1; min-width:0;">
          ${roleHtml}
          <span style="color:var(--text-secondary);"> · ${UI.esc(scout)} · ${UI.formatTime(time)}</span>
          ${capBadges.length ? ' ' + capBadges.join(' ') : ''}
          ${hasPhoto ? ' 📷' : ''}
        </div>
      </div>
      ${an ? `<div style="font-size:13px; margin-top:4px; font-style:italic; color:var(--text-secondary);">Auto: ${UI.esc(an)}</div>` : ''}
      ${notes ? `<div style="font-size:13px; margin-top:4px;">${UI.esc(notes)}</div>` : ''}
    </div>`;
  },
};
