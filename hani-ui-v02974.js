/* =========================================================
   HANI OS v2.9.74 Candidate
   Sidebar Harmony + Full Team Photo + Global News Comment Hotfix
   UI-only patch.
   - NO localStorage key changes
   - NO hani_state/schema mutations
   - NO Supabase writes
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_UI_V02974_SIDEBAR_HARMONY';
  const STYLE_ID = 'hani-ui-v02974-style';
  if (window[PATCH_ID]) return;
  window[PATCH_ID] = true;
  window.HANI_UI_PATCH_VERSION = '2.9.74-candidate';

  const q = (sel, root = document) => root.querySelector(sel);

  function injectStyle(){
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
/* =========================================================
   v2.9.74 · Theme hierarchy
   Season = sidebar atmosphere / brand accents.
   Main content surfaces = clean white.
   ========================================================= */
html[data-season="spring"]{
  --hani-side-a:#fff1f6;
  --hani-side-b:#f6effb;
  --hani-side-line:#ead8e5;
  --hani-brand-a:#d486a6;
  --hani-brand-b:#b996cc;
  --hani-brand-orb:rgba(255,255,255,.18);
  --hani-season-dot:#b96f9b;
}
html[data-season="summer"]{
  --hani-side-a:#edfafa;
  --hani-side-b:#edf5fc;
  --hani-side-line:#d2e8ea;
  --hani-brand-a:#55a9bd;
  --hani-brand-b:#6f9fce;
  --hani-brand-orb:rgba(255,255,255,.18);
  --hani-season-dot:#208ea4;
}
html[data-season="autumn"]{
  --hani-side-a:#fbf0e4;
  --hani-side-b:#f8eee8;
  --hani-side-line:#ead9ca;
  --hani-brand-a:#c6814b;
  --hani-brand-b:#dda064;
  --hani-brand-orb:rgba(255,255,255,.18);
  --hani-season-dot:#b86d39;
}
html[data-season="winter"]{
  --hani-side-a:#eef4fb;
  --hani-side-b:#f2f0fa;
  --hani-side-line:#d8e0ee;
  --hani-brand-a:#6489bc;
  --hani-brand-b:#8098c6;
  --hani-brand-orb:rgba(255,255,255,.18);
  --hani-season-dot:#5a78ad;
}
html:not([data-season]){
  --hani-side-a:#f5f1ff;
  --hani-side-b:#f0f7fb;
  --hani-side-line:#dfd9ee;
  --hani-brand-a:#7969c8;
  --hani-brand-b:#8b7bd3;
  --hani-brand-orb:rgba(255,255,255,.18);
  --hani-season-dot:#735bd7;
}

/* Sidebar gets the visible pastel atmosphere. */
#sidebar.side{
  background:
    radial-gradient(circle at 18% 6%, rgba(255,255,255,.78) 0 7%, transparent 7.5%),
    linear-gradient(180deg,var(--hani-side-a) 0%,var(--hani-side-b) 100%)!important;
  border-right-color:var(--hani-side-line)!important;
}

/* Top brand and AI TEAM = one brand family. */
#sidebar .sidebar-brand-hero,
#sidebar .sidebar-team-mini{
  position:relative!important;
  overflow:hidden!important;
  background:linear-gradient(135deg,var(--hani-brand-a),var(--hani-brand-b))!important;
  border:1px solid rgba(255,255,255,.20)!important;
  box-shadow:0 8px 20px rgba(60,72,104,.10)!important;
  color:#fff!important;
}
#sidebar .sidebar-brand-hero:before,
#sidebar .sidebar-brand-hero:after,
#sidebar .sidebar-team-mini:before,
#sidebar .sidebar-team-mini:after{
  content:""!important;
  position:absolute!important;
  border-radius:999px!important;
  background:var(--hani-brand-orb)!important;
  pointer-events:none!important;
}
#sidebar .sidebar-brand-hero:before,
#sidebar .sidebar-team-mini:before{
  width:66px!important;height:66px!important;left:-18px!important;top:-24px!important;
}
#sidebar .sidebar-brand-hero:after,
#sidebar .sidebar-team-mini:after{
  width:86px!important;height:86px!important;right:-30px!important;bottom:-44px!important;
}
#sidebar .sidebar-brand-hero .brand-copy,
#sidebar .sidebar-team-mini .sidebar-team-head{
  position:relative!important;z-index:1!important;
}
#sidebar .sidebar-team-mini{
  min-height:68px!important;
  margin-top:12px!important;
  padding:14px 16px!important;
  border-radius:18px!important;
}
#sidebar .sidebar-team-head{
  width:100%!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:10px!important;
}
#sidebar .sidebar-team-head>div{display:block!important}
#sidebar .sidebar-team-head b{
  color:#fff!important;
  font-size:16px!important;
  line-height:1.15!important;
  font-weight:1000!important;
  letter-spacing:-.01em!important;
}
#sidebar .sidebar-team-head span,
#sidebar .sidebar-team-faces{
  display:none!important;
}
#sidebar .sidebar-team-head em{
  color:rgba(255,255,255,.82)!important;
  font-size:8.5px!important;
  font-style:normal!important;
  font-weight:850!important;
  white-space:nowrap!important;
}

/* Every major group follows the same geometry. Office loses its special card treatment. */
#sidebar .group{
  background:transparent!important;
}
#sidebar .group>.group-head,
#sidebar .office-group>.office-main-nav{
  width:100%!important;
  min-height:44px!important;
  display:flex!important;
  align-items:center!important;
  gap:8px!important;
  padding:11px 12px!important;
  margin:0!important;
  border:0!important;
  border-radius:12px!important;
  background:transparent!important;
  box-shadow:none!important;
  color:#505c70!important;
}
#sidebar .group>.group-head:hover,
#sidebar .office-group>.office-main-nav:hover{
  background:rgba(255,255,255,.52)!important;
}
#sidebar .office-group>.office-main-nav>.ico,
#sidebar .office-group>.office-main-nav small{
  display:none!important;
}
#sidebar .office-group>.office-main-nav .dashboard-nav-copy{
  display:block!important;
  flex:1 1 auto!important;
  min-width:0!important;
}
#sidebar .group>.group-head .name,
#sidebar .office-group>.office-main-nav .name{
  color:#505c70!important;
  font-size:14px!important;
  line-height:1.2!important;
  font-weight:900!important;
}
#sidebar .group>.group-head .arrow,
#sidebar .office-group>.office-main-nav .dashboard-arrow{
  margin-left:auto!important;
  color:#8d97a8!important;
  font-size:10px!important;
}
#sidebar .office-group>.office-main-nav .dashboard-arrow{
  display:block!important;
}

/* Child menu geometry is common; active rows are clean white. */
#sidebar .group-body{
  background:transparent!important;
}
#sidebar .group-body .nav-btn{
  border-color:transparent!important;
  background:transparent!important;
  box-shadow:none!important;
  color:#626d7f!important;
}
#sidebar .group-body .nav-btn .txt{
  color:#626d7f!important;
  font-weight:760!important;
}
#sidebar .group-body .nav-btn:hover{
  background:rgba(255,255,255,.48)!important;
}
#sidebar .group-body .nav-btn.active{
  background:#fff!important;
  border:1px solid color-mix(in srgb,var(--hani-season-dot) 22%,#e2e7ef)!important;
  box-shadow:0 5px 14px rgba(54,66,90,.055)!important;
}
#sidebar .group-body .nav-btn.active .txt{
  color:#394455!important;
  font-weight:950!important;
}

/* Keep Office child icons distinct without tinting the whole parent. */
#sidebar .office-group .group-body .nav-btn:nth-child(1){--office-item:#259b7d;--office-soft:#e9f8f2}
#sidebar .office-group .group-body .nav-btn:nth-child(2){--office-item:#735bd7;--office-soft:#f0ecff}
#sidebar .office-group .group-body .nav-btn:nth-child(3){--office-item:#ca7b4e;--office-soft:#fff1e8}
#sidebar .office-group .group-body .nav-btn:nth-child(4){--office-item:#4e82c5;--office-soft:#edf4ff}
#sidebar .office-group .group-body .nav-btn .ico{
  color:var(--office-item)!important;
  background:var(--office-soft)!important;
}

/* Team photo: still compact, but show the whole approved company photo. */
#haniSidebarTeamPhotoV02973{
  margin:14px 9px 8px!important;
  padding:5px!important;
  border:1px solid rgba(132,145,164,.23)!important;
  border-radius:15px!important;
  background:rgba(255,255,255,.76)!important;
  box-shadow:0 7px 17px rgba(54,66,90,.055)!important;
}
#haniSidebarTeamPhotoV02973 .hani-team-photo-frame{
  height:126px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  overflow:hidden!important;
  border-radius:11px!important;
  background:#fff!important;
}
#haniSidebarTeamPhotoV02973 img{
  width:100%!important;
  height:100%!important;
  object-fit:contain!important;
  object-position:center!important;
}
#haniSidebarTeamPhotoV02973 .hani-team-photo-label{
  display:none!important;
}
.sidebar-mini #haniSidebarTeamPhotoV02973{display:none!important}

/* Main content returns to white. Season lives around it, not inside every hero card. */
#app .main .ai-banner,
#newsroom .ai-banner{
  background:#fff!important;
  border-color:#e1e6ee!important;
  box-shadow:0 8px 22px rgba(52,65,88,.045)!important;
}
#app .main .ai-banner:before,
#app .main .ai-banner:after,
#newsroom .ai-banner:before,
#newsroom .ai-banner:after{
  background:color-mix(in srgb,var(--hani-season-dot) 7%,transparent)!important;
}
#newsroom .investment-news-note,
#newsroom .investment-news-toolbar,
#newsroom .newsroom-mode-tabs,
#newsroom .investment-news-board-shell>.sh,
#newsroom #haniNewsroomPagerV02973{
  background:#fff!important;
  border-color:#e2e7ef!important;
}
#newsroom #haniNewsroomPagerV02973 button.active{
  background:#fff!important;
  color:var(--hani-season-dot)!important;
  border-color:var(--hani-season-dot)!important;
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--hani-season-dot) 20%,transparent)!important;
}

/* Comment chip stays visually clickable regardless of renderer generation. */
#newsroom .hani-news-comment-chip-v02970,
#newsroom .hani-news-comment-chip-v02973{
  touch-action:manipulation!important;
  user-select:none!important;
}

@media(max-width:650px){
  #haniSidebarTeamPhotoV02973 .hani-team-photo-frame{height:118px!important}
}
`;
    document.head.appendChild(style);
  }

  function commentRowFrom(target){
    return target?.closest?.('.newsroom-v03-row,.investment-news-board-row') || null;
  }

  function commentOpener(row){
    return row && q('.newsroom-v03-main,.investment-news-row-main', row);
  }

  function scrollComments(row){
    if (!row) return;
    window.setTimeout(() => {
      const box = q('.news-agent-comments', row);
      const open = row.classList.contains('open') ||
        !!q('[aria-expanded="true"]', row);
      if (box && open) box.scrollIntoView({behavior:'smooth', block:'nearest'});
    }, 110);
  }

  function activateCommentChip(ev, chip){
    if (!chip) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();

    const row = commentRowFrom(chip);
    if (!row) return;
    const opener = commentOpener(row);
    const open = row.classList.contains('open') ||
      !!q('[aria-expanded="true"]', row);

    if (!open && opener && typeof opener.click === 'function') {
      opener.click();
    }
    scrollComments(row);
  }

  function installGlobalCommentGate(){
    const root = q('#newsroom');
    if (!root || root.dataset.haniV02974CommentGate === '1') return;
    root.dataset.haniV02974CommentGate = '1';

    /* Capture phase intentionally runs before v2.9.70 per-chip handlers.
       This makes Samsung/LG/NVIDIA/Amazon/future rows use one path. */
    root.addEventListener('click', ev => {
      const chip = ev.target?.closest?.(
        '.hani-news-comment-chip-v02970,.hani-news-comment-chip-v02973'
      );
      if (!chip || !root.contains(chip)) return;
      activateCommentChip(ev, chip);
    }, true);

    root.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const chip = ev.target?.closest?.(
        '.hani-news-comment-chip-v02970,.hani-news-comment-chip-v02973'
      );
      if (!chip || !root.contains(chip)) return;
      activateCommentChip(ev, chip);
    }, true);
  }

  function boot(){
    injectStyle();
    installGlobalCommentGate();
    /* Newsroom can mount after boot; retry without touching its data. */
    window.setTimeout(installGlobalCommentGate, 350);
    window.setTimeout(installGlobalCommentGate, 1000);
    console.info('[HANI OS] v2.9.74 Candidate active · Sidebar Harmony / Full Team Photo / Global Comment Gate');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
