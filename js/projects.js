/* =========================================================
   HerFlow — projects.js
   Project CRUD, status filtering, and a detail view that
   lists + manages the tasks linked to each project.
   ========================================================= */

let projectFilter = 'All';
let activeDetailProjectId = null;

function populateProjectDropdowns() {
  const cats = Storage.getData(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
  document.getElementById('prjCategory').innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  document.getElementById('ptCategory').innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

function projectStats(projectId, tasks) {
  const linked = tasks.filter(t => t.projectId === projectId);
  const completed = linked.filter(t => t.status === 'Completed').length;
  const pending = linked.length - completed;
  const pct = linked.length ? Math.round((completed / linked.length) * 100) : 0;
  return { linked, completed, pending, pct };
}

function statusBadgeP(s) {
  const cls = { Planning: 'badge-planning', 'In Progress': 'badge-inprogress', Completed: 'badge-completed', 'On Hold': 'badge-onhold' }[s] || 'badge-pending';
  return `<span class="badge ${cls}">${s}</span>`;
}

function renderProjects() {
  const projects = Storage.getData(STORAGE_KEYS.projects, []);
  const tasks = Storage.getData(STORAGE_KEYS.tasks, []);
  const grid = document.getElementById('projectsGrid');

  const list = projectFilter === 'All' ? projects : projects.filter(p => p.status === projectFilter);

  if (!projects.length) {
    grid.innerHTML = `<div class="card" style="grid-column:1/-1;"><div class="empty-state">
      <div class="emoji">📁</div><h4>No projects yet.</h4>
      <p>Add a project and break it into manageable tasks.</p>
      <button class="btn btn-primary" data-trigger="addProjectBtn"><i class="fa-solid fa-plus"></i> New Project</button>
    </div></div>`;
    return;
  }
  if (!list.length) {
    grid.innerHTML = `<div class="card" style="grid-column:1/-1;"><div class="empty-state"><div class="emoji">🔍</div><h4>No projects here</h4><p>Try a different status filter.</p></div></div>`;
    return;
  }

  grid.innerHTML = list.map(p => {
    const { linked, completed, pending, pct } = projectStats(p.id, tasks);
    const color = Utils.categoryColor(p.category);
    return `
    <div class="project-card" data-id="${p.id}">
      <div class="project-card-top">
        <div>
          <h3>${Utils.escapeHTML(p.name)}</h3>
          <span class="badge" style="background:${color}22;color:${color};margin-top:6px;display:inline-block;">${Utils.escapeHTML(p.category)}</span>
        </div>
        ${statusBadgeP(p.status)}
      </div>
      ${p.description ? `<p class="project-desc">${Utils.escapeHTML(p.description)}</p>` : ''}
      <div class="project-progress-row">
        <div class="progress-track" style="flex:1;"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span>${pct}%</span>
      </div>
      <div class="project-meta-row">
        <span>${completed}/${linked.length} tasks done</span>
        <span>Due ${p.deadline ? Utils.friendlyDate(p.deadline) : '—'}</span>
      </div>
    </div>`;
  }).join('');
}

function openProjectModal(editItem = null) {
  populateProjectDropdowns();
  document.getElementById('projectForm').reset();
  document.getElementById('prjEditId').value = '';
  const title = document.getElementById('projectModalTitle');

  if (editItem) {
    title.textContent = 'Edit Project';
    document.getElementById('prjEditId').value = editItem.id;
    document.getElementById('prjName').value = editItem.name;
    document.getElementById('prjDescription').value = editItem.description || '';
    document.getElementById('prjCategory').value = editItem.category;
    document.getElementById('prjStatus').value = editItem.status;
    document.getElementById('prjStartDate').value = editItem.startDate || '';
    document.getElementById('prjDeadline').value = editItem.deadline || '';
  } else {
    title.textContent = 'New Project';
  }
  Utils.openModal('projectModal');
}

function renderProjectDetail(projectId) {
  const projects = Storage.getData(STORAGE_KEYS.projects, []);
  const tasks = Storage.getData(STORAGE_KEYS.tasks, []);
  const p = projects.find(x => x.id === projectId);
  if (!p) return;

  document.getElementById('detailProjectName').textContent = p.name;
  const color = Utils.categoryColor(p.category);
  document.getElementById('detailProjectMeta').innerHTML = `
    <span class="badge" style="background:${color}22;color:${color};">${Utils.escapeHTML(p.category)}</span>
    ${statusBadgeP(p.status)}
    <span class="text-soft" style="font-size:12.5px;">Start ${p.startDate ? Utils.friendlyDate(p.startDate) : '—'}</span>
    <span class="text-soft" style="font-size:12.5px;">Deadline ${p.deadline ? Utils.friendlyDate(p.deadline) : '—'}</span>
  `;

  const { linked, pct } = projectStats(projectId, tasks);
  document.getElementById('detailProgressFill').style.width = `${pct}%`;
  document.getElementById('detailProgressPct').textContent = `${pct}%`;

  const listEl = document.getElementById('detailTaskList');
  if (!linked.length) {
    listEl.innerHTML = `<div class="empty-state" style="padding:24px;"><div class="emoji">📝</div><p>No tasks linked yet. Add one below.</p></div>`;
  } else {
    listEl.innerHTML = linked.map(t => `
      <div class="detail-task-row ${t.status === 'Completed' ? 'is-completed' : ''}" data-id="${t.id}">
        <input type="checkbox" ${t.status === 'Completed' ? 'checked' : ''} class="detail-task-check" aria-label="Toggle ${Utils.escapeHTML(t.title)}">
        <span class="title">${t.status === 'Completed' ? '✓' : '○'} ${Utils.escapeHTML(t.title)}</span>
        <button class="btn-icon" data-remove-task title="Remove from project"><i class="fa-solid fa-xmark"></i></button>
      </div>`).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderProjects();

  document.getElementById('addProjectBtn').addEventListener('click', () => openProjectModal());

  document.getElementById('projectStatusTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll('#projectStatusTabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    projectFilter = btn.dataset.status;
    renderProjects();
  });

  document.getElementById('projectsGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.project-card');
    if (!card) return;
    activeDetailProjectId = card.dataset.id;
    renderProjectDetail(activeDetailProjectId);
    Utils.openModal('projectDetailModal');
  });

  document.getElementById('projectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('prjEditId').value;
    const payload = {
      name: document.getElementById('prjName').value.trim(),
      description: document.getElementById('prjDescription').value.trim(),
      category: document.getElementById('prjCategory').value,
      status: document.getElementById('prjStatus').value,
      startDate: document.getElementById('prjStartDate').value || null,
      deadline: document.getElementById('prjDeadline').value || null
    };
    if (!payload.name) return;

    if (editId) {
      Storage.updateData(STORAGE_KEYS.projects, editId, payload);
      Utils.toast('Project updated.', 'success');
      if (activeDetailProjectId === editId) renderProjectDetail(editId);
    } else {
      Storage.addItem(STORAGE_KEYS.projects, { id: Utils.uid(), ...payload, createdAt: Date.now() });
      Utils.toast('Project created.', 'success');
    }
    Utils.closeModal('projectModal');
    generateAutoNotifications();
    renderProjects();
  });

  /* ----- Detail modal actions ----- */
  document.getElementById('detailTaskList').addEventListener('click', (e) => {
    const row = e.target.closest('.detail-task-row');
    if (!row) return;
    const id = row.dataset.id;

    if (e.target.matches('.detail-task-check')) {
      Storage.updateData(STORAGE_KEYS.tasks, id, { status: e.target.checked ? 'Completed' : 'Pending' });
      renderProjectDetail(activeDetailProjectId);
      renderProjects();
    } else if (e.target.closest('[data-remove-task]')) {
      Storage.updateData(STORAGE_KEYS.tasks, id, { projectId: null });
      Utils.toast('Task removed from project.', 'info');
      renderProjectDetail(activeDetailProjectId);
      renderProjects();
    }
  });

  document.getElementById('detailAddTaskBtn').addEventListener('click', () => {
    populateProjectDropdowns();
    document.getElementById('projectTaskForm').reset();
    document.getElementById('ptProjectId').value = activeDetailProjectId;
    Utils.openModal('projectTaskModal');
  });

  document.getElementById('projectTaskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('ptTitle').value.trim();
    if (!title) return;
    Storage.addItem(STORAGE_KEYS.tasks, {
      id: Utils.uid(),
      title,
      description: '',
      category: document.getElementById('ptCategory').value,
      priority: document.getElementById('ptPriority').value,
      dueDate: document.getElementById('ptDueDate').value || null,
      status: 'Pending',
      projectId: document.getElementById('ptProjectId').value,
      createdAt: Date.now()
    });
    Utils.closeModal('projectTaskModal');
    Utils.toast('Task added to project.', 'success');
    generateAutoNotifications();
    renderProjectDetail(activeDetailProjectId);
    renderProjects();
  });

  document.getElementById('detailEditProjectBtn').addEventListener('click', () => {
    const projects = Storage.getData(STORAGE_KEYS.projects, []);
    const p = projects.find(x => x.id === activeDetailProjectId);
    Utils.closeModal('projectDetailModal');
    openProjectModal(p);
  });

  document.getElementById('detailDeleteProjectBtn').addEventListener('click', () => {
    const projects = Storage.getData(STORAGE_KEYS.projects, []);
    const p = projects.find(x => x.id === activeDetailProjectId);
    Utils.confirmDialog({
      title: 'Delete project?',
      message: `"${p.name}" will be deleted. Linked tasks will stay in your task list but become unassigned.`,
      confirmText: 'Delete'
    }).then(ok => {
      if (!ok) return;
      const tasks = Storage.getData(STORAGE_KEYS.tasks, []);
      tasks.filter(t => t.projectId === activeDetailProjectId).forEach(t => {
        Storage.updateData(STORAGE_KEYS.tasks, t.id, { projectId: null });
      });
      Storage.deleteData(STORAGE_KEYS.projects, activeDetailProjectId);
      Utils.closeModal('projectDetailModal');
      Utils.toast('Project deleted.', 'success');
      renderProjects();
    });
  });
});
