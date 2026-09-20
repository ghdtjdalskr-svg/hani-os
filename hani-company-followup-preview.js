// Weekly company/industry follow-up: read-only rendering of Newsroom Archive rows.
(() => {
  'use strict';

  const CHANNELS = [
    { key: 'semiconductor', label: '국내 반도체', note: '삼성전자 · SK하이닉스', marks: [['samsung', 'SAMSUNG'], ['sk', 'SK']] },
    { key: 'lg', label: 'LG전자', note: '가전 · 전장 · AI 제품', marks: [['lg', 'LG']] },
    { key: 'infra', label: 'AI 인프라 & 클라우드', note: '칩 · 데이터센터 · 클라우드', marks: [['nvidia', 'N'], ['amazon', 'a'], ['google', 'G'], ['microsoft', 'M']] },
    { key: 'frontier', label: 'Frontier AI', note: 'OpenAI · Anthropic', marks: [['openai', '◎'], ['anthropic', 'AI']] },
    { key: 'world', label: '주요 국제 정세', note: '정책 · 외교 · 공급망', marks: [['world', '🌐']] },
  ];
  const MOODS = {
    POSITIVE: ['🚀 호재 · 대~풀~롱', '📈 호재 · 탄력 받는 중', '✨ 호재 · 흐름 좋다'],
    NEGATIVE: ['⚠️ 악재 · 돔~황~챠', '📉 악재 · 낙하 주의', '🛡️ 악재 · 방어 모드'],
    MIXED: ['⚖️ 혼재 · 줄다리기 중', '🌦️ 혼재 · 맑음 뒤 흐림', '🎢 혼재 · 롤러코스터'],
    NEUTRAL: ['👀 관망 · 숫자부터 보자', '🔎 관망 · 방향 확인 중', '🧭 관망 · 체크포인트 유지'],
  };
  const PROFILE_FILES = { hani: 'hani', jieun: 'jieun', sua: 'sua', hina: 'hina', nauen: 'naeun', naeun: 'naeun', haru: 'haru', suyeon: 'sooyeon', sooyeon: 'sooyeon', minji: 'minji', yuna: 'yuna' };
  const profile = key => PROFILE_FILES[String(key || '').toLowerCase()] || '';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const arr = value => Array.isArray(value) ? value : [];
  const obj = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const hash = value => { let n = 2166136261; for (const c of value) { n ^= c.codePointAt(0); n = Math.imul(n, 16777619); } return n >>> 0; };
  const mood = (tone, key) => { const pool = MOODS[tone] || MOODS.NEUTRAL; return pool[hash(key) % pool.length]; };
  const safeUrl = value => { try { const u = new URL(String(value)); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; } };
  const dateLabel = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'short', day: 'numeric' }).format(d); };
  function issueMarkup(issue, index, period, readSet, postId) {
    const x = obj(issue), tone = String(x.sentiment || 'NEUTRAL').toUpperCase();
    const comments = arr(x.comments).filter(c => obj(c).comment);
    const title = String(x.title || '').trim();
    if (!title) return '';
    const sources = arr(x.sources).map(s => {
      const url = safeUrl(obj(s).url);
      return url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(obj(s).name || '근거 기사')} ↗</a>` : '';
    }).filter(Boolean).join(' · ');
    const people = comments.slice(0, 2).map(c => {
      const key = profile(c.agent_key);
      return key ? `<img src="./assets/profiles/hani-profile-${key}.webp" alt="${esc(c.agent_name || key)}">` : '';
    }).join('');
    const discussion = comments.map(c => {
      const key = profile(c.agent_key);
      const avatar = key ? `<img src="./assets/profiles/hani-profile-${key}.webp" alt="">` : '';
      return `<article>${avatar}<p><b>${esc(c.agent_name || 'AI TEAM')} · ${esc(c.role || '의견')}</b>${esc(c.comment)}</p></article>`;
    }).join('');
    const isNew = !readSet.has(postId);
    return `<details class="followup-issue" ${index === 0 ? 'open' : ''} data-mood-tone="${esc(tone.toLowerCase())}"><summary><span class="issue-rank">${String(index + 1).padStart(2, '0')}</span><span class="issue-copy"><small data-mood-copy="${esc(mood(tone, period + title))}">${esc(x.topic || '이번 주 변화')} · ${esc(x.importance || '핵심')}</small><b>${esc(title)}</b><em>${esc(x.change || dateLabel(x.event_at) || '이번 주 업데이트')}</em></span><span class="issue-community"><span class="agent-peek">${people}</span><strong>댓글 ${comments.length}</strong><i>${isNew ? '새 업데이트' : '읽음'}</i></span></summary><div class="issue-thread"><div class="issue-brief"><b>이번 주 변화</b><p>${esc(x.summary || '')}</p><span>${x.next_check ? `다음 F/U · ${esc(x.next_check)}` : '다음 확인 사항 대기'}</span>${sources ? `<div class="followup-sources">근거 · ${sources}</div>` : ''}</div><div class="agent-thread">${discussion || '<p>아직 등록된 의견이 없습니다.</p>'}</div></div></details>`;
  }
  function render(posts = [], readSet = new Set(), loading = false, error = '', markRead = null) {
    const root = document.querySelector('.company-followup-preview');
    if (!root) return;
    const archive = arr(posts).filter(p => p?.post_type === 'WEEKLY' && obj(obj(p.payload).company_followup).version === 1);
    const post = archive.sort((a, b) => String(b.published_at || '').localeCompare(String(a.published_at || '')))[0];
    const payload = obj(obj(post?.payload).company_followup);
    const channels = obj(payload.channels);
    const count = CHANNELS.reduce((n, c) => n + arr(channels[c.key]).length, 0);
    const cycle = root.querySelector('.company-followup-cycle');
    const heading = root.querySelector('.company-followup-head .eyebrow');
    if (heading) heading.textContent = 'WEEKLY COMPANY & INDUSTRY F/U';
    if (cycle) cycle.innerHTML = post
      ? `<b>${esc(payload.week_label || dateLabel(post.published_at) || '최근 발행')}</b><span>발행 · ${esc(dateLabel(post.published_at))}</span><em>핵심 이슈 ${count}</em>`
      : `<b>아직 발행 전</b><span>${esc(error || (loading ? '뉴스룸을 불러오는 중' : '확인된 주간 F/U가 없습니다'))}</span><em>핵심 이슈 0</em>`;
    root.querySelectorAll('.company-followup-channels label').forEach(label => {
      const key = label.getAttribute('for')?.replace('followup-', '');
      const badge = label.querySelector('i');
      if (badge) badge.textContent = String(arr(channels[key]).length);
    });
    const panels = root.querySelector('.company-followup-panels');
    if (!panels) return;
    panels.innerHTML = CHANNELS.map((c, i) => {
      const marks = c.marks.map(([name, copy]) => name === 'world' ? `<span class="followup-channel-symbol world">${esc(copy)}</span>` : `<span class="followup-company-mark ${esc(name)}">${esc(copy)}</span>`).join('');
      return `<article class="company-followup-panel panel-${c.key}"><div class="followup-panel-head"><div><span>${String(i + 1).padStart(2, '0')} · ${esc(c.label)}</span><h4>${esc(obj(payload.headlines)[c.key] || c.note)}</h4></div><div class="followup-logo-stack" aria-label="${esc(c.note)}">${marks}</div></div><div class="followup-issue-grid">${arr(channels[c.key]).length ? arr(channels[c.key]).slice(0, 3).map((x, j) => issueMarkup(x, j, post?.period_key || '', readSet, post?.id)).join('') : `<div class="followup-empty">${post ? '이번 주에는 확인된 핵심 변화가 없습니다.' : '첫 주간 F/U 발행을 기다리고 있습니다.'}</div>`}</div></article>`;
    }).join('');
    if (post && !readSet.has(post.id) && typeof markRead === 'function') {
      panels.querySelectorAll('.followup-issue summary').forEach(item => item.addEventListener('click', () => {
        markRead(post.id);
        panels.querySelectorAll('.issue-community i').forEach(badge => { badge.textContent = '읽음'; });
      }, { once: true }));
    }
  }
  window.HANI_COMPANY_FOLLOWUP_RENDER = render;
})();
