document.addEventListener("DOMContentLoaded", function () {

    // ================= STORAGE KEYS & CACHE CONFIG =================
    const STORAGE_KEYS = {
        ACTIVE_TAB: "devstats_active_tab",
        LC_USER: "devstats_lc_user",
        GH_USER: "devstats_gh_user",
        LC_CACHE_PREFIX: "devstats_lc_cache_",
        GH_CACHE_PREFIX: "devstats_gh_cache_"
    };
    const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

    function getCachedData(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.timestamp > CACHE_TTL) {
                localStorage.removeItem(key);
                return null;
            }
            return parsed.data;
        } catch {
            return null;
        }
    }

    function setCachedData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify({
                timestamp: Date.now(),
                data
            }));
        } catch (e) {
            console.warn("Storage quota exceeded, skipping cache:", e);
        }
    }

    // ================= 1. TAB SWITCHING LOGIC =================
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    function activateTab(targetId) {
        tabButtons.forEach(b => {
            b.classList.toggle("active", b.dataset.target === targetId);
        });
        tabPanels.forEach(p => {
            p.classList.toggle("hidden", p.id !== targetId);
        });
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, targetId);
    }

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => activateTab(btn.dataset.target));
    });

    function isValidUsername(username) {
        return /^[a-zA-Z0-9_-]+$/.test(username);
    }

    // ================= 2. LEETCODE MODULE =================
    const lcInput = document.getElementById("lc-input");
    const lcSearchBtn = document.getElementById("lc-search-btn");
    const lcError = document.getElementById("lc-error");
    const lcStatsCards = document.getElementById("lc-stats-cards");

    const easyCircle = document.querySelector(".easy-progress");
    const mediumCircle = document.querySelector(".medium-progress");
    const hardCircle = document.querySelector(".hard-progress");
    const easyLabel = document.getElementById("easy-label");
    const mediumLabel = document.getElementById("medium-label");
    const hardLabel = document.getElementById("hard-label");

    function updateProgress(solved, total, labelEl, circleEl) {
        const pct = total > 0 ? (solved / total) * 100 : 0;
        circleEl.style.setProperty("--progress-degree", `${pct}%`);
        labelEl.textContent = `${solved}/${total}`;
    }

    function renderLeetCode(data) {
        updateProgress(data.easySolved, data.totalEasy, easyLabel, easyCircle);
        updateProgress(data.mediumSolved, data.totalMedium, mediumLabel, mediumCircle);
        updateProgress(data.hardSolved, data.totalHard, hardLabel, hardCircle);

        const cards = [
            { label: "Total Solved", value: data.totalSolved },
            { label: "Global Ranking", value: data.ranking },
            { label: "Contribution Points", value: data.contributionPoints },
            { label: "Reputation", value: data.reputation }
        ];

        lcStatsCards.innerHTML = cards.map(c => `
            <div class="card">
                <h4>${c.label}</h4>
                <p>${c.value}</p>
            </div>
        `).join("");
    }

    async function fetchLeetCode(username, forceRefresh = false) {
        const normalizedUser = username.toLowerCase();
        const cacheKey = STORAGE_KEYS.LC_CACHE_PREFIX + normalizedUser;

        lcError.classList.add("hidden");

        // Serve from localStorage cache if valid and not forced
        if (!forceRefresh) {
            const cached = getCachedData(cacheKey);
            if (cached) {
                renderLeetCode(cached);
                localStorage.setItem(STORAGE_KEYS.LC_USER, username);
                return;
            }
        }

        lcSearchBtn.textContent = "Searching...";
        lcSearchBtn.disabled = true;

        try {
            const res = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${username}`);
            if (!res.ok) throw new Error("Could not connect to LeetCode API.");
            const data = await res.json();

            if (data.errors || data.status === "error" || data.totalSolved === undefined) {
                throw new Error(`LeetCode user "${username}" not found.`);
            }

            renderLeetCode(data);

            // Save valid username and cache API response
            localStorage.setItem(STORAGE_KEYS.LC_USER, username);
            setCachedData(cacheKey, data);

        } catch (err) {
            lcError.textContent = err.message;
            lcError.classList.remove("hidden");
        } finally {
            lcSearchBtn.textContent = "Search LeetCode";
            lcSearchBtn.disabled = false;
        }
    }

    lcSearchBtn.addEventListener("click", () => {
        const username = lcInput.value.trim();
        if (!isValidUsername(username)) {
            lcError.textContent = "Please enter a valid LeetCode username.";
            lcError.classList.remove("hidden");
            return;
        }
        fetchLeetCode(username, true);
    });

    lcInput.addEventListener("keydown", e => {
        if (e.key === "Enter") lcSearchBtn.click();
    });
    

    // ================= 3. GITHUB MODULE =================
    const ghInput = document.getElementById("gh-input");
    const ghSearchBtn = document.getElementById("gh-search-btn");
    const ghError = document.getElementById("gh-error");
    const ghDashboard = document.getElementById("gh-dashboard");

    const ghAvatar = document.getElementById("gh-avatar");
    const ghName = document.getElementById("gh-name");
    const ghLink = document.getElementById("gh-link");
    const ghBio = document.getElementById("gh-bio");
    const ghLocation = document.getElementById("gh-location");
    const ghCompany = document.getElementById("gh-company");
    const ghJoined = document.getElementById("gh-joined");
    const ghStatsCards = document.getElementById("gh-stats-cards");
    const ghTotalContrib = document.getElementById("gh-total-contrib");
    const ghHeatmap = document.getElementById("gh-heatmap");
    const ghRecentCommits = document.getElementById("gh-recent-commits");
    const ghRepos = document.getElementById("gh-repos");

    function renderGitHub({ user, repos, contrib }) {
        ghAvatar.src = user.avatar_url;
        ghName.textContent = user.name || user.login;
        ghLink.textContent = `@${user.login}`;
        ghLink.href = user.html_url;
        ghBio.textContent = user.bio || "No bio provided.";
        ghLocation.textContent = user.location ? `📍 ${user.location}` : "";
        ghCompany.textContent = user.company ? `🏢 ${user.company}` : "";
        ghJoined.textContent = `📅 Joined ${new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;

        const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
        const daysList = contrib.contributions || [];
        const activeDays = daysList.filter(d => d.count > 0).length;

        const ghCards = [
            { label: "Public Repos", value: user.public_repos },
            { label: "Followers", value: user.followers },
            { label: "Following", value: user.following },
            { label: "Total Stars", value: totalStars },
            { label: "Active Commit Days", value: `${activeDays} days` },
            { label: "Public Gists", value: user.public_gists }
        ];

        ghStatsCards.innerHTML = ghCards.map(c => `
            <div class="card">
                <h4>${c.label}</h4>
                <p>${c.value}</p>
            </div>
        `).join("");

        ghTotalContrib.textContent = contrib.total?.lastYear ?? 0;
        ghHeatmap.innerHTML = daysList.map(d => `
            <div class="day-cell level-${d.level}" title="${d.date}: ${d.count} contributions"></div>
        `).join("");

        const recentActive = daysList.filter(d => d.count > 0).reverse().slice(0, 12);
        ghRecentCommits.innerHTML = recentActive.length
            ? recentActive.map(d => `<div class="commit-pill"><span>${d.date}:</span><strong>${d.count} commits</strong></div>`).join("")
            : `<p class="hint">No public commits in the last year.</p>`;

        const topRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
        ghRepos.innerHTML = topRepos.length
            ? topRepos.map(r => `
                <div class="repo-card">
                    <div>
                        <a href="${r.html_url}" target="_blank">${r.name}</a>
                        <p>${r.description ? r.description.slice(0, 80) : "No description."}</p>
                    </div>
                    <div class="repo-meta">
                        <span>💻 ${r.language || "Text"}</span>
                        <span>⭐ ${r.stargazers_count}</span>
                        <span>🍴 ${r.forks_count}</span>
                    </div>
                </div>
            `).join("")
            : `<p class="hint">No public repositories found.</p>`;

        ghDashboard.classList.remove("hidden");
    }

    async function fetchGitHub(username, forceRefresh = false) {
        const normalizedUser = username.toLowerCase();
        const cacheKey = STORAGE_KEYS.GH_CACHE_PREFIX + normalizedUser;

        ghError.classList.add("hidden");

        // Serve from localStorage cache if valid and not forced
        if (!forceRefresh) {
            const cached = getCachedData(cacheKey);
            if (cached) {
                renderGitHub(cached);
                localStorage.setItem(STORAGE_KEYS.GH_USER, username);
                return;
            }
        }

        ghSearchBtn.textContent = "Loading...";
        ghSearchBtn.disabled = true;

        try {
            const [userRes, reposRes, contribRes] = await Promise.all([
                fetch(`https://api.github.com/users/${username}`),
                fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`),
                fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`)
            ]);

            if (!userRes.ok) {
                throw new Error(userRes.status === 404 ? `GitHub user "${username}" not found.` : "GitHub API rate limit exceeded.");
            }

            const user = await userRes.json();
            const repos = reposRes.ok ? await reposRes.json() : [];
            const contrib = contribRes.ok ? await contribRes.json() : { total: { lastYear: 0 }, contributions: [] };

            const payload = { user, repos, contrib };
            renderGitHub(payload);

            // Save valid username and cache API response
            localStorage.setItem(STORAGE_KEYS.GH_USER, username);
            setCachedData(cacheKey, payload);

        } catch (err) {
            ghError.textContent = err.message;
            ghError.classList.remove("hidden");
            ghDashboard.classList.add("hidden");
        } finally {
            ghSearchBtn.textContent = "Search GitHub";
            ghSearchBtn.disabled = false;
        }
    }

    ghSearchBtn.addEventListener("click", () => {
        const username = ghInput.value.trim();
        if (!isValidUsername(username)) {
            ghError.textContent = "Please enter a valid GitHub username.";
            ghError.classList.remove("hidden");
            return;
        }
        fetchGitHub(username, true);
    });

    ghInput.addEventListener("keydown", e => {
        if (e.key === "Enter") ghSearchBtn.click();
    });

    // ================= 4. RESTORE SAVED STATE ON PAGE LOAD =================
    const savedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
    if (savedTab && document.getElementById(savedTab)) {
        activateTab(savedTab);
    }

    const savedLcUser = localStorage.getItem(STORAGE_KEYS.LC_USER);
    if (savedLcUser && isValidUsername(savedLcUser)) {
        lcInput.value = savedLcUser;
        fetchLeetCode(savedLcUser, false);
    }

    const savedGhUser = localStorage.getItem(STORAGE_KEYS.GH_USER);
    if (savedGhUser && isValidUsername(savedGhUser)) {
        ghInput.value = savedGhUser;
        fetchGitHub(savedGhUser, false);
    }

});