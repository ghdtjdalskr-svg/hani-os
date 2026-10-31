import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const dir='artifacts/office-behavior/',base='2cd24abb6360f6509d005b975eb0513ad6b1a03e';
const read=p=>{const b=fs.readFileSync(p);return (b[0]===255&&b[1]===254?b.subarray(2).toString('utf16le'):b.toString('utf8')).replace(/^\uFEFF/,'')};
const json=p=>JSON.parse(read(p)),hash=b=>createHash('sha256').update(b).digest('hex');
const runtime=fs.readFileSync('hani-office-live.js'),runtimeSha256=hash(runtime);
const verification=json(dir+'obr21-verification.json'),performance=json(dir+'obr21-metrics.json');
for(const evidence of [verification,performance])assert.equal(evidence.runtimeSha256,runtimeSha256);
const fixtureBytes=gunzipSync(fs.readFileSync('scripts/fixtures/office-obr21-plans.json.gz')),frozen=JSON.parse(fixtureBytes);
assert.equal(frozen.sourceSha256,runtimeSha256);
const counts=s=>Object.fromEntries(['tests','pass','fail','skipped'].map(k=>[k,Number(s.match(new RegExp('(?:ℹ|#) '+k+' (\\d+)'))?.[1]||0)]));
const executions=json(dir+'obr21-suite/results.json'),expected=fs.readdirSync('scripts').filter(f=>/^hani-(office|building)-.*\.test\.mjs$/.test(f));
assert.equal(executions.length,expected.length);
const files=executions.map(r=>{assert.equal(r.runtimeSha256,runtimeSha256);return {...r,...counts(read(r.log))}});
const total=files.reduce((a,r)=>{for(const k of ['tests','pass','fail','skipped'])a[k]+=r[k];return a},{tests:0,pass:0,fail:0,skipped:0});
const approved=counts(read(dir+'obr21-approved.log'));assert.equal(approved.pass,14);assert.equal(approved.fail,0);
const audits=Object.fromEntries(['absent','present'].map(k=>{const a=JSON.parse(read(dir+'obr21-audit-'+k+'.log').match(/SUMMARY (\{[^\n]+\})/)[1]);assert.equal(a.snapshots,54000);for(const key of ['frozen','mismatch','stuckSeconds','near30','near24'])assert.equal(a[key],0);return [k,a]}));
const geometry=json(dir+'obr21-stationary.json'),layout=json(dir+'obr21-layout-node.json');
const activity=[...read(dir+'obr21-suite/hani-office-obr14.test.mjs.log').matchAll(/235 daytime \{\s*day: '([^']+)',\s*activeRatio: ([\d.]+),\s*peopleMean: ([\d.]+)/g)].map(m=>({day:m[1],activeRatio:+m[2],peopleMean:+m[3]}));
assert.equal(activity.length,3);assert.ok(activity.every(r=>r.activeRatio>=.7&&r.peopleMean>=3));
const protectedFiles=read(dir+'obr21-protected-tree.txt').trim().split(/\r?\n/).map(line=>{const m=line.match(/^\d+ blob ([0-9a-f]+)\t(.+)$/);assert.ok(m,line);const b=fs.readFileSync(m[2]),actual=createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');assert.equal(actual,m[1],m[2]);return {file:m[2],gitObject:actual}});
assert.doesNotMatch(runtime.toString(),/localStorage|sessionStorage|supabase|\.setItem\(|\.removeItem\(/);
const failures=files.filter(f=>f.exit!==0),perfPass=performance.performance.every(r=>r.best<400&&r.maxWarm<3);
const status=failures.length||!perfPass||verification.results.some(r=>r.exit!==0)?'필수 검증 실패 있음':'Node 필수 검증 통과 / 실제 브라우저 대기';
const commit=fs.existsSync(dir+'obr21-commit.json')?json(dir+'obr21-commit.json'):{created:false,status:'로컬 커밋 대상 준비; 생성 결과는 최종 Git 기록으로 확인'};
const result={base,branch:'hani/office-235-lively-labels',runtimeSha256,fixtureSha256:hash(fixtureBytes),status,total,files,approved,audits,activity,geometry,layout,performance,perfPass,verification,protectedFiles,commit,browser:{executed:false,screenshots:0,owner:'서윤'},pushPrNotion:false};
fs.writeFileSync(dir+'obr21-results.json',JSON.stringify(result,null,2)+'\n');
const pct=n=>(n*100).toFixed(2)+'%';
const report=`# obr21 — 새 동작만 화면 예약 / 성능·회귀 마무리

2026-10-30 KST · 도연/Codex 단독 · branch \`hani/office-235-lively-labels\` · base \`${base}\` + obr20 미커밋 변경.

**${status}.** ${commit.status}. push·PR·Notion·main·배포 실행0. 브라우저 실제 실행0·PNG0이며 Node 모형을 실화면 PASS로 표시하지 않았다.

## 변경과 소유 경로

- \`plan → reserve\` 정식 216/221 카탈로그에는 원래 art-space 근접·경로·capacity 검사를 그대로 적용한다. \`card\`가 있는 \`blockPlan → excursion → reserve\` 새 외출·업무 용무·동행·모임·방문객·보고에만 추가 예약 검사를 적용한다. 정식 장면이 포함된 쌍은 추가 예약 화면 검사에서 제외한다. 새 짝 대화는 기존 생성 경로에서 현재 정지 스프라이트의 화면 여유도 확인한다. 인사는 기존 자리 표현 경로를 유지한다. 새 runtime 파일·event·renderer layer 없음.
- 기존 회장실 입구 \`door_ceo\` 보고 접근점 유지: 회장님과 약353.08 art px. 보고 시작/끝·왕복·20–60초·하루4–8건·마주 보기와 phone box 검사 유지. 고정 home끼리 화면 겹침 예외 유지. 수아/태오 home은 발24.282px·원래30px 폭 기준 약5.718px 겹치는 그림 문제로 보고만 했다.
- 기존40px 스프라이트·342px 지도·인간±19/방문객±14/세로44px 예약, FIFO 대기·층 이동 대기, 빈 private home 보호 및 기존20/24/30px sweep 기준 유지. formal 제외 외 기준 완화0.
- 기존 초대·빈 시간 보충도 설정된 외출 최소 평균 간격을 지키도록 예약 전에 확인한다. 1F의 안전한 업무 목적지가 두 곳으로 줄어든 회귀는 **기존 reception 접수대의8–25초 전달 사항/방문 일정 확인**으로 보완하고, 같은 예약 경로에서1F만30/60초 재시도한다. 자리·데이터 JSON 변경0. 같은 목적지600초/다른 카드/최소6분/왕복60초 검사는 유지한다.
- host는 방문객 도착 순간 외에도 체류 중15초 간격으로 같은 예약을 시도한다. 원래 host6분·8–15초·왕복60초·동일 방·전체 reservation 기준은 유지한다.
- 짝 대화는 고정 home을 움직이지 않고 주변 정지 인물의 화면 여유가 생길 때만 시작한다. 기본 개인 행동은 계속 유지한다. 2일×5초 snapshot에서 안전한 대화의 도달성·stationary envelope를 직접 검사했다. 모바일 라벨은 기존28px 이내로 통일해52px 발밑 fallback을 제거했다. 기존 대화 문구·이름·글자 크기·마스코트 변경0. 2F/3F 밀집 좌석에서 단어를 줄여도 pill을28px 안에 놓을 수 없는 상황은 새 대화를 시작하지 않아 해결했다. 실화면 검증과 별개다.
- 정지·home·목적지·floor 기하 cache와 불가능한 그룹 목적지 조기 종료, gathering/업무 후보 cache, 공통 자원만 lazy 조회, 중복 capacity 시각 제거. 연속 자원 구간의 정확한 합집합은 유지하며 작은 객체를 합쳤고, FIFO는 공유 지점 목록만 재검사한다. 체류 연장 시 해당 분 bucket만 갱신하여 formal 전체 인덱스 재생성을 피한다. **원래 자원 구간 함수·전체 인덱스 재생성 방식과2일×부재/재실 계획·snapshot 동등성**을 실제 실행으로 검사한다.
- CODEMAP living-office owner 확인. 최신 예약 anchor는 CODEMAP_MISS로 실제 함수 탐색. 기존 DOM/event/renderer 소유 경로 유지.

## 고정 계획·fixture

- 실제 참조 fixture는 \`office-obr21-plans.json.gz\` 하나다. obr20 plans/v2/v3와 중복 개발 도구는 정리했다. 과거235/234 및 승인된 oracle은 변경0.
- 새 fixture19조건 전체 formal/outing·snapshot을 strict 비교한다. Freeze 시 모든 formal 계획이 pre-obr20 base와 동일함도 확인했다. 216 **97행·208일 도달성**은 기존 전체 검사의 실제 결과를 따른다.
- \`node scripts/hani-office-obr16-freeze.mjs\` 방식으로235 pending의 exact after·설명만 갱신했다. 승인 baseline **${approved.pass} PASS / ${approved.fail} FAIL**, fixed234 before/chain 보존.
- runtime SHA-256: \`${runtimeSha256}\`.
- 현재 fixture 비압축 SHA-256: \`${hash(fixtureBytes)}\`. 검사·감사·성능 identity는 [결과](obr21-results.json)와 [검증 실행](obr21-verification.json)에 연결했다.

## 검증

- office/building **${files.length}파일**, 성공${files.length-failures.length}·실패${failures.length}. Node 합산 **${total.pass} PASS / ${total.fail} FAIL / ${total.skipped} SKIP**. 공통 owner import의 중복 실행 포함, plain assert 파일은 exit 결과로 별도 집계. SKIP은 기존 optional browser 항목이며 실화면 PASS가 아니다. [파일별 결과](obr21-suite/results.json).
- 실패 파일: ${failures.length?failures.map(r=>r.file).join(', '):'없음'}.
- 원본 감사 부재/재실 각각 **54,000 snapshot**, frozen/mismatch/stuckSeconds/near30/near24 모두0. 기존 감사 원문·기준 유지. [부재](obr21-audit-absent.log), [재실](obr21-audit-present.log).
- 1층09–19 매초 활성: ${activity.map(r=>r.day+' '+pct(r.activeRatio)+' / 평균'+r.peopleMean.toFixed(3)+'명').join('; ')}. 활성70%·평균3명 기준 유지, 방문객5종 포함.
- 4일×부재/재실 정지·대기 전체 interval 교차의 새 동작 겹침0. home 예외·정식 장면 제외는 \`obr21-stationary.json\`의 별도 계수다. 과거4개 충돌 시각은 base 재현 후 normal/reduced/cancel에서 검사했다.
- 보호 파일${protectedFiles.length}개는 base Git blob과 현재 바이트 재비교. index·버전·cache·마스코트·assets/data·spatial-contract·art-map·office-places 보존. storage/Cloud/schema/migration/Edge Function 변경0. syntax·diff --check 별도 확인.

## 성능

${performance.node}. 부재·재실 각각 독립 새 Node 프로세스3회, warm1000회 평균. 기존 best-of-3<400ms·warm<3ms 기준 유지. 진단 중 결과는 최종 PASS에 재사용하지 않았다.

|조건|첫 계획3회 ms|best ms|warm 최대 ms|
|---|---|---|---|
${performance.performance.map(r=>`|${r.chairmanPresent?'재실':'부재'}|${r.cold.map(v=>v.toFixed(3)).join(' / ')}|${r.best.toFixed(3)}|${r.maxWarm.toFixed(3)}|`).join('\n')}

성능 ${perfPass?'PASS':'FAIL'}. 목표 여유≤370ms 달성 여부는 수치를 따른다. 브라우저 frame/DOM·실제 폰 체감은 미검증이다.

## 서윤 인계와 경계

- obr15 기존 보고 시작/끝 sprite 겹침0 검사는 유지했다. 390 light/dark 부재·재실1F는 실제 DOM rect를 검사하고, **정식 장면 포함 쌍은 catalogExclusions로 따로 표시**, 고정 home 쌍은 homes로 기록한다. 그 밖의 새 동작 collisions는0을 요구한다. 원래 라벨·idle·무쓰기·persistent identity 검사 유지. browser14/15는 작성·syntax만 확인했으며 서윤 실제 실행 대기다.
- 실행: \`powershell -NoProfile -File scripts/hani-office-obr21-verify.ps1\`; 보고/-o: \`node scripts/hani-office-obr21-report.mjs -o\`.
- 브라우저: \`HANI_OFFICE_BROWSER_TAG=obr21-labels node scripts/hani-office-obr14.browser.mjs\`, \`HANI_OFFICE_BROWSER_TAG=obr21-dialogue node scripts/hani-office-obr15.browser.mjs\` (PowerShell은 $env: 방식).
- 원격 main 조회 네트워크 실패. origin/main 캐시 d6a88bc, 로컬 index v2.9.234·마지막 UI JS hani-launch-greeting.js 유지. 원격 최신성·운영 로딩은 미검증이며 merge/rebase0.
- 대표님 명세에 따라 push/PR/Notion 금지. CURRENT/DECISIONS 및 다른 담당 산출물 보존. 버전 증가·Candidate/build/One-Pass/HINA/main/Pages/Production은 이번 기능 작업 범위 밖 N/A·미실행.
- [인수인계](../../docs/development-history/handoffs/2026-10-30-office-obr21.md).
`;
fs.writeFileSync(dir+'report-obr21.md',report);
const summary=`성민 대표님, obr21: ${status}.\n정식216/221 카탈로그는 기존 근접 규칙, 새 동작만 화면 예약. 보고 접근점·home 예외 유지.\n회귀 ${total.pass} PASS / ${total.fail} FAIL / ${total.skipped} SKIP, ${files.length}파일 실패${failures.length}. 승인baseline14 PASS, 감사 각54,000 이상0.\n1F 활성 ${activity.map(r=>pct(r.activeRatio)).join(' / ')}.\n성능 best 부재/재실 ${performance.performance.map(r=>r.best.toFixed(3)).join(' / ')}ms, warm 최대 ${Math.max(...performance.performance.map(r=>r.maxWarm)).toFixed(3)}ms.\n브라우저 작성·syntax만, 실행0·PNG0·서윤 확인 대기.\n${commit.status}. 버전/index/마스코트/저장소·Cloud/push/PR/Notion 변경0.\n보고: artifacts/office-behavior/report-obr21.md\n`;
const i=process.argv.indexOf('-o'),output=i>=0&&process.argv[i+1]&&!process.argv[i+1].startsWith('-')?process.argv[i+1]:dir+'obr21-o.txt';
assert.ok(path.resolve(output).startsWith(path.resolve('.')+path.sep));fs.writeFileSync(output,summary);console.log(summary);
