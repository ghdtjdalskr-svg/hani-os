/* =========================================================
   HANI OS v2.9.76 · Investment Identity + UI Polish
   UI-only patch.
   - NO localStorage key changes
   - NO hani_state/schema mutations
   - NO Supabase writes
   - Existing v2.9.75 newsroom archive filtering/pagination remains source-of-truth
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_UI_V02976_INVESTMENT_IDENTITY_UI_POLISH';
  const STYLE_ID = 'hani-ui-v02976-style';
  if (window[PATCH_ID]) return;
  window[PATCH_ID] = true;
  window.HANI_UI_PATCH_VERSION = '2.9.76-candidate';

  const q = (sel, root = document) => root?.querySelector?.(sel) || null;
  const qa = (sel, root = document) => root?.querySelectorAll ? Array.from(root.querySelectorAll(sel)) : [];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  const VIEW_GROUP = {
    home:'home',
    intake:'office', agentReview:'office', policy:'office', deployment:'office',
    investment:'finance', investmentIntake:'finance', asset:'finance', ledger:'finance', newsroom:'finance',
    diet:'health', exercise:'health',
    reading:'growth', study:'growth', university:'growth', certificate:'growth',
    wishlist:'life', travel:'life', movie:'life', game:'life', diary:'life',
    tasks:'system', calendar:'system', drive:'system', dev:'system', settings:'system', aiTeam:'system'
  };

  const COMPANY_IDENTITIES = [
    {id:'samsung', rx:/(삼성전자(?:우)?|005930|005935|SAMSUNG)/i, label:'Samsung', mark:'S', color:'#1877d2', logo:'https://cdn.simpleicons.org/samsung/1877D2'},
    {id:'lg', rx:/(LG전자(?:우)?|066570|066575)/i, label:'LG', mark:'LG', color:'#c9254b', logo:'https://cdn.simpleicons.org/lg/C9254B'},
    {id:'nvidia', rx:/(엔비디아|NVIDIA|\bNVDA\b)/i, label:'NVIDIA', mark:'N', color:'#76b900', logo:'https://cdn.simpleicons.org/nvidia/76B900'},
    {id:'amazon', rx:/(아마존|AMAZON|\bAMZN\b)/i, label:'Amazon', mark:'a', color:'#f59b23', logo:'https://cdn.simpleicons.org/amazon/F59B23'},
    {id:'alphabet', rx:/(알파벳|GOOGLE|\bGOOGL\b|\bGOOG\b)/i, label:'Alphabet', mark:'G', color:'#4285f4', logo:'https://cdn.simpleicons.org/google/4285F4'},
    {id:'skhynix', rx:/(SK하이닉스|하이닉스|000660)/i, label:'SK hynix', mark:'SK', color:'#e84b47', logo:''}
  ];

  const ETF_ISSUERS = [
    {id:'tiger', rx:/\bTIGER\b/i, label:'TIGER', mark:'T', color:'#ef7c18'},
    {id:'kodex', rx:/\bKODEX\b/i, label:'KODEX', mark:'K', color:'#2867e8'},
    {id:'sol', rx:/\bSOL\b/i, label:'SOL', mark:'S', color:'#1289c7'},
    {id:'rise', rx:/\bRISE\b/i, label:'RISE', mark:'R', color:'#f2c313'},
    {id:'plus', rx:/\bPLUS\b/i, label:'PLUS', mark:'P', color:'#f07728'},
    {id:'ace', rx:/\bACE\b/i, label:'ACE', mark:'A', color:'#7b61c8'},
    {id:'hanaro', rx:/\bHANARO\b/i, label:'HANARO', mark:'H', color:'#2aa579'},
    {id:'timefolio', rx:/\bTIMEFOLIO\b/i, label:'TIMEFOLIO', mark:'T', color:'#555fb8'},
    {id:'kosef', rx:/\bKOSEF\b/i, label:'KOSEF', mark:'K', color:'#5573b8'},
    {id:'arirang', rx:/\bARIRANG\b/i, label:'ARIRANG', mark:'A', color:'#f07728'}
  ];

  const TICKER_STOP = new Set(['ETF','KR','US','NEW','AI','TEAM','HANI','VIEW','NEWS','BUY','SELL','HOLD','TOTAL','MONTHLY']);

  function resolveSecurity(text) {
    const raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!raw) return null;

    for (const item of COMPANY_IDENTITIES) {
      if (item.rx.test(raw)) return {...item, type:'stock'};
    }
    for (const item of ETF_ISSUERS) {
      if (item.rx.test(raw)) return {...item, type:'etf'};
    }

    const code = raw.match(/\b\d{6}\b/)?.[0] || '';
    const ticker = (raw.match(/\b[A-Z]{1,6}\b/g) || []).find(x => !TICKER_STOP.has(x)) || '';
    if (!code && !ticker) return null;
    const token = ticker || code.slice(-2) || 'ST';
    return {
      id:`fallback-${ticker || code}`,
      type:'fallback',
      label:ticker || code,
      mark:token.slice(0,3),
      color:'#718096',
      logo:''
    };
  }

  function logoElement(identity, size = 'md') {
    const el = document.createElement('span');
    el.className = `hani-security-logo-v02976 ${size} ${identity.type}`;
    el.dataset.securityId = identity.id;
    el.style.setProperty('--security-color', identity.color);
    el.setAttribute('aria-label', identity.label);

    if (identity.logo) {
      const img = document.createElement('img');
      img.src = identity.logo;
      img.alt = '';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => el.classList.add('logo-failed'), {once:true});
      el.appendChild(img);
    }
    const fallback = document.createElement('b');
    fallback.textContent = identity.mark;
    el.appendChild(fallback);
    return el;
  }

  function prependLogo(target, identity, size = 'md') {
    if (!target || !identity) return;
    if (q(':scope > .hani-security-logo-v02976', target)) return;
    target.classList.add('hani-security-with-logo-v02976');
    target.style.setProperty('--security-color', identity.color);
    target.prepend(logoElement(identity, size));
  }

  function injectStyle() {
    if (q('#' + STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
/* ===== v2.9.76 · shared group hero color ===== */
#aiBanner{
  --hani-group-accent:#735bd7;
  --hani-group-soft:#f3efff;
  --hani-group-surface:#fff;
  background:linear-gradient(118deg,var(--hani-group-soft) 0%,#fff 66%,color-mix(in srgb,var(--hani-group-accent) 7%,#fff) 100%)!important;
  border-color:color-mix(in srgb,var(--hani-group-accent) 22%,#dfe4ec)!important;
  box-shadow:0 9px 24px rgba(45,58,82,.055)!important;
}
#aiBanner:before,#aiBanner:after{background:color-mix(in srgb,var(--hani-group-accent) 12%,transparent)!important}
#aiBanner .ai-kicker,#aiBanner .ai-quote-label{color:var(--hani-group-accent)!important}
#aiBanner .ai-quote{border-color:color-mix(in srgb,var(--hani-group-accent) 25%,#e3e7ee)!important;background:rgba(255,255,255,.86)!important}
#aiBanner[data-hani-group="office"]{--hani-group-accent:#7b61d9;--hani-group-soft:#f2edff}
#aiBanner[data-hani-group="finance"]{--hani-group-accent:#3976c8;--hani-group-soft:#edf4ff}
#aiBanner[data-hani-group="health"]{--hani-group-accent:#239d7b;--hani-group-soft:#eaf8f2}
#aiBanner[data-hani-group="growth"]{--hani-group-accent:#d18435;--hani-group-soft:#fff3e5}
#aiBanner[data-hani-group="life"]{--hani-group-accent:#2b9aa6;--hani-group-soft:#eaf8fa}
#aiBanner[data-hani-group="system"]{--hani-group-accent:#60728d;--hani-group-soft:#eef2f7}
#aiBanner[data-hani-group="home"]{--hani-group-accent:var(--hani-season-dot,#735bd7);--hani-group-soft:color-mix(in srgb,var(--hani-season-dot,#735bd7) 9%,#fff)}

/* Header is infrastructure: present but not the visual protagonist. */
header.top.ui26-top{
  background:rgba(255,255,255,.90)!important;
  border:1px solid rgba(222,227,235,.78)!important;
  box-shadow:0 5px 16px rgba(49,61,83,.035)!important;
  backdrop-filter:blur(8px);
}
header.top.ui26-top .storage-strip{
  gap:7px!important;
  color:#929aaa!important;
  font-size:10px!important;
  font-weight:680!important;
}
header.top.ui26-top .storage-strip>span:not(.save-badge){opacity:.82}
header.top.ui26-top .save-badge{
  background:#effaf5!important;
  border-color:#bfe6d4!important;
  color:#238566!important;
  box-shadow:none!important;
}
header.top.ui26-top #cloudHeaderState{font-weight:780!important;color:#788499!important}

/* Sidebar submenu icons: color belongs to the glyph, not a second floating tile. */
#sidebar .group-body .nav-btn .ico,
#sidebar .office-group .group-body .nav-btn .ico,
#sidebar .group-body .nav-btn.active .ico,
#sidebar .office-group .group-body .nav-btn.active .ico{
  background:transparent!important;
  border-color:transparent!important;
  box-shadow:none!important;
}
#sidebar .group-body .nav-btn.active .ico{transform:scale(1.04)}

/* Info desk: remove the duplicate promotional hero. Global AI banner is the single page hero. */
#intake .intake-hero.office-intake-hero{display:none!important}
#intake .intake-yuna-desk{margin-top:0!important}

/* Dense information views get dashboard-like visual hierarchy without full-color flooding. */
#university .card[data-hani-info-tone]{
  position:relative;
  border-color:color-mix(in srgb,var(--info-tone) 24%,#e1e6ee)!important;
  background:linear-gradient(135deg,color-mix(in srgb,var(--info-tone) 5%,#fff),#fff 58%)!important;
  box-shadow:0 6px 17px rgba(52,64,86,.035)!important;
}
#university .card[data-hani-info-tone]:before{
  content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:0 4px 4px 0;background:var(--info-tone)
}
#university .card[data-hani-info-tone="blue"]{--info-tone:#4d83cf}
#university .card[data-hani-info-tone="orange"]{--info-tone:#da8737}
#university .card[data-hani-info-tone="violet"]{--info-tone:#8b68df}
#university .card[data-hani-info-tone="green"]{--info-tone:#36a078}
#university .card[data-hani-info-tone="red"]{--info-tone:#df6470}

/* ===== Investment security identity ===== */
.hani-security-with-logo-v02976{display:flex!important;align-items:center!important;gap:9px!important;min-width:0}
.hani-security-logo-v02976{
  --security-color:#718096;
  flex:0 0 auto;display:inline-grid;place-items:center;position:relative;overflow:hidden;
  width:30px;height:30px;border-radius:50%;
  background:color-mix(in srgb,var(--security-color) 12%,#fff);
  border:1px solid color-mix(in srgb,var(--security-color) 24%,#fff);
  box-shadow:0 2px 7px rgba(48,60,80,.05)
}
.hani-security-logo-v02976.sm{width:24px;height:24px}
.hani-security-logo-v02976.lg{width:40px;height:40px}
.hani-security-logo-v02976.etf{background:var(--security-color);border-color:var(--security-color);color:#fff}
.hani-security-logo-v02976 img{width:68%;height:68%;display:block;object-fit:contain}
.hani-security-logo-v02976 b{
  display:none;font-size:8px;line-height:1;text-align:center;font-weight:1000;letter-spacing:-.02em;color:var(--security-color)
}
.hani-security-logo-v02976.etf b,.hani-security-logo-v02976.fallback b,.hani-security-logo-v02976.logo-failed b{display:block}
.hani-security-logo-v02976.logo-failed img{display:none}
.hani-security-logo-v02976.etf b{color:#fff;font-size:7.5px;letter-spacing:-.04em}
.hani-security-logo-v02976.fallback b{font-size:8px}

#newsroom .investment-news-entity-row[data-hani-security]{
  position:relative!important;
  border-left:4px solid var(--security-color)!important;
  background:linear-gradient(90deg,color-mix(in srgb,var(--security-color) 5%,#fff),#fff 34%)!important;
}
#newsroom .newsroom-v03-row[data-hani-security],
#newsroom .investment-news-board-row[data-hani-security]{
  border-left:3px solid color-mix(in srgb,var(--security-color) 72%,#cbd3df)!important;
}
#newsroom .news-entity-main.hani-security-with-logo-v02976{align-items:flex-start!important}
#newsroom .news-entity-signal{
  border-width:1px!important;
  box-shadow:none!important;
}
#newsroom .news-entity-signal[data-hani-sentiment="up"]{background:#fff2f3!important;color:#c74c57!important;border-color:#f0c8cc!important}
#newsroom .news-entity-signal[data-hani-sentiment="down"]{background:#eef4ff!important;color:#3f6fc2!important;border-color:#cad8f3!important}
#newsroom .news-entity-signal[data-hani-sentiment="flat"]{background:#f4f5f7!important;color:#6e7786!important;border-color:#e0e4ea!important}

/* Summary full-text toggle is separate from summary text so legacy normalizers cannot erase it. */
#newsroom .investment-news-entity-row .news-entity-summary:not(.hani-summary-expanded-v02976){
  display:-webkit-box!important;
  -webkit-box-orient:vertical!important;
  -webkit-line-clamp:2!important;
  overflow:hidden!important;
  padding-right:56px!important;
}
#newsroom .investment-news-entity-row .news-entity-summary.hani-summary-expanded-v02976{white-space:normal!important;padding-right:56px!important}
#newsroom .hani-summary-toggle-v02976{
  grid-area:summary!important;justify-self:end!important;align-self:end!important;z-index:2;
  margin:0 0 1px 0;padding:3px 7px;border:1px solid #dfe4eb;border-radius:8px;background:#fff;
  color:#6f7888;font:inherit;font-size:9.5px;font-weight:900;cursor:pointer
}
#newsroom .hani-summary-toggle-v02976:hover{border-color:var(--security-color,#9aa4b2);color:#485366}

/* Replace legacy nested comment chip with an independent control. */
#newsroom .hani-news-comment-chip-v02970,
#newsroom .hani-news-comment-chip-v02973{display:none!important}
#newsroom .hani-news-comment-chip-v02976{
  display:inline-flex;align-items:center;gap:4px;margin-left:7px;padding:4px 8px;border-radius:999px;
  border:1px solid #d9d2f5;background:#f6f3ff;color:#5d4cc3;font:inherit;font-size:10.5px;font-weight:950;
  line-height:1.1;cursor:pointer;white-space:nowrap;vertical-align:middle;touch-action:manipulation
}
#newsroom .hani-news-comment-chip-v02976:hover{background:#eee9ff;border-color:#c9bef2}
#newsroom .hani-news-comment-chip-v02976:focus-visible{outline:2px solid #7564d5;outline-offset:2px}
#newsroom .hani-close-all-comments-v02976{
  appearance:none;border:1px solid #dde2ea;background:#fff;color:#667183;border-radius:9px;
  min-height:30px;padding:5px 9px;font:inherit;font-size:10.5px;font-weight:900;cursor:pointer
}
#newsroom .hani-close-all-comments-v02976:hover{border-color:#c9cfe0;color:#465269}

/* HASDAQ: nickname over real monthly asset change, never a fabricated market index. */
#haniHasdaqBoardV02976{
  display:grid;grid-template-columns:minmax(0,1.4fr) auto;align-items:center;gap:18px;
  margin:0 0 14px;padding:17px 19px;border:1px solid #dce5f2;border-radius:17px;
  background:linear-gradient(120deg,#f5f9ff 0%,#fff 62%,#f8f5ff 100%);
  box-shadow:0 7px 20px rgba(48,62,86,.045)
}
#haniHasdaqBoardV02976 .hasdaq-brand{display:flex;align-items:center;gap:12px;min-width:0}
#haniHasdaqBoardV02976 .hasdaq-mark{
  width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:#293d67;color:#fff;
  font-size:11px;font-weight:1000;letter-spacing:.03em;box-shadow:0 6px 15px rgba(41,61,103,.16)
}
#haniHasdaqBoardV02976 .hasdaq-copy{display:grid;gap:2px;min-width:0}
#haniHasdaqBoardV02976 .hasdaq-copy b{font-size:19px;line-height:1.15;color:#26354f;font-weight:1000;letter-spacing:.015em}
#haniHasdaqBoardV02976 .hasdaq-copy span{font-size:10.5px;color:#7a8598;font-weight:760}
#haniHasdaqBoardV02976 .hasdaq-move{text-align:right;display:grid;gap:3px;justify-items:end}
#haniHasdaqBoardV02976 .hasdaq-move strong{font-size:22px;line-height:1;font-weight:1000}
#haniHasdaqBoardV02976 .hasdaq-move small{font-size:10.5px;color:#7a8598;font-weight:800}
#haniHasdaqBoardV02976 .hasdaq-move.up strong{color:#d84f58}
#haniHasdaqBoardV02976 .hasdaq-move.down strong{color:#396fc8}
#haniHasdaqBoardV02976 .hasdaq-move.flat strong{color:#70798a}
#investment .hani-hasdaq-chart-title-v02976{display:flex!important;align-items:center!important;gap:7px!important}
#investment .hani-hasdaq-chart-title-v02976:before{
  content:"HASDAQ";display:inline-flex;align-items:center;justify-content:center;padding:4px 7px;border-radius:7px;
  background:#293d67;color:#fff;font-size:8.5px;font-weight:1000;letter-spacing:.04em
}

@media(max-width:900px){
  #haniHasdaqBoardV02976{grid-template-columns:1fr;gap:10px}
  #haniHasdaqBoardV02976 .hasdaq-move{justify-items:start;text-align:left;padding-left:54px}
  #newsroom .hani-summary-toggle-v02976{margin-right:0}
}
@media(max-width:650px){
  header.top.ui26-top{background:#fff!important}
  #aiBanner{background:linear-gradient(160deg,var(--hani-group-soft),#fff 72%)!important}
  .hani-security-logo-v02976.lg{width:34px;height:34px}
  #haniHasdaqBoardV02976{padding:14px 15px}
}
`;
    document.head.appendChild(style);
  }

  function currentView() {
    const bodyView = document.body?.dataset?.view;
    if (bodyView) return bodyView;
    const active = q('#sidebar [data-view].active');
    if (active?.dataset?.view) return active.dataset.view;
    const section = qa('.view.active').find(Boolean);
    return section?.id || 'home';
  }

  function syncBannerGroup() {
    const banner = q('#aiBanner');
    if (!banner) return;
    const view = currentView();
    banner.dataset.haniGroup = VIEW_GROUP[view] || 'system';
  }

  function syncVersionLabel() {
    const replace = el => {
      if (!el) return;
      const text = String(el.textContent || '');
      if (text.includes('v2.9.75')) el.textContent = text.replaceAll('v2.9.75', 'v2.9.76');
    };
    replace(q('.login-brand p'));
    replace(q('#sidebar .brand-copy small'));
    replace(q('#sidebar .foot'));
    replace(q('.main > .footer'));
    if (document.title.includes('v2.9.75')) document.title = document.title.replaceAll('v2.9.75','v2.9.76');
  }

  function toneUniversityCards() {
    const tones = ['blue','orange','violet','green','red'];
    const cards = qa('#university .card').filter(card => !card.closest('.modal'));
    let index = 0;
    cards.forEach(card => {
      if (card.dataset.haniInfoTone) return;
      const text = String(card.textContent || '').replace(/\s+/g,' ').trim();
      let tone = '';
      if (/기말|시험|마감/.test(text)) tone = 'red';
      else if (/부전공/.test(text)) tone = 'violet';
      else if (/전공/.test(text)) tone = 'orange';
      else if (/교양|완료/.test(text)) tone = 'green';
      else if (/수강|학기|일정/.test(text)) tone = 'blue';
      else if (text.length < 260) tone = tones[index++ % tones.length];
      if (tone) card.dataset.haniInfoTone = tone;
    });
  }

  function sentimentFor(text) {
    const t = String(text || '').trim();
    if (/호재|긍정|상승|강세|↑|\+/.test(t)) return 'up';
    if (/악재|부정|하락|약세|↓|−|-/.test(t)) return 'down';
    return 'flat';
  }

  function enhanceNewsroomIdentity() {
    qa('#newsroom .investment-news-entity-row').forEach(row => {
      const main = q('.news-entity-main', row) || row.children?.[0];
      const identity = resolveSecurity(main?.textContent || row.textContent);
      if (!identity) return;
      row.dataset.haniSecurity = identity.id;
      row.style.setProperty('--security-color', identity.color);
      prependLogo(main, identity, 'lg');
      const signal = q('.news-entity-signal', row);
      if (signal) signal.dataset.haniSentiment = sentimentFor(signal.textContent);

      const summary = q('.news-entity-summary', row);
      if (!summary) return;
      const text = String(summary.textContent || '').replace(/\s+/g,' ').trim();
      let toggle = q('.hani-summary-toggle-v02976', row);
      const needs = text.length > 72;
      if (!needs) {
        toggle?.remove();
        summary.classList.add('hani-summary-expanded-v02976');
        return;
      }
      if (!toggle) {
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'hani-summary-toggle-v02976';
        toggle.textContent = '더보기';
        toggle.addEventListener('click', ev => {
          ev.preventDefault();
          ev.stopPropagation();
          const expanded = summary.classList.toggle('hani-summary-expanded-v02976');
          toggle.textContent = expanded ? '접기' : '더보기';
          toggle.setAttribute('aria-expanded', String(expanded));
        });
        row.appendChild(toggle);
      }
    });

    qa('#newsroom .newsroom-v03-row,#newsroom .investment-news-board-row').forEach(row => {
      const first = row.children?.[0] || row;
      const identity = resolveSecurity(first.textContent || row.textContent);
      if (!identity) return;
      row.dataset.haniSecurity = identity.id;
      row.style.setProperty('--security-color', identity.color);
      const target = q('.newsroom-v03-main > :first-child,.investment-news-row-main > :first-child', row) || first;
      if (target && !q('.hani-security-logo-v02976', target)) prependLogo(target, identity, 'sm');
    });
  }

  function commentCount(row) {
    const legacy = q('.hani-news-comment-chip-v02970,.hani-news-comment-chip-v02973', row);
    const lm = String(legacy?.textContent || '').match(/(\d+)/);
    if (lm) return Number(lm[1]);
    const meta = q('.newsroom-v03-title small,.news-col-title small', row);
    const mm = String(meta?.textContent || '').match(/💬\s*(\d+)/);
    if (mm) return Number(mm[1]);
    return qa('.news-agent-comments .news-agent-comment', row).length;
  }

  function rowIsOpen(row) {
    if (!row) return false;
    if (row.classList.contains('open')) return true;
    if (q('[aria-expanded="true"]', row)) return true;
    const box = q('.news-agent-comments', row);
    return !!(box && getComputedStyle(box).display !== 'none' && box.offsetHeight > 0);
  }

  function toggleCommentRow(row, desiredOpen = null) {
    if (!row) return;
    const open = rowIsOpen(row);
    if (desiredOpen !== null && open === desiredOpen) return;
    const opener = q('.newsroom-v03-main,.investment-news-row-main', row);
    if (opener && typeof opener.click === 'function') {
      opener.click();
    } else {
      row.classList.toggle('open', desiredOpen === null ? !open : desiredOpen);
      const box = q('.news-agent-comments', row);
      if (box) box.hidden = desiredOpen === null ? open : !desiredOpen;
    }
  }

  function enhanceCommentControls() {
    const rows = qa('#newsroom .newsroom-v03-row,#newsroom .investment-news-board-row');
    rows.forEach(row => {
      const title = q('.newsroom-v03-title,.news-col-title', row);
      if (!title) return;
      const count = commentCount(row);
      let chip = q('.hani-news-comment-chip-v02976', title);
      if (count <= 0) {
        chip?.remove();
        return;
      }
      if (!chip) {
        chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'hani-news-comment-chip-v02976';
        chip.addEventListener('click', ev => {
          ev.preventDefault();
          ev.stopPropagation();
          toggleCommentRow(row);
          window.setTimeout(() => {
            if (rowIsOpen(row)) q('.news-agent-comments', row)?.scrollIntoView({behavior:'smooth',block:'nearest'});
          }, 90);
        });
        const headline = q('b,strong', title);
        if (headline) headline.insertAdjacentElement('afterend', chip);
        else title.appendChild(chip);
      }
      chip.textContent = `💬 AI TEAM ${count}`;
      chip.setAttribute('aria-label', `AI TEAM 댓글 ${count}개 열기`);
    });

    const head = q('#newsroom .investment-news-board-shell>.sh');
    if (head && !q('.hani-close-all-comments-v02976', head)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hani-close-all-comments-v02976';
      btn.textContent = '댓글 모두 닫기';
      btn.addEventListener('click', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        rows.forEach(row => toggleCommentRow(row, false));
      });
      head.appendChild(btn);
    }
  }

  function enhanceInvestmentTables() {
    const selectors = [
      '#instrumentRows tr', '#brokerLatestHoldingRows tr', '#overviewAccountHoldingRows tr',
      '#annualStockRows tr', '#annualStockHistoryRows tr', '#investment .security-row',
      '#asset table tbody tr'
    ];
    qa(selectors.join(',')).forEach(row => {
      const cell = q('td:first-child', row) || row.children?.[0];
      if (!cell) return;
      const identity = resolveSecurity(cell.textContent);
      if (!identity) return;
      row.dataset.haniSecurity = identity.id;
      row.style.setProperty('--security-color', identity.color);
      prependLogo(cell, identity, 'md');
    });

    qa('#investmentHighlights > *,#asset .card').forEach(card => {
      if (q('.hani-security-logo-v02976', card)) return;
      const candidates = qa('b,strong,h3,h4', card);
      for (const target of candidates) {
        const identity = resolveSecurity(target.textContent);
        if (!identity) continue;
        prependLogo(target, identity, 'md');
        break;
      }
    });
  }

  function brokerRows() {
    try {
      if (typeof officialBrokerSorted === 'function') return officialBrokerSorted();
    } catch (_) {}
    try {
      if (typeof state !== 'undefined' && Array.isArray(state?.investmentBrokerSnapshots)) {
        return [...state.investmentBrokerSnapshots]
          .filter(s => s?.mode === 'actual' && s?.status === 'confirmed')
          .sort((a,b) => String(a.period||'').localeCompare(String(b.period||'')));
      }
    } catch (_) {}
    return [];
  }

  function brokerTotal(snapshot) {
    try {
      if (typeof brokerCalc === 'function') return Number(brokerCalc(snapshot)?.total || 0);
    } catch (_) {}
    return (snapshot?.accounts || []).filter(a => a?.enabled).reduce((sum,a) => {
      if (Number.isFinite(Number(a?.estimatedAssets))) return sum + Number(a.estimatedAssets);
      if (Number.isFinite(Number(a?.totalEvaluation))) return sum + Number(a.totalEvaluation);
      return sum;
    }, 0);
  }

  function formatWon(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n).toLocaleString('ko-KR') + '원' : '-';
  }

  function ensureHasdaqBoard() {
    const host = q('#investOverviewAll') || q('#investment');
    if (!host) return;
    let board = q('#haniHasdaqBoardV02976');
    if (!board) {
      board = document.createElement('div');
      board.id = 'haniHasdaqBoardV02976';
      const first = q('#brokerDashboardStats', host);
      if (first) first.insertAdjacentElement('beforebegin', board);
      else host.prepend(board);
    }

    const rows = brokerRows();
    const latest = rows.at(-1) || null;
    const prev = rows.at(-2) || null;
    const latestTotal = latest ? brokerTotal(latest) : null;
    const prevTotal = prev ? brokerTotal(prev) : null;
    let pct = null;
    if (latest && prev && Number.isFinite(latestTotal) && Number.isFinite(prevTotal) && prevTotal !== 0) {
      pct = (latestTotal - prevTotal) / prevTotal * 100;
    }
    const tone = pct === null || Math.abs(pct) < 0.005 ? 'flat' : pct > 0 ? 'up' : 'down';
    const arrow = tone === 'up' ? '↑' : tone === 'down' ? '↓' : '—';
    const move = pct === null ? (latest ? '첫 기록' : '기록 없음') : `${arrow} ${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`;
    const sub = latest ? `${latest.period} 총 투자자산 ${formatWon(latestTotal)}` : '월간 투자 기록을 저장하면 표시됩니다.';

    board.innerHTML = `
      <div class="hasdaq-brand">
        <span class="hasdaq-mark">HANI</span>
        <div class="hasdaq-copy"><b>HASDAQ BOARD</b><span>성민 대표님 투자자산 흐름 · 실제 월간 기록 기준</span></div>
      </div>
      <div class="hasdaq-move ${tone}"><strong>${esc(move)}</strong><small>${esc(pct === null ? sub : '전월 대비 자산 증감률 · ' + sub)}</small></div>
    `;

    const title = q('#brokerAssetChart')?.closest('.card')?.querySelector('.sh h3');
    if (title) title.classList.add('hani-hasdaq-chart-title-v02976');
  }

  let chartTimer = 0;
  function redrawInvestmentChart() {
    window.clearTimeout(chartTimer);
    chartTimer = window.setTimeout(() => {
      try {
        const canvas = q('#brokerAssetChart');
        if (!canvas || canvas.offsetParent === null) return;
        if (typeof drawBrokerChart === 'function') drawBrokerChart();
      } catch (e) {
        console.warn('[v2.9.76] broker chart redraw skipped', e);
      }
    }, 80);
  }

  function bindChartRecovery() {
    if (document.body.dataset.haniV02976ChartRecovery === '1') return;
    document.body.dataset.haniV02976ChartRecovery = '1';
    document.addEventListener('click', ev => {
      const viewBtn = ev.target.closest?.('[data-view="investment"]');
      const tabBtn = ev.target.closest?.('#investment [data-panel],#investment .tab');
      if (viewBtn || tabBtn) {
        redrawInvestmentChart();
        window.setTimeout(redrawInvestmentChart, 260);
      }
    }, true);
    window.addEventListener('resize', redrawInvestmentChart, {passive:true});
    window.addEventListener('orientationchange', redrawInvestmentChart, {passive:true});
  }

  function refresh() {
    injectStyle();
    syncVersionLabel();
    syncBannerGroup();
    toneUniversityCards();
    enhanceNewsroomIdentity();
    enhanceCommentControls();
    enhanceInvestmentTables();
    ensureHasdaqBoard();
    redrawInvestmentChart();
  }

  let refreshTimer = 0;
  function scheduleRefresh(delay = 50) {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refresh, delay);
  }

  function boot() {
    injectStyle();
    bindChartRecovery();
    refresh();

    const observer = new MutationObserver(records => {
      const meaningful = records.some(r => {
        if (r.type === 'attributes') return r.target === document.body && r.attributeName === 'data-view';
        return Array.from(r.addedNodes || []).some(node => node.nodeType === 1 && !node.matches?.('.hani-security-logo-v02976,.hani-summary-toggle-v02976,.hani-news-comment-chip-v02976'));
      });
      if (meaningful) scheduleRefresh(70);
    });
    /* Avoid observing every class toggle (news open/close, active tabs, our own accents),
       which can create refresh chatter. Dynamic content + the body route marker are enough. */
    observer.observe(document.body, {subtree:true,childList:true,attributes:true,attributeFilter:['data-view']});

    window.setTimeout(refresh, 350);
    window.setTimeout(refresh, 1100);
    console.info('[HANI OS] v2.9.76 Candidate active · Investment Identity / HASDAQ / Newsroom Interaction / UI Polish');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
