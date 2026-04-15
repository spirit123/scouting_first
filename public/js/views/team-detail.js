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
          <a href="#/gallery" style="font-size:20px; text-decoration:none;">←</a>
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
        allPhotos.push({ src: Camera.createPreviewURL(e.imageBlob), label: `${e.scoutName || 'Scout'} (pending)`, source: null });
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
          return `<div class="photo-thumb ${isSelected ? 'thumb-selected' : ''}" data-source="${UI.esc(p.source || '')}" title="${UI.esc(p.label)}">
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
    const role = e.role;
    const color = roleColors[role] || '#999';
    const icon = roleIcons[role] || '📋';
    const scout = (isLocal ? e.scoutName : e.scout_name) || 'Unknown';
    const notes = e.notes || '';
    const time = isLocal ? e.createdAt : e.created_at;
    const hasPhoto = isLocal ? !!e.imageBlob : !!e.has_photo;

    return `<div class="card" style="padding:10px; border-left: 4px solid ${color};">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:18px;">${icon}</span>
        <div style="flex:1;">
          <span style="font-weight:600; color:${color};">${UI.esc(role || 'no role')}</span>
          <span style="color:var(--text-secondary);"> · ${UI.esc(scout)} · ${UI.formatTime(time)}</span>
          ${hasPhoto ? ' 📷' : ''}
        </div>
      </div>
      ${notes ? `<div style="font-size:13px; margin-top:4px;">${UI.esc(notes)}</div>` : ''}
    </div>`;
  },
};
