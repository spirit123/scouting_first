// === Export View ===
const ExportView = {
  async render(container) {
    // Get stats
    let stats = { teamCount: 0, photoCount: 0, scoutCount: 0 };
    try {
      const res = await fetch('/api/status');
      if (res.ok) stats = await res.json();
    } catch (e) {
      // offline
    }

    const localCount = (await DB.getUnsyncedEntries()).length;

    container.innerHTML = `
      <div class="section-header">
        <span class="section-title">Export & Reports</span>
        <a href="#/gallery" class="btn btn-secondary btn-small">← Back</a>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.teamCount}</div>
          <div class="stat-label">Teams</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.entryCount || 0}</div>
          <div class="stat-label">Entries</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.scoutCount}</div>
          <div class="stat-label">Scouts</div>
        </div>
      </div>

      ${localCount > 0 ? `<div class="card" style="background: #fff3cd; border: 1px solid #ffc107; margin-bottom: 12px;">
        <strong>⚠️ ${localCount} entries not yet synced.</strong> Sync before exporting to include all data.
      </div>` : ''}

      <div class="card">
        <h3 style="margin-bottom:12px;">Download</h3>
        <a href="/api/export/csv" download class="btn btn-primary mb-12">Download CSV</a>
        <a href="/api/export/json" download class="btn btn-secondary mb-12">Download JSON</a>
      </div>

      <div class="card">
        <h3 style="margin-bottom:12px;">Reports</h3>
        <a href="/api/export/html" target="_blank" class="btn btn-primary mb-12">View Printable Report</a>
        <p style="font-size:13px; color:var(--text-secondary);">Opens in new tab. Use browser's Print to save as PDF or print.</p>
      </div>
    `;
  },
};
