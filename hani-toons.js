/* HaniToons: static chibi webtoon board and vertical reader. No persistence. */
(() => {
  'use strict';

  const DAY = 86400000;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

  let items = [];
  let loaded = false;
  let failed = false;
  let loading = null;
  let activeSeries = '';
  let selectedId = null;
  const boundRoots = typeof WeakSet === 'function' ? new WeakSet() : null;

  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const time = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? value : null;
  }

  function koreaDate(now = Date.now()) {
    return new Date(now + 9 * 3600000).toISOString().slice(0, 10);
  }

  function isNewDate(day, now = Date.now()) {
    if (!day) return false;
    const todayMs = Date.parse(koreaDate(now) + 'T00:00:00Z');
    const itemMs = Date.parse(day + 'T00:00:00Z');
    if (!Number.isFinite(todayMs) || !Number.isFinite(itemMs)) return false;
    const diffDays = (todayMs - itemMs) / DAY;
    return diffDays >= 0 && diffDays <= 7;
  }

  function formatDate(day) {
    return day ? day.replaceAll('-', '.') : '';
  }

  // The catalog stores image names, not paths, so the release closure does not pull every seeded image.
  function isSafeImageName(value) {
    return typeof value === 'string' && /^[a-z0-9-]{1,60}$/.test(value);
  }

  function partUrl(name) {
    return 'assets/toons/' + name + '.webp';
  }

  function thumbUrl(name) {
    return 'assets/toons/thumb/' + name + '.webp';
  }

  function positiveInt(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }

  function parseData(raw) {
    if (!raw || typeof raw !== 'object' || raw.v !== 1 || !Array.isArray(raw.items)) {
      throw new Error('invalid_format');
    }
    const seen = new Set();
    const out = [];
    for (const row of raw.items) {
      if (!row || typeof row !== 'object') continue;
      if (typeof row.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(row.id)) continue;
      if (seen.has(row.id)) continue;
      if (!isSafeImageName(row.thumb)) continue;
      if (!Array.isArray(row.parts) || row.parts.length < 1 || !row.parts.every(isSafeImageName)) continue;

      seen.add(row.id);
      const title = typeof row.title === 'string' && row.title.trim() ? row.title.trim() : row.id;
      const series = typeof row.series === 'string' && row.series.trim() ? row.series.trim() : '단편';
      const episode = typeof row.episode === 'string' && row.episode.trim() ? row.episode.trim() : null;
      const date = validDate(row.date);
      const width = positiveInt(row.width);
      const height = positiveInt(row.height);

      out.push({
        id: row.id,
        series,
        episode,
        title,
        date,
        parts: row.parts.map(partUrl),
        thumb: thumbUrl(row.thumb),
        width,
        height
      });
    }
    return out;
  }

  function getRoot() {
    if (typeof document === 'undefined') return null;
    return document.querySelector('#hanitoon [data-toon-root]');
  }

  function scrollToTop() {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'auto' });
      } catch {
        window.scrollTo(0, 0);
      }
    }
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
  }

  function getSeriesList() {
    const list = [];
    const seen = new Set();
    for (const item of items) {
      if (!seen.has(item.series)) {
        seen.add(item.series);
        list.push(item.series);
      }
    }
    return list;
  }

  function getFilteredItems() {
    if (!activeSeries) return items;
    const filtered = items.filter(item => item.series === activeSeries);
    if (!filtered.length && !items.some(item => item.series === activeSeries)) {
      activeSeries = '';
      return items;
    }
    return filtered;
  }

  function renderHeader(totalCount) {
    return (
      '<header class="toon-header">' +
        '<p class="toon-tagline"><span aria-hidden="true">📚</span> 오늘도 회사는 시끌벅적</p>' +
        '<h2 class="toon-title">하니툰</h2>' +
        '<p class="toon-subtitle">회장님 회사의 소소한 이야기 · 총 ' + esc(totalCount) + '화</p>' +
      '</header>'
    );
  }

  function renderList(now = Date.now()) {
    const seriesList = getSeriesList();
    const visible = getFilteredItems();

    const chipsHtml =
      '<div class="toon-chips" role="group" aria-label="시리즈 필터">' +
        '<button type="button" class="toon-chip" data-toon-series="" aria-pressed="' + esc(activeSeries === '') + '">전체</button>' +
        seriesList.map(series =>
          '<button type="button" class="toon-chip" data-toon-series="' + esc(series) + '" aria-pressed="' + esc(activeSeries === series) + '">' + esc(series) + '</button>'
        ).join('') +
      '</div>';

    if (!visible.length) {
      return (
        '<div class="toon-shell">' +
          renderHeader(items.length) +
          chipsHtml +
          '<div class="toon-empty" role="status">아직 등록된 웹툰이 없어요</div>' +
        '</div>'
      );
    }

    const rowsHtml = visible.map(item => {
      const metaText = item.series + (item.episode ? ' · ' + item.episode : '');
      const dateText = formatDate(item.date);
      const isNew = isNewDate(item.date, now);
      const ariaParts = [item.title, metaText];
      if (dateText) ariaParts.push(dateText);
      if (isNew) ariaParts.push('새 웹툰');

      return (
        '<li class="toon-list-item">' +
          '<button type="button" class="toon-row" data-toon-open="' + esc(item.id) + '" aria-label="' + esc(ariaParts.join(', ')) + '">' +
            '<span class="toon-thumb-wrap">' +
              '<img class="toon-thumb" src="' + esc(item.thumb) + '" alt="" width="64" height="64" loading="lazy" decoding="async">' +
            '</span>' +
            '<span class="toon-row-body">' +
              '<span class="toon-row-title-line">' +
                '<strong class="toon-row-title">' + esc(item.title) + '</strong>' +
                (isNew ? '<span class="toon-new-badge"><span class="toon-new-dot" aria-hidden="true"></span>NEW</span>' : '') +
              '</span>' +
              '<span class="toon-row-meta">' + esc(metaText) + '</span>' +
            '</span>' +
            (dateText ? '<time class="toon-row-date" datetime="' + esc(item.date) + '">' + esc(dateText) + '</time>' : '') +
          '</button>' +
        '</li>'
      );
    }).join('');

    return (
      '<div class="toon-shell">' +
        renderHeader(items.length) +
        chipsHtml +
        '<section class="toon-board" aria-label="하니툰 목록">' +
          '<ul class="toon-list">' + rowsHtml + '</ul>' +
        '</section>' +
      '</div>'
    );
  }

  function renderReader() {
    const filtered = getFilteredItems();
    const index = filtered.findIndex(item => item.id === selectedId);
    if (index === -1) {
      selectedId = null;
      return renderList();
    }

    const item = filtered[index];
    // List is newest-first: older episode ("이전 화") is index + 1, newer episode ("다음 화") is index - 1.
    const prevItem = index + 1 < filtered.length ? filtered[index + 1] : null;
    const nextItem = index - 1 >= 0 ? filtered[index - 1] : null;

    const metaText = item.series + (item.episode ? ' · ' + item.episode : '');
    const dateText = formatDate(item.date);
    const hasDims = item.width !== null && item.height !== null;
    const partHeight = hasDims
      ? (item.parts.length > 1 ? Math.max(1, Math.round(item.height / item.parts.length)) : item.height)
      : null;
    const dimAttrs = hasDims ? ' width="' + esc(item.width) + '" height="' + esc(partHeight) + '"' : '';

    const partsHtml = item.parts.map((part, i) => {
      const alt = item.parts.length > 1 ? item.title + ' (' + (i + 1) + '/' + item.parts.length + ')' : item.title;
      return '<img class="toon-part" src="' + esc(part) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async"' + dimAttrs + '>';
    }).join('');

    return (
      '<div class="toon-shell">' +
        '<article class="toon-reader">' +
          '<header class="toon-reader-top">' +
            '<button type="button" class="toon-back-btn" data-toon-list>‹ 목록</button>' +
            '<div class="toon-reader-info">' +
              '<p class="toon-reader-meta">' + esc(metaText) + (dateText ? ' · ' + esc(dateText) : '') + '</p>' +
              '<h2 class="toon-reader-title">' + esc(item.title) + '</h2>' +
            '</div>' +
          '</header>' +
          '<div class="toon-canvas">' + partsHtml + '</div>' +
          '<nav class="toon-reader-nav" aria-label="화 이동">' +
            '<button type="button" class="toon-nav-btn"' +
              (prevItem ? ' data-toon-go="' + esc(prevItem.id) + '" aria-label="' + esc('이전 화: ' + prevItem.title) + '"' : ' disabled') +
            '>‹ 이전 화</button>' +
            '<button type="button" class="toon-nav-btn toon-nav-list" data-toon-list>목록</button>' +
            '<button type="button" class="toon-nav-btn"' +
              (nextItem ? ' data-toon-go="' + esc(nextItem.id) + '" aria-label="' + esc('다음 화: ' + nextItem.title) + '"' : ' disabled') +
            '>다음 화 ›</button>' +
          '</nav>' +
        '</article>' +
      '</div>'
    );
  }

  function bindRoot(root) {
    if (!root || (boundRoots && boundRoots.has(root))) return;
    if (boundRoots) boundRoots.add(root);

    root.addEventListener('click', event => {
      const target = event.target;
      if (!target || typeof target.closest !== 'function') return;

      const seriesBtn = target.closest('[data-toon-series]');
      if (seriesBtn && root.contains(seriesBtn)) {
        activeSeries = seriesBtn.getAttribute('data-toon-series') || '';
        selectedId = null;
        render();
        return;
      }

      const openBtn = target.closest('[data-toon-open]');
      if (openBtn && root.contains(openBtn)) {
        const id = openBtn.getAttribute('data-toon-open');
        if (id) {
          selectedId = id;
          render();
          scrollToTop();
        }
        return;
      }

      const listBtn = target.closest('[data-toon-list]');
      if (listBtn && root.contains(listBtn)) {
        selectedId = null;
        render();
        scrollToTop();
        return;
      }

      const goBtn = target.closest('[data-toon-go]');
      if (goBtn && root.contains(goBtn) && !goBtn.disabled) {
        const id = goBtn.getAttribute('data-toon-go');
        if (id) {
          selectedId = id;
          render();
          scrollToTop();
        }
      }
    });
  }

  function render() {
    const root = getRoot();
    if (!root) return;
    bindRoot(root);

    if (failed && !loaded) {
      root.innerHTML =
        '<div class="toon-shell">' +
          '<div class="toon-empty" role="status">웹툰을 불러오지 못했어요</div>' +
        '</div>';
      return;
    }

    if (!loaded) {
      root.innerHTML =
        '<div class="toon-shell">' +
          '<div class="toon-empty" role="status">웹툰을 불러오는 중이에요...</div>' +
        '</div>';
      return;
    }

    root.innerHTML = selectedId ? renderReader() : renderList();
  }

  async function enter() {
    const root = getRoot();
    if (root) bindRoot(root);

    if (!loaded) {
      if (root && !root.innerHTML) render();
      if (!loading) {
        loading = (async () => {
          try {
            const response = await fetch('./assets/data/hani-toons-v1.json');
            if (!response.ok) throw new Error('fetch_failed');
            const data = await response.json();
            items = parseData(data);
            loaded = true;
            failed = false;
          } catch {
            failed = true;
          } finally {
            loading = null;
          }
        })();
      }
      await loading;
    }

    render();
  }

  function latestDate() {
    if (!loaded || !items.length) return null;
    let max = null;
    for (const item of items) {
      if (item.date && (!max || item.date > max)) {
        max = item.date;
      }
    }
    return max;
  }

  if (typeof window !== 'undefined') {
    window.HaniToons = Object.freeze({ enter, latestDate });
  }
})();
