const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const read=f=>fs.readFileSync(f,'utf8'),source=read('hani-main.js');
const baseline=process.env.HANI_SIMPLIFY_BASELINE||'artifacts/fix-218/simplify/baseline';
const pick=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
function load(s){const ctx=vm.createContext({Date,Intl,Map,Number,Math,JSON,Array,String,Object,state:{books:[],movies:[]},window:{},today:()=> '2026-10-18',esc:x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))});vm.runInContext(pick(s,'function activityDate(','function ledgerFixedChanges(')+'this.api={activityTrend,readingTrendDate,activityTrendHtml};',ctx);return ctx;}
const ctx=load(source),plain=x=>JSON.parse(JSON.stringify(x));
const fixture=[{id:'first',status:'read',completedDate:'2026-01-05'},...['2026-02-01','2026-03-01','2026-04-01','2026-07-01','2026-08-01','2026-08-02','2026-09-01','2026-09-02','2026-09-03','2026-10-01'].map((date,i)=>({id:'b'+i,status:'read',completedDate:date}))];
test('six consecutive chart months use the canonical completion filters, including the current partial month',()=>{
 const input=[...fixture,{id:'dup',status:'read',completedDate:'2026-08-04'},{id:'dup',status:'read',completedDate:'2026-08-04'},{id:'wish',status:'wish',completedDate:'2026-08-04'},{id:'future',status:'read',completedDate:'2026-12-04'},{id:'bad',status:'read',completedDate:'2026-02-30'}],before=JSON.stringify(input);
 const m=ctx.api.activityTrend(input,{dateOf:ctx.api.readingTrendDate,completed:r=>r.status==='read',asOf:'2026-10-18'});
 assert.deepEqual(plain(m.monthly),[{month:'2026-05',count:0},{month:'2026-06',count:0},{month:'2026-07',count:1},{month:'2026-08',count:2},{month:'2026-09',count:3},{month:'2026-10',count:1}]);assert.equal(m.latest,2);assert.equal(m.annual,11);assert.equal(JSON.stringify(input),before);
});
test('bar heights and both reference lines share one zero-based scale; accessible exact values',()=>{
 ctx.state.books=fixture;const html=ctx.api.activityTrendHtml('reading');
 const rects=[...html.matchAll(/<rect x="[^"]+" y="([^"]+)" width="26" height="([^"]+)" rx="3" data-month="([^"]+)" data-count="([^"]+)"/g)];assert.equal(rects.length,6);
 const top=Number(html.match(/data-scale-max="([^"]+)"/)[1]);assert.equal(top,3);
 for(const [,y,h,,count] of rects){assert.ok(Math.abs(Number(h)-Number(count)/top*112)<1e-9);assert.ok(Math.abs(Number(y)+Number(h)-142)<1e-9);}
 for(const [,y,value] of html.matchAll(/class="activity-chart-average [^"]+"[^>]*y1="([^"]+)"[^>]*data-value="([^"]+)"/g))assert.ok(Math.abs(Number(y)-(142-Number(value)/top*112))<1e-9);
 assert.match(html,/activity-chart-month current[^]*data-month="2026-10"/);assert.match(html,/role="img" aria-label="2026-05 0권/);assert.match(html,/활동 0을 뜻하지 않아요/);assert.match(html,/<details class="activity-trend-info">/);
});
test('goal ring is resolved-only, capped geometrically with an exact over-goal label; absence never fabricates a target',()=>{
 ctx.state.books=fixture;ctx.window.HANI_GOAL_PROGRESS={read:()=>[{definition:{metric_id:'books_completed_count'},goal:{status:'RESOLVED',target:22}}]};let html=ctx.api.activityTrendHtml('reading');assert.match(html,/stroke-dasharray="50 100"/);assert.match(html,/연간 목표 22권 중 11권 · 50%/);
 ctx.window.HANI_GOAL_PROGRESS.read=()=>[{definition:{metric_id:'books_completed_count'},goal:{status:'RESOLVED',target:5}}];html=ctx.api.activityTrendHtml('reading');assert.match(html,/stroke-dasharray="100 100"/);assert.match(html,/220%/);
 for(const goal of [{status:'CONFLICT',target:22},{status:'RESOLVED',target:0},null]){ctx.window.HANI_GOAL_PROGRESS.read=()=>[{definition:{metric_id:'books_completed_count'},goal}];html=ctx.api.activityTrendHtml('reading');assert.match(html,/목표 없음/);assert.doesNotMatch(html,/activity-goal-ring/);}
});
test('movie and report reuse the same chart and preserve independent read-only disclosure and goal action',()=>{
 ctx.state.movies=fixture.map(r=>({...r,status:'watched',watchedDate:r.completedDate}));ctx.window.HANI_GOAL_PROGRESS={};const html=ctx.api.activityTrendHtml('movie');assert.match(html,/2026-09 3편/);assert.match(html,/목표 다시 잡기/);assert.match(html,/hani-profile-minji.webp/);assert.match(ctx.api.activityTrendHtml('reading',undefined,true),/저장된 보고서 내용과 별도예요/);
});
test('data calculation, write paths, approval flow, catalog, versions and functional controls are preserved',t=>{
 if(!fs.existsSync(baseline+'/hani-main.js'))return t.skip('raw pre-task baseline required for byte preservation');
 const old=read(baseline+'/hani-main.js'),original=load(old);
 for(const asOf of ['2026-01-02','2026-10-18','2027-01-01'])for(const input of [[],fixture,[...fixture,{id:'u',createdAt:'2026-01-01'}]]){
  const options={dateOf:ctx.api.readingTrendDate,asOf},now=plain(ctx.api.activityTrend(input,options));delete now.monthly;assert.deepEqual(now,plain(original.api.activityTrend(input,options)));
 }
 const scrub=s=>s.replace(/function activityTrendChart\([\s\S]*?(?=function activityTrendHtml\()/,'').replace(/function activityTrendHtml\([\s\S]*?(?=function ledgerFixedChanges\()/,'').replace('undated,registered,monthly:Array.from({length:6},(_,i)=>{const month=activityMonthShift(current,i-5);return {month,count:counts.get(month)||0}})};','undated,registered};').replace("const status=message=>{const node=document.getElementById('geminiReportStatus');node.textContent=message;node.hidden=!message;};","const status=message=>{document.getElementById('geminiReportStatus').textContent=message;};").replace("status('저장된 보고서입니다. 열람 시 Gemini를 호출하지 않습니다.');","status('');").replace("status('배포 기록을 바탕으로 작성한 보고서입니다. 새 배포 내용은 페이지를 다시 열면 반영됩니다.');","status('');");
 const annual=s=>s.replace(/<div class="annual-report-intro">.*?생활 데이터 변경을 실행하지 않습니다\.<\/p><\/div><\/div>/,'').replace('<p class="sub">업로드는 AI 분석이나 기존 목표·생활 데이터 변경을 실행하지 않습니다.</p><form id="annualReportForm">','<form id="annualReportForm">');
 // The subsequent authorized dashboard/report refresh has its own exact
 // pre-task preservation check in hani-dash-218.test.mjs.
 const followup=s=>s.replace(/function dataHubLifeCardPresentation\([\s\S]*?(?=function dataHubRenderDashboard\()/,'<dashboard presentation>').replace(/globalThis\.HaniGeminiReportCatalog=Object\.freeze\([^\r\n]+\);/,'<report catalog>');
 assert.equal(followup(annual(scrub(source))),followup(annual(scrub(old))),'every other runtime byte unchanged, including protected write/approval functions');
 assert.match(source,/<summary>새 보고서 · 수정본 등록<\/summary><p class="sub">업로드는 AI 분석이나 기존 목표·생활 데이터 변경을 실행하지 않습니다\.<\/p>/,'annual data-protection notice preserved beside upload controls');
 const html=read('index.html'),oldHtml=read(baseline+'/index.html');
 for(const re of [/<(?:button|input|select|textarea|a)\b[^>]*\bid="[^"]+"[^>]*>/g,/\bdata-(?:view|go)="[^"]+"/g,/\bfor="[^"]+"/g,/(?:v=|v)2\.9\.\d+/g]){
  const collect=s=>[...s.matchAll(re)].map(m=>m[0].replace('class="btn" id="geminiReportRefresh"','class="btn sm" id="geminiReportRefresh"')).sort();assert.deepEqual(collect(html),collect(oldHtml));
 }
 for(const f of ['index.html','hani-main.js','hani-design-system.css']){
  const before=read(baseline+'/'+f),after=read(f),lines=new Map(),ambiguous=new Set();for(const line of before.match(/[^\n]*(?:\n|$)/g).filter(Boolean)){const key=line.replace(/\r?\n$/,'');if(lines.has(key)&&lines.get(key)!==line)ambiguous.add(key);lines.set(key,line);}for(const line of after.match(/[^\n]*(?:\n|$)/g).filter(Boolean)){const key=line.replace(/\r?\n$/,'');if(lines.has(key)&&!ambiguous.has(key))assert.equal(line,lines.get(key),f+' retained EOL');}
 }
 assert.doesNotMatch(html,/id="geminiStaffProfile"|class="card gemini-reports-intro"|class="card budget-manager"/);
 assert.match(html,/class="note storage-warning"/);assert.match(html,/class="card full wishlist-conversation-guide"/);assert.match(html,/id="ledgerImportResult"/);
});
