// === Scout View ===
const ScoutView = {
  _selectedTeam: null,
  _selectedRole: null,
  _photoBlob: null,
  _photoURL: null,

  render(container) {
    container.innerHTML = `
      <div class="card">
        <!-- Step 1: Team -->
        <div class="form-group">
          <label>1. Select Team</label>
          <div class="search-container">
            <input type="search" id="team-search" placeholder="Search team # or name..." autocomplete="off">
            <div id="team-results" class="search-results hidden"></div>
          </div>
          <div id="selected-team" class="mt-8" style="font-weight:600; color: var(--accent);"></div>
        </div>

        <!-- Step 2: Role -->
        <div class="form-group">
          <label>2. Robot Role</label>
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

        <!-- Step 3: Photo (optional) -->
        <div class="form-group">
          <label>3. Photo (optional)</label>
          <div style="display: flex; gap: 8px;">
            <button id="btn-capture" class="btn btn-secondary" style="flex:1;">📷 Camera</button>
            <button id="btn-gallery" class="btn btn-secondary" style="flex:1;">🖼️ Gallery</button>
          </div>
          <div id="photo-preview" class="mt-8" style="display:none; position:relative;">
            <img id="preview-img" style="width:100%; max-height: 200px; object-fit: contain; border-radius: 8px;">
            <button id="btn-remove-photo" style="position:absolute; top:4px; right:4px; background:var(--error); color:white; border:none; border-radius:50%; width:28px; height:28px; font-size:16px; cursor:pointer;">✕</button>
          </div>
        </div>

        <!-- Step 4: Notes -->
        <div class="form-group">
          <label>4. Notes (optional)</label>
          <textarea id="entry-notes" placeholder="Robot features, strategy observations..."></textarea>
        </div>

        <button id="btn-save" class="btn btn-success" disabled>Save Entry</button>
      </div>

      <div id="recent-entries" class="mt-16"></div>
    `;

    this._bindEvents();
    this._showRecentEntries();
  },

  _bindEvents() {
    const searchInput = UI.$('#team-search');
    const resultsDiv = UI.$('#team-results');

    // Team search
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => this._onSearch(searchInput.value, resultsDiv), 150);
    });
    searchInput.addEventListener('blur', () => {
      setTimeout(() => resultsDiv.classList.add('hidden'), 200);
    });
    searchInput.addEventListener('focus', () => {
      if (searchInput.value) this._onSearch(searchInput.value, resultsDiv);
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

  _onSearch(query, resultsDiv) {
    if (!query || query.length < 1) {
      resultsDiv.classList.add('hidden');
      return;
    }

    const matches = Teams.search(query).slice(0, 8);
    if (matches.length === 0) {
      resultsDiv.classList.add('hidden');
      return;
    }

    resultsDiv.innerHTML = matches.map(t => `
      <div class="search-result-item" data-team="${t.teamNumber}">
        <span class="team-num">#${t.teamNumber}</span>
        ${UI.esc(t.teamName)}
      </div>
    `).join('');

    resultsDiv.classList.remove('hidden');

    resultsDiv.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const num = parseInt(item.dataset.team, 10);
        this._selectTeam(num);
        resultsDiv.classList.add('hidden');
      });
    });
  },

  _selectTeam(teamNumber) {
    const team = Teams.get(teamNumber);
    this._selectedTeam = team || { teamNumber };
    UI.$('#team-search').value = `${teamNumber}`;
    UI.$('#selected-team').textContent = team
      ? `#${team.teamNumber} — ${team.teamName}`
      : `Team #${teamNumber}`;
    this._updateSaveButton();
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
    UI.$('#photo-preview').style.display = 'none';
  },

  _updateSaveButton() {
    // Need at least a team and a role to save
    UI.$('#btn-save').disabled = !(this._selectedTeam && this._selectedRole);
  },

  async _save() {
    if (!this._selectedTeam || !this._selectedRole) return;

    const scoutName = localStorage.getItem('scoutName') || 'Unknown';
    const entry = {
      uuid: crypto.randomUUID(),
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

      // Reset form
      this._photoBlob = null;
      if (this._photoURL) URL.revokeObjectURL(this._photoURL);
      this._photoURL = null;
      this._selectedTeam = null;
      this._selectedRole = null;
      UI.$('#team-search').value = '';
      UI.$('#selected-team').textContent = '';
      UI.$('#entry-notes').value = '';
      UI.$('#photo-preview').style.display = 'none';
      UI.$$('.role-btn').forEach(b => b.classList.remove('active'));
      UI.$('#btn-save').disabled = true;

      App.updateQueueBadge();
      this._showRecentEntries();
    } catch (err) {
      UI.toast('Failed to save: ' + err.message, 'error');
    }
  },

  async _showRecentEntries() {
    const container = UI.$('#recent-entries');
    const all = await DB.getAllEntries();
    const recent = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

    if (recent.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="section-header"><span class="section-title">Recent Entries</span></div>
      ${recent.map(e => {
        const team = Teams.get(e.teamNumber);
        const roleColors = { scorer: 'var(--success)', feeder: '#2196f3', defender: 'var(--warning)' };
        return `<div class="queue-item">
          ${e.imageBlob ? `<img src="${Camera.createPreviewURL(e.imageBlob)}" alt="Photo">` : '<div style="width:50px;height:50px;background:var(--border);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">📋</div>'}
          <div class="queue-item-info">
            <div class="team">#${e.teamNumber} ${team ? '— ' + UI.esc(team.teamName) : ''}</div>
            <div class="meta">
              <span style="color:${roleColors[e.role] || 'inherit'}; font-weight:600;">${UI.esc(e.role)}</span>
              · ${UI.esc(e.scoutName)} · ${UI.formatTime(e.createdAt)}
            </div>
          </div>
        </div>`;
      }).join('')}
    `;
  },
};
