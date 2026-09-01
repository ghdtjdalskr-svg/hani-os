/* =========================================================
   HANI OS v2.9.69 Candidate
   Newsroom Archive UX v0.2
   UI-only patch: no Supabase write, no localStorage mutation,
   no schema/storage-key changes.
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_NEWSROOM_UX_V02969';
  const STYLE_ID = 'hani-newsroom-ux-v02969-style';
  const PAGE_SIZE = 20;
  const PAGED_OUT = 'hani-newsroom-paged-out-v02969';
  const ROOT_SELECTOR = '#newsroom';

  let visibleLimit = PAGE_SIZE;
  let scheduled = false;
  let observer = null;

  function q(sel, root = document) { return root.querySelector(sel); }
  function qa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function setText(el, value) {
    if (!el) return;
    if ((el.textContent || '').trim() !== value) el.textContent = value;
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
/* ===== v2.9.69 · Newsroom Archive UX v0.2 ===== */
#newsroom .investment-news-entity-row{
  display:grid!important;
  grid-template-columns:minmax(165px,.9fr) minmax(118px,.55fr) minmax(300px,2.65fr) minmax(158px,.72fr)!important;
  grid-template-areas:"entity signal summary count"!important;
  align-items:center!important;
  column-gap:14px!important;
}
#newsroom .investment-news-entity-row .news-entity-main{grid-area:entity!important;min-width:0}
#newsroom .investment-news-entity-row .news-entity-signal{
  grid-area:signal!important;justify-self:start!important;white-space:nowrap!important;
  font-size:10.5px!important;padding:6px 9px!important;font-weight:950!important
}
#newsroom .investment-news-entity-row .news-entity-summary{
  grid-area:summary!important;min-width:0!important;font-size:12px!important;line-height:1.55!important
}
#newsroom .investment-news-entity-row .news-entity-count{
  grid-area:count!important;justify-self:end!important;white-space:nowrap!important;
  font-size:10.5px!important;font-weight:900!important
}
#newsroom .investment-news-entity-row.newsroom-no-stored-news-v02969 .news-entity-count{
  display:inline-flex;align-items:center;justify-content:center;
  padding:6px 9px;border-radius:999px;background:#f4f5f8;border:1px solid #e1e4eb;
  color:#6d7586!important
}
#newsroom .investment-news-entity-row.newsroom-no-stored-news-v02969 .news-entity-summary{
  color:#687184!important
}
#newsroom .hani-news-new-badge-v02969,
#newsroom .hani-news-existing-new-v02969{
  display:inline-flex!important;align-items:center!important;justify-content:center!important;
  min-height:22px!important;padding:3px 8px!important;margin-left:7px!important;border-radius:999px!important;
  background:#6c55d9!important;color:#fff!important;border:1px solid #5c45ca!important;
  font-size:10px!important;font-weight:1000!important;letter-spacing:.035em!important;
  line-height:1!important;vertical-align:middle!important;box-shadow:0 3px 9px rgba(76,57,180,.18)!important;
  opacity:1!important;visibility:visible!important
}
#newsroom .hani-news-comment-chip-v02969{
  display:inline-flex;align-items:center;gap:4px;margin-left:7px;padding:4px 8px;border-radius:999px;
  border:1px solid #ded8fb;background:#f5f2ff;color:#5e4bc5;font-size:10px;font-weight:950;
  line-height:1.1;cursor:pointer;white-space:nowrap;vertical-align:middle
}
#newsroom .hani-news-comment-chip-v02969:hover{background:#eee9ff;border-color:#cfc4f7}
#newsroom .hani-news-comment-chip-v02969:focus-visible{outline:2px solid #7763da;outline-offset:2px}
#newsroom .${PAGED_OUT}{display:none!important}
#newsroom .hani-newsroom-pager-v02969{
  display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;
  border-top:1px solid #e8eaf0;background:#fbfcfe
}
#newsroom .hani-newsroom-pager-v02969 span{
  font-size:11px;font-weight:800;color:#7a8292;line-height:1.45
}
#newsroom .hani-newsroom-pager-v02969 button{
  appearance:none;border:1px solid #d9d4f3;background:#fff;color:#5d4cc3;border-radius:10px;
  padding:8px 12px;font:inherit;font-size:11px;font-weight:950;cursor:pointer
}
#newsroom .hani-newsroom-pager-v02969 button:hover{background:#f6f3ff}
#newsroom .hani-newsroom-pager-v02969 button[hidden]{display:none!important}

#newsroom .hani-weekly-archive-nav-v02969{
  display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
  margin:0 0 8px;padding:10px 12px;border:1px solid #e2def7;border-radius:13px;
  background:linear-gradient(135deg,#fbfaff,#fff)
}
#newsroom .hani-weekly-archive-nav-v02969 .archive-copy{display:grid;gap:2px}
#newsroom .hani-weekly-archive-nav-v02969 .archive-copy b{font-size:12.5px;color:#4f426f}
#newsroom .hani-weekly-archive-nav-v02969 .archive-copy span{font-size:10.5px;color:#7d8493}
#newsroom .hani-weekly-archive-nav-v02969 select{
  min-width:190px;max-width:100%;border:1px solid #d9d4ef;background:#fff;color:#4b5367;
  border-radius:10px;padding:8px 10px;font:inherit;font-size:11px;font-weight:850
}
#newsroom .hani-market-direction-v02969{
  display:inline-flex;align-items:center;justify-content:center;margin-left:auto;white-space:nowrap;
  padding:5px 8px;border-radius:999px;font-size:10px;font-weight:1000;border:1px solid transparent
}
#newsroom .hani-market-direction-v02969[data-direction="up"]{background:#fff1f2;border-color:#f1c8cd;color:#b64e57}
#newsroom .hani-market-direction-v02969[data-direction="down"]{background:#eef4ff;border-color:#cbd9f5;color:#486caf}
#newsroom .hani-market-direction-v02969[data-direction="mixed"]{background:#f4efff;border-color:#dccff7;color:#7554b5}
#newsroom .hani-market-direction-v02969[data-direction="flat"]{background:#f3f4f6;border-color:#e1e4e9;color:#6d7481}
#newsroom .newsroom-market-title{display:flex!important;align-items:center!important}
#newsroom .newsroom-market-title>div{min-width:0}

@media(max-width:900px){
  #newsroom .investment-news-entity-row{
    grid-template-columns:minmax(140px,1fr) minmax(110px,.55fr) minmax(150px,1.5fr)!important;
    grid-template-areas:
      "entity signal count"
      "summary summary summary"!important;
    row-gap:7px!important
  }
  #newsroom .investment-news-entity-row .news-entity-count{justify-self:end!important}
  #newsroom .investment-news-entity-row .news-entity-summary{white-space:normal!important}
}
@media(max-width:620px){
  #newsroom .investment-news-entity-row{
    grid-template-columns:minmax(0,1fr) auto!important;
    grid-template-areas:
      "entity count"
      "signal signal"
      "summary summary"!important;
    padding:12px!important
  }
  #newsroom .investment-news-entity-row .news-entity-signal{margin-top:1px}
  #newsroom .investment-news-entity-row .news-entity-count{max-width:100%;font-size:9.5px!important}
  #newsroom .hani-newsroom-pager-v02969{align-items:flex-start;flex-direction:column}
  #newsroom .hani-newsroom-pager-v02969 button{width:100%}
  #newsroom .hani-weekly-archive-nav-v02969{align-items:stretch;flex-direction:column}
  #newsroom .hani-weekly-archive-nav-v02969 select{width:100%;min-width:0}
  #newsroom .hani-market-direction-v02969{margin-left:6px}
}
`;
    document.head.appendChild(style);
  }

  function parseCount(text) {
    const m = String(text || '').match(/(\d+)\s*건/);
    return m ? Number(m[1]) : null;
  }

  function stripMarketContext(text) {
    return String(text || '')
      .replace(/^시장\s*맥락\s*[·:]\s*/i, '')
      .replace(/^발행사\s*맥락\s*[·:]\s*/i, '')
      .trim();
  }

  function normalizeEntityRows() {
    qa(`${ROOT_SELECTOR} .investment-news-entity-row`).forEach(row => {
      const countEl = q('.news-entity-count', row);
      const signalEl = q('.news-entity-signal', row);
      if (!countEl) return;

      const n = parseCount(countEl.textContent);
      if (n === null) return;

      if (n === 0) {
        row.classList.add('newsroom-no-stored-news-v02969');
        setText(countEl, '신규 뉴스 없음 · 저장 0건');
        if (signalEl) {
          const base = stripMarketContext(signalEl.textContent);
          const next = base ? `시장 맥락 · ${base}` : '시장 맥락';
          setText(signalEl, next);
          signalEl.title = '저장된 개별 뉴스가 아니라 최근 시장·발행사 맥락에 대한 평가입니다.';
        }
      } else {
        row.classList.remove('newsroom-no-stored-news-v02969');
        if ((countEl.textContent || '').includes('저장')) setText(countEl, `${n}건`);
        if (signalEl) {
          const base = stripMarketContext(signalEl.textContent);
          if (base) setText(signalEl, base);
          signalEl.removeAttribute('title');
        }
      }
    });
  }

  function getFeedRows() {
    const feed = q('#investmentNewsFeed');
    if (!feed) return [];
    let rows = Array.from(feed.children).filter(el =>
      el.matches('.newsroom-v03-row,.investment-news-board-row')
    );
    if (!rows.length) {
      rows = Array.from(feed.children).filter(el =>
        !!q('.newsroom-v03-main,.investment-news-row-main', el)
      );
    }
    return rows;
  }

  function ensurePager() {
    const feed = q('#investmentNewsFeed');
    if (!feed) return;

    const rows = getFeedRows();
    let pager = q('#haniNewsroomPagerV02969');
    if (!pager) {
      pager = document.createElement('div');
      pager.id = 'haniNewsroomPagerV02969';
      pager.className = 'hani-newsroom-pager-v02969';
      pager.innerHTML = `
        <span class="pager-status"></span>
        <button type="button" class="pager-more">이전 뉴스 더 보기</button>
      `;
      feed.insertAdjacentElement('afterend', pager);
      q('.pager-more', pager).addEventListener('click', () => {
        visibleLimit += PAGE_SIZE;
        applyPagination();
      });
    }

    rows.forEach((row, i) => row.classList.toggle(PAGED_OUT, i >= visibleLimit));

    const shown = Math.min(visibleLimit, rows.length);
    const status = q('.pager-status', pager);
    const more = q('.pager-more', pager);
    if (rows.length > PAGE_SIZE) {
      setText(status, `최신 ${shown}건 표시 · 현재 불러온 ${rows.length}건`);
    } else {
      setText(status, `현재 불러온 뉴스 ${rows.length}건 · 과거 뉴스는 Cloud Archive에 계속 누적됩니다.`);
    }
    if (more) {
      more.hidden = shown >= rows.length;
      if (!more.hidden) more.textContent = `이전 뉴스 ${Math.min(PAGE_SIZE, rows.length - shown)}건 더 보기`;
    }
  }

  function applyPagination() {
    const rows = getFeedRows();
    rows.forEach((row, i) => row.classList.toggle(PAGED_OUT, i >= visibleLimit));
    ensurePager();
  }

  function isUnread(row) {
    if (!row) return false;
    if (row.matches('[data-read="false"],[data-is-read="false"],[data-unread="true"],.is-unread,.unread,.is-new')) return true;
    if (q('[data-read="false"],[data-is-read="false"],[data-unread="true"],.is-unread,.unread,.is-new', row)) return true;

    return qa('span,em,small,i,strong,b', row).some(el => {
      if (el.classList.contains('hani-news-new-badge-v02969')) return false;
      const t = (el.textContent || '').trim().toUpperCase();
      return t === 'NEW' || t === 'NEW!' || t === '새글' || t === '새 글';
    });
  }

  function enhanceNewBadges() {
    getFeedRows().forEach(row => {
      const title = q('.newsroom-v03-title,.news-col-title', row);
      if (!title) return;

      const unread = isUnread(row);
      const existing = qa('span,em,small,i,strong,b', row).find(el => {
        if (el.classList.contains('hani-news-new-badge-v02969')) return false;
        const t = (el.textContent || '').trim().toUpperCase();
        return t === 'NEW' || t === 'NEW!' || t === '새글' || t === '새 글';
      });

      if (existing) existing.classList.add('hani-news-existing-new-v02969');

      let chip = q('.hani-news-new-badge-v02969', title);
      if (unread && !existing) {
        if (!chip) {
          chip = document.createElement('span');
          chip.className = 'hani-news-new-badge-v02969';
          chip.textContent = '● NEW';
          const headline = q('b,strong', title);
          if (headline) headline.insertAdjacentElement('afterend', chip);
          else title.prepend(chip);
        }
      } else if (!unread && chip) {
        chip.remove();
      }
    });
  }

  function commentCount(row) {
    const comments = qa('.news-agent-comments .news-agent-comment', row);
    if (comments.length) return comments.length;

    const headCount = q('.news-comments-head span', row);
    if (headCount) {
      const m = (headCount.textContent || '').match(/(\d+)/);
      if (m) return Number(m[1]);
    }
    return 0;
  }

  function enhanceCommentChips() {
    getFeedRows().forEach(row => {
      const title = q('.newsroom-v03-title,.news-col-title', row);
      if (!title) return;
      const count = commentCount(row);
      let chip = q('.hani-news-comment-chip-v02969', title);

      if (count > 0) {
        if (!chip) {
          chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'hani-news-comment-chip-v02969';
          chip.addEventListener('click', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            const ownerRow = chip.closest('.newsroom-v03-row,.investment-news-board-row') || row;
            const expanded = ownerRow.classList.contains('open') ||
              q('[aria-expanded="true"]', ownerRow);
            if (!expanded) {
              const opener = q('.newsroom-v03-main,.investment-news-row-main', ownerRow);
              if (opener && typeof opener.click === 'function') opener.click();
            }
            setTimeout(() => {
              const commentsBox = q('.news-agent-comments', ownerRow);
              if (commentsBox && ownerRow.classList.contains('open')) {
                commentsBox.scrollIntoView({behavior:'smooth', block:'nearest'});
              }
            }, 120);
          });
          const headline = q('b,strong', title);
          if (headline) headline.insertAdjacentElement('afterend', chip);
          else title.appendChild(chip);
        }
        chip.setAttribute('aria-label', `AI TEAM 댓글 ${count}개 보기`);
        chip.textContent = `💬 AI TEAM ${count}`;
      } else if (chip) {
        chip.remove();
      }
    });
  }

  function ensureWeeklyArchiveNav() {
    const tabs = q('#investmentNewsWeeklyArchiveTabs');
    if (!tabs) return;
    const buttons = qa('.newsroom-weekly-archive-btn', tabs);
    if (!buttons.length) return;

    let nav = q('#haniWeeklyArchiveNavV02969');
    if (!nav) {
      nav = document.createElement('div');
      nav.id = 'haniWeeklyArchiveNavV02969';
      nav.className = 'hani-weekly-archive-nav-v02969';
      nav.innerHTML = `
        <div class="archive-copy">
          <b>주차별 아카이브</b>
          <span class="archive-status"></span>
        </div>
        <select class="archive-select" aria-label="주간 시황 아카이브 주차 선택"></select>
      `;
      tabs.insertAdjacentElement('beforebegin', nav);
      q('.archive-select', nav).addEventListener('change', ev => {
        const idx = Number(ev.target.value);
        const currentButtons = qa('.newsroom-weekly-archive-btn', tabs);
        if (Number.isInteger(idx) && currentButtons[idx]) currentButtons[idx].click();
      });
    }

    const status = q('.archive-status', nav);
    const select = q('.archive-select', nav);
    const activeIndex = Math.max(0, buttons.findIndex(btn => btn.classList.contains('active')));

    const desired = buttons.map((btn, i) => {
      const label = (q('b', btn)?.textContent || btn.textContent || `주차 ${i + 1}`).trim();
      return {i, label};
    });

    const signature = JSON.stringify(desired);
    if (select.dataset.signature !== signature) {
      select.innerHTML = '';
      desired.forEach(item => {
        const opt = document.createElement('option');
        opt.value = String(item.i);
        opt.textContent = item.label;
        select.appendChild(opt);
      });
      select.dataset.signature = signature;
    }
    select.value = String(activeIndex);

    if (buttons.length === 1) {
      setText(status, '현재 1주 저장 · 다음 주 발행부터 이곳에 계속 누적됩니다.');
    } else {
      setText(status, `총 ${buttons.length}주 저장 · 원하는 주차를 선택해 과거 시황을 다시 볼 수 있습니다.`);
    }
  }

  function countMatches(text, patterns) {
    return patterns.reduce((n, re) => n + ((text.match(re) || []).length), 0);
  }

  function marketDirection(text) {
    const src = String(text || '').replace(/\s+/g, ' ').trim();
    if (!src) return {key:'flat', label:'➖ 보합'};

    // Prefer phrases whose subject is actually an equity index/market.
    // This avoids treating "금리 상승" or "유가 상승" as a stock-market rise.
    const indexSubject = '(?:KOSPI|코스피|S&P\\s*500|S&P|나스닥|NASDAQ|다우|DOW|주요\\s*지수|주가지수|기술주)';
    const directUp = new RegExp(indexSubject + '[^.!?]{0,95}?(?:\\d+(?:\\.\\d+)?%\\s*)?(?:상승|강세|반등|올랐|회복)', 'i').test(src);
    const directDown = new RegExp(indexSubject + '[^.!?]{0,95}?(?:\\d+(?:\\.\\d+)?%\\s*)?(?:하락|약세|조정|밀렸|내렸)', 'i').test(src);

    if (directUp && !directDown) return {key:'up', label:'📈 상승'};
    if (directDown && !directUp) return {key:'down', label:'📉 하락'};
    if (directUp && directDown) return {key:'mixed', label:'⚖️ 혼조'};

    const marketUp = /(?:증시|주식시장|지수)[^.!?]{0,55}?(?:상승|강세|반등|올랐|회복)|(?:상승|강세|반등)[^.!?]{0,35}?(?:마감|종가)/i.test(src);
    const marketDown = /(?:증시|주식시장|지수)[^.!?]{0,55}?(?:하락|약세|조정|밀렸|내렸)|(?:하락|약세|조정)[^.!?]{0,35}?(?:마감|종가)/i.test(src);

    if (marketUp && marketDown) return {key:'mixed', label:'⚖️ 혼조'};
    if (marketUp) return {key:'up', label:'📈 상승'};
    if (marketDown) return {key:'down', label:'📉 하락'};
    return {key:'flat', label:'➖ 보합'};
  }

  function enhanceMarketDirections() {
    [
      ['#investmentNewsKoreaBrief', 'KOREA'],
      ['#investmentNewsUsBrief', 'US']
    ].forEach(([briefSelector]) => {
      const brief = q(briefSelector);
      if (!brief) return;
      const card = brief.closest('.newsroom-market-card');
      const title = card && q('.newsroom-market-title', card);
      if (!title) return;

      const direction = marketDirection(brief.textContent);
      let chip = q('.hani-market-direction-v02969', title);
      if (!chip) {
        chip = document.createElement('span');
        chip.className = 'hani-market-direction-v02969';
        title.appendChild(chip);
      }
      chip.dataset.direction = direction.key;
      chip.textContent = direction.label;
      chip.title = '해당 주간 브리핑 문구에서 읽은 시장 방향입니다.';
    });
  }

  function applyAll() {
    const root = q(ROOT_SELECTOR);
    if (!root) return;
    injectStyle();
    normalizeEntityRows();
    applyPagination();
    enhanceNewBadges();
    enhanceCommentChips();
    ensureWeeklyArchiveNav();
    enhanceMarketDirections();
    root.dataset.newsroomUxPatch = PATCH_ID;
  }

  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    const run = () => {
      scheduled = false;
      applyAll();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else setTimeout(run, 16);
  }

  function bindFilterReset() {
    ['investmentNewsEntityFilter','investmentNewsGradeFilter','investmentNewsSentimentFilter'].forEach(id => {
      const el = document.getElementById(id);
      if (!el || el.dataset.haniPagerBound === '1') return;
      el.dataset.haniPagerBound = '1';
      el.addEventListener('change', () => {
        visibleLimit = PAGE_SIZE;
        setTimeout(scheduleApply, 0);
      });
    });
  }

  function start() {
    injectStyle();
    bindFilterReset();
    applyAll();

    const root = q(ROOT_SELECTOR) || document.body;
    observer = new MutationObserver(() => {
      bindFilterReset();
      scheduleApply();
    });
    observer.observe(root, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['class','hidden','aria-expanded','data-read','data-is-read','data-unread']});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true});
  } else {
    start();
  }
})();
