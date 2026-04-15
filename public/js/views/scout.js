// === Scout View ===
const ScoutView = {
  _selectedTeam: null,
  _selectedRole: null,
  _photoBlob: null,
  _photoURL: null,
  _assignments: [],

  render(container, preselectedTeam) {
    this._preselectedTeam = preselectedTeam || null;

    container.innerHTML = `
      ${this._preselectedTeam ? `<a href="#/team/${this._preselectedTeam}" class="back-link mb-8">← Back to Team #${this._preselectedTeam}</a>` : ''}
      <div class="card">
        <!-- Step 1: Team + Photo -->
        <div class="form-group">
          <label>1. Select Team</label>
          <div class="search-container">
            <input type="search" id="team-search" placeholder="Search team # or name..." autocomplete="off">
            <div id="team-results" class="search-results hidden"></div>
          </div>
          <div id="selected-team" class="mt-8" style="font-weight:600; color: var(--accent);"></div>
        </div>

        <!-- Team info panel (shown after selecting a team) -->
        <div id="team-info-panel" class="hidden">
          <div style="display:flex; gap:10px; align-items:flex-start;">
            <div id="team-robot-img" style="flex-shrink:0;"></div>
            <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
              <button id="btn-capture" class="btn btn-secondary btn-small">📷 Camera</button>
              <button id="btn-gallery" class="btn btn-secondary btn-small">🖼️ Gallery</button>
            </div>
          </div>
          <div id="photo-preview" class="mt-8" style="display:none; position:relative;">
            <img id="preview-img" style="width:100%; max-height: 200px; object-fit: contain; border-radius: 8px;">
            <button id="btn-remove-photo" style="position:absolute; top:4px; right:4px; background:var(--error); color:white; border:none; border-radius:50%; width:28px; height:28px; font-size:16px; cursor:pointer;">✕</button>
          </div>
          <div id="team-existing-data" class="mt-8"></div>
        </div>

        <!-- Step 2: Role -->
        <div class="form-group">
          <label>2. Robot Role <span class="required">*</span></label>
          <div class="role-selector" id="role-selector">
            <button class="role-btn" data-role="scorer">
              <span class="role-icon">🎯</span> Scorer
            </button>
            <button class="role-btn" data-role="feeder">
              <span class="role-icon">🤝</span> Feeder
            </button>
            <button class="role-btn" data-role="defender">
              <span class="role-icon">🛡️</span> Defender
            </button>
          </div>
        </div>

        <!-- Step 3: Notes -->
        <div class="form-group">
          <label>3. Notes (optional)</label>
          <textarea id="entry-notes" placeholder="Robot features, strategy observations..."></textarea>
        </div>

        <button id="btn-save" class="btn btn-success" disabled>Save Entry</button>
        <div id="save-hint" class="text-center mt-8 text-secondary" style="font-size:12px;">Select a team and role to save</div>
      </div>
    `;

    this._bindEvents();
    this._loadAssignments().then(() => {
      if (this._preselectedTeam) this._selectTeam(this._preselectedTeam);
    });
  },

  async _loadAssignments() {
    const scoutName = localStorage.getItem('scoutName') || '';
    if (!scoutName) { this._assignments = []; return; }
    try {
      const res = await fetch(`/api/scouts/assignments?scout=${encodeURIComponent(scoutName)}`);
      if (res.ok) this._assignments = await res.json();
    } catch (e) {
      this._assignments = [];
    }
  },

  _bindEvents() {
    const searchInput = UI.$('#team-search');
    const resultsDiv = UI.$('#team-results');

    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => this._onSearch(searchInput.value, resultsDiv), 150);
    });
    searchInput.addEventListener('blur', () => {
      setTimeout(() => resultsDiv.classList.add('hidden'), 200);
    });
    searchInput.addEventListener('focus', () => {
      if (searchInput.value) {
        this._onSearch(searchInput.value, resultsDiv);
      } else {
        this._showAssignedTeams(resultsDiv);
      }
    });

    // Role selector
    UI.$$('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        UI.$$('.role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._selectedRole = btn.dataset.role;
        this._updateSaveButton();
      });
    });

    // Camera
    UI.$('#btn-capture').addEventListener('click', () => this._takePhoto(false));
    UI.$('#btn-gallery').addEventListener('click', () => this._takePhoto(true));
    UI.$('#btn-remove-photo').addEventListener('click', () => this._removePhoto());

    // Save
    UI.$('#btn-save').addEventListener('click', () => this._save());
  },

  _showAssignedTeams(resultsDiv) {
    // Show assigned teams (to-do first) when input is empty
    const todoTeams = this._assignments.filter(a => !a.completed);
    const doneTeams = this._assignments.filter(a => a.completed);
    const items = [...todoTeams, ...doneTeams];

    if (items.length === 0) {
      // No assignments — show all teams
      const allTeams = Teams._teams.slice(0, 10);
      if (allTeams.length === 0) return;
      this._renderSearchResults(resultsDiv, allTeams.map(t => ({
        teamNumber: t.teamNumber, teamName: t.teamName
      })));
      return;
    }

    resultsDiv.innerHTML = items.map(a => {
      const isDone = !!a.completed;
      return `<div class="search-result-item" data-team="${a.team_number}" style="${isDone ? 'opacity:0.5;' : ''}">
        <span class="team-num">#${a.team_number}</span>
        ${UI.esc(a.team_name)}
        ${isDone
          ? '<span style="float:right; color:var(--success); font-size:12px;">✓ done</span>'
          : '<span style="float:right; color:var(--warning); font-size:12px;">⬤ to do</span>'}
      </div>`;
    }).join('');

    resultsDiv.classList.remove('hidden');
    this._bindResultClicks(resultsDiv);
  },

  _onSearch(query, resultsDiv) {
    if (!query || query.length < 1) {
      this._showAssignedTeams(resultsDiv);
      return;
    }

    const matches = Teams.search(query).slice(0, 8);
    if (matches.length === 0) {
      resultsDiv.classList.add('hidden');
      return;
    }

    // Mark assigned teams in search results
    const assignedNums = new Set(this._assignments.map(a => a.team_number));
    const doneNums = new Set(this._assignments.filter(a => a.completed).map(a => a.team_number));

    resultsDiv.innerHTML = matches.map(t => {
      const badge = doneNums.has(t.teamNumber)
        ? '<span style="float:right; color:var(--success); font-size:12px;">✓</span>'
        : assignedNums.has(t.teamNumber)
          ? '<span style="float:right; color:var(--warning); font-size:12px;">⬤</span>'
          : '';
      return `<div class="search-result-item" data-team="${t.teamNumber}">
        <span class="team-num">#${t.teamNumber}</span>
        ${UI.esc(t.teamName)}
        ${badge}
      </div>`;
    }).join('');

    resultsDiv.classList.remove('hidden');
    this._bindResultClicks(resultsDiv);
  },

  _bindResultClicks(resultsDiv) {
    resultsDiv.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const num = parseInt(item.dataset.team, 10);
        this._selectTeam(num);
        resultsDiv.classList.add('hidden');
      });
    });
  },

  async _selectTeam(teamNumber) {
    const team = Teams.get(teamNumber);
    this._selectedTeam = team || { teamNumber };

    // Clear photo (can't restore blobs across team switches)
    this._removePhoto();

    // Update header
    UI.$('#team-search').value = `${teamNumber}`;
    UI.$('#selected-team').textContent = team
      ? `#${team.teamNumber} — ${team.teamName}`
      : `Team #${teamNumber}`;

    // Show team info panel
    UI.$('#team-info-panel').classList.remove('hidden');

    // Load existing scouting data, show image, and pre-fill form
    await this._loadTeamData(teamNumber);
  },

  async _loadTeamData(teamNumber) {
    const team = this._selectedTeam;

    // Gather entries from local + server
    const localEntries = await DB.getEntriesByTeam(teamNumber);
    UI.log('[Scout] Local entries for team', teamNumber, ':', localEntries.length, localEntries);

    let serverEntries = [];
    try {
      const res = await fetch(`/api/entries?team=${teamNumber}`);
      if (res.ok) serverEntries = await res.json();
    } catch (e) {
      UI.log('[Scout] Server fetch failed:', e.message);
    }
    UI.log('[Scout] Server entries for team', teamNumber, ':', serverEntries.length, serverEntries);

    // Merge: local unsynced + server (avoid duplicates by uuid)
    const serverUuids = new Set(serverEntries.map(e => e.uuid));
    const allEntries = [
      ...localEntries.filter(e => !serverUuids.has(e.uuid)),
      ...serverEntries,
    ];
    UI.log('[Scout] Merged entries:', allEntries.length);

    // Show robot image: check local photos, server photos, then pre-loaded image
    const imgContainer = UI.$('#team-robot-img');
    const localWithPhoto = localEntries.find(e => e.imageBlob);
    const serverPhotoUuid = team && team.latestPhotoUuid ? team.latestPhotoUuid : null;

    const imgStyle = 'width:120px; height:120px; object-fit:cover; border-radius:8px;';
    if (localWithPhoto) {
      imgContainer.innerHTML = `<img src="${Camera.createPreviewURL(localWithPhoto.imageBlob)}" alt="Team ${teamNumber}" style="${imgStyle}">`;
    } else if (serverPhotoUuid) {
      imgContainer.innerHTML = `<img src="/api/entries/${encodeURIComponent(serverPhotoUuid)}/image" alt="Team ${teamNumber}" style="${imgStyle}">`;
    } else if (team && team.robotImageUrl) {
      imgContainer.innerHTML = `<img src="${UI.esc(team.robotImageUrl)}" alt="Team ${teamNumber}" style="${imgStyle}">`;
    } else {
      imgContainer.innerHTML = `<div style="width:120px;height:120px;background:var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:32px;">📷</div>`;
    }

    // Show existing data panel
    this._showExistingData(allEntries);

    // Pre-fill form from the most recent entry
    const latest = this._getLatestEntry(allEntries);
    UI.log('[Scout] Latest entry:', latest);
    if (latest) {
      const role = latest.role;
      const notes = latest.notes || '';
      UI.log('[Scout] Pre-filling: role=' + role + ', notes=' + notes);

      // Set role
      this._selectedRole = role;
      UI.$$('.role-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.role === role);
      });

      // Set notes
      UI.$('#entry-notes').value = notes;
    } else {
      UI.log('[Scout] No entries found, resetting form');
      // No existing data — reset form
      this._selectedRole = null;
      UI.$$('.role-btn').forEach(b => b.classList.remove('active'));
      UI.$('#entry-notes').value = '';
    }

    this._updateSaveButton();
  },

  _getLatestEntry(allEntries) {
    if (allEntries.length === 0) return null;

    // Sort by timestamp descending, preferring local entries (camelCase createdAt)
    return allEntries.sort((a, b) => {
      const timeA = a.createdAt || a.created_at || '';
      const timeB = b.createdAt || b.created_at || '';
      return timeB.localeCompare(timeA);
    })[0];
  },

  _showExistingData(allEntries) {
    const container = UI.$('#team-existing-data');

    if (allEntries.length === 0) {
      container.innerHTML = `<div style="font-size:13px; color:var(--text-secondary); margin-bottom:12px; font-style:italic;">No scouting data yet for this team.</div>`;
      return;
    }

    const roleColors = { scorer: '#4caf50', feeder: '#2196f3', defender: '#ff9800' };
    const roleIcons = { scorer: '🎯', feeder: '🤝', defender: '🛡️' };

    // Summarize roles
    const roles = allEntries.map(e => e.role || (e.role)).filter(Boolean);
    const roleCounts = {};
    for (const r of roles) {
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    }

    let html = `<div class="existing-data-panel">`;
    html += `<div style="font-size:13px; font-weight:600; margin-bottom:6px;">Previous entries (${allEntries.length}):</div>`;

    // Role summary badges
    if (Object.keys(roleCounts).length > 0) {
      html += `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">`;
      for (const [role, count] of Object.entries(roleCounts)) {
        const color = roleColors[role] || '#999';
        html += `<span style="display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:12px; background:${color}20; color:${color}; font-size:12px; font-weight:600;">
          ${roleIcons[role] || ''} ${role} ×${count}
        </span>`;
      }
      html += `</div>`;
    }

    // Individual entries
    for (const e of allEntries) {
      const isLocal = !!e.createdAt; // local entries use camelCase
      const role = e.role;
      const scout = (isLocal ? e.scoutName : e.scout_name) || 'Unknown';
      const notes = e.notes || '';
      const time = isLocal ? e.createdAt : e.created_at;
      const synced = isLocal ? e.synced : true;
      const hasPhoto = isLocal ? !!e.imageBlob : !!e.has_photo;
      const color = roleColors[role] || '#999';

      html += `<div style="padding:6px 0; border-bottom:1px solid var(--border); font-size:13px;">
        <div style="display:flex; align-items:center; gap:6px;">
          ${role ? `<span style="color:${color}; font-weight:600;">${roleIcons[role] || ''} ${role}</span>` : ''}
          <span style="color:var(--text-secondary);">· ${UI.esc(scout)} · ${UI.formatTime(time)}</span>
          ${hasPhoto ? '<span title="Has photo">📷</span>' : ''}
          ${!synced ? '<span style="color:var(--warning);" title="Not synced">⏳</span>' : ''}
        </div>
        ${notes ? `<div style="color:var(--text-secondary); margin-top:2px;">${UI.esc(notes)}</div>` : ''}
      </div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
  },

  async _takePhoto(fromGallery) {
    try {
      const blob = fromGallery ? await Camera.pick() : await Camera.capture();
      this._photoBlob = blob;
      if (this._photoURL) URL.revokeObjectURL(this._photoURL);
      this._photoURL = Camera.createPreviewURL(blob);

      UI.$('#preview-img').src = this._photoURL;
      UI.$('#photo-preview').style.display = 'block';
    } catch (err) {
      if (err.message !== 'Cancelled') {
        UI.toast('Failed to capture photo: ' + err.message, 'error');
      }
    }
  },

  _removePhoto() {
    this._photoBlob = null;
    if (this._photoURL) URL.revokeObjectURL(this._photoURL);
    this._photoURL = null;
    const preview = UI.$('#photo-preview');
    if (preview) preview.style.display = 'none';
  },

  _updateSaveButton() {
    const ready = !!(this._selectedTeam && this._selectedRole);
    UI.$('#btn-save').disabled = !ready;
    const hint = UI.$('#save-hint');
    if (hint) hint.classList.toggle('hidden', ready);
  },

  async _save() {
    if (!this._selectedTeam || !this._selectedRole) return;

    const scoutName = localStorage.getItem('scoutName') || 'Unknown';
    const entry = {
      uuid: UI.uuid(),
      teamNumber: this._selectedTeam.teamNumber,
      role: this._selectedRole,
      scoutName,
      notes: UI.$('#entry-notes').value.trim(),
      createdAt: new Date().toISOString(),
      imageBlob: this._photoBlob || null,
      synced: false,
      syncAttempts: 0,
    };

    try {
      await DB.saveEntry(entry);
      UI.toast(`Saved entry for Team #${entry.teamNumber} (${entry.role})`, 'success');

      // Clear photo only, keep team selected
      this._removePhoto();

      App.updateQueueBadge();

      // Reload team data — will refresh existing entries and pre-fill from latest
      await this._loadTeamData(this._selectedTeam.teamNumber);
    } catch (err) {
      UI.toast('Failed to save: ' + err.message, 'error');
    }
  },
};
