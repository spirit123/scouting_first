// === Settings View ===
const SettingsView = {
  render(container) {
    const scoutName = localStorage.getItem('scoutName') || '';
    const serverIP = localStorage.getItem('serverIP') || '';
    const serverPort = localStorage.getItem('serverPort') || '3000';

    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">Settings</span>
      </div>

      <div class="card">
        <div class="form-group">
          <label>Your Name (Scout ID)</label>
          <input type="text" id="scout-name" value="${UI.esc(scoutName)}" placeholder="Enter your name...">
        </div>
        <button id="btn-save-name" class="btn btn-primary btn-small">Save Name</button>
      </div>

      <div class="card">
        <h3 style="margin-bottom:12px;">Server Connection</h3>
        <div class="form-group">
          <label>Server IP</label>
          <input type="text" id="server-ip" value="${UI.esc(serverIP)}" placeholder="e.g. 192.168.43.1 (auto-detect if empty)">
        </div>
        <div class="form-group">
          <label>Server Port</label>
          <input type="number" id="server-port" value="${UI.esc(serverPort)}" placeholder="3000">
        </div>
        <div style="display:flex; gap:8px;">
          <button id="btn-save-server" class="btn btn-primary btn-small" style="flex:1;">Save</button>
          <button id="btn-test-connection" class="btn btn-secondary btn-small" style="flex:1;">Test Connection</button>
        </div>
        <div id="connection-result" class="mt-8" style="font-size:13px;"></div>
      </div>

      <div class="card">
        <h3 style="margin-bottom:12px;">Data</h3>
        <div id="storage-info" style="font-size:13px; color:var(--text-secondary); margin-bottom:12px;"></div>
        <button id="btn-clear-synced" class="btn btn-secondary mb-12">Clear Synced Photos</button>
        <button id="btn-clear-all" class="btn btn-danger">Clear All Local Data</button>
      </div>

      <div class="card" style="text-align:center; color:var(--text-secondary); font-size:12px;">
        FTC Scout v1.0.0
      </div>
    `;

    this._bindEvents();
    this._showStorageInfo();
  },

  _bindEvents() {
    UI.$('#btn-save-name').addEventListener('click', () => {
      const name = UI.$('#scout-name').value.trim();
      localStorage.setItem('scoutName', name);
      UI.toast(name ? `Name set to "${name}"` : 'Name cleared', 'success');
    });

    UI.$('#btn-save-server').addEventListener('click', () => {
      localStorage.setItem('serverIP', UI.$('#server-ip').value.trim());
      localStorage.setItem('serverPort', UI.$('#server-port').value.trim() || '3000');
      UI.toast('Server settings saved', 'success');
    });

    UI.$('#btn-test-connection').addEventListener('click', async () => {
      // Save first
      localStorage.setItem('serverIP', UI.$('#server-ip').value.trim());
      localStorage.setItem('serverPort', UI.$('#server-port').value.trim() || '3000');

      const resultDiv = UI.$('#connection-result');
      resultDiv.textContent = 'Testing...';
      resultDiv.style.color = 'var(--text-secondary)';

      const status = await Sync.checkConnection();
      if (status.online) {
        resultDiv.textContent = `Connected! Server has ${status.teamCount} teams, ${status.photoCount} photos.`;
        resultDiv.style.color = 'var(--success)';
      } else {
        resultDiv.textContent = 'Cannot reach server. Check IP and make sure you\'re on the hotspot.';
        resultDiv.style.color = 'var(--error)';
      }
    });

    UI.$('#btn-clear-synced').addEventListener('click', async () => {
      if (!confirm('Remove synced photos from local storage? (They are safe on the server)')) return;
      const all = await DB.getAllPhotos();
      let cleared = 0;
      for (const p of all) {
        if (p.synced) {
          await DB.deletePhoto(p.uuid);
          cleared++;
        }
      }
      UI.toast(`Cleared ${cleared} synced photos`, 'success');
      this._showStorageInfo();
    });

    UI.$('#btn-clear-all').addEventListener('click', async () => {
      if (!confirm('This will delete ALL local photos and team data. Are you sure?')) return;
      if (!confirm('Really? Unsynced photos will be LOST.')) return;
      await DB.clearAll();
      App.updateQueueBadge();
      UI.toast('All local data cleared', 'success');
      this._showStorageInfo();
    });
  },

  async _showStorageInfo() {
    const all = await DB.getAllPhotos();
    const synced = all.filter(p => p.synced).length;
    const unsynced = all.length - synced;
    const totalSize = all.reduce((sum, p) => sum + (p.imageBlob ? p.imageBlob.size : 0), 0);

    UI.$('#storage-info').textContent =
      `${all.length} photos locally (${synced} synced, ${unsynced} pending) · ${UI.formatSize(totalSize)}`;
  },
};
