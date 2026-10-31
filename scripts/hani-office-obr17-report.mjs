import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const dir='artifacts/office-behavior/',read=f=>{const b=fs.readFileSync(dir+f);return b.toString(b[0]===255&&b[1]===254?'utf16le':'utf8').replace(/^\uFEFF/,'')},json=f=>JSON.parse(read(f));
const hash=b=>createHash('sha256').update(b).digest('hex'),runtimeSha256=hash(fs.readFileSync('hani-office-live.js'));
const counts=s=>Object.fromEntries(['tests','pass','fail','skipped'].map(k=>{const m=s.match(new RegExp('ℹ '+k+' (\\d+)'));assert.ok(m,k);return [k,+m[1]]}));
const rows=read('obr17-regression.log').split(/^FILE /m).slice(1).map(p=>({file:p.split(/\r?\n/)[0],log:'obr17-regression.log',...counts(p)}));
const initialFailures=rows.filter(r=>r.fail).map(r=>({...r}));
Object.assign(rows.find(r=>r.file==='hani-office-tap-lines.test.mjs'),{log:'obr17-tap-lines-final.log',...counts(read('obr17-tap-lines-final.log'))});
assert.equal(rows.length,28);assert.ok(rows.every(r=>r.fail===0));
const total=rows.reduce((a,r)=>{for(const k of ['tests','pass','fail','skipped'])a[k]+=r[k];return a},{tests:0,pass:0,fail:0,skipped:0});
const approval=counts(read('obr17-approved-final.log'));assert.equal(approval.fail,0);assert.equal(approval.pass,14);
const audits=Object.fromEntries(['absent','present'].map(k=>{const a=JSON.parse(read('obr17-audit-'+k+'.log').match(/SUMMARY (\{[^\n]+\})/)[1]);assert.equal(a.snapshots,54000);for(const key of ['frozen','mismatch','stuckSeconds','near30','near24'])assert.equal(a[key],0);return [k,a]}));
const performance=json('obr17-metrics.json');assert.equal(performance.runtimeSha256,runtimeSha256);for(const p of performance.performance){assert.ok(p.best<400);assert.ok(p.maxWarm<3)}
const layout=json('obr17-layout-node.json');for(const row of layout){assert.equal(row.samples,365);assert.ok(row.minimumRatio>=(row.width<=600?.7:.85));assert.deepEqual(row.failures,[]);assert.ok(Object.values(row.counts).every(n=>n===0))}
assert.match(read('obr17-git-add.log'),/index\.lock.*Permission denied/);
const protectedFiles=['index.html','hani-main.js','hani-ui-v02992.js','hani-desk-mascots.js','hani-desk-mascots.css','assets/data/desk-mascots-v1.json','data/hani-building/spatial-contract.json','data/hani-building/art-map-v1.json','data/hani-building/office-places.json','assets/data/office-actions-216.json','assets/data/office-actions-221.json','assets/data/office-tap-lines-v1.json','scripts/fixtures/office-lively-labels-235-plans.json.gz'];
assert.doesNotMatch(fs.readFileSync('hani-office-live.js','utf8'),/localStorage|sessionStorage|supabase|\.setItem\(|\.removeItem\(/);
const result={branch:'hani/office-235-lively-labels',base:'013fd61c3e3dbda3b94f3ca4607e6ff159dfe0b1',originMainCached:'d6a88bc52406d93b92fd16641c4750ba3b35141c',remoteLatest:'연결 실패로 미확인',runtimeSha256,cssSha256:hash(fs.readFileSync('hani-office-live.css')),pendingSha256:hash(fs.readFileSync('scripts/fixtures/office-lively-labels-235.json')),protectedFiles:Object.fromEntries(protectedFiles.map(f=>[f,hash(fs.readFileSync(f))])),initialFailures,files:rows,total,approval,audits,performance,layoutNode:layout,browser:{status:'서윤 실행 대기',executed:false,checks:0,screenshots:0},commit:{status:'미완료',reason:'공유 Git index.lock 생성 Permission denied',stagedFiles:0,head:'013fd61'},pushPrNotion:false};
fs.writeFileSync(dir+'obr17-results.json',JSON.stringify(result,null,2)+'\n');
const layoutRows=layout.map(p=>`|${p.width}px|${p.samples}|${(p.minimumRatio*100).toFixed(1)}%|${p.meanMs.toFixed(3)}|${p.maxMs.toFixed(3)}|`).join('\n');
const perfRows=performance.performance.map(p=>`|${p.chairmanPresent?'있음':'없음'}|${p.cold.map(v=>v.toFixed(3)).join(' / ')}|${p.best.toFixed(3)}|${p.maxWarm.toFixed(3)}|PASS|`).join('\n');
fs.writeFileSync(dir+'report-obr17.md',`# obr17 — 말풍선 가림·휴대폰 밀도 보완

2026-10-30 KST · 도연/Codex 단독 · branch \`${result.branch}\` · base \`${result.base}\`.

기존 JS/CSS 수정과 Node 검증 완료. **브라우저 검사는 요청대로 작성만 했으며 서윤 실행 대기다. 실화면·실제 390/1440 수치·PNG·실제 DOM 비용은 미검증이다. 로컬 커밋은 공유 Git index.lock 권한 거부로 미완료다.** push·PR·Notion·main/배포 없음.

## 레이어와 배치

- 원인: actor의 inline z-index4와 atlas pivot transform이 각각 stacking context를 만들었다. 자식 이름표12/상태13도 다른 actor보다 위로 나올 수 없었다. 기존 배치 계산도 다른 스프라이트와 자기 얼굴을 장애물로 보지 않았다.
- actor에서 z-index와 transform을 제거했다. 같은 atlas cell/pivot 비율을 CSS margin-left/top과 \`--actor-pivot-x/y\`로 적용한다. 발 좌표, 크기, pose, idle transform·partner 회전은 보존한다. 기존 actor/name/status의 DOM 부모와 슬롯은 그대로이며 생성·삭제·재부착이 없다. 앞선 공통 라벨 레이어 검토는 DOM을 옮기지 않는 공통 stacking 방식으로 구현했다.
- 순서: 배경0 → 책상 소품2 → 방 이름표/마스코트3 → sprite/투명 hit 영역/actor 소품4 → 이름표5 → 상태6 → 전경8 → 탭 character bubble10. 마스코트 owner·CSS·자산 변경0. 기존 props z<4 기준 유지.
- 모든 보이는 sprite의 실제 bounding box를 먼저 예약한다. partner 회전은 실측 box에 포함되고 기존 idle 움직임은 max(2px, 높이2%) 여유를 더한다. 자기 sprite 전체도 예약하므로 자기 얼굴 상단65%를 가리지 않는다. hidden actor의 box는 예약하지 않는다.
- 머리 위 후보를 우선하고, 아래·옆 후보에는 거리와 머리 아래 면적 감점을 준다. 이름표와 상태는 한 묶음이며 기본은 상하, 낮은 틈에서는 나란히 붙인다. 지도 전체 모서리로 무제한 이동하던 fallback은 제거했다. 휴대폰에서 묶음 중심의 가로 이동은 최대96px(또는 actor 너비1.5배 중 큰 값), 세로 가장자리 이격은 높이2배(최소64px)다. 이 안의 빈자리도 없으면 묶음을 숨긴다. 별도 검사에서 근처를 전부 막고 먼 빈자리가 있어도 숨김을 확인했다.
- 대화·보고·도착 인사·현재 발화 → 이동/외출/회의 → 평소 근무 우선순위를 유지한다. 대화 쌍을 보존하고 기존 70%/85%·라벨 겹침0·지도 밖0 기준을 유지한다. 일반 배치는 근거리 greedy 후보를 쓰고 기준 미달 또는 대화 누락 때만 최대32개 상태의 제한 탐색으로 같은 후보를 재배치한다.
- 지도600px 이하: 상태 10px, line-height1.1, padding0 2px → 높이13px. 이름표 10px, line-height1.1, padding0 2px·border0 → 높이11px. 기존 17px/16.5px 부근에서 축소했다. 내부 간격0, 다른 묶음·sprite와 간격2px 유지. 의미 있는 최대8자 문구·전체 title/접근성/roster/탭 원문 보존.

## 검증

- 전체 office/building **28파일: ${total.pass} PASS / ${total.fail} FAIL / ${total.skipped} SKIP / ${total.tests} executions**. 공통 engine import 중복 포함. SKIP은 기존 browser 미실행이며 실화면 PASS가 아니다. [전체 로그](obr17-regression.log), [identity·파일별 결과](obr17-results.json).
- 최초 sweep의 tap-lines 1건은 DOM double에 새로 읽는 sprite rectangle API가 없어 실패했다. 모든 visible sprite에 기존 actor rectangle을 공급했고, 기존 390/1440 탭 말풍선 bounds assertion을 보존한 채 해당 파일 전체15 PASS를 다시 확인했다. 위 합계는 [tap 최종 결과](obr17-tap-lines-final.log)를 결합한 최종 파일별 합산이며 단일 sweep 전부 PASS라는 뜻은 아니다. runtime 변경은 없다.
- obr17 신규3개: 실제 atlas 비율을 반영한 synthetic sweep, stacking/원본 pivot 비율/폰 글자 크기, 근처 막힘 시 먼 빈자리 대신 숨김. 기존 obr16의 실제 owner fixture는 슬롯 identity·발 좌표·timer2개를 유지한다.
- atlas actor 높이 max(40px,6.8cqw), 48/64 비율·61/64 pivot, synthetic 폰11/13px 및 desktop name/status 치수, partner 회전 envelope, 원본 mascot offset/크기를 사용했다. 09–19시 10분 간격61개 + 보고 시작/끝12개 × 5층 × 3너비 = **1,095회**. 대화 누락·다른 sprite·자기 얼굴·라벨·마스코트 겹침·지도 밖·근거리 위반 전부0. 실제 pixel 결과로 대체하지 않는다.

|지도 너비(뷰포트 아님)|표본|최소 보임 비율(synthetic)|순수 계산 평균 ms|최대 ms|
|---|---|---|---|---|
${layoutRows}

- 위 비용은 Node 순수 solver이며 DOM reset/read/commit은 제외한다. 실제 browser layout1회 및 frame 비용은 서윤 실행 대기다. 기준 미달 탐색이 드물게 비싸지는 비용을 숨기지 않는다.
- 승인 baseline **14 PASS**. \`node scripts/hani-office-obr17-freeze.mjs\`는 obr16과 같은 검증 방식으로 235 pending의 정확한 after·설명만 갱신한다. fixed234 before·과거 chain·부정검사·immutable obr14 plan/snapshot oracle 보존. [로그](obr17-approved-final.log).
- 기존 HD224/office219의 actor transform 원문 기대는 승인된 margin 변환 한 줄만 반영했다. 나머지 pose 함수 전체와 actor CSS 전체를 여전히 정확 비교하며 v2/v3 normalized x=-0.5, y=-0.953125를 직접 검사한다. 기준 삭제/완화가 아니다. obr16 synthetic fixture는 새 sprite 예약과 11/13px 치수·상하/인라인 인접 구조를 반영했고 ratio와 보고 두 줄·8명 보임 assertion은 유지했다.
- 감사 있음/없음 각각 **54,000 snapshot**, frozen/mismatch/stuckSeconds/near30/near24 전부0. 원본 감사·20/24/32px·capacity·체류·예약 기준 변경0. [없음](obr17-audit-absent.log), [있음](obr17-audit-present.log).
- 초기 배치 실패와 개발 중 로그는 보존했다. sprite 예약 + 근거리 제약을 추가한 뒤 좁은 300px 일부가 기준 미달이었으며 인라인 후보·제한 탐색·근거리 한계 내 빈자리 활용을 보완했다. 최초 전체 targeted의 인공 동일 열 fixture는 보완 후8개가 보여 중간 기대7과 불일치했고 최종8개 assertion으로 원래 기준을 유지했다. 새 최종 runtime 뒤 전체 회귀 결과만 위에 합산했다.
- Syntax·diff --check PASS. base 대비 index/표시·cache/HANI_DISPLAY_VERSION/마스코트/data/seed/oracle diff0. runtime Storage/Supabase 경로0, 기존 fixture write/network trap0. 실제 Cloud는 미실행이며 서버/Edge/schema/migration/seed 동반 배포 없음.

Node ${performance.node}, 다른 회귀·감사가 끝난 뒤 presence별 독립 새 프로세스3회. cold는 첫 formal+outing 계획, warm은 각1,000 snapshot 평균이다.

|회장님|cold 3회(ms)|best(ms)|max warm(ms)|판정|
|---|---|---|---|---|
${perfRows}

기존 best-of-3<400ms·warm<3ms 유지. [성능 원표](obr17-metrics.json). 실제 휴대폰 frame 성능을 뜻하지 않는다.

## 서윤 실행 명령

브라우저는 여기서 실행하지 않았다. 기존 준비 헬퍼 \`scripts/hani-office-label-browser-ready.mjs\`를 사용하며 emoji 접두 허용·stale partner 정리를 보존한다. 저장소 루트 PowerShell:

\`\`\`powershell
$env:HANI_OFFICE_BROWSER_TAG='obr17-labels'
node scripts/hani-office-obr14.browser.mjs
$env:HANI_OFFICE_BROWSER_TAG='obr17-dialogue'
node scripts/hani-office-obr15.browser.mjs
\`\`\`

- 필요하면 각 명령 뒤에 \`<playwright/index.mjs> <msedge.exe>\`를 지정한다.
- obr14: 390/884/1440 × light/dark × 09:15/12:10/15:40 × 5층. 기존 ratio/라벨/마스코트/경계·무쓰기·30회 layout/23sprite frame·reduced/pause 유지. 새 다른 sprite/자기 얼굴 겹침0, computed stacking 순서, 폰 이름/상태 모두 최소10px 검사. 결과 \`obr17-labels-browser.json\`, PNG \`obr14-shots/\`30장 예정.
- obr15: 390/1440 × light/dark 도착/보고. 대화 두 줄·facing·presence·슬롯/무쓰기 유지, 보고 화면의 sprite/자기 얼굴 겹침0와 name/status node identity도 검사. 결과 \`obr17-dialogue-browser.json\`, PNG \`obr15-shots/\`8장 예정.
- 이번 새 검사의 실행 수0, 생성 PNG0. 실제 index/실제 시계·Android·아린 재리뷰도 미검증. 기존 PNG를 이번 PASS로 재사용하지 않는다.

\`\`\`powershell
$env:NODE_OPTIONS='--require ./scripts/hani-office-234-git-preload.cjs'
# historical export가 없는 환경에서만:
powershell -NoProfile -File scripts/hani-office-234-export-git.ps1
powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1
node --test --test-isolation=none scripts/hani-reviewed-release-baseline.test.mjs
node docs/drafts/office-behavior-redesign/audit.mjs .
node docs/drafts/office-behavior-redesign/audit.mjs . --chairman
powershell -NoProfile -File scripts/hani-office-obr17-metrics.ps1
\`\`\`

## 인계와 경계

- Risk NORMAL 기능 개발. 표시/cache2.9.234·index 마지막JS \`hani-launch-greeting.js\` 유지. 원격 main 조회는 연결 실패로 최신성 미확인, origin/main 캐시 \`${result.originMainCached}\`. merge/rebase 없음.
- 로컬 commit blocker: \`git add -- hani-office-live.js\`가 \`HANI_OS_DEV/.git/worktrees/o235/index.lock: Permission denied\`로 거부됐다. staged0·HEAD013fd61 유지, commit 미실행. 권한 변경/대체 index/우회 없음. [오류](obr17-git-add.log).
- 버전 증가·Candidate/package/One-Pass/HINA·Preview 승인·main/Pages/Production은 이번 범위 밖 N/A·미실행. push/PR/Notion은 명시적 금지로 미실행. 기존 타 작업 untracked 보존. CURRENT/DECISIONS는 변경하지 않았다.
- Runtime SHA256: \`${runtimeSha256}\`. [한국어 -o](obr17-o.txt), [인수인계](../../docs/development-history/handoffs/2026-10-30-office-obr17.md).
`);
fs.writeFileSync(dir+'obr17-o.txt',`성민 대표님, obr17 구현과 Node 검증을 완료했습니다.\n배경0 → 소품2 → 방/마스코트3 → sprite4 → 이름5 → 상태6 → 전경8 → 탭 말풍선10입니다. actor context를 없애고 같은 atlas pivot을 margin으로 보존했습니다. DOM 슬롯은 그대로입니다.\n폰 글자10px 유지, 이름11px/상태13px 높이로 축소했습니다. 머리 위·근거리 배치, 다른 sprite와 자기 얼굴 회피, 막히면 낮은 우선순위 숨김을 적용했습니다.\nNode 28파일 ${total.pass} PASS/${total.fail} FAIL/${total.skipped} SKIP. 승인 baseline14 PASS. 감사 있음/없음 각각54,000 snapshot·이상0. 성능 cold<400/warm<3 PASS.\nSynthetic 최소 보임: ${layout.map(r=>r.width+'px '+(r.minimumRatio*100).toFixed(1)+'%').join(', ')}; 충돌/경계/대화 누락0. 실제 화면 수치가 아닙니다.\n브라우저는 요청대로 작성만 했으며 서윤 실행 대기입니다. 명령과 자세한 수치는 report-obr17.md에 있습니다.\n로컬 커밋은 공유 Git index.lock Permission denied로 미완료, staged0·HEAD013fd61입니다. push/PR/Notion/main/배포 없음.\n`);
console.log(JSON.stringify({total,approval,audits,performance:performance.performance,layout:layout.map(({width,minimumRatio,meanMs,maxMs})=>({width,minimumRatio,meanMs,maxMs})),commit:result.commit}));
