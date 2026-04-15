// === Scout View ===
const ScoutView = {
  _selectedTeam: null,
  _photoBlob: null,
  _photoURL: null,

  render(container) {
    container.innerHTML = `
      <div class="card">
        <div class="form-group">
          <label>Team Number</label>
          <div class="search-container">
            <input type="search" id="team-search" placeholder="Search team # or name..." autocomplete="off">
            <div id="team-results" class="search-results hidden"></div>
          </div>
          <div id="selected-team" class="mt-8" style="font-weight:600; color: var(--accent);"></div>
        </div>

        <div class="form-group">
          <label>Photo</label>
          <div style="display: flex; gap: 8px;">
            <button id="btn-capture" class="btn btn-primary" style="flex:1;">Take Photo</button>
            <button id="btn-gallery" class="btn btn-secondary" style="flex:1;">From Gallery</button>
          </div>
          <div id="photo-preview" class="mt-8" style="display:none;">
            <img id="preview-img" style="width:100%; max-height: 250px; object-fit: contain; border-radius: 8px;">
          </div>
        </div>

        <div class="form-group">
          <label>Notes (optional)</label>
          <textarea id="photo-notes" placeholder="Robot features, strategy notes..."></textarea>
        </div>

        <button id="btn-save" class="btn btn-success" disabled>Save to Queue</button>
      </div>

      <div id="recent-photos" class="mt-16"></div>
    `;

    this._bindEvents();
    this._showRecentPhotos();
  },

  _bindEvents() {
    const searchInput = UI.$('#team-search');
    const resultsDiv = UI.$('#team-results');

    // Team search with debounce
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => this._onSearch(searchInput.value, resultsDiv), 150);
    });

    // Hide results on blur (with delay for click to register)
    searchInput.addEventListener('blur', () => {
      setTimeout(() => resultsDiv.classList.add('hidden'), 200);
    });
    searchInput.addEventListener('focus', () => {
      if (searchInput.value) this._onSearch(searchInput.value, resultsDiv);
    });

    // Camera capture
    UI.$('#btn-capture').addEventListener('click', () => this._takePhoto(false));
    UI.$('#btn-gallery').addEventListener('click', () => this._takePhoto(true));

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

    // Click handlers
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
    this._selectedTeam = team;
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

      const preview = UI.$('#photo-preview');
      UI.$('#preview-img').src = this._photoURL;
      preview.style.display = 'block';

      this._updateSaveButton();
    } catch (err) {
      if (err.message !== 'Cancelled') {
        UI.toast('Failed to capture photo: ' + err.message, 'error');
      }
    }
  },

  _updateSaveButton() {
    const btn = UI.$('#btn-save');
    btn.disabled = !(this._selectedTeam && this._photoBlob);
  },

  async _save() {
    if (!this._selectedTeam || !this._photoBlob) return;

    const scoutName = localStorage.getItem('scoutName') || 'Unknown';
    const photo = {
      uuid: crypto.randomUUID(),
      teamNumber: this._selectedTeam.teamNumber,
      scoutName,
      notes: UI.$('#photo-notes').value.trim(),
      takenAt: new Date().toISOString(),
      imageBlob: this._photoBlob,
      synced: false,
      syncAttempts: 0,
    };

    try {
      await DB.savePhoto(photo);
      UI.toast(`Saved photo for Team #${photo.teamNumber}`, 'success');

      // Reset form
      this._photoBlob = null;
      if (this._photoURL) URL.revokeObjectURL(this._photoURL);
      this._photoURL = null;
      this._selectedTeam = null;
      UI.$('#team-search').value = '';
      UI.$('#selected-team').textContent = '';
      UI.$('#photo-notes').value = '';
      UI.$('#photo-preview').style.display = 'none';
      UI.$('#btn-save').disabled = true;

      // Update queue badge
      App.updateQueueBadge();
      this._showRecentPhotos();
    } catch (err) {
      UI.toast('Failed to save: ' + err.message, 'error');
    }
  },

  async _showRecentPhotos() {
    const container = UI.$('#recent-photos');
    const all = await DB.getAllPhotos();
    const recent = all.sort((a, b) => b.takenAt.localeCompare(a.takenAt)).slice(0, 3);

    if (recent.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="section-header"><span class="section-title">Recent</span></div>
      <div class="photo-grid">
        ${recent.map(p => {
          const url = p.imageBlob ? Camera.createPreviewURL(p.imageBlob) : '';
          return `<div class="photo-thumb" title="Team #${p.teamNumber}">
            <img src="${url}" alt="Team ${p.teamNumber}">
          </div>`;
        }).join('')}
      </div>
    `;
  },
};
