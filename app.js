/**
 * Nico Onboard Active Users Viewer Logic
 */

let allData = [];
let currentFilterYear = 'all'; // 'all' | 2025 | 2023 | 2021 | 2016
let currentStatusFilter = 'all'; // 'all' | 'active' | 'inactive'
let currentSearchQuery = '';
let currentSort = 'latestTime_desc';

// Default Fallback Avatar SVG (Clean lightweight inline SVG data URI)
const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');
const sortSelect = document.getElementById('sortSelect');
const yearFilterTabs = document.getElementById('yearFilterTabs');
const statusFilterControl = document.getElementById('statusFilterControl');
const tableBody = document.getElementById('tableBody');
const noResults = document.getElementById('noResults');
const currentCountEl = document.getElementById('currentCount');
const totalDataCountEl = document.getElementById('totalDataCount');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const activeFilterTags = document.getElementById('activeFilterTags');

// Stat Cards
const statTotalCount = document.getElementById('statTotalCount');
const statTotalActive = document.getElementById('statTotalActive');
const statTotalRate = document.getElementById('statTotalRate');

const stat2025Count = document.getElementById('stat2025Count');
const stat2025Active = document.getElementById('stat2025Active');
const stat2025Rate = document.getElementById('stat2025Rate');

const stat2023Count = document.getElementById('stat2023Count');
const stat2023Active = document.getElementById('stat2023Active');
const stat2023Rate = document.getElementById('stat2023Rate');

const stat2021Count = document.getElementById('stat2021Count');
const stat2021Active = document.getElementById('stat2021Active');
const stat2021Rate = document.getElementById('stat2021Rate');

const stat2016Count = document.getElementById('stat2016Count');
const stat2016Active = document.getElementById('stat2016Active');
const stat2016Rate = document.getElementById('stat2016Rate');

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
// User Icon Helper
// Formula: https://usericon.nimg.jp/usericon/{Math.floor(userId / 10000)}/{userId}.jpg
// ==========================================================================
function getUserIconUrl(userId) {
  const numId = parseInt(userId, 10);
  if (isNaN(numId)) return DEFAULT_AVATAR;
  const folder = Math.floor(numId / 10000);
  return `https://usericon.nimg.jp/usericon/${folder}/${numId}.jpg`;
}

// ==========================================================================
// Stats Calculation
// ==========================================================================
function updateGlobalStats() {
  const total = allData.length;
  const totalActive = allData.filter(d => d.isActiveRecent1Year).length;

  const data2025 = allData.filter(d => d.debutYear === 2025);
  const active2025 = data2025.filter(d => d.isActiveRecent1Year).length;

  const data2023 = allData.filter(d => d.debutYear === 2023);
  const active2023 = data2023.filter(d => d.isActiveRecent1Year).length;

  const data2021 = allData.filter(d => d.debutYear === 2021);
  const active2021 = data2021.filter(d => d.isActiveRecent1Year).length;

  const data2016 = allData.filter(d => d.debutYear === 2016);
  const active2016 = data2016.filter(d => d.isActiveRecent1Year).length;

  // Render stats
  totalDataCountEl.textContent = total.toLocaleString();
  statTotalCount.textContent = total.toLocaleString();
  statTotalActive.textContent = `${totalActive}名`;
  statTotalRate.textContent = `${total ? (totalActive / total * 100).toFixed(1) : 0}%`;

  stat2025Count.textContent = data2025.length.toLocaleString();
  stat2025Active.textContent = `${active2025}名`;
  stat2025Rate.textContent = `${data2025.length ? (active2025 / data2025.length * 100).toFixed(1) : 0}%`;

  stat2023Count.textContent = data2023.length.toLocaleString();
  stat2023Active.textContent = `${active2023}名`;
  stat2023Rate.textContent = `${data2023.length ? (active2023 / data2023.length * 100).toFixed(1) : 0}%`;

  stat2021Count.textContent = data2021.length.toLocaleString();
  stat2021Active.textContent = `${active2021}名`;
  stat2021Rate.textContent = `${data2021.length ? (active2021 / data2021.length * 100).toFixed(1) : 0}%`;

  stat2016Count.textContent = data2016.length.toLocaleString();
  stat2016Active.textContent = `${active2016}名`;
  stat2016Rate.textContent = `${data2016.length ? (active2016 / data2016.length * 100).toFixed(1) : 0}%`;

  // Badges on tabs
  badgeAll.textContent = total;
  badge2025.textContent = data2025.length;
  badge2023.textContent = data2023.length;
  badge2021.textContent = data2021.length;
  badge2016.textContent = data2016.length;
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

  // Year Filter Tabs
  yearFilterTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    const year = tab.dataset.year;
    setYearFilter(year === 'all' ? 'all' : parseInt(year, 10));
  });

  // Active Status Segment Control
  statusFilterControl.addEventListener('click', (e) => {
    const btn = e.target.closest('.segment-btn');
    if (!btn) return;
    setStatusFilter(btn.dataset.status);
  });

  // Stat Card Click to Filter
  document.getElementById('statsGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.stat-card');
    if (!card) return;
    const year = card.dataset.filterYear;
    if (year === 'all') {
      setYearFilter('all');
    } else if (year) {
      setYearFilter(parseInt(year, 10));
    }
  });

  // Reset Button
  resetFilterBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    searchClearBtn.style.display = 'none';
    currentStatusFilter = 'all';
    updateStatusSegmentUI();
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

function setStatusFilter(status) {
  currentStatusFilter = status;
  updateStatusSegmentUI();
  applyFiltersAndRender();
}

function updateStatusSegmentUI() {
  document.querySelectorAll('.segment-btn').forEach(btn => {
    if (btn.dataset.status === currentStatusFilter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
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

  // 2. Active Status Filtering
  if (currentStatusFilter === 'active') {
    filtered = filtered.filter(item => item.isActiveRecent1Year === true);
  } else if (currentStatusFilter === 'inactive') {
    filtered = filtered.filter(item => item.isActiveRecent1Year === false);
  }

  // 3. Incremental Search Query (AND Search across words)
  if (currentSearchQuery) {
    const keywords = normalizeText(currentSearchQuery).split(/\s+/).filter(Boolean);
    
    filtered = filtered.filter(item => {
      const searchTarget = normalizeText(
        `${item.userName} ${item.userId} ${item.firstTitle} ${item.firstContentId} ${item.latestTitle} ${item.latestContentId}`
      );
      return keywords.every(kw => searchTarget.includes(kw));
    });
  }

  // 4. Sorting
  filtered.sort((a, b) => {
    switch (currentSort) {
      case 'latestTime_desc':
        return (b.latestPostTime || b.firstPostTime || '').localeCompare(a.latestPostTime || a.firstPostTime || '');
      case 'latestTime_asc':
        return (a.latestPostTime || a.firstPostTime || '').localeCompare(b.latestPostTime || b.firstPostTime || '');
      case 'firstTime_desc':
        return (b.firstPostTime || '').localeCompare(a.firstPostTime || '');
      case 'firstTime_asc':
        return (a.firstPostTime || '').localeCompare(b.firstPostTime || '');
      case 'name_asc':
        return (a.userName || '').localeCompare(b.userName || '', 'ja');
      default:
        return 0;
    }
  });

  // 5. Update UI Counts & Badges
  currentCountEl.textContent = filtered.length.toLocaleString();
  renderActiveFilterChips();

  // 6. Render Table
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

  if (currentStatusFilter !== 'all') {
    const chip = document.createElement('span');
    chip.className = 'filter-tag-chip';
    chip.innerHTML = `状況: ${currentStatusFilter === 'active' ? '生存（アクティブ）' : '非アクティブ'}`;
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

    // Year & Status Column
    const tdYear = document.createElement('td');
    const statusPill = item.isActiveRecent1Year
      ? `<span class="status-pill status-active"><span class="status-indicator-dot dot-active"></span> 生存</span>`
      : `<span class="status-pill status-inactive"><span class="status-indicator-dot dot-inactive"></span> 停止</span>`;
    
    tdYear.innerHTML = `
      <div class="year-status-cell">
        <span class="year-badge y-${item.debutYear}">${item.debutYear}年</span>
        ${statusPill}
      </div>
    `;

    // User Column (Avatar + Links)
    const tdUser = document.createElement('td');
    const userUrl = `https://www.nicovideo.jp/user/${encodeURIComponent(item.userId)}`;
    const iconUrl = getUserIconUrl(item.userId);

    tdUser.innerHTML = `
      <div class="user-cell">
        <img 
          src="${iconUrl}" 
          alt="${escapeHtml(item.userName)}" 
          class="user-avatar" 
          loading="lazy" 
          referrerpolicy="no-referrer"
          onerror="this.onerror=null; this.src='${DEFAULT_AVATAR}';"
        >
        <div class="user-info-text">
          <a href="${userUrl}" target="_blank" rel="noopener noreferrer" class="user-name-link" title="ニコニコマイページを開く">
            ${escapeHtml(item.userName)}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
          <span class="user-id-sub">ID: ${escapeHtml(item.userId)}</span>
        </div>
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
