/**
 * TaskFlow - Modern Task Management Dashboard
 * Full feature script with localStorage persistence, dynamic views,
 * weekly calendar timeline, sticky notes wall, and custom list management.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // INITIAL STATE & STORAGE
    // ==========================================================================

    const STORAGE_KEYS = {
        TASKS: "taskflow_tasks",
        CATEGORIES: "taskflow_categories",
        STICKY_NOTES: "taskflow_sticky_notes",
        THEME: "taskflow_theme",
    };

    // Default starter categories
    const defaultCategories = [
        { id: "cat-work", name: "Work", color: "#4f46e5" },
        { id: "cat-personal", name: "Personal", color: "#06b6d4" },
        { id: "cat-study", name: "Study", color: "#10b981" },
        { id: "cat-design", name: "Design System", color: "#ec4899" }
    ];

    // Default sample tasks if none exist
    const defaultTasks = [
        {
            id: "task-1",
            title: "Design user onboarding flow wireframes",
            description: "Sketch initial concepts and user journey maps for mobile & desktop.",
            category: "cat-design",
            priority: "high",
            dueDate: getFormattedDate(0), // Today
            tag: "design",
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: "task-2",
            title: "Review pull requests for API endpoints",
            description: "Check authentication middleware and test error handlers.",
            category: "cat-work",
            priority: "medium",
            dueDate: getFormattedDate(0), // Today
            tag: "dev",
            completed: true,
            createdAt: new Date().toISOString()
        },
        {
            id: "task-3",
            title: "Read Chapter 4 of System Design Handbook",
            description: "Focus on caching strategies, redis pub/sub, and database sharding.",
            category: "cat-study",
            priority: "low",
            dueDate: getFormattedDate(1), // Tomorrow
            tag: "personal",
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: "task-4",
            title: "Sprint retrospective meeting with team",
            description: "Discuss velocity, blockers from previous sprint, and upcoming roadmap.",
            category: "cat-work",
            priority: "high",
            dueDate: getFormattedDate(2),
            tag: "urgent",
            completed: false,
            createdAt: new Date().toISOString()
        }
    ];

    // Default sticky notes
    const defaultStickyNotes = [
        {
            id: "sticky-1",
            content: "💡 Idea: Add drag-and-drop task sorting in future update!",
            color: "yellow",
            date: "Today"
        },
        {
            id: "sticky-2",
            content: "📌 Reminder: Submit quarterly course project by next Friday.",
            color: "blue",
            date: "Aug 22"
        },
        {
            id: "sticky-3",
            content: "✨ Keep code clean, modular, and well-documented.",
            color: "pink",
            date: "Aug 20"
        }
    ];

    // Load data from localStorage or fallback
    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS)) || defaultTasks;
    let categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || defaultCategories;
    let stickyNotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.STICKY_NOTES)) || defaultStickyNotes;
    let isDarkMode = localStorage.getItem(STORAGE_KEYS.THEME) === "dark";

    // Application View & Filter State
    let currentView = "today"; // 'today' | 'upcoming' | 'calendar' | 'sticky' | 'completed' | categoryId
    let currentStatusFilter = "all"; // 'all' | 'active' | 'completed'
    let currentPriorityFilter = "all"; // 'all' | 'high' | 'medium' | 'low'
    let currentTagFilter = "all"; // 'all' | tag name
    let searchQuery = "";
    let sortBy = "dueDate-asc";
    let selectedCalendarDate = null; // 'YYYY-MM-DD'
    let currentWeekOffset = 0; // 0 = current week, -1 = last week, +1 = next week

    let lastDeletedTask = null; // For Undo functionality

    // ==========================================================================
    // DOM ELEMENTS
    // ==========================================================================

    const body = document.body;
    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    const globalSearchInput = document.getElementById("global-search-input");
    const currentViewTitle = document.getElementById("current-view-title");
    const currentViewSubtitle = document.getElementById("current-view-subtitle");
    const sidebarLists = document.getElementById("sidebar-lists");
    const sidebarTags = document.getElementById("sidebar-tags");
    const tasksContainer = document.getElementById("tasks-container");
    const tasksEmptyState = document.getElementById("tasks-empty-state");
    const priorityFilterSelect = document.getElementById("priority-filter-select");
    const tasksSortSelect = document.getElementById("tasks-sort-select");
    const toastContainer = document.getElementById("toast-container");

    // Badges & Metrics
    const badgeToday = document.getElementById("badge-today");
    const badgeUpcoming = document.getElementById("badge-upcoming");
    const badgeSticky = document.getElementById("badge-sticky");
    const badgeCompleted = document.getElementById("badge-completed");
    const metricTotalCount = document.getElementById("metric-total-count");
    const metricInprogressCount = document.getElementById("metric-inprogress-count");
    const metricCompletedCount = document.getElementById("metric-completed-count");
    const metricEfficiencyRate = document.getElementById("metric-efficiency-rate");
    const productivityPercent = document.getElementById("productivity-percent");
    const productivityBarFill = document.getElementById("productivity-bar-fill");
    const productivityCaption = document.getElementById("productivity-caption");
    const countStatusAll = document.getElementById("count-status-all");
    const countStatusActive = document.getElementById("count-status-active");
    const countStatusDone = document.getElementById("count-status-done");

    // Quick Add
    const quickTaskInput = document.getElementById("quick-task-input");
    const quickTaskCategory = document.getElementById("quick-task-category");
    const quickTaskPriority = document.getElementById("quick-task-priority");
    const quickTaskDate = document.getElementById("quick-task-date");
    const quickAddBtn = document.getElementById("quick-add-btn");

    // Weekly Strip
    const calendarMonthYear = document.getElementById("calendar-month-year");
    const calendarWeekNumber = document.getElementById("calendar-week-number");
    const weeklyDaysContainer = document.getElementById("weekly-days-container");
    const calPrevWeekBtn = document.getElementById("cal-prev-week");
    const calNextWeekBtn = document.getElementById("cal-next-week");
    const calGoTodayBtn = document.getElementById("cal-go-today");

    // View Panes
    const paneTasks = document.getElementById("pane-tasks");
    const paneWeeklySchedule = document.getElementById("pane-weekly-schedule");
    const paneStickyWall = document.getElementById("pane-sticky-wall");
    const weeklyScheduleBoard = document.getElementById("weekly-schedule-board");
    const stickyNotesGrid = document.getElementById("sticky-notes-grid");

    // Modals
    const taskModal = document.getElementById("task-modal");
    const taskForm = document.getElementById("task-form");
    const taskModalTitle = document.getElementById("task-modal-title");
    const taskEditIdInput = document.getElementById("task-edit-id");
    const modalTaskTitle = document.getElementById("modal-task-title");
    const modalTaskDesc = document.getElementById("modal-task-desc");
    const modalTaskCategory = document.getElementById("modal-task-category");
    const modalTaskPriority = document.getElementById("modal-task-priority");
    const modalTaskDate = document.getElementById("modal-task-date");
    const modalTaskTag = document.getElementById("modal-task-tag");
    const openNewTaskModalBtn = document.getElementById("open-new-task-modal");
    const taskModalCloseBtn = document.getElementById("task-modal-close");
    const taskModalCancelBtn = document.getElementById("task-modal-cancel");

    const listModal = document.getElementById("list-modal");
    const listForm = document.getElementById("list-form");
    const openAddListModalBtn = document.getElementById("open-add-list-modal");
    const listModalCloseBtn = document.getElementById("list-modal-close");
    const listModalCancelBtn = document.getElementById("list-modal-cancel");
    const modalListName = document.getElementById("modal-list-name");

    const addStickyNoteBtn = document.getElementById("add-sticky-note-btn");
    const emptyStateAddBtn = document.getElementById("empty-state-add-btn");

    // Mobile Sidebar Elements
    const sidebar = document.getElementById("sidebar");
    const sidebarBackdrop = document.getElementById("sidebar-backdrop");
    const mobileSidebarToggle = document.getElementById("mobile-sidebar-toggle");
    const mobileSidebarClose = document.getElementById("mobile-sidebar-close");

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================

    function init() {
        applyTheme(isDarkMode);
        populateCategorySelects();
        setupEventListeners();
        quickTaskDate.value = getFormattedDate(0); // Default to today
        refreshApp();
    }

    // ==========================================================================
    // RENDER / REFRESH FUNCTIONS
    // ==========================================================================

    function refreshApp() {
        renderSidebarLists();
        renderWeeklyCalendarStrip();
        renderMetrics();
        renderTasks();
        renderWeeklyScheduleBoard();
        renderStickyWall();
        updateViewHeading();
    }

    function updateViewHeading() {
        const todayStr = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });
        currentViewSubtitle.textContent = todayStr;

        if (currentView === "today") {
            currentViewTitle.textContent = "Today's Tasks";
        } else if (currentView === "upcoming") {
            currentViewTitle.textContent = "Upcoming Tasks";
        } else if (currentView === "calendar") {
            currentViewTitle.textContent = "Weekly Schedule Overview";
        } else if (currentView === "sticky") {
            currentViewTitle.textContent = "Sticky Notes Wall";
        } else if (currentView === "completed") {
            currentViewTitle.textContent = "Completed Tasks Archive";
        } else {
            const currentCat = categories.find(c => c.id === currentView);
            currentViewTitle.textContent = currentCat ? `${currentCat.name} Tasks` : "Tasks";
        }
    }

    // Populate Category Dropdowns in Quick Add and Modals
    function populateCategorySelects() {
        const selects = [quickTaskCategory, modalTaskCategory];
        selects.forEach(select => {
            if (!select) return;
            select.innerHTML = "";
            categories.forEach(cat => {
                const opt = document.createElement("option");
                opt.value = cat.id;
                opt.textContent = cat.name;
                select.appendChild(opt);
            });
        });
    }

    // Render Categories in Sidebar
    function renderSidebarLists() {
        sidebarLists.innerHTML = "";
        categories.forEach(cat => {
            const count = tasks.filter(t => t.category === cat.id && !t.completed).length;
            const btn = document.createElement("button");
            btn.className = `list-item-btn ${currentView === cat.id ? "active" : ""}`;
            btn.dataset.view = cat.id;
            btn.innerHTML = `
                <div class="list-label">
                    <span class="list-dot" style="background-color: ${cat.color};"></span>
                    <span>${cat.name}</span>
                </div>
                <span class="badge">${count}</span>
            `;
            btn.addEventListener("click", () => {
                currentView = cat.id;
                selectedCalendarDate = null;
                switchViewPane("pane-tasks");
                updateNavActiveStates();
                refreshApp();
            });
            sidebarLists.appendChild(btn);
        });
    }

    // Render Metrics & Productivity Bar
    function renderMetrics() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const inProgress = total - completed;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        metricTotalCount.textContent = total;
        metricInprogressCount.textContent = inProgress;
        metricCompletedCount.textContent = completed;
        metricEfficiencyRate.textContent = `${rate}%`;

        productivityPercent.textContent = `${rate}%`;
        productivityBarFill.style.width = `${rate}%`;
        productivityCaption.textContent = `${completed} of ${total} tasks completed`;

        // Update Nav Badges
        const todayDate = getFormattedDate(0);
        const todayTasksCount = tasks.filter(t => t.dueDate === todayDate && !t.completed).length;
        const upcomingTasksCount = tasks.filter(t => t.dueDate > todayDate && !t.completed).length;

        badgeToday.textContent = todayTasksCount;
        badgeUpcoming.textContent = upcomingTasksCount;
        badgeSticky.textContent = stickyNotes.length;
        badgeCompleted.textContent = completed;

        // Update Tab Counts
        countStatusAll.textContent = total;
        countStatusActive.textContent = inProgress;
        countStatusDone.textContent = completed;
    }

    // Render Weekly Calendar Strip (Dribbble Inspired)
    function renderWeeklyCalendarStrip() {
        const curr = new Date();
        // Calculate offset week Monday
        const firstDayOfWeek = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1 + (currentWeekOffset * 7)));
        
        const monthName = firstDayOfWeek.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        calendarMonthYear.textContent = monthName;

        // Calculate ISO Week Number
        const weekNum = getWeekNumber(firstDayOfWeek);
        calendarWeekNumber.textContent = `W${weekNum}`;

        weeklyDaysContainer.innerHTML = "";

        const todayFormatted = getFormattedDate(0);

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(firstDayOfWeek);
            dayDate.setDate(firstDayOfWeek.getDate() + i);

            const dayString = dayDate.toISOString().split("T")[0];
            const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = dayDate.getDate();

            const isToday = dayString === todayFormatted;
            const isSelected = dayString === selectedCalendarDate;
            const hasTasks = tasks.some(t => t.dueDate === dayString && !t.completed);

            const dayCard = document.createElement("div");
            dayCard.className = `day-card ${isToday ? "is-today" : ""} ${isSelected ? "active" : ""} ${hasTasks ? "has-tasks" : ""}`;
            dayCard.innerHTML = `
                <span class="day-name">${dayName}</span>
                <span class="day-number">${dayNum}</span>
                <span class="day-indicator"></span>
            `;

            dayCard.addEventListener("click", () => {
                if (selectedCalendarDate === dayString) {
                    selectedCalendarDate = null; // Toggle off filter
                } else {
                    selectedCalendarDate = dayString;
                }
                renderWeeklyCalendarStrip();
                renderTasks();
            });

            weeklyDaysContainer.appendChild(dayCard);
        }
    }

    // Render Tasks in List View
    function renderTasks() {
        tasksContainer.innerHTML = "";

        let filtered = [...tasks];

        // 1. View Filter
        const todayStr = getFormattedDate(0);
        if (currentView === "today") {
            filtered = filtered.filter(t => t.dueDate === todayStr);
        } else if (currentView === "upcoming") {
            filtered = filtered.filter(t => t.dueDate > todayStr);
        } else if (currentView === "completed") {
            filtered = filtered.filter(t => t.completed);
        } else if (currentView !== "calendar" && currentView !== "sticky") {
            // Category view
            filtered = filtered.filter(t => t.category === currentView);
        }

        // 2. Calendar Specific Date Filter (if clicked on strip)
        if (selectedCalendarDate) {
            filtered = filtered.filter(t => t.dueDate === selectedCalendarDate);
        }

        // 3. Status Tab Filter
        if (currentStatusFilter === "active") {
            filtered = filtered.filter(t => !t.completed);
        } else if (currentStatusFilter === "completed") {
            filtered = filtered.filter(t => t.completed);
        }

        // 4. Priority Dropdown Filter
        if (currentPriorityFilter !== "all") {
            filtered = filtered.filter(t => t.priority === currentPriorityFilter);
        }

        // 5. Tag Filter
        if (currentTagFilter !== "all") {
            filtered = filtered.filter(t => t.tag === currentTagFilter);
        }

        // 6. Search Query
        if (searchQuery.trim() !== "") {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(t => 
                t.title.toLowerCase().includes(q) || 
                (t.description && t.description.toLowerCase().includes(q))
            );
        }

        // 7. Sort
        filtered.sort((a, b) => {
            if (sortBy === "dueDate-asc") return (a.dueDate || "9999") > (b.dueDate || "9999") ? 1 : -1;
            if (sortBy === "dueDate-desc") return (a.dueDate || "0000") < (b.dueDate || "0000") ? 1 : -1;
            if (sortBy === "priority-desc") {
                const map = { high: 3, medium: 2, low: 1 };
                return (map[b.priority] || 0) - (map[a.priority] || 0);
            }
            if (sortBy === "created-desc") return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === "title-asc") return a.title.localeCompare(b.title);
            return 0;
        });

        // Toggle Empty State
        if (filtered.length === 0) {
            tasksEmptyState.classList.remove("hidden");
        } else {
            tasksEmptyState.classList.add("hidden");
        }

        filtered.forEach(task => {
            const item = createTaskElement(task);
            tasksContainer.appendChild(item);
        });
    }

    function createTaskElement(task) {
        const li = document.createElement("li");
        li.className = `task-item ${task.completed ? "completed" : ""}`;
        li.dataset.id = task.id;

        const categoryObj = categories.find(c => c.id === task.category) || { name: "General", color: "#6366f1" };
        const dueDateFormatted = formatDueDate(task.dueDate);

        li.innerHTML = `
            <div class="task-left">
                <button class="custom-checkbox" aria-label="Toggle completed">
                    <i class="fa-solid fa-check"></i>
                </button>
                <div class="task-info">
                    <span class="task-title">${escapeHTML(task.title)}</span>
                    ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ""}
                    <div class="task-meta-tags">
                        <span class="task-badge badge-category">
                            <span class="list-dot" style="background-color: ${categoryObj.color};"></span>
                            ${categoryObj.name}
                        </span>
                        <span class="task-badge badge-priority priority-${task.priority}">
                            ${task.priority.toUpperCase()}
                        </span>
                        ${task.dueDate ? `
                            <span class="task-badge badge-date ${dueDateFormatted.className}">
                                <i class="fa-regular fa-clock"></i> ${dueDateFormatted.text}
                            </span>
                        ` : ""}
                        ${task.tag && task.tag !== "general" ? `
                            <span class="task-badge badge-category">#${task.tag}</span>
                        ` : ""}
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn btn-edit" title="Edit Task">
                    <i class="fa-regular fa-pen-to-square"></i>
                </button>
                <button class="action-btn btn-delete" title="Delete Task">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;

        // Event Listeners for Task
        const checkbox = li.querySelector(".custom-checkbox");
        checkbox.addEventListener("click", () => toggleTaskCompleted(task.id));

        const editBtn = li.querySelector(".btn-edit");
        editBtn.addEventListener("click", () => openEditTaskModal(task.id));

        const deleteBtn = li.querySelector(".btn-delete");
        deleteBtn.addEventListener("click", () => deleteTask(task.id));

        return li;
    }

    // Render Weekly Schedule Board (Dribbble View)
    function renderWeeklyScheduleBoard() {
        weeklyScheduleBoard.innerHTML = "";

        const curr = new Date();
        const firstDayOfWeek = new Date(curr.setDate(curr.getDate() - curr.getDay() + 1 + (currentWeekOffset * 7)));
        const todayFormatted = getFormattedDate(0);

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(firstDayOfWeek);
            dayDate.setDate(firstDayOfWeek.getDate() + i);

            const dayString = dayDate.toISOString().split("T")[0];
            const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = dayDate.getDate();
            const isToday = dayString === todayFormatted;

            const dayTasks = tasks.filter(t => t.dueDate === dayString);

            const col = document.createElement("div");
            col.className = `schedule-day-column ${isToday ? "is-today-col" : ""}`;
            col.innerHTML = `
                <div class="schedule-day-header">
                    <h4>${dayName}</h4>
                    <span>${dayNum} ${dayDate.toLocaleDateString("en-US", { month: "short" })}</span>
                </div>
                <div class="schedule-day-tasks" id="col-tasks-${dayString}">
                </div>
            `;

            const tasksWrapper = col.querySelector(".schedule-day-tasks");
            if (dayTasks.length === 0) {
                tasksWrapper.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 1rem;">No tasks</span>`;
            } else {
                dayTasks.forEach(task => {
                    const cat = categories.find(c => c.id === task.category) || { color: "#6366f1" };
                    const card = document.createElement("div");
                    card.className = `schedule-task-card ${task.completed ? "completed" : ""}`;
                    card.style.borderLeftColor = cat.color;
                    card.innerHTML = `
                        <strong>${escapeHTML(task.title)}</strong>
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">
                            ${task.priority.toUpperCase()} • ${task.completed ? "Completed" : "In Progress"}
                        </div>
                    `;
                    card.addEventListener("click", () => toggleTaskCompleted(task.id));
                    tasksWrapper.appendChild(card);
                });
            }

            weeklyScheduleBoard.appendChild(col);
        }
    }

    // Render Sticky Notes Wall (Uizard View)
    function renderStickyWall() {
        stickyNotesGrid.innerHTML = "";

        stickyNotes.forEach(note => {
            const card = document.createElement("div");
            card.className = `sticky-card color-${note.color || "yellow"}`;
            card.innerHTML = `
                <textarea class="sticky-content" rows="6">${escapeHTML(note.content)}</textarea>
                <div class="sticky-footer">
                    <span>${note.date || "Note"}</span>
                    <button class="sticky-delete-btn" title="Delete note">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;

            const textarea = card.querySelector(".sticky-content");
            textarea.addEventListener("change", () => {
                note.content = textarea.value;
                saveStickyNotes();
            });

            const deleteBtn = card.querySelector(".sticky-delete-btn");
            deleteBtn.addEventListener("click", () => {
                stickyNotes = stickyNotes.filter(n => n.id !== note.id);
                saveStickyNotes();
                renderStickyWall();
                renderMetrics();
                showToast("Sticky note removed");
            });

            stickyNotesGrid.appendChild(card);
        });
    }

    // ==========================================================================
    // TASK CRUD OPERATIONS
    // ==========================================================================

    function addTask(title, desc = "", category = "cat-work", priority = "medium", dueDate = "", tag = "general") {
        if (!title.trim()) return;

        const newTask = {
            id: `task-${Date.now()}`,
            title: title.trim(),
            description: desc.trim(),
            category: category || (categories[0] ? categories[0].id : "cat-work"),
            priority: priority || "medium",
            dueDate: dueDate || getFormattedDate(0),
            tag: tag || "general",
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask);
        saveTasks();
        refreshApp();
        showToast("Task created successfully!");
    }

    function toggleTaskCompleted(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        saveTasks();
        refreshApp();
        showToast(task.completed ? "Task marked as completed! 🎉" : "Task restored to active");
    }

    function deleteTask(taskId) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        lastDeletedTask = tasks[taskIndex];
        tasks.splice(taskIndex, 1);
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

    function openEditTaskModal(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        taskModalTitle.textContent = "Edit Task";
        taskEditIdInput.value = task.id;
        modalTaskTitle.value = task.title;
        modalTaskDesc.value = task.description || "";
        modalTaskCategory.value = task.category;
        modalTaskPriority.value = task.priority;
        modalTaskDate.value = task.dueDate || "";
        modalTaskTag.value = task.tag || "general";

        openModal(taskModal);
    }

    function saveEditedTask(taskId, title, desc, category, priority, dueDate, tag) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        task.title = title.trim();
        task.description = desc.trim();
        task.category = category;
        task.priority = priority;
        task.dueDate = dueDate;
        task.tag = tag;

        saveTasks();
        refreshApp();
        showToast("Task updated successfully!");
    }

    // ==========================================================================
    // CATEGORY & STICKY NOTE OPERATIONS
    // ==========================================================================

    function addCategory(name, color) {
        if (!name.trim()) return;

        const newCat = {
            id: `cat-${Date.now()}`,
            name: name.trim(),
            color: color || "#4f46e5"
        };

        categories.push(newCat);
        saveCategories();
        populateCategorySelects();
        renderSidebarLists();
        showToast(`Category "${newCat.name}" created!`);
    }

    function addStickyNote() {
        const colors = ["yellow", "blue", "pink", "green", "purple", "orange"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newNote = {
            id: `sticky-${Date.now()}`,
            content: "New idea or note...",
            color: randomColor,
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
        };

        stickyNotes.unshift(newNote);
        saveStickyNotes();
        renderStickyWall();
        renderMetrics();
        showToast("New sticky note added!");
    }

    // ==========================================================================
    // VIEW SWITCHING & NAVIGATION
    // ==========================================================================

    function switchViewPane(paneId) {
        [paneTasks, paneWeeklySchedule, paneStickyWall].forEach(pane => {
            pane.classList.remove("active");
        });
        const targetPane = document.getElementById(paneId);
        if (targetPane) targetPane.classList.add("active");
    }

    function updateNavActiveStates() {
        document.querySelectorAll(".nav-item").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.view === currentView);
        });
        document.querySelectorAll(".list-item-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.view === currentView);
        });
    }

    // ==========================================================================
    // THEME HANDLING
    // ==========================================================================

    function applyTheme(dark) {
        isDarkMode = dark;
        body.classList.toggle("dark-mode", isDarkMode);
        const icon = themeToggleBtn.querySelector("i");
        if (icon) {
            icon.className = isDarkMode ? "fa-solid fa-sun" : "fa-solid fa-moon";
        }
        localStorage.setItem(STORAGE_KEYS.THEME, isDarkMode ? "dark" : "light");
    }

    // ==========================================================================
    // MODAL HELPERS
    // ==========================================================================

    function openModal(modal) {
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
    }

    function closeModal(modal) {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
    }

    // ==========================================================================
    // TOAST NOTIFICATIONS
    // ==========================================================================

    function showToast(message, allowUndo = false, undoCallback = null) {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = `
            <span>${message}</span>
            ${allowUndo ? `<button class="btn btn-sm btn-ghost" style="color: #60a5fa; padding: 2px 6px;" id="toast-undo-btn">Undo</button>` : ""}
        `;

        if (allowUndo && undoCallback) {
            toast.querySelector("#toast-undo-btn").addEventListener("click", () => {
                undoCallback();
                toast.remove();
            });
        }

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("toast-exit");
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // ==========================================================================
    // EVENT LISTENERS
    // ==========================================================================

    function setupEventListeners() {
        // Theme Toggle
        themeToggleBtn.addEventListener("click", () => {
            applyTheme(!isDarkMode);
        });

        // Global Search
        globalSearchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderTasks();
        });

        // Quick Add Task
        quickAddBtn.addEventListener("click", handleQuickAdd);
        quickTaskInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleQuickAdd();
        });

        function handleQuickAdd() {
            const title = quickTaskInput.value;
            if (!title.trim()) return;
            addTask(
                title,
                "",
                quickTaskCategory.value,
                quickTaskPriority.value,
                quickTaskDate.value || getFormattedDate(0),
                "general"
            );
            quickTaskInput.value = "";
        }

        // Navigation Menu Buttons
        document.querySelectorAll(".nav-item").forEach(item => {
            item.addEventListener("click", () => {
                const view = item.dataset.view;
                currentView = view;
                selectedCalendarDate = null;
                updateNavActiveStates();

                if (view === "calendar") {
                    switchViewPane("pane-weekly-schedule");
                } else if (view === "sticky") {
                    switchViewPane("pane-sticky-wall");
                } else {
                    switchViewPane("pane-tasks");
                }

                // Close mobile sidebar if open
                sidebar.classList.remove("open");
                sidebarBackdrop.classList.remove("active");

                refreshApp();
            });
        });

        // Status Tabs (All, Active, Done)
        document.querySelectorAll(".status-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                document.querySelectorAll(".status-tab").forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                currentStatusFilter = tab.dataset.status;
                renderTasks();
            });
        });

        // Tag Pills Filter
        sidebarTags.querySelectorAll(".tag-pill").forEach(pill => {
            pill.addEventListener("click", () => {
                sidebarTags.querySelectorAll(".tag-pill").forEach(p => p.classList.remove("active"));
                pill.classList.add("active");
                currentTagFilter = pill.dataset.tag;
                renderTasks();
            });
        });

        // Priority Filter Dropdown
        priorityFilterSelect.addEventListener("change", (e) => {
            currentPriorityFilter = e.target.value;
            renderTasks();
        });

        // Sort Select
        tasksSortSelect.addEventListener("change", (e) => {
            sortBy = e.target.value;
            renderTasks();
        });

        // Weekly Strip Navigation
        calPrevWeekBtn.addEventListener("click", () => {
            currentWeekOffset--;
            renderWeeklyCalendarStrip();
            renderWeeklyScheduleBoard();
        });

        calNextWeekBtn.addEventListener("click", () => {
            currentWeekOffset++;
            renderWeeklyCalendarStrip();
            renderWeeklyScheduleBoard();
        });

        calGoTodayBtn.addEventListener("click", () => {
            currentWeekOffset = 0;
            selectedCalendarDate = getFormattedDate(0);
            renderWeeklyCalendarStrip();
            renderWeeklyScheduleBoard();
            renderTasks();
        });

        // Modal Open / Close
        openNewTaskModalBtn.addEventListener("click", () => {
            taskModalTitle.textContent = "Create New Task";
            taskEditIdInput.value = "";
            taskForm.reset();
            modalTaskDate.value = getFormattedDate(0);
            openModal(taskModal);
        });

        emptyStateAddBtn.addEventListener("click", () => {
            taskModalTitle.textContent = "Create New Task";
            taskEditIdInput.value = "";
            taskForm.reset();
            modalTaskDate.value = getFormattedDate(0);
            openModal(taskModal);
        });

        taskModalCloseBtn.addEventListener("click", () => closeModal(taskModal));
        taskModalCancelBtn.addEventListener("click", () => closeModal(taskModal));

        // Task Form Submit (Create / Edit)
        taskForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const editId = taskEditIdInput.value;
            const title = modalTaskTitle.value;
            const desc = modalTaskDesc.value;
            const cat = modalTaskCategory.value;
            const priority = modalTaskPriority.value;
            const date = modalTaskDate.value;
            const tag = modalTaskTag.value;

            if (editId) {
                saveEditedTask(editId, title, desc, cat, priority, date, tag);
            } else {
                addTask(title, desc, cat, priority, date, tag);
            }

            closeModal(taskModal);
        });

        // Add Category / List Modal
        openAddListModalBtn.addEventListener("click", () => openModal(listModal));
        listModalCloseBtn.addEventListener("click", () => closeModal(listModal));
        listModalCancelBtn.addEventListener("click", () => closeModal(listModal));

        listForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = modalListName.value;
            const color = listForm.querySelector("input[name='list-color']:checked").value;
            addCategory(name, color);
            modalListName.value = "";
            closeModal(listModal);
        });

        // Sticky Wall Action
        addStickyNoteBtn.addEventListener("click", addStickyNote);

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
            // '/' key to focus search if not in an input
            if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
                e.preventDefault();
                globalSearchInput.focus();
            }
            // Escape to close open modals
            if (e.key === "Escape") {
                closeModal(taskModal);
                closeModal(listModal);
            }
        });
    }

    // ==========================================================================
    // PERSISTENCE HELPERS
    // ==========================================================================

    function saveTasks() {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }

    function saveCategories() {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    }

    function saveStickyNotes() {
        localStorage.setItem(STORAGE_KEYS.STICKY_NOTES, JSON.stringify(stickyNotes));
    }

    // ==========================================================================
    // UTILITY FUNCTIONS
    // ==========================================================================

    function getFormattedDate(offsetDays = 0) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split("T")[0];
    }

    function formatDueDate(dateStr) {
        if (!dateStr) return { text: "No date", className: "" };

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
            const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return { text: formatted, className: "" };
        }
    }

    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
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

    // Start App
    init();
});