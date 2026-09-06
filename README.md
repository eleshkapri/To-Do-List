# 🏔️ Summit Tasks — for better productivity

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-0D352E?style=flat-square&logo=pwa&logoColor=EFB300)](./manifest.webmanifest)
[![Offline Capable](https://img.shields.io/badge/Offline-100%25%20Capable-0D352E?style=flat-square&logo=wifi&logoColor=white)](./sw.js)
[![Security Hardened](https://img.shields.io/badge/Security-CSP%20%2B%20XSS%20Immune-0D352E?style=flat-square&logo=shield&logoColor=EFB300)](#-security--defensive-engineering)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%20AA-0D352E?style=flat-square&logo=w3c&logoColor=white)](#-accessibility--inclusive-design-wcag-aa)
[![License](https://img.shields.io/badge/License-MIT-0D352E?style=flat-square)](#license)

> **Summit Tasks** is an enterprise-grade, mountain-journey inspired productivity and milestone management application. Crafted with a refined Swiss aesthetic inspired by [to-top.ch](https://www.to-top.ch/en), it blends deep forest green, gold accents, and fluid interactive animations with robust client-side security, zero-dependency offline resilience (PWA), and complete local data sovereignty.

---

## 🌟 Key Highlights

- **🏔️ Mountain Expedition Metaphor:** Tasks are trail milestones, projects are sectors, and completed items are celebrated as "Summited" achievements.
- **🛡️ Enterprise Security Hardening:** Strict Content Security Policy (CSP), Subresource Integrity (SRI), prototype pollution defense, and sanitized DOM rendering.
- **⚡ 100% Offline Progressive Web App (PWA):** Installable on desktop (macOS, Windows, Linux) and mobile (iOS, Android) with seamless background service worker caching.
- **💾 Complete Data Sovereignty & Backup Hub:** One-click JSON backup export, schema-validated file import, storage quota metering, and safe factory reset.
- **♿ Inclusive Accessibility (WCAG AA):** Full keyboard navigation, modal focus traps, screen reader live announcements (`aria-live`), and `@media (prefers-reduced-motion)` vestibular safety.
- **🎨 Micro-Interactions & Fluid Animations:** 3D tilt reveals, blur-to-focus transitions, character-split title headers, quotes carousel with gold dot indicators, top scroll progress bar, and an interactive cursor follower.

---

## 📱 Interactive Demo & Visual Features

| Feature | Description |
| :--- | :--- |
| **"Where Do You Want To Go?" Hero** | Interactive summit telemetry showing active tasks, summited milestones, and a dynamic circular progress ring. |
| **Why Are You Here? Signpost** | Interactive route selector featuring a 3D tilting trail signpost and goal category cards. |
| **Active Trail Sectors** | Color-coded project cards displaying real-time completion progress bars. |
| **Task Management Station** | Priority tags (`01 Critical`, `02 High`, `03 Standard`, `04 Routine`), date chips, quick-add input, and search bar. |
| **Trail Notes Journal** | Integrated quick-note scratchpad with auto-save persistence. |
| **Quotes Carousel** | Wisdom for the climb with custom gold dot indicators and auto-slide rotation. |

---

## 🛡️ Security & Defensive Engineering

Summit Tasks is architected from the ground up to protect user data and ensure client-side integrity:

1. **Content Security Policy (CSP):**
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self';">
   ```
2. **Defensive Storage Engine (`SecureStorage`):**
   - All `localStorage` interactions are guarded with `try...catch` blocks to protect against `QuotaExceededError` or blocked storage in private/incognito browsing.
   - Incoming data is validated against strict JSON object schemas to prevent app crashes from corrupted data.
3. **Cryptographic ID Generation:**
   - Tasks and sectors use cryptographically secure `crypto.randomUUID()` with entropy fallbacks to prevent collision vulnerabilities.
4. **Input Constraints & XSS Immunity:**
   - Enforces strict character limits: task titles (max 200 chars), notes (max 2,000 chars), sectors (max 50 chars).
   - Strict whitelisting for priorities (`p1`, `p2`, `p3`, `p4`) and sanitized tags.
   - Multi-character HTML entity escaping (`&`, `<`, `>`, `"`, `'`).

---

## 🚀 Getting Started

### Prerequisites
Summit Tasks has **zero external server dependencies** and runs directly in any modern web browser.

### Running Locally
1. **Clone the repository:**
   ```bash
   git clone https://github.com/eleshkapri/To-Do-List.git
   cd To-Do-List
   ```
2. **Open in VS Code:**
   ```bash
   code .
   ```
3. **Launch with Live Server:**
   - Right-click `index.html` in VS Code Explorer.
   - Select **"Open with Live Server"** (runs on port `5501` by default).
   - Alternatively, open `index.html` directly in your browser.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>N</kbd> | Jump to task input and focus cursor |
| <kbd>/</kbd> | Focus global task search bar |
| <kbd>Esc</kbd> | Close any open modal, dialog, or mobile menu |
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Navigate elements with focus trapping in modals |
| <kbd>Enter</kbd> | Add new task from title input field |

---

## 📂 Project Architecture

```
ToDoList-new/
│
├── index.html            # Main semantic application markup (CSP, PWA meta, modals)
├── styles.css            # to-top.ch design system, animations, responsive, print
├── script.js             # Core application engine, SecureStorage, PWA, UI controllers
├── sw.js                 # Service worker for offline caching & network resilience
├── manifest.webmanifest  # Progressive Web App manifest with standalone support
├── README.md             # Comprehensive project documentation
└── .vscode/
    └── settings.json     # VS Code automated sync, auto-save, and Git settings
```

---

## ♿ Accessibility & Inclusive Design (WCAG AA)

- **Screen Reader Announcements:** Hidden `aria-live="polite"` region delivers audible updates for task additions, completions, deletions, and data imports.
- **Focus Trap & Restoration:** Modals trap focus during keyboard navigation and restore focus to the triggering element upon closure.
- **Reduced Motion Support:** Respects user operating system settings via `@media (prefers-reduced-motion: reduce)`, disabling heavy transitions.
- **High Contrast Focus Rings:** Clear `:focus-visible` styling ensures visibility without cluttering mouse clicks.
- **Print Optimization:** Formatted `@media print` stylesheet for clean, paper-friendly route printouts.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*“Every summit begins with the decision to try. Start your first task.”* 🏔️
