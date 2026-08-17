/**
 * Nico Onboard Active Users Viewer Logic (Bug-free & Refined Version)
 */

let allData = [];
let availableYears = [];

// 強制非表示（除外）対象のユーザーID（オプトアウト・非表示リクエスト対応）
const HIDDEN_USER_IDS = new Set([
  280096, // 非表示リクエスト
  53840440, // 非表示リクエスト
  59665199, // 非表示リクエスト
  5017972, // 非表示リクエスト
]);

// Default initial state: 2026 Debut + Active only
let currentFilterYear = 2026; 
let currentStatusFilter = 'active'; 
let currentSearchQuery = '';
let currentSort = 'latestTime_desc';

// Default Official Niconico Fallback Avatar
const DEFAULT_AVATAR = "https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg";
const FALLBACK_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk0YTNiOCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==";

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');
const sortSelect = document.getElementById('sortSelect');
const yearSelectDropdown = document.getElementById('yearSelectDropdown');
const statusFilterControl = document.getElementById('statusFilterControl');
const tableBody = document.getElementById('tableBody');
const noResults = document.getElementById('noResults');
const currentCountEl = document.getElementById('currentCount');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const activeFilterTags = document.getElementById('activeFilterTags');

// Summary Banner Elements
const summaryTargetTitle = document.getElementById('summaryTargetTitle');
const statYearTotal = document.getElementById('statYearTotal');
const statYearActive = document.getElementById('statYearActive');
const statYearInactive = document.getElementById('statYearInactive');
const statYearRate = document.getElementById('statYearRate');
const summaryProgressBar = document.getElementById('summaryProgressBar');

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

  // 2. Filter out hidden/excluded users
  allData = allData.filter(d => !HIDDEN_USER_IDS.has(Number(d.userId)));

  // 3. Extract Available Years (sorted descending)
  const yearSet = new Set();
  allData.forEach(d => {
    if (d.debutYear) yearSet.add(d.debutYear);
  });
  availableYears = Array.from(yearSet).sort((a, b) => b - a);

  // If 2026 is not present in data, fallback to the latest available year
  if (!availableYears.includes(2026) && availableYears.length > 0) {
    currentFilterYear = availableYears[0];
  }

  // 3. Build Dynamic Year Dropdown
  buildYearDropdown();

  // 4. Setup Event Listeners
  setupEventListeners();

  // 5. Initial Render
  applyFiltersAndRender();
}

// ==========================================================================
// Dynamic Year Dropdown
// ==========================================================================
function buildYearDropdown() {
  let selectHtml = `<option value="all">すべての年度 (全${allData.length}名)</option>`;
  
  availableYears.forEach(yr => {
    const totalInYear = allData.filter(d => d.debutYear === yr).length;
    const activeInYear = allData.filter(d => d.debutYear === yr && d.isActiveRecent1Year).length;
    const rate = totalInYear ? (activeInYear / totalInYear * 100).toFixed(0) : '0';
    selectHtml += `<option value="${yr}">${yr}年 デビュー (計${totalInYear}名 / 活動中${activeInYear}名 [${rate}%])</option>`;
  });

  yearSelectDropdown.innerHTML = selectHtml;
  yearSelectDropdown.value = String(currentFilterYear);
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
// Update Dynamic Year Activity Summary Banner
// ==========================================================================
function updateYearSummaryBanner() {
  let targetData = allData;
  const minYear = availableYears.length > 0 ? availableYears[availableYears.length - 1] : 2007;
  const maxYear = availableYears.length > 0 ? availableYears[0] : 2026;
  let titleText = `全期間 (${minYear}年〜${maxYear}年) の活動状況`;

  if (currentFilterYear !== 'all') {
    targetData = allData.filter(d => d.debutYear === currentFilterYear);
    titleText = `${currentFilterYear}年 デビュー投稿者の活動状況`;
  }

  const total = targetData.length;
  const active = targetData.filter(d => d.isActiveRecent1Year).length;
  const inactive = total - active;
  const rate = total > 0 ? (active / total * 100).toFixed(1) : '0.0';

  summaryTargetTitle.textContent = titleText;
  statYearTotal.textContent = `${total.toLocaleString()}名`;
  statYearActive.textContent = `${active.toLocaleString()}名`;
  statYearInactive.textContent = `${inactive.toLocaleString()}名`;
  statYearRate.textContent = `${rate}%`;

  summaryProgressBar.style.width = `${rate}%`;
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function setupEventListeners() {
  // Search Input (Incremental Real-time Filtering)
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.trim();
    // Show clear button whenever there is any input in the box
    searchClearBtn.style.display = e.target.value.length > 0 ? 'block' : 'none';
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

  // Year Dropdown Select
  yearSelectDropdown.addEventListener('change', (e) => {
    const val = e.target.value;
    currentFilterYear = val === 'all' ? 'all' : parseInt(val, 10);
    applyFiltersAndRender();
  });

  // Active Status Segment Control
  statusFilterControl.addEventListener('click', (e) => {
    const btn = e.target.closest('.segment-btn');
    if (!btn) return;
    setStatusFilter(btn.dataset.status);
  });

  // Reset Button
  resetFilterBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    searchClearBtn.style.display = 'none';
    currentFilterYear = 'all';
    currentStatusFilter = 'all';
    currentSort = 'latestTime_desc';
    yearSelectDropdown.value = 'all';
    sortSelect.value = 'latestTime_desc';
    updateStatusSegmentUI();
    applyFiltersAndRender();
  });
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

// Normalize strings for resilient searching (half-width, lower-case, unescaped)
function normalizeText(text) {
  if (!text) return '';
  return unescapeHtml(String(text))
    .normalize('NFKC')
    .toLowerCase();
}

// ==========================================================================
// Filter, Sort & Render
// ==========================================================================
function applyFiltersAndRender() {
  // 1. Update Summary Banner for selected year
  updateYearSummaryBanner();

  // 2. Clone array (Immutable to prevent mutating master allData)
  let filtered = [...allData];

  // 3. Year Filtering
  if (currentFilterYear !== 'all') {
    filtered = filtered.filter(item => item.debutYear === currentFilterYear);
  }

  // 4. Active Status Filtering
  if (currentStatusFilter === 'active') {
    filtered = filtered.filter(item => item.isActiveRecent1Year === true);
  } else if (currentStatusFilter === 'inactive') {
    filtered = filtered.filter(item => item.isActiveRecent1Year === false);
  }

  // 5. Incremental Search Query (AND Search across words, null-safe)
  if (currentSearchQuery) {
    const keywords = normalizeText(currentSearchQuery).split(/\s+/).filter(Boolean);
    
    filtered = filtered.filter(item => {
      const searchTarget = normalizeText(
        [item.userName, item.userId, item.firstTitle, item.firstContentId, item.latestTitle, item.latestContentId]
          .filter(Boolean)
          .join(' ')
      );
      return keywords.every(kw => searchTarget.includes(kw));
    });
  }

  // 6. Sorting
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

  // 7. Update UI Counts & Badges
  currentCountEl.textContent = `${filtered.length.toLocaleString()}名`;
  renderActiveFilterChips();

  // 8. Render Table
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
    chip.innerHTML = `状況: ${currentStatusFilter === 'active' ? '活動中' : '休止中'}`;
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

  // Color generator class for badges
  const getBadgeClass = (yr) => {
    if (yr >= 2025) return 'y-2025';
    if (yr >= 2023) return 'y-2023';
    if (yr >= 2021) return 'y-2021';
    if (yr >= 2016) return 'y-2016';
    return 'y-vintage';
  };

  data.forEach((item, index) => {
    const tr = document.createElement('tr');

    // Row Number
    const tdNum = document.createElement('td');
    tdNum.className = 'td-num';
    tdNum.textContent = String(index + 1);

    // Year & Status Column
    const tdYear = document.createElement('td');
    const statusPill = item.isActiveRecent1Year
      ? `<span class="status-pill status-active"><span class="status-indicator-dot dot-active"></span> 活動中</span>`
      : `<span class="status-pill status-inactive"><span class="status-indicator-dot dot-inactive"></span> 休止中</span>`;
    
    tdYear.innerHTML = `
      <div class="year-status-cell">
        <span class="year-badge ${getBadgeClass(item.debutYear)}">${item.debutYear}年</span>
        ${statusPill}
      </div>
    `;

    // User Column (Avatar + Links)
    const tdUser = document.createElement('td');
    const userUrl = `https://www.nicovideo.jp/user/${encodeURIComponent(item.userId || '')}`;
    const iconUrl = getUserIconUrl(item.userId);
    const displayName = item.userName || `ユーザー(${item.userId})`;

    tdUser.innerHTML = `
      <div class="user-cell">
        <img 
          src="${iconUrl}" 
          alt="${escapeHtml(displayName)}" 
          class="user-avatar" 
          loading="lazy" 
          referrerpolicy="no-referrer"
          onerror="this.onerror=function(){this.onerror=null;this.src='${FALLBACK_SVG}';}; this.src='${DEFAULT_AVATAR}';"
        >
        <div class="user-info-text">
          <a href="${userUrl}" target="_blank" rel="noopener noreferrer" class="user-name-link" title="ニコニコマイページを開く">
            ${escapeHtml(displayName)}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
          <span class="user-id-sub">ID: ${escapeHtml(item.userId || '')}</span>
        </div>
      </div>
    `;

    // First Video
    const tdFirst = document.createElement('td');
    const firstTitleClean = unescapeHtml(item.firstTitle || '（タイトル不明）');
    if (item.firstContentId) {
      const firstUrl = `https://www.nicovideo.jp/watch/${encodeURIComponent(item.firstContentId)}`;
      tdFirst.innerHTML = `
        <div class="video-cell">
          <a href="${firstUrl}" target="_blank" rel="noopener noreferrer" class="video-title-link" title="${escapeHtml(firstTitleClean)}">
            ${escapeHtml(firstTitleClean)}
          </a>
          <div class="video-meta">
            <span class="video-id-badge">${escapeHtml(item.firstContentId)}</span>
            <span class="video-date">${formatDate(item.firstPostTime)}</span>
          </div>
        </div>
      `;
    } else {
      tdFirst.innerHTML = `
        <div class="video-cell">
          <span class="video-title-text">${escapeHtml(firstTitleClean)}</span>
          <div class="video-meta">
            <span class="video-date">${formatDate(item.firstPostTime)}</span>
          </div>
        </div>
      `;
    }

    // Latest Video
    const tdLatest = document.createElement('td');
    if (item.latestContentId || item.latestTitle) {
      const latestTitleClean = unescapeHtml(item.latestTitle || '（タイトル不明）');
      if (item.latestContentId) {
        const latestUrl = `https://www.nicovideo.jp/watch/${encodeURIComponent(item.latestContentId)}`;
        tdLatest.innerHTML = `
          <div class="video-cell">
            <a href="${latestUrl}" target="_blank" rel="noopener noreferrer" class="video-title-link" title="${escapeHtml(latestTitleClean)}">
              ${escapeHtml(latestTitleClean)}
            </a>
            <div class="video-meta">
              <span class="video-id-badge">${escapeHtml(item.latestContentId)}</span>
              <span class="video-date">${formatDate(item.latestPostTime)}</span>
            </div>
          </div>
        `;
      } else {
        tdLatest.innerHTML = `
          <div class="video-cell">
            <span class="video-title-text">${escapeHtml(latestTitleClean)}</span>
            <div class="video-meta">
              <span class="video-date">${formatDate(item.latestPostTime)}</span>
            </div>
          </div>
        `;
      }
    } else {
      tdLatest.innerHTML = `<span class="no-latest-video">初投稿のみ記録</span>`;
    }

    tr.appendChild(tdNum);
    tr.appendChild(tdYear);
    tr.appendChild(tdUser);
    tr.appendChild(tdFirst);
    tr.appendChild(tdLatest);

    fragment.appendChild(tr);
  });

  tableBody.appendChild(fragment);
}

// Helpers
function unescapeHtml(str) {
  if (!str) return '';
  const doc = new DOMParser().parseFromString(String(str), 'text/html');
  return doc.body.textContent || '';
}

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
