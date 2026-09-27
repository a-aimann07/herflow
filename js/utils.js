/* =========================================================
   HerFlow — utils.js
   Small, reusable helper functions shared across every page:
   date math, id generation, toasts, and modal/dialog helpers.
   ========================================================= */

const Utils = {
  /** Generate a reasonably-unique id for new records. */
  uid() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  },

  /** Format a Date object as YYYY-MM-DD (local time, no timezone drift). */
  toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  /** Parse a YYYY-MM-DD string into a local Date at midnight. */
  parseISODate(str) {
    if (!str) return null;
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  },

  addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  },

  /** Difference in whole calendar days between two YYYY-MM-DD strings (b - a). */
  dayDiff(aISO, bISO) {
    const a = Utils.parseISODate(aISO);
    const b = Utils.parseISODate(bISO);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((b - a) / msPerDay);
  },

  todayISO() {
    return Utils.toISODate(new Date());
  },

  /** Friendly date label: "Today", "Tomorrow", or "Mon, Sep 29". */
  friendlyDate(iso) {
    if (!iso) return '';
    const diff = Utils.dayDiff(Utils.todayISO(), iso);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    const d = Utils.parseISODate(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  },

  formatLongDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  },

  formatTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  },

  clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  },

  escapeHTML(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /** Show a toast notification. type: 'success' | 'error' | 'info' */
  toast(message, type = 'info') {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-sparkles' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${Utils.escapeHTML(message)}</span>`;
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 260);
    }, 3200);
  },

  /** Open a confirmation dialog. Returns a Promise<boolean>. */
  confirmDialog({ title = 'Are you sure?', message = '', confirmText = 'Confirm', danger = true } = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal modal-confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirmTitle">
          <div class="modal-header">
            <h3 id="confirmTitle">${Utils.escapeHTML(title)}</h3>
            <button class="modal-close" aria-label="Close" data-cancel><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">${Utils.escapeHTML(message)}</div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-cancel>Cancel</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${Utils.escapeHTML(confirmText)}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('open'));

      const close = (result) => {
        overlay.classList.remove('open');
        setTimeout(() => overlay.remove(), 200);
        resolve(result);
      };
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.closest('[data-cancel]')) close(false);
        if (e.target.closest('[data-confirm]')) close(true);
      });
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', esc); }
      });
    });
  },

  /** Open a generic modal by id (expects markup already in DOM). */
  openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    const firstInput = overlay.querySelector('input, select, textarea, button');
    if (firstInput) setTimeout(() => firstInput.focus(), 80);
  },

  closeModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  },

  /** Wire up close-on-backdrop-click and Escape for all modal overlays on the page. */
  wireModalDismiss() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
        if (e.target.closest('[data-modal-close]')) overlay.classList.remove('open');
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open'));
      }
    });
  },

  /** Get the hex color for a category name. */
  categoryColor(name) {
    const cats = Storage.getData(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
    const found = cats.find(c => c.name === name);
    return found ? found.color : '#B9B9C2';
  }
};
