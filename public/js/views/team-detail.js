// === Team Detail View ===
const TeamDetailView = {
  async render(container, teamNumber) {
    const num = parseInt(teamNumber, 10);
    const team = Teams.get(num);
    const teamName = team ? team.teamName : 'Unknown Team';
    const teamInfo = team ? [team.school, team.city, team.state].filter(Boolean).join(', ') : '';

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
      </div>
      <div id="team-photos">Loading...</div>
    `;

    await this._loadPhotos(num);
  },

  async _loadPhotos(teamNumber) {
    const container = UI.$('#team-photos');
    let photos = [];

    // Try server first
    try {
      const res = await fetch(`/api/photos?team=${teamNumber}`);
      if (res.ok) {
        photos = await res.json();
      }
    } catch (e) {
      // Offline — use local photos
    }

    // Also get local unsynced photos for this team
    const localPhotos = await DB.getPhotosByTeam(teamNumber);
    const localUnsynced = localPhotos.filter(p => !p.synced);

    if (photos.length === 0 && localUnsynced.length === 0) {
      UI.showEmpty(container, '📷', 'No photos yet for this team');
      return;
    }

    let html = '';

    // Show local unsynced first
    if (localUnsynced.length > 0) {
      html += `<div class="section-header"><span class="section-title">Pending Upload (${localUnsynced.length})</span></div>`;
      html += '<div class="photo-grid">';
      for (const p of localUnsynced) {
        const url = p.imageBlob ? Camera.createPreviewURL(p.imageBlob) : '';
        html += `<div class="photo-thumb" data-local-uuid="${UI.esc(p.uuid)}">
          <img src="${url}" alt="Team ${teamNumber}">
        </div>`;
      }
      html += '</div>';
    }

    // Server photos
    if (photos.length > 0) {
      html += `<div class="section-header mt-16"><span class="section-title">Synced (${photos.length})</span></div>`;
      html += '<div class="photo-grid">';
      for (const p of photos) {
        html += `<div class="photo-thumb" data-uuid="${UI.esc(p.uuid)}">
          <img src="/api/photos/${encodeURIComponent(p.uuid)}/image" alt="Team ${teamNumber}" loading="lazy">
        </div>`;
      }
      html += '</div>';

      // Photo details list
      html += '<div class="mt-16">';
      for (const p of photos) {
        html += `<div class="card" style="padding:10px;">
          <div style="font-weight:600;">${UI.esc(p.scout_name || 'Unknown scout')}</div>
          <div style="font-size:12px; color:var(--text-secondary);">${UI.formatTime(p.taken_at)}</div>
          ${p.notes ? `<div style="font-size:13px; margin-top:4px;">${UI.esc(p.notes)}</div>` : ''}
        </div>`;
      }
      html += '</div>';
    }

    container.innerHTML = html;

    // Photo viewer click handlers
    container.querySelectorAll('.photo-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const img = thumb.querySelector('img');
        if (img && img.src) {
          App.showPhotoViewer(img.src);
        }
      });
    });
  },
};
