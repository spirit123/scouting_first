// === Alliance Selection View ===
const AlliancesView = {
  _alliances: [], // 8 alliances, each { captain, picks: [] }
  _available: [],  // teams not yet on any alliance
  _pickOrder: [],  // which alliance picks next
  _currentPick: 0,
  _round: 0,
  _roleMap: {},    // teamNumber -> { scorer, feeder, defender } counts
  _sortBy: 'composite',
  _filterRole: 'all',
  _promotionLog: [], // FIFO of captain promotions caused by picks, for undo
                     //   { vacatedAllianceIdx, oldCaptain, promotedTeam }

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
        this._promotionLog = state.promotionLog || [];
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
      promotionLog: this._promotionLog,
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
    this._promotionLog = [];
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

  // Returns the alliance index whose captain is `teamNumber` and is currently
  // pickable (no picks yet, not the picking alliance), or null.
  _captainOfShiftableAlliance(teamNumber) {
    const pickingIdx = this._getPickingAlliance();
    for (let i = 0; i < this._alliances.length; i++) {
      const a = this._alliances[i];
      if (a.captain === teamNumber && a.picks.length === 0 && i !== pickingIdx) {
        return i;
      }
    }
    return null;
  },

  _pickTeam(teamNumber) {
    const allianceIdx = this._getPickingAlliance();
    if (allianceIdx == null) return;

    // If the picked team is currently a captain of a shiftable alliance,
    // promote the next-best available team into that captain slot.
    const vacatedIdx = this._captainOfShiftableAlliance(teamNumber);
    let promotion = null;
    if (vacatedIdx != null) {
      const replacement = this._available[0]; // sorted by composite desc
      if (!replacement) {
        UI.toast('No team available to fill the vacated captain slot', 'error');
        return;
      }
      const oldCaptain = this._alliances[vacatedIdx].captain;
      this._alliances[vacatedIdx].captain = replacement.teamNumber;
      promotion = { vacatedAllianceIdx: vacatedIdx, oldCaptain, promotedTeam: replacement.teamNumber };
    }

    const alliance = this._alliances[allianceIdx];
    alliance.picks.push(teamNumber);
    this._promotionLog.push(promotion); // null if no promotion happened

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

    // Reverse the promotion that was logged for this pick (if any).
    const promotion = this._promotionLog.pop();
    if (promotion) {
      this._alliances[promotion.vacatedAllianceIdx].captain = promotion.oldCaptain;
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
        const canChangeCaptain = a.picks.length === 0;

        const totalOPR = [captain, ...picks]
          .filter(Boolean)
          .reduce((sum, t) => sum + (t.opr || 0), 0);

        return `<div class="card" style="padding:10px; ${isActive ? 'border:2px solid #2196f3; background:#f8fbff;' : ''}">
          <div style="font-weight:700; font-size:14px; margin-bottom:6px; display:flex; justify-content:space-between;">
            <span>Alliance ${a.number}</span>
            <span style="font-size:11px; color:var(--accent);">OPR ${totalOPR.toFixed(0)}</span>
          </div>
          ${this._renderAllianceTeam(captain, 'Captain', tierColors, canChangeCaptain ? idx : null)}
          ${picks[0] ? this._renderAllianceTeam(picks[0], '1st', tierColors) : (a.picks.length === 0 && !this._isComplete() ? '<div style="font-size:12px; color:var(--text-secondary); font-style:italic; padding:4px 0;">Awaiting 1st pick...</div>' : '')}
          ${picks[1] ? this._renderAllianceTeam(picks[1], '2nd', tierColors) : (a.picks.length === 1 && !this._isComplete() ? '<div style="font-size:12px; color:var(--text-secondary); font-style:italic; padding:4px 0;">Awaiting 2nd pick...</div>' : '')}
        </div>`;
      }).join('')}
    </div>`;

    grid.querySelectorAll('.change-captain-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.alliance, 10);
        this._openCaptainPicker(idx);
      });
    });
  },

  _renderAllianceTeam(team, draftRole, tierColors, changeableAllianceIdx = null) {
    if (!team) return '';
    const roleIcons = { scorer: '🎯', feeder: '🤝', defender: '🛡️' };
    const scoutedRole = this._getPrimaryRole(team.teamNumber);
    const roleIcon = scoutedRole ? roleIcons[scoutedRole] : '';
    const changeBtn = changeableAllianceIdx != null
      ? `<button class="change-captain-btn" data-alliance="${changeableAllianceIdx}" title="Change captain" style="background:none; border:none; cursor:pointer; font-size:12px; padding:2px 4px; color:var(--text-secondary);">✏️</button>`
      : '';

    return `<div style="display:flex; align-items:center; gap:6px; padding:3px 0; border-bottom:1px solid var(--border);">
      <div style="flex:1; min-width:0;">
        <div style="font-size:13px; font-weight:600;">#${team.teamNumber} ${roleIcon}</div>
        <div style="font-size:10px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${UI.esc(team.teamName)}</div>
      </div>
      <div style="text-align:right; flex-shrink:0; display:flex; align-items:center; gap:2px;">
        <div>
          ${team.opr != null ? `<div style="font-size:10px; font-weight:700; color:var(--accent);">${team.opr.toFixed(0)}</div>` : ''}
          <div style="font-size:9px; color:var(--text-secondary);">${draftRole}</div>
        </div>
        ${changeBtn}
      </div>
    </div>`;
  },

  _openCaptainPicker(allianceIdx) {
    const alliance = this._alliances[allianceIdx];
    const currentCaptain = Teams.get(alliance.captain);

    const candidates = [...this._available];
    if (currentCaptain) candidates.push(currentCaptain);
    candidates.sort((a, b) => {
      const favDiff = (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
      if (favDiff !== 0) return favDiff;
      return (b.composite || 0) - (a.composite || 0) || a.teamNumber - b.teamNumber;
    });

    // Remove existing picker if any
    const existing = document.getElementById('captain-picker-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'captain-picker-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:200; display:flex; align-items:center; justify-content:center; padding:16px;';

    overlay.innerHTML = `
      <div class="card" style="max-width:480px; width:100%; max-height:80vh; display:flex; flex-direction:column; padding:0; overflow:hidden;">
        <div style="padding:12px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between;">
          <strong>Change Alliance ${alliance.number} captain</strong>
          <button id="captain-picker-close" class="btn btn-secondary btn-small" style="width:auto;">✕</button>
        </div>
        <div style="padding:8px 12px; font-size:12px; color:var(--text-secondary); background:var(--bg);">
          Current: <strong>#${alliance.captain}${currentCaptain ? ' ' + UI.esc(currentCaptain.teamName) : ''}</strong>. Tap a team to make them captain.
        </div>
        <div id="captain-picker-list" style="overflow-y:auto; flex:1;">
          ${candidates.map(t => {
            const isCurrent = t.teamNumber === alliance.captain;
            const bg = isCurrent ? '#e3f2fd' : (t.favorite ? '#fffbe6' : '');
            return `<div class="captain-candidate" data-team="${t.teamNumber}" style="display:flex; align-items:center; gap:8px; padding:10px 12px; border-bottom:1px solid var(--border); cursor:pointer; ${bg ? `background:${bg};` : ''}">
              <div style="width:48px; text-align:center; font-weight:700; color:var(--accent);">${t.teamNumber}</div>
              <div style="flex:1; min-width:0;">
                <div style="font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${t.favorite ? '<span style="color:#f5a623; margin-right:4px;" title="Favorite">★</span>' : ''}${UI.esc(t.teamName)}
                </div>
                <div style="font-size:11px; color:var(--text-secondary);">
                  ${t.opr != null ? `OPR ${t.opr.toFixed(0)}` : ''}
                  ${t.winRate != null ? ` · ${t.winRate}% WR` : ''}
                  ${isCurrent ? ' · <strong style="color:#2196f3;">current</strong>' : ''}
                </div>
              </div>
              ${t.tier ? `<span class="tier-badge tier-${t.tier}">${t.tier}</span>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#captain-picker-close').addEventListener('click', close);

    overlay.querySelectorAll('.captain-candidate').forEach(el => {
      el.addEventListener('click', () => {
        const num = parseInt(el.dataset.team, 10);
        if (num === alliance.captain) { close(); return; }
        const team = Teams.get(num);
        if (!confirm(`Make #${num} ${team ? team.teamName : ''} the captain of Alliance ${alliance.number}?`)) return;
        this._swapCaptain(allianceIdx, num);
        close();
      });
    });
  },

  _renderAvailable(query) {
    const list = UI.$('#available-list');
    const countEl = UI.$('#available-count');

    // Pickable = teams not on any alliance + captains of shiftable alliances
    // (other alliances with zero picks). Captains carry a `_captainOf` tag so
    // we can render the badge and trigger the promotion confirm.
    const pickingIdx = this._getPickingAlliance();
    let pickable = [...this._available];
    if (pickingIdx != null) {
      for (let i = 0; i < this._alliances.length; i++) {
        const a = this._alliances[i];
        if (i !== pickingIdx && a.picks.length === 0) {
          const captainTeam = Teams.get(a.captain);
          if (captainTeam) pickable.push({ ...captainTeam, _captainOf: i });
        }
      }
    }

    let filtered = pickable;

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

    // Sort: favorites always bubble to top, then by selected sort
    filtered.sort((a, b) => {
      const favDiff = (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
      if (favDiff !== 0) return favDiff;
      switch (this._sortBy) {
        case 'opr': return (b.opr || -999) - (a.opr || -999);
        case 'winrate': return (b.winRate || 0) - (a.winRate || 0);
        case 'team': return a.teamNumber - b.teamNumber;
        default: return (b.composite || 0) - (a.composite || 0);
      }
    });

    countEl.textContent = `${filtered.length}/${pickable.length} shown`;

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

      const captainOf = t._captainOf != null ? this._alliances[t._captainOf] : null;
      const captainBadge = captainOf
        ? `<span style="background:#fff3e0; color:#e65100; font-size:10px; font-weight:700; padding:2px 6px; border-radius:8px; margin-left:6px;" title="Currently captain of Alliance ${captainOf.number}">Cpt A${captainOf.number}</span>`
        : '';
      const rowBg = captainOf ? '#fff3e0' : (t.favorite ? '#fffbe6' : '');

      return `<div class="queue-item ${isPickActive ? 'pickable-team' : ''}" data-team="${t.teamNumber}" style="cursor:${isPickActive ? 'pointer' : 'default'}; ${rowBg ? `background:${rowBg};` : ''}">
        <div style="width:40px; text-align:center; font-weight:700; font-size:16px; color:var(--accent); flex-shrink:0;">${t.teamNumber}</div>
        <div class="queue-item-info">
          <div class="team">
            ${t.favorite ? '<span style="color:#f5a623; margin-right:4px;" title="Favorite">★</span>' : ''}
            ${UI.esc(t.teamName)}
            ${primaryRole ? `<span style="color:${roleColor}; font-size:12px; margin-left:4px;" title="${primaryRole}">${roleIcon}</span>` : ''}
            ${captainBadge}
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

          // If the team is currently a captain of another alliance, spell out
          // the promotion consequence in the confirm dialog.
          const vacatedIdx = this._captainOfShiftableAlliance(num);
          let prompt = `Alliance ${alliance.number} picks #${num} ${team ? team.teamName : ''} as ${pickLabel}?`;
          if (vacatedIdx != null) {
            const vacated = this._alliances[vacatedIdx];
            const replacement = this._available[0];
            if (!replacement) {
              UI.toast('No team available to fill the vacated captain slot', 'error');
              return;
            }
            const repTeam = Teams.get(replacement.teamNumber);
            prompt = `Alliance ${alliance.number} picks #${num} ${team ? team.teamName : ''} as ${pickLabel}.\n\n#${num} is currently captain of Alliance ${vacated.number} — that seat will be re-filled with #${replacement.teamNumber} ${repTeam ? repTeam.teamName : ''}. Continue?`;
          }

          if (confirm(prompt)) {
            this._pickTeam(num);
          }
        });
      });
    }
  },
};
