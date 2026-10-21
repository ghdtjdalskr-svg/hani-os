import assert from 'node:assert/strict';

// Strip exactly the two approved additions, at their original insertion anchors.
export function withoutOfflineEntryUi(html){
  const entries=[
    ['        <button class="login-primary-btn" id="loginGateSubmit" type="button">갓생살기 프로젝트 시작하기</button>\r\n',
      '        <button class="login-text-btn" id="loginGateOffline" type="button" hidden>이 기기 기록으로 열기</button>\r\n'],
    ['', '<div id="offlineEntryBadge" class="offline-entry-badge" role="status" hidden><span>오프라인 · 이 기기 기록 · Cloud 복구 후 로그인</span><button id="offlineEntryLogin" type="button">다시 로그인</button></div>\n',
      '<div class="app login-locked" id="app" aria-hidden="true" inert>\n']
  ];
  for(const [before,added,after=''] of entries){
    assert.equal(html.split(added).length-1,1,'one exact offline UI addition');
    assert.ok(html.includes(before+added+after),'offline UI stays at canonical insertion anchor');
    html=html.replace(added,'');
  }
  for(const id of ['loginGateOffline','offlineEntryBadge','offlineEntryLogin'])assert.doesNotMatch(html,new RegExp('\\bid="'+id+'"'),'no duplicate or altered offline controls');
  return html;
}

export function assertOfflineGateInit(actual,baseline){
  let expected=baseline;
  if(!baseline.includes('loginGateOffline'))expected=expected
    .replace('  if($("loginGateSubmit"))$("loginGateSubmit").onclick=loginGateSubmit;',
      '  if($("loginGateOffline"))$("loginGateOffline").onclick=()=>loginGateEnterApp("offline-local");\n  if($("offlineEntryLogin"))$("offlineEntryLogin").onclick=offlineEntryLogin;\r\n  if($("loginGateSubmit"))$("loginGateSubmit").onclick=loginGateSubmit;')
    .replace('  lockLoginGate("HANI Cloud 연결을 준비하고 있습니다.");',
      '  lockLoginGate("HANI Cloud 연결을 준비하고 있습니다.");\r\n  queueMicrotask(()=>offlineEntryCheck());')
    .replace('event=>{if(event.persisted){const attempt=loginGateAttempt;',
      'event=>{if(event.persisted&&!offlineEntry.active){const attempt=loginGateAttempt;')
    .replace('}})}});\n}', '}})}});\r\n}');
  assert.equal(actual,expected,'initLoginGate allows only exact offline controls/probe/bfcache guard');
}
