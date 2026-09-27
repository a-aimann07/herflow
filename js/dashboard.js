/* =========================================================
   HerFlow — dashboard.js
   Renders the Overview page from live task/schedule/project data.
   Nothing here is hardcoded — every number is calculated.
   ========================================================= */

/* Buckets the 7 categories into the 4 headline overview cards. */
const OVERVIEW_BUCKETS = {
  Learning: ['Learning'],
  Work: ['Development', 'Career'],
  Design: ['Design', 'Content'],
  Personal: ['Personal', 'Household']
};
const OVERVIEW_ICONS = { Learning: 'fa-graduation-cap', Work: 'fa-briefcase', Design: 'fa-palette', Personal: 'fa-heart' };
const OVERVIEW_ACCENTS = { Learning: 'purple', Work: 'blue', Design: 'yellow', Personal: 'green' };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function renderHeader() {
  const profile = Storage.getData(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  const firstName = (profile.name || 'there').split(' ')[0];
  document.getElementById('greeting').textContent = `${getGreeting()}, ${firstName} ✨`;
  document.getElementById('currentDate').textContent = Utils.formatLongDate(new Date());
}

function renderProgress(tasks) {
  const today = Utils.todayISO();
  const todays = tasks.filter(t => t.dueDate === today);
  const completed = todays.filter(t => t.status === 'Completed').length;
  const pct = todays.length ? Math.round((completed / todays.length) * 100) : 0;
  document.getElementById('progressPercent').textContent = `${pct}%`;
  document.getElementById('progressFill').style.width = `${pct}%`;
  document.getElementById('progressSub').textContent = `${completed} of ${todays.length} tasks completed today`;
}

function renderOverviewCards(tasks) {
  const grid = document.getElementById('overviewGrid');
  grid.innerHTML = Object.entries(OVERVIEW_BUCKETS).map(([label, cats]) => {
    const list = tasks.filter(t => cats.includes(t.category));
    const completed = list.filter(t => t.status === 'Completed').length;
    const pending = list.length - completed;
    const pct = list.length ? Math.round((completed / list.length) * 100) : 0;
    return `
      <div class="overview-card" data-accent="${OVERVIEW_ACCENTS[label]}">
        <div class="overview-card-top">
          <div class="overview-icon"><i class="fa-solid ${OVERVIEW_ICONS[label]}"></i></div>
          <span class="badge badge-inprogress">${pct}%</span>
        </div>
        <h3>${label}</h3>
        <div class="overview-count">${list.length} task${list.length === 1 ? '' : 's'}</div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="overview-stats"><span>${completed} done</span><span>${pending} pending</span></div>
      </div>`;
  }).join('');
}

function renderTodaysSchedule(schedule) {
  const el = document.getElementById('todaysSchedule');
  const today = Utils.todayISO();
  const items = schedule.filter(s => s.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
  if (!items.length) {
    el.innerHTML = emptyState('🗓️', 'Nothing scheduled today', 'Add a time block from the Schedule page to plan your day.');
    return;
  }
  el.innerHTML = items.map(s => `
    <div class="list-row">
      <div class="list-row-icon" style="background:${Utils.categoryColor(s.category)}22;color:${Utils.categoryColor(s.category)}">
        <i class="fa-solid fa-clock"></i>
      </div>
      <div>
        <div class="list-row-title">${Utils.escapeHTML(s.title)}</div>
        <div class="list-row-meta">${Utils.formatTime(s.startTime)} – ${Utils.formatTime(s.endTime)} · ${Utils.escapeHTML(s.category)}</div>
      </div>
      <div class="list-row-right">${priorityBadge(s.priority)}</div>
    </div>`).join('');
}

function renderRecentTasks(tasks) {
  const el = document.getElementById('recentTasks');
  const items = [...tasks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  if (!items.length) {
    el.innerHTML = emptyState('✨', 'No tasks yet', 'Create your first task to start planning your day.');
    return;
  }
  el.innerHTML = items.map(t => `
    <div class="list-row">
      <div class="list-row-icon" style="background:${Utils.categoryColor(t.category)}22;color:${Utils.categoryColor(t.category)}">
        <i class="fa-solid fa-list-check"></i>
      </div>
      <div>
        <div class="list-row-title">${Utils.escapeHTML(t.title)}</div>
        <div class="list-row-meta">${Utils.escapeHTML(t.category)} · ${t.dueDate ? Utils.friendlyDate(t.dueDate) : 'No date'}</div>
      </div>
      <div class="list-row-right">${statusBadge(t.status)}</div>
    </div>`).join('');
}

function renderProjectsProgress(projects, tasks) {
  const el = document.getElementById('projectsProgress');
  if (!projects.length) {
    el.innerHTML = emptyState('📁', 'No projects yet', 'Add a project and break it into manageable tasks.');
    return;
  }
  el.innerHTML = projects.slice(0, 4).map(p => {
    const linked = tasks.filter(t => t.projectId === p.id);
    const completed = linked.filter(t => t.status === 'Completed').length;
    const pct = linked.length ? Math.round((completed / linked.length) * 100) : 0;
    return `
      <div class="list-row">
        <div class="list-row-icon" style="background:${Utils.categoryColor(p.category)}22;color:${Utils.categoryColor(p.category)}">
          <i class="fa-solid fa-diagram-project"></i>
        </div>
        <div style="flex:1;">
          <div class="list-row-title">${Utils.escapeHTML(p.name)}</div>
          <div class="list-row-meta">${completed}/${linked.length} tasks · due ${p.deadline ? Utils.friendlyDate(p.deadline) : '—'}</div>
        </div>
        <div class="list-row-right">
          <div class="mini-progress progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="text-soft" style="font-size:11px;margin-top:4px;">${pct}%</div>
        </div>
      </div>`;
  }).join('');
}

function renderDueSoon(tasks) {
  const el = document.getElementById('dueSoon');
  const today = Utils.todayISO();
  const active = tasks.filter(t => t.status !== 'Completed' && t.dueDate);
  const buckets = active.map(t => ({ t, diff: Utils.dayDiff(today, t.dueDate) }))
    .filter(x => x.diff <= 3)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 6);

  if (!buckets.length) {
    el.innerHTML = emptyState('🎉', "You're all caught up", 'Nothing due in the next few days.');
    return;
  }
  el.innerHTML = buckets.map(({ t, diff }) => {
    let tag;
    if (diff < 0) tag = '🔴 Overdue';
    else if (diff === 0) tag = '🔴 Due Today';
    else if (diff === 1) tag = '🟠 Due Tomorrow';
    else tag = '🟡 Due in 3 Days';
    return `
      <div class="list-row">
        <div style="flex:1;">
          <div class="list-row-title">${Utils.escapeHTML(t.title)}</div>
          <div class="list-row-meta">${tag}</div>
        </div>
      </div>`;
  }).join('');
}

function renderDashNotifications() {
  const el = document.getElementById('dashNotifications');
  const notifications = Storage.getData(STORAGE_KEYS.notifications, []).slice(0, 5);
  if (!notifications.length) {
    el.innerHTML = emptyState('🔔', 'No notifications', "You'll see reminders and due dates here.");
    return;
  }
  el.innerHTML = notifications.map(n => {
    const [bg, fg] = notifColor(n.type);
    return `
    <div class="list-row">
      <div class="list-row-icon" style="background:${bg};color:${fg};">
        <i class="fa-solid ${notifIcon(n.type)}"></i>
      </div>
      <div style="flex:1;">
        <div class="list-row-title" style="font-weight:${n.read ? 500 : 700};">${Utils.escapeHTML(n.message)}</div>
      </div>
      ${!n.read ? '<span class="badge-dot" style="color:var(--color-primary);"></span>' : ''}
    </div>`;
  }).join('');
}

function notifIcon(type) {
  return {
    'due-today': 'fa-circle-exclamation',
    'due-tomorrow': 'fa-clock',
    'overdue': 'fa-triangle-exclamation',
    'reminder': 'fa-bell',
    'completed': 'fa-circle-check',
    'project-milestone': 'fa-flag-checkered'
  }[type] || 'fa-bell';
}

/* Gives each notification type its own colour tile, so the feed
   reads as lively and varied rather than one flat tint. */
function notifColor(type) {
  return {
    'due-today': ['var(--accent-yellow-bg)', 'var(--accent-yellow)'],
    'due-tomorrow': ['var(--accent-blue-bg)', 'var(--accent-blue)'],
    'overdue': ['var(--accent-red-bg)', 'var(--accent-red)'],
    'reminder': ['var(--accent-blue-bg)', 'var(--accent-blue)'],
    'completed': ['var(--accent-green-bg)', 'var(--accent-green)'],
    'project-milestone': ['var(--accent-purple-bg)', 'var(--accent-purple)']
  }[type] || ['var(--color-light)', 'var(--color-primary-dark)'];
}

function priorityBadge(p) {
  const cls = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high' }[p] || 'badge-low';
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${p}</span>`;
}
function statusBadge(s) {
  const cls = { Pending: 'badge-pending', 'In Progress': 'badge-inprogress', Completed: 'badge-completed', Overdue: 'badge-overdue' }[s] || 'badge-pending';
  return `<span class="badge ${cls}">${s}</span>`;
}
function emptyState(emoji, title, text) {
  return `<div class="empty-state"><div class="emoji">${emoji}</div><h4>${title}</h4><p>${text}</p></div>`;
}

function populateCategorySelect(selectEl) {
  const cats = Storage.getData(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
  selectEl.innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

function renderAll() {
  const tasks = Storage.getData(STORAGE_KEYS.tasks, []);
  const schedule = Storage.getData(STORAGE_KEYS.schedule, []);
  const projects = Storage.getData(STORAGE_KEYS.projects, []);

  renderHeader();
  renderProgress(tasks);
  renderOverviewCards(tasks);
  renderTodaysSchedule(schedule);
  renderRecentTasks(tasks);
  renderProjectsProgress(projects, tasks);
  renderDueSoon(tasks);
  renderDashNotifications();
}

document.addEventListener('DOMContentLoaded', () => {
  renderAll();

  const qaModal = document.getElementById('quickAddModal');
  document.getElementById('quickAddBtn').addEventListener('click', () => {
    populateCategorySelect(document.getElementById('qaCategory'));
    document.getElementById('qaDueDate').value = Utils.todayISO();
    Utils.openModal('quickAddModal');
  });

  document.getElementById('quickAddForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('qaTitle').value.trim();
    if (!title) return;
    Storage.addItem(STORAGE_KEYS.tasks, {
      id: Utils.uid(),
      title,
      description: '',
      category: document.getElementById('qaCategory').value,
      priority: document.getElementById('qaPriority').value,
      dueDate: document.getElementById('qaDueDate').value,
      status: 'Pending',
      projectId: null,
      createdAt: Date.now()
    });
    Utils.closeModal('quickAddModal');
    document.getElementById('quickAddForm').reset();
    Utils.toast('Task added to your list.', 'success');
    generateAutoNotifications();
    renderAll();
  });
});
