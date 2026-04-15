// === UI Helpers ===
const UI = {
  $(sel) { return document.querySelector(sel); },
  $$(sel) { return document.querySelectorAll(sel); },

  // Show a toast notification
  toast(message, type = 'info', duration = 3000) {
    const toast = this.$('#toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.add('hidden'), duration);
  },

  // Create element with optional class and text
  el(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  },

  // Set inner HTML safely (only for trusted content)
  render(container, html) {
    if (typeof container === 'string') container = this.$(container);
    container.innerHTML = html;
  },

  // Loading spinner
  showLoading(container) {
    if (typeof container === 'string') container = this.$(container);
    container.innerHTML = '<div class="empty-state"><div class="icon">...</div><div class="message">Loading...</div></div>';
  },

  // Empty state
  showEmpty(container, icon, message) {
    if (typeof container === 'string') container = this.$(container);
    container.innerHTML = `<div class="empty-state"><div class="icon">${icon}</div><div class="message">${message}</div></div>`;
  },

  // Escape HTML to prevent XSS
  esc(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  },

  // Format timestamp for display
  formatTime(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  },

  // Generate UUID (works on HTTP, not just HTTPS)
  uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for non-secure contexts (HTTP over hotspot)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  },

  // Format file size
  formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },
};
