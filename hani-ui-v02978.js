/* =========================================================
   HANI OS v2.9.78
   Life Indices + Investment Identity · Stabilization R1
   UI/read-only patch: no localStorage write, no Supabase write,
   no schema/storage-key/internal-data-version changes.
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_UI_V02978';
  const STYLE_ID = 'hani-ui-v02978-style';
  if (window[PATCH_ID]) return;
  window[PATCH_ID] = true;

  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const txt = el => String(el?.textContent || '').replace(/\s+/g, ' ').trim();
  const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const num = v => { const x = Number(String(v ?? '').replace(/[,₩원%\s]/g,'')); return Number.isFinite(x) ? x : null; };
  const monthKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const CURRENT_MONTH = monthKey(new Date());
  const PREV_MONTH = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-1); return monthKey(d); })();

  const GROUP_BY_VIEW = {
    home:'home',
    intake:'office', agentReview:'office', policy:'office', deployment:'office', tasks:'office', calendar:'office', dev:'office',
    investment:'finance', investmentIntake:'finance', asset:'finance', ledger:'finance', newsroom:'finance',
    diet:'health', exercise:'health',
    reading:'growth', study:'growth', university:'growth', certificate:'growth',
    wishlist:'life', travel:'life', movie:'life', game:'life', diary:'life',
    drive:'system', settings:'system', aiTeam:'system'
  };

  const COMPANY = [
    {id:'aws', rx:/(^|\b)AWS(\b|$)|AMAZON WEB SERVICES/i, label:'AWS · Amazon (AMZN)', color:'#232f3e', mark:'aws', kind:'aws'},
    {id:'samsung', rx:/(삼성전자(?:우)?|005930|005935|SAMSUNG)/i, label:'Samsung Electronics', color:'#1428a0', mark:'SAMSUNG', kind:'image', slug:'samsung'},
    {id:'lg', rx:/(LG전자(?:우)?|066570|066575)/i, label:'LG Electronics', color:'#a50034', mark:'LG', kind:'image', slug:'lg'},
    {id:'nvidia', rx:/(엔비디아|NVIDIA|\bNVDA\b)/i, label:'NVIDIA', color:'#76b900', mark:'N', kind:'image', slug:'nvidia'},
    {id:'amazon', rx:/(아마존|AMAZON|\bAMZN\b)/i, label:'Amazon', color:'#232f3e', mark:'a', kind:'amazon'},
    {id:'alphabet', rx:/(알파벳|GOOGLE|\bGOOGL\b|\bGOOG\b)/i, label:'Alphabet / Google', color:'#4285f4', mark:'G', kind:'google'},
    {id:'skhynix', rx:/(SK\s*하이닉스|하이닉스|000660|SK\s*HYNIX)/i, label:'SK hynix', color:'#e6002d', mark:'SK\nhynix', kind:'text'},
  ];
  const ETF_ISSUER = [
    {id:'tiger', rx:/\bTIGER\b/i, label:'TIGER', color:'#f27616'},
    {id:'kodex', rx:/\bKODEX\b/i, label:'KODEX', color:'#1769e0'},
    {id:'sol', rx:/\bSOL\b/i, label:'SOL', color:'#087fbd'},
    {id:'rise', rx:/\bRISE\b/i, label:'RISE', color:'#f5c400'},
    {id:'plus', rx:/\bPLUS\b/i, label:'PLUS', color:'#f47a1f'},
    {id:'ace', rx:/\bACE\b/i, label:'ACE', color:'#7559d8'},
    {id:'koact', rx:/\bKOACT\b/i, label:'KOACT', color:'#2468f2'},
    {id:'robo', rx:/\bROBO\b/i, label:'ROBO', color:'#2674e8'},
    {id:'arirang', rx:/\bARIRANG\b/i, label:'ARIRANG', color:'#f07728'}
  ];

  function etfTheme(raw) {
    const s = String(raw || '').toUpperCase();
    if (/S&P\s*500|S&P500/.test(s)) return 'S&P';
    if (/NASDAQ\s*100|나스닥\s*100|나스닥100/.test(s)) return 'N100';
    if (/반도체|HBM|SEMICONDUCT/.test(s)) return 'CHIP';
    if (/배당|DIVIDEND/.test(s)) return 'DIV';
    if (/ROBO|로봇/.test(s)) return 'BOT';
    if (/방산|DEFEN/.test(s)) return 'DEF';
    if (/헬스|HEALTH/.test(s)) return 'HC';
    if (/AI/.test(s)) return 'AI';
    if (/커버드콜|COVERED/.test(s)) return 'CC';
    if (/(^|\D)200(\D|$)/.test(s)) return '200';
    if (/(^|\D)150(\D|$)/.test(s)) return '150';
    return 'ETF';
  }

  function resolveSecurity(rawText) {
    const raw = String(rawText || '').replace(/\s+/g,' ').trim();
    if (!raw) return null;
    for (const c of COMPANY) if (c.rx.test(raw)) return {...c, type:'stock'};
    for (const issuer of ETF_ISSUER) if (issuer.rx.test(raw)) return {...issuer, type:'etf', theme:etfTheme(raw)};
    const stop = new Set(['TEAM','HANI','VIEW','NEWS','TOTAL','ETF','ASSET','WEIGHT','CULTURE','STEPS','ISA','IRP','TOSS','PENSION','ACCOUNT']);
    const ticker = (raw.match(/\b[A-Z]{2,6}\b/g) || []).find(x => !stop.has(x));
    if (ticker) {
      return {id:`ticker-${ticker}`, label:ticker, color:'#64748b', mark:ticker.slice(0,4), kind:'text', type:'fallback'};
    }
    return null;
  }

  function brandLogo(identity, size='md') {
    const el = document.createElement('span');
    el.className = `hani-security-logo-v02978 ${size} ${identity.type || ''} brand-${identity.id}`;
    el.dataset.securityId = identity.id;
    el.style.setProperty('--security-color', identity.color || '#64748b');
    el.setAttribute('role','img');
    el.setAttribute('aria-label', identity.label || identity.mark || '종목 로고');

    const fallback = document.createElement('b');
    fallback.className = 'hani-logo-fallback-v02978';
    fallback.textContent = identity.type === 'etf' ? (identity.theme || 'ETF') : identity.mark;
    el.appendChild(fallback);

    if (identity.kind === 'image' && identity.slug) {
      const img = new Image();
      img.alt = '';
      img.loading = 'eager';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.src = `https://cdn.simpleicons.org/${identity.slug}/FFFFFF`;
      img.addEventListener('load', () => el.classList.add('logo-loaded'), {once:true});
      img.addEventListener('error', () => el.classList.add('logo-failed'), {once:true});
      el.appendChild(img);
    }
    if (identity.kind === 'amazon' || identity.kind === 'aws') el.classList.add('has-smile');
    return el;
  }

  function wrapSecurityCopy(target) {
    if (!target || q(':scope > .hani-security-copy-v02978', target)) return q(':scope > .hani-security-copy-v02978', target);
    const copy = document.createElement('span');
    copy.className = 'hani-security-copy-v02978';
    const movable = Array.from(target.childNodes).filter(n => !(n.nodeType === 1 && n.classList?.contains('hani-security-logo-v02978')));
    movable.forEach(n => copy.appendChild(n));
    target.appendChild(copy);
    return copy;
  }

  function clearSecurityLogos(root) {
    if (!root) return;
    if (root.matches?.('.hani-security-logo-v02978')) root.remove();
    qa('.hani-security-logo-v02978', root).forEach(el => el.remove());
    [root, ...qa('.hani-security-with-logo-v02976,.hani-security-with-logo-v02978', root)].forEach(el => {
      el?.classList?.remove('hani-security-with-logo-v02976','hani-security-with-logo-v02978');
    });
  }

  function placeLogo(target, identity, size='md', wrap=true, cleanupRoot=null) {
    if (!target || !identity) return;
    clearSecurityLogos(cleanupRoot || target);
    target.classList.add('hani-security-with-logo-v02978');
    target.style.setProperty('--security-color', identity.color || '#64748b');
    const copy = wrap ? wrapSecurityCopy(target) : null;
    const logo = brandLogo(identity, size);
    if (copy) target.insertBefore(logo, copy); else target.prepend(logo);
  }

  function injectStyle() {
    if (q('#'+STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
/* ===== v2.9.78 · HANI preflight UI finish ===== */
:root{--hani-office:#7c62e3;--hani-finance:#3779d6;--hani-health:#37a77d;--hani-growth:#df8a32;--hani-life:#2d9db3;--hani-system:#56647b}
header.top.ui26-top{
  margin:10px 14px 0!important;border-radius:18px!important;overflow:visible!important;
  border:1px solid rgba(102,115,140,.13)!important;background:rgba(255,255,255,.94)!important;
  box-shadow:0 7px 22px rgba(48,61,86,.045)!important
}
#aiBanner{border-radius:22px!important;border:1px solid color-mix(in srgb,var(--hani-group,#7c62e3) 18%,#fff)!important;background:color-mix(in srgb,var(--hani-group,#7c62e3) 13%,#fff)!important;box-shadow:0 10px 28px rgba(52,64,90,.06)!important}
#aiBanner[data-hani-group="office"]{--hani-group:var(--hani-office)}
#aiBanner[data-hani-group="finance"]{--hani-group:var(--hani-finance)}
#aiBanner[data-hani-group="health"]{--hani-group:var(--hani-health)}
#aiBanner[data-hani-group="growth"]{--hani-group:var(--hani-growth)}
#aiBanner[data-hani-group="life"]{--hani-group:var(--hani-life)}
#aiBanner[data-hani-group="system"]{--hani-group:var(--hani-system)}
#aiBanner[data-hani-group] .ai-kicker,#aiBanner[data-hani-group] .ai-banner-copy>span{color:var(--hani-group)!important}
#aiBanner[data-hani-group] .ai-quote,#aiBanner[data-hani-group] .ai-banner-quote{border-color:color-mix(in srgb,var(--hani-group) 28%,#fff)!important;background:rgba(255,255,255,.8)!important}

/* Always-visible investment identity */
.hani-security-logo-v02976{display:none!important}
.hani-security-with-logo-v02978{display:flex!important;align-items:center!important;gap:10px!important;min-width:0!important}
.hani-security-copy-v02978{display:grid!important;gap:2px!important;min-width:0!important;align-content:center!important}
.hani-security-copy-v02978>*{min-width:0}
.hani-security-logo-v02978{
  --security-color:#64748b;position:relative;flex:0 0 auto;width:34px;height:34px;border-radius:11px;
  display:grid!important;place-items:center!important;overflow:hidden;background:var(--security-color)!important;
  border:1px solid color-mix(in srgb,var(--security-color) 72%,#fff)!important;
  box-shadow:0 3px 9px color-mix(in srgb,var(--security-color) 18%,transparent)!important;color:#fff!important
}
.hani-security-logo-v02978.sm{width:28px;height:28px;border-radius:9px}.hani-security-logo-v02978.lg{width:42px;height:42px;border-radius:13px}
.hani-security-logo-v02978 img{position:absolute;inset:16%;width:68%;height:68%;object-fit:contain;opacity:0;transition:opacity .12s ease;z-index:2}
.hani-security-logo-v02978.logo-loaded img{opacity:1}.hani-security-logo-v02978.logo-loaded .hani-logo-fallback-v02978{opacity:0}
.hani-logo-fallback-v02978{position:relative;z-index:1;display:block!important;max-width:90%;white-space:pre-line;text-align:center;color:#fff!important;font-size:8px!important;line-height:.96!important;font-weight:1000!important;letter-spacing:-.04em!important}
.hani-security-logo-v02978.brand-samsung .hani-logo-fallback-v02978{font-size:5.8px!important;letter-spacing:-.08em!important}
.hani-security-logo-v02978.brand-lg{border-radius:11px}.hani-security-logo-v02978.brand-lg img{inset:20%;width:60%;height:60%}
.hani-security-logo-v02978.brand-nvidia img{inset:15%;width:70%;height:70%}
.hani-security-logo-v02978.brand-amazon .hani-logo-fallback-v02978{font:1000 19px/1 Arial,sans-serif!important;transform:translateY(-2px)}
.hani-security-logo-v02978.brand-aws .hani-logo-fallback-v02978{font:900 10px/1 Arial,sans-serif!important;transform:translateY(-2px)}
.hani-security-logo-v02978.has-smile:after{content:"";position:absolute;left:25%;right:19%;bottom:22%;height:5px;border-bottom:2px solid #ff9900;border-radius:0 0 50% 50%;transform:rotate(-7deg);z-index:3}
.hani-security-logo-v02978.brand-alphabet{background:#fff!important;border-color:#d7dce5!important}.hani-security-logo-v02978.brand-alphabet .hani-logo-fallback-v02978{font:1000 19px/1 Arial,sans-serif!important;background:conic-gradient(from -45deg,#4285f4 0 25%,#34a853 0 45%,#fbbc05 0 66%,#ea4335 0 82%,#4285f4 0);-webkit-background-clip:text;background-clip:text;color:transparent!important}
.hani-security-logo-v02978.brand-skhynix .hani-logo-fallback-v02978{font-size:6.4px!important;line-height:.86!important}
.hani-security-logo-v02978.etf .hani-logo-fallback-v02978{font-size:7.1px!important;letter-spacing:-.05em!important}
.hani-security-logo-v02978.brand-rise{color:#655600!important}.hani-security-logo-v02978.brand-rise .hani-logo-fallback-v02978{color:#554b00!important}

/* Newsroom: logo + stock text must stay readable */
#newsroom .investment-news-entity-row{
  grid-template-columns:minmax(245px,285px) minmax(92px,110px) minmax(360px,1fr) minmax(120px,155px)!important;
  column-gap:14px!important
}
#newsroom .investment-news-entity-row .news-entity-main{display:flex!important;align-items:center!important;gap:11px!important;min-width:0!important;word-break:keep-all!important}
#newsroom .investment-news-entity-row .news-entity-main .hani-security-copy-v02978{white-space:normal!important}
#newsroom .investment-news-entity-row .news-entity-main b,#newsroom .investment-news-entity-row .news-entity-main strong{white-space:nowrap!important;word-break:keep-all!important;overflow:visible!important;text-overflow:clip!important}
#newsroom .newsroom-v03-main,#newsroom .investment-news-row-main{grid-template-columns:minmax(215px,.85fr) minmax(135px,.55fr) minmax(390px,2.2fr)!important;column-gap:15px!important;align-items:center!important}
#newsroom .newsroom-v03-main> :first-child,#newsroom .investment-news-row-main> :first-child{min-width:0!important}
#newsroom .hani-news-stock-cell-v02978{display:flex!important;align-items:center!important;gap:9px!important;min-width:0!important}
#newsroom .hani-news-stock-cell-v02978 .hani-security-copy-v02978{min-width:0!important}
#newsroom .hani-news-stock-cell-v02978 b,#newsroom .hani-news-stock-cell-v02978 strong{white-space:nowrap!important;word-break:keep-all!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:150px!important}
#newsroom .hani-news-comment-chip-v02978{display:inline-flex!important;align-items:center!important;gap:5px!important;padding:5px 10px!important;border:1px solid #d7cef8!important;border-radius:999px!important;background:#f5f1ff!important;color:#6550c9!important;font-size:10.5px!important;font-weight:950!important;cursor:pointer!important;white-space:nowrap!important;position:relative!important;z-index:5!important}
#newsroom .hani-news-comment-chip-v02970,#newsroom .hani-news-comment-chip-v02973,#newsroom .hani-news-comment-chip-v02976{display:none!important;pointer-events:none!important}
#newsroom .hani-close-all-comments-v02978{display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:6px 10px;border:1px solid #d8deea;border-radius:10px;background:#fff;color:#59667a;font-size:10.5px;font-weight:900;cursor:pointer}
#newsroom .hani-close-all-comments-v02978:hover{background:#f7f9fc}

/* HASDAQ percentage belongs to the title, not the far edge */
#haniHasdaqBoardV02976{grid-template-columns:1fr!important}
#haniHasdaqBoardV02976 .hasdaq-brand{align-items:center!important;flex-wrap:wrap!important}
#haniHasdaqBoardV02976 .hasdaq-move{display:none!important}
.hani-hasdaq-inline-v02978{display:inline-flex;align-items:center;gap:5px;margin-left:7px;padding:5px 10px;border-radius:999px;font-size:15px;font-weight:1000;line-height:1;white-space:nowrap}
.hani-hasdaq-inline-v02978.up{background:#fff0f1;color:#d84b57;border:1px solid #f1cbd0}.hani-hasdaq-inline-v02978.down{background:#eef4ff;color:#3270d4;border:1px solid #cbdcf7}.hani-hasdaq-inline-v02978.flat{background:#f3f4f6;color:#687184;border:1px solid #e1e4e9}
.hani-hasdaq-inline-v02978 small{font-size:9px;font-weight:900;opacity:.78}

/* Dashboard v2.9.78: four real-data life indices. */
#home .home-kpi-grid.hani-life-indices-v02978{grid-template-columns:repeat(4,minmax(0,1fr))!important}
#home .home-kpi.hani-index-card-v02978{position:relative;overflow:hidden;text-align:left!important}
#home .home-kpi.hani-index-card-v02978:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--index-color,#6f63da)}
#home .home-kpi.hani-index-card-v02978 .kpi-head span{font-weight:1000!important;letter-spacing:-.02em;font-size:11.5px!important;white-space:nowrap!important}
#home .home-kpi.hani-index-card-v02978 .hani-index-move-v02978{display:inline-flex;align-items:center;gap:4px;margin-top:3px;font-size:11px;font-weight:1000}
#home .home-kpi.hani-index-card-v02978 .hani-index-move-v02978.up{color:#d94a56}.hani-index-move-v02978.down{color:#2e6fd2}.hani-index-move-v02978.flat,.hani-index-move-v02978.na{color:#758093}
#home .home-kpi.hani-index-card-v02978 .hani-index-detail-v02978{display:block;margin-top:3px;color:#7c8595;font-size:10px;font-weight:750}
#home .home-kpi.hani-index-hidden-v02978{display:none!important}

/* University: information color belongs on words/numbers, not giant saturated cards. */
#university [data-hani-campus-tone]{--campus-tone:#6f63da;border-color:color-mix(in srgb,var(--campus-tone) 19%,#e6e8ee)!important}
#university [data-hani-campus-tone] h3,#university [data-hani-campus-tone] h4,#university [data-hani-campus-tone] strong,#university [data-hani-campus-tone] b{color:var(--campus-tone)!important}
#university [data-hani-campus-tone="major"]{--campus-tone:#dc802e}#university [data-hani-campus-tone="minor"]{--campus-tone:#805ad5}#university [data-hani-campus-tone="general"]{--campus-tone:#239e9e}#university [data-hani-campus-tone="other"]{--campus-tone:#728095}
#university [data-hani-campus-tone="exam"]{--campus-tone:#d64f5f}#university [data-hani-campus-tone="schedule"]{--campus-tone:#6d5bd5}#university [data-hani-campus-tone="apply"]{--campus-tone:#3478cf}

@media(max-width:1180px){#newsroom .investment-news-entity-row{grid-template-columns:minmax(220px,260px) 95px minmax(280px,1fr)!important;grid-template-areas:"entity signal count" "summary summary summary"!important;row-gap:7px!important}#newsroom .newsroom-v03-main,#newsroom .investment-news-row-main{grid-template-columns:minmax(190px,.8fr) minmax(120px,.5fr) minmax(300px,2fr)!important}#home .home-kpi-grid.hani-life-indices-v02978{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media(max-width:720px){header.top.ui26-top{margin:7px 8px 0!important;border-radius:15px!important}#newsroom .investment-news-entity-row{grid-template-columns:1fr auto!important;grid-template-areas:"entity count" "signal signal" "summary summary"!important}#newsroom .newsroom-v03-main,#newsroom .investment-news-row-main{grid-template-columns:1fr!important;row-gap:8px!important}#home .home-kpi-grid.hani-life-indices-v02978{grid-template-columns:1fr!important}.hani-security-logo-v02978.lg{width:36px;height:36px}}
`;
    document.head.appendChild(style);
  }

  function decorateHeroAndHeader() {
    const view = document.body?.dataset?.view || qa('.view.active')[0]?.id || 'home';
    const group = GROUP_BY_VIEW[view] || 'system';
    const banner = q('#aiBanner');
    if (banner) banner.dataset.haniGroup = group;
  }

  function decorateUniversity() {
    const root = q('#university'); if (!root) return;
    qa('.card,.item,.campus-course-card,.campus-event-card,.campus-stat,.campus-summary-card', root).forEach(el => {
      const t = txt(el).slice(0,240);
      let tone='';
      if (/부전공/.test(t)) tone='minor';
      else if (/전공/.test(t)) tone='major';
      else if (/교양/.test(t)) tone='general';
      else if (/기타\s*선택|기타/.test(t)) tone='other';
      if (/기말|중간|시험/.test(t)) tone='exam';
      else if (/수강신청|신청/.test(t)) tone='apply';
      else if (/개강|종강|학사\s*일정/.test(t)) tone='schedule';
      if (tone) el.dataset.haniCampusTone = tone;
    });
  }

  function upperNewsRows() {
    const root = q('#newsroom');
    if (!root) return [];
    const rows = qa('.investment-news-entity-row,.investment-news-summary-row,[data-news-entity]', root);
    if (rows.length) return rows.filter((x,i,a)=>a.indexOf(x)===i);
    const zone = q('#investmentNewsWatchlist,#investmentNewsSummary,.investment-news-watchlist,.investment-news-summary-list', root);
    return zone ? Array.from(zone.children).filter(el => resolveSecurity(txt(el))) : [];
  }
  function feedRows() {
    const root = q('#newsroom');
    if (!root) return [];
    const feed = q('#investmentNewsFeed', root) || root;
    return qa('.newsroom-v03-row,.investment-news-board-row,[data-news-id]', feed)
      .filter((x,i,a)=>a.indexOf(x)===i && !x.classList.contains('investment-news-entity-row'));
  }

  function newsroomIdentityTarget(row, summary=false) {
    if (!row) return null;
    if (summary) {
      return q('.news-entity-main,.investment-news-entity-main,.news-entity-name,[data-news-entity-main]', row) || row.firstElementChild;
    }
    return q('.newsroom-v03-stock,.investment-news-stock,.news-col-stock,[data-news-stock]', row)
      || q('.newsroom-v03-main > :first-child,.investment-news-row-main > :first-child', row)
      || row.firstElementChild;
  }

  function decorateNewsroomLogos() {
    upperNewsRows().forEach(row => {
      const identity = resolveSecurity(txt(row));
      const target = newsroomIdentityTarget(row, true);
      if (!identity || !target) return;
      row.style.setProperty('--security-color',identity.color);
      row.dataset.haniSecurityV02978 = identity.id;
      target.classList.add('news-entity-main');
      placeLogo(target, identity, 'md', true, row);
    });
    feedRows().forEach(row => {
      const identity = resolveSecurity(txt(row));
      const cell = newsroomIdentityTarget(row, false);
      if (!identity || !cell) return;
      cell.classList.add('hani-news-stock-cell-v02978');
      row.style.setProperty('--security-color',identity.color);
      row.dataset.haniSecurityV02978 = identity.id;
      placeLogo(cell, identity, 'sm', true, row);
    });
  }

  function isAccountOnlyBlock(el) {
    const t = txt(el);
    if (/가장\s*큰\s*계좌|계좌\s*(?:합계|자산|현황)/i.test(t)) return true;
    const hasKnown = COMPANY.some(x=>x.rx.test(t)) || ETF_ISSUER.some(x=>x.rx.test(t));
    return !hasKnown && /(?:^|\s)(ISA|IRP|연금|위탁|토스|TOSS)(?:\s|$)/i.test(t);
  }

  function decorateInvestmentLogos() {
    const rowSelectors = [
      '#instrumentRows tr','#brokerLatestHoldingRows tr','#overviewAccountHoldingRows tr',
      '#annualStockRows tr','#annualStockHistoryRows tr','#investment table tbody tr',
      '#investment .holding-row','#investment .investment-holding-row','#investment .stock-row','#investment .security-row',
      '#asset table tbody tr','#asset .holding-row','#asset .security-row'
    ].join(',');

    qa(rowSelectors).forEach(row => {
      if (row.closest('#newsroom')) return;
      if (isAccountOnlyBlock(row)) { clearSecurityLogos(row); return; }
      const identity = resolveSecurity(txt(row));
      if (!identity) return;
      const cell = q('td:first-child', row) || row.firstElementChild || row;
      const target = qa('b,strong,h3,h4', cell).find(x=>resolveSecurity(txt(x))) || cell;
      placeLogo(target, identity, 'md', true, row);
      row.dataset.haniSecurityV02978 = identity.id;
    });

    qa('#investmentHighlights > *,#asset .card').forEach(card => {
      if (card.closest('#newsroom')) return;
      if (isAccountOnlyBlock(card)) { clearSecurityLogos(card); return; }
      const identity = resolveSecurity(txt(card));
      if (!identity || identity.type === 'fallback') return;
      const target = qa('b,strong,h3,h4', card).find(x=>resolveSecurity(txt(x))) || qa('b,strong,h3,h4', card)[0];
      if (!target) return;
      placeLogo(target, identity, 'md', true, card);
    });
  }

  function countComments(row) {
    const meta = txt(q('.newsroom-v03-title small,.news-col-title small', row));
    const m1 = meta.match(/💬\s*(\d+)/); if (m1) return Number(m1[1]);
    const head = txt(q('.news-comments-head',row)); const m2=head.match(/댓글\s*\(?\s*(\d+)/); if(m2)return Number(m2[1]);
    return qa('.news-agent-comments .news-agent-comment', row).length;
  }
  function isRowOpen(row) {
    if (!row) return false;
    if (row.classList.contains('open') || row.classList.contains('is-open') || row.classList.contains('expanded')) return true;
    if (q('[aria-expanded="true"]',row)) return true;
    const d = q('details[open]',row); if (d) return true;
    const detail = q('.newsroom-v03-detail,.investment-news-row-detail,.news-detail,.news-agent-comments',row);
    return !!(detail && !detail.hidden && getComputedStyle(detail).display !== 'none' && detail.getClientRects().length);
  }
  function forceRowState(row, desired) {
    if (!row) return;
    const details = qa('details',row); details.forEach(d=>d.open=desired);
    row.classList.toggle('open',desired); row.classList.toggle('is-open',desired); row.classList.toggle('expanded',desired);
    qa('.newsroom-v03-main,.investment-news-row-main,[aria-expanded]',row).forEach(el=>el.setAttribute('aria-expanded',desired?'true':'false'));
    qa('.newsroom-v03-detail,.investment-news-row-detail,.news-detail,.news-agent-comments',row).forEach(el=>{
      el.hidden=!desired;
      if (desired) { if (el.style.display==='none') el.style.removeProperty('display'); }
      else el.style.setProperty('display','none','important');
    });
  }
  function setCommentOpenOneClick(row, desired) {
    if (!row) return;
    if (isRowOpen(row) === desired) { forceRowState(row,desired); return; }
    const opener = q('.newsroom-v03-main,.investment-news-row-main',row);
    if (desired && opener && !row.dataset.haniNativeOpenedV02978) {
      row.dataset.haniNativeOpenedV02978='1';
      try { opener.click(); } catch(_) {}
    }
    setTimeout(()=>forceRowState(row,desired),0);
    setTimeout(()=>forceRowState(row,desired),80);
  }

  function installCommentControls() {
    qa('#newsroom .hani-news-comment-chip-v02978').forEach(el=>el.remove());
    feedRows().forEach(row => {
      const count = countComments(row); if (!count) return;
      const title = q('.newsroom-v03-title,.news-col-title',row) || q('.newsroom-v03-main,.investment-news-row-main',row);
      if (!title) return;
      const chip = document.createElement('button'); chip.type='button'; chip.className='hani-news-comment-chip-v02978';
      chip.innerHTML=`<span aria-hidden="true">💬</span> AI TEAM ${count}`;
      chip.setAttribute('aria-label',`AI TEAM 댓글 ${count}개 열기`);
      title.appendChild(chip);
    });
    if (!q('#haniCloseAllCommentsV02978')) {
      const heading = qa('#newsroom h2,#newsroom h3').find(el=>/종목\s*뉴스\s*게시판/.test(txt(el)));
      if (heading) {
        const b=document.createElement('button'); b.type='button'; b.id='haniCloseAllCommentsV02978'; b.className='hani-close-all-comments-v02978'; b.textContent='댓글 모두 닫기'; heading.appendChild(b);
      }
    }
  }

  function installGlobalClicks() {
    if (document.documentElement.dataset.haniV02978Clicks) return;
    document.documentElement.dataset.haniV02978Clicks='1';
    document.addEventListener('click', ev => {
      const chip = ev.target.closest?.('.hani-news-comment-chip-v02978');
      if (chip) {
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        const row=chip.closest('.newsroom-v03-row,.investment-news-board-row');
        setCommentOpenOneClick(row,!isRowOpen(row));
        return;
      }
      if (ev.target.closest?.('#haniCloseAllCommentsV02978')) {
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        feedRows().forEach(r=>setCommentOpenOneClick(r,false));
      }
    }, true);
  }

  function polishHasdaq() {
    const board=q('#haniHasdaqBoardV02976'); if(!board) return;
    const st=getStateSafe();
    const cur=investByMonth(st,CURRENT_MONTH), prev=investByMonth(st,PREV_MONTH);
    const mv=movement(cur?.v??null,prev?.v??null,false);
    const brand=q('.hasdaq-brand',board) || board;
    const title=qa('b,strong,h2,h3',brand).find(el=>/HASDAQ\s*BOARD/i.test(txt(el))) || qa('b,strong,h2,h3',board).find(el=>/HASDAQ\s*BOARD/i.test(txt(el)));
    if(!title) return;
    let chip=q('.hani-hasdaq-inline-v02978',brand);
    if(!chip){chip=document.createElement('span');title.insertAdjacentElement('afterend',chip);}
    chip.className=`hani-hasdaq-inline-v02978 ${mv.tone||'na'}`;
    chip.innerHTML=mv.pct===null?'비교 데이터 준비 중':`${mv.pct>0?'↑':mv.pct<0?'↓':'—'} ${mv.pct>0?'+':''}${mv.pct.toFixed(2)}% <small>전월 대비</small>`;
  }

  function getStateSafe(){ try { return (typeof state!=='undefined' && state) ? state : null; } catch(_) { return null; } }
  function rowMonth(row){
    const candidates=[row?.month,row?.date,row?.recordDate,row?.recordedAt,row?.watchedDate,row?.finishedAt,row?.completedAt,row?.createdAt,row?.updatedAt];
    for(const v of candidates){const s=String(v||''); const m=s.match(/^(\d{4}-\d{2})/); if(m)return m[1];}
    return '';
  }
  function valueFrom(row,keys){for(const k of keys){const x=num(row?.[k]); if(x!==null)return x;}return null}
  function lastByMonth(rows,month,valueKeys){
    return (Array.isArray(rows)?rows:[]).map((r,i)=>({r,i,m:rowMonth(r),v:valueFrom(r,valueKeys),d:String(r?.date||r?.recordedAt||r?.updatedAt||r?.createdAt||'')})).filter(x=>x.m===month&&x.v!==null).sort((a,b)=>(a.d||'').localeCompare(b.d||'')||a.i-b.i).at(-1)||null;
  }
  function brokerRows77(st){
    try { if (typeof officialBrokerSorted === 'function') return officialBrokerSorted(); } catch(_) {}
    const rows=Array.isArray(st?.investmentBrokerSnapshots)?[...st.investmentBrokerSnapshots]:[];
    return rows.filter(r=>r?.mode==='actual'&&r?.status==='confirmed').sort((a,b)=>String(a?.period||'').localeCompare(String(b?.period||'')));
  }
  function brokerTotal77(snapshot){
    try { if (typeof brokerCalc === 'function') { const x=Number(brokerCalc(snapshot)?.total); if(Number.isFinite(x)) return x; } } catch(_) {}
    const direct=valueFrom(snapshot,['total','totalAsset','totalAssets','totalValue']); if(direct!==null&&direct>0)return direct;
    return (Array.isArray(snapshot?.accounts)?snapshot.accounts:[]).filter(a=>a?.enabled!==false).reduce((sum,a)=>{
      const v=valueFrom(a,['estimatedAssets','totalEvaluation','evaluationAmount','value','amount']); return sum+(v??0);
    },0);
  }
  function investByMonth(st,month){
    const row=brokerRows77(st).filter(r=>String(r?.period||rowMonth(r))===month).at(-1)||null;
    if(!row)return null; const v=brokerTotal77(row); return Number.isFinite(v)&&v>0?{r:row,v,m:month}:null;
  }

  function averageSteps(rows,month){
    const byDate=new Map();
    (Array.isArray(rows)?rows:[]).forEach(r=>{const m=rowMonth(r);if(m!==month)return;const date=String(r?.date||r?.recordedAt||r?.createdAt||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;const steps=valueFrom(r,['steps','stepCount','step','walkSteps']);if(steps===null||steps<0)return;byDate.set(date,(byDate.get(date)||0)+steps)});
    if(!byDate.size)return null; return {avg:[...byDate.values()].reduce((a,b)=>a+b,0)/byDate.size,days:byDate.size};
  }
  function cultureCount(st,month){
    const books=(Array.isArray(st?.books)?st.books:[]).filter(r=>{const status=String(r?.status||r?.state||'').toLowerCase();if(/planned|wish|예정/.test(status))return false;return rowMonth(r)===month;}).length;
    const movies=(Array.isArray(st?.movies)?st.movies:[]).filter(r=>rowMonth(r)===month).length;
    return {books,movies,total:books+movies};
  }
  function movement(cur,prev,invert=false){
    if(cur===null||prev===null||!Number.isFinite(cur)||!Number.isFinite(prev)||prev===0)return {tone:'na',label:'비교 데이터 준비 중',pct:null};
    const raw=(cur-prev)/Math.abs(prev)*100; const pct=invert?-raw:raw;
    return {tone:pct>0?'up':pct<0?'down':'flat',pct,label:`${pct>0?'↑':pct<0?'↓':'—'} ${pct>0?'+':''}${pct.toFixed(2)}% 전월 대비`};
  }
  function setIndexCard(card,{name,em,strong,move,detail,color}){
    if(!card)return;card.classList.add('hani-index-card-v02978');card.style.setProperty('--index-color',color);
    const head=q('.kpi-head span',card);if(head)head.textContent=name;const e=q('.kpi-head em',card);if(e)e.textContent=em;
    const s=q(':scope > strong',card)||q('strong',card);if(s&&strong!==undefined)s.textContent=strong;
    let mv=q('.hani-index-move-v02978',card);if(!mv){mv=document.createElement('span');mv.className='hani-index-move-v02978';(s||card).insertAdjacentElement(s?'afterend':'beforeend',mv)}mv.className=`hani-index-move-v02978 ${move.tone||'na'}`;mv.textContent=move.label;
    let dt=q('.hani-index-detail-v02978',card);if(!dt){dt=document.createElement('small');dt.className='hani-index-detail-v02978';mv.insertAdjacentElement('afterend',dt)}dt.textContent=detail||'';
    qa(':scope > small:not(.hani-index-detail-v02978)',card).forEach(old=>old.style.display='none');
  }
  function cardForValue(id, fallbackSelector=''){
    const el=q('#'+id); if(el){const c=el.closest('.home-kpi,.card,.kpi-card');if(c)return c;}
    return fallbackSelector?q(fallbackSelector,q('#home')):null;
  }
  function renderLifeIndices(){
    const root=q('#home'); const grid=q('.home-kpi-grid',root); if(!grid)return; const st=getStateSafe(); if(!st)return;
    grid.classList.add('hani-life-indices-v02978');
    const finance=cardForValue('homeAsset','.home-kpi.finance-tone');
    const health=cardForValue('homeWeight','.home-kpi.health-tone');
    const growth=cardForValue('homeBooks','.home-kpi.growth-tone');
    const movie=cardForValue('homeMovies','.home-kpi.life-tone');
    const activity=cardForValue('homeSteps','.home-kpi.activity-tone');
    if(movie&&movie!==growth)movie.classList.add('hani-index-hidden-v02978');

    const ic=investByMonth(st,CURRENT_MONTH), ip=investByMonth(st,PREV_MONTH); const im=movement(ic?.v??null,ip?.v??null,false);
    setIndexCard(finance,{name:"HASDAQ (하니's 자산 지수)",em:'ASSET',strong:ic?Math.round(ic.v).toLocaleString('ko-KR')+'원':(q('#homeAsset')?.textContent||'-'),move:im,detail:'투자자산 전월 대비 증감',color:'#3478cf'});

    const bc=lastByMonth(st.body,CURRENT_MONTH,['weight','weightKg','kg']), bp=lastByMonth(st.body,PREV_MONTH,['weight','weightKg','kg']); const bm=movement(bc?.v??null,bp?.v??null,true); const kgDiff=(bc&&bp)?bc.v-bp.v:null;
    setIndexCard(health,{name:"N&E 100 (나은's 체중 지수)",em:'WEIGHT',strong:bc?`${bc.v.toFixed(1)}kg`:(q('#homeWeight')?.textContent||'기록 없음'),move:bm,detail:kgDiff===null?'100kg 목표 · 체중 감소가 상승':`체중 ${kgDiff>0?'+':''}${kgDiff.toFixed(1)}kg · 감소가 상승`,color:'#38a77d'});

    const cc=cultureCount(st,CURRENT_MONTH), cp=cultureCount(st,PREV_MONTH); let cm;
    if(cp.total===0)cm=cc.total>0?{tone:'up',label:`↑ 전월 0개 → 이번 달 ${cc.total}개`}:{tone:'flat',label:'— 활동 변화 없음'}; else cm=movement(cc.total,cp.total,false);
    setIndexCard(growth,{name:"HINA JONES (히나's 독서·시청 지수)",em:'CULTURE',strong:`${cc.total}개`,move:cm,detail:`책 ${cc.books}권 · 시청 ${cc.movies}편`,color:'#8a5bd8'});

    const sc=averageSteps(st.exercise,CURRENT_MONTH), sp=averageSteps(st.exercise,PREV_MONTH); const sm=movement(sc?.avg??null,sp?.avg??null,false);
    setIndexCard(activity,{name:"HARUKEI 10K (하루's 걸음 지수)",em:'STEPS',strong:sc?`${Math.round(sc.avg).toLocaleString('ko-KR')}보`:(q('#homeSteps')?.textContent||'기록 없음'),move:sm,detail:sc?`이번 달 기록 ${sc.days}일 평균 · 목표 10,000보`:'기록된 날 기준 월평균',color:'#2b9db5'});
  }


  function refresh(){
    decorateHeroAndHeader(); decorateUniversity(); decorateNewsroomLogos(); decorateInvestmentLogos(); installCommentControls(); polishHasdaq(); renderLifeIndices();
  }
  let timer=null; function schedule(ms=80){clearTimeout(timer);timer=setTimeout(refresh,ms)}

  function boot(){
    injectStyle(); installGlobalClicks(); refresh();
    const ob=new MutationObserver(records=>{const meaningful=records.some(r=>r.type==='attributes' || Array.from(r.addedNodes||[]).some(n=>n.nodeType===1&&!n.matches?.('.hani-security-logo-v02978,.hani-news-comment-chip-v02978,.hani-hasdaq-inline-v02978')));if(meaningful)schedule(90)});
    ob.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-view']});
    window.addEventListener('resize',()=>schedule(120),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(80)});
    console.info('[HANI OS] v2.9.78 Stability R1 ready · no Life OS data mutation');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
