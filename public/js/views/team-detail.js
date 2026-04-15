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
        ${robotImg ? `<img src="${UI.esc(robotImg)}" alt="Team ${num} robot" style="width:100%; max-height:250px; object-fit:contain; border-radius:8px; margin-top:10px;">` : ''}
      </div>
      <div id="team-entries">Loading...</div>
    `;

    await this._loadEntries(num);
  },

  async _loadEntries(teamNumber) {
    const container = UI.$('#team-entries');
    let serverEntries = [];

    try {
      const res = await fetch(`/api/entries?team=${teamNumber}`);
      if (res.ok) serverEntries = await res.json();
    } catch (e) {}

    const localEntries = await DB.getEntriesByTeam(teamNumber);
    const localUnsynced = localEntries.filter(e => !e.synced);

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
        html += this._renderEntry(e, {
          imgSrc: e.imageBlob ? Camera.createPreviewURL(e.imageBlob) : null,
          roleColors, roleIcons, isLocal: true
        });
      }
    }

    // Server entries
    if (serverEntries.length > 0) {
      html += `<div class="section-header mt-16"><span class="section-title">Synced (${serverEntries.length})</span></div>`;

      // Photos grid
      const withPhotos = serverEntries.filter(e => e.has_photo);
      if (withPhotos.length > 0) {
        html += '<div class="photo-grid mb-12">';
        for (const e of withPhotos) {
          html += `<div class="photo-thumb" data-uuid="${UI.esc(e.uuid)}">
            <img src="/api/entries/${encodeURIComponent(e.uuid)}/image" alt="Team ${teamNumber}" loading="lazy">
          </div>`;
        }
        html += '</div>';
      }

      // Entry details
      for (const e of serverEntries) {
        html += this._renderEntry(e, {
          imgSrc: e.has_photo ? `/api/entries/${encodeURIComponent(e.uuid)}/image` : null,
          roleColors, roleIcons, isLocal: false
        });
      }
    }

    container.innerHTML = html;

    // Photo viewer handlers
    container.querySelectorAll('.photo-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const img = thumb.querySelector('img');
        if (img && img.src) App.showPhotoViewer(img.src);
      });
    });
  },

  _renderEntry(e, { roleColors, roleIcons, isLocal }) {
    const role = e.role || (isLocal ? e.role : e.role);
    const color = roleColors[role] || '#999';
    const icon = roleIcons[role] || '📋';
    const scout = (isLocal ? e.scoutName : e.scout_name) || 'Unknown';
    const notes = e.notes || '';
    const time = isLocal ? e.createdAt : e.created_at;

    return `<div class="card" style="padding:10px; border-left: 4px solid ${color};">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:18px;">${icon}</span>
        <div style="flex:1;">
          <span style="font-weight:600; color:${color};">${UI.esc(role || 'no role')}</span>
          <span style="color:var(--text-secondary);"> · ${UI.esc(scout)} · ${UI.formatTime(time)}</span>
        </div>
      </div>
      ${notes ? `<div style="font-size:13px; margin-top:4px;">${UI.esc(notes)}</div>` : ''}
    </div>`;
  },
};
