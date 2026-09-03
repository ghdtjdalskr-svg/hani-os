/* =========================================================
   HANI OS v2.9.75 · Newsroom Clarity / Readability
   UI-only renderer guard.
   - NO archive delete
   - NO Supabase write/schema changes
   - status/sentinel rows are excluded from article UI/counts only
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_NEWSROOM_CLARITY_V02975';
  const STYLE_ID = 'hani-newsroom-clarity-v02974-r2-style';
  const SUMMARY_HEAD_ID = 'haniNewsroomSummaryHeadV02974R2';
  const PAGER_ID = 'haniNewsroomPagerV02974R2';
  const PAGE_SIZE = 20;
  const HIDDEN_SENTINEL = 'hani-news-no-material-v02974-r2';
  const PAGE_HIDDEN = 'hani-news-page-hidden-v02974-r2';

  if (window[PATCH_ID]) return;
  window[PATCH_ID] = true;

  let currentPage = 1;
  let scheduled = false;
  let observer = null;

  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const SENTINEL_PATTERNS = [
    /NO_MATERIAL_NEW_DISCLOSURE/i,
    /최근\s*72시간\s*내\s*유의미한\s*신규\s*공시\s*미확인/i,
    /유의미한\s*신규\s*(?:뉴스|공시|기사).*(?:없음|미확인)/i,
    /신규\s*(?:뉴스|공시|기사)\s*(?:없음|미확인)/i
  ];

  function injectStyle(){
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
/* ===== v2.9.74 R2 · Newsroom readability ===== */

/* v2.9.73 pager counts raw renderer rows, including sentinel rows.
   R2 owns visible article pagination so counts and pages mean real articles only. */
#newsroom #haniNewsroomPagerV02973{display:none!important}
#newsroom .hani-newsroom-page-hidden-v02973:not(.${HIDDEN_SENTINEL}){display:block!important}
#newsroom .${HIDDEN_SENTINEL},
#newsroom .${PAGE_HIDDEN}{display:none!important}

/* Explicit semantic split: upper area = summary, lower area = article archive. */
#${SUMMARY_HEAD_ID}{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:14px;
  padding:14px 15px 11px;
  margin:8px 0 0;
  border:1px solid #e1e6ee;
  border-bottom:0;
  border-radius:15px 15px 0 0;
  background:#fff;
}
#${SUMMARY_HEAD_ID} .hani-summary-head-copy{
  display:grid;
  gap:4px;
  min-width:0;
}
#${SUMMARY_HEAD_ID} b{
  color:#303a4b;
  font-size:16px;
  line-height:1.25;
  font-weight:1000;
}
#${SUMMARY_HEAD_ID} span{
  color:#747f91;
  font-size:12px;
  line-height:1.5;
  font-weight:720;
}
#${SUMMARY_HEAD_ID} em{
  flex:0 0 auto;
  padding:5px 9px;
  border:1px solid color-mix(in srgb,var(--hani-season-dot,#735bd7) 22%,#e1e6ee);
  border-radius:999px;
  background:color-mix(in srgb,var(--hani-season-dot,#735bd7) 6%,#fff);
  color:var(--hani-season-dot,#735bd7);
  font-size:10.5px;
  font-style:normal;
  font-weight:950;
}

/* Upper entity summary: readable on 13–16 inch laptop displays. */
#newsroom .investment-news-entity-row{
  min-height:64px!important;
  padding:12px 14px!important;
  background:#fff!important;
}
#newsroom .investment-news-entity-row .news-entity-main{
  font-size:13.5px!important;
  line-height:1.35!important;
}
#newsroom .investment-news-entity-row .news-entity-main b,
#newsroom .investment-news-entity-row .news-entity-main strong{
  font-size:14px!important;
  font-weight:950!important;
  color:#313b4c!important;
}
#newsroom .investment-news-entity-row .news-entity-main small{
  font-size:10.5px!important;
  line-height:1.4!important;
  color:#8490a3!important;
}
#newsroom .investment-news-entity-row .news-entity-signal{
  font-size:11.5px!important;
  padding:6px 10px!important;
}
#newsroom .investment-news-entity-row .news-entity-summary{
  font-size:13px!important;
  line-height:1.58!important;
  color:#596578!important;
}
#newsroom .investment-news-entity-row .news-entity-count{
  font-size:12px!important;
  color:#5f6b7e!important;
}
#newsroom .hani-summary-date-v02974-r2{
  display:block;
  width:max-content;
  max-width:100%;
  margin-top:5px;
  padding:3px 7px;
  border-radius:999px;
  background:#f5f7fa;
  color:#758196;
  font-size:10.5px;
  line-height:1.25;
  font-weight:820;
  white-space:nowrap;
}

/* Lower board = actual article archive. Increase headline/meta readability. */
#newsroom .investment-news-board-shell>.sh{
  padding-top:15px!important;
  padding-bottom:14px!important;
}
#newsroom .investment-news-board-shell>.sh h3{
  font-size:17px!important;
  font-weight:1000!important;
  color:#293547!important;
}
#newsroom .investment-news-board-shell>.sh .sub{
  font-size:12px!important;
  line-height:1.5!important;
  color:#748095!important;
}
#newsroom .investment-news-board-shell select,
#newsroom .investment-news-board-shell button{
  font-size:11.5px!important;
}
#newsroom .newsroom-v03-row,
#newsroom .investment-news-board-row{
  min-height:76px!important;
}
#newsroom .newsroom-v03-row .newsroom-v03-main,
#newsroom .investment-news-board-row .investment-news-row-main{
  padding-top:13px!important;
  padding-bottom:13px!important;
}
#newsroom .newsroom-v03-title b,
#newsroom .newsroom-v03-title strong,
#newsroom .news-col-title b,
#newsroom .news-col-title strong{
  font-size:14.5px!important;
  line-height:1.4!important;
  font-weight:950!important;
  color:#253247!important;
}
#newsroom .newsroom-v03-title small,
#newsroom .news-col-title small{
  font-size:11px!important;
  line-height:1.5!important;
  color:#738098!important;
}
#newsroom .hani-news-comment-chip-v02970,
#newsroom .hani-news-comment-chip-v02973{
  font-size:10.5px!important;
  min-height:23px!important;
}
#newsroom .newsroom-v03-row > :first-child,
#newsroom .investment-news-board-row > :first-child{
  font-size:12px!important;
  line-height:1.5!important;
}

/* Real-article pager. */
#${PAGER_ID}{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:12px 14px;
  border-top:1px solid #e2e7ef;
  background:#fff;
}
#${PAGER_ID}[hidden]{display:none!important}
#${PAGER_ID} .pager-status{
  color:#748095;
  font-size:11.5px;
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
  min-width:31px;
  height:31px;
  padding:0 8px;
  border:1px solid #dfe4ec;
  border-radius:9px;
  background:#fff;
  color:#596578;
  font:inherit;
  font-size:11px!important;
  font-weight:900;
  cursor:pointer;
}
#${PAGER_ID} button.active{
  border-color:var(--hani-season-dot,#735bd7);
  color:var(--hani-season-dot,#735bd7);
  background:#fff;
}
#${PAGER_ID} button:disabled{opacity:.35;cursor:default}

@media(max-width:900px){
  #${SUMMARY_HEAD_ID}{align-items:flex-start;flex-direction:column}
  #newsroom .investment-news-entity-row .news-entity-summary{font-size:12.5px!important}
}
@media(max-width:650px){
  #${SUMMARY_HEAD_ID} b{font-size:15px}
  #${SUMMARY_HEAD_ID} span{font-size:11.5px}
  #${PAGER_ID}{align-items:flex-start;flex-direction:column}
  #${PAGER_ID} .pager-pages{justify-content:flex-start}
}
`;
    document.head.appendChild(style);
  }

  function boardRows(){
    const feed = q('#investmentNewsFeed');
    if (!feed) return [];
    return qa('.newsroom-v03-row,.investment-news-board-row', feed)
      .filter((el, idx, arr) => arr.indexOf(el) === idx);
  }

  function isSentinel(row){
    if (!row) return false;
    const text = String(row.textContent || '').replace(/\s+/g,' ').trim();
    return SENTINEL_PATTERNS.some(rx => rx.test(text));
  }

  function classifyRows(){
    boardRows().forEach(row => {
      row.classList.toggle(HIDDEN_SENTINEL, isSentinel(row));
    });
  }

  function realRows(){
    return boardRows().filter(row => !isSentinel(row));
  }

  function ensureSummaryHead(){
    const first = q('#newsroom .investment-news-entity-row');
    if (!first || q(`#${SUMMARY_HEAD_ID}`)) return;

    const head = document.createElement('div');
    head.id = SUMMARY_HEAD_ID;
    head.innerHTML = `
      <div class="hani-summary-head-copy">
        <b>관심종목 최신 요약</b>
        <span>종목별 최근 흐름을 한 줄로 요약합니다. 날짜는 아래 실제 기사 중 가장 최근 기사 기준입니다.</span>
      </div>
      <em>요약 ≠ 개별 기사</em>
    `;
    first.insertAdjacentElement('beforebegin', head);
  }

  function normalizeText(text){
    return String(text || '').replace(/\s+/g,' ').trim();
  }

  function entityIdentity(summaryRow){
    const main = q('.news-entity-main', summaryRow) || summaryRow;
    const text = normalizeText(main.textContent);
    const code = text.match(/\b(?:\d{5,6}|[A-Z]{2,6})\b/)?.[0] || '';
    const nameNode = q('b,strong', main);
    let name = normalizeText(nameNode?.textContent || '');
    if (!name) {
      name = text
        .replace(/\b(?:\d{5,6}|[A-Z]{2,6})\b/g,' ')
        .replace(/한국|미국|발행회사/g,' ')
        .replace(/[·:]/g,' ')
        .replace(/\s+/g,' ')
        .trim()
        .split(' ')[0] || '';
    }
    return {code, name};
  }

  function rowMatchesEntity(row, identity){
    const text = normalizeText(row.textContent);
    if (identity.code && text.includes(identity.code)) return true;
    if (identity.name && text.includes(identity.name)) return true;
    return false;
  }

  function dateLabel(row){
    const text = normalizeText(row?.textContent);
    const m = text.match(/(\d{2}\s*\.\s*\d{2}\s*\.\s*(?:오전|오후)?\s*\d{1,2}\s*:\s*\d{2})/);
    if (!m) return '';
    return m[1]
      .replace(/\s*\.\s*/g,'.')
      .replace(/\s*:\s*/g,':')
      .replace(/\.(오전|오후)/, ' $1')
      .replace(/\s+/g,' ')
      .trim();
  }

  function ensureDateStamp(summaryRow, label){
    const main = q('.news-entity-main', summaryRow) || summaryRow;
    let stamp = q('.hani-summary-date-v02974-r2', main);
    if (!stamp) {
      stamp = document.createElement('span');
      stamp.className = 'hani-summary-date-v02974-r2';
      main.appendChild(stamp);
    }
    stamp.textContent = label;
  }

  function updateSummaryRows(){
    const all = boardRows();
    const real = all.filter(row => !isSentinel(row));
    const sentinels = all.filter(isSentinel);

    qa('#newsroom .investment-news-entity-row').forEach(summaryRow => {
      const identity = entityIdentity(summaryRow);
      const actual = real.filter(row => rowMatchesEntity(row, identity));
      const checks = sentinels.filter(row => rowMatchesEntity(row, identity));

      const count = q('.news-entity-count', summaryRow);
      if (count) count.textContent = actual.length > 0 ? `${actual.length}건` : '신규 뉴스 없음';

      const latestReal = actual[0] || null;
      const latestCheck = checks[0] || null;
      const realDate = dateLabel(latestReal);
      const checkDate = dateLabel(latestCheck);

      if (realDate) {
        ensureDateStamp(summaryRow, `최근 기사 ${realDate}`);
      } else if (checkDate) {
        ensureDateStamp(summaryRow, `최근 확인 ${checkDate}`);
      } else {
        ensureDateStamp(summaryRow, actual.length ? '최근 기사 기준' : '최근 확인 기준');
      }

      if (actual.length === 0 && checks.length > 0) {
        const summary = q('.news-entity-summary', summaryRow);
        if (summary) summary.textContent = '최근 확인 기준 유의미한 신규 기사·공시가 없습니다.';
        const signal = q('.news-entity-signal', summaryRow);
        if (signal) {
          signal.textContent = '— 신규 없음';
          signal.title = '개별 뉴스 기사가 아니라 최신 확인 상태입니다.';
        }
      }
    });
  }

  function clarifyBoardHeader(){
    const sub = q('#newsroom .investment-news-board-shell>.sh .sub');
    if (sub) {
      sub.textContent = '개별 기사 원문 · 출처 · 영향도 · HANI View · AI TEAM 댓글을 확인합니다. “신규 뉴스 없음” 확인 상태는 기사로 표시하지 않습니다.';
    }
  }

  function pageWindow(totalPages, page){
    if (totalPages <= 7) return Array.from({length:totalPages}, (_,i) => i + 1);
    const pages = new Set([1,totalPages,page-1,page,page+1]);
    if (page <= 3) [2,3,4].forEach(x => pages.add(x));
    if (page >= totalPages-2) [totalPages-3,totalPages-2,totalPages-1].forEach(x => pages.add(x));
    return [...pages].filter(x => x >= 1 && x <= totalPages).sort((a,b) => a-b);
  }

  function renderPager(){
    const feed = q('#investmentNewsFeed');
    if (!feed) return;

    const rows = realRows();
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    currentPage = Math.min(Math.max(1,currentPage), totalPages);

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, total);

    boardRows().forEach(row => row.classList.remove(PAGE_HIDDEN));
    rows.forEach((row,i) => row.classList.toggle(PAGE_HIDDEN, i < start || i >= end));

    let pager = q(`#${PAGER_ID}`);
    if (!pager) {
      pager = document.createElement('nav');
      pager.id = PAGER_ID;
      pager.setAttribute('aria-label','실제 종목 뉴스 페이지');
      pager.innerHTML = `<span class="pager-status"></span><div class="pager-pages"></div>`;
      feed.insertAdjacentElement('afterend', pager);
    }

    if (total <= PAGE_SIZE) {
      pager.hidden = true;
      return;
    }
    pager.hidden = false;

    const status = q('.pager-status', pager);
    const pages = q('.pager-pages', pager);
    status.textContent = `실제 뉴스 ${start+1}–${end} / ${total}건`;
    pages.innerHTML = '';

    const addButton = (label, page, disabled, active, aria) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.disabled = !!disabled;
      b.classList.toggle('active', !!active);
      b.setAttribute('aria-label', aria);
      if (active) b.setAttribute('aria-current','page');
      b.addEventListener('click', () => {
        currentPage = page;
        renderPager();
        feed.scrollIntoView({behavior:'smooth',block:'start'});
      });
      pages.appendChild(b);
    };

    addButton('‹', Math.max(1,currentPage-1), currentPage===1, false, '이전 페이지');

    let last = 0;
    pageWindow(totalPages,currentPage).forEach(p => {
      if (last && p-last>1) {
        const gap = document.createElement('span');
        gap.textContent = '…';
        gap.style.cssText = 'padding:0 2px;color:#98a1b1;font-size:11px;font-weight:900';
        pages.appendChild(gap);
      }
      addButton(String(p), p, false, p===currentPage, `${p}페이지`);
      last=p;
    });

    addButton('›', Math.min(totalPages,currentPage+1), currentPage===totalPages, false, '다음 페이지');
  }

  function refresh(){
    scheduled = false;
    injectStyle();
    classifyRows();
    ensureSummaryHead();
    updateSummaryRows();
    clarifyBoardHeader();
    renderPager();
  }

  function queueRefresh(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refresh);
  }

  function bindFilters(){
    ['investmentNewsEntityFilter','investmentNewsGradeFilter','investmentNewsSentimentFilter']
      .forEach(id => {
        const el = document.getElementById(id);
        if (!el || el.dataset.haniV02974R2Bound === '1') return;
        el.dataset.haniV02974R2Bound = '1';
        el.addEventListener('change', () => {
          currentPage = 1;
          queueRefresh();
        });
      });
  }

  function boot(){
    injectStyle();
    bindFilters();
    refresh();

    const root = q('#newsroom') || document.body;
    observer = new MutationObserver(mutations => {
      if (mutations.some(m => m.type === 'childList')) queueRefresh();
    });
    observer.observe(root,{childList:true,subtree:true});

    setTimeout(queueRefresh,350);
    setTimeout(queueRefresh,1000);
    console.info('[HANI OS] v2.9.75 Candidate active · No-news sentinel guard / Summary dates / Laptop readability');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  } else {
    boot();
  }
})();
