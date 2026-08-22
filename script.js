/**
 * Taskflow — Emerald & Electric Violet Edition
 * Dynamic time greetings, radial progress ring, focus project cards, and full CRUD.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // DATA MODEL & STORAGE
    // ==========================================================================

    const STORAGE_KEYS = {
        TASKS: "taskflow_ev_tasks",
        PROJECTS: "taskflow_ev_projects",
        NOTES: "taskflow_ev_notes",
        THEME: "taskflow_ev_theme",
    };

    const defaultProjects = [
        { id: "proj-work", name: "Work & Career", color: "#10b981", icon: "fa-briefcase" },
        { id: "proj-learning", name: "Learning & Code", color: "#8b5cf6", icon: "fa-code" },
        { id: "proj-personal", name: "Personal Life", color: "#06b6d4", icon: "fa-user" },
        { id: "proj-side", name: "Side Projects", color: "#f59e0b", icon: "fa-rocket" }
    ];

    const defaultTasks = [
        {
            id: "task-1",
            title: "Submit quarterly project milestone report",
            description: "Include sprint velocity, key deliverables, and next roadmap milestones.",
            project: "proj-work",
            priority: "p1",
            dueDate: getFormattedDate(0), // Today
            tag: "urgent",
            starred: true,
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: "task-2",
            title: "Master Emerald & Electric Violet CSS design systems",
            description: "Build clean glassmorphic components, glowing orbs, and responsive grids.",
            project: "proj-learning",
            priority: "p2",
            dueDate: getFormattedDate(0), // Today
            tag: "dev",
            starred: true,
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: "task-3",
            title: "Plan weekend outdoor trail & camera gear",
            description: "Check weather forecast and prepare hydration pack.",
            project: "proj-personal",
            priority: "p3",
            dueDate: getFormattedDate(1), // Tomorrow
            tag: "general",
            starred: false,
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: "task-4",
            title: "Refactor task dashboard architecture & localStorage sync",
            description: "Verify state management and add undo toast notifications.",
            project: "proj-side",
            priority: "p2",
            dueDate: getFormattedDate(2),
            tag: "design",
            starred: false,
            completed: true,
            createdAt: new Date().toISOString()
        }
    ];

    const defaultNotes = [
        {
            id: "note-1",
            content: "💡 Project Idea: Build a lightweight habit tracker with visual streak counters.",
            date: "Today"
        },
        {
            id: "note-2",
            content: "📌 Books to read: Refactoring UI, Clean Code, Atomic Habits.",
            date: "Aug 22"
        },
        {
            id: "note-3",
            content: "✨ Design Tip: Emerald & Electric Violet create high-contrast, modern visual harmony.",
            date: "Aug 21"
        }
    ];

    // State
    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || defaultTasks;
    let projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS)) || defaultProjects;
    let notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES)) || defaultNotes;
    let isDarkMode = localStorage.getItem(STORAGE_KEYS.THEME) === "dark";

    let currentView = "today"; // 'inbox' | 'today' | 'upcoming' | 'starred' | 'completed' | 'notes' | projectId
    let currentPriorityFilter = "all";
    let currentTagFilter = "all";
    let searchQuery = "";
    let sortBy = "dueDate-asc";
    let isCompletedAccordionOpen = true;

    let lastDeletedTask = null;

    // ==========================================================================
    // DOM ELEMENTS
    // ==========================================================================

    const body = document.body;
    const themeToggle = document.getElementById("theme-toggle");
    const globalSearch = document.getElementById("global-search");
    const sidebarAddBtn = document.getElementById("sidebar-quick-add-btn");
    const projectsList = document.getElementById("projects-list");
    const tagsList = document.getElementById("tags-list");

    // Header & Hero Elements
    const headerDateText = document.getElementById("header-date-text");
    const heroGreetingText = document.getElementById("hero-greeting-text");
    const heroQuote = document.getElementById("hero-quote");
    const heroStatActive = document.getElementById("hero-stat-active");
    const heroStatDone = document.getElementById("hero-stat-done");
    const heroStatStatus = document.getElementById("hero-stat-status");
    const ringFill = document.getElementById("ring-fill");
    const ringPercent = document.getElementById("ring-percent");

    // Focus Cards Grid
    const focusCardsGrid = document.getElementById("focus-cards-grid");

    // Counters
    const countInbox = document.getElementById("count-inbox");
    const countToday = document.getElementById("count-today");
    const countUpcoming = document.getElementById("count-upcoming");
    const countStarred = document.getElementById("count-starred");
    const countCompleted = document.getElementById("count-completed");
    const countNotes = document.getElementById("count-notes");

    // Main Header
    const viewTitle = document.getElementById("view-title");
    const viewTaskBadge = document.getElementById("view-task-badge");
    const priorityFilter = document.getElementById("priority-filter");
    const sortFilter = document.getElementById("sort-filter");

    // Task Creator
    const taskInputTitle = document.getElementById("task-input-title");
    const taskInputDesc = document.getElementById("task-input-desc");
    const taskInputDate = document.getElementById("task-input-date");
    const taskInputPriority = document.getElementById("task-input-priority");
    const taskInputProject = document.getElementById("task-input-project");
    const taskInputTag = document.getElementById("task-input-tag");
    const submitInlineAdd = document.getElementById("submit-inline-add");
    const cancelInlineAdd = document.getElementById("cancel-inline-add");

    // Lists & Containers
    const paneTasksView = document.getElementById("pane-tasks-view");
    const paneNotesView = document.getElementById("pane-notes-view");
    const activeTasksList = document.getElementById("active-tasks-list");
    const completedTasksList = document.getElementById("completed-tasks-list");
    const completedSection = document.getElementById("completed-section");
    const completedToggleBtn = document.getElementById("completed-toggle-btn");
    const completedToggleArrow = document.getElementById("completed-toggle-arrow");
    const completedAccordionCount = document.getElementById("completed-accordion-count");
    const emptyState = document.getElementById("empty-state");
    const emptyStateMsg = document.getElementById("empty-state-msg");

    // Notes
    const notesGrid = document.getElementById("notes-grid");
    const btnAddNote = document.getElementById("btn-add-note");

    // Modals
    const editModal = document.getElementById("edit-modal");
    const editTaskForm = document.getElementById("edit-task-form");
    const editTaskId = document.getElementById("edit-task-id");
    const editTitle = document.getElementById("edit-title");
    const editDesc = document.getElementById("edit-desc");
    const editProject = document.getElementById("edit-project");
    const editPriority = document.getElementById("edit-priority");
    const editDate = document.getElementById("edit-date");
    const editTag = document.getElementById("edit-tag");
    const editModalClose = document.getElementById("edit-modal-close");
    const editModalCancel = document.getElementById("edit-modal-cancel");

    const projectModal = document.getElementById("project-modal");
    const projectForm = document.getElementById("project-form");
    const projectName = document.getElementById("project-name");
    const btnAddProject = document.getElementById("btn-add-project");
    const projectModalClose = document.getElementById("project-modal-close");
    const projectModalCancel = document.getElementById("project-modal-cancel");

    const toastBox = document.getElementById("toast-box");

    // Mobile Sidebar
    const sidebar = document.getElementById("sidebar");
    const sidebarBackdrop = document.getElementById("sidebar-backdrop");
    const mobileSidebarToggle = document.getElementById("mobile-sidebar-toggle");
    const mobileSidebarClose = document.getElementById("mobile-sidebar-close");

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================

    function init() {
        applyTheme(isDarkMode);
        populateProjectDropdowns();
        setupEventListeners();
        taskInputDate.value = getFormattedDate(0);
        refreshApp();
    }

    // ==========================================================================
    // REFRESH & RENDER
    // ==========================================================================

    function refreshApp() {
        renderSidebarProjects();
        renderHeroBanner();
        renderFocusCards();
        renderCounts();
        renderHeader();
        renderTasks();
        renderNotes();
    }

    function renderHeroBanner() {
        const now = new Date();
        const hour = now.getHours();

        let greeting = "Good Evening, Elesh! ✨";
        if (hour < 12) greeting = "Good Morning, Elesh! ☀️";
        else if (hour < 18) greeting = "Good Afternoon, Elesh! 🌤️";

        heroGreetingText.textContent = greeting;

        const dateStr = now.toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });
        headerDateText.textContent = dateStr;

        // Daily Progress Ring Calculations
        const todayStr = getFormattedDate(0);
        const todayTasks = tasks.filter(t => t.dueDate === todayStr);
        const todayTotal = todayTasks.length;
        const todayDone = todayTasks.filter(t => t.completed).length;
        const todayActive = todayTotal - todayDone;

        heroStatActive.textContent = `${todayActive} Active`;
        heroStatDone.textContent = `${todayDone} Done`;

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const overallPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        if (overallPercent >= 80) {
            heroStatStatus.textContent = "🚀 High Velocity";
        } else if (overallPercent >= 40) {
            heroStatStatus.textContent = "⚡ On Track";
        } else {
            heroStatStatus.textContent = "🌱 Starting Day";
        }

        // SVG Circle circumference is 2 * PI * 42 ~= 264
        const circumference = 264;
        const offset = circumference - (overallPercent / 100) * circumference;
        ringFill.style.strokeDashoffset = offset;
        ringPercent.textContent = `${overallPercent}%`;
    }

    function renderFocusCards() {
        focusCardsGrid.innerHTML = "";

        projects.forEach(proj => {
            const projTasks = tasks.filter(t => t.project === proj.id);
            const total = projTasks.length;
            const done = projTasks.filter(t => t.completed).length;
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;

            const card = document.createElement("div");
            card.className = "focus-card";
            card.style.setProperty("--card-color", proj.color);
            card.innerHTML = `
                <div class="focus-card-top">
                    <div class="focus-icon-box">
                        <i class="fa-solid ${proj.icon || 'fa-folder'}"></i>
                    </div>
                    <span class="focus-count-badge">${done}/${total} Done</span>
                </div>
                <div class="focus-card-body">
                    <h4>${proj.name}</h4>
                    <p>${total - done} active tasks</p>
                    <div class="focus-progress-track">
                        <div class="focus-progress-bar" style="width: ${percent}%;"></div>
                    </div>
                </div>
            `;

            card.addEventListener("click", () => {
                currentView = proj.id;
                switchPane("pane-tasks-view");
                updateNavStates();
                refreshApp();
            });

            focusCardsGrid.appendChild(card);
        });
    }

    function renderHeader() {
        if (currentView === "inbox") {
            viewTitle.textContent = "Inbox";
        } else if (currentView === "today") {
            viewTitle.textContent = "Today's Tasks";
        } else if (currentView === "upcoming") {
            viewTitle.textContent = "Upcoming Schedule";
        } else if (currentView === "starred") {
            viewTitle.textContent = "Important & High Priority";
        } else if (currentView === "completed") {
            viewTitle.textContent = "Completed Archive";
        } else if (currentView === "notes") {
            viewTitle.textContent = "Idea Board";
        } else {
            const proj = projects.find(p => p.id === currentView);
            viewTitle.textContent = proj ? `${proj.name} Tasks` : "Tasks";
        }
    }

    function populateProjectDropdowns() {
        const dropdowns = [taskInputProject, editProject];
        dropdowns.forEach(select => {
            if (!select) return;
            select.innerHTML = "";
            projects.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.id;
                opt.textContent = `# ${p.name}`;
                select.appendChild(opt);
            });
        });
    }

    function renderSidebarProjects() {
        projectsList.innerHTML = "";
        projects.forEach(proj => {
            const count = tasks.filter(t => t.project === proj.id && !t.completed).length;
            const btn = document.createElement("button");
            btn.className = `project-item-btn ${currentView === proj.id ? "active" : ""}`;
            btn.innerHTML = `
                <div class="project-left">
                    <span class="project-dot" style="background-color: ${proj.color};"></span>
                    <span>${proj.name}</span>
                </div>
                <span class="nav-count">${count}</span>
            `;
            btn.addEventListener("click", () => {
                currentView = proj.id;
                switchPane("pane-tasks-view");
                updateNavStates();
                refreshApp();
            });
            projectsList.appendChild(btn);
        });
    }

    function renderCounts() {
        const todayStr = getFormattedDate(0);

        const inboxCount = tasks.filter(t => (!t.project || t.project === "inbox") && !t.completed).length;
        const todayCount = tasks.filter(t => t.dueDate === todayStr && !t.completed).length;
        const upcomingCount = tasks.filter(t => t.dueDate > todayStr && !t.completed).length;
        const starredCount = tasks.filter(t => t.starred && !t.completed).length;
        const completedCount = tasks.filter(t => t.completed).length;

        countInbox.textContent = inboxCount;
        countToday.textContent = todayCount;
        countUpcoming.textContent = upcomingCount;
        countStarred.textContent = starredCount;
        countCompleted.textContent = completedCount;
        countNotes.textContent = notes.length;
    }

    // ==========================================================================
    // RENDER TASKS (Active & Completed)
    // ==========================================================================

    function renderTasks() {
        activeTasksList.innerHTML = "";
        completedTasksList.innerHTML = "";

        let filtered = [...tasks];
        const todayStr = getFormattedDate(0);

        // View Filtering
        if (currentView === "inbox") {
            filtered = filtered.filter(t => !t.project || t.project === "inbox");
        } else if (currentView === "today") {
            filtered = filtered.filter(t => t.dueDate === todayStr);
        } else if (currentView === "upcoming") {
            filtered = filtered.filter(t => t.dueDate > todayStr);
        } else if (currentView === "starred") {
            filtered = filtered.filter(t => t.starred);
        } else if (currentView === "completed") {
            filtered = filtered.filter(t => t.completed);
        } else if (currentView !== "notes") {
            filtered = filtered.filter(t => t.project === currentView);
        }

        // Priority Filter
        if (currentPriorityFilter !== "all") {
            filtered = filtered.filter(t => t.priority === currentPriorityFilter);
        }

        // Tag Filter
        if (currentTagFilter !== "all") {
            filtered = filtered.filter(t => t.tag === currentTagFilter);
        }

        // Search Filter
        if (searchQuery.trim() !== "") {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(q) ||
                (t.description && t.description.toLowerCase().includes(q))
            );
        }

        // Sorting
        filtered.sort((a, b) => {
            if (sortBy === "dueDate-asc") return (a.dueDate || "9999") > (b.dueDate || "9999") ? 1 : -1;
            if (sortBy === "priority-desc") {
                const map = { p1: 4, p2: 3, p3: 2, p4: 1 };
                return (map[b.priority] || 0) - (map[a.priority] || 0);
            }
            if (sortBy === "title-asc") return a.title.localeCompare(b.title);
            if (sortBy === "created-desc") return new Date(b.createdAt) - new Date(a.createdAt);
            return 0;
        });

        const activeList = filtered.filter(t => !t.completed);
        const completedList = filtered.filter(t => t.completed);

        viewTaskBadge.textContent = `${activeList.length} task${activeList.length === 1 ? "" : "s"}`;

        // Empty state check
        if (activeList.length === 0 && (currentView === "completed" ? completedList.length === 0 : true)) {
            emptyState.classList.remove("hidden");
            if (currentView === "completed") {
                emptyStateMsg.textContent = "No completed tasks yet. Mark tasks done to see them archived here!";
            } else {
                emptyStateMsg.textContent = "Great job! Enjoy your time or capture a new task above.";
            }
        } else {
            emptyState.classList.add("hidden");
        }

        // Render Active Tasks
        activeList.forEach(task => {
            const row = createTaskRow(task);
            activeTasksList.appendChild(row);
        });

        // Render Completed Tasks
        if (currentView !== "completed" && completedList.length > 0) {
            completedSection.style.display = "block";
            completedAccordionCount.textContent = completedList.length;
            completedList.forEach(task => {
                const row = createTaskRow(task);
                completedTasksList.appendChild(row);
            });
        } else {
            completedSection.style.display = "none";
        }
    }

    function createTaskRow(task) {
        const li = document.createElement("li");
        li.className = `task-row ${task.completed ? "completed" : ""}`;
        li.dataset.id = task.id;

        const proj = projects.find(p => p.id === task.project) || { name: "Inbox", color: "#10b981" };
        li.style.setProperty("--task-project-color", proj.color);

        const dueDateInfo = formatDue(task.dueDate);

        li.innerHTML = `
            <div class="task-row-left">
                <button class="check-circle ${task.priority || 'p4'}" aria-label="Complete task">
                    <i class="fa-solid fa-check"></i>
                </button>
                <div class="task-content">
                    <span class="task-text">${escapeHTML(task.title)}</span>
                    ${task.description ? `<p class="task-desc-text">${escapeHTML(task.description)}</p>` : ""}
                    <div class="task-chips">
                        <span class="meta-pill">
                            <span class="project-dot" style="background-color: ${proj.color};"></span>
                            ${proj.name}
                        </span>
                        ${task.dueDate ? `
                            <span class="meta-pill ${dueDateInfo.className}">
                                <i class="fa-regular fa-calendar"></i> ${dueDateInfo.text}
                            </span>
                        ` : ""}
                        ${task.priority && task.priority !== "p4" ? `
                            <span class="meta-pill priority-${task.priority}">
                                ${task.priority.toUpperCase()}
                            </span>
                        ` : ""}
                        ${task.tag && task.tag !== "general" ? `
                            <span class="meta-pill">#${task.tag}</span>
                        ` : ""}
                    </div>
                </div>
            </div>
            <div class="task-row-actions">
                <button class="row-action-btn btn-star ${task.starred ? "starred" : ""}" title="Star task">
                    <i class="${task.starred ? "fa-solid fa-star" : "fa-regular fa-star"}"></i>
                </button>
                <button class="row-action-btn btn-edit" title="Edit task">
                    <i class="fa-regular fa-pen-to-square"></i>
                </button>
                <button class="row-action-btn btn-delete" title="Delete task">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;

        // Action Listeners
        li.querySelector(".check-circle").addEventListener("click", () => toggleTaskComplete(task.id));
        li.querySelector(".btn-star").addEventListener("click", () => toggleTaskStar(task.id));
        li.querySelector(".btn-edit").addEventListener("click", () => openEditModal(task.id));
        li.querySelector(".btn-delete").addEventListener("click", () => deleteTask(task.id));

        return li;
    }

    // ==========================================================================
    // NOTES WALL
    // ==========================================================================

    function renderNotes() {
        notesGrid.innerHTML = "";
        notes.forEach(note => {
            const card = document.createElement("div");
            card.className = "note-card";
            card.innerHTML = `
                <textarea class="note-textarea" rows="5">${escapeHTML(note.content)}</textarea>
                <div class="note-footer">
                    <span>${note.date || "Note"}</span>
                    <button class="note-delete-btn" title="Delete note">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;

            const textarea = card.querySelector(".note-textarea");
            textarea.addEventListener("input", () => {
                note.content = textarea.value;
                saveNotes();
            });

            card.querySelector(".note-delete-btn").addEventListener("click", () => {
                notes = notes.filter(n => n.id !== note.id);
                saveNotes();
                renderNotes();
                renderCounts();
                showToast("Note removed");
            });

            notesGrid.appendChild(card);
        });
    }

    // ==========================================================================
    // TASK CRUD LOGIC
    // ==========================================================================

    function addTask(title, desc = "", project = "proj-work", priority = "p2", dueDate = "", tag = "general") {
        if (!title.trim()) return;

        const newTask = {
            id: `task-${Date.now()}`,
            title: title.trim(),
            description: desc.trim(),
            project: project || (projects[0] ? projects[0].id : "proj-work"),
            priority: priority || "p2",
            dueDate: dueDate || getFormattedDate(0),
            tag: tag || "general",
            starred: false,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask);
        saveTasks();
        refreshApp();
        showToast("Task added to your list ✨");
    }

    function toggleTaskComplete(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        saveTasks();
        refreshApp();
        showToast(task.completed ? "Task completed! 🎉" : "Task restored to active");
    }

    function toggleTaskStar(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        task.starred = !task.starred;
        saveTasks();
        refreshApp();
        showToast(task.starred ? "Marked as Important ⭐" : "Removed from Important");
    }

    function deleteTask(id) {
        const idx = tasks.findIndex(t => t.id === id);
        if (idx === -1) return;

        lastDeletedTask = tasks[idx];
        tasks.splice(idx, 1);
        saveTasks();
        refreshApp();

        showToast("Task deleted", true, () => {
            if (lastDeletedTask) {
                tasks.push(lastDeletedTask);
                saveTasks();
                refreshApp();
                lastDeletedTask = null;
                showToast("Task restored");
            }
        });
    }

    function openEditModal(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        editTaskId.value = task.id;
        editTitle.value = task.title;
        editDesc.value = task.description || "";
        editProject.value = task.project;
        editPriority.value = task.priority || "p2";
        editDate.value = task.dueDate || "";
        editTag.value = task.tag || "general";

        openModal(editModal);
    }

    function saveEditedTask(id, title, desc, project, priority, dueDate, tag) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        task.title = title.trim();
        task.description = desc.trim();
        task.project = project;
        task.priority = priority;
        task.dueDate = dueDate;
        task.tag = tag;

        saveTasks();
        refreshApp();
        showToast("Task updated successfully!");
    }

    function addProject(name, color) {
        if (!name.trim()) return;

        const icons = ["fa-briefcase", "fa-code", "fa-user", "fa-rocket", "fa-palette", "fa-heart"];
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];

        const newProj = {
            id: `proj-${Date.now()}`,
            name: name.trim(),
            color: color || "#10b981",
            icon: randomIcon
        };

        projects.push(newProj);
        saveProjects();
        populateProjectDropdowns();
        renderSidebarProjects();
        renderFocusCards();
        showToast(`Project #${newProj.name} created!`);
    }

    function addNote() {
        const newNote = {
            id: `note-${Date.now()}`,
            content: "",
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
        };
        notes.unshift(newNote);
        saveNotes();
        renderNotes();
        renderCounts();
        showToast("New note created");
    }

    // ==========================================================================
    // VIEW CONTROLS & THEME
    // ==========================================================================

    function switchPane(paneId) {
        [paneTasksView, paneNotesView].forEach(p => p.classList.remove("active"));
        const target = document.getElementById(paneId);
        if (target) target.classList.add("active");
    }

    function updateNavStates() {
        document.querySelectorAll(".nav-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.view === currentView);
        });
        document.querySelectorAll(".project-item-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.view === currentView);
        });
    }

    function applyTheme(dark) {
        isDarkMode = dark;
        body.classList.toggle("dark-mode", isDarkMode);
        const icon = themeToggle.querySelector("i");
        if (icon) {
            icon.className = isDarkMode ? "fa-solid fa-sun" : "fa-solid fa-moon";
        }
        localStorage.setItem(STORAGE_KEYS.THEME, isDarkMode ? "dark" : "light");
    }

    function openModal(modal) {
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
    }

    function closeModal(modal) {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
    }

    function showToast(msg, allowUndo = false, undoCb = null) {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = `
            <span>${msg}</span>
            ${allowUndo ? `<button class="btn btn-sm" style="color: #34d399; padding: 2px 4px;" id="toast-undo">Undo</button>` : ""}
        `;

        if (allowUndo && undoCb) {
            toast.querySelector("#toast-undo").addEventListener("click", () => {
                undoCb();
                toast.remove();
            });
        }

        toastBox.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("toast-out");
            setTimeout(() => toast.remove(), 250);
        }, 3200);
    }

    // ==========================================================================
    // EVENT LISTENERS
    // ==========================================================================

    function setupEventListeners() {
        // Theme Toggle
        themeToggle.addEventListener("click", () => applyTheme(!isDarkMode));

        // Global Search
        globalSearch.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderTasks();
        });

        // Quick Add Focus
        sidebarAddBtn.addEventListener("click", () => {
            taskInputTitle.focus();
            window.scrollTo({ top: 320, behavior: "smooth" });
        });

        // Inline Add Task
        submitInlineAdd.addEventListener("click", handleInlineAdd);
        taskInputTitle.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleInlineAdd();
        });

        cancelInlineAdd.addEventListener("click", () => {
            taskInputTitle.value = "";
            taskInputDesc.value = "";
        });

        function handleInlineAdd() {
            const title = taskInputTitle.value;
            if (!title.trim()) return;

            addTask(
                title,
                taskInputDesc.value,
                taskInputProject.value,
                taskInputPriority.value,
                taskInputDate.value || getFormattedDate(0),
                taskInputTag.value
            );

            taskInputTitle.value = "";
            taskInputDesc.value = "";
            taskInputTitle.focus();
        }

        // Nav Buttons (Inbox, Today, Upcoming, Starred, Completed, Notes)
        document.querySelectorAll(".nav-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                currentView = btn.dataset.view;
                updateNavStates();

                if (currentView === "notes") {
                    switchPane("pane-notes-view");
                } else {
                    switchPane("pane-tasks-view");
                }

                sidebar.classList.remove("open");
                sidebarBackdrop.classList.remove("active");
                refreshApp();
            });
        });

        // Tags Filter
        tagsList.querySelectorAll(".tag-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                tagsList.querySelectorAll(".tag-chip").forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                currentTagFilter = chip.dataset.tag;
                renderTasks();
            });
        });

        // Priority Dropdown Filter
        priorityFilter.addEventListener("change", (e) => {
            currentPriorityFilter = e.target.value;
            renderTasks();
        });

        // Sort Filter
        sortFilter.addEventListener("change", (e) => {
            sortBy = e.target.value;
            renderTasks();
        });

        // Completed Accordion Toggle
        completedToggleBtn.addEventListener("click", () => {
            isCompletedAccordionOpen = !isCompletedAccordionOpen;
            completedTasksList.classList.toggle("hidden", !isCompletedAccordionOpen);
            completedToggleArrow.classList.toggle("open", isCompletedAccordionOpen);
        });

        // Notes Wall
        btnAddNote.addEventListener("click", addNote);

        // Edit Modal Submit
        editTaskForm.addEventListener("submit", (e) => {
            e.preventDefault();
            saveEditedTask(
                editTaskId.value,
                editTitle.value,
                editDesc.value,
                editProject.value,
                editPriority.value,
                editDate.value,
                editTag.value
            );
            closeModal(editModal);
        });

        editModalClose.addEventListener("click", () => closeModal(editModal));
        editModalCancel.addEventListener("click", () => closeModal(editModal));

        // Add Project Modal Submit
        btnAddProject.addEventListener("click", () => openModal(projectModal));
        projectModalClose.addEventListener("click", () => closeModal(projectModal));
        projectModalCancel.addEventListener("click", () => closeModal(projectModal));

        projectForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const color = projectForm.querySelector("input[name='proj-color']:checked").value;
            addProject(projectName.value, color);
            projectName.value = "";
            closeModal(projectModal);
        });

        // Mobile Sidebar Controls
        mobileSidebarToggle.addEventListener("click", () => {
            sidebar.classList.add("open");
            sidebarBackdrop.classList.add("active");
        });

        mobileSidebarClose.addEventListener("click", () => {
            sidebar.classList.remove("open");
            sidebarBackdrop.classList.remove("active");
        });

        sidebarBackdrop.addEventListener("click", () => {
            sidebar.classList.remove("open");
            sidebarBackdrop.classList.remove("active");
        });

        // Keyboard Shortcuts
        window.addEventListener("keydown", (e) => {
            if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
                e.preventDefault();
                globalSearch.focus();
            }
            if ((e.key === "n" || e.key === "N") && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
                e.preventDefault();
                taskInputTitle.focus();
            }
            if (e.key === "Escape") {
                closeModal(editModal);
                closeModal(projectModal);
            }
        });
    }

    // ==========================================================================
    // PERSISTENCE & HELPERS
    // ==========================================================================

    function saveTasks() {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }

    function saveProjects() {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    }

    function saveNotes() {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    }

    function getFormattedDate(offsetDays = 0) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split("T")[0];
    }

    function formatDue(dateStr) {
        if (!dateStr) return { text: "", className: "" };
        const today = getFormattedDate(0);
        const tomorrow = getFormattedDate(1);

        if (dateStr < today) {
            return { text: "Overdue", className: "overdue" };
        } else if (dateStr === today) {
            return { text: "Today", className: "today" };
        } else if (dateStr === tomorrow) {
            return { text: "Tomorrow", className: "" };
        } else {
            const d = new Date(dateStr + "T00:00:00");
            return { text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), className: "" };
        }
    }

    function escapeHTML(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    init();
});