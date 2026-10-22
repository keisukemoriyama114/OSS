/* ===========================
   JavaScript — Interactive behaviors
   引越し手続き窓口 運用マニュアル
   =========================== */

'use strict';

// ─── DOM refs ───────────────────────────────────────────
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const menuBtn       = document.getElementById('menu-btn');
const overlay       = document.getElementById('sidebar-overlay');
const searchInput   = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const resultsCount  = document.getElementById('search-results-count');
const resultsList   = document.getElementById('search-results-list');
const clearSearch   = document.getElementById('clear-search');
const layout        = document.querySelector('.layout');
const mainContent   = document.getElementById('main-content');

// ─── Sidebar toggle ─────────────────────────────────────
function openSidebar() {
  sidebar.classList.add('open');
  sidebar.classList.remove('hidden');
  overlay.classList.add('active');
  menuBtn.textContent = '✕ 閉じる';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  menuBtn.textContent = '☰ メニュー';
}

sidebarToggle.addEventListener('click', () => {
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
});

menuBtn.addEventListener('click', () => {
  if (sidebar.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
});

overlay.addEventListener('click', closeSidebar);

// Desktop: sidebar always visible; toggling hides it
function handleResize() {
  const isDesktop = window.innerWidth > 900;
  if (isDesktop) {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    sidebar.style.transform = '';
  }
}

window.addEventListener('resize', handleResize);
handleResize();

// ─── Active section tracking (Intersection Observer) ────
const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
const sections = document.querySelectorAll('.section');

const observerOptions = {
  root: null,
  rootMargin: '-20% 0px -70% 0px',
  threshold: 0,
};

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navItems.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, observerOptions);

sections.forEach(section => sectionObserver.observe(section));

// Sidebar nav click — close on mobile
navItems.forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth <= 900) {
      closeSidebar();
    }
  });
});

// ─── Full-text Search ────────────────────────────────────
// Build index from document
const searchIndex = [];

function buildIndex() {
  // Collect all text nodes with their section context
  sections.forEach(section => {
    const headingEl = section.querySelector('h2');
    const sectionTitle = headingEl ? headingEl.textContent : '';

    // Subsection headings
    section.querySelectorAll('h3').forEach(h3 => {
      searchIndex.push({
        title: `${sectionTitle} › ${h3.textContent}`,
        text: h3.textContent,
        element: h3,
        anchor: section.id,
      });
    });

    // Paragraphs and list items
    section.querySelectorAll('p, li, td, .script-text, .qa-a, .dialog-ope, .dialog-customer').forEach(el => {
      const text = el.textContent.trim();
      if (text.length > 15) {
        searchIndex.push({
          title: sectionTitle,
          text: text,
          element: el,
          anchor: section.id,
        });
      }
    });
  });
}

buildIndex();

function highlight(text, query) {
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function doSearch(query) {
  if (!query || query.length < 2) {
    searchResults.hidden = true;
    return;
  }

  const q = query.toLowerCase();
  const matches = searchIndex.filter(item =>
    item.text.toLowerCase().includes(q)
  ).slice(0, 30);

  searchResults.hidden = false;
  resultsCount.textContent = `${matches.length} 件ヒット`;
  resultsList.innerHTML = '';

  if (matches.length === 0) {
    resultsList.innerHTML = '<li style="color: var(--color-text-dim); font-size: 13px;">該当する内容が見つかりませんでした。</li>';
    return;
  }

  matches.forEach(match => {
    const li = document.createElement('li');
    li.className = 'search-result-item';

    const snippet = match.text.substring(0, 100);

    li.innerHTML = `
      <div class="search-result-title">${match.title}</div>
      <div class="search-result-snippet">${highlight(snippet, query)}</div>
    `;

    li.addEventListener('click', () => {
      const target = document.getElementById(match.anchor);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Highlight briefly
        target.style.outline = '2px solid var(--color-primary)';
        setTimeout(() => { target.style.outline = ''; }, 2000);
      }
      if (window.innerWidth <= 900) closeSidebar();
    });

    resultsList.appendChild(li);
  });
}

let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    doSearch(searchInput.value.trim());
  }, 200);
});

// Also sync with sidebar search input
const sidebarSearch = document.getElementById('search-input');
sidebarSearch.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    sidebarSearch.value = '';
    doSearch('');
    searchResults.hidden = true;
  }
});

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  searchResults.hidden = true;
});

// ─── Keyboard shortcut: Ctrl+K / Cmd+K to focus search ──
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    if (window.innerWidth <= 900) openSidebar();
    searchInput.focus();
    searchInput.select();
  }
  if (e.key === 'Escape' && document.activeElement === searchInput) {
    searchInput.blur();
    searchResults.hidden = true;
  }
});

// ─── Smooth anchor navigation ────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── Copy script text on click ───────────────────────────
document.querySelectorAll('.script-text, .dialog-ope, .dialog-customer').forEach(el => {
  el.title = 'クリックしてコピー';
  el.style.cursor = 'pointer';
  el.addEventListener('click', () => {
    const text = el.innerText;
    navigator.clipboard.writeText(text).then(() => {
      const original = el.style.outline;
      el.style.outline = '2px solid var(--color-civil)';
      setTimeout(() => { el.style.outline = original; }, 700);
    }).catch(() => {});
  });
});

// ─── Print button hint ───────────────────────────────────
// (Ctrl+P triggers the print dialog which has good print CSS)

console.info('📋 引越し手続き窓口 コールセンター運用マニュアル\nCtrl+K / Cmd+K で全文検索\nCtrl+P / Cmd+P で印刷');
