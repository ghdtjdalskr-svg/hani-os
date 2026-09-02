/* =========================================================
   HANI OS v2.9.72
   Stability + Sidebar Polish
   - Office sidebar hierarchy polish
   - AI TEAM collapsed mini-brand polish
   - Legacy work link reroute
   - Resume-time Cloud / Newsroom refresh assist
   No direct Life OS data mutation.
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_STABILITY_POLISH_V02972';
  const STYLE_ID = 'hani-stability-polish-v02972-style';
  if (window[PATCH_ID]) return;
  window[PATCH_ID] = true;

  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function injectStyle() {
    if (q('#' + STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* v2.9.72 · Seongmin Office becomes a normal sidebar group */
      .office-group{--accent:#9b79ef!important;margin:14px 0 8px!important}
      .office-group>.office-main-nav{
        width:100%!important;min-height:0!important;padding:9px 10px!important;
        display:flex!important;grid-template-columns:none!important;
        align-items:center!important;justify-content:space-between!important;gap:8px!important;
        border:0!important;border-left:3px solid var(--accent)!important;border-radius:9px!important;
        background:#ffffff0b!important;color:#f0f4ff!important;box-shadow:none!important;
        transform:none!important;text-align:left!important;font-size:11.5px!important;
        font-weight:950!important;letter-spacing:.08em!important
      }
      .office-group>.office-main-nav:hover{
        transform:none!important;background:#ffffff14!important;color:#fff!important;
        border-color:var(--accent)!important;box-shadow:none!important
      }
      .office-group>.office-main-nav .ico{display:none!important}
      .office-group>.office-main-nav .dashboard-nav-copy{
        display:flex!important;flex:1!important;min-width:0!important;flex-direction:row!important;
        align-items:center!important;text-align:left!important
      }
      .office-group>.office-main-nav .name{
        display:flex!important;align-items:center!important;gap:7px!important;
        margin:0!important;padding:0!important;color:#f0f4ff!important;
        font-size:11.5px!important;font-weight:950!important;line-height:1.2!important;
        letter-spacing:.08em!important
      }
      .office-group>.office-main-nav .name:before{
        content:""!important;display:block!important;width:6px!important;height:6px!important;
        flex:0 0 6px!important;border-radius:50%!important;background:var(--accent)!important;
        box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 20%,transparent)!important
      }
      .office-group>.office-main-nav small{display:none!important}
      .office-group>.office-main-nav .dashboard-arrow{
        width:auto!important;height:auto!important;margin:0!important;display:block!important;
        color:#bfc9dc!important;font-size:12px!important;line-height:1!important;
        transform:none!important;transition:transform .2s!important
      }
      .office-group:not(.is-open)>.office-main-nav .dashboard-arrow{transform:rotate(-90deg)!important}
      .office-group>.group-body{
        display:grid;gap:1px;margin-top:4px!important;padding:0 0 0 8px!important;
        border-left:1px solid #ffffff12!important;margin-left:9px!important
      }
      .office-group:not(.is-open)>.group-body{display:none!important}

      /* v2.9.72 · Collapsed AI TEAM is a finished mini-brand, not an empty large card */
      .sidebar-team-mini.hani-team-collapsed-v02971{
        position:relative!important;min-height:50px!important;height:auto!important;
        margin:8px 0 18px!important;padding:0!important;border-radius:16px!important;
        overflow:hidden!important;
        background:
          radial-gradient(circle at 92% 0%,color-mix(in srgb,var(--season-accent) 13%,transparent) 0 42px,transparent 43px),
          linear-gradient(135deg,var(--season-tint),#fff)!important;
        border:1px solid var(--season-line)!important;
        box-shadow:0 8px 22px color-mix(in srgb,var(--season-accent) 8%,transparent)!important
      }
      .sidebar-team-mini.hani-team-collapsed-v02971:after{
        content:""!important;position:absolute!important;left:-24px!important;bottom:-34px!important;
        width:72px!important;height:72px!important;border-radius:50%!important;
        background:color-mix(in srgb,var(--season-accent2) 8%,transparent)!important;
        pointer-events:none!important
      }
      .sidebar-team-mini.hani-team-collapsed-v02971 .sidebar-team-head{
        position:relative!important;z-index:2!important;min-height:50px!important;
        margin:0!important;padding:0 42px!important;display:flex!important;
        align-items:center!important;justify-content:center!important;gap:0!important;
        cursor:pointer!important
      }
      .sidebar-team-mini.hani-team-collapsed-v02971 .sidebar-team-head>div{
        width:100%!important;display:flex!important;align-items:center!important;justify-content:center!important;
        min-width:0!important;text-align:center!important
      }
      .sidebar-team-mini.hani-team-collapsed-v02971 .sidebar-team-head b{
        display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;
        color:var(--season-accent)!important;font-size:11.5px!important;font-weight:1000!important;
        letter-spacing:.10em!important;line-height:1!important;text-align:center!important;white-space:nowrap!important
      }
      .sidebar-team-mini.hani-team-collapsed-v02971 .sidebar-team-head b:before{
        content:"✦";font-size:10px;color:var(--season-accent2)
      }
      .sidebar-team-mini.hani-team-collapsed-v02971 .sidebar-team-head span,
      .sidebar-team-mini.hani-team-collapsed-v02971 .sidebar-team-head em,
      .sidebar-team-mini.hani-team-collapsed-v02971 .sidebar-team-faces{display:none!important}
      .sidebar-team-mini.hani-team-collapsed-v02971 .hani-team-chevron-v02971{
        right:11px!important;top:50%!important;width:28px!important;height:28px!important;
        border-radius:9px!important;background:color-mix(in srgb,var(--season-accent) 8%,#fff)!important;
        color:var(--season-accent)!important;font-size:12px!important
      }
      @media(max-width:850px){
        .sidebar-team-mini.hani-team-collapsed-v02971{min-height:48px!important;margin-bottom:16px!important}
        .sidebar-team-mini.hani-team-collapsed-v02971 .sidebar-team-head{min-height:48px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function redirectLegacyWorkLinks() {
    qa('[data-go="work"]').forEach(el => { el.dataset.go = 'tasks'; });
    qa('[data-view="work"],[data-quick-view="work"]').forEach(el => el.remove());

    document.addEventListener('click', e => {
      const legacy = e.target.closest?.('[data-go="work"]');
      if (!legacy) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      try {
        if (typeof showView === 'function') showView('tasks');
      } catch (_) {}
    }, true);

    if (location.hash === '#work' || document.body.dataset.view === 'work') {
      setTimeout(() => {
        try {
          if (typeof showView === 'function') showView('tasks');
        } catch (_) {}
      }, 0);
    }
  }

  let lastResumeAt = 0;
  async function refreshAfterResume(reason) {
    const now = Date.now();
    if (now - lastResumeAt < 2500) return;
    lastResumeAt = now;

    try {
      const signedIn = typeof cloudUser !== 'undefined' && !!cloudUser;
      const recovering = typeof cloudRecoveryMode !== 'undefined' && !!cloudRecoveryMode;
      if (signedIn && !recovering && typeof cloudSyncCycle === 'function') {
        await cloudSyncCycle('resume-' + reason);
      }
    } catch (e) {
      console.warn('[v2.9.72] resume cloud check', e);
    }

    try {
      const signedIn = typeof cloudUser !== 'undefined' && !!cloudUser;
      const view = document.body.dataset.view || q('.view.active')?.id || '';
      if (signedIn && view === 'newsroom' && typeof investmentNewsArchiveLoad === 'function') {
        await investmentNewsArchiveLoad(true);
      }
    } catch (e) {
      console.warn('[v2.9.72] newsroom archive resume check', e);
    }
  }

  function bindResumeChecks() {
    window.addEventListener('pageshow', () => refreshAfterResume('pageshow'));
    window.addEventListener('focus', () => refreshAfterResume('focus'));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshAfterResume('visible');
    });
  }

  function init() {
    injectStyle();
    redirectLegacyWorkLinks();
    bindResumeChecks();
    console.info('[HANI OS] v2.9.72 Stability + Sidebar Polish ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
