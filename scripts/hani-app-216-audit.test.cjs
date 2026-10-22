// Actual render functions and synthetic imported records. No storage or network.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const main=fs.readFileSync('hani-main.js','utf8'),index=fs.readFileSync('index.html','utf8');
const pick=(a,b)=>{const start=main.indexOf(a),end=main.indexOf(b,start);assert.ok(start>=0&&end>start,a);return main.slice(start,end)};
const c=vm.createContext({console,Array,String,Object,Number,Math,Date,Set,Map,JSON});
vm.runInContext(pick('const esc=','const today=')+pick('function deploySiteStatus(','function deployRenderSiteSteps(')+pick('function validateStoredRecords(','function writeProtectedState('),c);
test('imported IDs are checked only at the render boundary, never rewritten',()=>{
 for(const id of ['normal-id','01','11111111-1111-4111-8111-111111111111','legacy_id:1.2']){
  assert.equal(c.validRenderRecordId(id),true);assert.equal(c.recordIdAttributes('data-book-edit',id),`data-book-edit="${id}"`);
 }
 for(const id of ['"><img src=x onerror=alert(1)>','" autofocus onfocus="alert(1)',"x' onclick='x",'a|b','a\nb',' a','',null,{},42,'a'.repeat(161)]){
  const raw={body:[{id,date:'2026-10-18',weight:70}]},before=JSON.stringify(raw);c.validateStoredRecords(raw);
  assert.equal(JSON.stringify(raw),before);assert.equal(c.validRenderRecordId(id),false);
  assert.equal(c.recordIdAttributes('data-delete-body',id),'disabled aria-disabled="true"');
  assert.equal(c.recordIdAttributes('data-spend-review-edit','good',id),'disabled aria-disabled="true"');
 }
});
test('canonical book/movie renderers disable malformed IDs and escape imported text',()=>{
 Object.assign(c,{mediaImage:()=>'',TOPIC_COLORS:{기타:'#fff'},stars:()=>'',movieContentType:()=> '영화'});
 vm.runInContext(pick('function bookCard(','function updateBookFormState(')+pick('function movieCard(','function movieWorkCard('),c);
 for(const render of [c.bookCard,c.movieCard]){
  const bad=render({id:'"><img src=x onerror=alert(1)>',title:'<svg onload=alert(1)>',status:'wish'});
  assert.doesNotMatch(bad,/<img|<svg|data-(?:book|movie)-(?:edit|delete|toggle)=/);assert.match(bad,/&lt;svg/);
  assert.equal((bad.match(/disabled aria-disabled="true"/g)||[]).length,3);
  assert.match(render({id:'valid-id',title:'Title',status:'wish'}),/data-(?:book|movie)-edit="valid-id"/);
 }
});
test('all 4 deployment steps require evidence bound to the merged identity',()=>{
 const sha='a'.repeat(40),base={merged:true,merged_sha:sha,production_readback:'PASS'};
 assert.equal(c.deploySiteStatus(base).complete,false);assert.match(c.deploySiteStatus(base).summary,/사이트 반영 확인 중/);
 const evidence={...base,site_verified_sha:sha,pages_readback:'PASS',latest_js_readback:'PASS',functional_readback:'PASS'};
 assert.equal(c.deploySiteStatus(evidence).complete,true);assert.equal(c.deploySiteStatus(evidence).summary,'운영 반영 완료');
 for(const field of ['pages_readback','latest_js_readback','functional_readback','site_verified_sha','merged_sha']){
  assert.equal(c.deploySiteStatus({...evidence,[field]:undefined}).complete,false,field);
 }
 assert.equal(c.deploySiteStatus({...evidence,site_verified_sha:'b'.repeat(40)}).complete,false);
 assert.equal(c.deploySiteStatus(null).steps.some(x=>x[1]),false);
 assert.equal(c.deploySiteStatus({...evidence,pages_readback:'FAIL'}).steps.filter(x=>x[1]).length,1);
 assert.equal(c.deploySiteStatus({merged:true,pages_readback:'PASS',latest_js_readback:'PASS',functional_readback:'PASS'}).complete,false,'no evidence identity');
});
test('canonical merge handler preserves approval gating and does not claim site completion from main read-back',async()=>{
 const nodes=new Map(),calls=[],stage={pr_number:7,release_commit_sha:'a'.repeat(40),candidate_version:'2.9.215',ready_for_approval:true};
 const runtime={busy:false,stage,qa:{state:'HINA_QA_PASS'},merged:null};
 const context=vm.createContext({console,JSON,Number,Object,String,encodeURIComponent,deployRuntime:runtime,deployApprovalPending:false,
  $:id=>{if(!nodes.has(id))nodes.set(id,{className:'',textContent:'',innerHTML:''});return nodes.get(id)},
  deployApprovalIdentity:s=>JSON.stringify(s),deployConfirmApprovedCandidate:async()=>true,
  deploySetBusy:value=>{runtime.busy=value},deploySaveSession(){},haniWorkShow(){},haniWorkFinish(){},
  deployShortSha:s=>s?.slice(0,10),HANI_DISPLAY_VERSION:'2.9.215',
  deployBridgeApi:async(action,payload)=>{calls.push({action,payload});if(action==='queue_status')return {active:null,items:[]};return {merged:true,merged_sha:'b'.repeat(40),production_readback:'PASS',pr_number:7}}
 });
 vm.runInContext(pick('const esc=','const today=')+pick('function deploySiteStatus(','function deployRenderSiteSteps(')+pick('async function deployCenterMerge(','async function deployCenterDiscard('),context);
 runtime.qa=null;await context.deployCenterMerge();assert.equal(calls.length,0,'HINA gate remains required');
 runtime.qa={state:'HINA_QA_PASS'};context.deployConfirmApprovedCandidate=async()=>false;await context.deployCenterMerge();assert.equal(calls.length,0,'cancel does not merge');
 context.deployConfirmApprovedCandidate=async()=>true;await context.deployCenterMerge();
 assert.equal(calls.filter(c=>c.action==='merge_release').length,1);assert.equal(calls[0].payload.expected_head_sha,stage.release_commit_sha);
 assert.match(nodes.get('deployMergeResult').innerHTML,/main 병합 완료 · 사이트 반영 확인 중/);
 assert.doesNotMatch(nodes.get('deployMergeResult').innerHTML,/운영 반영 완료|운영 사이트 정상 반영/);
});
test('styles remain in cascade order, only approved pending launch/mascot/newsroom files await train tags, worker is lazy, stale labels removed',async()=>{
 const {normalizeReviewedCurrentSource}=await import('./hani-reviewed-release-baseline.mjs');
 const {approvedNewsroomFiles}=await import('./hani-newsroom-4cut-preservation.mjs');
 normalizeReviewedCurrentSource('index.html',index); // Exact pending connections, each once.
 const expectedStyles=["./hani-ai-budget.css","./hani-style-01.css","./hani-style-08.css","./hani-style-02.css","./hani-style-03.css","./hani-style-04.css","./hani-style-05.css","./hani-style-06.css","./hani-style-07.css","./hani-office-live.css","./hani-desk-mascots.css","https://cdn.jsdelivr.net/gh/sunn-us/SUIT/fonts/variable/woff2/SUIT-Variable.css","https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css","./hani-yuna-helpdesk.css","./hani-design-system.css","./hani-asset-market.css","./hani-portfolio-preview.css","./hani-investment-committee.css","./hani-street-journal.css","./hani-context-remote.css","./hani-development-history.css","./hani-character-archive.css","./hani-organization-hub.css","./hani-board.css","./hani-ilbo.css"];
 expectedStyles.push('./hani-launch-greeting.css');
 const styles=s=>[...s.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map(m=>m[0].match(/href="([^"]+)"/)[1].split('?')[0]);
 assert.deepEqual(styles(index),expectedStyles);assert.doesNotMatch(index.slice(index.indexOf('<body')),/<link\b[^>]*rel="stylesheet"/);
 // Feature branches cannot advance cache tags; the release train tags these approved pending files.
 const pendingFiles=['./hani-launch-greeting.css','./hani-launch-greeting.js','./hani-desk-mascots.css','./hani-desk-mascots.js',...approvedNewsroomFiles.filter(f=>f.endsWith('.js')).map(f=>'./'+f)];
 for(const m of index.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g))if(/\.css(?:\?|$)|\.js(?:\?|$)|@2\.117\.2/.test(m[1])&&!pendingFiles.includes(m[1]))assert.match(m[1],/\?v=/,m[1]);
 const scripts=[...index.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
 assert.equal(scripts.filter(src=>src==='./hani-launch-greeting.js').length,1);
 assert.equal(scripts.at(-1),'./hani-launch-greeting.js');
 assert.doesNotMatch(index,/preload[^>]*pdf-worker|현재 운영 버전 v2\.9\.68|Life Edition v2\.8\.0|v2\.9\.18 Stable Sync/);
 assert.match(main,/workerSrc="\.\/js\/hani-pdf-worker\.js\?v="\+encodeURIComponent\(HANI_DISPLAY_VERSION\)/);
 const archive=fs.readFileSync('hani-character-archive.js','utf8');assert.doesNotMatch(archive,/Maginificent9/);assert.match(archive,/Magnificent9/);
});
test('Yuna explicit book and reading context beat finance keywords, financial actions still route',()=>{
 const sandbox=vm.createContext({window:{},document:{getElementById:()=>null},console,Date,structuredClone});
 vm.runInContext(fs.readFileSync('hani-yuna-helpdesk.js','utf8'),sandbox);const api=sandbox.window.HANI_YUNA_HELPDESK;
 for(const text of ['투자 책 완독','오늘 주식 투자 책 완독했어','자산 관리 책 읽기 시작했어'])assert.equal(api.parse(text).target,'book',text);
 assert.equal(api.parse('ISA 투자 이야기','book').target,'book');
 for(const text of ['ISA에 20만원 추가했어','주식 매수','가계부 결제','러닝 3세트'])assert.equal(api.parse(text).mode,'route',text);
 assert.equal(api.visionDraft({confidence:.95,financial_detected:true,extracted_text:'오늘 투자 책 완독',structured_json:'[{"target":"book","data":{"title":"투자 책"}}]'},'오늘 투자 책 완독','book').target,'book');
 assert.match(fs.readFileSync('hani-yuna-helpdesk.js','utf8'),/바로 저장\(Preview 확인 후\).*담당 메뉴로 안내.*미리보기만: 일정/);
});
test('Ilbo staff portraits use the shared thumbnail assets and retain broken-image fallback',()=>{
 const context=vm.createContext({window:{},console,Date,Intl,Map,Set});
 vm.runInContext(fs.readFileSync('hani-organization-hub.js','utf8'),vm.createContext({window:context.window,document:{getElementById:()=>null}}));
 vm.runInContext(fs.readFileSync('hani-ilbo.js','utf8'),context);
 const issue=JSON.parse(fs.readFileSync('data/hani-ilbo/001.json','utf8'));
 const html=context.window.HaniIlbo.markup(issue,{},null,[],Date.parse('2026-10-19T03:00:00Z'));
 assert.doesNotMatch(html,/hani-staff-/);
 const portraits=[...html.matchAll(/src="(\.\/assets\/profiles\/thumb\/hani-profile-[a-z0-9-]+-128\.webp)"/g)];
 assert.ok(portraits.length>0);for(const m of portraits)assert.ok(fs.existsSync(m[1]),m[1]);
 const avatar={hidden:false};context.window.HaniIlbo.bindImage({querySelector:()=>null,querySelectorAll:()=>[avatar]});avatar.onerror();assert.equal(avatar.hidden,true);
});
