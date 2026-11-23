// Current production source, executed as-is. No historical preload in this file.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('hani-toons.js',root),'utf8');
const address='./assets/data/hani-toons-v1.json';
const item=(id,series='시리즈 A',extra={})=>({id,series,title:'제목 '+id,date:'2026-11-23',thumb:id,parts:[id],...extra});
function boot(t,data,{failure=null,responseOk=true,jsonFailure=false}={}){
 let storage=0,scrolls=0;
 const calls=[],listeners=new Map();
 const node={innerHTML:'',contains:target=>target.owner===node,addEventListener(type,handler){assert.equal(type,'click');assert.equal(listeners.has(type),false,'one canonical listener');listeners.set(type,handler)}};
 const document={documentElement:{scrollTop:99},querySelector(selector){assert.equal(selector,'#hanitoon [data-toon-root]');return node}};
 const window={scrollTo(){scrolls++}};
 const context={window,document,fetch:async (...args)=>{assert.deepEqual(args,[address],'one literal local GET with no write options');const [url]=args;calls.push(url);if(failure)throw failure;return {ok:responseOk,json:async()=>{if(jsonFailure)throw Error('bad JSON');return data}}}};
 for(const owner of [window,context])for(const key of ['localStorage','sessionStorage'])Object.defineProperty(owner,key,{get(){storage++;throw Error('forbidden storage access')}});
 vm.runInNewContext(source,context,{filename:'hani-toons.js'});
 t.after(()=>assert.equal(storage,0,'localStorage/sessionStorage access count'));
 const click=(attribute,value='')=>{
  const button={owner:node,disabled:false,getAttribute:name=>name===attribute?value:null,closest:selector=>selector==='['+attribute+']'?button:null};
  listeners.get('click')({target:button});
 };
 return {node,calls,click,api:window.HaniToons,get scrolls(){return scrolls},get storage(){return storage}};
}
const rows=html=>(html.match(/class="toon-list-item"/g)||[]).length;

test('정상 목록의 행·시리즈 칩·총 N화와 실제 필터 이벤트',async t=>{
 const app=boot(t,{v:1,items:[item('a'),item('b'),item('c','시리즈 B')]});
 await app.api.enter();
 assert.equal(rows(app.node.innerHTML),3);
 assert.equal((app.node.innerHTML.match(/class="toon-chip"/g)||[]).length,3);
 assert.match(app.node.innerHTML,/data-toon-series="시리즈 A"/);assert.match(app.node.innerHTML,/data-toon-series="시리즈 B"/);
 assert.match(app.node.innerHTML,/총 3화/);
 app.click('data-toon-series','시리즈 A');assert.equal(rows(app.node.innerHTML),2);assert.match(app.node.innerHTML,/총 3화/);
 app.click('data-toon-series');assert.equal(rows(app.node.innerHTML),3);
 app.click('data-toon-open','a');assert.match(app.node.innerHTML,/class="toon-reader"/);assert.match(app.node.innerHTML,/src="assets\/toons\/a.webp"/);assert.equal(app.scrolls,1);
 app.click('data-toon-list');assert.equal(rows(app.node.innerHTML),3);
});

test('잘못된 id 및 thumb/parts 이름(경로·주소·확장자 포함)과 중복 id를 버린다',async t=>{
 const invalid=[...['../bad','Bad','a'.repeat(41),'','http:bad'].map((id,i)=>item(id,'거절-'+i))];
 for(const field of ['thumb','parts'])for(const value of ['../bad','http://example.test/bad','bad.png','bad?q=1','bad\\x','assets/toons/bad.webp','Bad','',7]){
  const id='bad-'+invalid.length;invalid.push(item(id,'거절-'+id,{[field]:field==='parts'?[value]:value}));
 }
 invalid.push(item('empty','거절-empty',{parts:[]}),null,item('good','중복시리즈'));
 const app=boot(t,{v:1,items:[item('good','허용시리즈'),...invalid]});await app.api.enter();
 assert.equal(rows(app.node.innerHTML),1);assert.match(app.node.innerHTML,/총 1화/);assert.doesNotMatch(app.node.innerHTML,/거절-|중복시리즈/);
});

test('fetch 네트워크·HTTP·JSON 실패는 안내 문구를 표시한다',async t=>{
 for(const options of [{failure:Error('offline')},{responseOk:false},{jsonFailure:true}]){
  const app=boot(t,{v:1,items:[]},options);await app.api.enter();assert.match(app.node.innerHTML,/웹툰을 불러오지 못했어요/);assert.equal(rows(app.node.innerHTML),0);assert.equal(app.calls.length,1);
 }
});

test('정상 로드의 동시 진입·재진입은 fetch 1회만 수행한다',async t=>{
 const app=boot(t,{v:1,items:[item('a')]});await Promise.all([app.api.enter(),app.api.enter()]);await app.api.enter();
 assert.deepEqual(app.calls,[address]);assert.equal(rows(app.node.innerHTML),1);
});

test('fetch 실패 뒤 재진입하면 한 번 다시 시도한다(실패를 기억해 두지 않음)',async t=>{
 const app=boot(t,null,{failure:Error('offline')});await app.api.enter();assert.equal(app.calls.length,1);await app.api.enter();
 assert.match(app.node.innerHTML,/웹툰을 불러오지 못했어요/);
 assert.deepEqual(app.calls,[address,address],'재진입 1번에 요청 1번만');
});

test('제목·시리즈 script/따옴표는 목록·칩 속성·리더에서 이스케이프된다',async t=>{
 const title='<script>"title" & \'x\'</script>',series='<script>"series" & \'s\'</script>';
 const app=boot(t,{v:1,items:[item('safe',series,{title})]});await app.api.enter();
 for(const html of [app.node.innerHTML]){
  assert.doesNotMatch(html,/<script>|<\/script>/i);assert.match(html,/&lt;script&gt;&quot;title&quot; &amp; &#39;x&#39;&lt;\/script&gt;/);
  assert.match(html,/data-toon-series="&lt;script&gt;&quot;series&quot; &amp; &#39;s&#39;&lt;\/script&gt;"/);
 }
 app.click('data-toon-open','safe');assert.doesNotMatch(app.node.innerHTML,/<script>|<\/script>/i);assert.match(app.node.innerHTML,/&lt;script&gt;&quot;series&quot;/);assert.match(app.node.innerHTML,/alt="&lt;script&gt;&quot;title&quot;/);
});

test('현재 owner에는 fetch 주소 리터럴이 있고 실제 요청도 동일하다; 저장소 접근 0',async t=>{
 assert.ok(source.includes("fetch('./assets/data/hani-toons-v1.json')"));
 const app=boot(t,{v:1,items:[]});await app.api.enter();await app.api.enter();assert.deepEqual(app.calls,[address]);assert.equal(app.storage,0);assert.match(app.node.innerHTML,/아직 등록된 웹툰이 없어요/);
});

test('실제 JSON 22편은 그림 이름만 담고, 이름에 해당하는 실제 파일이 모두 있다',()=>{
 const text=fs.readFileSync(new URL('assets/data/hani-toons-v1.json',root),'utf8'),catalog=JSON.parse(text);
 assert.doesNotMatch(text,/\.webp|assets\//,'배포 closure가 그림을 끌어오지 않도록 JSON에 파일 경로 없음');
 assert.equal(catalog.v,1);assert.equal(catalog.items.length,22);assert.equal(new Set(catalog.items.map(row=>row.id)).size,22);
 const rootPath=fileURLToPath(root);
 for(const row of catalog.items){assert.match(row.id,/^[a-z0-9-]{1,40}$/);assert.ok(row.parts.length>0);for(const name of [row.thumb,...row.parts])assert.match(name,/^[a-z0-9-]{1,60}$/,'경로가 아닌 이름만');for(const file of ['assets/toons/thumb/'+row.thumb+'.webp',...row.parts.map(n=>'assets/toons/'+n+'.webp')]){
  const absolute=path.resolve(rootPath,file);assert.ok(absolute.startsWith(rootPath));const stat=fs.statSync(absolute);assert.ok(stat.isFile()&&stat.size>0,row.id+' '+file);
 }}
});
