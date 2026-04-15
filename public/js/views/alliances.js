// === Alliance Selection View ===
const AlliancesView = {
  _alliances: [], // 8 alliances, each { captain, picks: [] }
  _available: [],  // teams not yet picked
  _pickOrder: [],  // which alliance picks next
  _currentPick: 0,
  _round: 0,

  async render(container) {
    // Load saved state or initialize
    this._loadState();

    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">Alliance Selection</span>
        <div style="display:flex; gap:6px;">
          <button id="btn-reset-alliances" class="btn btn-danger btn-small">Reset</button>
        </div>
      </div>

      <div id="alliance-pick-banner"></div>
      <div id="alliance-grid"></div>

      <div class="section-header mt-16">
        <span class="section-title">Available Teams</span>
        <span id="available-count" class="text-secondary"></span>
      </div>
      <div class="form-group">
        <input type="search" id="alliance-search" placeholder="Search available teams..." autocomplete="off">
      </div>
      <div id="available-list"></div>
    `;

    this._renderAll();

    UI.$('#btn-reset-alliances').addEventListener('click', () => {
      if (!confirm('Reset all alliance selections?')) return;
      this._resetState();
      this._renderAll();
    });

    UI.$('#alliance-search').addEventListener('input', (e) => {
      this._renderAvailable(e.target.value);
    });
  },

  _loadState() {
    const saved = localStorage.getItem('allianceState');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this._alliances = state.alliances;
        this._currentPick = state.currentPick;
        this._round = state.round;
        this._rebuildAvailable();
        return;
      } catch (e) {}
    }
    this._resetState();
  },

  _saveState() {
    localStorage.setItem('allianceState', JSON.stringify({
      alliances: this._alliances,
      currentPick: this._currentPick,
      round: this._round,
    }));
  },

  _resetState() {
    // Top 8 by composite become captains, rest are available
    const ranked = [...Teams._teams].sort((a, b) => {
      const ca = a.composite || 0;
      const cb = b.composite || 0;
      return cb - ca || a.teamNumber - b.teamNumber;
    });

    this._alliances = [];
    for (let i = 0; i < 8; i++) {
      if (ranked[i]) {
        this._alliances.push({
          number: i + 1,
          captain: ranked[i].teamNumber,
          picks: [],
        });
      }
    }

    this._round = 1;
    this._currentPick = 0;
    this._rebuildAvailable();
    this._saveState();
  },

  _rebuildAvailable() {
    const taken = new Set();
    for (const a of this._alliances) {
      taken.add(a.captain);
      for (const p of a.picks) taken.add(p);
    }
    this._available = Teams._teams
      .filter(t => !taken.has(t.teamNumber))
      .sort((a, b) => (b.composite || 0) - (a.composite || 0) || a.teamNumber - b.teamNumber);
  },

  _getPickingAlliance() {
    if (this._isComplete()) return null;

    // Serpentine: Round 1 = 0,1,2...7  Round 2 = 7,6,5...0
    if (this._round === 1) return this._currentPick;
    if (this._round === 2) return 7 - this._currentPick;
    return null;
  },

  _isComplete() {
    return this._alliances.every(a => a.picks.length >= 2);
  },

  _pickTeam(teamNumber) {
    const allianceIdx = this._getPickingAlliance();
    if (allianceIdx == null) return;

    const alliance = this._alliances[allianceIdx];
    alliance.picks.push(teamNumber);

    // Advance pick
    this._currentPick++;
    if (this._currentPick >= 8) {
      this._currentPick = 0;
      this._round++;
    }

    this._rebuildAvailable();
    this._saveState();
    this._renderAll();
  },

  _undoLastPick() {
    // Go back one pick
    if (this._currentPick === 0 && this._round <= 1) return; // nothing to undo

    if (this._currentPick === 0) {
      this._round--;
      this._currentPick = 7;
    } else {
      this._currentPick--;
    }

    const allianceIdx = this._round === 1 ? this._currentPick : 7 - this._currentPick;
    const alliance = this._alliances[allianceIdx];
    if (alliance.picks.length > 0) {
      alliance.picks.pop();
    }

    this._rebuildAvailable();
    this._saveState();
    this._renderAll();
  },

  _swapCaptain(allianceIdx, newCaptainNumber) {
    const alliance = this._alliances[allianceIdx];
    const oldCaptain = alliance.captain;
    alliance.captain = newCaptainNumber;

    // Remove new captain from available, add old captain back
    this._rebuildAvailable();
    this._saveState();
    this._renderAll();
  },

  _renderAll() {
    this._renderBanner();
    this._renderAlliances();
    this._renderAvailable('');
  },

  _renderBanner() {
    const banner = UI.$('#alliance-pick-banner');
    if (this._isComplete()) {
      banner.innerHTML = `<div class="card" style="background:#e8f5e9; border:1px solid var(--success); text-align:center; padding:12px;">
        <strong style="color:var(--success);">Alliance selection complete!</strong>
      </div>`;
      return;
    }

    const allianceIdx = this._getPickingAlliance();
    const alliance = this._alliances[allianceIdx];
    const captain = Teams.get(alliance.captain);
    const pickLabel = this._round === 1 ? '1st pick' : '2nd pick';

    banner.innerHTML = `<div class="card" style="background:#e3f2fd; border:1px solid #2196f3; padding:12px;">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div>
          <strong style="color:#2196f3;">Alliance ${alliance.number}</strong> selects their <strong>${pickLabel}</strong>
          <div style="font-size:13px; color:var(--text-secondary);">Captain: #${alliance.captain} ${captain ? UI.esc(captain.teamName) : ''}</div>
          <div style="font-size:12px; color:var(--text-secondary);">Round ${this._round}, Pick ${this._currentPick + 1}/8</div>
        </div>
        <button id="btn-undo-pick" class="btn btn-secondary btn-small" style="width:auto;">Undo</button>
      </div>
    </div>`;

    const undoBtn = UI.$('#btn-undo-pick');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => this._undoLastPick());
      // Disable if nothing to undo
      if (this._round === 1 && this._currentPick === 0) undoBtn.disabled = true;
    }
  },

  _renderAlliances() {
    const grid = UI.$('#alliance-grid');
    const tierColors = { elite: '#ffd700', strong: '#c0c0c0', average: '#cd7f32', below_avg: '#e0e0e0', developing: '#f5f5f5' };

    grid.innerHTML = `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:8px;">
      ${this._alliances.map((a, idx) => {
        const captain = Teams.get(a.captain);
        const picks = a.picks.map(p => Teams.get(p));
        const isActive = this._getPickingAlliance() === idx;

        const totalOPR = [captain, ...picks]
          .filter(Boolean)
          .reduce((sum, t) => sum + (t.opr || 0), 0);

        return `<div class="card" style="padding:10px; ${isActive ? 'border:2px solid #2196f3; background:#f8fbff;' : ''}">
          <div style="font-weight:700; font-size:14px; margin-bottom:6px; display:flex; justify-content:space-between;">
            <span>Alliance ${a.number}</span>
            <span style="font-size:11px; color:var(--accent);">OPR ${totalOPR.toFixed(0)}</span>
          </div>
          ${this._renderAllianceTeam(captain, 'Captain', tierColors)}
          ${picks[0] ? this._renderAllianceTeam(picks[0], '1st', tierColors) : (a.picks.length === 0 && !this._isComplete() ? '<div style="font-size:12px; color:var(--text-secondary); font-style:italic; padding:4px 0;">Awaiting 1st pick...</div>' : '')}
          ${picks[1] ? this._renderAllianceTeam(picks[1], '2nd', tierColors) : (a.picks.length === 1 && !this._isComplete() ? '<div style="font-size:12px; color:var(--text-secondary); font-style:italic; padding:4px 0;">Awaiting 2nd pick...</div>' : '')}
        </div>`;
      }).join('')}
    </div>`;
  },

  _renderAllianceTeam(team, role, tierColors) {
    if (!team) return '';
    const tierColor = tierColors[team.tier] || '#eee';
    return `<div style="display:flex; align-items:center; gap:6px; padding:3px 0; border-bottom:1px solid var(--border);">
      <div style="flex:1; min-width:0;">
        <div style="font-size:13px; font-weight:600;">#${team.teamNumber}</div>
        <div style="font-size:10px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${UI.esc(team.teamName)}</div>
      </div>
      <div style="text-align:right; flex-shrink:0;">
        ${team.opr != null ? `<div style="font-size:10px; font-weight:700; color:var(--accent);">${team.opr.toFixed(0)}</div>` : ''}
        <div style="font-size:9px; color:var(--text-secondary);">${role}</div>
      </div>
    </div>`;
  },

  _renderAvailable(query) {
    const list = UI.$('#available-list');
    const countEl = UI.$('#available-count');

    let filtered = this._available;
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(t =>
        String(t.teamNumber).includes(q) ||
        (t.teamName && t.teamName.toLowerCase().includes(q))
      );
    }

    countEl.textContent = `${this._available.length} remaining`;

    if (filtered.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="message">No teams found</div></div>';
      return;
    }

    const isPickActive = !this._isComplete();
    const tierColors = { elite: '#ffd700', strong: '#c0c0c0', average: '#cd7f32', below_avg: '#e0e0e0', developing: '#f5f5f5' };

    list.innerHTML = filtered.map(t => {
      const tierColor = tierColors[t.tier] || '#eee';
      return `<div class="queue-item ${isPickActive ? 'pickable-team' : ''}" data-team="${t.teamNumber}" style="cursor:${isPickActive ? 'pointer' : 'default'};">
        <div style="width:40px; text-align:center; font-weight:700; font-size:16px; color:var(--accent); flex-shrink:0;">${t.teamNumber}</div>
        <div class="queue-item-info">
          <div class="team">${UI.esc(t.teamName)}</div>
          <div class="meta">
            ${UI.esc([t.city, t.state].filter(Boolean).join(', '))}
            ${t.record ? ` · ${t.record}` : ''}
          </div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          ${t.opr != null ? `<div style="font-weight:700; color:var(--accent);">OPR ${t.opr.toFixed(0)}</div>` : ''}
          ${t.tier ? `<span class="tier-badge tier-${t.tier}">${t.tier}</span>` : ''}
        </div>
      </div>`;
    }).join('');

    if (isPickActive) {
      list.querySelectorAll('.pickable-team').forEach(el => {
        el.addEventListener('click', () => {
          const num = parseInt(el.dataset.team, 10);
          const team = Teams.get(num);
          const allianceIdx = this._getPickingAlliance();
          const alliance = this._alliances[allianceIdx];
          const pickLabel = this._round === 1 ? '1st pick' : '2nd pick';

          if (confirm(`Alliance ${alliance.number} picks #${num} ${team ? team.teamName : ''} as ${pickLabel}?`)) {
            this._pickTeam(num);
          }
        });
      });
    }
  },
};
