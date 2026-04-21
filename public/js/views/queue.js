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
    const unsynced = await DB.getUnsyncedEntries();
    const countEl = UI.$('#queue-count');
    const listEl = UI.$('#queue-list');
    const syncBtn = UI.$('#btn-sync');

    countEl.textContent = `${unsynced.length} pending`;
    syncBtn.disabled = unsynced.length === 0 || Sync.isSyncing;

    if (unsynced.length === 0) {
      UI.showEmpty(listEl, '✅', 'All entries synced!');
      return;
    }

    const roleColors = { scorer: 'var(--success)', feeder: '#2196f3', defender: 'var(--warning)' };

    listEl.innerHTML = unsynced.map(e => {
      const thumbURL = e.imageBlob ? Camera.createPreviewURL(e.imageBlob) : '';
      const team = Teams.get(e.teamNumber);
      const teamLabel = team ? `#${team.teamNumber} — ${team.teamName}` : `#${e.teamNumber}`;
      const roles = (e.role ? String(e.role).split(',').map(s => s.trim()).filter(Boolean) : []);
      const rolesHtml = roles.map(r =>
        `<span style="color:${roleColors[r] || 'inherit'}; font-weight:600;">${UI.esc(r)}</span>`
      ).join(' + ');
      return `
        <div class="queue-item" data-uuid="${UI.esc(e.uuid)}">
          ${thumbURL
            ? `<img src="${thumbURL}" alt="Photo">`
            : '<div style="width:50px;height:50px;background:var(--border);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">📋</div>'}
          <div class="queue-item-info">
            <div class="team">${UI.esc(teamLabel)}</div>
            <div class="meta">
              ${rolesHtml}
              · ${UI.esc(e.scoutName)} · ${UI.formatTime(e.createdAt)}
            </div>
            ${e.notes ? `<div class="meta">${UI.esc(e.notes)}</div>` : ''}
          </div>
          <div class="queue-item-actions">
            <button class="btn btn-danger btn-small btn-delete" data-uuid="${UI.esc(e.uuid)}">✕</button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Delete this entry from queue?')) {
          await DB.deleteEntry(btn.dataset.uuid);
          UI.toast('Entry removed', 'info');
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
