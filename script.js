/**
 * SUMMIT TASKS — to-top.ch inspired script
 * Page transition, scroll-reveal, title-split, number counter, tab slider
 */

document.addEventListener("DOMContentLoaded", () => {

  /* ════════════════════════════════════════════════
     STORAGE KEYS & DEFAULTS
  ════════════════════════════════════════════════ */
  const K = {
    TASKS: "summit_tasks_v2",
    PROJS: "summit_projs_v2",
    NOTES: "summit_notes_v2",
    THEME: "summit_theme_v2"
  };

  const todayStr = () => new Date().toISOString().split("T")[0];
  const offsetDate = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; };

  const DEF_PROJECTS = [
    { id:"proj-1", name:"Work",     color:"#0D352E" },
    { id:"proj-2", name:"Personal", color:"#2A6055" },
    { id:"proj-3", name:"Health",   color:"#EFB300" },
    { id:"proj-4", name:"Learning", color:"#457b9d" }
  ];

  const DEF_TASKS = [
    { id:"t1", title:"Plan the weekly route & set milestones", description:"Review all open tasks and assign priorities.", project:"proj-1", priority:"p1", dueDate:todayStr(), tag:"work",    starred:true,  completed:false, createdAt: new Date().toISOString() },
    { id:"t2", title:"Morning walk — 30 minutes",              description:"Start the day with movement.",                project:"proj-3", priority:"p2", dueDate:todayStr(), tag:"urgent",  starred:false, completed:false, createdAt: new Date().toISOString() },
    { id:"t3", title:"Read 20 pages of current book",         description:"Continue chapter 7.",                         project:"proj-4", priority:"p3", dueDate:offsetDate(1), tag:"general",starred:false, completed:false, createdAt: new Date().toISOString() },
    { id:"t4", title:"Weekly team check-in",                  description:"Review project status.",                      project:"proj-1", priority:"p2", dueDate:offsetDate(1), tag:"work",  starred:true,  completed:false, createdAt: new Date().toISOString() },
    { id:"t5", title:"Grocery shopping for the week",         description:"Fresh produce and meal prep.",                project:"proj-2", priority:"p4", dueDate:todayStr(), tag:"general", starred:false, completed:true,  createdAt: new Date().toISOString() }
  ];

  const DEF_NOTES = [
    { id:"n1", content:"The trail to the summit is not always straight — trust the detours.", label:"Trail wisdom" },
    { id:"n2", content:"Ideas for strategy: focus on depth over breadth, fewer but better.", label:"Strategy" },
    { id:"n3", content:"Look into time-blocking for deep work sessions.", label:"Learning" }
  ];

  /* ════════════════════════════════════════════════
     SECURE STORAGE & SCHEMA ENGINE
  ════════════════════════════════════════════════ */
  const SecureStorage = {
    get(key, fallback, validator = null) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        const parsed = JSON.parse(raw);
        if (validator && typeof validator === "function" && !validator(parsed)) {
          console.warn(`[Security] Schema validation failed for ${key}. Using fallback.`);
          return fallback;
        }
        return parsed;
      } catch (err) {
        console.warn(`[Security] Storage read error on ${key}:`, err);
        return fallback;
      }
    },
    set(key, val) {
      try {
        localStorage.setItem(key, JSON.stringify(val));
        return true;
      } catch (err) {
        console.error(`[Security] Storage quota exceeded or disabled for ${key}:`, err);
        toast("⚠️ Storage limit reached or cookies disabled.");
        return false;
      }
    },
    calcUsage() {
      let total = 0;
      try {
        for (let k in localStorage) {
          if (Object.prototype.hasOwnProperty.call(localStorage, k)) {
            total += (k.length + (localStorage[k] ? localStorage[k].length : 0)) * 2;
          }
        }
      } catch (e) {}
      if (total < 1024) return `${total} B`;
      return `${(total / 1024).toFixed(1)} KB`;
    }
  };

  const validateTasks = (data) => Array.isArray(data) && data.every(t => t && typeof t === "object" && typeof t.title === "string");
  const validateProjects = (data) => Array.isArray(data) && data.every(p => p && typeof p === "object" && typeof p.name === "string");
  const validateNotes = (data) => Array.isArray(data) && data.every(n => n && typeof n === "object");

  function generateId(prefix = "item") {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  let tasks    = SecureStorage.get(K.TASKS, DEF_TASKS, validateTasks);
  let projects = SecureStorage.get(K.PROJS, DEF_PROJECTS, validateProjects);
  let notes    = SecureStorage.get(K.NOTES, DEF_NOTES, validateNotes);
  let isDark   = SecureStorage.get(K.THEME, "light") === "dark";

  let currentView     = "today";
  let priorityFilter  = "all";
  let sortBy          = "dueDate-asc";
  let searchQuery     = "";
  let completedOpen   = false;
  let lastDeleted     = null;

  /* ════════════════════════════════════════════════
     DOM REFS
  ════════════════════════════════════════════════ */
  const $ = id => document.getElementById(id);
  const $$ = s => document.querySelectorAll(s);

  const pageTrans       = $("page-transition");
  const scrollTopBtn    = $("scroll-to-top");
  const navbar          = document.querySelector(".navbar");

  const themeBtn        = $("theme-toggle");
  const hamburgerBtn    = $("hamburger-btn");
  const mobileMenu      = $("mobile-menu");
  const globalSearch    = $("global-search");
  const mobileSearch    = $("mobile-search");
  const navAddBtn       = $("nav-add-btn");

  // Hero
  const statActive = $("stat-active");
  const statDone   = $("stat-done");
  const statPct    = $("stat-pct");
  const ringFill   = $("ring-fill");
  const ringPct    = $("ring-pct");
  const ctaRing    = $("cta-ring-fill");
  const ctaPct     = $("cta-pct");
  const heroStartBtn = $("hero-start-btn");
  const heroSectorsBtn = $("hero-view-sectors-btn");
  const ctaAddBtn  = $("cta-add-btn");
  const heroQuote  = $("hero-quote");

  // Sectors
  const sectorsGrid    = $("sectors-grid");
  const btnAddSector   = $("btn-add-sector");

  // View tabs
  const viewTabs    = $$(".view-tab");
  const tabSlider   = $("view-tab-slider");
  const viewTitle   = $("view-title");
  const viewBadge   = $("view-badge");
  const prioFilter  = $("priority-filter");
  const sortFilter  = $("sort-filter");

  // Tasks
  const taskTitleInput  = $("task-title-input");
  const taskDescInput   = $("task-desc-input");
  const taskDateInput   = $("task-date-input");
  const taskPrioInput   = $("task-priority-input");
  const taskProjInput   = $("task-project-input");
  const taskTagInput    = $("task-tag-input");
  const submitAdd       = $("submit-add");
  const cancelAdd       = $("cancel-add");
  const emptyState      = $("empty-state");
  const emptyMsg        = $("empty-msg");
  const activeList      = $("active-task-list");
  const completedWrap   = $("completed-wrap");
  const completedToggle = $("completed-toggle");
  const completedArrow  = $("completed-arrow");
  const completedCount  = $("completed-count");
  const completedList   = $("completed-list");

  // Notes
  const notesGrid = $("notes-grid");
  const btnAddNote = $("btn-add-note");

  // Modals
  const editModal   = $("edit-modal");
  const editForm    = $("edit-form");
  const editId      = $("edit-id");
  const editTitle   = $("edit-title");
  const editDesc    = $("edit-desc");
  const editProject = $("edit-project");
  const editPriority= $("edit-priority");
  const editDate    = $("edit-date");
  const editTag     = $("edit-tag");
  const editClose   = $("edit-close");
  const editCancel  = $("edit-cancel");

  const sectorModal  = $("sector-modal");
  const sectorForm   = $("sector-form");
  const sectorName   = $("sector-name");
  const sectorClose  = $("sector-close");
  const sectorCancel = $("sector-cancel");

  // Backup & Security Hub
  const btnOpenBackup          = $("btn-open-backup");
  const mobileBackupLink       = $("mobile-backup-link");
  const backupModal            = $("backup-modal");
  const backupClose            = $("backup-close");
  const btnExportJson          = $("btn-export-json");
  const btnImportTrigger       = $("btn-import-trigger");
  const inputImportJson        = $("input-import-json");
  const btnClearCompletedModal = $("btn-clear-completed-modal");
  const btnFactoryReset        = $("btn-factory-reset");
  const storageUsageText       = $("storage-usage-text");

  // Confirmation Modal
  const confirmModal   = $("confirm-modal");
  const confirmTitle   = $("confirm-title");
  const confirmDesc    = $("confirm-desc");
  const confirmOk      = $("confirm-ok");
  const confirmCancel  = $("confirm-cancel");
  const confirmClose   = $("confirm-close");

  // PWA & Accessibility
  const offlineBadge   = $("offline-badge");
  const btnInstallApp  = $("btn-install-app");
  const liveAnnouncer  = $("aria-live-announcer");

  // Shortcuts & 3D Celebration Modals
  const btnShortcuts         = $("btn-shortcuts");
  const mobileShortcutsLink  = $("mobile-shortcuts-link");
  const shortcutsModal       = $("shortcuts-modal");
  const shortcutsClose       = $("shortcuts-close");
  const searchClearBtn       = $("search-clear-btn");

  const summitModal          = $("summit-modal");
  const summitCelebrateClose = $("summit-celebrate-close");
  const celebrationCanvas    = $("celebration-canvas");
  const hikerGroup           = $("hiker-group");
  const overdueChipCount     = $("overdue-chip-count");
  const quickChips           = $$(".quick-chip");

  let activeQuickFilter  = "all";
  let hasCelebratedToday = false;

  const toastWrap = $("toast-wrap");

  /* ════════════════════════════════════════════════
     PAGE LOAD TRANSITION (to-top.ch exact)
  ════════════════════════════════════════════════ */
  window.addEventListener("load", () => {
    setTimeout(() => {
      pageTrans.classList.add("hide");
      setTimeout(() => { pageTrans.style.display = "none"; }, 800);
    }, 600);
  });

  /* ════════════════════════════════════════════════
     SCROLL EFFECTS
  ════════════════════════════════════════════════ */
  const scrollProgressBar = $("scroll-progress");

  window.addEventListener("scroll", () => {
    // Navbar scroll shadow
    navbar.classList.toggle("scrolled", window.scrollY > 20);
    // Scroll to top button
    scrollTopBtn.classList.toggle("show", window.scrollY > 500);

    // Scroll progress bar (to-top.ch style indicator)
    if (scrollProgressBar) {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? (window.scrollY / docH) * 100 : 0;
      scrollProgressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }
  }, { passive: true });

  /* ════════════════════════════════════════════════
     SCROLL REVEAL (to-top.ch IntersectionObserver)
  ════════════════════════════════════════════════ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  function observeReveal() {
    $$(".scroll-reveal, .blur-reveal, .tilt-reveal, .scale-reveal").forEach(el => revealObserver.observe(el));
  }

  /* ════════════════════════════════════════════════
     TITLE SPLIT ANIMATION (to-top.ch chars)
  ════════════════════════════════════════════════ */
  function initTitleSplit(el) {
    if (!el || el.dataset.split) return;
    el.dataset.split = "1";
    const text = el.textContent;
    el.innerHTML = "";
    text.split(" ").forEach((word, wi) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "word";
      if (wi > 0) el.appendChild(document.createTextNode(" "));
      word.split("").forEach((ch, ci) => {
        const charSpan = document.createElement("span");
        charSpan.className = "char";
        charSpan.textContent = ch;
        charSpan.style.transitionDelay = `${(wi * 6 + ci) * 35}ms`;
        wordSpan.appendChild(charSpan);
      });
      el.appendChild(wordSpan);
    });

    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("active");
        }
      });
    }, { threshold: 0.3 }).observe(el);
  }

  /* ════════════════════════════════════════════════
     NUMBER ODOMETER (count up animation)
  ════════════════════════════════════════════════ */
  function animateCounter(el, target, suffix = "", duration = 900) {
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const startTime = performance.now();
    const isPercent = suffix === "%";

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(start + (target - start) * eased);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  /* ════════════════════════════════════════════════
     VIEW TAB SLIDER
  ════════════════════════════════════════════════ */
  function moveTabSlider(activeTab) {
    if (!tabSlider || !activeTab) return;
    const wrap = activeTab.parentElement;
    const wrapRect = wrap.getBoundingClientRect();
    const tabRect  = activeTab.getBoundingClientRect();
    tabSlider.style.left  = (tabRect.left - wrapRect.left) + "px";
    tabSlider.style.width = tabRect.width + "px";
  }

  /* ════════════════════════════════════════════════
     THEME
  ════════════════════════════════════════════════ */
  function applyTheme(dark) {
    isDark = dark;
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem(K.THEME, isDark ? "dark" : "light");
    const icon = themeBtn.querySelector("i");
    if (icon) icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-circle-half-stroke";
  }

  /* ════════════════════════════════════════════════
     HERO
  ════════════════════════════════════════════════ */
  const heroQuotes = [
    "Every summit begins with the decision to try. Start your first task.",
    "The trail to the summit is not always straight — trust the detours.",
    "Clarity of purpose turns effort into momentum.",
    "Every task completed is a step closer to the peak.",
    "Where focus goes, energy flows — and progress follows.",
    "Small steps. Relentless rhythm. The summit awaits."
  ];

  function updateHero() {
    const now  = new Date();
    const dow  = now.getDay();
    heroQuote.textContent = heroQuotes[dow % heroQuotes.length];

    const active = tasks.filter(t => !t.completed).length;
    const done   = tasks.filter(t => t.completed).length;
    const total  = tasks.length;
    const pct    = total > 0 ? Math.round((done / total) * 100) : 0;

    animateCounter(statActive, active);
    animateCounter(statDone,   done);
    animateCounter(statPct,    pct, "%");

    const statAlt = $("stat-alt");
    if (statAlt) {
      const altMeters = Math.round(1200 + (pct / 100) * (4810 - 1200));
      animateCounter(statAlt, altMeters, "m");
    }

    const offset = 264 - (pct / 100) * 264;
    if (ringFill) ringFill.style.strokeDashoffset = offset;
    if (ringPct)  ringPct.textContent = pct + "%";
    if (ctaRing)  ctaRing.style.strokeDashoffset = offset;
    if (ctaPct)   ctaPct.textContent = pct + "%";

    // Dynamic 3D Mountain Climber Ascent
    if (hikerGroup) {
      const climberY = -(pct / 100) * 215;
      const climberX = Math.sin((pct / 100) * Math.PI) * 14;
      hikerGroup.style.transform = `translate3d(${climberX.toFixed(1)}px, ${climberY.toFixed(1)}px, 0)`;
    }

    // Trigger 3D Summit Celebration when 100% is reached
    if (pct === 100 && total > 0 && !hasCelebratedToday) {
      hasCelebratedToday = true;
      setTimeout(() => triggerSummitCelebration(), 700);
    }
  }

  /* ════════════════════════════════════════════════
     SECTORS
  ════════════════════════════════════════════════ */
  function renderSectors() {
    sectorsGrid.innerHTML = "";
    projects.forEach((proj, i) => {
      const pTasks = tasks.filter(t => t.project === proj.id);
      const total  = pTasks.length;
      const done   = pTasks.filter(t => t.completed).length;
      const active = total - done;
      const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
      const num    = String(i + 1).padStart(2, "0");

      const card = document.createElement("div");
      card.className = "sector-card scroll-reveal";
      card.style.setProperty("--c", proj.color);
      card.style.animationDelay = `${i * 0.08}s`;
      card.innerHTML = `
        <div class="sector-card-top">
          <span class="sector-num">${num}</span>
          <span class="sector-done-ct">${done}/${total} done</span>
        </div>
        <div>
          <h3 class="sector-name">${esc(proj.name)}</h3>
          <p class="sector-sub">${active} active task${active !== 1 ? "s" : ""}</p>
        </div>
        <div class="sector-prog-track">
          <div class="sector-prog-bar" style="width:0%;" data-pct="${pct}"></div>
        </div>
      `;
      card.addEventListener("click", () => {
        currentView = proj.id;
        switchToSection("tasks-section");
        setActiveTab(null);
        refresh();
      });
      sectorsGrid.appendChild(card);
    });

    // Animate progress bars on reveal
    observeReveal();
    $$(".sector-prog-bar").forEach(bar => {
      new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            bar.style.width = bar.dataset.pct + "%";
          }
        });
      }, { threshold: 0.3 }).observe(bar);
    });

    // Init title splits for new elements
    $$(".title-split").forEach(initTitleSplit);
  }

  /* ════════════════════════════════════════════════
     PROJECT DROPDOWNS
  ════════════════════════════════════════════════ */
  function populateProjectDropdowns() {
    [taskProjInput, editProject].forEach(sel => {
      if (!sel) return;
      const prev = sel.value;
      sel.innerHTML = "";
      projects.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name;
        sel.appendChild(opt);
      });
      if (prev) sel.value = prev;
    });
  }

  /* ════════════════════════════════════════════════
     TASK RENDERING
  ════════════════════════════════════════════════ */
  function getFilteredTasks() {
    const td = todayStr();
    let list = [...tasks];

    if      (currentView === "today")     list = list.filter(t => t.dueDate === td);
    else if (currentView === "upcoming")  list = list.filter(t => t.dueDate > td);
    else if (currentView === "starred")   list = list.filter(t => t.starred);
    else if (currentView === "completed") list = list.filter(t => t.completed);
    else if (currentView !== "inbox")     list = list.filter(t => t.project === currentView);

    if (priorityFilter !== "all") list = list.filter(t => t.priority === priorityFilter);

    // Quick filter chips matching
    if (activeQuickFilter === "overdue") {
      list = list.filter(t => !t.completed && t.dueDate && t.dueDate < td);
    } else if (activeQuickFilter === "today") {
      list = list.filter(t => t.dueDate === td);
    } else if (activeQuickFilter === "p1") {
      list = list.filter(t => t.priority === "p1");
    } else if (activeQuickFilter === "has-notes") {
      list = list.filter(t => t.description && t.description.trim().length > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
      );
    }

    const prioMap = { p1:4, p2:3, p3:2, p4:1 };
    list.sort((a, b) => {
      if (sortBy === "dueDate-asc")    return (a.dueDate || "9999") > (b.dueDate || "9999") ? 1 : -1;
      if (sortBy === "priority-desc")  return (prioMap[b.priority]||0) - (prioMap[a.priority]||0);
      if (sortBy === "title-asc")      return a.title.localeCompare(b.title);
      if (sortBy === "created-desc")   return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });
    return list;
  }

  function renderTasks() {
    activeList.innerHTML    = "";
    completedList.innerHTML = "";

    const all    = getFilteredTasks();
    const active = all.filter(t => !t.completed);
    const done   = all.filter(t => t.completed);

    // Update overdue counter badge
    const td = todayStr();
    const overdueCount = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < td).length;
    if (overdueChipCount) {
      overdueChipCount.textContent = overdueCount;
      overdueChipCount.classList.toggle("hidden", overdueCount === 0);
    }

    // View title
    const viewLabels = {
      today: "Today's Route", upcoming: "Upcoming Trail",
      starred: "Priority Flags", inbox: "All Tasks", completed: "Summited Tasks"
    };
    const proj = projects.find(p => p.id === currentView);
    viewTitle.textContent = proj ? proj.name : (viewLabels[currentView] || "Tasks");
    viewBadge.textContent = `${active.length} task${active.length !== 1 ? "s" : ""}`;

    if (active.length === 0) {
      emptyState.classList.remove("hidden");
      emptyMsg.textContent = currentView === "completed"
        ? "No summited tasks yet. Complete a task to see it here."
        : "No tasks match this route. Add one above to begin your ascent.";
    } else {
      emptyState.classList.add("hidden");
    }

    active.forEach((t, i) => {
      const row = buildTaskRow(t);
      row.style.animationDelay = `${i * 0.04}s`;
      activeList.appendChild(row);
    });

    if (currentView !== "completed" && done.length > 0) {
      completedWrap.classList.remove("hidden");
      completedCount.textContent = done.length;
      done.forEach(t => completedList.appendChild(buildTaskRow(t)));
    } else {
      completedWrap.classList.add("hidden");
    }

    init3DTilt();
  }

  function buildTaskRow(task) {
    const proj = projects.find(p => p.id === task.project) || { name:"General", color:"#869A96" };
    const due  = formatDue(task.dueDate);
    const prioLabels = { p1:"01 — Critical", p2:"02 — High", p3:"03 — Standard", p4:"04 — Routine" };
    const prioCls    = { p1:"priority-p1", p2:"priority-p2", p3:"priority-p3", p4:"priority-p4" };

    const li = document.createElement("li");
    li.className = `task-item${task.completed ? " done" : ""}`;
    li.style.setProperty("--ic", proj.color);
    li.dataset.id = task.id;

    li.innerHTML = `
      <button class="task-check" aria-label="Toggle complete">
        <i class="fa-solid fa-check"></i>
      </button>
      <div class="task-body">
        <p class="task-name" title="Double click to edit">${esc(task.title)}</p>
        ${task.description ? `<p class="task-note">${esc(task.description)}</p>` : ""}
        <div class="task-chips-row">
          <span class="t-chip known-badge ${prioCls[task.priority] || "priority-p4"} interactive" data-act="cycle-prio" title="Click to cycle priority (${prioLabels[task.priority]})">
            ${prioLabels[task.priority] || ""}
          </span>
          <span class="t-chip t-chip-proj">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${proj.color};"></span>
            ${esc(proj.name)}
          </span>
          ${task.dueDate ? `<span class="t-chip ${due.cls}">${due.label}</span>` : ""}
          ${task.tag && task.tag !== "general" ? `<span class="t-chip t-chip-tag">#${esc(task.tag)}</span>` : ""}
        </div>
      </div>
      <div class="task-actions">
        <button class="t-action${task.starred ? " starred" : ""}" data-act="star" title="${task.starred ? "Remove flag" : "Flag priority"}">
          <i class="${task.starred ? "fa-solid fa-flag" : "fa-regular fa-flag"}"></i>
        </button>
        <button class="t-action" data-act="edit" title="Edit task">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button class="t-action del" data-act="delete" title="Delete task">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;

    li.querySelector(".task-check").addEventListener("click", () => toggleDone(task.id));
    li.querySelector(".task-name").addEventListener("dblclick", () => openEditModal(task.id));

    li.querySelectorAll(".t-action, .interactive").forEach(btn => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.act;
        if (act === "star")   toggleStar(task.id);
        if (act === "edit")   openEditModal(task.id);
        if (act === "delete") deleteTask(task.id);
        if (act === "cycle-prio") {
          const prioOrder = ["p4", "p3", "p2", "p1"];
          const nextIdx = (prioOrder.indexOf(task.priority) + 1) % prioOrder.length;
          task.priority = prioOrder[nextIdx];
          save(K.TASKS, tasks);
          refresh();
          toast(`Priority set to ${prioLabels[task.priority]}`);
        }
      });
    });

    return li;
  }

  /* ════════════════════════════════════════════════
     NOTES
  ════════════════════════════════════════════════ */
  function renderNotes() {
    notesGrid.innerHTML = "";
    notes.forEach((note, i) => {
      const card = document.createElement("div");
      card.className = "note-card scroll-reveal";
      card.style.animationDelay = `${i * 0.06}s`;
      card.innerHTML = `
        <textarea class="note-area" placeholder="Write your trail note...">${esc(note.content)}</textarea>
        <div class="note-footer">
          <span>${esc(note.label || "Note")}</span>
          <button class="note-del" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      `;
      const ta = card.querySelector(".note-area");
      ta.addEventListener("input", () => { note.content = ta.value; save(K.NOTES, notes); });
      card.querySelector(".note-del").addEventListener("click", () => {
        notes = notes.filter(n => n.id !== note.id);
        save(K.NOTES, notes);
        renderNotes();
        toast("Note removed");
      });
      notesGrid.appendChild(card);
    });
    observeReveal();
  }

  /* ════════════════════════════════════════════════
     ACCESSIBILITY & SCREEN READER ANNOUNCER
  ════════════════════════════════════════════════ */
  function announce(msg) {
    if (liveAnnouncer) {
      liveAnnouncer.textContent = "";
      setTimeout(() => { liveAnnouncer.textContent = msg; }, 50);
    }
  }

  /* ════════════════════════════════════════════════
     TASK CRUD (Secure & Validated)
  ════════════════════════════════════════════════ */
  function addTask(title, desc, projId, prio, dueDate, tag) {
    const cleanTitle = (title || "").trim();
    if (!cleanTitle) {
      toast("Please enter a task title");
      return false;
    }
    if (cleanTitle.length > 200) {
      toast("Task title cannot exceed 200 characters");
      return false;
    }

    const cleanDesc = (desc || "").trim().slice(0, 2000);
    const validPrio = ["p1", "p2", "p3", "p4"].includes(prio) ? prio : "p2";
    const cleanTag = (tag || "general").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);
    const validDueDate = (dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) ? dueDate : todayStr();

    tasks.unshift({
      id: generateId("task"),
      title: cleanTitle,
      description: cleanDesc,
      project: projId || projects[0]?.id || "proj-1",
      priority: validPrio,
      dueDate: validDueDate,
      tag: cleanTag,
      starred: false,
      completed: false,
      createdAt: new Date().toISOString()
    });

    save(K.TASKS, tasks);
    refresh();
    announce(`Task "${cleanTitle}" added`);
    return true;
  }

  function toggleDone(id) {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    t.completed = !t.completed;
    save(K.TASKS, tasks);
    refresh();
    const msg = t.completed ? `Task "${t.title}" summited! ▲` : `Task "${t.title}" returned to route`;
    toast(t.completed ? "Task summited! ▲" : "Back on the trail");
    announce(msg);
  }

  function toggleStar(id) {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    t.starred = !t.starred;
    save(K.TASKS, tasks);
    refresh();
    toast(t.starred ? "Priority flag set" : "Flag removed");
    announce(t.starred ? `Task "${t.title}" marked as priority` : `Flag removed from "${t.title}"`);
  }

  function deleteTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx < 0) return;
    lastDeleted = tasks[idx];
    const taskTitle = lastDeleted.title;
    tasks.splice(idx, 1);
    save(K.TASKS, tasks);
    refresh();
    announce(`Task "${taskTitle}" deleted`);
    toast("Task removed", true, () => {
      tasks.push(lastDeleted);
      lastDeleted = null;
      save(K.TASKS, tasks);
      refresh();
      toast("Task restored");
      announce(`Task "${taskTitle}" restored`);
    });
  }

  function openEditModal(id) {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    editId.value       = t.id;
    editTitle.value    = t.title;
    editDesc.value     = t.description || "";
    editProject.value  = t.project;
    editPriority.value = t.priority || "p2";
    editDate.value     = t.dueDate || "";
    editTag.value      = t.tag || "general";
    openModal(editModal);
  }

  function addProject(name, color) {
    const cleanName = (name || "").trim().slice(0, 50);
    if (!cleanName) {
      toast("Please enter a sector name");
      return;
    }
    const safeColor = (color && /^#[0-9a-fA-F]{6}$/.test(color)) ? color : "#0D352E";
    const p = { id: generateId("proj"), name: cleanName, color: safeColor };
    projects.push(p);
    save(K.PROJS, projects);
    populateProjectDropdowns();
    refresh();
    toast(`Sector "${p.name}" created`);
    announce(`New sector "${p.name}" created`);
  }

  /* ════════════════════════════════════════════════
     ACCESSIBLE MODALS (Focus Trap & Restoration)
  ════════════════════════════════════════════════ */
  let lastFocusedElement = null;

  function openModal(el) {
    if (!el) return;
    lastFocusedElement = document.activeElement;
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Trap focus inside modal
    const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length > 0) {
      setTimeout(() => focusable[0].focus(), 50);
    }
  }

  function closeModal(el) {
    if (!el) return;
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  // Focus trap Tab listener
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const openModals = $$(".modal-overlay.open");
    if (openModals.length === 0) return;
    const currentModal = openModals[openModals.length - 1];
    const focusable = currentModal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  });

  /* ════════════════════════════════════════════════
     CONFIRMATION DIALOG ENGINE
  ════════════════════════════════════════════════ */
  let pendingConfirmAction = null;

  function showConfirmDialog(title, desc, onConfirm) {
    if (!confirmModal || !confirmTitle || !confirmDesc) return;
    confirmTitle.textContent = title;
    confirmDesc.textContent  = desc;
    pendingConfirmAction     = onConfirm;
    openModal(confirmModal);
  }

  confirmOk?.addEventListener("click", () => {
    if (pendingConfirmAction) {
      pendingConfirmAction();
      pendingConfirmAction = null;
    }
    closeModal(confirmModal);
  });
  confirmCancel?.addEventListener("click", () => {
    pendingConfirmAction = null;
    closeModal(confirmModal);
  });
  confirmClose?.addEventListener("click", () => {
    pendingConfirmAction = null;
    closeModal(confirmModal);
  });

  /* ════════════════════════════════════════════════
     DATA BACKUP & SECURITY HUB
  ════════════════════════════════════════════════ */
  function updateStorageMeter() {
    if (storageUsageText) {
      storageUsageText.textContent = `${SecureStorage.calcUsage()} used in local browser storage (${tasks.length} tasks, ${projects.length} sectors)`;
    }
  }

  function exportData() {
    const backupPayload = {
      app: "Summit Tasks",
      version: "2.0.0",
      exportedAt: new Date().toISOString(),
      tasks,
      projects,
      notes,
      theme: isDark ? "dark" : "light"
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `summit-tasks-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Backup exported successfully! 📁");
    announce("Data backup downloaded");
  }

  function importDataFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target.result);
        if (!payload || typeof payload !== "object") throw new Error("File does not contain valid JSON");
        if (!Array.isArray(payload.tasks)) throw new Error("Backup file missing tasks array");

        const cleanTasks = payload.tasks.filter(t => t && typeof t === "object" && typeof t.title === "string");
        const cleanProjects = Array.isArray(payload.projects) && payload.projects.length > 0 ? payload.projects : DEF_PROJECTS;
        const cleanNotes = Array.isArray(payload.notes) ? payload.notes : [];

        showConfirmDialog(
          "Restore Backup?",
          `This will replace your current ${tasks.length} tasks with ${cleanTasks.length} tasks from the backup. Are you sure?`,
          () => {
            tasks    = cleanTasks;
            projects = cleanProjects;
            notes    = cleanNotes;

            save(K.TASKS, tasks);
            save(K.PROJS, projects);
            save(K.NOTES, notes);

            refresh();
            closeModal(backupModal);
            toast(`Restored ${tasks.length} tasks successfully! ✅`);
            announce("Backup data successfully imported");
          }
        );
      } catch (err) {
        toast("Invalid backup file: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  /* ════════════════════════════════════════════════
     SECTION SCROLL
  ════════════════════════════════════════════════ */
  function switchToSection(sectionId) {
    const sec = document.getElementById(sectionId);
    if (sec) setTimeout(() => sec.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
  }

  /* ════════════════════════════════════════════════
     VIEW TAB MANAGEMENT
  ════════════════════════════════════════════════ */
  function setActiveTab(view) {
    viewTabs.forEach(t => {
      const isActive = t.dataset.view === view;
      t.classList.toggle("active", isActive);
      if (isActive) moveTabSlider(t);
    });
    // Update nav links
    $$(".nav-link[data-view]").forEach(l => l.classList.toggle("active", l.dataset.view === view));
    $$(".mobile-link[data-view]").forEach(l => l.classList.toggle("active", l.dataset.view === view));
  }

  /* ════════════════════════════════════════════════
     TOAST
  ════════════════════════════════════════════════ */
  function toast(msg, withUndo = false, undoCb = null) {
    const div = document.createElement("div");
    div.className = "toast";
    div.innerHTML = `<span>${esc(msg)}</span>`;
    if (withUndo && undoCb) {
      const btn = document.createElement("button");
      btn.className = "undo-btn";
      btn.textContent = "Undo";
      btn.addEventListener("click", () => { undoCb(); div.remove(); });
      div.appendChild(btn);
    }
    toastWrap.appendChild(div);
    setTimeout(() => {
      div.classList.add("out");
      setTimeout(() => div.remove(), 300);
    }, 3200);
  }

  /* ════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════ */
  function save(key, data) { SecureStorage.set(key, data); }
  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function formatDue(dateStr) {
    if (!dateStr) return { label:"", cls:"" };
    const td = todayStr();
    const tom = offsetDate(1);
    if (dateStr < td)    return { label:"Overdue",  cls:"t-chip-overdue" };
    if (dateStr === td)  return { label:"Today",    cls:"t-chip-today" };
    if (dateStr === tom) return { label:"Tomorrow", cls:"t-chip-date" };
    const d = new Date(dateStr + "T00:00:00");
    return { label: d.toLocaleDateString("en-GB",{day:"numeric",month:"short"}), cls:"t-chip-date" };
  }

  /* ════════════════════════════════════════════════
     REFRESH
  ════════════════════════════════════════════════ */
  function refresh() {
    updateHero();
    renderSectors();
    populateProjectDropdowns();
    renderTasks();
    renderNotes();
    updateStorageMeter();
    init3DTilt();
    observeReveal();
    $$(".title-split").forEach(initTitleSplit);
  }

  /* ════════════════════════════════════════════════
     EVENT BINDING
  ════════════════════════════════════════════════ */
  // Theme
  themeBtn.addEventListener("click", () => applyTheme(!isDark));

  // Hamburger / mobile menu
  hamburgerBtn.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    hamburgerBtn.classList.toggle("open", open);
  });

  // Search (both bars with Clear Button)
  [globalSearch, mobileSearch].forEach(inp => {
    inp?.addEventListener("input", e => {
      searchQuery = e.target.value;
      if (searchClearBtn) searchClearBtn.classList.toggle("hidden", !searchQuery.trim());
      renderTasks();
    });
  });

  searchClearBtn?.addEventListener("click", () => {
    if (globalSearch) globalSearch.value = "";
    if (mobileSearch) mobileSearch.value = "";
    searchQuery = "";
    searchClearBtn.classList.add("hidden");
    renderTasks();
    globalSearch?.focus();
  });

  // Interactive Priority Strip click listeners
  $$(".known-badge[data-filter-prio]").forEach(btn => {
    btn.addEventListener("click", () => {
      const prio = btn.dataset.filterPrio;
      if (!prio) return;
      priorityFilter = prio;
      if (prioFilter) prioFilter.value = prio;
      switchToSection("tasks-section");
      renderTasks();
      toast(`Filtered by Priority ${btn.textContent.trim()}`);
      announce(`Filtered by priority ${btn.textContent.trim()}`);
    });
  });

  // View tabs
  viewTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const view = tab.dataset.view;
      if (!view) return;
      currentView = view;
      setActiveTab(view);
      refresh();
    });
  });

  // Tab slider: initial position after paint
  requestAnimationFrame(() => {
    const active = document.querySelector(".view-tab.active");
    if (active) moveTabSlider(active);
  });

  // Nav links
  $$(".nav-link[data-view]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const view = link.dataset.view;
      currentView = view;
      setActiveTab(view);
      switchToSection("tasks-section");
      refresh();
    });
  });

  // Mobile nav links
  $$(".mobile-link[data-view]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const view = link.dataset.view;
      currentView = view;
      setActiveTab(view);
      switchToSection("tasks-section");
      mobileMenu.classList.remove("open");
      hamburgerBtn.classList.remove("open");
      refresh();
    });
  });

  // Priority / sort filters
  prioFilter.addEventListener("change", e => { priorityFilter = e.target.value; renderTasks(); });
  sortFilter.addEventListener("change", e => { sortBy = e.target.value; renderTasks(); });

  // Hero buttons
  heroStartBtn?.addEventListener("click", () => switchToSection("tasks-section"));
  heroSectorsBtn?.addEventListener("click", () => switchToSection("sectors-section"));
  ctaAddBtn?.addEventListener("click", () => {
    switchToSection("tasks-section");
    setTimeout(() => taskTitleInput.focus(), 600);
  });

  // Nav add button
  navAddBtn?.addEventListener("click", () => {
    switchToSection("tasks-section");
    setTimeout(() => taskTitleInput.focus(), 600);
  });

  // Add task
  taskTitleInput.addEventListener("keydown", e => { if (e.key === "Enter") handleAdd(); });
  submitAdd.addEventListener("click", handleAdd);
  cancelAdd.addEventListener("click", () => {
    taskTitleInput.value = "";
    taskDescInput.value  = "";
  });

  function handleAdd() {
    const ok = addTask(
      taskTitleInput.value,
      taskDescInput.value,
      taskProjInput.value,
      taskPrioInput.value,
      taskDateInput.value,
      taskTagInput.value
    );
    if (ok) {
      taskTitleInput.value = "";
      taskDescInput.value  = "";
      taskDateInput.value  = todayStr();
      toast("Task added — keep climbing!");
    }
  }

  // Completed accordion
  completedToggle.addEventListener("click", () => {
    completedOpen = !completedOpen;
    completedList.classList.toggle("hidden", !completedOpen);
    completedArrow.classList.toggle("open", completedOpen);
  });

  // Edit modal
  editForm.addEventListener("submit", e => {
    e.preventDefault();
    const t = tasks.find(t => t.id === editId.value);
    if (!t) return;
    t.title       = editTitle.value.trim();
    t.description = editDesc.value.trim();
    t.project     = editProject.value;
    t.priority    = editPriority.value;
    t.dueDate     = editDate.value;
    t.tag         = editTag.value;
    save(K.TASKS, tasks);
    refresh();
    closeModal(editModal);
    toast("Task updated");
  });
  editClose.addEventListener("click",  () => closeModal(editModal));
  editCancel.addEventListener("click", () => closeModal(editModal));

  // Sector modal
  btnAddSector.addEventListener("click", () => openModal(sectorModal));
  sectorClose.addEventListener("click",  () => closeModal(sectorModal));
  sectorCancel.addEventListener("click", () => closeModal(sectorModal));
  sectorForm.addEventListener("submit", e => {
    e.preventDefault();
    const color = sectorForm.querySelector("input[name='scolor']:checked").value;
    addProject(sectorName.value, color);
    sectorName.value = "";
    closeModal(sectorModal);
  });

  // Close modals on backdrop
  [editModal, sectorModal].forEach(m => {
    m.addEventListener("click", e => { if (e.target === m) closeModal(m); });
  });

  // Add note
  btnAddNote.addEventListener("click", () => {
    notes.unshift({ id: generateId("note"), content:"", label:"New note" });
    save(K.NOTES, notes);
    renderNotes();
    toast("New trail note added");
    announce("New trail note added");
  });

  // Backup & Security Hub Controls
  btnOpenBackup?.addEventListener("click", () => {
    updateStorageMeter();
    openModal(backupModal);
  });

  mobileBackupLink?.addEventListener("click", (e) => {
    e.preventDefault();
    updateStorageMeter();
    mobileMenu.classList.remove("open");
    hamburgerBtn.classList.remove("open");
    openModal(backupModal);
  });

  backupClose?.addEventListener("click", () => closeModal(backupModal));

  btnExportJson?.addEventListener("click", exportData);

  btnImportTrigger?.addEventListener("click", () => inputImportJson?.click());

  inputImportJson?.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      importDataFile(e.target.files[0]);
      inputImportJson.value = "";
    }
  });

  btnClearCompletedModal?.addEventListener("click", () => {
    const doneCount = tasks.filter(t => t.completed).length;
    if (doneCount === 0) {
      toast("No completed tasks to clear");
      return;
    }
    showConfirmDialog(
      "Clear Summited Tasks?",
      `Are you sure you want to remove all ${doneCount} completed tasks? This cannot be undone.`,
      () => {
        tasks = tasks.filter(t => !t.completed);
        save(K.TASKS, tasks);
        refresh();
        closeModal(backupModal);
        toast(`Cleared ${doneCount} completed tasks! 🧹`);
        announce(`Cleared ${doneCount} completed tasks`);
      }
    );
  });

  btnFactoryReset?.addEventListener("click", () => {
    showConfirmDialog(
      "Reset All Application Data?",
      "⚠️ WARNING: This will permanently erase all custom tasks, sectors, and notes, and reset to original default state. Export a backup first if you want to keep your data!",
      () => {
        tasks    = DEF_TASKS;
        projects = DEF_PROJECTS;
        notes    = DEF_NOTES;
        save(K.TASKS, tasks);
        save(K.PROJS, projects);
        save(K.NOTES, notes);
        refresh();
        closeModal(backupModal);
        toast("Application reset to factory defaults! 🔄");
        announce("Application reset to default state");
      }
    );
  });

  // Search Clear Button & Input
  globalSearch?.addEventListener("input", () => {
    if (searchClearBtn) {
      searchClearBtn.classList.toggle("hidden", !globalSearch.value);
    }
  });
  searchClearBtn?.addEventListener("click", () => {
    globalSearch.value = "";
    searchQuery = "";
    searchClearBtn.classList.add("hidden");
    globalSearch.focus();
    renderTasks();
  });

  // Quick Filter Chips Click Listeners
  quickChips.forEach(chip => {
    chip.addEventListener("click", () => {
      quickChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeQuickFilter = chip.dataset.qfilter || "all";
      renderTasks();
    });
  });

  // Shortcuts Modal Listeners
  btnShortcuts?.addEventListener("click", () => openModal(shortcutsModal));
  mobileShortcutsLink?.addEventListener("click", (e) => {
    e.preventDefault();
    mobileMenu.classList.remove("open");
    hamburgerBtn.classList.remove("open");
    openModal(shortcutsModal);
  });
  shortcutsClose?.addEventListener("click", () => closeModal(shortcutsModal));

  // 3D Summit Celebration Modal Close
  summitCelebrateClose?.addEventListener("click", () => closeModal(summitModal));

  // Keyboard shortcuts
  window.addEventListener("keydown", e => {
    if (["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) return;
    if (e.key === "n" || e.key === "N") { e.preventDefault(); switchToSection("tasks-section"); setTimeout(() => taskTitleInput.focus(), 500); }
    if (e.key === "/")                  { e.preventDefault(); globalSearch.focus(); }
    if (e.key === "?" || (e.shiftKey && e.key === "/")) {
      e.preventDefault();
      shortcutsModal.classList.contains("open") ? closeModal(shortcutsModal) : openModal(shortcutsModal);
    }
    if (e.key === "b" || e.key === "B") {
      e.preventDefault();
      backupModal.classList.contains("open") ? closeModal(backupModal) : (updateStorageMeter(), openModal(backupModal));
    }
    if (e.key === "1") { e.preventDefault(); currentView = "today"; setActiveTab("today"); refresh(); }
    if (e.key === "2") { e.preventDefault(); currentView = "upcoming"; setActiveTab("upcoming"); refresh(); }
    if (e.key === "3") { e.preventDefault(); currentView = "starred"; setActiveTab("starred"); refresh(); }
    if (e.key === "4") { e.preventDefault(); currentView = "inbox"; setActiveTab("inbox"); refresh(); }
    if (e.key === "5") { e.preventDefault(); currentView = "completed"; setActiveTab("completed"); refresh(); }
    if (e.key === "Escape")             {
      closeModal(editModal);
      closeModal(sectorModal);
      closeModal(backupModal);
      closeModal(confirmModal);
      closeModal(shortcutsModal);
      closeModal(summitModal);
      mobileMenu.classList.remove("open");
      hamburgerBtn.classList.remove("open");
    }
  });

  /* ════════════════════════════════════════════════
     QUOTES SLIDER (to-top.ch dots and slide animation)
  ════════════════════════════════════════════════ */
  const quotesTrack = $("quotes-track");
  const sliderDots  = $("slider-dots");
  const sliderPrev  = $("slider-prev");
  const sliderNext  = $("slider-next");
  const slides      = $$(".quote-slide");
  let currentSlide  = 0;
  let slideInterval = null;

  function updateSlider(index) {
    if (!quotesTrack || slides.length === 0) return;
    currentSlide = (index + slides.length) % slides.length;
    quotesTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    $$(".slider-dot").forEach((d, idx) => {
      d.classList.toggle("active", idx === currentSlide);
    });
  }

  function initSlider() {
    if (!sliderDots || slides.length === 0) return;
    sliderDots.innerHTML = "";
    slides.forEach((_, idx) => {
      const dot = document.createElement("button");
      dot.className = `slider-dot${idx === 0 ? " active" : ""}`;
      dot.setAttribute("aria-label", `Slide ${idx + 1}`);
      dot.addEventListener("click", () => {
        updateSlider(idx);
        restartSlideTimer();
      });
      sliderDots.appendChild(dot);
    });

    sliderPrev?.addEventListener("click", () => {
      updateSlider(currentSlide - 1);
      restartSlideTimer();
    });

    sliderNext?.addEventListener("click", () => {
      updateSlider(currentSlide + 1);
      restartSlideTimer();
    });

    restartSlideTimer();

    const sliderContainer = $("quotes-slider");
    sliderContainer?.addEventListener("mouseenter", () => clearInterval(slideInterval));
    sliderContainer?.addEventListener("mouseleave", restartSlideTimer);
  }

  function restartSlideTimer() {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => {
      updateSlider(currentSlide + 1);
    }, 6000);
  }

  /* ════════════════════════════════════════════════
     SIGN SECTION INTERACTIONS
  ════════════════════════════════════════════════ */
  const signStartBtn = $("sign-start-btn");
  signStartBtn?.addEventListener("click", () => {
    switchToSection("tasks-section");
    setTimeout(() => taskTitleInput.focus(), 500);
  });

  const signCards = $$(".sign-card");
  if (signCards.length >= 2) {
    signCards[0].addEventListener("click", () => {
      currentView = "today";
      setActiveTab("today");
      switchToSection("tasks-section");
      refresh();
    });
    signCards[1].addEventListener("click", () => {
      currentView = "upcoming";
      setActiveTab("upcoming");
      switchToSection("tasks-section");
      refresh();
    });
  }

  /* ════════════════════════════════════════════════
     RIPPLE EFFECT
  ════════════════════════════════════════════════ */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".btn-gold, .btn-forest, .ripple-host, .sign-card");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const diam = Math.max(rect.width, rect.height);
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${diam}px`;
    ripple.style.left = `${e.clientX - rect.left - diam / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - diam / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  /* ════════════════════════════════════════════════
     CURSOR FOLLOWER
  ════════════════════════════════════════════════ */
  const cursorDot  = $("cursor-dot");
  const cursorRing = $("cursor-ring");

  if (cursorDot && cursorRing && window.matchMedia("(pointer: fine)").matches) {
    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;

    window.addEventListener("mousemove", e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      document.body.classList.add("cursor-active");
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    }, { passive: true });

    window.addEventListener("mouseleave", () => {
      document.body.classList.remove("cursor-active");
    });

    function renderCursor() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    const hoverables = "a, button, input, select, textarea, .sector-card, .sign-card, .task-item, .st-button";
    document.addEventListener("mouseover", e => {
      if (e.target.closest(hoverables)) {
        cursorDot.classList.add("hovered");
        cursorRing.classList.add("hovered");
      }
    });
    document.addEventListener("mouseout", e => {
      if (e.target.closest(hoverables)) {
        cursorDot.classList.remove("hovered");
        cursorRing.classList.remove("hovered");
      }
    });
  }

  /* ════════════════════════════════════════════════
     MULTI-LAYER 3D MOUNTAIN PARALLAX
  ════════════════════════════════════════════════ */
  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("mousemove", e => {
      const cx = (e.clientX / window.innerWidth - 0.5) * 26;
      const cy = (e.clientY / window.innerHeight - 0.5) * 26;

      const bg  = document.getElementById("mtn-layer-bg");
      const mid = document.getElementById("mtn-layer-mid");
      const fg  = document.getElementById("mtn-layer-fg");

      if (bg)  bg.style.transform  = `translate3d(${cx * 0.35}px, ${cy * 0.35}px, -50px)`;
      if (mid) mid.style.transform = `translate3d(${cx * 0.75}px, ${cy * 0.75}px, -15px)`;
      if (fg)  fg.style.transform  = `translate3d(${cx * 1.35}px, ${cy * 1.35}px, 25px)`;

      const post = document.querySelector(".sign-post-wrap");
      if (post) post.style.transform = `translate3d(${-cx * 0.6}px, ${-cy * 0.6}px, 0)`;
    }, { passive: true });
  }

  /* ════════════════════════════════════════════════
     3D TILT ENGINE WITH SPECULAR GLARE
  ════════════════════════════════════════════════ */
  function init3DTilt() {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const tiltTargets = $$(".sector-card, .sign-card, .hero-mountain-wrap, .task-item, .task-add-card, .settings-card, .celebration-box");
    tiltTargets.forEach(card => {
      if (card.dataset.tiltInit) return;
      card.dataset.tiltInit = "1";
      card.classList.add("tilt-card-3d");

      let glare = card.querySelector(".card-glare");
      if (!glare) {
        glare = document.createElement("div");
        glare.className = "card-glare";
        card.appendChild(glare);
      }

      card.addEventListener("mousemove", e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        const rotateX = ((y - cy) / cy) * -6.5;
        const rotateY = ((x - cx) / cx) * 6.5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
        glare.style.background = `radial-gradient(circle at ${(x / rect.width * 100).toFixed(1)}% ${(y / rect.height * 100).toFixed(1)}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 65%)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      });
    });
  }

  /* ════════════════════════════════════════════════
     3D SUMMIT CELEBRATION & GOLDEN CONFETTI
  ════════════════════════════════════════════════ */
  function triggerSummitCelebration() {
    if (!summitModal) return;
    openModal(summitModal);
    announce("Summit Conquered! 100% of your route is complete today.");
    runGoldConfetti();
  }

  function runGoldConfetti() {
    if (!celebrationCanvas) return;
    const ctx = celebrationCanvas.getContext("2d");
    celebrationCanvas.width = window.innerWidth;
    celebrationCanvas.height = window.innerHeight;

    const colors = ["#EFB300", "#FFE277", "#FFF3BF", "#C99600", "#FFFFFF"];
    const particles = Array.from({ length: 85 }, () => ({
      x: Math.random() * celebrationCanvas.width,
      y: Math.random() * -celebrationCanvas.height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2.5,
      speedX: Math.random() * 2 - 1,
      rotation: Math.random() * 360,
      rotSpeed: Math.random() * 4 - 2
    }));

    let frameCount = 0;
    function renderConfetti() {
      ctx.clearRect(0, 0, celebrationCanvas.width, celebrationCanvas.height);
      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();

        if (p.y > celebrationCanvas.height) {
          p.y = -10;
          p.x = Math.random() * celebrationCanvas.width;
        }
      });

      frameCount++;
      if (frameCount < 280 && summitModal.classList.contains("open")) {
        requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, celebrationCanvas.width, celebrationCanvas.height);
      }
    }
    renderConfetti();
  }

  /* ════════════════════════════════════════════════
     3D ALPINE TOPOGRAPHY & SUMMIT SPARKS BACKGROUND CANVAS
  ════════════════════════════════════════════════ */
  function init3DBackgroundCanvas() {
    const canvas = document.getElementById("bg-3d-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Motion preference check
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (prefersReducedMotion.matches) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Interactive mouse tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let rawMouseX = -9999;
    let rawMouseY = -9999;

    window.addEventListener(
      "mousemove",
      (e) => {
        // Normalized -1 to 1
        targetMouseX = (e.clientX / width - 0.5) * 2;
        targetMouseY = (e.clientY / height - 0.5) * 2;
        rawMouseX = e.clientX;
        rawMouseY = e.clientY;
      },
      { passive: true }
    );

    // Scroll tracking for camera elevation
    let scrollY = 0;
    window.addEventListener(
      "scroll",
      () => {
        scrollY = window.scrollY;
      },
      { passive: true }
    );

    // 3D Grid Configuration for Mountain Topography
    const GRID_COLS = 26; // X resolution
    const GRID_ROWS = 22; // Z resolution
    const GRID_SPACING_X = 75;
    const GRID_SPACING_Z = 75;
    const TOTAL_WIDTH = (GRID_COLS - 1) * GRID_SPACING_X;
    const TOTAL_DEPTH = (GRID_ROWS - 1) * GRID_SPACING_Z;

    // Summit Starlight / Ember Particles
    const PARTICLE_COUNT = 45;
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * TOTAL_WIDTH * 1.2,
        y: Math.random() * 350 - 100,
        z: Math.random() * TOTAL_DEPTH + 100,
        size: Math.random() * 2.2 + 1.2,
        speedY: -(Math.random() * 0.45 + 0.2),
        speedX: (Math.random() - 0.5) * 0.25,
        phase: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.6 + 0.3
      });
    }

    let animId = null;
    let time = 0;
    let isRunning = true;

    // Projection constants
    const FOCAL_LENGTH = 450;
    const CAMERA_HEIGHT = -180; // Looking down on terrain
    const BASE_PITCH = 0.38; // Initial downward tilt angle in radians

    function render() {
      if (!isRunning) return;

      time += 0.016;

      // Smooth interpolation for mouse
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      ctx.clearRect(0, 0, width, height);

      const isDarkMode = document.documentElement.getAttribute("data-theme") === "dark";

      // Palette
      const gridStroke = isDarkMode ? "rgba(239, 179, 0, 0.12)" : "rgba(13, 53, 46, 0.075)";
      const ridgeStroke = isDarkMode ? "rgba(42, 96, 85, 0.16)" : "rgba(13, 53, 46, 0.04)";
      const summitGlow = isDarkMode ? "rgba(239, 179, 0, 0.25)" : "rgba(239, 179, 0, 0.18)";
      const particleColor = isDarkMode ? "rgba(255, 215, 0, " : "rgba(239, 179, 0, ";

      const centerX = width / 2;
      const centerY = height * 0.68 + mouseY * 35 - Math.min(scrollY * 0.08, 60);

      const pitch = BASE_PITCH + mouseY * 0.12;
      const yaw = mouseX * 0.15;

      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      const cosYaw = Math.cos(yaw);
      const sinYaw = Math.sin(yaw);

      // Project a 3D point (x, y, z) into 2D screen coordinates
      function project(x, y, z) {
        // Yaw rotation around Y axis
        const x1 = x * cosYaw - z * sinYaw;
        const z1 = z * cosYaw + x * sinYaw;

        // Pitch rotation around X axis (shifted by camera height)
        const yCam = y - CAMERA_HEIGHT;
        const y2 = yCam * cosPitch - z1 * sinPitch;
        const z2 = z1 * cosPitch + yCam * sinPitch + 280;

        if (z2 <= 20) return null; // Behind camera

        const scale = FOCAL_LENGTH / z2;
        return {
          px: centerX + x1 * scale,
          py: centerY + y2 * scale,
          scale: scale,
          z: z2
        };
      }

      // Calculate terrain vertices
      const points = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        const rowPoints = [];
        const zPos = r * GRID_SPACING_Z - TOTAL_DEPTH * 0.35;

        for (let c = 0; c < GRID_COLS; c++) {
          const xPos = (c - (GRID_COLS - 1) / 2) * GRID_SPACING_X;

          // Sinusoidal multi-octave alpine mountain topography
          const elev =
            Math.sin(xPos * 0.0032 + time * 0.35) * Math.cos(zPos * 0.0035 + time * 0.25) * 60 +
            Math.sin((xPos + zPos) * 0.0018 + time * 0.2) * 45 +
            Math.cos(xPos * 0.006 - time * 0.15) * 20;

          const p2d = project(xPos, -elev, zPos);
          rowPoints.push(p2d);
        }
        points.push(rowPoints);
      }

      // Render wireframe rows (contour lines)
      ctx.lineWidth = 1;
      for (let r = 0; r < GRID_ROWS; r++) {
        ctx.beginPath();
        let drawing = false;

        ctx.strokeStyle = r % 4 === 0 ? summitGlow : gridStroke;

        for (let c = 0; c < GRID_COLS; c++) {
          const pt = points[r][c];
          if (!pt) {
            drawing = false;
            continue;
          }
          if (!drawing) {
            ctx.moveTo(pt.px, pt.py);
            drawing = true;
          } else {
            ctx.lineTo(pt.px, pt.py);
          }
        }
        ctx.stroke();
      }

      // Render wireframe columns (ridges)
      ctx.strokeStyle = ridgeStroke;
      for (let c = 0; c < GRID_COLS; c += 2) {
        ctx.beginPath();
        let drawing = false;
        for (let r = 0; r < GRID_ROWS; r++) {
          const pt = points[r][c];
          if (!pt) {
            drawing = false;
            continue;
          }
          if (!drawing) {
            ctx.moveTo(pt.px, pt.py);
            drawing = true;
          } else {
            ctx.lineTo(pt.px, pt.py);
          }
        }
        ctx.stroke();
      }

      // Render Summit Sparks & Starlight Embers
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY;
        p.x += p.speedX;

        // Recycle if risen above top
        if (p.y < -380) {
          p.y = 150;
          p.x = (Math.random() - 0.5) * TOTAL_WIDTH * 1.2;
          p.z = Math.random() * TOTAL_DEPTH + 100;
        }

        const pt = project(p.x, p.y, p.z);
        if (!pt) continue;

        // Cursor repulsion physics
        const dx = pt.px - rawMouseX;
        const dy = pt.py - rawMouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130 && dist > 0) {
          const force = (130 - dist) / 130;
          p.x += (dx / dist) * force * 3.5;
          p.y += (dy / dist) * force * 3.5;
        }

        // Shimmer / Twinkle
        const shimmer = Math.sin(time * 3 + p.phase) * 0.35 + 0.65;
        const alpha = Math.min(1, Math.max(0.05, p.alpha * shimmer * pt.scale * 1.8));

        ctx.fillStyle = particleColor + alpha + ")";
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, Math.max(0.7, p.size * pt.scale * 1.5), 0, Math.PI * 2);
        ctx.fill();

        // Extra outer glow for larger sparks
        if (p.size > 2.2) {
          ctx.fillStyle = particleColor + alpha * 0.3 + ")";
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, p.size * pt.scale * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    }

    // Tab visibility handling
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        isRunning = false;
        if (animId) cancelAnimationFrame(animId);
      } else {
        isRunning = true;
        animId = requestAnimationFrame(render);
      }
    });

    animId = requestAnimationFrame(render);
  }

  /* ════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════ */
  applyTheme(isDark);
  taskDateInput.value = todayStr();
  setActiveTab("today");
  initSlider();
  init3DTilt();
  init3DBackgroundCanvas();
  refresh();

  // Initial scroll-reveal pass
  setTimeout(() => observeReveal(), 900);

  // Resize: update tab slider
  window.addEventListener("resize", () => {
    const active = document.querySelector(".view-tab.active");
    if (active) moveTabSlider(active);
  });

  /* ════════════════════════════════════════════════
     PWA SERVICE WORKER & OFFLINE RESILIENCE
  ════════════════════════════════════════════════ */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").then((reg) => {
        console.log("[PWA] ServiceWorker active with scope:", reg.scope);
      }).catch((err) => {
        console.info("[PWA] ServiceWorker skipped:", err);
      });
    });
  }

  // PWA Install Prompt
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (btnInstallApp) {
      btnInstallApp.classList.remove("hidden");
      btnInstallApp.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === "accepted") {
          toast("Summit Tasks installed! 🏔️");
        }
        deferredPrompt = null;
        btnInstallApp.classList.add("hidden");
      });
    }
  });

  // Offline / Online Detection
  function updateNetworkStatus() {
    const isOffline = !navigator.onLine;
    if (offlineBadge) {
      offlineBadge.classList.toggle("hidden", !isOffline);
    }
  }
  window.addEventListener("online", () => {
    updateNetworkStatus();
    toast("📡 Connection restored — all routes in sync!");
    announce("Online connection restored");
  });
  window.addEventListener("offline", () => {
    updateNetworkStatus();
    toast("📡 Offline mode active — all tasks safely saved locally.");
    announce("Offline mode active. All tasks safely saved locally.");
  });
  updateNetworkStatus();

});