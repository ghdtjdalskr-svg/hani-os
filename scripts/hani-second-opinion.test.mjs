import {installCloudTransport} from './hani-cloud-transport-fixture.cjs';
// Synthetic fixtures only; execute directly with Node 24+ (no network/DB/storage writes).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {stripTypeScriptTypes, createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
const require = createRequire(import.meta.url);
const C = require('../hani-investment-committee.js');
const fixture = require('./fixtures/investment-research-mock.json');
const edge = fs.readFileSync(new URL('../supabase/functions/hani-second-opinion/index.ts',import.meta.url),'utf8');
const client = fs.readFileSync(new URL('../hani-investment-committee.js',import.meta.url),'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function server(options={}) {
  let handler, now=0, calls=[], logs=[], timer;
  // Runtime-generated sentinel, never a real API credential and never printed.
  const sentinel=randomUUID();
  const env={SUPABASE_URL:'https://auth.example.test',SUPABASE_ANON_KEY:'fixture-public',HANI_OWNER_USER_ID:'owner',GEMINI_API_KEY:sentinel,...options.env};
  class Clock extends Date {static now(){return now;}}
  const context=vm.createContext({Request,Response,AbortController,Date:Clock,
    setTimeout:(callback,delay)=>{timer={callback,delay};return 1;},clearTimeout:()=>{timer=null;},
    console:Object.fromEntries(['log','warn','error','info','debug'].map(method=>[method,(...args)=>logs.push(args.join(' '))])),
    Deno:{env:{get:name=>env[name]},serve:fn=>{handler=fn;}},
    createClient:(url,key,cfg)=>{
      assert.equal(url,env.SUPABASE_URL);assert.equal(key,env.SUPABASE_ANON_KEY);
      assert.equal(cfg.global.headers.Authorization,'Bearer fixture-session');
      assert.equal(cfg.auth.persistSession,false);
      return {auth:{getUser:async()=>{if(options.authThrows)throw Error(sentinel);return {data:{user:options.user===undefined?{id:'owner'}:options.user},error:options.authError||null};}}};
    },
    fetch:async(url,config)=>{
      calls.push({url,config});
      assert.ok(!url.includes(sentinel),'credential must never enter URL');
      assert.ok(config.headers['x-goog-api-key']===sentinel,'server credential header');
      assert.equal(timer.delay,60000);
      if(options.fetch) return options.fetch(url,config,timer,sentinel);
      return new Response(JSON.stringify(options.payload||{candidates:[{content:{parts:[{text:'fixture response'}]}}]}),{status:options.status||200});
    },
  });
  vm.runInContext(stripTypeScriptTypes(edge.replace(/^import .*;\r?\n/m,'')),context);
  return {calls,logs,env,advance:ms=>{now+=ms;},get timer(){return timer;},
    async request(body={prompt:' exact\nfixture prompt '},auth='Bearer fixture-session',method='POST') {
      const response=await handler(new Request('https://edge.example.test',{method,headers:auth?{Authorization:auth}:{},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})}));
      const raw=await response.text();
      assert.ok(!raw.includes(sentinel),'response must not expose credential');
      assert.ok(!logs.join('\n').includes(sentinel),'logs must not expose credential');
      return {status:response.status,headers:response.headers,body:raw==='ok'?raw:JSON.parse(raw)};
    },
  };
}

test('server POST/CORS and verified JWT are required before Gemini',async()=>{
  const s=server();
  assert.equal((await s.request({},null,'GET')).status,405);
  const preflight=await s.request({},null,'OPTIONS');assert.equal(preflight.status,200);
  assert.equal(preflight.headers.get('access-control-allow-methods'),'POST, OPTIONS');
  for(const auth of [null,'','fixture-session','Bearer '])assert.equal((await s.request({},auth)).status,401);
  for(const options of [{user:null},{authError:{message:'invalid'}},{authThrows:true}])assert.equal((await server(options).request()).status,401);
  assert.equal(s.calls.length,0);
});
test('owner allowlist rejects other users and fails closed when unset',async()=>{
  for(const options of [{user:{id:'other',user_metadata:{owner:true}}},{env:{HANI_OWNER_USER_ID:''}}]){
    const s=server(options),r=await s.request();assert.equal(r.status,options.user?403:503);assert.equal(s.calls.length,0);
  }
});
test('prompt type, blank, malformed JSON and 60000 char boundary',async()=>{
  const s=server();
  for(const body of [{},null,{prompt:12},{prompt:[]},{prompt:' \n '},'{bad'])assert.equal((await s.request(body)).status,400);
  const long=await s.request({prompt:'x'.repeat(60001)});assert.equal(long.body.code,'PROMPT_TOO_LONG');assert.equal(s.calls.length,0);
  assert.equal((await s.request({prompt:'x'.repeat(60000)})).status,200);
});
test('missing Gemini key is 503 after auth and validation',async()=>{
  const s=server({env:{GEMINI_API_KEY:''}}),r=await s.request();
  assert.deepEqual(r.body,{ok:false,code:'GEMINI_KEY_MISSING'});assert.equal(r.status,503);assert.equal(s.calls.length,0);
});
test('success preserves exact prompt, header credential, temperature and model; joins output text only',async()=>{
  const s=server({env:{GEMINI_MODEL:'gemini-fixture'},payload:{candidates:[{content:{parts:[{text:'ignored',thought:true},{text:' first '},{text:'second '}]}}]}});
  const prompt=' exact\nfixture prompt ',r=await s.request({prompt});
  assert.deepEqual(r.body,{ok:true,text:'first second',model:'gemini-fixture'});
  assert.equal(s.calls[0].url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-fixture:generateContent');
  const sent=JSON.parse(s.calls[0].config.body);assert.equal(sent.contents[0].parts[0].text,prompt);assert.equal(sent.generationConfig.temperature,0.4);
  assert.equal(s.timer,null);
  assert.equal((await server().request()).body.model,'gemini-flash-latest');
});
test('quota 429 and upstream failures expose status/code only, no upstream body or thrown error',async()=>{
  for(const status of [429,400,500]){
    const s=server({status,payload:{error:{message:'upstream private detail'}}}),r=await s.request();
    assert.deepEqual(r.body,{ok:false,code:status===429?'GEMINI_QUOTA':'GEMINI_UPSTREAM',status});assert.equal(r.status,status===429?429:502);
  }
  for(const fetch of [async(_,cfg,timer,sentinel)=>{throw Error(sentinel);},async()=>new Response('{bad'),async(_,cfg,timer,sentinel)=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:sentinel}]}}]}))]){
    const s=server({fetch}),r=await s.request();assert.equal(r.status,502);assert.equal(r.body.code,'GEMINI_UPSTREAM');assert.equal(s.logs.length,0);assert.equal(s.timer,null);
  }
  assert.equal((await server({payload:{candidates:[]}}).request()).status,502);
});
test('timeout aborts upstream and clears timer',async()=>{
  const s=server({fetch:async(_,cfg,timer)=>{timer.callback();assert.equal(cfg.signal.aborted,true);throw Error('abort');}});
  assert.equal((await s.request()).status,502);assert.equal(s.timer,null);
});
test('rate limit reserves slots before fetch, caps failures too, expires and separates users',async()=>{
  const s=server({status:500});
  for(let i=0;i<6;i++)assert.equal((await s.request()).status,502);
  assert.deepEqual((await s.request()).body,{ok:false,code:'RATE_LIMIT'});assert.equal(s.calls.length,6);
  s.advance(600000);assert.equal((await s.request()).status,502);
  vm.runInNewContext(stripTypeScriptTypes(edge.slice(edge.indexOf('const requests ='),edge.indexOf('Deno.serve')))+'\n'+
    'for(let i=0;i<6;i++) if(!allowRequest("a"))throw Error("early"); if(allowRequest("a"))throw Error("limit"); if(!allowRequest("b"))throw Error("per-user");',{Date});
});

// Execute the actual toolbar, session invoker, parser, card renderer and canonical
// delegated click handler. Only unrelated view scaffolding is stubbed.
class Element {
  constructor(dataset={}){this.dataset=dataset;this.disabled=false;this.open=false;this.value='';this.textContent='';this.attrs={};this.nodes=new Map();}
  set innerHTML(value){this.html=value;for(const match of value.matchAll(/<button\b[^>]*data-ic="([^"]+)"[^>]*>([^<]*)<\/button>/g)){
    const el=new Element({ic:match[1]});el.textContent=match[2];el.disabled=/\sdisabled(?:\s|>)/.test(match[0]);el.title=(match[0].match(/title="([^"]*)"/)||[])[1]||'';this.nodes.set('[data-ic="'+match[1]+'"]',el);
  }}
  get innerHTML(){return this.html||'';}
  querySelector(selector){if(!this.nodes.has(selector))this.nodes.set(selector,new Element());return this.nodes.get(selector);}
  setAttribute(key,value){this.attrs[key]=value;}
  addEventListener(type,fn){if(type==='click')this.clickHandler=fn;}
  closest(selector){return selector==='[data-ic]'?this:null;}
  close(){this.open=false;}
  showModal(){this.open=true;}
  focus(){}
  before(){}
}
function section(start,end){const a=client.indexOf(start),b=client.indexOf(end,a);assert.ok(a>=0&&b>a,'client anchors');return client.slice(a,b);}
function harness(options={}) {
  const host=new Element(),state={investmentResearchCards:fixture.cards.slice(0,2).map((card,i)=>({...C.normalizeCard(card),id:'r'+i})),investmentResearchHistory:[],investmentCommitteeSnapshots:[]};
  let copies=[],calls=[],saves=0,serial=0;
  const context=vm.createContext({...C,host,state,Map,Date,structuredClone,
    cloudUser:{id:'owner'},cloudClient:{auth:{getSession:async()=>options.session||{data:{session:{access_token:'fixture-session',user:{id:'owner'}}},error:null}}},
    cloudConfig:()=>({url:'https://edge.example.test',key:'fixture-public'}),
    accountIdentity:()=>context.cloudUser?.id||null,
    navigator:{clipboard:{writeText:async text=>{copies.push(text);}}},importDialog:new Element(),
    clone:plain,same:(a,b)=>JSON.stringify(a)===JSON.stringify(b),esc:value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),text:value=>String(value||''),
    notice:text=>{host.querySelector('.ic-notice').textContent=text;},
    renderSettings:()=>{},renderProgress:()=>{},renderMonthly:()=>{},renderCardSummary:()=>{},
    holdings:()=>[],prices:()=>({}),labels:{OWNED:'보유',WATCH:'관심'},pill:()=>'',priceHtml:()=>'',percent:()=>'',accumulationBadge:()=>'',
    uid:()=>`mock-${++serial}`,framework:C.FRAMEWORK,confirm:()=>options.confirm!==false,
    commit:()=>{saves++;return true;},save:()=>{saves++;return true;},localStorage:{setItem:()=>{saves++;},removeItem:()=>{saves++;}},
    fetch:async(url,cfg)=>{calls.push({url,cfg});return options.fetch?options.fetch(url,cfg):new Response(JSON.stringify({ok:true,text:opinionText(state.investmentResearchCards),model:'fixture'}));},
  });
  const markup=client.split(/\r?\n/).find(line=>line.startsWith('  host.innerHTML ='));
  installCloudTransport(context,{endpoint:'hani-second-opinion',token:'fixture-session'});
  vm.runInContext(markup+'\n'+
    section('  let secondOpinions =','  function renderCardSummary(')+'\n'+
    section('  function render() {','  async function refreshPrices(')+'\n'+
    section('  async function copyPrompt(','  function openImport(')+'\n'+
    section("  host.addEventListener('click', async event => {","  host.querySelector('[data-ic-status]').addEventListener"),context);
  host.querySelector('[data-ic-status]').value='ACTIVE';context.render();
  return {context,host,state,copies,calls,get saves(){return saves;},click:(action,researchId)=>{const button=(action==='parse-second'?host.querySelector('.ic-second-import'):action==='parse-final'?host.querySelector('.ic-final-import'):host).querySelector('[data-ic="'+action+'"]');button.dataset.ic=action;if(researchId)button.dataset.research=researchId;return host.clickHandler({target:button});}};
}
function opinionText(cards){return JSON.stringify(cards.map(card=>({researchId:card.id,agreeWithRating:'partly',concerns:['fixture concern'],missingRisks:[],fairValueSanity:{verdict:'reasonable',reason:'fixture reason'},oneLine:'fixture <unsafe> opinion'})));}

test('client toolbar renders adjacent auto/copy buttons, signed-out disabled tooltip and no invocation',async()=>{
  const h=harness(),button=h.host.querySelector('[data-ic="ask-second"]');
  assert.match(h.host.innerHTML,/Gemini 2차 의견 요청 복사<\/button><button[^>]*data-ic="ask-second"/);
  assert.equal(button.textContent,'✨ Gemini에게 바로 묻기');assert.equal(button.disabled,false);
  h.context.cloudUser=null;h.context.render();assert.equal(button.disabled,true);assert.match(button.title,/로그인/);
  await h.click('ask-second');assert.equal(h.calls.length,0);assert.equal(h.saves,0);
});
test('auto invoker sends exact copy prompt and session headers; success renders escaped read-only panel with zero saves',async()=>{
  const h=harness(),before=JSON.stringify(h.state);
  await h.click('copy-second');await h.click('ask-second');
  assert.equal(h.calls.length,1);assert.equal(h.calls[0].url,'https://edge.example.test/functions/v1/hani-second-opinion');
  assert.equal(JSON.parse(h.calls[0].cfg.body).prompt,h.copies[0]);assert.equal(h.copies[0],C.buildSecondOpinionPrompt(h.state.investmentResearchCards));
  assert.equal(h.calls[0].cfg.headers.Authorization,'Bearer fixture-session');assert.equal(h.calls[0].cfg.headers.apikey,'fixture-public');
  const rendered=h.host.querySelector('.ic-list').innerHTML;
  assert.match(rendered,/ic-second-opinion/);assert.match(rendered,/읽기 전용/);assert.match(rendered,/&lt;unsafe>/);assert.match(rendered,/data-ic="save-second"/);
  assert.equal(h.saves,0);assert.equal(JSON.stringify(h.state),before);assert.equal(h.host.querySelector('[data-ic="ask-second"]').disabled,false);
});
test('manual parse uses same renderer and remains available on auto errors',async()=>{
  for(const code of ['GEMINI_KEY_MISSING','GEMINI_QUOTA','RATE_LIMIT','OWNER_ACCESS_DENIED','GEMINI_UPSTREAM']){
    const h=harness({fetch:async()=>new Response(JSON.stringify({ok:false,code}),{status:503})}),before=JSON.stringify(h.state);
    await h.click('ask-second');assert.match(h.host.querySelector('.ic-notice').textContent,/웹 Gemini/);
    assert.equal(h.host.querySelector('[data-ic="copy-second"]').disabled,false);await h.click('copy-second');
    await h.click('import-second');h.host.querySelector('.ic-second-import').querySelector('[data-ic-second]').value=opinionText(h.state.investmentResearchCards);
    await h.click('parse-second');assert.match(h.host.querySelector('.ic-list').innerHTML,/ic-second-opinion/);
    assert.equal(h.saves,0);assert.equal(JSON.stringify(h.state),before);
  }
});
test('in-flight loading disables repeat invocation; invalid response cannot persist',async()=>{
  let resolve;const h=harness({fetch:()=>new Promise(done=>{resolve=done;})}),button=h.host.querySelector('[data-ic="ask-second"]');
  const pending=h.click('ask-second');await new Promise(setImmediate);
  assert.equal(button.disabled,true);assert.match(button.textContent,/セ|세린 연구원이 Gemini에게 물어보는 중/);assert.equal(button.attrs['aria-busy'],'true');
  await h.click('ask-second');assert.equal(h.calls.length,1);
  resolve(new Response(JSON.stringify({ok:true,text:'invalid JSON'})));await pending;
  assert.equal(button.disabled,false);assert.equal(h.saves,0);assert.doesNotMatch(h.host.querySelector('.ic-list').innerHTML,/ic-second-opinion/);
});
test('stale cards, switched account and switch-away/back discard automatic result',async()=>{
  for(const mutate of [h=>{h.state.investmentResearchCards[0].rating='EXIT';},h=>{h.context.cloudUser={id:'other'};},h=>{h.context.cloudUser=null;h.context.render();h.context.cloudUser={id:'owner'};h.context.render();}]){
    let resolve;const h=harness({fetch:()=>new Promise(done=>{resolve=done;})});
    const raw=opinionText(h.state.investmentResearchCards),pending=h.click('ask-second');await new Promise(setImmediate);
    mutate(h);resolve(new Response(JSON.stringify({ok:true,text:raw})));await pending;
    assert.equal(h.saves,0);assert.doesNotMatch(h.host.querySelector('.ic-list').innerHTML,/ic-second-opinion/);assert.match(h.host.querySelector('.ic-notice').textContent,/변경|바뀌/);
  }
});
test('mismatched/expired sessions never send a prompt',async()=>{
  for(const session of [{data:{session:null},error:null},{data:{session:{access_token:'fixture-session',user:{id:'other'}}},error:null},{data:{session:null},error:{message:'expired'}}]){
    const h=harness({session});await h.click('ask-second');assert.equal(h.calls.length,0);assert.equal(h.saves,0);assert.match(h.host.querySelector('.ic-notice').textContent,/로그인/);
  }
});
test('network and unreadable server responses show Korean fallback and re-enable button',async()=>{
  for(const fetch of [async()=>{throw Error('transport detail');},async()=>new Response('invalid')]){
    const h=harness({fetch}),before=JSON.stringify(h.state);await h.click('ask-second');
    assert.match(h.host.querySelector('.ic-notice').textContent,/웹 Gemini/);assert.doesNotMatch(h.host.querySelector('.ic-notice').textContent,/transport detail/);
    assert.equal(h.host.querySelector('[data-ic="ask-second"]').disabled,false);await h.click('copy-second');assert.equal(h.copies.length,1);
    assert.equal(h.saves,0);assert.equal(JSON.stringify(h.state),before);
  }
});
test('new endpoint is read-only, has no credential literals/logs and no duplicate IDs/storage/DB paths',()=>{
  assert.doesNotMatch(edge.replace('requests.delete(id)',''),/console\.|\.from\(|\.(?:insert|update|delete|upsert)\(|service_role|localStorage|\.clear\(/);
  assert.doesNotMatch(client,/\.clear\(/);
  const ids=[...client.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(new Set(ids).size,ids.length);
});

function finalText(cards){return JSON.stringify(cards.map((c,i)=>({ticker:c.ticker,name:c.name,final_rating:i?'하향':'유지',changed:!!i,accepted:['환율 <반영> · 가정 점검'],rejected:[{point:'과도한 우려',reason:'공시 근거 <script>'}],rationale:['경쟁력 확인','추정 보수화','추가 실적 확인'],next_checks:['다음 실적 발표']})));}
test('canonical final copy/import/render paths stay memory-only, then existing memo click saves both opinions once',async()=>{
 const h=harness();
 // Persisted cards already have a review date, as in the existing report save path.
 h.state.investmentResearchCards.forEach(c=>{c.lastReviewedAt='2026-10-11';c.createdAt='2026-10-11T00:00:00Z';});
 h.context.render();assert.equal(h.host.querySelector('.ic-final-tools').hidden,true);
 const before=JSON.stringify(h.state);
 await h.click('ask-second');assert.equal(h.host.querySelector('.ic-final-tools').hidden,false);
 await h.click('copy-final');assert.equal(h.copies.length,1);
 assert.match(h.copies[0],/"hani_original_report"/);assert.match(h.copies[0],/fixture concern/);assert.match(h.copies[0],/"final_rating"/);
 await h.click('import-final');const dialog=h.host.querySelector('.ic-final-import');assert.equal(dialog.open,true);
 dialog.querySelector('[data-ic-final]').value='```json\n'+finalText(h.state.investmentResearchCards)+'\n```';
 await h.click('parse-final');assert.equal(dialog.open,false);
 const html=h.host.querySelector('.ic-list').innerHTML;
 assert.equal([...html.matchAll(/class="ic-final-opinion"/g)].length,2);
 assert.equal([...html.matchAll(/class="ic-review-summary"/g)].length,2);
 assert.equal([...html.matchAll(/class="ic-review-details"/g)].length,2);
 assert.match(html,/ic-review-clamp/);
 assert.match(html,/반영 1/);assert.match(html,/기각 1/);
 assert.match(html,/ic-final-rating">유지/);assert.match(html,/ic-final-rating">하향/);
 assert.equal([...html.matchAll(/class="ic-final-changed"/g)].length,1);
 assert.match(html,/하니 최종 의견 \(대표님 채팅에서 받은 답\)/);assert.match(html,/환율 &lt;반영>/);assert.match(html,/공시 근거 &lt;script>/);
 assert.equal(h.saves,0);assert.equal(JSON.stringify(h.state),before);
 await h.click('save-second','r0');assert.equal(h.saves,1,h.host.querySelector('.ic-notice').textContent);
 const memo=h.state.investmentResearchCards[0].valuationNote;
 assert.match(memo,/세린 연구원 2차 의견 · Gemini/);assert.match(memo,/하니 최종 의견 \(대표님 채팅에서 받은 답\)/);assert.match(memo,/다음 실적 발표/);
 await h.click('save-second','r0');assert.equal(h.saves,1);assert.match(h.host.querySelector('.ic-notice').textContent,/이미 메모/);
});
test('invalid/stale final paste and dismissed memo confirmation never save; new critique/account clears final UI',async()=>{
 const h=harness({confirm:false});await h.click('ask-second');await h.click('copy-final');await h.click('import-final');
 const dialog=h.host.querySelector('.ic-final-import');dialog.querySelector('[data-ic-final]').value='broken';
 await h.click('parse-final');assert.match(h.host.querySelector('.ic-notice').textContent,/JSON 배열.*붙여넣으세요/);assert.equal(h.saves,0);
 dialog.querySelector('[data-ic-final]').value=finalText(h.state.investmentResearchCards);await h.click('parse-final');
 await h.click('save-second','r0');assert.equal(h.saves,0);
 h.state.investmentResearchCards[0].rating='EXIT';await h.click('import-final');await h.click('parse-final');
 assert.match(h.host.querySelector('.ic-notice').textContent,/종목이나 Gemini 의견이 바뀌/);assert.equal(h.saves,0);
 await h.click('ask-second');assert.doesNotMatch(h.host.querySelector('.ic-list').innerHTML,/ic-final-opinion/);
 await h.click('import-final');h.context.cloudUser={id:'other'};h.context.render();
 assert.equal(dialog.open,false);assert.equal(dialog.innerHTML,'');assert.equal(h.host.querySelector('.ic-final-tools').hidden,true);assert.equal(h.saves,0);
});
