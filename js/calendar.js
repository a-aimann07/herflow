/* =========================================================
   HerFlow — calendar.js
   A functional monthly calendar built with vanilla JS Date
   objects: month navigation, today highlight, task dots per
   date, click-to-view, and add-task-from-date.
   ========================================================= */

let calViewDate = new Date();          // month currently displayed
let calSelectedDate = Utils.todayISO(); // currently selected day (YYYY-MM-DD)

function tasksForDate(iso) {
  const tasks = Storage.getData(STORAGE_KEYS.tasks, []);
  return tasks.filter(t => t.dueDate === iso);
}

function renderCalendarGrid() {
  const year = calViewDate.getFullYear();
  const month = calViewDate.getMonth();

  document.getElementById('calMonthLabel').textContent =
    calViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = Utils.todayISO();

  const grid = document.getElementById('calGrid');
  let cells = '';

  for (let i = 0; i < startWeekday; i++) {
    cells += `<div class="calendar-cell empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const iso = Utils.toISODate(dateObj);
    const dayTasks = tasksForDate(iso);
    const isToday = iso === todayISO;
    const isSelected = iso === calSelectedDate;

    const dots = dayTasks.slice(0, 3).map(t =>
      `<span class="cell-dot" style="background:${Utils.categoryColor(t.category)}"></span>`
    ).join('');
    const more = dayTasks.length > 3 ? `<span class="cell-more">+${dayTasks.length - 3}</span>` : '';

    cells += `
      <div class="calendar-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" data-date="${iso}">
        <span class="cell-date">${day}</span>
        <div class="cell-dots">${dots}${more}</div>
      </div>`;
  }

  grid.innerHTML = cells;
}

function renderSelectedDayPanel() {
  const label = document.getElementById('calSelectedDateLabel');
  label.textContent = Utils.friendlyDate(calSelectedDate) === Utils.friendlyDate(Utils.todayISO())
    ? `Today · ${Utils.parseISODate(calSelectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : Utils.parseISODate(calSelectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const list = document.getElementById('calSelectedTasks');
  const tasks = tasksForDate(calSelectedDate);

  if (!tasks.length) {
    list.innerHTML = `<div class="empty-state"><div class="emoji">📭</div><h4>Nothing due</h4><p>No tasks are due on this date yet.</p></div>`;
    return;
  }

  list.innerHTML = tasks.map(t => `
    <div class="cal-task-row">
      <span class="dot" style="background:${Utils.categoryColor(t.category)}"></span>
      <span class="title" style="${t.status === 'Completed' ? 'text-decoration:line-through;color:var(--color-text-soft);' : ''}">${Utils.escapeHTML(t.title)}</span>
      <span class="badge ${t.status === 'Completed' ? 'badge-completed' : 'badge-pending'}">${t.status}</span>
    </div>`).join('');
}

function renderCalendar() {
  renderCalendarGrid();
  renderSelectedDayPanel();
}

function populateCalCategorySelect() {
  const cats = Storage.getData(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
  document.getElementById('calTaskCategory').innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();

  document.getElementById('calPrev').addEventListener('click', () => {
    calViewDate.setMonth(calViewDate.getMonth() - 1);
    renderCalendarGrid();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calViewDate.setMonth(calViewDate.getMonth() + 1);
    renderCalendarGrid();
  });

  document.getElementById('calGrid').addEventListener('click', (e) => {
    const cell = e.target.closest('.calendar-cell[data-date]');
    if (!cell) return;
    calSelectedDate = cell.dataset.date;
    renderCalendar();
  });

  document.getElementById('calAddBtn').addEventListener('click', () => {
    populateCalCategorySelect();
    document.getElementById('calTaskDate').value = calSelectedDate;
    Utils.openModal('calTaskModal');
  });

  document.getElementById('calTaskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('calTaskTitle').value.trim();
    if (!title) return;
    Storage.addItem(STORAGE_KEYS.tasks, {
      id: Utils.uid(),
      title,
      description: '',
      category: document.getElementById('calTaskCategory').value,
      priority: document.getElementById('calTaskPriority').value,
      dueDate: document.getElementById('calTaskDate').value,
      status: 'Pending',
      projectId: null,
      createdAt: Date.now()
    });
    calSelectedDate = document.getElementById('calTaskDate').value;
    Utils.closeModal('calTaskModal');
    document.getElementById('calTaskForm').reset();
    Utils.toast('Task added.', 'success');
    generateAutoNotifications();
    renderCalendar();
  });
});
