import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const dir='artifacts/office-behavior/',base='2ddc0ceb7dfb0cd6027043b78b7b3099920cd5b5';
const read=f=>{const b=fs.readFileSync(dir+f);return b.toString(b[0]===255&&b[1]===254?'utf16le':'utf8').replace(/^\uFEFF/,'')},json=f=>JSON.parse(read(f));
const hash=(b,algo='sha256')=>createHash(algo).update(b).digest('hex');
const counts=s=>Object.fromEntries(['tests','pass','fail','skipped'].map(k=>{const m=s.match(new RegExp('ℹ '+k+' (\\d+)'));assert.ok(m,k);return [k,+m[1]]}));
const rows=read('obr19-regression.log').split(/^FILE /m).slice(1).map(p=>({file:p.split(/\r?\n/)[0],log:'obr19-regression.log',...counts(p)}));
for(const [file,log]of [['hani-office-219.test.mjs','obr19-219-final.log'],['hani-office-obr18.test.mjs','obr19-targeted-final.log'],['hani-office-obr19.test.mjs','obr19-vocabulary-final.log']])Object.assign(rows.find(r=>r.file===file),{log,...counts(read(log))});
const total=rows.reduce((a,r)=>{for(const k of ['tests','pass','fail','skipped'])a[k]+=r[k];return a},{tests:0,pass:0,fail:0,skipped:0});
const approval=counts(read('obr19-approved-final.log')),vocabulary=json('obr19-vocabulary.json'),layout=json('obr19-layout-node.json'),perf=json('obr19-metrics.json');
assert.equal(approval.pass,14);assert.equal(approval.fail,0);assert.equal(vocabulary.duplicates.length,0);assert.equal(vocabulary.invalid.length,0);
const audits=Object.fromEntries(['absent','present'].map(k=>{const a=JSON.parse(read('obr19-audit-'+k+'.log').match(/SUMMARY (\{[^\n]+\})/)[1]);assert.equal(a.snapshots,54000);for(const key of ['frozen','mismatch','stuckSeconds','near30','near24'])assert.equal(a[key],0);return [k,a]}));
const protectedFiles=read('obr19-protected-tree.txt').trim().split(/\r?\n/).map(line=>{const m=line.match(/^\d+ blob ([0-9a-f]+)\t(.+)$/);assert.ok(m,line);const bytes=fs.readFileSync(m[2]),actual=hash(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes]),'sha1');assert.equal(actual,m[1],m[2]);return {file:m[2],gitObject:actual,sha256:hash(bytes)}});
const runtimeSha256=hash(fs.readFileSync('hani-office-live.js'));assert.equal(perf.runtimeSha256,runtimeSha256);assert.doesNotMatch(fs.readFileSync('hani-office-live.js','utf8'),/localStorage|sessionStorage|supabase|\.setItem\(|\.removeItem\(/);
const phone=layout.find(r=>r.width===342),desktop=layout.find(r=>r.width===1348),narrow=layout.find(r=>r.width===300);
const summarize=(r,floor)=>{const scenes=r.scenes.filter(s=>s.floor===floor),occupied=scenes.filter(s=>s.people),people=scenes.reduce((n,s)=>n+s.people,0),dots=scenes.reduce((n,s)=>n+s.dots,0),pills=scenes.reduce((n,s)=>n+s.pills,0);return {floor,samples:scenes.length,occupiedSamples:occupied.length,people,pills,dots,ratio:people?pills/people:1,dotRatio:people?dots/people:0,minimumRatio:Math.min(...occupied.map(s=>s.ratio)),maxDotRatio:Math.max(...occupied.map(s=>s.dots/s.people)),missing:scenes.reduce((n,s)=>n+s.missing.length,0)}};
const floors=['1f','2f','3f','4f','5f'].map(f=>summarize(phone,f)),times=[33300,43800,56400].flatMap(sec=>phone.scenes.filter(s=>s.sec===sec));
const status=phone.counts.dialogue||phone.missingDots.length||total.fail?'필수 배치 FAIL / 위치 조정 범위 답변 대기':'Node PASS / 실제 browser 대기';
const commit=fs.existsSync(dir+'obr19-commit.json')?json('obr19-commit.json'):{created:false,status:'아직 시도 전'};
const result={base,branch:'hani/office-235-lively-labels',status,runtimeSha256,cssSha256:hash(fs.readFileSync('hani-office-live.css')),pendingSha256:hash(fs.readFileSync('scripts/fixtures/office-lively-labels-235.json')),protectedFiles,files:rows,total,approval,vocabulary,audits,performance:perf,floors,times,layout:layout.map(({scenes,spritePairs,failures,missingDots,...r})=>({...r,failures:failures.length,missingDots:missingDots.length,spritePairs:spritePairs.length})),browser:{executed:false,screenshots:0,status:'서윤 실행 대기; 화면 실측 없음'},commit,pushPrNotion:false};
fs.writeFileSync(dir+'obr19-results.json',JSON.stringify(result,null,2)+'\n');
const pct=n=>(n*100).toFixed(1)+'%',time=s=>String(Math.floor(s/3600)).padStart(2,'0')+':'+String(Math.floor(s%3600/60)).padStart(2,'0');
const floorTable=floors.map(r=>`|${r.floor.toUpperCase()}|${r.samples}/${r.occupiedSamples}|${pct(r.minimumRatio)}|${pct(r.ratio)}|${pct(r.dotRatio)}|${pct(r.maxDotRatio)}|${r.missing}|`).join('\n');
const timeTable=times.sort((a,b)=>a.sec-b.sec||a.floor.localeCompare(b.floor)).map(s=>`|${time(s.sec)}|${s.floor.toUpperCase()}|${s.pills}/${s.people} (${s.people?pct(s.ratio):'N/A 빈 층'})|${s.dots}/${s.people} (${s.people?pct(s.dots/s.people):'N/A 빈 층'})|${s.missing.length}|`).join('\n');
const perfTable=perf.performance.map(p=>`|${p.chairmanPresent?'있음':'없음'}|${p.cold.map(n=>n.toFixed(3)).join(' / ')}|${p.best.toFixed(3)}|${p.maxWarm.toFixed(3)}|${p.best<400&&p.maxWarm<3?'PASS':'FAIL'}|`).join('\n');
fs.writeFileSync(dir+'report-obr19.md',`# obr19 — 원래 크기 캐릭터 + 뜻이 보이는 한 줄 알약

2026-10-30 KST · 도연/Codex 단독 · branch \`hani/office-235-lively-labels\` · base \`${base}\`.

**${status}.** 캐릭터/문구 수정은 반영했으나 필수 배치를 완료했다고 보고하지 않는다. browser 실행0·신규PNG0. ${commit.status}. push/PR/Notion/main/배포 시도0.

## 변경

- phone20px override 제거. 원래 \`max(40px,6.8cqw)\`·atlas 비율·pivot·40px hit 영역 복원/보존. 219의 source/browser 기대값도 원래40px 기준으로 복원했다.
- 원문을 읽어 행동 규칙으로 생성: 보고서작성·커피내리기·예산검산·창밖구경·기사구상·배포보고. 행동2–6자(공백 포함), 이름9자 이내 + 구분자3자 + 행동6자 = 현재 전체 최대18자. 문자 절단/줄임표 없음. 기존 shortLine의 정보 손실을 피하고, 보고 응답/도착 인사는 기존 원문 분류를 사용한다.
- 같은 층의 기존 renderer 순서에서 Set으로 의미 있는 대체 표현을 고른다. 원문/title/roster/tap은 보존한다. ${vocabulary.snapshots.toLocaleString()} snapshot·${vocabulary.people.toLocaleString()}명에서 길이/금지 단어 위반0·동시 중복0. 금지 목록은 \`hani-office-obr19.test.mjs\`에 있다.
- 기존 persistent name/status/compact span·단일 event path만 사용한다. 새 runtime 파일/renderer/handler/timer 없음. CODEMAP living-office owner를 확인했으나 최신 label symbol은 미등록(CODEMAP_MISS)이므로 실제 \`fitStatusLabels → labels.place → offset commit\`을 확인했다.
- 폰은 대화/인사/발화를 먼저 보존하고 전체 알약 수를 최대화하도록 기존 제한 탐색을 사용한다. 모두 보이지 않으면 beam 탐색을 시도한다. global 최적해를 증명한 것은 아니다. label-label/자기포함sprite/mascot/경계0·머리 중심반경28px·대화두줄·점누락0 검사는 그대로 강제한다. 390의 고정70% 검사는 대표님 결정에 따라 층·시간별 수치 보고로 바꾸었고, 1440의 기존100% 검사는 유지했다.

## 필수 조건 차단과 다음 선택

- 390 fixture의 지도342px·기존1672/941 비율에서 알약 최소 **${pct(phone.minimumRatio)}**. label-label/sprite/자기얼굴/mascot/경계/거리 위반은 ${JSON.stringify(phone.counts)}. 모든 사람의 알약/점은 머리28px 안에 있으나 **대화 알약 ${phone.counts.dialogue}건이 점으로 바뀌어 FAIL**이다. 점 누락 ${phone.missingDots.length}건. 이 결과는 Node 모형이며 실제 화면 PASS가 아니다.
- 2F 점 누락은 기존3px 탐색이 좁은 틈을 놓친 문제도 있었다. 최종 수정은 장애물 경계와 머리 투영을 후보로 사용하여 요청342px에서 점 누락0을 확보했다. 위치나 거리 기준은 바꾸지 않았다.
- 4F 첫 보고자는 고정 sprite/mascot만 놓고 다른 모든 라벨을 제외해도 알약 중심까지 최소29.674px가 필요하다. 필수28px와 충돌하므로 우선순위만으로 해결되지 않는다. [별도 직사각 cell 분석](obr19-fixed-head-space.json), 재현: \`node scripts/hani-office-obr19-space.mjs\`. 이는 Node 근사 atlas box의 증명이며 실제 브라우저 rect/픽셀은 서윤 확인이 필요하다. 회장/보고자 sprite box 자체도 겹치는 구간이 있어 browser15의 기존 해당 검사도 유지했다.
- 데이터·지도·표시 위치를 임의 수정하지 않았다. **휴대폰 표시 위치 최소 보정 / 지도 확대·스크롤 / 현재 위치 유지·실패 인계** 중 대표님 선택을 요청한 상태다. 임시 정사각 지도 진단도 필수 대화를 해결하지 못했고 최종 runtime/검사에 반영하지 않았다.
- 실제390 실측은 서윤 실행 전이므로 미검증. 아래 표는 폰트폭·rotation을 근사한 Node 모형이다. 실제 폰트/idle/브라우저 layout 결과로 해석하지 않는다. [장면별 원본](obr19-layout-node.json)에 실패 시각·id·머리 rect와 전체 spritePairs를 남겼다.

## 층·시간대별 Node 실측

각 층 ${floors[0].samples}시점(09:00–19:00 10분 간격 +09:15 +보고 시작/끝), 전체370장면. 표의 시점은 전체/사람이 있는 시점이다. 합산 비율은 사람·시점 합계가 분모이며, 빈 층 비율은 N/A·점은 알약 보임에 포함하지 않는다. 점 누락은 점 비율과 별도로 기록한다.

|층|전체/재실 시점|알약 최소|알약 합산|점 합산|점 최대|점 누락 건|
|---|---|---|---|---|---|---|
${floorTable}

|KST|층|알약 / 전체|점 / 전체|누락|
|---|---|---|---|---|
${timeTable}

- 1440 fixture 지도1348px 알약/라벨 최소${pct(desktop.minimumRatio)}, 필수 위반${JSON.stringify(desktop.counts)}·점 누락${desktop.missingDots.length}. desktop는 기존 이름/status 두 슬롯이다.
- 추가300px 진단 최소${pct(narrow.minimumRatio)}·대화누락${narrow.counts.dialogue}·점누락${narrow.missingDots.length}. 요청390 결과와 분리했다.
- solver 평균/최대:342px ${phone.meanMs.toFixed(3)}/${phone.maxMs.toFixed(3)}ms, 1348px ${desktop.meanMs.toFixed(3)}/${desktop.maxMs.toFixed(3)}ms. DOM/layout 비용 제외.

## 검증

- office/building ${rows.length}파일 최종 파일별 합산 **${total.pass} PASS / ${total.fail} FAIL / ${total.skipped} SKIP / ${total.tests} executions**. 공통 owner import 중복 포함. [회귀](obr19-regression.log), [최종 기하](obr19-targeted-final.log), [최종 문구](obr19-vocabulary-final.log), [최종219](obr19-219-final.log). FAIL을 PASS로 대체하지 않았다. 일부 회귀 뒤 변경된 UI 문구 경로는219/obr18/obr19 및 baseline을 최종 재실행했다. planner/저장 경로 변경 없음.
- 235 pending exact after/설명만 갱신, fixed234 before·과거 chain·immutable235 oracle 유지. 승인 baseline **${approval.pass} PASS / ${approval.fail} FAIL**. [로그](obr19-approved-final.log).
- 원본 감사 회장님 있음/없음 각각54,000 snapshot: frozen/mismatch/stuckSeconds/near30/near24 모두0. [없음](obr19-audit-absent.log), [있음](obr19-audit-present.log). 이는 모델 검사이며 화면 겹침 검사가 아니다.
- syntax·diff --check 확인. base 대비 보호 파일${protectedFiles.length}개 Git blob 원문 일치(index·버전 owner·마스코트·data/·assets/·immutable235 oracle). Storage/Supabase 경로0·기존 trap 회귀 결과는 각 로그에 기록했다. Cloud/schema/migration/Edge Function 동반 작업 없음.
- 아래 성능은 Node ${perf.node}, presence별 독립 새 프로세스3회. 기존 best-of-3<400ms·warm<3ms 기준 유지. [원본](obr19-metrics.json). browser frame/DOM 성능은 미검증이다.

|회장님|cold3회 ms|best ms|warm 최대 ms|판정|
|---|---|---|---|---|
${perfTable}

## 서윤 browser 인계

**작성만, 실행0·신규PNG0.** 실제 층·시간별 알약/점 비율·28px100%·겹침0·점누락0·보고/짝대화/도착인사 두 줄·tap/idle/reduce/pause·실제 frame/DOM 비용·Android·아린 UI 검토는 서윤 실행 대기다. 기존PNG를 재사용하지 않았다. 현재 알려진 기하 문제로390 필수 검사는 실패할 가능성이 크다.

\`\`\`powershell
$env:HANI_OFFICE_BROWSER_TAG='obr19-labels'
node scripts/hani-office-obr14.browser.mjs
$env:HANI_OFFICE_BROWSER_TAG='obr19-dialogue'
node scripts/hani-office-obr15.browser.mjs
\`\`\`

필요 시 각 명령 뒤 Playwright index.mjs·msedge.exe 경로 지정. 14는90장면/30PNG·실제click·층별 coverage와 점비율/누락 JSON, 15는4조건/8PNG·보고/도착/새 짝대화 검사를 작성했다. 실제 원문·노드 identity·무쓰기·facing·sprite collision 기준 유지. 실행이 첫 실패에서 중단되면 그 이후 장면은 미검증이다.

## 경계와 인계

- 로컬 commit: ${commit.status}. Git 권한 우회/다른 worktree 변경 없음. 상세 identity는 [결과](obr19-results.json).
- 원격 main 연결 실패, origin/main 캐시 d6a88bc. 최신성·운영 화면/최신 JS 로딩 미확인. 로컬 index 표시는2.9.234·마지막 JS hani-launch-greeting.js. merge/rebase0.
- push/PR/Notion은 명시적 금지로0. CURRENT/DECISIONS 변경0. Candidate/build/One-Pass/HINA/main/Pages/Production은 기능 개발 범위 밖 N/A·미실행.
- [작업 인수인계](../../docs/development-history/handoffs/2026-10-30-office-obr19.md). 대표님 선택 후 같은 owner에서 표시 공간 문제를 해결하고 영향 검사만 다시 실행한다.
`);
fs.writeFileSync(dir+'obr19-o.txt',`성민 대표님, 캐릭터 최소40px 복원과 의미 있는 한 줄 알약을 반영했습니다.\n행동2–6자·전체 최대18자, 같은 층 동시 중복0(${vocabulary.people}명 검사).\n현재 필수 배치는 미완료:390 지도342px Node 모형 최소${pct(phone.minimumRatio)}, 대화누락${phone.counts.dialogue}·점누락${phone.missingDots.length}. 기존 위치에서 다른 sprite가 머리28px 주변을 막습니다. 기준을 낮추지 않았습니다.\n회귀 ${total.pass} PASS / ${total.fail} FAIL / ${total.skipped} SKIP, 승인baseline14 PASS, 감사 각54,000 snapshot 모두0. 성능은 report 표 참조.\nbrowser14/15 작성만·실행0·신규PNG0. 실제 화면은 서윤 대기.\n표시 위치 최소 보정/지도 확대·스크롤/현재 위치 유지·실패 인계 중 선택이 필요합니다.\n${commit.status}. push/PR/Notion/버전/index/data/마스코트/저장소·Cloud/main/배포 변경0.\n보고: artifacts/office-behavior/report-obr19.md\n`);
console.log(JSON.stringify({status,total,approval,phone:{minimumRatio:phone.minimumRatio,counts:phone.counts,missingDots:phone.missingDots.length},desktop:{minimumRatio:desktop.minimumRatio,counts:desktop.counts},commit}));
