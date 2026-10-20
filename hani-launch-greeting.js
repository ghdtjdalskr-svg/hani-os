/* Theme Studio UI preferences only. Independent of auth, life data and Cloud. */
(() => {
  'use strict';
  const gate = document.getElementById('loginGate');
  const app = document.getElementById('app');
  const toggle = document.getElementById('launchGreetingEnabled');
  const assets = document.getElementById('launchGreetingAssets');
  if (!gate || !app || !toggle || !assets) return;

  const key = 'hani_theme_settings_v1';
  let prefs = {launchLastSeen: '', launchEnabled: true};
  let attempted = false, cancelled = false, shown = false, storageFailed = false, seenInMemory = false;
  let sessionPrefs = {};
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || '{}');
    if (value && typeof value === 'object' && !Array.isArray(value)) sessionPrefs = value;
  } catch { /* If both stores fail, this document's memory is the fallback. */ }
  if (sessionPrefs.storageUnavailable) {
    storageFailed = true;
    prefs.launchLastSeen = typeof sessionPrefs.launchLastSeen === 'string' ? sessionPrefs.launchLastSeen : '';
    prefs.launchEnabled = sessionPrefs.launchEnabled !== false;
  }
  let panel, previousFocus, timeout, loadTimeout;
  function readPrefs() {
    if (storageFailed) return prefs;
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        prefs = {...value, launchLastSeen: typeof value.launchLastSeen === 'string' ? value.launchLastSeen : '',
          launchEnabled: value.launchEnabled !== false};
      }
    } catch {
      storageFailed = true;
      prefs.launchLastSeen = typeof sessionPrefs.launchLastSeen === 'string' ? sessionPrefs.launchLastSeen : '';
      prefs.launchEnabled = sessionPrefs.launchEnabled !== false;
    }
    return prefs;
  }
  function writePrefs(patch) {
    prefs = {...readPrefs(), ...patch};
    if (!storageFailed) {
      try { localStorage.setItem(key, JSON.stringify(prefs)); } catch { storageFailed = true; }
    }
    sessionPrefs = {...prefs, storageUnavailable: storageFailed};
    try { sessionStorage.setItem(key, JSON.stringify(sessionPrefs)); } catch { /* Memory remains. */ }
  }
  function alreadySeen(day) {
    // Session data survives reloads; if that store also throws, only this page can remember.
    return prefs.launchLastSeen === day || (storageFailed && (seenInMemory || !!sessionPrefs.launchLastSeen));
  }
  toggle.checked = readPrefs().launchEnabled;
  toggle.addEventListener('change', () => {
    writePrefs({launchEnabled: toggle.checked});
    if (!toggle.checked) finish();
  });
  // A fixed UTC offset is sufficient for KST (no daylight saving).
  function clock() {
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    return {day: kst.toISOString().slice(0, 10), hour: kst.getUTCHours()};
  }
  function unlocked() {
    return gate.classList.contains('is-hidden') && !app.inert &&
      !app.classList.contains('login-locked') && app.getAttribute('aria-hidden') !== 'true';
  }
  function gateHidden() {
    const style = getComputedStyle(gate);
    return style.display === 'none' || (style.visibility === 'hidden' && Number(style.opacity) === 0);
  }
  function gateTransitionEnded(event) {
    if (event.target === gate) void start();
  }
  function blocked() {
    return [...document.querySelectorAll('dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"], .modal, .popup, [popover]')]
      .some(node => node !== panel && !panel?.contains(node) && !node.hidden &&
        node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden' &&
        getComputedStyle(node).display !== 'none');
  }
  function skip(event) {
    if (!shown) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    finish();
  }
  function finish() {
    cancelled = true;
    clearTimeout(timeout);
    clearTimeout(loadTimeout);
    observer.disconnect();
    gate.removeEventListener('transitionend', gateTransitionEnded);
    document.removeEventListener('keydown', skip, true);
    document.removeEventListener('click', skip, true);
    const restore = shown && unlocked() && !blocked();
    shown = false;
    if (panel) panel.hidden = true;
    if (restore) {
      const usable = previousFocus?.isConnected && previousFocus !== document.body &&
        previousFocus !== document.documentElement && !previousFocus.closest('[inert], #loginGate') &&
        previousFocus.getClientRects().length;
      if (usable) previousFocus.focus({preventScroll: true});
      if (!usable || document.activeElement !== previousFocus) {
        // #title is hidden on narrow screens; fall back to the first visible page heading.
        const targets = [document.getElementById('title'), ...document.querySelectorAll('main h1, main h2, h1, h2')];
        for (const target of targets) {
          if (!target || !target.getClientRects().length) continue;
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({preventScroll: true});
          if (document.activeElement === target) break;
        }
      }
    }
  }
  async function start() {
    if (attempted || !unlocked() || !gateHidden()) return;
    attempted = true; // No retry after a dialog, timeout, storage failure or relock in this open.
    const time = clock();
    // Automated app checks skip auto-show; the dedicated suite opts in before load.
    if ((navigator.webdriver === true && window.__HANI_LAUNCH_GREETING_FORCE__ !== true) ||
      !readPrefs().launchEnabled || alreadySeen(time.day) || blocked() || document.hidden) {
      finish(); return;
    }
    const night = time.hour >= 21 || time.hour < 6;
    // This is the only art request, started only after all eligibility checks.
    const art = new Image(1600, 1000);
    art.decoding = 'async';
    art.alt = night ? '하니와 동료들, 개구리 회장님의 밤 인사' : '하니와 직원들, 개구리 회장님의 단체 인사';
    art.src = assets.content.querySelector(night ? '[data-launch-night]' : '[data-launch-day]').getAttribute('src');
    loadTimeout = setTimeout(finish, 800);
    try { await art.decode(); } catch { finish(); return; }
    clearTimeout(loadTimeout);
    if (cancelled || !unlocked() || !gateHidden() || blocked() || document.hidden || !readPrefs().launchEnabled ||
      alreadySeen(clock().day)) {
      finish(); return;
    }
    panel = document.createElement('section');
    panel.id = 'haniLaunchGreeting';
    panel.className = 'hani-launch-greeting';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'HANI 직원들의 짧은 인사');
    panel.innerHTML = '<p class="launch-kicker">HANI OS · TOGETHER, EVERY DAY</p><div class="launch-art"></div><h2></h2><p class="launch-byline">회장님의 하루에 작은 응원을 보낼게요.</p><button type="button">화면을 누르거나 아무 키나 누르면 시작해요 ↗</button>';
    panel.querySelector('.launch-art').append(art);
    panel.querySelector('h2').textContent = time.hour >= 6 && time.hour < 12 ? '좋은 아침이에요, 회장님' :
      time.hour >= 12 && time.hour < 18 ? '함께하는 오후예요, 회장님' :
      time.hour >= 18 && time.hour < 22 ? '오늘 저녁도 함께해요, 회장님' : '늦은 밤에도 곁에 있어요, 회장님';
    previousFocus = document.activeElement;
    document.body.append(panel);
    shown = true;
    seenInMemory = true;
    writePrefs({launchLastSeen: clock().day});
    document.addEventListener('keydown', skip, true);
    document.addEventListener('click', skip, true);
    panel.querySelector('button').focus({preventScroll: true});
    timeout = setTimeout(finish, matchMedia('(prefers-reduced-motion: reduce)').matches ? 1200 : 2100);
  }
  const observer = new MutationObserver(() => {
    if (attempted) {
      if (!unlocked() || blocked()) finish();
    } else { void start(); }
  });
  // is-hidden starts the gate fade. Its own transitionend completes the UI unlock;
  // computed visibility/opacity also covers no-transition and already-hidden gates.
  gate.addEventListener('transitionend', gateTransitionEnded);
  // Observe existing UI blockers/relock; never wrap login/bootstrap/sync owners.
  observer.observe(document.body, {subtree: true, childList: true, attributes: true,
    attributeFilter: ['class', 'style', 'hidden', 'open', 'inert', 'aria-hidden', 'aria-modal']});
  window.addEventListener('pagehide', finish, {once: true});
  void start();
})();
