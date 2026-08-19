document.addEventListener("DOMContentLoaded", () => {
  const todoInput = document.getElementById("todo-input");
  const addTaskButton = document.getElementById("add-task-btn");
  const todoList = document.getElementById("todo-list");
  const themeToggleButton = document.getElementById("theme-toggle-btn");
  const themeToggleIcon = themeToggleButton.querySelector("i");

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let isDarkMode = localStorage.getItem("isDarkMode") === "true";

  setTheme(isDarkMode);
  tasks.forEach((task) => renderTask(task));

  // --- Core Task Logic Function ---
  function addTask() {
    const taskText = todoInput.value.trim();
    if (taskText === "") return;

    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
    };
    tasks.push(newTask);
    saveTasks();
    renderTask(newTask);
    todoInput.value = ""; // clear input
  }

  // --- Event Listeners ---

  // 1. Add task via Button Click
  addTaskButton.addEventListener("click", addTask);

  // 2. Add task via Enter Key Press (NEW IMPLEMENTATION)
  todoInput.addEventListener("keypress", (e) => {
    // Use 'e.key === "Enter"' for modern browsers
    if (e.key === "Enter") {
      addTask();
    }
  });

  // 3. Theme Toggle
  themeToggleButton.addEventListener("click", () => {
    isDarkMode = !isDarkMode;
    setTheme(isDarkMode);
    localStorage.setItem("isDarkMode", isDarkMode);
  });

  // --- Helper Functions ---

  function setTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);

    // Change the icon to reflect the *opposite* (next) theme
    if (isDark) {
      themeToggleIcon.classList.remove("fa-moon");
      themeToggleIcon.classList.add("fa-sun");
    } else {
      themeToggleIcon.classList.remove("fa-sun");
      themeToggleIcon.classList.add("fa-moon");
    }
  }

  function renderTask(task) {
    const li = document.createElement("li");
    li.setAttribute("data-id", task.id);
    if (task.completed) li.classList.add("completed");
    li.innerHTML = `
        <span>${task.text}</span>
        <button>Delete</button>
        `;

    li.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") return;
      const currentTask = tasks.find((t) => t.id === task.id);
      if (currentTask) {
        currentTask.completed = !currentTask.completed;
        li.classList.toggle("completed");
        saveTasks();
      }
    });

    li.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation(); // prevent toggle from firing
      tasks = tasks.filter((t) => t.id !== task.id);
      li.remove();
      saveTasks();
    });

    todoList.appendChild(li);
  }

  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }
});