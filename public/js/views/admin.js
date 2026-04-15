// === Admin View (Master Phone) ===
const AdminView = {
  _scouts: [],
  _assignments: [],

  async render(container) {
    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">Scout Management</span>
      </div>

      <!-- Add Scout -->
      <div class="card">
        <h3 style="margin-bottom:12px;">Scouts</h3>
        <div style="display:flex; gap:8px;">
          <input type="text" id="new-scout-name" placeholder="Scout name..." style="flex:1;">
          <button id="btn-add-scout" class="btn btn-primary btn-small" style="width:auto;">Add</button>
        </div>
        <div id="scouts-list" class="mt-8"></div>
      </div>

      <!-- Auto-assign -->
      <div class="card">
        <h3 style="margin-bottom:12px;">Auto-Assign Teams</h3>
        <p style="font-size:13px; color:var(--text-secondary); margin-bottom:10px;">
          Distribute all teams evenly across scouts. Each team will be assigned to the specified number of scouts.
        </p>
        <div class="form-group">
          <label>Scouts per team</label>
          <select id="per-team">
            <option value="2" selected>2 scouts per team</option>
            <option value="3">3 scouts per team</option>
            <option value="1">1 scout per team</option>
          </select>
        </div>
        <button id="btn-auto-assign" class="btn btn-primary">Auto-Assign All Teams</button>
      </div>

      <!-- Assignment Overview -->
      <div class="card">
        <h3 style="margin-bottom:12px;">Assignments Overview</h3>
        <div id="assignment-overview"></div>
      </div>

      <!-- Progress -->
      <div class="card">
        <h3 style="margin-bottom:12px;">Progress</h3>
        <div id="progress-overview"></div>
      </div>
    `;

    this._bindEvents();
    await this._loadData();
  },

  _bindEvents() {
    UI.$('#btn-add-scout').addEventListener('click', () => this._addScout());
    UI.$('#new-scout-name').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._addScout();
    });
    UI.$('#btn-auto-assign').addEventListener('click', () => this._autoAssign());
  },

  async _loadData() {
    try {
      const [scoutsRes, assignRes] = await Promise.all([
        fetch('/api/scouts'),
        fetch('/api/scouts/assignments'),
      ]);
      this._scouts = await scoutsRes.json();
      this._assignments = await assignRes.json();
    } catch (e) {
      UI.toast('Failed to load data', 'error');
      return;
    }

    this._renderScouts();
    this._renderOverview();
    this._renderProgress();
  },

  _renderScouts() {
    const container = UI.$('#scouts-list');
    if (this._scouts.length === 0) {
      container.innerHTML = '<div style="font-size:13px; color:var(--text-secondary); font-style:italic;">No scouts added yet.</div>';
      return;
    }

    container.innerHTML = this._scouts.map(s => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
        <div>
          <span style="font-weight:600;">${UI.esc(s.name)}</span>
          <span style="font-size:12px; color:var(--text-secondary);"> · ${s.assigned_count} assigned · ${s.scouted_count} done</span>
        </div>
        <button class="btn btn-danger btn-small btn-delete-scout" data-name="${UI.esc(s.name)}" style="padding:4px 10px; font-size:12px;">✕</button>
      </div>
    `).join('');

    container.querySelectorAll('.btn-delete-scout').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Remove scout "${btn.dataset.name}" and their assignments?`)) return;
        await fetch(`/api/scouts/${encodeURIComponent(btn.dataset.name)}`, { method: 'DELETE' });
        UI.toast(`Scout "${btn.dataset.name}" removed`, 'success');
        await this._loadData();
      });
    });
  },

  _renderOverview() {
    const container = UI.$('#assignment-overview');

    if (this._assignments.length === 0) {
      container.innerHTML = '<div style="font-size:13px; color:var(--text-secondary); font-style:italic;">No assignments yet. Add scouts and use Auto-Assign.</div>';
      return;
    }

    // Group by scout
    const byScout = {};
    for (const a of this._assignments) {
      if (!byScout[a.scout_name]) byScout[a.scout_name] = [];
      byScout[a.scout_name].push(a);
    }

    let html = '';
    for (const [scout, teams] of Object.entries(byScout)) {
      const done = teams.filter(t => t.completed).length;
      const total = teams.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      html += `<div style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:600;">${UI.esc(scout)}</span>
          <span style="font-size:12px; color:var(--text-secondary);">${done}/${total} (${pct}%)</span>
        </div>
        <div class="progress-bar"><div class="fill" style="width:${pct}%; background:${pct === 100 ? 'var(--success)' : 'var(--accent-bright)'}"></div></div>
        <div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">
          ${teams.map(t => `<span style="display:inline-block; margin:2px; padding:1px 6px; border-radius:4px; background:${t.completed ? '#e8f5e9' : '#fff3e0'}; color:${t.completed ? '#4caf50' : '#ff9800'};">${t.team_number}</span>`).join('')}
        </div>
      </div>`;
    }

    container.innerHTML = html;
  },

  _renderProgress() {
    const container = UI.$('#progress-overview');

    if (this._assignments.length === 0) {
      container.innerHTML = '';
      return;
    }

    // Teams with incomplete assignments
    const byTeam = {};
    for (const a of this._assignments) {
      if (!byTeam[a.team_number]) byTeam[a.team_number] = { name: a.team_name, scouts: [] };
      byTeam[a.team_number].scouts.push({ name: a.scout_name, done: !!a.completed });
    }

    const incomplete = Object.entries(byTeam)
      .filter(([, t]) => t.scouts.some(s => !s.done))
      .sort(([a], [b]) => Number(a) - Number(b));

    const complete = Object.entries(byTeam)
      .filter(([, t]) => t.scouts.every(s => s.done));

    const totalTeams = Object.keys(byTeam).length;
    const doneTeams = complete.length;

    let html = `<div style="font-size:14px; margin-bottom:8px;">
      <strong>${doneTeams}/${totalTeams}</strong> teams fully scouted
    </div>`;

    if (incomplete.length > 0) {
      html += `<div style="font-size:13px; font-weight:600; margin-bottom:6px; color:var(--warning);">Remaining (${incomplete.length}):</div>`;
      html += incomplete.slice(0, 20).map(([num, t]) => {
        const missing = t.scouts.filter(s => !s.done).map(s => s.name).join(', ');
        return `<div style="font-size:12px; padding:3px 0; border-bottom:1px solid var(--border);">
          <strong>#${num}</strong> ${UI.esc(t.name)} — <span style="color:var(--warning);">needs: ${UI.esc(missing)}</span>
        </div>`;
      }).join('');
      if (incomplete.length > 20) html += `<div style="font-size:12px; color:var(--text-secondary);">...and ${incomplete.length - 20} more</div>`;
    }

    container.innerHTML = html;
  },

  async _addScout() {
    const input = UI.$('#new-scout-name');
    const name = input.value.trim();
    if (!name) return;

    const res = await fetch('/api/scouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      input.value = '';
      UI.toast(`Scout "${name}" added`, 'success');
      await this._loadData();
    } else {
      const err = await res.json();
      UI.toast(err.error || 'Failed to add scout', 'error');
    }
  },

  async _autoAssign() {
    if (this._scouts.length === 0) {
      UI.toast('Add scouts first', 'error');
      return;
    }

    const perTeam = parseInt(UI.$('#per-team').value, 10);
    if (!confirm(`This will reassign ALL teams. Each team gets ${perTeam} scouts. Continue?`)) return;

    const res = await fetch('/api/scouts/assignments/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perTeam }),
    });

    if (res.ok) {
      const data = await res.json();
      const summary = data.summary.map(s => `${s.name}: ${s.assignedCount}`).join(', ');
      UI.toast(`Assigned! ${summary}`, 'success');
      await this._loadData();
    } else {
      const err = await res.json();
      UI.toast(err.error || 'Auto-assign failed', 'error');
    }
  },
};
