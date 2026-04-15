// === Queue View ===
const QueueView = {
  render(container) {
    container.innerHTML = `
      <div id="sync-status" class="card">
        <div class="section-header">
          <span class="section-title">Upload Queue</span>
          <span id="queue-count" class="text-secondary"></span>
        </div>
        <div id="sync-progress" class="hidden">
          <div class="progress-bar"><div class="fill" id="progress-fill" style="width:0%"></div></div>
          <div id="progress-text" class="text-center" style="font-size:13px; color:var(--text-secondary);"></div>
        </div>
        <button id="btn-sync" class="btn btn-primary mt-8" disabled>Sync All to Server</button>
      </div>
      <div id="queue-list"></div>
    `;

    this._loadQueue();
    UI.$('#btn-sync').addEventListener('click', () => this._startSync());
  },

  async _loadQueue() {
    const unsynced = await DB.getUnsyncedPhotos();
    const countEl = UI.$('#queue-count');
    const listEl = UI.$('#queue-list');
    const syncBtn = UI.$('#btn-sync');

    countEl.textContent = `${unsynced.length} pending`;
    syncBtn.disabled = unsynced.length === 0 || Sync.isSyncing;

    if (unsynced.length === 0) {
      UI.showEmpty(listEl, '✅', 'All photos synced!');
      return;
    }

    listEl.innerHTML = unsynced.map(p => {
      const thumbURL = p.imageBlob ? Camera.createPreviewURL(p.imageBlob) : '';
      const team = Teams.get(p.teamNumber);
      const teamLabel = team ? `#${team.teamNumber} — ${team.teamName}` : `#${p.teamNumber}`;
      return `
        <div class="queue-item" data-uuid="${UI.esc(p.uuid)}">
          <img src="${thumbURL}" alt="Photo">
          <div class="queue-item-info">
            <div class="team">${UI.esc(teamLabel)}</div>
            <div class="meta">${UI.esc(p.scoutName)} · ${UI.formatTime(p.takenAt)}</div>
            ${p.notes ? `<div class="meta">${UI.esc(p.notes)}</div>` : ''}
          </div>
          <div class="queue-item-actions">
            <button class="btn btn-danger btn-small btn-delete" data-uuid="${UI.esc(p.uuid)}">✕</button>
          </div>
        </div>
      `;
    }).join('');

    // Delete handlers
    listEl.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const uuid = btn.dataset.uuid;
        if (confirm('Delete this photo from queue?')) {
          await DB.deletePhoto(uuid);
          UI.toast('Photo removed', 'info');
          App.updateQueueBadge();
          this._loadQueue();
        }
      });
    });
  },

  async _startSync() {
    const syncBtn = UI.$('#btn-sync');
    const progressDiv = UI.$('#sync-progress');
    const progressFill = UI.$('#progress-fill');
    const progressText = UI.$('#progress-text');

    // Check connection first
    const status = await Sync.checkConnection();
    if (!status.online) {
      UI.toast('Cannot reach server. Connect to hotspot first.', 'error');
      return;
    }

    syncBtn.disabled = true;
    syncBtn.textContent = 'Syncing...';
    progressDiv.classList.remove('hidden');

    try {
      const results = await Sync.syncAll((progress) => {
        const pct = Math.round((progress.done / progress.total) * 100);
        progressFill.style.width = pct + '%';
        progressText.textContent = `${progress.done}/${progress.total} — ${progress.synced} synced, ${progress.duplicates} dupes`;
      });

      UI.toast(
        `Sync complete: ${results.synced} uploaded, ${results.duplicates} already on server`,
        results.errors > 0 ? 'warning' : 'success'
      );
    } catch (err) {
      UI.toast('Sync failed: ' + err.message, 'error');
    } finally {
      syncBtn.textContent = 'Sync All to Server';
      App.updateQueueBadge();
      this._loadQueue();
    }
  },
};
