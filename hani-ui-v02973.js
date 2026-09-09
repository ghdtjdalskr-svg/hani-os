/* =========================================================
   HANI OS v2.9.73 Candidate
   Theme Harmony + Sidebar Team Photo + Newsroom UX Hotfix
   UI-only patch.
   - NO localStorage key changes
   - NO hani_state/schema mutations
   - NO Supabase writes
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_UI_V02973_THEME_HARMONY';
  const STYLE_ID = 'hani-ui-v02973-style';
  const TEAM_CARD_ID = 'haniSidebarTeamPhotoV02973';
  const PAGER_ID = 'haniNewsroomPagerV02973';
  const PAGE_SIZE = 20;

  if (window[PATCH_ID]) return;
  window[PATCH_ID] = true;
  window.HANI_UI_PATCH_VERSION = '2.9.73-candidate';

  let currentPage = 1;
  let queued = false;
  let observer = null;

  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
/* =========================================================
   v2.9.73 · seasonal visual hierarchy
   ========================================================= */
html[data-season="spring"]{
  --hani-season-canvas:#fbf7fa;
  --hani-season-surface:#fffafb;
  --hani-season-soft:#f8eaf2;
  --hani-season-line:#efd9e6;
  --hani-season-accent:#b96f9b;
  --hani-season-accent2:#8ebea8;
  --hani-season-ink:#303746;
}
html[data-season="summer"]{
  --hani-season-canvas:#f4fbfb;
  --hani-season-surface:#f9fefe;
  --hani-season-soft:#e3f6f4;
  --hani-season-line:#cfeae7;
  --hani-season-accent:#168fa2;
  --hani-season-accent2:#41b9a7;
  --hani-season-ink:#293d48;
}
html[data-season="autumn"]{
  --hani-season-canvas:#fbf7f1;
  --hani-season-surface:#fffaf4;
  --hani-season-soft:#f7eadc;
  --hani-season-line:#ead8c7;
  --hani-season-accent:#b86d39;
  --hani-season-accent2:#d59a57;
  --hani-season-ink:#3e3834;
}
html[data-season="winter"]{
  --hani-season-canvas:#f4f7fb;
  --hani-season-surface:#f9fbfe;
  --hani-season-soft:#e7eef8;
  --hani-season-line:#d6e0ef;
  --hani-season-accent:#5577ad;
  --hani-season-accent2:#829bc2;
  --hani-season-ink:#2d394b;
}
html:not([data-season]){
  --hani-season-canvas:#f8f7fc;
  --hani-season-surface:#fcfbff;
  --hani-season-soft:#f0edff;
  --hani-season-line:#e3ddfb;
  --hani-season-accent:#7559f3;
  --hani-season-accent2:#9a78f6;
  --hani-season-ink:#303746;
}

/* Sidebar: seasonal atmosphere stays subtle; text remains high-contrast. */
#sidebar.side{
  background:
    linear-gradient(180deg,
      color-mix(in srgb,var(--hani-season-surface) 96%,#fff),
      color-mix(in srgb,var(--hani-season-canvas) 92%,#fff)
    )!important;
  color:var(--hani-season-ink)!important;
}
#sidebar .office-group>.office-main-nav{
  background:linear-gradient(135deg,#fff 0%,var(--hani-season-surface) 100%)!important;
  border-color:var(--hani-season-line)!important;
  color:var(--hani-season-ink)!important;
}
#sidebar .office-group>.office-main-nav .name{
  color:#374151!important;
  font-size:15px!important;
  font-weight:950!important;
}
#sidebar .office-group>.office-main-nav small{
  color:#7b8494!important;
  font-weight:760!important;
}
#sidebar .office-group>.office-main-nav .ico{
  background:var(--hani-season-soft)!important;
  color:var(--hani-season-accent)!important;
}
#sidebar .office-group>.office-main-nav .dashboard-arrow{
  color:var(--hani-season-accent)!important;
}

/* Office children: neutral copy + distinct functional icon tones. */
#sidebar .office-group .group-body{
  border-left-color:color-mix(in srgb,var(--hani-season-accent) 15%,#d9dee8)!important;
}
#sidebar .office-group .group-body .nav-btn{
  color:#5f6878!important;
  font-weight:790!important;
  --office-item:#7b69d9;
  --office-item-soft:#f1edff;
}
#sidebar .office-group .group-body .nav-btn .txt{
  color:#5f6878!important;
}
#sidebar .office-group .group-body .nav-btn .ico{
  color:var(--office-item)!important;
  background:var(--office-item-soft)!important;
  opacity:1!important;
}
#sidebar .office-group .group-body .nav-btn:nth-child(1){--office-item:#259b7d;--office-item-soft:#e9f8f2}
#sidebar .office-group .group-body .nav-btn:nth-child(2){--office-item:#735bd7;--office-item-soft:#f0ecff}
#sidebar .office-group .group-body .nav-btn:nth-child(3){--office-item:#ca7b4e;--office-item-soft:#fff1e8}
#sidebar .office-group .group-body .nav-btn:nth-child(4){--office-item:#4e82c5;--office-item-soft:#edf4ff}
#sidebar .office-group .group-body .nav-btn.active{
  background:linear-gradient(135deg,var(--office-item-soft),#fff)!important;
  color:#374151!important;
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--office-item) 24%,#fff),
             0 5px 13px rgba(58,66,88,.06)!important;
}
#sidebar .office-group .group-body .nav-btn.active .ico{
  color:#fff!important;
  background:var(--office-item)!important;
  box-shadow:none!important;
}
#sidebar .office-group .group-body .nav-btn.active .txt{
  color:#374151!important;
  font-weight:950!important;
}

/* Mini brand card: same family as the season/brand hero, but visually lighter. */
#sidebar .sidebar-team-mini{
  background:linear-gradient(135deg,#fff,var(--hani-season-surface))!important;
  border-color:var(--hani-season-line)!important;
}
#sidebar .sidebar-team-head b{
  color:var(--hani-season-accent)!important;
  font-size:16px!important;
  font-weight:1000!important;
  letter-spacing:.025em!important;
}
#sidebar .sidebar-team-head span{
  color:#7b8494!important;
  font-size:9.5px!important;
  font-weight:730!important;
}
#sidebar .sidebar-team-head em{
  color:color-mix(in srgb,var(--hani-season-accent) 72%,#667085)!important;
  font-weight:900!important;
}

/* Team photo: intentionally compact so it finishes the sidebar instead of dominating it. */
#${TEAM_CARD_ID}{
  margin:13px 4px 7px;
  padding:5px;
  border:1px solid var(--hani-season-line);
  border-radius:14px;
  background:rgba(255,255,255,.84);
  box-shadow:0 7px 18px rgba(55,62,82,.055);
  overflow:hidden;
}
#${TEAM_CARD_ID} .hani-team-photo-frame{
  position:relative;
  height:auto;
  overflow:hidden;
  border-radius:10px;
  background:var(--hani-season-soft);
}
#${TEAM_CARD_ID} img{
  width:100%;
  height:auto;
  display:block;
  object-fit:contain;
  object-position:center;
}
#${TEAM_CARD_ID} .hani-team-photo-label{
  position:static;
  left:7px;
  right:7px;
  bottom:6px;
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:7px;
  padding:6px 7px;
  border-radius:9px;
  background:rgba(255,255,255,.84);
  backdrop-filter:blur(5px);
  box-shadow:0 2px 7px rgba(43,49,68,.06);
}
#${TEAM_CARD_ID} .hani-team-photo-label b{
  color:#384152;
  font-size:9.5px;
  font-weight:1000;
  white-space:nowrap;
}
#${TEAM_CARD_ID} .hani-team-photo-label span{
  color:var(--hani-season-accent);
  font-size:7.8px;
  font-weight:900;
  white-space:nowrap;
}
.sidebar-mini #${TEAM_CARD_ID}{display:none!important}

/* Newsroom: the season owns the large surface; finance blue becomes an accent. */
#newsroom .ai-banner{
  --banner-soft:var(--hani-season-soft)!important;
  --banner-line:var(--hani-season-line)!important;
  background:linear-gradient(120deg,var(--hani-season-soft) 0%,var(--hani-season-surface) 64%,#fff 100%)!important;
  border-color:var(--hani-season-line)!important;
  border-left:4px solid var(--finance)!important;
}
#newsroom .ai-banner:before,
#newsroom .ai-banner:after{
  background:color-mix(in srgb,var(--hani-season-accent) 10%,transparent)!important;
}
#newsroom .investment-news-note,
#newsroom .investment-news-toolbar,
#newsroom .newsroom-mode-tabs,
#newsroom .investment-news-board-shell>.sh{
  background:linear-gradient(135deg,var(--hani-season-surface),#fff)!important;
  border-color:var(--hani-season-line)!important;
}
#newsroom .investment-news-note b,
#newsroom .investment-news-board-shell>.sh h3{
  color:#303746!important;
}
#newsroom .investment-news-note span,
#newsroom .investment-news-board-shell>.sh .sub{
  color:#737d8f!important;
}

/* Comment chip: no nested <button> inside the native row button. */
#newsroom .hani-news-comment-chip-v02973{
  user-select:none;
  touch-action:manipulation;
}
#newsroom .hani-news-comment-chip-v02973:focus-visible{
  outline:2px solid var(--hani-season-accent)!important;
  outline-offset:2px!important;
}

/* v2.9.70 "more" pagination is superseded by page-number navigation. */
#newsroom .hani-newsroom-pager-v02970{display:none!important}
#newsroom .hani-newsroom-paged-out-v02970{display:block!important}
#newsroom .hani-newsroom-page-hidden-v02973{display:none!important}
#${PAGER_ID}{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:12px 14px;
  border-top:1px solid var(--hani-season-line);
  background:linear-gradient(135deg,var(--hani-season-surface),#fff);
}
#${PAGER_ID} .pager-status{
  color:#7b8494;
  font-size:10.5px;
  font-weight:820;
  white-space:nowrap;
}
#${PAGER_ID} .pager-pages{
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:5px;
  flex-wrap:wrap;
}
#${PAGER_ID} button{
  appearance:none;
  min-width:30px;
  height:30px;
  padding:0 8px;
  border:1px solid #dfe3eb;
  border-radius:9px;
  background:#fff;
  color:#596274;
  font:inherit;
  font-size:10px;
  font-weight:900;
  cursor:pointer;
}
#${PAGER_ID} button:hover:not(:disabled){
  border-color:var(--hani-season-accent);
  color:var(--hani-season-accent);
}
#${PAGER_ID} button.active{
  border-color:var(--hani-season-accent);
  background:var(--hani-season-accent);
  color:#fff;
}
#${PAGER_ID} button:disabled{
  opacity:.36;
  cursor:default;
}
@media(max-width:650px){
  #${TEAM_CARD_ID} .hani-team-photo-frame{height:auto}
  #${PAGER_ID}{align-items:flex-start;flex-direction:column}
  #${PAGER_ID} .pager-pages{justify-content:flex-start}
}
`;
    document.head.appendChild(style);
  }

  function installTeamPhoto() {
    const sidebar = q('#sidebar');
    if (!sidebar || q(`#${TEAM_CARD_ID}`, sidebar)) return;

    const foot = q('.foot', sidebar);
    const card = document.createElement('div');
    card.id = TEAM_CARD_ID;
    card.setAttribute('aria-label', '성민 AI TEAM 단체사진');
    card.innerHTML = `
      <div class="hani-team-photo-frame">
        <img src="./assets/team/hani-team-picnic.webp" alt="성민 AI TEAM 야유회 단체사진 · 9명 전원">
        <div class="hani-team-photo-label">
          <b>성민 AI TEAM</b>
          <span>Life, Going On.</span>
        </div>
      </div>
    `;
    q('img', card).addEventListener('error', () => { card.hidden = true; }, { once:true });

    if (foot) foot.insertAdjacentElement('beforebegin', card);
    else sidebar.appendChild(card);
  }

  function scheduleCommentScroll(row) {
    if (!row) return;
    window.setTimeout(() => {
      const comments = q('.news-agent-comments', row);
      if (comments && row.classList.contains('open')) {
        comments.scrollIntoView({ behavior:'smooth', block:'nearest' });
      }
    }, 100);
  }

  function fixCommentChips() {
    // The v02982 event owner also owns comment controls.
    if(window.HANI_UI_V02982_NEWSROOM_EVENT_IDENTITY_FIX) return;
    qa('#newsroom button.hani-news-comment-chip-v02970').forEach(oldChip => {
      const row = oldChip.closest('.newsroom-v03-row,.investment-news-board-row');
      const chip = document.createElement('span');

      // Keep the v2.9.70 class so its updater sees the existing chip and does not recreate a nested button.
      chip.className = `${oldChip.className} hani-news-comment-chip-v02973`;
      chip.textContent = oldChip.textContent || '';
      chip.setAttribute('role', 'button');
      chip.tabIndex = 0;
      const label = oldChip.getAttribute('aria-label');
      if (label) chip.setAttribute('aria-label', label);

      // Mouse/touch click intentionally bubbles to the native row button once.
      chip.addEventListener('click', () => scheduleCommentScroll(row));

      // Keyboard activation is explicit and single-shot.
      chip.addEventListener('keydown', ev => {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.preventDefault();
        ev.stopPropagation();
        const ownerRow = chip.closest('.newsroom-v03-row,.investment-news-board-row') || row;
        const opener = ownerRow && q('.newsroom-v03-main,.investment-news-row-main', ownerRow);
        if (opener && typeof opener.click === 'function') opener.click();
        scheduleCommentScroll(ownerRow);
      });

      oldChip.replaceWith(chip);
    });

    // If a future renderer already creates a span, mark it as fixed without replacing it.
    qa('#newsroom span.hani-news-comment-chip-v02970:not(.hani-news-comment-chip-v02973)').forEach(chip => {
      chip.classList.add('hani-news-comment-chip-v02973');
    });
  }

  function feedRows() {
    const feed = q('#investmentNewsFeed');
    if (!feed) return [];
    return qa('.newsroom-v03-row,.investment-news-board-row', feed)
      .filter((el, idx, arr) => arr.indexOf(el) === idx);
  }

  function pageWindow(totalPages, page) {
    if (totalPages <= 7) return Array.from({length:totalPages}, (_,i) => i + 1);
    const pages = new Set([1, totalPages, page - 1, page, page + 1]);
    if (page <= 3) [2,3,4].forEach(x => pages.add(x));
    if (page >= totalPages - 2) [totalPages - 3,totalPages - 2,totalPages - 1].forEach(x => pages.add(x));
    return [...pages].filter(x => x >= 1 && x <= totalPages).sort((a,b) => a - b);
  }

  function renderNumericPager() {
    const feed = q('#investmentNewsFeed');
    if (!feed) return;

    const rows = feedRows();
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, total);

    rows.forEach((row, i) => {
      row.classList.toggle('hani-newsroom-page-hidden-v02973', i < start || i >= end);
    });

    let pager = q(`#${PAGER_ID}`);
    if (!pager) {
      pager = document.createElement('nav');
      pager.id = PAGER_ID;
      pager.setAttribute('aria-label', '종목 뉴스 페이지');
      pager.innerHTML = `<span class="pager-status"></span><div class="pager-pages"></div>`;
      const oldPager = q('#haniNewsroomPagerV02970');
      if (oldPager) oldPager.insertAdjacentElement('afterend', pager);
      else feed.insertAdjacentElement('afterend', pager);
    }

    if (total <= PAGE_SIZE) {
      pager.hidden = true;
      return;
    }
    pager.hidden = false;

    const status = q('.pager-status', pager);
    const pages = q('.pager-pages', pager);
    status.textContent = `${start + 1}–${end} / ${total}건`;

    pages.innerHTML = '';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.textContent = '‹';
    prev.setAttribute('aria-label', '이전 페이지');
    prev.disabled = currentPage === 1;
    prev.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage -= 1;
        renderNumericPager();
        feed.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
    pages.appendChild(prev);

    const wanted = pageWindow(totalPages, currentPage);
    let last = 0;
    wanted.forEach(p => {
      if (last && p - last > 1) {
        const gap = document.createElement('span');
        gap.textContent = '…';
        gap.setAttribute('aria-hidden', 'true');
        gap.style.cssText = 'padding:0 2px;color:#9aa1af;font-size:10px;font-weight:900';
        pages.appendChild(gap);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = String(p);
      btn.classList.toggle('active', p === currentPage);
      btn.setAttribute('aria-label', `${p}페이지`);
      if (p === currentPage) btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', () => {
        currentPage = p;
        renderNumericPager();
        feed.scrollIntoView({behavior:'smooth', block:'start'});
      });
      pages.appendChild(btn);
      last = p;
    });

    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = '›';
    next.setAttribute('aria-label', '다음 페이지');
    next.disabled = currentPage === totalPages;
    next.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage += 1;
        renderNumericPager();
        feed.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
    pages.appendChild(next);
  }

  function refresh() {
    queued = false;
    installTeamPhoto();
    fixCommentChips();
    renderNumericPager();
  }

  function queueRefresh() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(refresh);
  }

  function bindFilters() {
    ['investmentNewsEntityFilter','investmentNewsGradeFilter','investmentNewsSentimentFilter']
      .forEach(id => {
        const el = document.getElementById(id);
        if (!el || el.dataset.haniV02973Bound === '1') return;
        el.dataset.haniV02973Bound = '1';
        el.addEventListener('change', () => {
          currentPage = 1;
          queueRefresh();
        });
      });
  }

  function boot() {
    injectStyle();
    bindFilters();
    refresh();

    const root = q('#newsroom') || document.body;
    observer = new MutationObserver(mutations => {
      // We only need child/attribute changes that can affect row/chip existence.
      if (mutations.some(m => m.type === 'childList' || (m.type === 'attributes' && m.attributeName === 'class'))) {
        queueRefresh();
      }
    });
    observer.observe(root, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });

    // Safety refresh after the native newsroom observer/render loop settles.
    setTimeout(queueRefresh, 350);
    setTimeout(queueRefresh, 1000);

    console.info('[HANI OS] v2.9.73 UI Candidate active · Theme Harmony / Team Photo / Newsroom UX');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once:true });
  } else {
    boot();
  }
})();
