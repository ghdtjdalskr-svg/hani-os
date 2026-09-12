(() => {
  'use strict';

  const data = window.HANI_BANNER_PREVIEW_DATA;
  const root = document.querySelector('#seasonalPreviewList');
  if (!data || !root) return;

  const menuIds = ['investment','study','media','diary','approval'];
  const seasons = [
    {id:'spring',label:'SPRING',summary:'파스텔 · 산뜻한 생동감'},
    {id:'summer',label:'SUMMER',summary:'청량 · 맑은 선명도'},
    {id:'autumn',label:'AUTUMN',summary:'온기 · 성숙한 차분함'},
    {id:'winter',label:'WINTER',summary:'쿨톤 · 또렷한 정돈감'}
  ];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const categories = Object.fromEntries(data.categories.map(item => [item.id,item]));
  const menus = menuIds.map(id => data.previews.find(item => item.id === id)).filter(Boolean);

  const sceneStyle = item => `--scene-position:${esc(item.scenePosition || 'center center')};--scene-position-mobile:${esc(item.sceneMobile || '72% center')};--scene-fit:${esc(item.sceneFit || 'cover')};--scene-fit-mobile:${esc(item.sceneFitMobile || item.sceneFit || 'cover')}`;

  const banner = (item,season) => `<section class="main-character-banner theme-${esc(item.theme)}" data-menu-scene="${esc(item.id)}" data-season-variant="${esc(season.id)}" style="${sceneStyle(item)}" role="group" aria-label="${esc(item.menu)} ${esc(season.label)} 배너 시안">
    <figure class="main-character-banner__scene"><img src="${esc(item.scene)}" alt="${esc(item.sceneAlt)}"></figure>
    <div class="main-character-banner__copy">
      <span class="banner-eyebrow">${esc(item.eyebrow)}</span>
      <h3 class="banner-title">${esc(item.title)}</h3>
      <p class="banner-description">${esc(item.description)}</p>
      <div class="banner-agent">
        <img src="${esc(item.avatar)}" alt="${esc(item.agent)} 프로필" width="720" height="720">
        <div class="banner-quote"><small>${esc(item.agent)} · ${esc(item.role)}</small><strong>“${esc(item.quote)}”</strong></div>
      </div>
    </div>
  </section>`;

  const contentPeek = item => `<div class="content-peek" aria-label="${esc(item.menu)} 본문 카드 톤">${item.content.map(([kicker,label]) => `<div><small>${esc(kicker)}</small><b>${esc(label)}</b></div>`).join('')}</div>`;

  const variant = (item,season) => `<section class="seasonal-variant" data-season="${esc(season.id)}" data-season-card="${esc(season.id)}">
    <header class="seasonal-variant__head"><b>${esc(season.label)}</b><span>${esc(season.summary)}</span></header>
    <div class="seasonal-page-surface">
      ${banner(item,season)}
      ${contentPeek(item)}
      <div class="seasonal-token-row" aria-label="계절 변화 요소"><span>PAGE</span><span>CARD</span><span>BORDER</span><span>CHIP</span><span>LIGHT</span></div>
    </div>
  </section>`;

  const menu = item => {
    const category = categories[item.category];
    return `<article class="seasonal-menu" id="seasonal-${esc(item.id)}" style="--art-accent:${esc(category.accent)};--art-soft:${esc(category.soft)}">
      <header class="seasonal-menu__head">
        <div><span>${esc(category.kicker)} · SCENE FIXED</span><h2>${esc(item.menu)} Seasonal Theme</h2><p>${esc(item.characters)} · 동일 장면과 동일 담당자 구조로 네 계절을 비교합니다.</p></div>
        <b>4 SEASONS</b>
      </header>
      <div class="seasonal-grid">${seasons.map(season => variant(item,season)).join('')}</div>
    </article>`;
  };

  root.innerHTML = menus.map(menu).join('');
  document.querySelector('#seasonalJump').innerHTML = menus.map(item => `<a href="#seasonal-${esc(item.id)}">${esc(item.menu)}</a>`).join('');
})();
