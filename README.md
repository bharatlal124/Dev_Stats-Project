# 🚀 DevStats | LeetCode & GitHub Profile Overview

A clean, responsive, single-page web dashboard that allows developers to search and view consolidated **LeetCode** and **GitHub** stats in one place. Built with vanilla JavaScript, HTML5, and CSS3 without requiring backend servers or secret API keys.

![DevStats Preview](https://img.shields.io/badge/status-active-success.svg) ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=flat&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=flat&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/javascript-%23F7DF1E.svg?style=flat&logo=javascript&logoColor=black)

---

## ✨ Features

- **Tabbed Interface:** Easily switch between LeetCode stats and GitHub overviews without losing context or reloading the page.
- **LeetCode Analytics:**
  - Circular conic-gradient progress meters for **Easy, Medium, and Hard** problem-solving breakdowns.
  - Live global ranking, total problems solved, contribution points, and reputation score cards.
- **GitHub Contributions & Profile:**
  - Comprehensive profile details (Avatar, Bio, Location, Company, Join Date, Followers, Following).
  - **365-day commit contribution heatmap** with daily counts and hover tooltips.
  - Recent active commit days counter and **Top Repositories** grid sorted by stars, forks, and programming languages.
- **Local Storage Caching & Persistence:**
  - Remembers your active tab and last searched usernames on page refresh.
  - Implements a **15-minute cache expiration (TTL)** to instantly load previous searches and avoid hitting API rate limits.

---

## 🛠️ Tech Stack

- **HTML5:** Semantic layout structure with modular panels.
- **CSS3:** Custom styling featuring Flexbox, CSS Grid, and dynamic conic-gradient progress rings.
- **JavaScript (ES6+):** Asynchronous `fetch` calls, `Promise.all` concurrency, and `localStorage` state management.
- **Public APIs Used:**
  - LeetCode Stats API: `https://leetcode-api-faisalshohag.vercel.app/${username}`
  - GitHub REST API: `https://api.github.com/users/${username}` & `/repos`
  - GitHub Contributions API: `https://github-contributions-api.jogruber.de/v4/${username}`

---

## 📁 Project Structure

```text
devstats/
│
├── index.html       # Main HTML layout with tabbed sections
├── style.css        # Responsive dark-theme styling and CSS variables
└── script.js        # API integration, tab switching, and localStorage logic