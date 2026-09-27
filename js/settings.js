/* =========================================================
   HerFlow — settings.js
   Theme switching, notification toggles, and destructive
   data actions (each guarded by a confirmation dialog).
   ========================================================= */

function renderSettingsUI() {
  const settings = Storage.getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);

  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === settings.theme);
  });
  document.getElementById('toggleReminders').checked = settings.remindersEnabled;
  document.getElementById('toggleDueDates').checked = settings.dueDateNotifications;
}

document.addEventListener('DOMContentLoaded', () => {
  renderSettingsUI();

  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const settings = Storage.getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
      settings.theme = btn.dataset.theme;
      Storage.saveData(STORAGE_KEYS.settings, settings);
      applyTheme();
      renderSettingsUI();
      Utils.toast(`${btn.dataset.theme === 'pink' ? 'Pink' : 'Blue'} Mode applied.`, 'success');
    });
  });

  document.getElementById('toggleReminders').addEventListener('change', (e) => {
    const settings = Storage.getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    settings.remindersEnabled = e.target.checked;
    Storage.saveData(STORAGE_KEYS.settings, settings);
    Utils.toast(e.target.checked ? 'Reminders enabled.' : 'Reminders disabled.', 'info');
  });

  document.getElementById('toggleDueDates').addEventListener('change', (e) => {
    const settings = Storage.getData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    settings.dueDateNotifications = e.target.checked;
    Storage.saveData(STORAGE_KEYS.settings, settings);
    Utils.toast(e.target.checked ? 'Due-date notifications enabled.' : 'Due-date notifications disabled.', 'info');
  });

  document.getElementById('clearTasksBtn').addEventListener('click', () => {
    Utils.confirmDialog({
      title: 'Clear all tasks?',
      message: 'Every task will be permanently deleted. Projects and schedule items are not affected.',
      confirmText: 'Clear Tasks'
    }).then(ok => {
      if (!ok) return;
      Storage.clearData(STORAGE_KEYS.tasks);
      Utils.toast('All tasks cleared.', 'success');
    });
  });

  document.getElementById('clearProjectsBtn').addEventListener('click', () => {
    Utils.confirmDialog({
      title: 'Clear all projects?',
      message: 'Every project will be permanently deleted. Linked tasks will remain but become unassigned.',
      confirmText: 'Clear Projects'
    }).then(ok => {
      if (!ok) return;
      const tasks = Storage.getData(STORAGE_KEYS.tasks, []).map(t => ({ ...t, projectId: null }));
      Storage.saveData(STORAGE_KEYS.tasks, tasks);
      Storage.clearData(STORAGE_KEYS.projects);
      Utils.toast('All projects cleared.', 'success');
    });
  });

  document.getElementById('resetAppBtn').addEventListener('click', () => {
    Utils.confirmDialog({
      title: 'Reset HerFlow?',
      message: 'This deletes ALL data — tasks, projects, schedule, notifications and your profile — and restores the app to its first-launch state.',
      confirmText: 'Reset Everything'
    }).then(ok => {
      if (!ok) return;
      Storage.resetAll();
      Utils.toast('HerFlow has been reset.', 'success');
      setTimeout(() => window.location.reload(), 700);
    });
  });
});
