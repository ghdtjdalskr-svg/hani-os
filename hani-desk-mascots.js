/* Read-only desk decoration. HaniBuildingScene is the only office API used. */
(() => {
  'use strict';
  const map = document.getElementById('haniOfficeMap');
  const office = document.getElementById('haniOfficeLive');
  if (!map || !office || map.dataset.deskMascotsMounted) return;
  map.dataset.deskMascotsMounted = 'true';

  const CATALOG = './assets/data/desk-mascots-v1.json';
  const view = office.closest('.view');
  const floors = new Map();
  let catalog = null;
  let mounted = false;

  function loadFigure(image, file) {
    if (image.hasAttribute('src')) return;
    image.addEventListener('load', async () => {
      try {
        await image.decode();
        if (image.naturalWidth === 72 && image.naturalHeight === 72) image.dataset.ready = 'true';
      } catch (_) { /* An unavailable figure stays hidden; the office keeps working. */ }
    }, { once: true });
    image.src = file;
  }

  function update() {
    const scene = window.HaniBuildingScene;
    if (!catalog || !scene?.art || !scene.canon) return;
    if (!mounted) {
      for (const floor of scene.floors) {
        const layer = document.createElement('div');
        layer.className = 'hani-desk-mascots';
        layer.dataset.floor = floor.id;
        layer.setAttribute('aria-hidden', 'true');
        layer.hidden = true;
        const figures = [];
        for (const [id, entry] of Object.entries(catalog.staff)) {
          if (entry.floor !== floor.id) continue;
          // Never infer a desk from an actor's current (possibly travelling) seat.
          const person = scene.canon.people.find(person => person.id === id);
          const anchor = scene.art.anchors[entry.anchor];
          if (!anchor || person?.homeAnchor !== entry.anchor || scene.anchors.get(entry.anchor)?.floor !== floor.id) continue;
          const image = document.createElement('img');
          image.className = 'hani-desk-mascot';
          image.dataset.person = id;
          image.dataset.anchor = entry.anchor;
          image.dataset.planned = String(person.status === 'planned');
          image.alt = '';
          image.width = 72;
          image.height = 72;
          image.loading = 'lazy';
          image.decoding = 'async';
          image.draggable = false;
          image.style.left = (anchor.x + entry.offset[0]) + '%';
          image.style.top = (anchor.y + entry.offset[1]) + '%';
          layer.append(image);
          // Figure paths are relative to the catalog file, like the release closure reads them.
          figures.push({ image, file: new URL(entry.file, new URL(CATALOG, location.href)).href });
        }
        map.append(layer);
        floors.set(floor.id, { layer, figures });
      }
      mounted = true;
    }
    const visible = !document.hidden && !office.hidden && (!view || view.classList.contains('active')) &&
      map.clientWidth > 0 && getComputedStyle(office).display !== 'none' && map.dataset.art === 'floor';
    for (const [id, { layer, figures }] of floors) {
      const hidden = !visible || id !== map.dataset.floor;
      if (layer.hidden !== hidden) layer.hidden = hidden;
      if (!hidden) for (const { image, file } of figures) loadFigure(image, file);
    }
  }

  // Observe the existing renderer's projection; do not wrap its functions or
  // add another tab/click handler. Slots survive floor switches and scene ticks.
  const observer = new MutationObserver(update);
  observer.observe(map, { attributes: true, attributeFilter: ['data-floor', 'data-art', 'data-state', 'hidden', 'class', 'style'] });
  observer.observe(office, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
  if (view) observer.observe(view, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
  document.addEventListener('visibilitychange', update);
  new ResizeObserver(update).observe(map);
  void (async () => {
    try {
      const response = await fetch(CATALOG);
      if (!response.ok) return;
      const data = await response.json();
      if (data.schemaVersion !== 'desk-mascots-v1' || !data.staff) return;
      catalog = data;
      update();
    } catch (_) { /* Decorative catalog failure must not affect the office. */ }
  })();
})();
