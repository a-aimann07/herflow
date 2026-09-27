/* =========================================================
   HerFlow — notifications.js
   Renders the notification center and handles read/clear
   actions. Auto-notifications are (re)generated in app.js
   on every page load, this file only displays + manages them.
   ========================================================= */

function timeAgo(ts) {
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function notifIconFor(type) {
  return {
    'due-today': 'fa-circle-exclamation',
    'due-tomorrow': 'fa-clock',
    'overdue': 'fa-triangle-exclamation',
    'reminder': 'fa-bell',
    'completed': 'fa-circle-check',
    'project-milestone': 'fa-flag-checkered'
  }[type] || 'fa-bell';
}

/* Colour class for the icon tile — matches the class names defined
   for .notif-icon in style.css (warn / danger / success / purple). */
function notifClassFor(type) {
  return {
    'due-today': 'warn',
    'due-tomorrow': '',
    'overdue': 'danger',
    'reminder': '',
    'completed': 'success',
    'project-milestone': 'purple'
  }[type] ?? '';
}

function renderNotifications() {
  const list = Storage.getData(STORAGE_KEYS.notifications, []).sort((a, b) => b.createdAt - a.createdAt);
  const el = document.getElementById('notificationsList');

  if (!list.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="emoji">🔔</div>
      <h4>No notifications</h4>
      <p>Due dates, reminders and milestones will show up here automatically.</p>
    </div>`;
    return;
  }

  el.innerHTML = list.map(n => `
    <div class="notif-row ${n.read ? '' : 'unread'}" data-id="${n.id}">
      ${!n.read ? '<span class="notif-unread-dot"></span>' : '<span style="width:8px;"></span>'}
      <div class="notif-icon ${notifClassFor(n.type)}"><i class="fa-solid ${notifIconFor(n.type)}"></i></div>
      <div class="notif-body">
        <div class="notif-message">${Utils.escapeHTML(n.message)}</div>
        <div class="notif-time">${timeAgo(n.createdAt)}</div>
      </div>
      <div class="notif-actions">
        ${!n.read ? `<button class="btn-icon" data-action="read" title="Mark as read"><i class="fa-solid fa-check"></i></button>` : ''}
        <button class="btn-icon" data-action="clear" title="Clear"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderNotifications();

  document.getElementById('notificationsList').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const row = btn.closest('.notif-row');
    const id = row.dataset.id;

    if (btn.dataset.action === 'read') {
      Storage.updateData(STORAGE_KEYS.notifications, id, { read: true });
      renderNotifications();
      renderSidebar();
    } else if (btn.dataset.action === 'clear') {
      Storage.deleteData(STORAGE_KEYS.notifications, id);
      renderNotifications();
      renderSidebar();
    }
  });

  document.getElementById('markAllReadBtn').addEventListener('click', () => {
    const list = Storage.getData(STORAGE_KEYS.notifications, []).map(n => ({ ...n, read: true }));
    Storage.saveData(STORAGE_KEYS.notifications, list);
    Utils.toast('All notifications marked as read.', 'success');
    renderNotifications();
    renderSidebar();
  });
});
