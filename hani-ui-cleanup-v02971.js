/* =========================================================
   HANI OS v2.9.71
   Final UI Cleanup + Yuna Info Desk Shell
   UI-only: no Life OS core data mutation / no Supabase schema write
   ========================================================= */
(() => {
  'use strict';

  const PATCH_ID = 'HANI_UI_CLEANUP_V02971';
  const STYLE_ID = 'hani-ui-cleanup-v02971-style';
  if (window[PATCH_ID]) return;
  window[PATCH_ID] = true;

  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const NAV_LABELS = {
    home: '대시보드',
    intake: '인포데스크',
    agentReview: 'AI 결재실',
    policy: '사내 규칙',
    deployment: '배포 센터',
    investment: '투자',
    investmentIntake: '투자 계좌 업데이트',
    asset: '자산',
    ledger: '가계부',
    newsroom: '뉴스룸',
    diet: '다이어트',
    exercise: '운동',
    reading: '독서·서재',
    study: '공부',
    university: '대학교 관리',
    certificate: '자격증',
    wishlist: 'Wish-list',
    travel: '여행',
    movie: '시청 아카이브',
    game: '게임',
    diary: '일기',
    tasks: '할 일',
    calendar: '캘린더',
    drive: 'Drive',
    dev: '개발센터',
    aiTeam: 'AI 팀',
    settings: '설정·데이터'
  };

  const PAGE_DESC = {
    intake: '말하거나 붙여넣으면 유나가 필요한 경우에만 짧게 확인하고 Draft로 정리합니다.',
    investmentIntake: '계좌 스크린샷 기반 투자 데이터 업데이트 기능을 준비 중입니다.'
  };

  const BANNER_ALIASES = {
    intake: '유나의 “맡겨만 주세요”',
    agentReview: '사느냐 마느냐 그것이 문제로다',
    policy: '성민 헌법',
    tasks: '수아의 “JUST DO IT”',
    calendar: '수아의 “세월아 네월아”',
    investment: '하니의 “월 스트리트”',
    asset: '지은의 “머니볼”',
    ledger: '지은이의 “복리가 세상을 살린다”',
    newsroom: '주식 읽어주는 여자 하니TV',
    diet: '나은의 “계체량 측정소”',
    exercise: '나은의 “Hell’s Club”',
    reading: '하루’s “밀리의 서재”',
    study: '히나의 “대표랑 과외하기”',
    university: '히나랑 “알콩달콩 캠퍼스 라이프”',
    certificate: '히나와 LEVEL UP!',
    wishlist: '하루의 “Flex 저장소”',
    travel: '수연이의 “꽃보다 여행”',
    movie: '민지의 “HONGFLIX”'
  };

  function injectStyle() {
    if (q('#' + STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* v2.9.71 · clean product UI */
      .sidebar-team-mini.hani-team-collapsed-v02971 .sidebar-team-faces{display:none!important}
      .sidebar-team-mini.hani-team-collapsed-v02971{padding-bottom:8px!important}
      .sidebar-team-mini .sidebar-team-head{cursor:pointer;user-select:none;position:relative;padding-right:28px!important}
      .sidebar-team-mini .hani-team-chevron-v02971{
        position:absolute;right:2px;top:50%;transform:translateY(-50%) rotate(-90deg);
        width:24px;height:24px;border:0;background:transparent;color:inherit;
        display:grid;place-items:center;font-size:14px;font-weight:1000;transition:transform .16s ease;
        pointer-events:none
      }
      .sidebar-team-mini:not(.hani-team-collapsed-v02971) .hani-team-chevron-v02971{
        transform:translateY(-50%) rotate(0deg)
      }
      .sidebar-team-mini.hani-team-collapsed-v02971 .sidebar-team-head span,
      .sidebar-team-mini.hani-team-collapsed-v02971 .sidebar-team-head em{display:none!important}

      .hani-investment-intake-placeholder-v02971{
        min-height:300px;display:grid;place-items:center;padding:28px
      }
      .hani-investment-intake-placeholder-v02971 .inner{
        width:min(620px,100%);text-align:center;padding:34px;border:1px solid #e4e0f4;
        border-radius:20px;background:linear-gradient(135deg,#fbfaff,#fff)
      }
      .hani-investment-intake-placeholder-v02971 .icon{font-size:34px;margin-bottom:10px}
      .hani-investment-intake-placeholder-v02971 h3{margin:0 0 7px;font-size:22px}
      .hani-investment-intake-placeholder-v02971 p{margin:0;color:#73798a;line-height:1.6}
      .hani-investment-intake-placeholder-v02971 .soon{
        display:inline-flex;margin-top:14px;padding:6px 10px;border-radius:999px;
        background:#f1edff;color:#6954cc;font-size:11px;font-weight:950
      }

      #intake .intake-hero-badge{display:none!important}
      #intake .intake-hero.office-intake-hero{align-items:center!important}
      #intake .intake-hero.office-intake-hero p{max-width:760px!important}
      #intake .intake-yuna-desk .intake-yuna-copy>span{display:none!important}
      #intake .intake-yuna-desk .intake-yuna-copy p{margin-top:4px!important}
      #intake .intake-route-strip{margin-top:8px!important}
      #intake .intake-paste-copy span{font-size:11px!important;color:#858b99!important}
    `;
    document.head.appendChild(style);
  }

  function updateGlobals() {
    try {
      if (typeof pageMeta !== 'undefined' && pageMeta) {
        Object.entries(NAV_LABELS).forEach(([id, label]) => {
          if (id === 'investmentIntake') return;
          if (pageMeta[id]) pageMeta[id][0] = label;
        });
        if (pageMeta.intake) pageMeta.intake[1] = PAGE_DESC.intake;
        pageMeta.investmentIntake = [
          NAV_LABELS.investmentIntake,
          PAGE_DESC.investmentIntake,
          'finance'
        ];
        if (pageMeta.work) delete pageMeta.work;
      }
    } catch (e) {
      console.warn('[v2.9.71] pageMeta patch skipped', e);
    }

    try {
      if (typeof pageBannerMap !== 'undefined' && pageBannerMap) {
        Object.entries(BANNER_ALIASES).forEach(([id, alias]) => {
          pageBannerMap[id] = Object.assign({}, pageBannerMap[id] || {}, { name: alias });
        });
        pageBannerMap.investmentIntake = Object.assign({}, pageBannerMap.investment || {}, {
          name: '하니 · Investment Snapshot Intake',
          message: PAGE_DESC.investmentIntake
        });
        if (pageBannerMap.work) delete pageBannerMap.work;
      }
    } catch (e) {
      console.warn('[v2.9.71] pageBannerMap patch skipped', e);
    }

    try {
      if (typeof pageAgentImage !== 'undefined' && pageAgentImage) {
        pageAgentImage.investmentIntake = 'hani';
      }
    } catch (_) {}

    try {
      if (typeof QUICK_JUMP_ITEMS !== 'undefined' && Array.isArray(QUICK_JUMP_ITEMS)) {
        for (let i = QUICK_JUMP_ITEMS.length - 1; i >= 0; i--) {
          if (QUICK_JUMP_ITEMS[i]?.[0] === 'work') QUICK_JUMP_ITEMS.splice(i, 1);
        }
        QUICK_JUMP_ITEMS.forEach(row => {
          const label = NAV_LABELS[row?.[0]];
          if (label) row[1] = label;
        });
        if (!QUICK_JUMP_ITEMS.some(row => row?.[0] === 'investmentIntake')) {
          const idx = QUICK_JUMP_ITEMS.findIndex(row => row?.[0] === 'investment');
          QUICK_JUMP_ITEMS.splice(
            idx >= 0 ? idx + 1 : 1,
            0,
            ['investmentIntake', NAV_LABELS.investmentIntake, '투자 계좌 캡처 스크린샷 보유종목 업데이트']
          );
        }
        if (typeof renderQuickJump === 'function') renderQuickJump('');
      }
    } catch (e) {
      console.warn('[v2.9.71] quick jump patch skipped', e);
    }
  }

  function renameNavigation() {
    Object.entries(NAV_LABELS).forEach(([id, label]) => {
      qa(`.nav-btn[data-view="${id}"] .txt`).forEach(el => {
        if ((el.textContent || '').trim() !== label) el.textContent = label;
      });
    });
  }

  function removeWorkBoardUI() {
    qa('.nav-btn[data-view="work"]').forEach(el => el.remove());
    const work = q('#work');
    if (work) work.remove();

    qa('.quick-jump-item[data-quick-view="work"]').forEach(el => el.remove());

    if (document.body.dataset.view === 'work') {
      try {
        if (typeof showView === 'function') showView('tasks');
      } catch (_) {}
    }
  }

  function createInvestmentIntakeMenu() {
    if (q('.nav-btn[data-view="investmentIntake"]')) return;

    const investmentBtn = q('.nav-btn[data-view="investment"]');
    const financeBody = investmentBtn?.closest('.group-body');
    if (!financeBody) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-btn';
    btn.dataset.view = 'investmentIntake';
    btn.innerHTML = `
      <span class="ico">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="2"/>
          <circle cx="12" cy="12" r="3"/>
          <path d="M8 5l1.4-2h5.2L16 5"/>
        </svg>
      </span>
      <span class="txt">${NAV_LABELS.investmentIntake}</span>
    `;
    investmentBtn.insertAdjacentElement('afterend', btn);

    let section = q('#investmentIntake');
    if (!section) {
      section = document.createElement('section');
      section.id = 'investmentIntake';
      section.className = 'view';
      section.innerHTML = `
        <div class="card full hani-investment-intake-placeholder-v02971">
          <div class="inner">
            <div class="icon">📸</div>
            <h3>투자 계좌 업데이트</h3>
            <p>계좌 스크린샷으로 보유종목과 평가정보를 업데이트하는 전용 입력창을 준비 중입니다.</p>
            <span class="soon">PHASE 1 · COMING SOON</span>
          </div>
        </div>
      `;
      const footer = q('.main > .footer');
      if (footer?.parentElement) footer.parentElement.insertBefore(section, footer);
      else q('.main')?.appendChild(section);
    }

    btn.addEventListener('click', () => {
      let usedNative = false;
      try {
        if (typeof showView === 'function') {
          showView('investmentIntake');
          usedNative = true;
        }
      } catch (_) {}

      if (!usedNative) {
        qa('.view').forEach(v => v.classList.remove('active'));
        section.classList.add('active');
        qa('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === 'investmentIntake'));
        document.body.dataset.view = 'investmentIntake';
        const title = q('#title'), desc = q('#desc'), kicker = q('#pageKicker');
        if (title) title.textContent = NAV_LABELS.investmentIntake;
        if (desc) desc.textContent = PAGE_DESC.investmentIntake;
        if (kicker) kicker.textContent = 'FINANCE';
        history.replaceState(null, '', '#investmentIntake');
      }

      setTimeout(() => syncCurrentHeader(), 0);
    });
  }

  function simplifyYunaInfoDesk() {
    const root = q('#intake');
    if (!root) return;

    const kicker = q('.intake-hero .intake-kicker', root);
    const heroTitle = q('.intake-hero h3', root);
    const heroText = q('.intake-hero p', root);
    if (kicker) kicker.textContent = 'YUNA INFO DESK';
    if (heroTitle) heroTitle.textContent = '유나의 “맡겨만 주세요”';
    if (heroText) heroText.textContent = '말하거나, 붙여넣거나, 사진으로 보여주세요.';

    const yunaTitle = q('.intake-yuna-copy h3', root);
    const yunaText = q('.intake-yuna-copy p', root);
    if (yunaTitle) yunaTitle.textContent = '유나 · 인포데스크';
    if (yunaText) yunaText.textContent = '“오빠, 일단 주세요! 필요한 게 있으면 제가 짧게 물어볼게요. 🫡”';

    const cardTitle = q('#intakeDeskCard .sh h3', root);
    const cardSub = q('#intakeDeskCard .sh .sub', root);
    const cardPill = q('#intakeDeskCard .sh .pill', root);
    if (cardTitle) cardTitle.textContent = '무엇을 맡길까요?';
    if (cardSub) cardSub.textContent = '유나가 내용을 정리해 담당 AI에게 넘기고 Draft로 준비합니다.';
    if (cardPill) cardPill.textContent = 'YUNA';

    const targetLabel = q('label[for="intakeTarget"]', root) ||
      Array.from(root.querySelectorAll('.field label')).find(el => (el.textContent || '').trim() === '담당 업무');
    if (targetLabel) targetLabel.textContent = '어디에 반영할까요?';

    const materialLabel = Array.from(root.querySelectorAll('.field label'))
      .find(el => (el.textContent || '').includes('스크린샷 / 자료'));
    if (materialLabel) materialLabel.textContent = '사진 · 자료';

    const pasteTitle = q('.intake-paste-copy b', root);
    const pasteDesc = q('.intake-paste-copy span', root);
    if (pasteTitle) pasteTitle.textContent = '붙여넣기 · 드래그 · 파일 선택';
    if (pasteDesc) pasteDesc.textContent = 'Ctrl+V로 바로 붙여넣을 수 있어요.';

    const sourceLabel = Array.from(root.querySelectorAll('.field label'))
      .find(el => (el.textContent || '').includes('오빠가 말하듯 입력'));
    if (sourceLabel) sourceLabel.textContent = '말하듯 입력';
  }

  function setupSidebarTeamCollapse() {
    const box = q('.sidebar-team-mini');
    const head = q('.sidebar-team-head', box || document);
    const faces = q('#sidebarTeamFaces', box || document);
    if (!box || !head || !faces || box.dataset.collapseReady === '1') return;

    box.dataset.collapseReady = '1';
    box.classList.add('hani-team-collapsed-v02971');
    head.setAttribute('role', 'button');
    head.setAttribute('tabindex', '0');
    head.setAttribute('aria-expanded', 'false');
    head.setAttribute('aria-controls', 'sidebarTeamFaces');

    const chev = document.createElement('span');
    chev.className = 'hani-team-chevron-v02971';
    chev.textContent = '▾';
    head.appendChild(chev);

    const toggle = () => {
      const collapsed = box.classList.toggle('hani-team-collapsed-v02971');
      head.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    };

    head.addEventListener('click', toggle);
    head.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  }

  function syncCurrentHeader() {
    const activeId = document.body.dataset.view || q('.view.active')?.id || 'home';
    const label = NAV_LABELS[activeId];
    if (label) {
      const title = q('#title');
      if (title && title.textContent !== label) title.textContent = label;
    }
    if (PAGE_DESC[activeId]) {
      const desc = q('#desc');
      if (desc && desc.textContent !== PAGE_DESC[activeId]) desc.textContent = PAGE_DESC[activeId];
    }
    const alias = BANNER_ALIASES[activeId];
    if (alias) {
      const role = q('#aiRole');
      if (role && role.textContent !== alias) role.textContent = alias;
    }
  }

  function bindNavigationHeaderSync() {
    document.addEventListener('click', e => {
      const btn = e.target.closest?.('[data-view],[data-quick-view],[data-go]');
      if (!btn) return;
      setTimeout(syncCurrentHeader, 0);
    }, true);
    window.addEventListener('hashchange', () => setTimeout(syncCurrentHeader, 0));
  }

  function init() {
    injectStyle();
    updateGlobals();
    renameNavigation();
    removeWorkBoardUI();
    createInvestmentIntakeMenu();
    simplifyYunaInfoDesk();
    setupSidebarTeamCollapse();
    bindNavigationHeaderSync();
    syncCurrentHeader();
    console.info('[HANI OS] v2.9.71 Final UI Cleanup ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
