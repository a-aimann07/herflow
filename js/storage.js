/* =========================================================
   HerFlow — storage.js
   A single, reusable wrapper around LocalStorage.
   Every other module reads/writes data ONLY through here,
   so LocalStorage logic never gets duplicated across files.
   ========================================================= */

const STORAGE_KEYS = {
  tasks: 'herflow_tasks',
  projects: 'herflow_projects',
  schedule: 'herflow_schedule',
  notifications: 'herflow_notifications',
  profile: 'herflow_profile',
  settings: 'herflow_settings',
  categories: 'herflow_categories',
  seeded: 'herflow_seeded'
};

const Storage = {
  /** Get an entire collection (array) or object for a key. Returns fallback if missing/corrupt. */
  getData(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error(`HerFlow: failed to read "${key}"`, e);
      return fallback;
    }
  },

  /** Overwrite an entire collection/object for a key. */
  saveData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`HerFlow: failed to save "${key}"`, e);
      return false;
    }
  },

  /** Push a new item into an array-collection and persist it. Returns the item. */
  addItem(key, item) {
    const list = this.getData(key, []);
    list.push(item);
    this.saveData(key, list);
    return item;
  },

  /** Merge `patch` into the item with matching id inside an array-collection. */
  updateData(key, id, patch) {
    const list = this.getData(key, []);
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    this.saveData(key, list);
    return list[idx];
  },

  /** Remove the item with matching id from an array-collection. */
  deleteData(key, id) {
    const list = this.getData(key, []);
    const next = list.filter(x => x.id !== id);
    this.saveData(key, next);
    return next;
  },

  /** Empty an array-collection entirely (keeps the key, sets it to []). */
  clearData(key) {
    this.saveData(key, []);
  },

  /** Remove every HerFlow key from LocalStorage (full app reset). */
  resetAll() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  }
};

/* ---------- Default settings & profile ---------- */
const DEFAULT_SETTINGS = {
  theme: 'pink',
  remindersEnabled: true,
  dueDateNotifications: true
};

const DEFAULT_PROFILE = {
  name: 'Aiman',
  username: 'aiman.codes',
  bio: 'Building calm, beautiful tools for productive days.',
  occupation: 'Frontend Developer & Graphic Designer',
  avatar: '../assets/images/default-avatar.png'
};

const DEFAULT_CATEGORIES = [
  { name: 'Development', color: '#8DBFD4' },
  { name: 'Design', color: '#EFA8C4' },
  { name: 'Career', color: '#C9A4E0' },
  { name: 'Content', color: '#E8B25E' },
  { name: 'Personal', color: '#7FBF9E' },
  { name: 'Learning', color: '#6FA8DC' },
  { name: 'Household', color: '#D89B8C' }
];

/* ---------- Sample data (first-launch only) ---------- */
function buildSampleData() {
  const todayISO = Utils.toISODate(new Date());
  const tomorrowISO = Utils.toISODate(Utils.addDays(new Date(), 1));
  const in3Days = Utils.toISODate(Utils.addDays(new Date(), 3));
  const yesterdayISO = Utils.toISODate(Utils.addDays(new Date(), -1));

  const projectId = Utils.uid();

  const sampleProjects = [
    {
      id: projectId,
      name: 'CreatorFlow',
      description: 'A content creation dashboard for planning posts, podcasts and portfolio work.',
      category: 'Development',
      startDate: Utils.toISODate(Utils.addDays(new Date(), -14)),
      deadline: in3Days,
      status: 'In Progress',
      createdAt: Date.now()
    }
  ];

  const sampleTasks = [
    { title: 'React JavaScript Revision', description: 'Go through hooks and state management again.', category: 'Learning', priority: 'Medium', dueDate: todayISO, status: 'In Progress', projectId: null },
    { title: 'Podcast Carousel', description: 'Design the carousel graphics for this week\'s podcast episode.', category: 'Content', priority: 'High', dueDate: todayISO, status: 'Pending', projectId: projectId },
    { title: 'Update LinkedIn', description: 'Refresh headline and add recent project.', category: 'Career', priority: 'Low', dueDate: tomorrowISO, status: 'Pending', projectId: null },
    { title: 'Create Behance Account', description: 'Set up portfolio profile for design work.', category: 'Design', priority: 'Medium', dueDate: in3Days, status: 'Pending', projectId: null },
    { title: 'Update Portfolio', description: 'Add the HerFlow dashboard as a new case study.', category: 'Design', priority: 'High', dueDate: tomorrowISO, status: 'Pending', projectId: projectId },
    { title: 'House Work', description: 'Laundry, groceries and tidy the workspace.', category: 'Household', priority: 'Low', dueDate: todayISO, status: 'Completed', projectId: null },
    { title: 'Navbar component', description: 'Build the responsive navbar for CreatorFlow.', category: 'Development', priority: 'High', dueDate: yesterdayISO, status: 'Completed', projectId: projectId },
    { title: 'API integration', description: 'Connect the dashboard to mock API endpoints.', category: 'Development', priority: 'Medium', dueDate: in3Days, status: 'Pending', projectId: projectId }
  ].map(t => ({
    id: Utils.uid(),
    ...t,
    createdAt: Date.now()
  }));

  const sampleSchedule = [
    { title: 'React Practice', description: 'Hands-on coding session.', category: 'Learning', date: todayISO, startTime: '09:00', endTime: '10:30', priority: 'Medium', status: 'Pending', reminder: true, projectId: null },
    { title: 'Design Review', description: 'Review portfolio layout options.', category: 'Design', date: todayISO, startTime: '14:00', endTime: '15:00', priority: 'High', status: 'Pending', reminder: true, projectId: projectId },
    { title: 'Weekly Planning', description: 'Plan tasks for next week.', category: 'Personal', date: tomorrowISO, startTime: '18:00', endTime: '18:30', priority: 'Low', status: 'Pending', reminder: false, projectId: null }
  ].map(s => ({ id: Utils.uid(), ...s, createdAt: Date.now() }));

  return { sampleProjects, sampleTasks, sampleSchedule };
}

/** Seed LocalStorage with defaults + sample data on first-ever launch. */
function seedIfFirstLaunch() {
  if (Storage.getData(STORAGE_KEYS.seeded, null)) return;

  Storage.saveData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  Storage.saveData(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  Storage.saveData(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);

  const { sampleProjects, sampleTasks, sampleSchedule } = buildSampleData();
  Storage.saveData(STORAGE_KEYS.projects, sampleProjects);
  Storage.saveData(STORAGE_KEYS.tasks, sampleTasks);
  Storage.saveData(STORAGE_KEYS.schedule, sampleSchedule);
  Storage.saveData(STORAGE_KEYS.notifications, []);

  Storage.saveData(STORAGE_KEYS.seeded, true);
}

/** Make sure every key exists (covers users who cleared some keys manually). */
function ensureDefaults() {
  if (Storage.getData(STORAGE_KEYS.settings, null) === null) Storage.saveData(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  if (Storage.getData(STORAGE_KEYS.profile, null) === null) Storage.saveData(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  if (Storage.getData(STORAGE_KEYS.categories, null) === null) Storage.saveData(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
  if (Storage.getData(STORAGE_KEYS.tasks, null) === null) Storage.saveData(STORAGE_KEYS.tasks, []);
  if (Storage.getData(STORAGE_KEYS.projects, null) === null) Storage.saveData(STORAGE_KEYS.projects, []);
  if (Storage.getData(STORAGE_KEYS.schedule, null) === null) Storage.saveData(STORAGE_KEYS.schedule, []);
  if (Storage.getData(STORAGE_KEYS.notifications, null) === null) Storage.saveData(STORAGE_KEYS.notifications, []);
}
