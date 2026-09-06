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

  let tasks    = JSON.parse(localStorage.getItem(K.TASKS)) || DEF_TASKS;
  let projects = JSON.parse(localStorage.getItem(K.PROJS)) || DEF_PROJECTS;
  let notes    = JSON.parse(localStorage.getItem(K.NOTES)) || DEF_NOTES;
  let isDark   = localStorage.getItem(K.THEME) === "dark";

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
  window.addEventListener("scroll", () => {
    // Navbar scroll shadow
    navbar.classList.toggle("scrolled", window.scrollY > 20);
    // Scroll to top button
    scrollTopBtn.classList.toggle("show", window.scrollY > 500);
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
    $$(".scroll-reveal").forEach(el => revealObserver.observe(el));
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

    const offset = 264 - (pct / 100) * 264;
    if (ringFill) ringFill.style.strokeDashoffset = offset;
    if (ringPct)  ringPct.textContent = pct + "%";
    if (ctaRing)  ctaRing.style.strokeDashoffset = offset;
    if (ctaPct)   ctaPct.textContent = pct + "%";
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
        : "No tasks here. Add one above to begin your ascent.";
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
        <p class="task-name">${esc(task.title)}</p>
        ${task.description ? `<p class="task-note">${esc(task.description)}</p>` : ""}
        <div class="task-chips-row">
          <span class="t-chip known-badge ${prioCls[task.priority] || "priority-p4"}">${prioLabels[task.priority] || ""}</span>
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
    li.querySelectorAll(".t-action").forEach(btn => {
      btn.addEventListener("click", () => {
        const act = btn.dataset.act;
        if (act === "star")   toggleStar(task.id);
        if (act === "edit")   openEditModal(task.id);
        if (act === "delete") deleteTask(task.id);
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
     TASK CRUD
  ════════════════════════════════════════════════ */
  function addTask(title, desc, projId, prio, dueDate, tag) {
    if (!title.trim()) return false;
    tasks.unshift({
      id: "t" + Date.now(),
      title: title.trim(),
      description: desc.trim(),
      project: projId || projects[0]?.id || "",
      priority: prio || "p2",
      dueDate: dueDate || todayStr(),
      tag: tag || "general",
      starred: false, completed: false,
      createdAt: new Date().toISOString()
    });
    save(K.TASKS, tasks);
    refresh();
    return true;
  }

  function toggleDone(id) {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    t.completed = !t.completed;
    save(K.TASKS, tasks);
    refresh();
    toast(t.completed ? "Task summited! ▲" : "Back on the trail");
  }

  function toggleStar(id) {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    t.starred = !t.starred;
    save(K.TASKS, tasks);
    refresh();
    toast(t.starred ? "Priority flag set" : "Flag removed");
  }

  function deleteTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx < 0) return;
    lastDeleted = tasks[idx];
    tasks.splice(idx, 1);
    save(K.TASKS, tasks);
    refresh();
    toast("Task removed", true, () => {
      tasks.push(lastDeleted);
      lastDeleted = null;
      save(K.TASKS, tasks);
      refresh();
      toast("Task restored");
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
    if (!name.trim()) return;
    const p = { id: "proj-" + Date.now(), name: name.trim(), color: color || "#0D352E" };
    projects.push(p);
    save(K.PROJS, projects);
    populateProjectDropdowns();
    refresh();
    toast(`Sector "${p.name}" created`);
  }

  /* ════════════════════════════════════════════════
     MODALS
  ════════════════════════════════════════════════ */
  function openModal(el)  { el.classList.add("open"); el.setAttribute("aria-hidden","false"); }
  function closeModal(el) { el.classList.remove("open"); el.setAttribute("aria-hidden","true"); }

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
  function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
  function esc(s) {
    if (!s) return "";
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
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

  // Search (both bars)
  [globalSearch, mobileSearch].forEach(inp => {
    inp?.addEventListener("input", e => { searchQuery = e.target.value; renderTasks(); });
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
    notes.unshift({ id:"n"+Date.now(), content:"", label:"New note" });
    save(K.NOTES, notes);
    renderNotes();
    toast("New trail note added");
  });

  // Keyboard shortcuts
  window.addEventListener("keydown", e => {
    if (["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) return;
    if (e.key === "n" || e.key === "N") { e.preventDefault(); switchToSection("tasks-section"); setTimeout(() => taskTitleInput.focus(), 500); }
    if (e.key === "/")                  { e.preventDefault(); globalSearch.focus(); }
    if (e.key === "Escape")             { closeModal(editModal); closeModal(sectorModal); mobileMenu.classList.remove("open"); hamburgerBtn.classList.remove("open"); }
  });

  /* ════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════ */
  applyTheme(isDark);
  taskDateInput.value = todayStr();
  setActiveTab("today");
  refresh();

  // Initial scroll-reveal pass
  setTimeout(() => observeReveal(), 900);

  // Resize: update tab slider
  window.addEventListener("resize", () => {
    const active = document.querySelector(".view-tab.active");
    if (active) moveTabSlider(active);
  });

});