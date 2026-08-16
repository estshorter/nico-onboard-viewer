/**
 * Nico Onboard Active Users Viewer Logic
 */

let allData = [];
let currentFilterYear = 'all'; // 'all' | 2025 | 2023 | 2021 | 2016
let currentSearchQuery = '';
let currentSort = 'firstTime_desc';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');
const sortSelect = document.getElementById('sortSelect');
const yearFilterTabs = document.getElementById('yearFilterTabs');
const tableBody = document.getElementById('tableBody');
const noResults = document.getElementById('noResults');
const currentCountEl = document.getElementById('currentCount');
const totalDataCountEl = document.getElementById('totalDataCount');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const activeFilterTags = document.getElementById('activeFilterTags');

// Stat Cards
const statTotalCount = document.getElementById('statTotalCount');
const stat2025Count = document.getElementById('stat2025Count');
const stat2023Count = document.getElementById('stat2023Count');
const stat2021Count = document.getElementById('stat2021Count');
const stat2016Count = document.getElementById('stat2016Count');

// Badges
const badgeAll = document.getElementById('badgeAll');
const badge2025 = document.getElementById('badge2025');
const badge2023 = document.getElementById('badge2023');
const badge2021 = document.getElementById('badge2021');
const badge2016 = document.getElementById('badge2016');

// ==========================================================================
// Initialization
// ==========================================================================
async function initApp() {
  // 1. Load Data
  if (window.NICO_ONBOARD_DATA && Array.isArray(window.NICO_ONBOARD_DATA)) {
    allData = window.NICO_ONBOARD_DATA;
  } else {
    try {
      const res = await fetch('data.json');
      allData = await res.json();
    } catch (err) {
      console.error('Failed to load data.json', err);
    }
  }

  // 2. Setup Stats & Badges
  updateGlobalStats();

  // 3. Event Listeners
  setupEventListeners();

  // 4. Initial Render
  applyFiltersAndRender();
}

// ==========================================================================
// Stats Calculation
// ==========================================================================
function updateGlobalStats() {
  const total = allData.length;
  const count2025 = allData.filter(d => d.debutYear === 2025).length;
  const count2023 = allData.filter(d => d.debutYear === 2023).length;
  const count2021 = allData.filter(d => d.debutYear === 2021).length;
  const count2016 = allData.filter(d => d.debutYear === 2016).length;

  totalDataCountEl.textContent = total.toLocaleString();
  statTotalCount.textContent = total.toLocaleString();
  stat2025Count.textContent = count2025.toLocaleString();
  stat2023Count.textContent = count2023.toLocaleString();
  stat2021Count.textContent = count2021.toLocaleString();
  stat2016Count.textContent = count2016.toLocaleString();

  badgeAll.textContent = total;
  badge2025.textContent = count2025;
  badge2023.textContent = count2023;
  badge2021.textContent = count2021;
  badge2016.textContent = count2016;
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function setupEventListeners() {
  // Search Input (Incremental Real-time Filtering)
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.trim();
    searchClearBtn.style.display = currentSearchQuery ? 'block' : 'none';
    applyFiltersAndRender();
  });

  // Search Clear Button
  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    searchClearBtn.style.display = 'none';
    searchInput.focus();
    applyFiltersAndRender();
  });

  // Sort Select
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    applyFiltersAndRender();
  });

  // Filter Tabs
  yearFilterTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    const year = tab.dataset.year;
    setYearFilter(year === 'all' ? 'all' : parseInt(year, 10));
  });

  // Stat Card Click to Filter
  document.getElementById('statsGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.stat-card');
    if (!card || card.classList.contains('total-card')) return;
    const year = card.dataset.filterYear;
    if (year) {
      setYearFilter(parseInt(year, 10));
    }
  });

  // Reset Button
  resetFilterBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    searchClearBtn.style.display = 'none';
    setYearFilter('all');
  });
}

function setYearFilter(year) {
  currentFilterYear = year;

  // Update tab active state
  document.querySelectorAll('.filter-tab').forEach(tab => {
    const tabYear = tab.dataset.year;
    if (tabYear === String(year)) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  applyFiltersAndRender();
}

// Normalize strings for resilient searching (half-width, lower-case, etc.)
function normalizeText(text) {
  if (!text) return '';
  return text
    .normalize('NFKC')
    .toLowerCase();
}

// ==========================================================================
// Filter, Sort & Render
// ==========================================================================
function applyFiltersAndRender() {
  // 1. Year Filtering
  let filtered = allData;
  if (currentFilterYear !== 'all') {
    filtered = filtered.filter(item => item.debutYear === currentFilterYear);
  }

  // 2. Incremental Search Query (AND Search across words)
  if (currentSearchQuery) {
    const keywords = normalizeText(currentSearchQuery).split(/\s+/).filter(Boolean);
    
    filtered = filtered.filter(item => {
      const searchTarget = normalizeText(
        `${item.userName} ${item.userId} ${item.firstTitle} ${item.firstContentId} ${item.latestTitle} ${item.latestContentId}`
      );
      return keywords.every(kw => searchTarget.includes(kw));
    });
  }

  // 3. Sorting
  filtered.sort((a, b) => {
    switch (currentSort) {
      case 'firstTime_desc':
        return (b.firstPostTime || '').localeCompare(a.firstPostTime || '');
      case 'firstTime_asc':
        return (a.firstPostTime || '').localeCompare(b.firstPostTime || '');
      case 'latestTime_desc':
        return (b.latestPostTime || '').localeCompare(a.latestPostTime || '');
      case 'latestTime_asc':
        return (a.latestPostTime || '').localeCompare(b.latestPostTime || '');
      case 'name_asc':
        return (a.userName || '').localeCompare(b.userName || '', 'ja');
      default:
        return 0;
    }
  });

  // 4. Update UI Counts & Badges
  currentCountEl.textContent = filtered.length.toLocaleString();
  renderActiveFilterChips();

  // 5. Render Table
  renderTable(filtered);
}

function renderActiveFilterChips() {
  activeFilterTags.innerHTML = '';

  if (currentFilterYear !== 'all') {
    const chip = document.createElement('span');
    chip.className = 'filter-tag-chip';
    chip.innerHTML = `初投稿年: ${currentFilterYear}年`;
    activeFilterTags.appendChild(chip);
  }

  if (currentSearchQuery) {
    const chip = document.createElement('span');
    chip.className = 'filter-tag-chip';
    chip.innerHTML = `検索: "${escapeHtml(currentSearchQuery)}"`;
    activeFilterTags.appendChild(chip);
  }
}

function renderTable(data) {
  tableBody.innerHTML = '';

  if (data.length === 0) {
    dataTable.style.display = 'none';
    noResults.style.display = 'flex';
    return;
  }

  dataTable.style.display = 'table';
  noResults.style.display = 'none';

  const fragment = document.createDocumentFragment();

  data.forEach(item => {
    const tr = document.createElement('tr');

    // Debut Year
    const tdYear = document.createElement('td');
    tdYear.innerHTML = `<span class="year-badge y-${item.debutYear}">${item.debutYear}年</span>`;

    // User Info
    const tdUser = document.createElement('td');
    const userUrl = `https://www.nicovideo.jp/user/${encodeURIComponent(item.userId)}`;
    tdUser.innerHTML = `
      <div class="user-cell">
        <a href="${userUrl}" target="_blank" rel="noopener noreferrer" class="user-name-link" title="ニコニコマイページを開く">
          ${escapeHtml(item.userName)}
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>
        <span class="user-id-sub">ID: ${escapeHtml(item.userId)}</span>
      </div>
    `;

    // First Video
    const tdFirst = document.createElement('td');
    const firstUrl = item.firstContentId ? `https://www.nicovideo.jp/watch/${encodeURIComponent(item.firstContentId)}` : '#';
    tdFirst.innerHTML = `
      <div class="video-cell">
        <a href="${firstUrl}" target="_blank" rel="noopener noreferrer" class="video-title-link" title="${escapeHtml(item.firstTitle)}">
          ${escapeHtml(item.firstTitle || '（タイトル不明）')}
        </a>
        <div class="video-meta">
          ${item.firstContentId ? `<span class="video-id-badge">${escapeHtml(item.firstContentId)}</span>` : ''}
          <span class="video-date">${formatDate(item.firstPostTime)}</span>
        </div>
      </div>
    `;

    // Latest Video
    const tdLatest = document.createElement('td');
    if (item.latestContentId || item.latestTitle) {
      const latestUrl = item.latestContentId ? `https://www.nicovideo.jp/watch/${encodeURIComponent(item.latestContentId)}` : '#';
      tdLatest.innerHTML = `
        <div class="video-cell">
          <a href="${latestUrl}" target="_blank" rel="noopener noreferrer" class="video-title-link" title="${escapeHtml(item.latestTitle)}">
            ${escapeHtml(item.latestTitle || '（タイトル不明）')}
          </a>
          <div class="video-meta">
            ${item.latestContentId ? `<span class="video-id-badge">${escapeHtml(item.latestContentId)}</span>` : ''}
            <span class="video-date">${formatDate(item.latestPostTime)}</span>
          </div>
        </div>
      `;
    } else {
      tdLatest.innerHTML = `<span class="no-latest-video">初投稿のみ記録</span>`;
    }

    tr.appendChild(tdYear);
    tr.appendChild(tdUser);
    tr.appendChild(tdFirst);
    tr.appendChild(tdLatest);

    fragment.appendChild(tr);
  });

  tableBody.appendChild(fragment);
}

// Helpers
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  // Convert '2023-12-04 10:17:02' to '2023/12/04 10:17'
  return dateStr.substring(0, 16).replace(/-/g, '/');
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
