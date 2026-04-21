// === Alliance Selection View ===
const AlliancesView = {
  _alliances: [], // 8 alliances, each { captain, picks: [] }
  _available: [],  // teams not yet picked
  _pickOrder: [],  // which alliance picks next
  _currentPick: 0,
  _round: 0,
  _roleMap: {},    // teamNumber -> { scorer, feeder, defender } counts
  _sortBy: 'composite',
  _filterRole: 'all',

  async render(container) {
    // Load saved state and role data
    this._loadState();
    await this._loadRoles();

    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">Alliance Selection</span>
        <div style="display:flex; gap:6px;">
          <a href="#/gallery" class="btn btn-secondary btn-small">← Teams</a>
          <button id="btn-reset-alliances" class="btn btn-danger btn-small">Reset</button>
        </div>
      </div>

      <div id="alliance-pick-banner"></div>
      <div id="alliance-grid"></div>

      <div class="section-header mt-16">
        <span class="section-title">Available Teams</span>
        <span id="available-count" class="text-secondary"></span>
      </div>
      <div style="display:flex; gap:6px; margin-bottom:8px; flex-wrap:wrap;">
        <button class="btn btn-small filter-btn active" data-filter="all">All</button>
        <button class="btn btn-small filter-btn" data-filter="scorer">🎯 Scorers</button>
        <button class="btn btn-small filter-btn" data-filter="feeder">🤝 Feeders</button>
        <button class="btn btn-small filter-btn" data-filter="defender">🛡️ Defenders</button>
      </div>
      <div style="display:flex; gap:6px; margin-bottom:8px; flex-wrap:wrap;">
        <button class="btn btn-small sort-btn active" data-sort="composite">Best Overall</button>
        <button class="btn btn-small sort-btn" data-sort="opr">Best OPR</button>
        <button class="btn btn-small sort-btn" data-sort="winrate">Best Win Rate</button>
        <button class="btn btn-small sort-btn" data-sort="team">Team #</button>
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

    UI.$$('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        UI.$$('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._filterRole = btn.dataset.filter;
        this._renderAvailable(UI.$('#alliance-search').value);
      });
    });

    UI.$$('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        UI.$$('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._sortBy = btn.dataset.sort;
        this._renderAvailable(UI.$('#alliance-search').value);
      });
    });

    UI.$('#alliance-search').addEventListener('input', (e) => {
      this._renderAvailable(e.target.value);
    });
  },

  async _loadRoles() {
    this._roleMap = {};

    const splitRoles = (val) =>
      val ? String(val).split(',').map(s => s.trim()).filter(Boolean) : [];

    const addRoles = (teamNumber, roles) => {
      if (roles.length === 0) return;
      if (!this._roleMap[teamNumber]) this._roleMap[teamNumber] = { scorer: 0, feeder: 0, defender: 0 };
      for (const r of roles) {
        this._roleMap[teamNumber][r] = (this._roleMap[teamNumber][r] || 0) + 1;
      }
    };

    // Load from local IndexedDB
    try {
      const localEntries = await DB.getAllEntries();
      for (const e of localEntries) {
        addRoles(e.teamNumber, splitRoles(e.role));
      }
    } catch (e) {}

    // Load from server
    try {
      const res = await fetch('/api/entries');
      if (res.ok) {
        const entries = await res.json();
        for (const e of entries) {
          addRoles(e.team_number, splitRoles(e.role));
        }
      }
    } catch (e) {}
  },

  _getPrimaryRole(teamNumber) {
    const roles = this._roleMap[teamNumber];
    if (!roles) return null;
    const max = Math.max(roles.scorer, roles.feeder, roles.defender);
    if (max === 0) return null;
    if (roles.scorer === max) return 'scorer';
    if (roles.feeder === max) return 'feeder';
    return 'defender';
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

  _renderAllianceTeam(team, draftRole, tierColors) {
    if (!team) return '';
    const roleIcons = { scorer: '🎯', feeder: '🤝', defender: '🛡️' };
    const scoutedRole = this._getPrimaryRole(team.teamNumber);
    const roleIcon = scoutedRole ? roleIcons[scoutedRole] : '';

    return `<div style="display:flex; align-items:center; gap:6px; padding:3px 0; border-bottom:1px solid var(--border);">
      <div style="flex:1; min-width:0;">
        <div style="font-size:13px; font-weight:600;">#${team.teamNumber} ${roleIcon}</div>
        <div style="font-size:10px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${UI.esc(team.teamName)}</div>
      </div>
      <div style="text-align:right; flex-shrink:0;">
        ${team.opr != null ? `<div style="font-size:10px; font-weight:700; color:var(--accent);">${team.opr.toFixed(0)}</div>` : ''}
        <div style="font-size:9px; color:var(--text-secondary);">${draftRole}</div>
      </div>
    </div>`;
  },

  _renderAvailable(query) {
    const list = UI.$('#available-list');
    const countEl = UI.$('#available-count');

    let filtered = [...this._available];

    // Filter by role
    if (this._filterRole !== 'all') {
      filtered = filtered.filter(t => {
        const role = this._getPrimaryRole(t.teamNumber);
        return role === this._filterRole;
      });
    }

    // Search
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(t =>
        String(t.teamNumber).includes(q) ||
        (t.teamName && t.teamName.toLowerCase().includes(q))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this._sortBy) {
        case 'opr': return (b.opr || -999) - (a.opr || -999);
        case 'winrate': return (b.winRate || 0) - (a.winRate || 0);
        case 'team': return a.teamNumber - b.teamNumber;
        default: return (b.composite || 0) - (a.composite || 0);
      }
    });

    countEl.textContent = `${filtered.length}/${this._available.length} shown`;

    if (filtered.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="message">No teams found</div></div>';
      return;
    }

    const isPickActive = !this._isComplete();
    const tierColors = { elite: '#ffd700', strong: '#c0c0c0', average: '#cd7f32', below_avg: '#e0e0e0', developing: '#f5f5f5' };

    const roleIcons = { scorer: '🎯', feeder: '🤝', defender: '🛡️' };
    const roleColors = { scorer: '#4caf50', feeder: '#2196f3', defender: '#ff9800' };

    list.innerHTML = filtered.map(t => {
      const primaryRole = this._getPrimaryRole(t.teamNumber);
      const roleIcon = primaryRole ? roleIcons[primaryRole] : '';
      const roleColor = primaryRole ? roleColors[primaryRole] : '';

      return `<div class="queue-item ${isPickActive ? 'pickable-team' : ''}" data-team="${t.teamNumber}" style="cursor:${isPickActive ? 'pointer' : 'default'};">
        <div style="width:40px; text-align:center; font-weight:700; font-size:16px; color:var(--accent); flex-shrink:0;">${t.teamNumber}</div>
        <div class="queue-item-info">
          <div class="team">
            ${UI.esc(t.teamName)}
            ${primaryRole ? `<span style="color:${roleColor}; font-size:12px; margin-left:4px;" title="${primaryRole}">${roleIcon}</span>` : ''}
          </div>
          <div class="meta">
            ${UI.esc([t.city, t.state].filter(Boolean).join(', '))}
            ${t.record ? ` · ${t.record}` : ''}
            ${t.winRate != null ? ` · ${t.winRate}% WR` : ''}
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
