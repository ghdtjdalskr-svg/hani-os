import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const dir='artifacts/office-behavior/',read=f=>{const b=fs.readFileSync(dir+f);return b.toString(b[0]===255&&b[1]===254?'utf16le':'utf8').replace(/^\uFEFF/,'')},json=f=>JSON.parse(read(f));
const hash=b=>createHash('sha256').update(b).digest('hex'),runtimeSha256=hash(fs.readFileSync('hani-office-live.js'));
const counts=s=>Object.fromEntries(['tests','pass','fail','skipped'].map(k=>{const m=s.match(new RegExp('ℹ '+k+' (\\d+)'));assert.ok(m,k);return [k,+m[1]]}));
const rows=read('obr18-regression.log').split(/^FILE /m).slice(1).map(p=>({file:p.split(/\r?\n/)[0],log:'obr18-regression.log',...counts(p)}));
const initialFailures=rows.filter(r=>r.fail).map(r=>({...r}));
for(const [file,log] of [['hani-office-219.test.mjs','obr18-219-final.log'],['hani-building-206-safety.test.mjs','obr18-safety-final.log'],['hani-office-obr18.test.mjs','obr18-targeted-final.log']])Object.assign(rows.find(r=>r.file===file),{log,...counts(read(log))});
assert.equal(rows.length,29);assert.ok(rows.every(r=>r.fail===0));
const total=rows.reduce((a,r)=>{for(const k of ['tests','pass','fail','skipped'])a[k]+=r[k];return a},{tests:0,pass:0,fail:0,skipped:0});
const approval=counts(read('obr18-approved-final.log'));assert.equal(approval.fail,0);assert.equal(approval.pass,14);
const audits=Object.fromEntries(['absent','present'].map(k=>{const a=JSON.parse(read('obr18-audit-'+k+'.log').match(/SUMMARY (\{[^\n]+\})/)[1]);assert.equal(a.snapshots,54000);for(const key of ['frozen','mismatch','stuckSeconds','near30','near24'])assert.equal(a[key],0);return [k,a]}));
const perf=json('obr18-metrics.json');assert.equal(perf.runtimeSha256,runtimeSha256);for(const p of perf.performance){assert.ok(p.best<400);assert.ok(p.maxWarm<3)}
const layout=json('obr18-layout-node.json'),target=layout.find(r=>r.width===342),narrow=layout.find(r=>r.width===300),desktop=layout.find(r=>r.width===1348);
for(const row of [target,desktop]){assert.ok(row.minimumRatio>=(row.width===342?.7:.85));assert.deepEqual(row.failures,[]);assert.deepEqual(row.missingDots,[]);assert.ok(Object.values(row.counts).every(n=>n===0))}
const remainingSprites=target.spritePairs.filter(p=>p.floor==='1f'),pairs=[...new Set(remainingSprites.map(p=>p.ids.join('/')))];
assert.match(read('obr18-git-add.log'),/index\.lock.*Permission denied/);
const protectedFiles=['index.html','hani-main.js','hani-ui-v02992.js','hani-desk-mascots.js','hani-desk-mascots.css','assets/data/desk-mascots-v1.json','data/hani-building/spatial-contract.json','data/hani-building/art-map-v1.json','data/hani-building/office-places.json','assets/data/office-actions-216.json','assets/data/office-actions-221.json','assets/data/office-tap-lines-v1.json','scripts/fixtures/office-lively-labels-235-plans.json.gz'];
const protectedIdentity=json('obr18-protected.json');assert.equal(protectedIdentity.base,'674ac83a042e27ee1bdf7ecd2434422f03bf5429');
const protectedHashes=Object.fromEntries(protectedFiles.map(f=>{const bytes=fs.readFileSync(f),row=protectedIdentity.files.find(r=>r.file===f),object=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');assert.equal(object,row.baseObject,f);assert.equal(object,row.currentObject,f);return [f,hash(bytes)]}));
assert.doesNotMatch(fs.readFileSync('hani-office-live.js','utf8'),/localStorage|sessionStorage|supabase|\.setItem\(|\.removeItem\(/);
const result={branch:'hani/office-235-lively-labels',base:'674ac83a042e27ee1bdf7ecd2434422f03bf5429',originMainCached:'d6a88bc52406d93b92fd16641c4750ba3b35141c',remoteLatest:'접속 실패로 미확인',runtimeSha256,cssSha256:hash(fs.readFileSync('hani-office-live.css')),pendingSha256:hash(fs.readFileSync('scripts/fixtures/office-lively-labels-235.json')),protectedFiles:protectedHashes,initialFailures,files:rows,total,approval,audits,performance:perf,layoutNode:layout,remainingSprites:{metrics:'synthetic atlas boxes, browser unverified',pairs,samples:remainingSprites},browser:{status:'서윤 실행 대기',executed:false,checks:0,screenshots:0},commit:{status:'미완료',reason:'공유 Git index.lock Permission denied',stagedFiles:0,head:'674ac83'},pushPrNotion:false};
fs.writeFileSync(dir+'obr18-results.json',JSON.stringify(result,null,2)+'\n');
const table=layout.map(r=>`|${r.width}px|${r.samples}|${(r.minimumRatio*100).toFixed(1)}%|${r.counts.dialogue}|${r.meanMs.toFixed(3)} / ${r.maxMs.toFixed(3)}|${r.width===300?'추가 진단: 기준 미달':'요청 대상 모형 PASS'}|`).join('\n');
const perfTable=perf.performance.map(p=>`|${p.chairmanPresent?'있음':'없음'}|${p.cold.map(n=>n.toFixed(3)).join(' / ')}|${p.best.toFixed(3)}|${p.maxWarm.toFixed(3)}|PASS|`).join('\n');
fs.writeFileSync(dir+'report-obr18.md',`# obr18 — 휴대폰 알약 라벨·머리 기준 28px

2026-10-30 KST · 도연/Codex 단독 · branch \`${result.branch}\` · base \`${result.base}\`.

**구현·Node 검증 완료, 서윤 browser 실행과 아린 화면 검토 대기. 로컬 commit은 Git index.lock 권한 거부로 미완료.** 실제 390 화면 PASS로 보고하지 않는다. push/PR/Notion/main/배포 시도0.

## 변경과 소유 경로

- CODEMAP living-office JS/CSS owner 확인. 최신 라벨 anchor는 미등록(CODEMAP_MISS)이라 실제 \`fitStatusLabels → labels.place → 기존 name/status offset commit\`을 확인했다. 새 renderer/event/runtime 파일 없음.
- 기존 persistent name 안에 compact span 1개를 최초 mount하고 viewport≤600px에서만 내용과 노출을 적용한다. 상태 점+이름+·+짧은 행동이 한 알약이다. 별도 status는 hidden이지만 dataset.full·원문·roster·tap 원문은 보존한다. 예: 지은·커피, 히나·검증. 평소 행동은 2자 동작, 보고는 주제+보고, 회장 응답은 좋아요, 도착 인사는 인사. 줄임표/문자 절단 없음. 1440은 기존 이름/전체 status 두 슬롯과 배치 경로를 유지한다.
- 폰 알약 글자10px·line-height1·padding0 2px·pill radius999px. 점은5×5px. 낮은 우선순위가 알약 공간을 못 얻으면 같은 name 슬롯의 점만 남긴다. 이름/원문 title·aria·기존 roster가 유지된다. 점은 보임 비율에서 제외한다.
- 머리는 실제 sprite bounding box 상단 중앙, 거리는 알약/점 중심까지의 유클리드 거리다. 후보 반경27.5px로 28px 기준에0.5px 여유를 둔다. 폰은 이 반경 밖으로 밀지 않는다. 지도 전체 fallback 없음. 모든 sprite·자기 얼굴·마스코트를 예약하고 알약 배치 후 점을 놓는다. 폰 배치 간격0.5px와 sprite idle 여유1px, desktop 간격/여유2px 유지. 겹침0·70%/85%·28px 검사 기준은 변경하지 않았다.
- 대화/도착 인사/현재 발화를 최우선 보존한 다음 전체 알약 보임 수, 이동 등 우선순위, 가까운 위치 순으로 비교한다. 9개 배치 순서와 필요 시64개 상태의 제한 탐색을 쓴다. 일반 desktop은 기존32개 탐색·우선순위 그대로다.
- 알약/점에 pointer-events:auto만 적용해 기존 actorLayer 단일 click handler로 전체 말풍선을 연다. 새 handler 없음. actor/name/status 부모와 node identity·timer2개 유지.

## 스프라이트 결과와 남은 범위

- 폰 actor atlas 높이를 **기존 최소40px에서20px**로 축소했다. 단순 소폭 축소보다 큰 변경이다. 28px 반경에서 밀집 라벨과 보고 두 줄을 확보하기 위한 현재 선택이며 실제 시인성은 서윤/아린 확인이 필요하다. 투명 hit 영역40×40·동일 atlas 비율/pivot·logical 좌표·AT_PLACE2px·예약/체류/거리 기준 보존. z 순서 변경 없음, mascot 수정0.
- 342px 모형의 4F 회장님 포함 sprite 겹침0. 1F 라운지에서는20px 축소 후에도 \`${pairs.join('`, `')}\` atlas box 겹침이 남는다(\`taeo\`=채원, \`visitor[-2]\`=방문객 슬롯). 좌표·데이터를 바꾸지 않았다. 실제 불투명 픽셀 겹침은 browser 미검증이다. 상세 시각은 results.json의 remainingSprites.samples에 보존했다. 이 구간을 해결 완료로 보고하지 않는다.

## 검증과 한계

- office/building29파일 최종 파일별 합산: **${total.pass} PASS / ${total.fail} FAIL / ${total.skipped} SKIP / ${total.tests} executions**(공통 engine import 중복 포함). 최초 sweep의219는 새20px CSS를 이전 actor-rule 배열이 거부했다. 기존 전체 원문/pivot 비교는 유지하고 승인된 phone20px 한 규칙만 정확 기대값에 추가했다. 최종219 전부6 PASS로 대체, safety·obr18도 최종 로그로 결합했다. 단일 sweep 전체 PASS라는 뜻은 아니다. [전체](obr18-regression.log), [파일별 결과/identity](obr18-results.json).
- obr18 전용6 + import owner6 =12 PASS: snapshot sweep, full pill과 점 분리 계산, 점 충돌/거리/누락, 우선순위, 실제 owner synthetic DOM의 합친 슬롯·원문·발 좌표·node/timer 보존, UI 문구·Storage/Cloud 금지. [최종](obr18-targeted-final.log).
- synthetic 61시점+보고 시작/끝12시점 ×5층 ×3너비=1,095회. 실제 atlas 비율·회전 크기·대략 글자 폭과 원본 mascot을 사용한 Node 모형이다. 실제 폰트/animation/DOM 화면 증거가 아니다. **390 fixture 지도342px 최소${(target.minimumRatio*100).toFixed(1)}%, 거리 초과/label-label/label-sprite/mascot/경계/대화 누락/점 누락0. 1440 fixture 지도1348px100%.**

|지도 폭|표본|알약 보임 최소|대화 누락|solver 평균/최대 ms|범위|
|---|---|---|---|---|---|
${table}

- 추가 진단300px는 최소${(narrow.minimumRatio*100).toFixed(1)}%, 기준 미달${narrow.failures.length}장면·대화 누락${narrow.counts.dialogue}. 점 누락0·거리/라벨 겹침0은 유지한다. 390 목표 PASS로 섞지 않았다. 새 검사에서 요청 대상342/1348을 강제하고300은 미달 근거를 보존한다. 기존 obr16/17의300px legacy 두 슬롯 solver 검사와 기준은 그대로 실행했다. 더 좁은 실제 기기에서 동일 보임 비율을 보장하지 않는다.
- 235 pending은 exact after/설명만 갱신. fixed234 before·과거 chain·immutable235 plan/snapshot oracle 불변. 승인 baseline14 PASS. [로그](obr18-approved-final.log).
- 원본 감사 있음/없음 각각54,000 snapshot. frozen/mismatch/stuckSeconds/near30/near24 전부0. [없음](obr18-audit-absent.log), [있음](obr18-audit-present.log). Model 감사0과 위 화면 sprite box 겹침은 서로 다른 지표다.
- syntax·diff --check PASS. base674ac83 대비 index·표시/cache/HANI_DISPLAY_VERSION·main/UI version owner·마스코트·data/·seed·immutable oracle diff0. Storage/Supabase 경로0·기존 write/network trap0. 서버/Edge Function/schema/migration 동반 작업 없음.

Node ${perf.node}, 다른 회귀·감사 종료 후 presence별 새 프로세스3회. 기존 best-of-3<400ms·warm<3ms 유지. 순수 solver 비용은 DOM 제외이며 browser layout/frame 비용은 미검증이다.

|회장님|cold3회 ms|best ms|warm 최대 ms|판정|
|---|---|---|---|---|
${perfTable}

## 서윤 browser 인계

브라우저 검사는 작성만 했고 실행0·신규PNG0이다. 기존 PNG를 이번 결과로 재사용하지 않았다. 실제390≥70%·28px100%·겹침0·대화 두 줄, 1440 기존100%, 실제 확대 hit·탭·idle/reduced/pause·frame/DOM 비용·Android·아린 재검토는 미검증이다.

\`\`\`powershell
$env:HANI_OFFICE_BROWSER_TAG='obr18-labels'
node scripts/hani-office-obr14.browser.mjs
$env:HANI_OFFICE_BROWSER_TAG='obr18-dialogue'
node scripts/hani-office-obr15.browser.mjs
\`\`\`

필요하면 각 명령 뒤 Playwright index.mjs와 msedge.exe 경로를 지정한다. 기존14의90장면/30PNG·15의4조건/8PNG와 원문/무쓰기·persistent/기존 facing 검사는 보존한다. shared test helper가 full pill≥70%(점 제외), actor별 name 하나/status 숨김·상태 점·전체 원문 title·폰10px·28px·라벨/자기포함sprite/mascot/경계0·대화/인사 pill을 검사한다. 14는 실제 알약 click도 확인한다. 15는 arrival/report 모두 새 측정과 회장/보고자 sprite0 검사. 화면 PNG와 JSON은 기존 증거를 덮지 않도록 tag별 폴더/파일에 저장한다. 1F spritePairs는 JSON에 남겨 위 미해결 구간의 실제 화면을 판정한다.

## 작업 경계

- 원격 main 접속 실패, origin/main 캐시 d6a88bc. 최신성·운영 화면/최신 JS 로딩 미확인. 로컬 index 표시는2.9.234·마지막 JS hani-launch-greeting.js. merge/rebase 없음.
- Git add는 HANI_OS_DEV/.git/worktrees/o235/index.lock Permission denied. staged0·HEAD674ac83, 로컬 commit 미완료. 권한 변경/우회 없음. [로그](obr18-git-add.log).
- push/PR/Notion은 명시적 금지로 시도0. CURRENT/DECISIONS 변경0. Candidate/build/One-Pass/HINA/main/Pages/Production은 범위 밖 N/A·미실행.
`);
fs.writeFileSync(dir+'obr18-o.txt',`성민 대표님, obr18 표시 패치와 Node 검증을 마쳤습니다.\n휴대폰 이름·행동·상태 점을 기존 알약 슬롯 하나로 합치고 머리 반경28px(후보27.5) 안에 배치합니다. 막히면 점만 남기고 점은 보임 비율에서 제외합니다.\nNode: ${total.pass} PASS / ${total.fail} FAIL / ${total.skipped} SKIP, 승인 baseline14 PASS, 감사 두 종류 각각54,000 snapshot 전부0, 성능 기존 기준 PASS.\n390 fixture와 같은 지도342px 모형 최소${(target.minimumRatio*100).toFixed(1)}%·거리/라벨 충돌/대화/점 누락0, desktop 모형100%. 실제 화면 PASS는 아닙니다.\n한계: phone sprite는40→20px로 커다란 축소라 실화면 시인성 확인 필요. 1F ${pairs.join(', ')} sprite box 겹침 잔존. 추가300px 진단 ${Math.round(narrow.minimumRatio*100)}%·대화 누락${narrow.counts.dialogue}로 미달.\n브라우저14/15 검사 작성만, 실행·신규PNG0. 서윤 실행 및 아린 검토 대기.\nGit index.lock 권한 거부로 staged0·HEAD674ac83·로컬 commit 미완료. push/PR/Notion/버전/index/data/Storage/Cloud/main/배포 변경 없음.\n보고: artifacts/office-behavior/report-obr18.md\n`);
console.log(JSON.stringify({total,approval,audits,performance:perf.performance,layout:layout.map(r=>({width:r.width,minimumRatio:r.minimumRatio,meanMs:r.meanMs,maxMs:r.maxMs,missingDots:r.missingDots.length})),remainingSprites:pairs,commit:result.commit}));
