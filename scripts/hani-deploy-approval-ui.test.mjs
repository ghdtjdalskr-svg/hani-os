import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';

// Runs the actual approval/merge functions with isolated DOM and a fake bridge.
// No authentication, real repository merge, or protected user storage is used.
const root=process.cwd();
const source=fs.readFileSync(path.join(root,'hani-main.js'),'utf8');
const functions=source.slice(source.indexOf('let deployApprovalPending=false;'),source.indexOf('async function deployCenterDiscard(){'));
assert(functions.startsWith('let deployApprovalPending=false;'));
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const markup=index.match(/<dialog id="deployApprovalDialog"[\s\S]*?<\/dialog>/)?.[0];
assert(markup);
const css=[...index.matchAll(/<link[^>]*href="\.\/([^"?]+\.css)(?:\?[^" ]*)?"[^>]*>/g)].map(m=>fs.readFileSync(path.join(root,m[1]),'utf8')).join('\n')+'\n'+[...index.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
const fixture=`<!doctype html><html lang="ko"><meta charset="utf-8"><title>배포 확인 화면 · 가상 후보 검증</title><style>${css}</style><body><main style="padding:24px"><h2>배포 확인 화면 미리보기</h2><p>가상 후보입니다. 실제 배포·로그인·데이터 저장은 실행하지 않습니다.</p><button id="start" class="deploy-btn safe">가상 후보 배포 확인</button><div id="deployMergeResult" role="status"></div></main>${markup}<script>
const $=id=>document.getElementById(id),esc=s=>String(s),deployShortSha=s=>String(s||'').slice(0,12);
const HANI_DISPLAY_VERSION='preview';
let calls=[],mergeResponse={pr_number:999,production_readback:'PASS',merged_sha:'b'.repeat(40)},bridgeError=false;
let deployRuntime={};
function resetFixture(){deployRuntime={busy:false,merged:null,qa:{state:'HINA_QA_PASS'},stage:{pr_number:999,release_commit_sha:'a'.repeat(40),html_sha256:'c'.repeat(64),candidate_version:'2.9.184',branch:'hani/release-example',ready_for_approval:true}};calls=[];bridgeError=false;mergeResponse.production_readback='PASS';$('deployMergeResult').textContent='';}
function deploySetBusy(b){deployRuntime.busy=b}
function haniWorkShow(){} function haniWorkFinish(){} function deploySaveSession(){}
async function deployBridgeApi(action,payload){calls.push({action,payload});if(action==='merge_release'){await new Promise(r=>setTimeout(r,20));if(bridgeError)throw Error('가상 서버 검증 실패');return {...mergeResponse}}return {items:[]}}
${functions}
resetFixture();$('start').onclick=()=>deployCenterMerge();
</script></body></html>`;
fs.mkdirSync('qa-evidence',{recursive:true});
fs.writeFileSync('qa-evidence/deploy-approval-preview.html',fixture);
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fixture)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const browser=await chromium.launch({executablePath:process.argv[3],headless:true});
const results=[];
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});
  await context.route('**/*',route=>new URL(route.request().url()).origin===`http://127.0.0.1:${server.address().port}`?route.continue():route.abort());
  const page=await context.newPage();
  const errors=[];let nativeDialogs=0;
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{nativeDialogs++;await d.dismiss()});
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const reset=async()=>{await page.waitForFunction(()=>!deployApprovalPending);await page.evaluate(()=>resetFixture())};
  const start=async()=>{await page.locator('#start').click();await page.locator('#deployApprovalDialog').waitFor({state:'visible'})};
  const confirm=()=>page.locator('#deployApprovalConfirm').click();
  const merges=()=>page.evaluate(()=>calls.filter(c=>c.action==='merge_release'));
  await start();
  assert.equal(await page.locator('#deployApprovalCandidate').innerText(),'v2.9.184 · PR #999 · 후보 aaaaaaaaaaaa');
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'취소');
  assert(await page.locator('#deployApprovalDialog').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}));
  await page.screenshot({path:`qa-evidence/deploy-approval-${width}.png`});
  await page.getByRole('button',{name:'취소',exact:true}).click();assert.equal((await merges()).length,0);
  await reset();await start();await page.keyboard.press('Escape');assert.equal((await merges()).length,0);
  for(const mutation of ['head','pr','hash','version','branch','qa','ready','reset','busy','merged']){
   await reset();await start();
   await page.evaluate(kind=>{if(kind==='head')deployRuntime.stage.release_commit_sha='d'.repeat(40);if(kind==='pr')deployRuntime.stage.pr_number=1000;if(kind==='hash')deployRuntime.stage.html_sha256='d'.repeat(64);if(kind==='version')deployRuntime.stage.candidate_version='2.9.185';if(kind==='branch')deployRuntime.stage.branch='hani/release-other';if(kind==='qa')deployRuntime.qa.state='BLOCKED';if(kind==='ready')deployRuntime.stage.ready_for_approval=false;if(kind==='reset')deployRuntime.stage=null;if(kind==='busy')deployRuntime.busy=true;if(kind==='merged')deployRuntime.merged={}},mutation);
   await confirm();assert.equal((await merges()).length,0,mutation+' must block');
  }
  for(const mutation of ['noHead','noQA','busy','merged']){
   await reset();await page.evaluate(kind=>{if(kind==='noHead')deployRuntime.stage.release_commit_sha='';if(kind==='noQA')deployRuntime.qa=null;if(kind==='busy')deployRuntime.busy=true;if(kind==='merged')deployRuntime.merged={}},mutation);
   await page.locator('#start').click();assert.equal(await page.locator('#deployApprovalDialog').isVisible(),false);assert.equal((await merges()).length,0);
  }
  await reset();await start();await page.evaluate(()=>deployCenterMerge());await confirm();
  await page.waitForFunction(()=>deployRuntime.merged!==null&&!deployRuntime.busy);
  assert.deepEqual(await merges(),[{action:'merge_release',payload:{pr_number:999,expected_head_sha:'a'.repeat(40)}}]);
  await page.locator('#start').click();assert.equal((await merges()).length,1);
  await reset();await page.evaluate(()=>bridgeError=true);await start();await confirm();
  await page.waitForFunction(()=>!deployRuntime.busy&&$('deployMergeResult').textContent.includes('가상 서버 검증 실패'));
  assert.equal(await page.evaluate(()=>deployRuntime.merged),null);
  await reset();await page.evaluate(()=>mergeResponse.production_readback='FAIL');await start();await confirm();
  await page.waitForFunction(()=>!deployRuntime.busy&&$('deployMergeResult').textContent.includes('배포 실패'));
  assert.equal((await merges()).length,1);
  assert.equal(nativeDialogs,0);assert.deepEqual(errors,[]);
  results.push({width,state:'PASS',cancel:true,escape:true,candidateChangesBlocked:10,invalidStatesBlocked:4,singleExactMerge:true,serverFailureBlocked:true,readbackFailureVisible:true,nativeDialogs,errors});
  await context.close();
 }
 fs.writeFileSync('qa-evidence/deploy-approval-ui.json',JSON.stringify(results,null,2));
 console.log('PASS: 390/1440 approval dialog, cancellation, candidate changes, exact single merge, server/read-back failures; no native dialog or production writes.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
