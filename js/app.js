/* =========================================================
   HerFlow — app.js
   Runs on every page. Handles: theme application, rendering
   the sidebar / mobile topbar / bottom nav, keeping the
   profile snippet in sync, and generating notifications
   from live task/schedule data.
   ========================================================= */

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Overview', icon: 'fa-house', href: 'dashboard.html' },
  { key: 'schedule', label: 'Schedule', icon: 'fa-clock', href: 'schedule.html' },
  { key: 'calendar', label: 'Calendar', icon: 'fa-calendar-days', href: 'calendar.html' },
  { key: 'tasks', label: 'Tasks', icon: 'fa-list-check', href: 'tasks.html' },
  { key: 'projects', label: 'Projects', icon: 'fa-diagram-project', href: 'projects.html' },
];
const BOTTOM_NAV_ITEMS = [
  { key: 'dashboard', label: 'Home', icon: 'fa-house', href: 'dashboard.html' },
  { key: 'tasks', label: 'Tasks', icon: 'fa-list-check', href: 'tasks.html' },
  { key: 'calendar', label: 'Calendar', icon: 'fa-calendar-days', href: 'calendar.html' },
  { key: 'notifications', label: 'Alerts', icon: 'fa-bell', href: 'notifications.html' },
  { key: 'profile', label: 'Profile', icon: 'fa-user', href: 'profile.html' },
];

/* ---------- Theme ---------- */
function applyTheme() {
  const settings = Storage.getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  document.documentElement.setAttribute('data-theme', settings.theme || 'pink');
}

/* ---------- Notification generation ---------- */
/**
 * Rebuild the "auto" notifications (due today / tomorrow / overdue / reminders)
 * from live task + schedule data, while preserving read/cleared state for
 * notifications the user has already interacted with, and never duplicating.
 */
function generateAutoNotifications() {
  const settings = Storage.getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  if (!settings.dueDateNotifications && !settings.remindersEnabled) return;

  const tasks = Storage.getData(STORAGE_KEYS.tasks, []);
  const schedule = Storage.getData(STORAGE_KEYS.schedule, []);
  const projects = Storage.getData(STORAGE_KEYS.projects, []);
  let notifications = Storage.getData(STORAGE_KEYS.notifications, []);

  const existingAutoIds = new Set(notifications.filter(n => n.auto).map(n => n.sourceKey));
  const today = Utils.todayISO();
  const added = [];

  if (settings.dueDateNotifications) {
    tasks.forEach(t => {
      if (t.status === 'Completed' || !t.dueDate) return;
      const diff = Utils.dayDiff(today, t.dueDate);
      let type = null, message = null;
      if (diff < 0) { type = 'overdue'; message = `${t.title} is overdue.`; }
      else if (diff === 0) { type = 'due-today'; message = `${t.title} is due today.`; }
      else if (diff === 1) { type = 'due-tomorrow'; message = `${t.title} is due tomorrow.`; }
      if (!type) return;
      const sourceKey = `task_${type}_${t.id}`;
      if (existingAutoIds.has(sourceKey)) return;
      added.push({
        id: Utils.uid(), sourceKey, auto: true, type, relatedId: t.id,
        message, read: false, createdAt: Date.now()
      });
    });

    projects.forEach(p => {
      if (p.status === 'Completed' || !p.deadline) return;
      const diff = Utils.dayDiff(today, p.deadline);
      if (diff === 0 || diff === 1) {
        const sourceKey = `project_milestone_${p.id}_${p.deadline}`;
        if (existingAutoIds.has(sourceKey)) return;
        added.push({
          id: Utils.uid(), sourceKey, auto: true, type: 'project-milestone', relatedId: p.id,
          message: `${p.name} deadline is ${diff === 0 ? 'today' : 'tomorrow'}.`,
          read: false, createdAt: Date.now()
        });
      }
    });
  }

  if (settings.remindersEnabled) {
    schedule.forEach(s => {
      if (!s.reminder || s.date !== today || s.status === 'Completed') return;
      const sourceKey = `reminder_${s.id}`;
      if (existingAutoIds.has(sourceKey)) return;
      added.push({
        id: Utils.uid(), sourceKey, auto: true, type: 'reminder', relatedId: s.id,
        message: `${s.title} is scheduled today at ${Utils.formatTime(s.startTime)}.`,
        read: false, createdAt: Date.now()
      });
    });
  }

  if (added.length) {
    notifications = [...added, ...notifications];
    Storage.saveData(STORAGE_KEYS.notifications, notifications);
  }
}

function unreadNotificationCount() {
  const notifications = Storage.getData(STORAGE_KEYS.notifications, []);
  return notifications.filter(n => !n.read).length;
}

/* ---------- Sidebar / Topbar / Bottom nav rendering ---------- */
function currentPageKey() {
  const path = window.location.pathname;
  const file = path.substring(path.lastIndexOf('/') + 1).replace('.html', '') || 'dashboard';
  return file;
}

function renderSidebar() {
  const root = document.getElementById('sidebarRoot');
  if (!root) return;
  const profile = Storage.getData(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  const active = currentPageKey();
  const unread = unreadNotificationCount();

  const navHTML = NAV_ITEMS.map(item => `
    <a href="${item.href}" class="nav-link ${active === item.key ? 'active' : ''}">
      <i class="fa-solid ${item.icon}"></i><span class="nav-text">${item.label}</span>
    </a>`).join('');

  root.innerHTML = `
    <aside class="sidebar" aria-label="Main navigation">
      <div class="sidebar-brand"><span class="brand-text">HERFLOW</span> <span class="spark">✦</span></div>
      <nav class="sidebar-nav">
        <div class="sidebar-section-label">Workspace</div>
        ${navHTML}
        <div class="sidebar-section-label">Updates</div>
        <a href="notifications.html" class="nav-link ${active === 'notifications' ? 'active' : ''}">
          <i class="fa-solid fa-bell"></i><span class="nav-text">Notifications</span>
          ${unread > 0 ? `<span class="nav-badge">${unread}</span>` : ''}
        </a>
        <div class="sidebar-section-label">You</div>
        <a href="profile.html" class="nav-link ${active === 'profile' ? 'active' : ''}">
          <i class="fa-solid fa-user"></i><span class="nav-text">Profile</span>
        </a>
        <a href="settings.html" class="nav-link ${active === 'settings' ? 'active' : ''}">
          <i class="fa-solid fa-gear"></i><span class="nav-text">Settings</span>
        </a>
      </nav>
      <a href="profile.html" class="sidebar-profile">
        <img src="${profile.avatar}" alt="${Utils.escapeHTML(profile.name)}'s avatar" id="sidebarAvatarImg">
        <div>
          <div class="name">${Utils.escapeHTML(profile.name)}</div>
          <div class="role">${Utils.escapeHTML(profile.occupation)}</div>
        </div>
      </a>
    </aside>`;

  const avatarImg = document.getElementById('sidebarAvatarImg');
  if (avatarImg) {
    avatarImg.addEventListener('error', () => {
      avatarImg.src = '../assets/images/default-avatar.png';
    }, { once: true });
  }
}

function renderTopbarMobile(pageTitle) {
  const root = document.getElementById('topbarRoot');
  if (!root) return;
  const unread = unreadNotificationCount();
  root.innerHTML = `
    <header class="topbar-mobile">
      <div class="sidebar-brand"><span>HERFLOW</span> <span class="spark">✦</span></div>
      <a href="notifications.html" class="icon-btn btn-icon" style="position:relative;" aria-label="Notifications">
        <i class="fa-solid fa-bell"></i>
        ${unread > 0 ? `<span class="nav-badge" style="position:absolute;top:-4px;right:-4px;">${unread}</span>` : ''}
      </a>
    </header>`;
}

function renderBottomNav() {
  const root = document.getElementById('bottomNavRoot');
  if (!root) return;
  const active = currentPageKey();
  root.innerHTML = `
    <nav class="bottom-nav" aria-label="Mobile navigation">
      <ul>
        ${BOTTOM_NAV_ITEMS.map(item => `
          <li><a href="${item.href}" class="${active === item.key ? 'active' : ''}">
            <i class="fa-solid ${item.icon}"></i>${item.label}
          </a></li>`).join('')}
      </ul>
    </nav>`;
}

/* ---------- Boot sequence run on every page ---------- */
function initApp() {
  ensureDefaults();
  seedIfFirstLaunch();
  applyTheme();
  generateAutoNotifications();
  renderSidebar();
  renderTopbarMobile();
  renderBottomNav();
  Utils.wireModalDismiss();
}

document.addEventListener('DOMContentLoaded', initApp);

/* Generic delegated handler so dynamically-rendered empty-state buttons
   (built via innerHTML) never need inline onclick="" attributes — they
   just carry data-trigger="someButtonId" and this clicks that button. */
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-trigger]');
  if (!trigger) return;
  const target = document.getElementById(trigger.dataset.trigger);
  if (target) target.click();
});

/* ---------- Smooth page switching ---------- */
/* Every in-app link (sidebar tabs, bottom nav, "View all", the profile
   snippet, etc.) points at a plain .html page — this is a classic
   multi-page site, not a single-page app. To make switching between
   pages feel smooth rather than an abrupt hard-cut, this fades the
   current page out for a beat before the browser actually navigates,
   and .main-content itself fades in on arrival (see contentIn in
   style.css). */
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = e.target.closest('a[href]');
  if (!link || link.target === '_blank') return;
  const href = link.getAttribute('href');
  if (!href || !href.endsWith('.html') || href.startsWith('http')) return;

  e.preventDefault();
  const outgoing = document.querySelector('.main-content') || document.body;
  outgoing.classList.add('is-leaving');
  window.setTimeout(() => { window.location.href = href; }, 150);
});
