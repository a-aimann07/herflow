/* =========================================================
   HerFlow — profile.js
   Displays and edits the user profile. The avatar image is
   read via FileReader and persisted as a base64 data URL in
   LocalStorage (no backend in this version).
   ========================================================= */

function renderProfileView() {
  const p = Storage.getData(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  document.getElementById('profileAvatarPreview').src = p.avatar || DEFAULT_PROFILE.avatar;
  document.getElementById('profileDisplayName').textContent = p.name;
  document.getElementById('profileDisplayUsername').textContent = '@' + p.username;
  document.getElementById('profileDisplayOccupation').textContent = p.occupation;
  document.getElementById('profileDisplayBio').textContent = p.bio || '';

  document.getElementById('pfName').value = p.name;
  document.getElementById('pfUsername').value = p.username;
  document.getElementById('pfOccupation').value = p.occupation;
  document.getElementById('pfBio').value = p.bio || '';
}

function renderProfileStats() {
  const tasks = Storage.getData(STORAGE_KEYS.tasks, []);
  const projects = Storage.getData(STORAGE_KEYS.projects, []);
  document.getElementById('statTasks').textContent = tasks.length;
  document.getElementById('statProjects').textContent = projects.length;
  document.getElementById('statCompleted').textContent = tasks.filter(t => t.status === 'Completed').length;
}

document.addEventListener('DOMContentLoaded', () => {
  renderProfileView();
  renderProfileStats();

  document.getElementById('avatarUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Utils.toast('Please choose an image file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const p = Storage.getData(STORAGE_KEYS.profile, DEFAULT_PROFILE);
      p.avatar = reader.result;
      Storage.saveData(STORAGE_KEYS.profile, p);
      document.getElementById('profileAvatarPreview').src = reader.result;
      renderSidebar();
      Utils.toast('Profile photo updated.', 'success');
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const p = Storage.getData(STORAGE_KEYS.profile, DEFAULT_PROFILE);
    const updated = {
      ...p,
      name: document.getElementById('pfName').value.trim() || p.name,
      username: document.getElementById('pfUsername').value.trim() || p.username,
      occupation: document.getElementById('pfOccupation').value.trim(),
      bio: document.getElementById('pfBio').value.trim()
    };
    Storage.saveData(STORAGE_KEYS.profile, updated);
    renderProfileView();
    renderSidebar();
    Utils.toast('Profile saved.', 'success');
  });
});
