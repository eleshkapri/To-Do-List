/**
 * SUMMIT TASKS — to-top.ch inspired design system
 * Mountain / journey metaphor task management
 */

document.addEventListener("DOMContentLoaded", () => {

  // ═══════════════════════════════════════════════
  // STORAGE & STATE
  // ═══════════════════════════════════════════════

  const KEYS = {
    TASKS:    "summit_tasks",
    PROJECTS: "summit_projects",
    NOTES:    "summit_notes",
    THEME:    "summit_theme"
  };

  const defaultProjects = [
    { id: "proj-1", name: "Work",     color: "#0D352E" },
    { id: "proj-2", name: "Personal", color: "#2A6055" },
    { id: "proj-3", name: "Health",   color: "#EFB300" },
    { id: "proj-4", name: "Learning", color: "#457b9d" }
  ];

  const today = getTodayStr();

  const defaultTasks = [
    {
      id: "t1", title: "Plan the weekly route & set milestones",
      description: "Review all open tasks and assign priorities for this week.",
      project: "proj-1", priority: "p1", dueDate: today,
      tag: "work", starred: true, completed: false, createdAt: new Date().toISOString()
    },
    {
      id: "t2", title: "Morning hike — 30 minutes brisk walk",
      description: "Start the day with movement. Trail near the park.",
      project: "proj-3", priority: "p2", dueDate: today,
      tag: "urgent", starred: false, completed: false, createdAt: new Date().toISOString()
    },
    {
      id: "t3", title: "Read 20 pages of current book",
      description: "Continue with chapter 7.",
      project: "proj-4", priority: "p3", dueDate: getOffsetDate(1),
      tag: "general", starred: false, completed: false, createdAt: new Date().toISOString()
    },
    {
      id: "t4", title: "Weekly team check-in",
      description: "Review project status and unblock teammates.",
      project: "proj-1", priority: "p2", dueDate: getOffsetDate(1),
      tag: "work", starred: true, completed: false, createdAt: new Date().toISOString()
    },
    {
      id: "t5", title: "Grocery shopping for the week",
      description: "Focus on fresh produce and meal prep ingredients.",
      project: "proj-2", priority: "p4", dueDate: today,
      tag: "general", starred: false, completed: true, createdAt: new Date().toISOString()
    }
  ];

  const defaultNotes = [
    { id: "n1", content: "The trail to the summit is not always straight — trust the detours.", date: "Trail wisdom" },
    { id: "n2", content: "Ideas for Q4 strategy: focus on depth over breadth, fewer but better.", date: "Strategy note" },
    { id: "n3", content: "Resources: look into time-blocking method for deep work sessions.", date: "Learning" }
  ];

  let tasks    = JSON.parse(localStorage.getItem(KEYS.TASKS))    || defaultTasks;
  let projects = JSON.parse(localStorage.getItem(KEYS.PROJECTS)) || defaultProjects;
  let notes    = JSON.parse(localStorage.getItem(KEYS.NOTES))    || defaultNotes;
  let isDark   = localStorage.getItem(KEYS.THEME) === "dark";

  let currentView           = "today";
  let priorityFilter        = "all";
  let sortBy                = "dueDate-asc";
  let searchQuery           = "";
  let completedOpen         = false;
  let lastDeletedTask       = null;

  // ═══════════════════════════════════════════════
  // DOM REFS
  // ═══════════════════════════════════════════════

  const $  = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // Layout
  const navbar           = document.querySelector(".navbar");
  const sidebar          = $("sidebar");
  const sidebarBackdrop  = $("sidebar-backdrop");
  const scrollToTop      = $("scroll-to-top");

  // Nav & sidebar nav
  const navLinks         = $$(".nav-link");
  const sidebarNavBtns   = $$(".sidebar-nav-btn");
  const mobilMenuBtn     = $("mobile-menu-btn");
  const sidebarCloseBtn  = $("sidebar-close-btn");
  const themeToggle      = $("theme-toggle");

  // Search
  const globalSearch     = $("global-search");
  const sidebarSearch    = $("sidebar-search");

  // Hero
  const heroDate         = $("hero-date");
  const heroHeading      = $("hero-heading");
  const heroQuote        = $("hero-quote");
  const heroStatActive   = $("hero-stat-active");
  const heroStatDone     = $("hero-stat-done");
  const heroStatPct      = $("hero-stat-pct");
  const ringFill         = $("ring-fill");
  const ringPercent      = $("ring-percent");
  const heroCta          = $("hero-cta-btn");

  // Sidebar progress
  const sidebarProgressBar = $("sidebar-progress-bar");
  const sidebarProgressPct = $("sidebar-progress-pct");
  const sidebarProgressSub = $("sidebar-progress-sub");

  // Counts
  const countToday     = $("count-today");
  const countUpcoming  = $("count-upcoming");
  const countStarred   = $("count-starred");
  const countInbox     = $("count-inbox");
  const countCompleted = $("count-completed");
  const countNotes     = $("count-notes");

  // Sectors
  const focusCardsGrid    = $("focus-cards-grid");
  const btnAddProjectMain = $("btn-add-project-main");
  const btnAddProjectSide = $("btn-add-project");
  const sidebarProjects   = $("sidebar-projects");

  // Panes
  const paneTasksView = $("pane-tasks-view");
  const paneNotesView = $("pane-notes-view");

  // View header
  const viewTitle     = $("view-title");
  const viewTaskBadge = $("view-task-badge");

  // Filters
  const priorityFilterEl    = $("priority-filter");
  const sortFilterEl        = $("sort-filter");
  const priorityFilterTopEl = $("priority-filter-top");
  const sortFilterTopEl     = $("sort-filter-top");

  // Task creator
  const taskInputTitle    = $("task-input-title");
  const taskInputDesc     = $("task-input-desc");
  const taskInputDate     = $("task-input-date");
  const taskInputPriority = $("task-input-priority");
  const taskInputProject  = $("task-input-project");
  const taskInputTag      = $("task-input-tag");
  const submitInlineAdd   = $("submit-inline-add");
  const cancelInlineAdd   = $("cancel-inline-add");

  // Task lists
  const activeTasksList    = $("active-tasks-list");
  const completedTasksList = $("completed-tasks-list");
  const completedSection   = $("completed-section");
  const completedToggle    = $("completed-toggle-btn");
  const completedArrow     = $("completed-toggle-arrow");
  const completedCount     = $("completed-accordion-count");
  const emptyState         = $("empty-state");
  const emptyStateMsg      = $("empty-state-msg");

  // Notes
  const notesGrid   = $("notes-grid");
  const notesBadge  = $("notes-badge");
  const btnAddNote  = $("btn-add-note");

  // Modals
  const editModal         = $("edit-modal");
  const editTaskForm      = $("edit-task-form");
  const editTaskId        = $("edit-task-id");
  const editTitle         = $("edit-title");
  const editDesc          = $("edit-desc");
  const editProject       = $("edit-project");
  const editPriority      = $("edit-priority");
  const editDate          = $("edit-date");
  const editTag           = $("edit-tag");
  const editModalClose    = $("edit-modal-close");
  const editModalCancel   = $("edit-modal-cancel");

  const projectModal       = $("project-modal");
  const projectForm        = $("project-form");
  const projectName        = $("project-name");
  const projectModalClose  = $("project-modal-close");
  const projectModalCancel = $("project-modal-cancel");

  const toastBox = $("toast-box");

  // ═══════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════

  function init() {
    applyTheme(isDark);
    taskInputDate.value = today;
    populateProjectDropdowns();
    bindEvents();
    refresh();
  }

  function refresh() {
    updateHero();
    renderSectors();
    renderSidebarProjects();
    updateCounts();
    renderViewTitle();
    renderTasks();
    renderNotes();
  }

  // ═══════════════════════════════════════════════
  // THEME
  // ═══════════════════════════════════════════════

  function applyTheme(dark) {
    isDark = dark;
    document.body.classList.toggle("forest-mode", isDark);
    localStorage.setItem(KEYS.THEME, isDark ? "dark" : "light");
    const icon = themeToggle.querySelector("i");
    if (icon) icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-circle-half-stroke";
  }

  // ═══════════════════════════════════════════════
  // HERO BANNER
  // ═══════════════════════════════════════════════

  const quotes = [
    "Every great journey begins with a single step. Plan yours.",
    "The summit is never too far for those who keep moving.",
    "Clarity of purpose turns effort into momentum.",
    "Every task completed is a step closer to the peak.",
    "Where focus goes, energy flows — and progress follows."
  ];

  function updateHero() {
    const now  = new Date();
    const days = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
    const months = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
    heroDate.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    const hour = now.getHours();
    if (hour < 12)      heroHeading.innerHTML = "WHERE DO YOU<br>WANT TO GO TODAY?";
    else if (hour < 17) heroHeading.innerHTML = "KEEP CLIMBING —<br>THE SUMMIT AWAITS";
    else                heroHeading.innerHTML = "REFLECT &<br>PLAN AHEAD";

    heroQuote.textContent = quotes[now.getDay() % quotes.length];

    const active = tasks.filter(t => !t.completed).length;
    const done   = tasks.filter(t => t.completed).length;
    const total  = tasks.length;
    const pct    = total > 0 ? Math.round((done / total) * 100) : 0;

    heroStatActive.textContent = active;
    heroStatDone.textContent   = done;
    heroStatPct.textContent    = pct + "%";

    // Progress ring (circumference = 2π×42 ≈ 264)
    const offset = 264 - (pct / 100) * 264;
    ringFill.style.strokeDashoffset = offset;
    ringPercent.textContent = pct + "%";

    // Sidebar progress bar
    sidebarProgressBar.style.width = pct + "%";
    sidebarProgressPct.textContent = pct + "%";
    if (pct === 100)       sidebarProgressSub.textContent = "Summit reached! 🏔️";
    else if (pct >= 75)    sidebarProgressSub.textContent = "Almost at the top!";
    else if (pct >= 50)    sidebarProgressSub.textContent = "Halfway up the trail";
    else if (pct >= 25)    sidebarProgressSub.textContent = "Building momentum";
    else if (pct > 0)      sidebarProgressSub.textContent = "Begin your ascent";
    else                   sidebarProgressSub.textContent = "Ready for the climb?";
  }

  // ═══════════════════════════════════════════════
  // TRAIL SECTORS (Projects)
  // ═══════════════════════════════════════════════

  function renderSectors() {
    focusCardsGrid.innerHTML = "";
    projects.forEach((proj, idx) => {
      const projTasks = tasks.filter(t => t.project === proj.id);
      const total     = projTasks.length;
      const done      = projTasks.filter(t => t.completed).length;
      const active    = total - done;
      const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
      const num       = String(idx + 1).padStart(2, "0");

      const card = document.createElement("div");
      card.className = "sector-card";
      card.style.setProperty("--card-color", proj.color);
      card.innerHTML = `
        <div class="sector-card-top">
          <span class="sector-number">${num}</span>
          <span class="sector-count-badge">${done}/${total} done</span>
        </div>
        <div>
          <h3 class="sector-card-name">${escHtml(proj.name)}</h3>
          <p class="sector-card-sub">${active} active task${active !== 1 ? "s" : ""}</p>
        </div>
        <div class="sector-progress-track">
          <div class="sector-progress-bar" style="width:${pct}%;"></div>
        </div>
      `;
      card.addEventListener("click", () => {
        currentView = proj.id;
        switchToTasksPane();
        refresh();
      });
      focusCardsGrid.appendChild(card);
    });
  }

  function renderSidebarProjects() {
    sidebarProjects.innerHTML = "";
    projects.forEach(proj => {
      const count = tasks.filter(t => t.project === proj.id && !t.completed).length;
      const btn   = document.createElement("button");
      btn.className = `proj-sidebar-btn${currentView === proj.id ? " active" : ""}`;
      btn.innerHTML = `
        <span class="proj-color-dot" style="background:${proj.color};"></span>
        <span>${escHtml(proj.name)}</span>
        <span class="proj-task-count">${count}</span>
      `;
      btn.addEventListener("click", () => {
        currentView = proj.id;
        switchToTasksPane();
        closeSidebar();
        refresh();
      });
      sidebarProjects.appendChild(btn);
    });
  }

  function populateProjectDropdowns() {
    [taskInputProject, editProject].forEach(sel => {
      if (!sel) return;
      sel.innerHTML = "";
      projects.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name;
        sel.appendChild(opt);
      });
    });
  }

  // ═══════════════════════════════════════════════
  // COUNTS
  // ═══════════════════════════════════════════════

  function updateCounts() {
    const todayStr = getTodayStr();
    countToday.textContent    = tasks.filter(t => t.dueDate === todayStr && !t.completed).length;
    countUpcoming.textContent = tasks.filter(t => t.dueDate > todayStr && !t.completed).length;
    countStarred.textContent  = tasks.filter(t => t.starred && !t.completed).length;
    countInbox.textContent    = tasks.filter(t => !t.completed).length;
    countCompleted.textContent= tasks.filter(t => t.completed).length;
    countNotes.textContent    = notes.length;
    notesBadge.textContent    = `${notes.length} note${notes.length !== 1 ? "s" : ""}`;
  }

  // ═══════════════════════════════════════════════
  // VIEW TITLE
  // ═══════════════════════════════════════════════

  function renderViewTitle() {
    const labels = {
      today:     "Today's Route",
      upcoming:  "Upcoming Trail",
      starred:   "Priority Flags",
      inbox:     "All Tasks",
      completed: "Summited Tasks"
    };
    if (labels[currentView]) {
      viewTitle.textContent = labels[currentView];
    } else {
      const proj = projects.find(p => p.id === currentView);
      viewTitle.textContent = proj ? proj.name : "Tasks";
    }
  }

  // ═══════════════════════════════════════════════
  // RENDER TASKS
  // ═══════════════════════════════════════════════

  function getFilteredTasks() {
    const todayStr = getTodayStr();
    let list = [...tasks];

    // View filter
    if      (currentView === "today")     list = list.filter(t => t.dueDate === todayStr);
    else if (currentView === "upcoming")  list = list.filter(t => t.dueDate > todayStr);
    else if (currentView === "starred")   list = list.filter(t => t.starred);
    else if (currentView === "completed") list = list.filter(t => t.completed);
    else if (currentView !== "inbox")     list = list.filter(t => t.project === currentView);

    // Priority
    if (priorityFilter !== "all") list = list.filter(t => t.priority === priorityFilter);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q));
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "dueDate-asc")    return (a.dueDate || "9999") > (b.dueDate || "9999") ? 1 : -1;
      if (sortBy === "priority-desc") { const m = {p1:4,p2:3,p3:2,p4:1}; return (m[b.priority]||0)-(m[a.priority]||0); }
      if (sortBy === "title-asc")      return a.title.localeCompare(b.title);
      if (sortBy === "created-desc")   return new Date(b.createdAt)-new Date(a.createdAt);
      return 0;
    });

    return list;
  }

  function renderTasks() {
    activeTasksList.innerHTML    = "";
    completedTasksList.innerHTML = "";

    const all      = getFilteredTasks();
    const active   = all.filter(t => !t.completed);
    const done     = all.filter(t => t.completed);

    viewTaskBadge.textContent = `${active.length} task${active.length !== 1 ? "s" : ""}`;

    if (active.length === 0) {
      emptyState.classList.remove("hidden");
      emptyStateMsg.textContent = currentView === "completed"
        ? "No summited tasks yet. Complete a task to see it here."
        : "No tasks in this view. Add one above to begin your ascent.";
    } else {
      emptyState.classList.add("hidden");
    }

    active.forEach(t => activeTasksList.appendChild(buildTaskRow(t)));

    // Completed accordion (only shown when not in "completed" view)
    if (currentView !== "completed" && done.length > 0) {
      completedSection.classList.remove("hidden");
      completedCount.textContent = done.length;
      done.forEach(t => completedTasksList.appendChild(buildTaskRow(t)));
    } else {
      completedSection.classList.add("hidden");
    }
  }

  function buildTaskRow(task) {
    const proj      = projects.find(p => p.id === task.project) || { name: "General", color: "#869A96" };
    const dueInfo   = formatDueDate(task.dueDate);
    const prioLabel = { p1:"01 — Critical", p2:"02 — High", p3:"03 — Standard", p4:"04 — Routine" }[task.priority] || "";
    const prioNum   = task.priority || "p4";

    const li = document.createElement("li");
    li.className = `task-row${task.completed ? " completed" : ""}`;
    li.style.setProperty("--task-color", proj.color);
    li.dataset.id = task.id;

    li.innerHTML = `
      <button class="check-btn" aria-label="Toggle complete">
        <i class="fa-solid fa-check"></i>
      </button>
      <div class="task-body">
        <p class="task-title">${escHtml(task.title)}</p>
        ${task.description ? `<p class="task-desc">${escHtml(task.description)}</p>` : ""}
        <div class="task-meta-row">
          <span class="priority-badge ${prioNum}">${escHtml(prioLabel)}</span>
          <span class="meta-chip" style="border-color:${proj.color}22;">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${proj.color};"></span>
            ${escHtml(proj.name)}
          </span>
          ${task.dueDate ? `<span class="meta-chip ${dueInfo.cls}"><i class="fa-regular fa-calendar"></i> ${dueInfo.label}</span>` : ""}
          ${task.tag && task.tag !== "general" ? `<span class="meta-chip">#${escHtml(task.tag)}</span>` : ""}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-action-btn btn-star ${task.starred ? "starred" : ""}" title="${task.starred ? "Remove flag" : "Flag as priority"}">
          <i class="${task.starred ? "fa-solid fa-flag" : "fa-regular fa-flag"}"></i>
        </button>
        <button class="task-action-btn btn-edit" title="Edit task">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button class="task-action-btn delete-btn" title="Delete task">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;

    li.querySelector(".check-btn").addEventListener("click",  () => toggleComplete(task.id));
    li.querySelector(".btn-star").addEventListener("click",   () => toggleStar(task.id));
    li.querySelector(".btn-edit").addEventListener("click",   () => openEditModal(task.id));
    li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));

    return li;
  }

  // ═══════════════════════════════════════════════
  // NOTES
  // ═══════════════════════════════════════════════

  function renderNotes() {
    notesGrid.innerHTML = "";
    notes.forEach(note => {
      const card = document.createElement("div");
      card.className = "note-card";
      card.innerHTML = `
        <textarea class="note-textarea" placeholder="Write your trail note...">${escHtml(note.content)}</textarea>
        <div class="note-footer">
          <span>${escHtml(note.date || "Note")}</span>
          <button class="note-delete" title="Delete note"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      `;
      const ta = card.querySelector(".note-textarea");
      ta.addEventListener("input", () => {
        note.content = ta.value;
        save(KEYS.NOTES, notes);
        updateCounts();
      });
      card.querySelector(".note-delete").addEventListener("click", () => {
        notes = notes.filter(n => n.id !== note.id);
        save(KEYS.NOTES, notes);
        renderNotes();
        updateCounts();
        showToast("Note removed");
      });
      notesGrid.appendChild(card);
    });
    updateCounts();
  }

  // ═══════════════════════════════════════════════
  // TASK CRUD
  // ═══════════════════════════════════════════════

  function addTask(title, desc, projId, priority, dueDate, tag) {
    if (!title.trim()) return false;
    const task = {
      id: "t" + Date.now(),
      title:       title.trim(),
      description: desc.trim(),
      project:     projId || (projects[0] && projects[0].id) || "",
      priority:    priority || "p2",
      dueDate:     dueDate || today,
      tag:         tag || "general",
      starred:     false,
      completed:   false,
      createdAt:   new Date().toISOString()
    };
    tasks.unshift(task);
    save(KEYS.TASKS, tasks);
    refresh();
    return true;
  }

  function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    save(KEYS.TASKS, tasks);
    refresh();
    showToast(task.completed ? "Summited! ▲" : "Back on the trail");
  }

  function toggleStar(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.starred = !task.starred;
    save(KEYS.TASKS, tasks);
    refresh();
    showToast(task.starred ? "Priority flag set" : "Flag removed");
  }

  function deleteTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    lastDeletedTask = tasks[idx];
    tasks.splice(idx, 1);
    save(KEYS.TASKS, tasks);
    refresh();
    showToast("Task removed", true, () => {
      if (lastDeletedTask) {
        tasks.push(lastDeletedTask);
        lastDeletedTask = null;
        save(KEYS.TASKS, tasks);
        refresh();
        showToast("Task restored");
      }
    });
  }

  function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editTaskId.value    = task.id;
    editTitle.value     = task.title;
    editDesc.value      = task.description || "";
    editProject.value   = task.project;
    editPriority.value  = task.priority || "p2";
    editDate.value      = task.dueDate || "";
    editTag.value       = task.tag || "general";
    openModal(editModal);
  }

  function saveEditTask(id, title, desc, projId, priority, dueDate, tag) {
    const task = tasks.find(t => t.id === id);
    if (!task || !title.trim()) return;
    task.title       = title.trim();
    task.description = desc.trim();
    task.project     = projId;
    task.priority    = priority;
    task.dueDate     = dueDate;
    task.tag         = tag;
    save(KEYS.TASKS, tasks);
    refresh();
    showToast("Task updated");
  }

  function addProject(name, color) {
    if (!name.trim()) return;
    const proj = { id: "proj-" + Date.now(), name: name.trim(), color: color || "#0D352E" };
    projects.push(proj);
    save(KEYS.PROJECTS, projects);
    populateProjectDropdowns();
    refresh();
    showToast(`Sector "${proj.name}" created`);
  }

  function addNote() {
    const note = { id: "n" + Date.now(), content: "", date: "New note" };
    notes.unshift(note);
    save(KEYS.NOTES, notes);
    renderNotes();
    showToast("New trail note added");
  }

  // ═══════════════════════════════════════════════
  // MODAL HELPERS
  // ═══════════════════════════════════════════════

  function openModal(el) {
    el.classList.add("active");
    el.setAttribute("aria-hidden", "false");
  }

  function closeModal(el) {
    el.classList.remove("active");
    el.setAttribute("aria-hidden", "true");
  }

  // ═══════════════════════════════════════════════
  // PANE SWITCHING
  // ═══════════════════════════════════════════════

  function switchToTasksPane() {
    paneTasksView.classList.add("active");
    paneNotesView.classList.remove("active");
  }

  function switchToNotesPane() {
    paneNotesView.classList.add("active");
    paneTasksView.classList.remove("active");
  }

  // ═══════════════════════════════════════════════
  // SIDEBAR
  // ═══════════════════════════════════════════════

  function openSidebar() {
    sidebar.classList.add("open");
    sidebarBackdrop.classList.add("active");
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("active");
  }

  // ═══════════════════════════════════════════════
  // TOAST
  // ═══════════════════════════════════════════════

  function showToast(msg, withUndo = false, undoCb = null) {
    const div = document.createElement("div");
    div.className = "toast";
    div.innerHTML = `<span>${escHtml(msg)}</span>`;
    if (withUndo && undoCb) {
      const btn = document.createElement("button");
      btn.className = "toast-undo-btn";
      btn.textContent = "Undo";
      btn.addEventListener("click", () => { undoCb(); div.remove(); });
      div.appendChild(btn);
    }
    toastBox.appendChild(div);
    setTimeout(() => {
      div.classList.add("out");
      setTimeout(() => div.remove(), 300);
    }, 3500);
  }

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════

  function getTodayStr() {
    return new Date().toISOString().split("T")[0];
  }

  function getOffsetDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }

  function formatDueDate(dateStr) {
    if (!dateStr) return { label: "", cls: "" };
    const t = getTodayStr();
    const tom = getOffsetDate(1);
    if (dateStr < t)   return { label: "Overdue",   cls: "overdue" };
    if (dateStr === t) return { label: "Today",      cls: "today" };
    if (dateStr === tom) return { label: "Tomorrow", cls: "" };
    const d = new Date(dateStr + "T00:00:00");
    return { label: d.toLocaleDateString("en-GB", { day:"numeric", month:"short" }), cls: "" };
  }

  function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

  function escHtml(str) {
    if (!str) return "";
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  // ═══════════════════════════════════════════════
  // EVENT BINDING
  // ═══════════════════════════════════════════════

  function bindEvents() {

    // Scroll effects
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 10);
      scrollToTop.classList.toggle("visible", window.scrollY > 400);
    }, { passive: true });

    // Theme
    themeToggle.addEventListener("click", () => applyTheme(!isDark));

    // Mobile sidebar
    mobilMenuBtn.addEventListener("click", openSidebar);
    sidebarCloseBtn.addEventListener("click", closeSidebar);
    sidebarBackdrop.addEventListener("click", closeSidebar);

    // Top navbar view links
    navLinks.forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        if (!view) return;
        currentView = view;
        navLinks.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        if (view === "notes") switchToNotesPane();
        else switchToTasksPane();
        refresh();
      });
    });

    // Sidebar nav links
    sidebarNavBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        if (!view) return;
        currentView = view;
        sidebarNavBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        if (view === "notes") switchToNotesPane();
        else switchToTasksPane();
        closeSidebar();
        refresh();
      });
    });

    // Search
    globalSearch.addEventListener("input", e => { searchQuery = e.target.value; renderTasks(); });
    sidebarSearch.addEventListener("input", e => { searchQuery = e.target.value; renderTasks(); });

    // Priority & sort filters (sidebar)
    priorityFilterEl.addEventListener("change", e => {
      priorityFilter = e.target.value;
      priorityFilterTopEl.value = priorityFilter;
      renderTasks();
    });
    sortFilterEl.addEventListener("change", e => {
      sortBy = e.target.value;
      sortFilterTopEl.value = sortBy;
      renderTasks();
    });

    // Priority & sort filters (top bar)
    priorityFilterTopEl.addEventListener("change", e => {
      priorityFilter = e.target.value;
      priorityFilterEl.value = priorityFilter;
      renderTasks();
    });
    sortFilterTopEl.addEventListener("change", e => {
      sortBy = e.target.value;
      sortFilterEl.value = sortBy;
      renderTasks();
    });

    // Hero CTA
    heroCta.addEventListener("click", () => {
      taskInputTitle.focus();
      taskInputTitle.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Quick add (sidebar + nav)
    [$("sidebar-quick-add-btn"), $("sidebar-add-btn")].forEach(btn => {
      if (!btn) return;
      btn.addEventListener("click", () => {
        switchToTasksPane();
        closeSidebar();
        taskInputTitle.focus();
        taskInputTitle.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    // Add task: enter key
    taskInputTitle.addEventListener("keydown", e => { if (e.key === "Enter") handleAddTask(); });
    submitInlineAdd.addEventListener("click", handleAddTask);
    cancelInlineAdd.addEventListener("click", () => {
      taskInputTitle.value = "";
      taskInputDesc.value  = "";
    });

    function handleAddTask() {
      const ok = addTask(
        taskInputTitle.value,
        taskInputDesc.value,
        taskInputProject.value,
        taskInputPriority.value,
        taskInputDate.value || today,
        taskInputTag.value
      );
      if (ok) {
        taskInputTitle.value = "";
        taskInputDesc.value  = "";
        taskInputDate.value  = today;
        showToast("Task added — keep climbing!");
      }
    }

    // Completed accordion toggle
    completedToggle.addEventListener("click", () => {
      completedOpen = !completedOpen;
      completedTasksList.classList.toggle("hidden", !completedOpen);
      completedArrow.classList.toggle("open", completedOpen);
    });

    // Edit modal
    editTaskForm.addEventListener("submit", e => {
      e.preventDefault();
      saveEditTask(editTaskId.value, editTitle.value, editDesc.value, editProject.value, editPriority.value, editDate.value, editTag.value);
      closeModal(editModal);
    });
    editModalClose.addEventListener("click",  () => closeModal(editModal));
    editModalCancel.addEventListener("click", () => closeModal(editModal));

    // Project modal
    [btnAddProjectMain, btnAddProjectSide].forEach(btn => {
      if (!btn) return;
      btn.addEventListener("click", () => openModal(projectModal));
    });
    projectModalClose.addEventListener("click",  () => closeModal(projectModal));
    projectModalCancel.addEventListener("click", () => closeModal(projectModal));
    projectForm.addEventListener("submit", e => {
      e.preventDefault();
      const color = projectForm.querySelector("input[name='proj-color']:checked").value;
      addProject(projectName.value, color);
      projectName.value = "";
      closeModal(projectModal);
    });

    // Notes
    btnAddNote.addEventListener("click", addNote);

    // Close modals on backdrop click
    [editModal, projectModal].forEach(modal => {
      modal.addEventListener("click", e => { if (e.target === modal) closeModal(modal); });
    });

    // Keyboard shortcuts
    window.addEventListener("keydown", e => {
      if (["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        switchToTasksPane();
        taskInputTitle.focus();
      }
      if (e.key === "/" ) {
        e.preventDefault();
        globalSearch.focus();
      }
      if (e.key === "Escape") {
        closeModal(editModal);
        closeModal(projectModal);
        closeSidebar();
      }
    });
  }

  // ═══════════════════════════════════════════════
  // START
  // ═══════════════════════════════════════════════
  init();

});