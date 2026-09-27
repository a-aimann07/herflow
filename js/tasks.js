/* =========================================================
   HerFlow — tasks.js
   Full task management: add / edit / delete / complete,
   tab + category filters, search, and live tab counters.
   ========================================================= */

let taskFilters = { status: 'All', category: 'All', search: '' };

/** A task is "Overdue" for display purposes if its due date has passed and it isn't completed. */
function effectiveStatus(t) {
  if (t.status === 'Completed') return 'Completed';
  if (t.dueDate && Utils.dayDiff(Utils.todayISO(), t.dueDate) < 0) return 'Overdue';
  return t.status;
}

function populateTaskDropdowns() {
  const cats = Storage.getData(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
  document.getElementById('tskCategory').innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

  const filterSel = document.getElementById('taskCategoryFilter');
  filterSel.innerHTML = '<option value="All">All Categories</option>' + cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

  const projects = Storage.getData(STORAGE_KEYS.projects, []);
  document.getElementById('tskProject').innerHTML =
    '<option value="">None</option>' + projects.map(p => `<option value="${p.id}">${Utils.escapeHTML(p.name)}</option>`).join('');
}

function updateTabCounts(tasks) {
  const withStatus = tasks.map(effectiveStatus);
  document.getElementById('countAll').textContent = tasks.length;
  document.getElementById('countPending').textContent = withStatus.filter(s => s === 'Pending').length;
  document.getElementById('countInProgress').textContent = withStatus.filter(s => s === 'In Progress').length;
  document.getElementById('countCompleted').textContent = withStatus.filter(s => s === 'Completed').length;
  document.getElementById('countOverdue').textContent = withStatus.filter(s => s === 'Overdue').length;
}

function getFilteredTasks(all) {
  let list = all;
  if (taskFilters.status !== 'All') list = list.filter(t => effectiveStatus(t) === taskFilters.status);
  if (taskFilters.category !== 'All') list = list.filter(t => t.category === taskFilters.category);
  if (taskFilters.search.trim()) {
    const q = taskFilters.search.trim().toLowerCase();
    list = list.filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
  }
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

function renderTasks() {
  const all = Storage.getData(STORAGE_KEYS.tasks, []);
  updateTabCounts(all);
  const items = getFilteredTasks(all);
  const el = document.getElementById('taskList');

  if (!all.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="emoji">✨</div>
      <h4>No tasks yet ✨</h4>
      <p>Create your first task to start planning your day.</p>
      <button class="btn btn-primary" data-trigger="addTaskBtn"><i class="fa-solid fa-plus"></i> Add Task</button>
    </div>`;
    return;
  }
  if (!items.length) {
    el.innerHTML = `<div class="empty-state"><div class="emoji">🔍</div><h4>No matching tasks</h4><p>Try a different filter or search term.</p></div>`;
    return;
  }

  el.innerHTML = items.map(t => {
    const status = effectiveStatus(t);
    const color = Utils.categoryColor(t.category);
    return `
    <div class="task-row ${status === 'Completed' ? 'is-completed' : ''}" data-id="${t.id}">
      <input type="checkbox" class="task-checkbox" ${status === 'Completed' ? 'checked' : ''} aria-label="Mark ${Utils.escapeHTML(t.title)} complete">
      <div class="task-body">
        <div class="task-title">${Utils.escapeHTML(t.title)}</div>
        ${t.description ? `<div class="task-desc">${Utils.escapeHTML(t.description)}</div>` : ''}
        <div class="task-tags">
          <span class="badge" style="background:${color}22;color:${color};">${Utils.escapeHTML(t.category)}</span>
          ${priorityBadgeT(t.priority)}
          ${statusBadgeT(status)}
          ${t.dueDate ? `<span class="text-soft" style="font-size:12px;"><i class="fa-regular fa-calendar"></i> ${Utils.friendlyDate(t.dueDate)}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-icon" data-action="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-icon" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

function priorityBadgeT(p) {
  const cls = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high' }[p] || 'badge-low';
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${p}</span>`;
}
function statusBadgeT(s) {
  const cls = { Pending: 'badge-pending', 'In Progress': 'badge-inprogress', Completed: 'badge-completed', Overdue: 'badge-overdue' }[s] || 'badge-pending';
  return `<span class="badge ${cls}">${s}</span>`;
}

function openTaskModal(editItem = null) {
  populateTaskDropdowns();
  const title = document.getElementById('taskModalTitle');
  document.getElementById('taskForm').reset();
  document.getElementById('tskEditId').value = '';

  if (editItem) {
    title.textContent = 'Edit Task';
    document.getElementById('tskEditId').value = editItem.id;
    document.getElementById('tskTitle').value = editItem.title;
    document.getElementById('tskDescription').value = editItem.description || '';
    document.getElementById('tskCategory').value = editItem.category;
    document.getElementById('tskPriority').value = editItem.priority;
    document.getElementById('tskDueDate').value = editItem.dueDate || '';
    document.getElementById('tskStatus').value = editItem.status;
    document.getElementById('tskProject').value = editItem.projectId || '';
  } else {
    title.textContent = 'Add Task';
  }
  Utils.openModal('taskModal');
}

function handleTaskListClick(e) {
  const row = e.target.closest('.task-row');
  if (!row) return;
  const id = row.dataset.id;
  const list = Storage.getData(STORAGE_KEYS.tasks, []);
  const item = list.find(t => t.id === id);
  if (!item) return;

  if (e.target.matches('.task-checkbox')) {
    const newStatus = e.target.checked ? 'Completed' : 'Pending';
    Storage.updateData(STORAGE_KEYS.tasks, id, { status: newStatus });
    row.classList.toggle('is-completed', e.target.checked);
    Utils.toast(e.target.checked ? 'Task completed! 🎉' : 'Task reopened.', 'success');
    setTimeout(renderTasks, e.target.checked ? 380 : 0);
    return;
  }

  const actionBtn = e.target.closest('button[data-action]');
  if (!actionBtn) return;

  if (actionBtn.dataset.action === 'edit') {
    openTaskModal(item);
  } else if (actionBtn.dataset.action === 'delete') {
    Utils.confirmDialog({
      title: 'Delete task?',
      message: `"${item.title}" will be permanently removed.`,
      confirmText: 'Delete'
    }).then(ok => {
      if (!ok) return;
      Storage.deleteData(STORAGE_KEYS.tasks, id);
      Utils.toast('Task deleted.', 'success');
      renderTasks();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderTasks();

  document.getElementById('addTaskBtn').addEventListener('click', () => openTaskModal());
  document.getElementById('taskList').addEventListener('click', handleTaskListClick);

  document.getElementById('taskStatusTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll('#taskStatusTabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    taskFilters.status = btn.dataset.status;
    renderTasks();
  });

  document.getElementById('taskCategoryFilter').addEventListener('change', (e) => {
    taskFilters.category = e.target.value;
    renderTasks();
  });

  document.getElementById('taskSearch').addEventListener('input', (e) => {
    taskFilters.search = e.target.value;
    renderTasks();
  });

  document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('tskEditId').value;
    const payload = {
      title: document.getElementById('tskTitle').value.trim(),
      description: document.getElementById('tskDescription').value.trim(),
      category: document.getElementById('tskCategory').value,
      priority: document.getElementById('tskPriority').value,
      dueDate: document.getElementById('tskDueDate').value || null,
      status: document.getElementById('tskStatus').value,
      projectId: document.getElementById('tskProject').value || null
    };
    if (!payload.title) return;

    if (editId) {
      Storage.updateData(STORAGE_KEYS.tasks, editId, payload);
      Utils.toast('Task updated.', 'success');
    } else {
      Storage.addItem(STORAGE_KEYS.tasks, { id: Utils.uid(), ...payload, createdAt: Date.now() });
      Utils.toast('Task added.', 'success');
    }
    Utils.closeModal('taskModal');
    generateAutoNotifications();
    renderTasks();
  });
});
