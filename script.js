/**
 * DXM.SPACE — TASK ENGINE // MISSION CONTROL
 * Interactive Starfield, Synthesizer Audio, Telemetry Gauge, and Full Task Management.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // DATA MODEL & STORAGE
    // ==========================================================================

    const STORAGE_KEYS = {
        TASKS: "dxm_space_tasks",
        PROJECTS: "dxm_space_projects",
        NOTES: "dxm_space_notes",
        THEME: "dxm_space_theme",
        AUDIO: "dxm_space_audio_enabled"
    };

    const defaultProjects = [
        { id: "proj-ai", name: "Deep Space AI", color: "#762aff", icon: "fa-robot" },
        { id: "proj-orbit", name: "Orbital Web", color: "#3b82f6", icon: "fa-satellite" },
        { id: "proj-brand", name: "Brand Trajectory", color: "#00e5ff", icon: "fa-meteor" },
        { id: "proj-ops", name: "Station Ops", color: "#10b981", icon: "fa-shield-halved" }
    ];

    const defaultTasks = [
        {
            id: "task-1",
            title: "Calibrate neural telemetry sensors for Station Alpha",
            description: "Verify synchronization on quantum downlink and test redundant signal relays.",
            project: "proj-ai",
            priority: "p1",
            dueDate: getFormattedDate(0), // Today
            tag: "urgent",
            starred: true,
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: "task-2",
            title: "Deploy dxm.space cybernetic design tokens to production",
            description: "Validate shiny borders, shooting star speed-lines, and responsive glass cards.",
            project: "proj-orbit",
            priority: "p2",
            dueDate: getFormattedDate(0), // Today
            tag: "dev",
            starred: true,
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: "task-3",
            title: "Review interstellar brand guidelines & typography",
            description: "Finalize Poppins bold italic uppercase headline scales and gradient fills.",
            project: "proj-brand",
            priority: "p3",
            dueDate: getFormattedDate(1), // Tomorrow
            tag: "design",
            starred: false,
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: "task-4",
            title: "Conduct routine propulsion & orbital alignment check",
            description: "Inspect thrust output and confirm zero drift across operational sectors.",
            project: "proj-ops",
            priority: "p2",
            dueDate: getFormattedDate(2),
            tag: "work",
            starred: false,
            completed: true,
            createdAt: new Date().toISOString()
        }
    ];

    const defaultNotes = [
        {
            id: "note-1",
            content: "✦ TRANSMISSION LOG: Quantum latency reduced to 1.2ms across all regional relay clusters.",
            date: "EARTH TIME"
        },
        {
            id: "note-2",
            content: "💡 CONCEPT: Implement dynamic gravitational inertia scrolling for high-velocity mission lists.",
            date: "SEP 06"
        },
        {
            id: "note-3",
            content: "🚀 PROTOCOL: Keep task trajectories focused, actionable, and aligned with orbital milestones.",
            date: "SEP 05"
        }
    ];

    // State
    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || defaultTasks;
    let projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS)) || defaultProjects;
    let notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES)) || defaultNotes;
    let isLightMode = localStorage.getItem(STORAGE_KEYS.THEME) === "light";
    let isAudioPlaying = localStorage.getItem(STORAGE_KEYS.AUDIO) === "true";

    let currentView = "today"; // 'inbox' | 'today' | 'upcoming' | 'starred' | 'completed' | 'notes' | projectId
    let currentPriorityFilter = "all";
    let currentTagFilter = "all";
    let searchQuery = "";
    let sortBy = "dueDate-asc";
    let isCompletedAccordionOpen = true;

    let lastDeletedTask = null;

    // Web Audio Synthesizer Context
    let audioCtx = null;
    let ambientDroneGain = null;

    // ==========================================================================
    // DOM ELEMENTS
    // ==========================================================================

    const body = document.body;
    const themeToggle = document.getElementById("theme-toggle");
    const musicPlayBtn = document.getElementById("music-play");
    const globalSearch = document.getElementById("global-search");
    const sidebarAddBtn = document.getElementById("sidebar-quick-add-btn");
    const projectsList = document.getElementById("projects-list");
    const tagsList = document.getElementById("tags-list");

    // Header & Telemetry
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
    // STARFIELD PARTICLE ENGINE
    // ==========================================================================

    function initStarfield() {
        const canvas = document.getElementById("starfield-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        window.addEventListener("resize", () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            stars = createStars(numStars);
        });

        const numStars = Math.min(Math.floor((width * height) / 3000), 220);
        
        function createStars(count) {
            const arr = [];
            for (let i = 0; i < count; i++) {
                arr.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 1.4 + 0.3,
                    alpha: Math.random() * 0.8 + 0.2,
                    speed: Math.random() * 0.25 + 0.05,
                    twinkleSpeed: Math.random() * 0.02 + 0.005,
                    twinkleDirection: Math.random() > 0.5 ? 1 : -1,
                    hue: Math.random() > 0.8 ? 260 : Math.random() > 0.6 ? 210 : 0 // slight purple/blue tint
                });
            }
            return arr;
        }

        let stars = createStars(numStars);

        function renderStarfield() {
            ctx.clearRect(0, 0, width, height);

            stars.forEach((star) => {
                // Movement
                star.y += star.speed;
                if (star.y > height) {
                    star.y = 0;
                    star.x = Math.random() * width;
                }

                // Twinkle
                star.alpha += star.twinkleSpeed * star.twinkleDirection;
                if (star.alpha > 0.95) {
                    star.alpha = 0.95;
                    star.twinkleDirection = -1;
                } else if (star.alpha < 0.2) {
                    star.alpha = 0.2;
                    star.twinkleDirection = 1;
                }

                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                if (star.hue > 0) {
                    ctx.fillStyle = `hsla(${star.hue}, 90%, 75%, ${star.alpha})`;
                } else {
                    ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
                }
                ctx.fill();
            });

            requestAnimationFrame(renderStarfield);
        }

        renderStarfield();
    }

    // ==========================================================================
    // COSMIC WEB AUDIO SYNTHESIZER (dxm.space Equalizer Player)
    // ==========================================================================

    function initAudio() {
        if (isAudioPlaying) {
            musicPlayBtn.classList.add("playing");
        }
    }

    function toggleCosmicAudio() {
        try {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
            }

            if (audioCtx.state === "suspended") {
                audioCtx.resume();
            }

            isAudioPlaying = !isAudioPlaying;
            localStorage.setItem(STORAGE_KEYS.AUDIO, isAudioPlaying);

            if (isAudioPlaying) {
                musicPlayBtn.classList.add("playing");
                startAmbientDrone();
                showToast("✦ AUDIO SYNTHESIZER: ONLINE");
            } else {
                musicPlayBtn.classList.remove("playing");
                stopAmbientDrone();
                showToast("✦ AUDIO SYNTHESIZER: MUTED");
            }
        } catch (e) {
            console.warn("Audio Context error:", e);
        }
    }

    function startAmbientDrone() {
        if (!audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const filter = audioCtx.createBiquadFilter();
            ambientDroneGain = audioCtx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(55, audioCtx.currentTime); // Deep space A1 drone

            filter.type = "lowpass";
            filter.frequency.setValueAtTime(220, audioCtx.currentTime);

            ambientDroneGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
            ambientDroneGain.gain.exponentialRampToValueAtTime(0.04, audioCtx.currentTime + 2);

            osc.connect(filter);
            filter.connect(ambientDroneGain);
            ambientDroneGain.connect(audioCtx.destination);

            osc.start();
        } catch (e) {
            console.warn("Drone audio error", e);
        }
    }

    function stopAmbientDrone() {
        if (ambientDroneGain && audioCtx) {
            try {
                ambientDroneGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
            } catch (e) {
                // ignore
            }
        }
    }

    function playCyberChime(frequency = 587.33, duration = 0.3) {
        if (!isAudioPlaying) return;
        try {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
            }
            if (audioCtx.state === "suspended") audioCtx.resume();

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // ignore
        }
    }

    // ==========================================================================
    // INITIALIZATION & REFRESH
    // ==========================================================================

    function init() {
        applyTheme(isLightMode);
        initStarfield();
        initAudio();
        populateProjectDropdowns();
        setupEventListeners();
        taskInputDate.value = getFormattedDate(0);
        refreshApp();
    }

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
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        headerDateText.textContent = `EARTH TIME // ${year}.${month}.${day}`;

        const hour = now.getHours();
        let greeting = "WELCOME ABOARD, ELESH";
        if (hour < 12) greeting = "MORNING TRAJECTORY // STATION ALPHA";
        else if (hour < 18) greeting = "AFTERNOON ORBIT // STATION ALPHA";
        else greeting = "EVENING VECTORS // STATION ALPHA";

        heroGreetingText.textContent = greeting;

        // Telemetry Calculations
        const todayStr = getFormattedDate(0);
        const todayTasks = tasks.filter(t => t.dueDate === todayStr);
        const todayTotal = todayTasks.length;
        const todayDone = todayTasks.filter(t => t.completed).length;
        const todayActive = todayTotal - todayDone;

        heroStatActive.textContent = `${todayActive} ACTIVE MISSIONS`;
        heroStatDone.textContent = `${todayDone} LOGGED`;

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        if (percent >= 80) {
            heroStatStatus.textContent = "WARP VELOCITY // OPTIMAL";
        } else if (percent >= 40) {
            heroStatStatus.textContent = "CRUISING VELOCITY";
        } else {
            heroStatStatus.textContent = "LAUNCH READINESS";
        }

        // SVG Radial Progress Ring (Circumference 264)
        const circumference = 264;
        const offset = circumference - (percent / 100) * circumference;
        ringFill.style.strokeDashoffset = offset;
        ringPercent.textContent = `${percent}%`;
    }

    function renderFocusCards() {
        focusCardsGrid.innerHTML = "";

        projects.forEach(proj => {
            const projTasks = tasks.filter(t => t.project === proj.id);
            const total = projTasks.length;
            const done = projTasks.filter(t => t.completed).length;
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;

            const card = document.createElement("div");
            card.className = "focus-card card-border shiny-top";
            card.style.setProperty("--card-color", proj.color);
            card.innerHTML = `
                <div class="focus-card-top">
                    <div class="focus-icon-box">
                        <i class="fa-solid ${proj.icon || 'fa-satellite'}"></i>
                    </div>
                    <span class="focus-count-badge">${done}/${total} LOGGED</span>
                </div>
                <div class="focus-card-body">
                    <h4>${proj.name}</h4>
                    <p>${total - done} active mission trajectories</p>
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
            viewTitle.textContent = "SIGNAL INBOX // UNFILTERED";
        } else if (currentView === "today") {
            viewTitle.textContent = "CURRENT ORBIT MISSIONS";
        } else if (currentView === "upcoming") {
            viewTitle.textContent = "FORWARD TRAJECTORY HORIZON";
        } else if (currentView === "starred") {
            viewTitle.textContent = "CRITICAL PRIORITY THRUST";
        } else if (currentView === "completed") {
            viewTitle.textContent = "ARCHIVED MISSION LOGS";
        } else if (currentView === "notes") {
            viewTitle.textContent = "TRANSMISSIONS & NOTES";
        } else {
            const proj = projects.find(p => p.id === currentView);
            viewTitle.textContent = proj ? `${proj.name.toUpperCase()} // SECTOR LOG` : "MISSION LOG";
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
                opt.textContent = `✦ ${p.name.toUpperCase()}`;
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
                    <span class="project-dot" style="background-color: ${proj.color}; color: ${proj.color};"></span>
                    <span>${proj.name.toUpperCase()}</span>
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

        viewTaskBadge.textContent = `${activeList.length} MISSION${activeList.length === 1 ? "" : "S"}`;

        if (activeList.length === 0 && (currentView === "completed" ? completedList.length === 0 : true)) {
            emptyState.classList.remove("hidden");
            if (currentView === "completed") {
                emptyStateMsg.textContent = "Mission logs empty. Complete active trajectories to log them.";
            } else {
                emptyStateMsg.textContent = "All orbital trajectories clear. Transmit a new mission above.";
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
        li.className = `task-row shiny-top ${task.completed ? "completed" : ""}`;
        li.dataset.id = task.id;

        const proj = projects.find(p => p.id === task.project) || { name: "Station Inbox", color: "#3b82f6" };
        li.style.setProperty("--task-project-color", proj.color);

        const dueDateInfo = formatDue(task.dueDate);

        li.innerHTML = `
            <div class="task-row-left">
                <button class="check-circle ${task.priority || 'p4'}" aria-label="Toggle Mission Log">
                    <i class="fa-solid fa-check"></i>
                </button>
                <div class="task-content">
                    <span class="task-text">${escapeHTML(task.title)}</span>
                    ${task.description ? `<p class="task-desc-text">${escapeHTML(task.description)}</p>` : ""}
                    <div class="task-chips">
                        <span class="meta-pill">
                            <span class="project-dot" style="background-color: ${proj.color}; color: ${proj.color};"></span>
                            ${proj.name.toUpperCase()}
                        </span>
                        ${task.dueDate ? `
                            <span class="meta-pill ${dueDateInfo.className}">
                                <i class="fa-regular fa-clock"></i> ${dueDateInfo.text}
                            </span>
                        ` : ""}
                        ${task.priority ? `
                            <span class="meta-pill priority-${task.priority}">
                                ${task.priority.toUpperCase()} // ${getPriorityLabel(task.priority)}
                            </span>
                        ` : ""}
                        ${task.tag && task.tag !== "general" ? `
                            <span class="meta-pill">#${task.tag.toUpperCase()}</span>
                        ` : ""}
                    </div>
                </div>
            </div>
            <div class="task-row-actions">
                <button class="row-action-btn btn-star ${task.starred ? "starred" : ""}" title="Critical priority toggle">
                    <i class="${task.starred ? "fa-solid fa-star" : "fa-regular fa-star"}"></i>
                </button>
                <button class="row-action-btn btn-edit" title="Update specifications">
                    <i class="fa-regular fa-pen-to-square"></i>
                </button>
                <button class="row-action-btn btn-delete" title="Abort mission">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;

        li.querySelector(".check-circle").addEventListener("click", () => toggleTaskComplete(task.id));
        li.querySelector(".btn-star").addEventListener("click", () => toggleTaskStar(task.id));
        li.querySelector(".btn-edit").addEventListener("click", () => openEditModal(task.id));
        li.querySelector(".btn-delete").addEventListener("click", () => deleteTask(task.id));

        return li;
    }

    function getPriorityLabel(p) {
        if (p === "p1") return "CRITICAL";
        if (p === "p2") return "ELEVATED";
        if (p === "p3") return "STANDARD";
        return "ROUTINE";
    }

    // ==========================================================================
    // NOTES & TRANSMISSIONS
    // ==========================================================================

    function renderNotes() {
        notesGrid.innerHTML = "";
        notes.forEach(note => {
            const card = document.createElement("div");
            card.className = "note-card card-border shiny-top";
            card.innerHTML = `
                <textarea class="note-textarea" rows="6">${escapeHTML(note.content)}</textarea>
                <div class="note-footer">
                    <span>${note.date || "SIGNAL"}</span>
                    <button class="note-delete-btn" title="Purge transmission">
                        <i class="fa-solid fa-trash-can"></i>
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
                playCyberChime(350, 0.2);
                showToast("✦ TRANSMISSION PURGED");
            });

            notesGrid.appendChild(card);
        });
    }

    // ==========================================================================
    // TASK CRUD OPERATIONS
    // ==========================================================================

    function addTask(title, desc = "", project = "proj-ai", priority = "p2", dueDate = "", tag = "general") {
        if (!title.trim()) return;

        const newTask = {
            id: `task-${Date.now()}`,
            title: title.trim(),
            description: desc.trim(),
            project: project || (projects[0] ? projects[0].id : "proj-ai"),
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
        playCyberChime(880, 0.25);
        showToast("✦ MISSION INITIALIZED & TRANSMITTED");
    }

    function toggleTaskComplete(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        saveTasks();
        refreshApp();

        if (task.completed) {
            playCyberChime(1046.5, 0.4); // High C chime
            showToast("✦ ORBITAL MILESTONE LOGGED // SUCCESS");
        } else {
            playCyberChime(523.25, 0.2);
            showToast("✦ TASK RESTORED TO ACTIVE TRAJECTORY");
        }
    }

    function toggleTaskStar(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        task.starred = !task.starred;
        saveTasks();
        refreshApp();
        playCyberChime(784, 0.2);
        showToast(task.starred ? "✦ CRITICAL PRIORITY LOCK ENGAGED" : "✦ CRITICAL LOCK RELEASED");
    }

    function deleteTask(id) {
        const idx = tasks.findIndex(t => t.id === id);
        if (idx === -1) return;

        lastDeletedTask = tasks[idx];
        tasks.splice(idx, 1);
        saveTasks();
        refreshApp();
        playCyberChime(300, 0.3);

        showToast("✦ MISSION ABORTED", true, () => {
            if (lastDeletedTask) {
                tasks.push(lastDeletedTask);
                saveTasks();
                refreshApp();
                lastDeletedTask = null;
                playCyberChime(660, 0.2);
                showToast("✦ MISSION RESTORED");
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
        playCyberChime(880, 0.2);
        showToast("✦ TELEMETRY SPECIFICATIONS UPDATED");
    }

    function addProject(name, color) {
        if (!name.trim()) return;

        const icons = ["fa-satellite", "fa-meteor", "fa-robot", "fa-shield-halved", "fa-shuttle-space", "fa-globe"];
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];

        const newProj = {
            id: `proj-${Date.now()}`,
            name: name.trim(),
            color: color || "#762aff",
            icon: randomIcon
        };

        projects.push(newProj);
        saveProjects();
        populateProjectDropdowns();
        renderSidebarProjects();
        renderFocusCards();
        playCyberChime(800, 0.25);
        showToast(`✦ SECTOR // ${newProj.name.toUpperCase()} LAUNCHED`);
    }

    function addNote() {
        const newNote = {
            id: `note-${Date.now()}`,
            content: "",
            date: "TRANSMISSION"
        };
        notes.unshift(newNote);
        saveNotes();
        renderNotes();
        renderCounts();
        playCyberChime(660, 0.2);
        showToast("✦ NEW TRANSMISSION LOG OPENED");
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

    function applyTheme(isLight) {
        isLightMode = isLight;
        body.classList.toggle("light-starlight", isLightMode);
        const icon = themeToggle.querySelector("i");
        if (icon) {
            icon.className = isLightMode ? "fa-solid fa-sun" : "fa-solid fa-moon";
        }
        localStorage.setItem(STORAGE_KEYS.THEME, isLightMode ? "light" : "dark");
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
            ${allowUndo ? `<button class="btn-secondary" style="padding: 4px 10px; font-size: 0.7rem; margin-left: 0.5rem;" id="toast-undo"><span>UNDO</span></button>` : ""}
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
            setTimeout(() => toast.remove(), 300);
        }, 3400);
    }

    // ==========================================================================
    // EVENT LISTENERS
    // ==========================================================================

    function setupEventListeners() {
        // Equalizer Audio Synthesizer Button
        musicPlayBtn.addEventListener("click", toggleCosmicAudio);

        // Theme Toggle
        themeToggle.addEventListener("click", () => applyTheme(!isLightMode));

        // Global Search
        globalSearch.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderTasks();
        });

        // Quick Add Focus
        sidebarAddBtn.addEventListener("click", () => {
            taskInputTitle.focus();
            window.scrollTo({ top: 380, behavior: "smooth" });
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

        // Nav Buttons
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
    // UTILITIES
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
            return { text: "ORBIT EXPIRED", className: "overdue" };
        } else if (dateStr === today) {
            return { text: "ORBIT TODAY", className: "today" };
        } else if (dateStr === tomorrow) {
            return { text: "HORIZON: T-1D", className: "" };
        } else {
            const d = new Date(dateStr + "T00:00:00");
            const m = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
            return { text: `HORIZON: ${m} ${d.getDate()}`, className: "" };
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