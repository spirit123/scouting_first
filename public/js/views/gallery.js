// === Gallery View ===
const GalleryView = {
  render(container) {
    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">Teams</span>
        <a href="#/export" class="btn btn-secondary btn-small">Export</a>
      </div>
      <div class="form-group">
        <input type="search" id="gallery-search" placeholder="Search teams...">
      </div>
      <div id="team-grid-container"></div>
    `;

    this._renderTeams(Teams._teams);

    UI.$('#gallery-search').addEventListener('input', (e) => {
      const matches = Teams.search(e.target.value);
      this._renderTeams(matches);
    });
  },

  _renderTeams(teams) {
    const container = UI.$('#team-grid-container');

    if (teams.length === 0) {
      UI.showEmpty(container, '🔍', 'No teams found');
      return;
    }

    container.innerHTML = `<div class="team-grid">
      ${teams.map(t => `
        <a href="#/team/${t.teamNumber}" class="team-card">
          <div class="team-number">${t.teamNumber}</div>
          <div class="team-name">${UI.esc(t.teamName)}</div>
          ${t.photoCount ? `<div class="photo-count">${t.photoCount} photo${t.photoCount !== 1 ? 's' : ''}</div>` : ''}
        </a>
      `).join('')}
    </div>`;
  },
};
