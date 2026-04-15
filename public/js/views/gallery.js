// === Gallery View ===
const GalleryView = {
  _assignments: [],

  async render(container) {
    const scoutName = localStorage.getItem('scoutName') || '';

    // Load assignments for current scout
    this._assignments = [];
    if (scoutName) {
      try {
        const res = await fetch(`/api/scouts/assignments?scout=${encodeURIComponent(scoutName)}`);
        if (res.ok) this._assignments = await res.json();
      } catch (e) {}
    }

    const assignedNums = new Set(this._assignments.map(a => a.team_number));
    const doneNums = new Set(this._assignments.filter(a => a.completed).map(a => a.team_number));
    const todoNums = new Set(this._assignments.filter(a => !a.completed).map(a => a.team_number));

    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">Teams</span>
        <div style="display:flex; gap:6px;">
          <a href="#/admin" class="btn btn-secondary btn-small">Manage</a>
          <a href="#/export" class="btn btn-secondary btn-small">Export</a>
        </div>
      </div>
      ${this._assignments.length > 0 ? `
        <div class="card" style="padding:10px;">
          <div style="font-size:13px;">
            <strong>Your assignments:</strong>
            <span style="color:var(--success);">${doneNums.size} done</span> /
            <span style="color:var(--warning);">${todoNums.size} remaining</span> /
            ${assignedNums.size} total
          </div>
          <div class="progress-bar mt-8"><div class="fill" style="width:${assignedNums.size > 0 ? Math.round(doneNums.size / assignedNums.size * 100) : 0}%"></div></div>
        </div>
      ` : ''}
      <div class="form-group">
        <input type="search" id="gallery-search" placeholder="Search teams...">
      </div>
      <div id="gallery-filter" style="display:flex; gap:6px; margin-bottom:12px;">
        <button class="btn btn-small filter-btn active" data-filter="all">All</button>
        ${this._assignments.length > 0 ? `
          <button class="btn btn-small filter-btn" data-filter="assigned">My Teams</button>
          <button class="btn btn-small filter-btn" data-filter="todo">To Do</button>
        ` : ''}
      </div>
      <div id="team-grid-container"></div>
    `;

    this._currentFilter = 'all';
    this._renderTeams(Teams._teams, assignedNums, doneNums, todoNums);

    UI.$('#gallery-search').addEventListener('input', (e) => {
      const matches = Teams.search(e.target.value);
      this._renderTeams(matches, assignedNums, doneNums, todoNums);
    });

    UI.$$('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        UI.$$('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._currentFilter = btn.dataset.filter;
        const query = UI.$('#gallery-search').value;
        const matches = query ? Teams.search(query) : Teams._teams;
        this._renderTeams(matches, assignedNums, doneNums, todoNums);
      });
    });
  },

  async _renderTeams(teams, assignedNums, doneNums, todoNums) {
    const container = UI.$('#team-grid-container');

    // Build map of local photos (unsynced blobs) by team number
    const localPhotos = {};
    try {
      const allEntries = await DB.getAllEntries();
      for (const e of allEntries) {
        if (e.imageBlob && !localPhotos[e.teamNumber]) {
          localPhotos[e.teamNumber] = Camera.createPreviewURL(e.imageBlob);
        }
      }
    } catch (err) {}

    // Apply filter
    let filtered = teams;
    if (this._currentFilter === 'assigned') {
      filtered = teams.filter(t => assignedNums.has(t.teamNumber));
    } else if (this._currentFilter === 'todo') {
      filtered = teams.filter(t => todoNums.has(t.teamNumber));
    }

    if (filtered.length === 0) {
      UI.showEmpty(container, '🔍', 'No teams found');
      return;
    }

    // Sort: assigned-todo first, then assigned-done, then unassigned
    if (assignedNums.size > 0) {
      filtered = [...filtered].sort((a, b) => {
        const aScore = todoNums.has(a.teamNumber) ? 0 : doneNums.has(a.teamNumber) ? 1 : 2;
        const bScore = todoNums.has(b.teamNumber) ? 0 : doneNums.has(b.teamNumber) ? 1 : 2;
        return aScore - bScore || a.teamNumber - b.teamNumber;
      });
    }

    container.innerHTML = `<div class="team-grid">
      ${filtered.map(t => {
        const isAssigned = assignedNums.has(t.teamNumber);
        const isDone = doneNums.has(t.teamNumber);
        const isTodo = todoNums.has(t.teamNumber);
        let borderStyle = '';
        let badge = '';
        if (isTodo) {
          borderStyle = 'border: 2px solid var(--warning);';
          badge = '<div style="font-size:11px; color:var(--warning); font-weight:600;">⬤ To Do</div>';
        } else if (isDone) {
          borderStyle = 'border: 2px solid var(--success);';
          badge = '<div style="font-size:11px; color:var(--success); font-weight:600;">✓ Done</div>';
        }

        // Use chosen thumbnail > local photo > latest server photo > pre-loaded image
        let imgSrc = '';
        if (t.thumbnailSource === 'default') {
          imgSrc = t.robotImageUrl || '';
        } else if (t.thumbnailSource) {
          imgSrc = `/api/entries/${encodeURIComponent(t.thumbnailSource)}/image`;
        } else if (localPhotos[t.teamNumber]) {
          imgSrc = localPhotos[t.teamNumber];
        } else if (t.latestPhotoUuid) {
          imgSrc = `/api/entries/${encodeURIComponent(t.latestPhotoUuid)}/image`;
        } else {
          imgSrc = t.robotImageUrl || '';
        }

        return `
        <a href="#/team/${t.teamNumber}" class="team-card" style="${borderStyle}">
          ${imgSrc ? `<img src="${UI.esc(imgSrc)}" alt="Team ${t.teamNumber}" class="team-card-img" loading="lazy">` : ''}
          <div class="team-number">${t.teamNumber}</div>
          <div class="team-name">${UI.esc(t.teamName)}</div>
          <div class="team-location">${UI.esc([t.city, t.state].filter(Boolean).join(', '))}</div>
          ${t.opr != null ? `<div style="font-size:10px; font-weight:700; color:var(--accent);">OPR ${t.opr.toFixed(0)}</div>` : ''}
          ${t.tier ? `<div class="tier-badge tier-${t.tier}">${t.tier}</div>` : ''}
          ${badge}
          ${t.entryCount ? `<div class="photo-count">${t.entryCount} entr${t.entryCount !== 1 ? 'ies' : 'y'}</div>` : ''}
        </a>`;
      }).join('')}
    </div>`;
  },
};
