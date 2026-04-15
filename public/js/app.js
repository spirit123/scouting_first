// === App — Router & Initialization ===
const App = {
  _currentView: null,

  async init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (e) {
        console.warn('SW registration failed:', e);
      }
    }

    // Open IndexedDB
    await DB.open();

    // Load teams
    await Teams.load();

    // Prompt for scout name if not set
    if (!localStorage.getItem('scoutName')) {
      const name = prompt('Enter your name (scout ID):');
      if (name) localStorage.setItem('scoutName', name.trim());
    }

    // Set up routing
    window.addEventListener('hashchange', () => this.route());

    // Set up photo viewer close
    UI.$('#viewer-close').addEventListener('click', () => this.hidePhotoViewer());
    UI.$('#photo-viewer').addEventListener('click', (e) => {
      if (e.target === UI.$('#photo-viewer')) this.hidePhotoViewer();
    });

    // Start connection status polling
    this._pollConnection();

    // Update queue badge
    this.updateQueueBadge();

    // Initial route
    if (!window.location.hash) window.location.hash = '#/gallery';
    else this.route();
  },

  route() {
    const hash = window.location.hash || '#/gallery';
    const container = UI.$('#app');

    // Update active tab
    UI.$$('.tab').forEach(tab => {
      const tabRoute = tab.getAttribute('href');
      tab.classList.toggle('active', hash.startsWith(tabRoute));
    });

    // Route to view
    if (hash.startsWith('#/team/')) {
      const teamNum = hash.split('/')[2];
      TeamDetailView.render(container, teamNum);
      this._currentView = 'team-detail';
    } else if (hash.startsWith('#/scout/')) {
      const teamNum = parseInt(hash.split('/')[2], 10);
      ScoutView.render(container, teamNum);
      this._currentView = 'scout';
    } else if (hash === '#/scout') {
      ScoutView.render(container);
      this._currentView = 'scout';
    } else if (hash === '#/queue') {
      QueueView.render(container);
      this._currentView = 'queue';
    } else if (hash === '#/gallery') {
      GalleryView.render(container);
      this._currentView = 'gallery';
    } else if (hash === '#/export') {
      ExportView.render(container);
      this._currentView = 'export';
    } else if (hash === '#/admin') {
      AdminView.render(container);
      this._currentView = 'admin';
    } else if (hash === '#/settings') {
      SettingsView.render(container);
      this._currentView = 'settings';
    } else {
      window.location.hash = '#/gallery';
    }
  },

  async updateQueueBadge() {
    const count = await DB.getUnsyncedCount();
    const badge = UI.$('#queue-badge');
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  showPhotoViewer(src) {
    UI.$('#viewer-img').src = src;
    UI.$('#photo-viewer').classList.remove('hidden');
  },

  hidePhotoViewer() {
    UI.$('#photo-viewer').classList.add('hidden');
    UI.$('#viewer-img').src = '';
  },

  async _pollConnection() {
    const dot = UI.$('#connection-status');
    const check = async () => {
      const status = await Sync.checkConnection();
      dot.className = `status-dot ${status.online ? 'online' : 'offline'}`;
      dot.title = status.online ? 'Connected to server' : 'Offline';
    };

    await check();
    setInterval(check, 10000); // Check every 10 seconds
  },
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
