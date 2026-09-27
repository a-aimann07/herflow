# HerFlow ✦

**Plan. Create. Grow.**

HerFlow is a clean, feminine, professional productivity dashboard for managing your daily schedule, tasks, projects, learning, work, content creation, household responsibilities, and personal routines — all in one calm, focused workspace.

This is **Version 1**: a fully client-side app built with HTML, CSS, vanilla JavaScript, and LocalStorage. No backend, no database, no login — just open it in a browser and start planning.

---

## ✨ Features

- **Dashboard Overview** — a live greeting, today's completion progress, category breakdowns (Learning / Work / Design / Personal), today's schedule, recent tasks, project progress, due-soon items, and recent notifications — all calculated from real data, nothing hardcoded.
- **Schedule** — create, edit, delete and complete time-blocked schedule items with category, priority, status and optional reminders.
- **Calendar** — a fully functional monthly calendar (vanilla JS `Date` objects) with month navigation, a highlighted current day, task indicator dots per date, click-to-view, and add-task-from-date.
- **Tasks** — a dedicated to-do list with status tabs (All / Pending / In Progress / Completed / Overdue), category filtering, search, live counts, and one-click completion.
- **Due Soon** — automatic 🔴🟠🟡 due-date badges calculated from the current date, with overdue detection.
- **Projects** — create projects with a category, timeline and status, track completion percentage from linked tasks, and manage those tasks from a project detail view.
- **Notifications** — an auto-generated notification feed (due today, due tomorrow, overdue, reminders, project milestones) with unread indicators, mark-as-read, mark-all-as-read, and clear.
- **Profile** — editable name, username, occupation and bio, plus a profile photo upload (stored locally via `FileReader`).
- **Settings** — switch between Pink Mode and Blue Mode, toggle reminder/due-date notifications, and clear or reset your data (each destructive action has a confirmation dialog).
- **Two color themes** (Pink & Blue), saved to LocalStorage and applied instantly across every page.
- Fully responsive: sidebar navigation on desktop, a collapsed icon-only sidebar on tablet, and a bottom tab bar on mobile.
- Thoughtful empty states, toast notifications, and smooth CSS transitions throughout.
- Sample data on first launch so the app doesn't feel empty — freely editable or deletable.

---

## 🛠 Tech Stack

- **HTML5** — semantic markup across 8 pages
- **CSS3** — custom properties (design tokens), Flexbox/Grid, responsive breakpoints, transitions
- **Vanilla JavaScript (ES6+)** — no frameworks, no build step
- **LocalStorage** — the entire data layer, wrapped in a reusable `storage.js` module
- **Font Awesome** (via CDN) for icons
- **Plus Jakarta Sans / Inter** (Google Fonts) for typography

No React, no backend, no database, and no authentication in this version — by design (see Roadmap).

---

## 📁 Folder Structure

```
HerFlow/
├── index.html
├── pages/
│   ├── dashboard.html
│   ├── schedule.html
│   ├── calendar.html
│   ├── tasks.html
│   ├── projects.html
│   ├── notifications.html
│   ├── profile.html
│   └── settings.html
├── css/
│   ├── style.css        # global tokens, layout, sidebar, shared components
│   ├── dashboard.css
│   ├── schedule.css
│   ├── calendar.css
│   ├── tasks.css
│   ├── projects.css
│   ├── profile.css
│   └── settings.css
├── js/
│   ├── app.js            # theme, sidebar/topbar/bottom-nav rendering, notifications engine
│   ├── storage.js         # LocalStorage wrapper (get/save/update/delete/clear)
│   ├── utils.js            # dates, ids, toasts, modals, confirm dialogs
│   ├── dashboard.js
│   ├── schedule.js
│   ├── calendar.js
│   ├── tasks.js
│   ├── projects.js
│   ├── notifications.js
│   ├── profile.js
│   └── settings.js
├── assets/
│   ├── images/
│   │   └── default-avatar.png
│   └── icons/
├── README.md
└── .gitignore
```

---

## 🚀 How to Run Locally

HerFlow needs no build step or server-side dependency.

1. Download or clone the repository.
2. Open `index.html` directly in your browser, **or** serve the folder locally for the best experience:
   ```bash
   npx serve .
   # or
   python3 -m http.server 5500
   ```
3. Visit `pages/dashboard.html` (or let `index.html` redirect you there automatically).

### Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repo into [Vercel](https://vercel.com/new).
3. Framework preset: **Other** (static site) — no build command needed.
4. Deploy. Vercel will serve `index.html` at the root automatically.

---

## 💾 How LocalStorage Works

All data lives in the browser's LocalStorage under these keys:

| Key                     | Contents                                  |
|--------------------------|--------------------------------------------|
| `herflow_tasks`           | All to-do tasks                           |
| `herflow_projects`        | All projects                              |
| `herflow_schedule`        | All scheduled/time-blocked items          |
| `herflow_notifications`   | Generated + user notifications            |
| `herflow_profile`         | Name, username, bio, occupation, avatar   |
| `herflow_settings`        | Theme + notification preferences          |
| `herflow_categories`      | Default + custom categories               |

Every read/write goes through `js/storage.js`, which exposes a small, reusable API (`getData`, `saveData`, `addItem`, `updateData`, `deleteData`, `clearData`) so no page duplicates LocalStorage logic. Because everything is stored in the browser, clearing site data or using a different browser/device will reset the app — this is expected for a Version 1 without a backend.

---

## 🗺 Future Improvements / Roadmap

- **Version 1** — HTML / CSS / Vanilla JS + LocalStorage *(this release)*
- **Version 2** — Migrate the UI to React with reusable components
- **Version 3** — Connect to a backend API (Node/Express or similar)
- **Version 4** — Persist data in a real database (PostgreSQL/MongoDB)
- **Version 5** — Add authentication (sign up, log in, multi-user accounts)
- **Version 6** — Cloud storage for profile photos/attachments and push notifications

The current codebase is intentionally modular (separated storage/util/app logic, clear data shapes) to make this migration path straightforward.

---

## 📸 Screenshots

_Add screenshots of the Dashboard, Schedule, Calendar, Tasks, Projects, and Settings pages here once deployed._

## 🔗 Live Demo

_Add your Vercel deployment link here._

## 📦 GitHub Repository

_Add your repository link here._

---

Built with care for anyone juggling learning, work, creativity, and life — all at once.
