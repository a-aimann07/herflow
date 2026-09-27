/* =========================================================
   HerFlow — schedule.js
   Full CRUD for the Schedule page: add, edit, delete,
   mark complete, and filter by date / status.
   ========================================================= */

let scheduleFilters = { date: '', status: 'All' };

function populateScheduleDropdowns() {
  const cats = Storage.getData(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
  document.getElementById('schCategory').innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

  const projects = Storage.getData(STORAGE_KEYS.projects, []);
  document.getElementById('schProject').innerHTML =
    '<option value="">None</option>' + projects.map(p => `<option value="${p.id}">${Utils.escapeHTML(p.name)}</option>`).join('');
}

function getFilteredSchedule() {
  let list = Storage.getData(STORAGE_KEYS.schedule, []);
  if (scheduleFilters.date) list = list.filter(s => s.date === scheduleFilters.date);
  if (scheduleFilters.status !== 'All') list = list.filter(s => s.status === scheduleFilters.status);
  return list.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
}

function renderSchedule() {
  const el = document.getElementById('scheduleList');
  const items = getFilteredSchedule();

  if (!items.length) {
    el.innerHTML = `<div class="card"><div class="empty-state">
      <div class="emoji">🗓️</div>
      <h4>No schedule items yet ✨</h4>
      <p>Add a schedule item to start planning your day.</p>
      <button class="btn btn-primary" data-trigger="addScheduleBtn">
        <i class="fa-solid fa-plus"></i> Add Schedule Item
      </button>
    </div></div>`;
    return;
  }

  el.innerHTML = items.map(s => {
    const color = Utils.categoryColor(s.category);
    return `
    <div class="schedule-item ${s.status === 'Completed' ? 'is-completed' : ''}" style="border-left-color:${color};" data-id="${s.id}">
      <div class="schedule-time">
        <div class="start">${Utils.formatTime(s.startTime)}</div>
        <div class="end">${Utils.formatTime(s.endTime)}</div>
      </div>
      <div class="schedule-item-body">
        <div class="schedule-item-title">${Utils.escapeHTML(s.title)}</div>
        ${s.description ? `<div class="schedule-item-desc">${Utils.escapeHTML(s.description)}</div>` : ''}
        <div class="schedule-item-tags">
          <span class="badge" style="background:${color}22;color:${color};">${Utils.escapeHTML(s.category)}</span>
          ${priorityBadgeSch(s.priority)}
          ${statusBadgeSch(s.status)}
          <span class="text-soft" style="font-size:12px;">${Utils.friendlyDate(s.date)}</span>
          ${s.reminder ? '<i class="fa-solid fa-bell" style="color:var(--color-primary-dark);font-size:12px;" title="Reminder on"></i>' : ''}
        </div>
      </div>
      <div class="schedule-actions">
        ${s.status !== 'Completed' ? `<button class="btn-icon" data-action="complete" title="Mark complete"><i class="fa-solid fa-check"></i></button>` : ''}
        <button class="btn-icon" data-action="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-icon" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

function priorityBadgeSch(p) {
  const cls = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high' }[p] || 'badge-low';
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${p}</span>`;
}
function statusBadgeSch(s) {
  const cls = { Pending: 'badge-pending', 'In Progress': 'badge-inprogress', Completed: 'badge-completed' }[s] || 'badge-pending';
  return `<span class="badge ${cls}">${s}</span>`;
}

function openScheduleModal(editItem = null) {
  populateScheduleDropdowns();
  const title = document.getElementById('scheduleModalTitle');
  const form = document.getElementById('scheduleForm');
  form.reset();
  document.getElementById('schEditId').value = '';

  if (editItem) {
    title.textContent = 'Edit Schedule Item';
    document.getElementById('schEditId').value = editItem.id;
    document.getElementById('schTitle').value = editItem.title;
    document.getElementById('schDescription').value = editItem.description || '';
    document.getElementById('schCategory').value = editItem.category;
    document.getElementById('schProject').value = editItem.projectId || '';
    document.getElementById('schDate').value = editItem.date;
    document.getElementById('schPriority').value = editItem.priority;
    document.getElementById('schStart').value = editItem.startTime;
    document.getElementById('schEnd').value = editItem.endTime;
    document.getElementById('schStatus').value = editItem.status;
    document.getElementById('schReminder').checked = !!editItem.reminder;
  } else {
    title.textContent = 'Add Schedule Item';
    document.getElementById('schDate').value = scheduleFilters.date || Utils.todayISO();
  }
  Utils.openModal('scheduleModal');
}

function handleScheduleAction(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const row = btn.closest('.schedule-item');
  const id = row.dataset.id;
  const action = btn.dataset.action;
  const list = Storage.getData(STORAGE_KEYS.schedule, []);
  const item = list.find(s => s.id === id);
  if (!item) return;

  if (action === 'complete') {
    Storage.updateData(STORAGE_KEYS.schedule, id, { status: 'Completed' });
    Utils.toast('Marked as completed.', 'success');
    renderSchedule();
  } else if (action === 'edit') {
    openScheduleModal(item);
  } else if (action === 'delete') {
    Utils.confirmDialog({
      title: 'Delete schedule item?',
      message: `"${item.title}" will be permanently removed.`,
      confirmText: 'Delete'
    }).then(ok => {
      if (!ok) return;
      Storage.deleteData(STORAGE_KEYS.schedule, id);
      Utils.toast('Schedule item deleted.', 'success');
      renderSchedule();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderSchedule();

  document.getElementById('addScheduleBtn').addEventListener('click', () => openScheduleModal());
  document.getElementById('scheduleList').addEventListener('click', handleScheduleAction);

  document.getElementById('scheduleDateFilter').addEventListener('change', (e) => {
    scheduleFilters.date = e.target.value;
    renderSchedule();
  });

  document.getElementById('scheduleStatusTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll('#scheduleStatusTabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    scheduleFilters.status = btn.dataset.status;
    renderSchedule();
  });

  document.getElementById('scheduleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const start = document.getElementById('schStart').value;
    const end = document.getElementById('schEnd').value;
    if (end <= start) {
      Utils.toast('End time must be after start time.', 'error');
      return;
    }
    const editId = document.getElementById('schEditId').value;
    const payload = {
      title: document.getElementById('schTitle').value.trim(),
      description: document.getElementById('schDescription').value.trim(),
      category: document.getElementById('schCategory').value,
      projectId: document.getElementById('schProject').value || null,
      date: document.getElementById('schDate').value,
      priority: document.getElementById('schPriority').value,
      startTime: start,
      endTime: end,
      status: document.getElementById('schStatus').value,
      reminder: document.getElementById('schReminder').checked
    };
    if (!payload.title) return;

    if (editId) {
      Storage.updateData(STORAGE_KEYS.schedule, editId, payload);
      Utils.toast('Schedule item updated.', 'success');
    } else {
      Storage.addItem(STORAGE_KEYS.schedule, { id: Utils.uid(), ...payload, createdAt: Date.now() });
      Utils.toast('Schedule item added.', 'success');
    }
    Utils.closeModal('scheduleModal');
    generateAutoNotifications();
    renderSchedule();
  });
});
