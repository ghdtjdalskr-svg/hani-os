// Synthetic fixtures only; real client handlers and server handler, no network/user data.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {createLoungeHandler,validateComments} from '../supabase/functions/hani-lounge-ai/handler.mjs';
const root=new URL('../',import.meta.url),read=f=>fs.readFileSync(new URL(f,root),'utf8');
const plain=x=>JSON.parse(JSON.stringify(x));
const staff=['hani','hina','yuri','yuna'].map((id,i)=>({id,name:['하니','히나','유리','유나'][i],rank:'사원',team:'생활',voice:'차분하고 정중한 존댓말'}));
const input={mode:'thread',post:{id:'earphone',title:'이어폰이 고장났어요',body:'왼쪽에서 소리가 안 나서 속상해요.',authorId:staff[0].id,category:'LOUNGE',createdAt:'2026-10-16T00:00:00Z'},comments:[],staff,limit:4};
const row=(authorId,body,parentIndex=null,delayMinutes=3)=>({authorId,body,parentIndex,delayMinutes});
const good=[row('hina','한쪽만 조용해지면 참 허전하죠.'),row('yuri','갑자기 소리가 안 나서 당황스러우셨겠어요. 자주 쓰는 물건이면 더 아쉽죠.',null,12),row('yuna','그 허전한 느낌 저도 공감해요.',0,40)];
function server(options={}){
  let calls=[],time=Date.parse('2026-10-16T14:59:00Z');
  const env={SUPABASE_URL:'https://synthetic.invalid',SUPABASE_ANON_KEY:'public-fixture',HANI_OWNER_USER_ID:'owner',OPENAI_API_KEY:'server-only-fixture',...options.env};
  const handler=createLoungeHandler({env:k=>env[k],authenticatedUser:options.auth||(async()=>({id:'owner'})),now:()=>time,fetch:async(url,request)=>{calls.push({url,...request,body:JSON.parse(request.body)});return options.fetch?options.fetch(url,request):Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({comments:good})}]}]})}});
  const invoke=(body=input,headers={Authorization:'Bearer synthetic'})=>handler(new Request('https://synthetic.invalid',{method:'POST',headers,body:typeof body==='string'?body:JSON.stringify(body)}));
  return {invoke,handler,calls,env,tick:()=>time+=60000};
}
test('server auth, real owner lookup and fail-closed allowlist; no upstream calls',async()=>{
  for(const [options,headers,status,code] of [[{}, {},401,'INVALID_SESSION'],[{auth:async()=>null},undefined,401,'INVALID_SESSION'],[{auth:async()=>{throw Error('private')}},undefined,401,'INVALID_SESSION'],[{auth:async()=>({id:'other'})},undefined,403,'OWNER_ACCESS_DENIED'],[{env:{HANI_OWNER_USER_ID:''}},undefined,503,'OWNER_ACCESS_NOT_CONFIGURED'],[{env:{SUPABASE_URL:''}},undefined,503,'SERVER_CONFIG_ERROR'],[{env:{OPENAI_API_KEY:''}},undefined,503,'OPENAI_SECRET_MISSING']]){
    const s=server(options),res=await s.invoke(input,headers);assert.equal(res.status,status);assert.deepEqual(await res.json(),{ok:false,code});assert.equal(s.calls.length,0);
  }
  const source=read('supabase/functions/hani-lounge-ai/index.ts');
  let authOptions,served;
  const context=vm.createContext({createLoungeHandler,createClient:(url,key,options)=>{assert.equal(url,'https://synthetic.invalid');assert.equal(key,'public-fixture');authOptions=options;return {auth:{getUser:async()=>({data:{user:{id:'not-owner'}},error:null})}}},Deno:{env:{get:k=>server().env[k]},serve:h=>served=h}});
  vm.runInContext(stripTypeScriptTypes(source.replace(/^import .*;\r?\n/gm,'')),context);
  const denied=await served(new Request('https://synthetic.invalid',{method:'POST',headers:{Authorization:'Bearer untrusted'},body:JSON.stringify(input)}));
  assert.equal(denied.status,403);assert.equal(authOptions.global.headers.Authorization,'Bearer untrusted');assert.deepEqual(plain(authOptions.auth),{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false});
  assert.match(read('supabase/config.toml'),/\[functions.hani-lounge-ai\]\s+verify_jwt = true/);
});
test('server JSON contract, Responses request, delays, peer parent and Korean validation',async()=>{
  const s=server(),res=await s.invoke();assert.equal(res.status,200);
  assert.deepEqual(await res.json(),{ok:true,comments:good});
  const req=s.calls[0];assert.equal(req.url,'https://api.openai.com/v1/responses');assert.equal(req.headers.Authorization,'Bearer server-only-fixture');
  assert.equal(req.body.model,'gpt-5.6-luna');assert.equal(req.body.store,false);assert.equal(req.body.text.format.strict,true);
  assert.deepEqual(req.body.text.format.schema.properties.comments.items.properties.authorId.enum,staff.map(s=>s.id));
  assert.equal(JSON.parse(req.body.input).post.body,input.post.body);
  const noise=['님, 안녕하세요.','오빠 괜찮아요.','원문에 적힌 그대로 확인해요.','실제 경기 소식 없이 취향만 얘기해요.','저는 완독했어요.','오늘 최저가 12345원이에요.','English only','<script>위험</script>','씨발 짜증나요.','x'.repeat(161)];
  for(const body of noise)assert.deepEqual(validateComments([row('hina',body)],input),[],body);
  assert.deepEqual(validateComments([row('outsider','괜찮아요.')],input),[]);
  assert.deepEqual(validateComments([row('hina','괜찮아요.',5)],input),[]);
  const cleaned=validateComments([good[0],row('yuri',good[0].body),row('yuna','부모가 사라졌어요.',1),row('hani','따뜻한 차가 생각나네요.',null,999)],input);
  assert.equal(cleaned.length,2);assert.equal(cleaned[1].delayMinutes,180);
  const repaired=validateComments(good.map(c=>({...c,parentIndex:null})),input);assert.equal(repaired[2].parentIndex,0);
  const reply={...input,mode:'reply',limit:2,chairmanComment:{id:'chair-comment',authorId:'chair',body:'어떻게 고칠까요?'}};
  assert.deepEqual(validateComments([row('hina','연결부터 살펴보면 어떨까요?',null,999)],reply),[row('hina','연결부터 살펴보면 어떨까요?',null,3)]);
});
test('server 30 calls per KST owner day reserves concurrency, then rolls over',async()=>{
  const s=server();const responses=await Promise.all(Array.from({length:31},()=>s.invoke()));
  assert.equal(responses.filter(r=>r.status===200).length,30);assert.equal(s.calls.length,30);
  assert.deepEqual(await responses.find(r=>r.status===429).json(),{ok:false,code:'DAILY_CAP'});
  s.tick();assert.equal((await s.invoke()).status,200);assert.equal(s.calls.length,31);
});
test('server invalid request/output/refusal/upstream return sanitized code objects',async()=>{
  for(const body of ['{',{}, {...input,staff:[]},{...input,comments:[{}]},{...input,mode:'reply'},{...input,limit:99}]){
    const s=server(),res=await s.invoke(body);assert.equal(res.status,400);assert.equal(s.calls.length,0);
  }
  for(const fetch of [async()=>{throw Error('server-only-fixture')},async()=>new Response('server-only-fixture',{status:500}),async()=>Response.json({status:'incomplete',output:[]}),async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'[]'}]}]}),async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({comments:[row('outside','금지예요.')]})}]}]})]){
    const res=await server({fetch}).invoke(),data=await res.json();assert.equal(data.ok,false);assert.equal(typeof data.code,'string');assert.deepEqual(Object.keys(data).sort(),['code','ok']);assert.ok(!JSON.stringify(data).includes('server-only-fixture'));
  }
});
function client({invoke,connected=true,blocked=false}={}){
  let sequence=0,writes=0,failSave=false;const calls=[];
  const context=vm.createContext({window:{},document:{getElementById:()=>null},console,structuredClone,TextEncoder,Uint8Array,setTimeout,clearTimeout,
    uid:()=> 'ai213-'+(++sequence),state:{boardPosts:[],boardComments:[],books:[],movies:[],tasks:[],goalRegistry:[],exercise:[],body:[],ledgerMonths:[]},
    cloudUser:{id:'owner'},loadRecovery:{active:false},importSyncHold:false,cloudRecoveryMode:false,cloudAutoSyncReady:!blocked,cloudRuntime:{sync:'ON'},cloudHasMeaningfulLocalData:()=>true,
    save:()=>{writes++;return {ok:!failSave}},sessionStorage:{getItem:()=>null,setItem(){}},formatDateTime:String});
  if(connected)context.cloudClient={functions:{invoke:async(name,request)=>{assert.equal(name,'hani-lounge-ai');calls.push(plain(request.body));return invoke?invoke(request.body):{data:{ok:true,comments:good}}}}};
  for(const file of ['hani-organization-hub.js','hani-character-archive-data.js','hani-relationship-seed.js','hani-board-library.js'])vm.runInContext(read(file),context,{filename:file});
  const editorial=read('hani-ui-v02992.js');vm.runInContext(editorial.slice(editorial.indexOf('// BEGIN CANONICAL TAB VOICE BUNDLE'),editorial.indexOf('const SPORTS_LINES')),context);
  vm.runInContext(read('hani-board.js').replace('generateDaily,realEvents,refreshLiving','generateDaily,realEvents,refreshLiving,requestLoungeAI,auditAIComments,materialize,publicationReplies,publicationThread,boardSettings,loungeRequests'),context);
  const h=context.window.HaniBoard;
  const now=Date.now();h.refreshLiving(now);
  return {context,h,calls,get writes(){return writes},fail:()=>failSave=true};
}
const flush=async()=>{await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve))};
function setupPost(c,extra={}){
  const original=c.context.HaniBoardLibrary.threads[0],now=Date.now();
  const post={...input.post,id:'synthetic-post',generated:true,libraryId:original.id,scheduledAt:new Date(now).toISOString(),createdAt:new Date(now).toISOString(),...extra};
  c.context.state.boardPosts=[{id:'settings',boardMeta:true,authorId:c.context.window.HaniOrganizationRoster.chairman.id,templateCleanupV4:true},post];
  c.context.state.boardComments=plain(c.h.publicationReplies(post,[],[]));return post;
}
test('client daily publication requests once, stores AI pending, timed reveal and staff replies',async()=>{
  const c=client({blocked:true});c.context.cloudAutoSyncReady=true;
  const post=setupPost(c);c.h.refreshLiving(Date.now());await flush();
  assert.equal(c.calls.filter(r=>r.post.id===post.id).length,1);
  const ai=c.context.state.boardComments.filter(r=>r.postId===post.id&&r.ai);assert.equal(ai.length,3);
  assert.ok(ai.every(r=>r.pending&&r.generated));assert.equal(ai[2].parentId,ai[0].id);
  assert.ok(c.calls[0].staff.every(s=>s.voice&&s.name&&s.rank&&s.team));
  assert.equal(c.h.materialize(c.context.state.boardPosts,c.context.state.boardComments,Date.parse(ai[0].scheduledAt)-1).comments.find(r=>r.id===ai[0].id).pending,true);
  const arrived=c.h.materialize(c.context.state.boardPosts,c.context.state.boardComments,Date.parse(ai[0].scheduledAt));assert.equal(arrived.comments.find(r=>r.id===ai[0].id).pending,false);
  c.h.refreshLiving(Date.now());await flush();assert.equal(c.calls.filter(r=>r.post.id===post.id).length,1,'durable once marker');
});
test('client chairman comment requests reply asynchronously with 1–3min and existing single-level parent',async()=>{
  const c=client({blocked:true,invoke:async()=>({data:{ok:true,comments:[row('hina','연결부터 살펴보면 어떨까요?',null,90),row('yuri','왼쪽 소리가 돌아오면 좋겠어요.',0,-1)]}})});c.context.cloudAutoSyncReady=true;
  const post=setupPost(c,{aiThreadRequested:true});
  assert.equal(c.h.saveComment(post.id,'이어폰 연결을 다시 해볼까요?'),true);assert.equal(c.calls.length,1);
  await flush();assert.equal(c.calls[0].mode,'reply');assert.equal(c.calls[0].chairmanComment.body,'이어폰 연결을 다시 해볼까요?');
  const owner=c.context.state.boardComments.find(r=>r.authorId===c.context.window.HaniOrganizationRoster.chairman.id),ai=c.context.state.boardComments.filter(r=>r.ai);
  assert.equal(ai.length,2);assert.equal(ai[0].parentId,owner.id);assert.equal(ai[1].parentId,owner.id,'keep existing one-level replies');
  ai.forEach(r=>{const min=(Date.parse(r.scheduledAt)-Date.parse(r.createdAt))/60000;assert.ok(min>=1&&min<=3)});
});
test('client audit drops QA-212 violations and orphaned child, keeps unique clean bodies',()=>{
  const c=client({blocked:true}),post=setupPost(c);
  const noise=['님, 안녕하세요.','오빠 괜찮아요.','원문에 적힌 그대로 확인해요.','실제 경기 소식 없이 취향만 얘기해요.','저는 완독했어요.','회장님, 같은 이어폰인가요?'];
  for(const body of noise)assert.equal(c.h.auditAIComments(post,[row('hina',body)],[]).length,0,body);
  const rows=[good[0],row('yuri',good[0].body),row('yuna','부모가 사라졌어요.',1)];assert.equal(c.h.auditAIComments(post,rows,[]).length,1);
  assert.equal(c.h.auditAIComments(post,[good[0]],[{postId:post.id,body:good[0].body}]).length,0);
});
test('client error/cap/all-invalid fallback preserves original templates, no request retry',async()=>{
  for(const invoke of [async()=>{throw Error('offline')},async()=>({error:{message:'offline'}}),async()=>({data:{ok:false,code:'DAILY_CAP'}}),async()=>({data:{ok:true,comments:[row('hina','오빠 괜찮아요.')]}})]){
    const c=client({blocked:true,invoke});c.context.cloudAutoSyncReady=true;const post=setupPost(c),before=plain(c.context.state.boardComments);
    await c.h.requestLoungeAI(post);assert.deepEqual(plain(c.context.state.boardComments),before);assert.equal(c.calls.length,1);await c.h.requestLoungeAI(c.context.state.boardPosts.find(p=>p.id===post.id));assert.equal(c.calls.length,1);
    assert.ok(c.h.materialize(c.context.state.boardPosts,c.context.state.boardComments,Date.now()+86400000).comments.every(r=>!r.pending),'fallback still reveals');
  }
  const c=client({blocked:true});c.context.cloudAutoSyncReady=true;const post=setupPost(c);c.context.state.boardPosts[0].loungeAI={owner:'owner',day:c.h.dayKey(Date.now()),count:30};
  const before=plain(c.context.state),writes=c.writes;assert.equal(await c.h.requestLoungeAI(post),false);assert.equal(c.calls.length,0);assert.equal(c.writes,writes);assert.deepEqual(plain(c.context.state),before);
});
test('client zero writes/requests before baseline, after guard loss/stale edit/account switch, rollback',async()=>{
  const c=client({blocked:true}),post=setupPost(c),before=plain(c.context.state);
  assert.equal(c.h.refreshLiving(),false);assert.equal(await c.h.requestLoungeAI(post),false);assert.equal(c.h.saveComment(post.id,'댓글'),false);assert.equal(c.writes,0);assert.equal(c.calls.length,0);assert.deepEqual(plain(c.context.state),before);
  for(const change of [c=>c.context.cloudAutoSyncReady=false,c=>c.context.cloudUser={id:'other'},c=>c.context.state.boardPosts.find(p=>p.id==='synthetic-post').body='수정된 본문',c=>c.context.state.boardPosts=c.context.state.boardPosts.filter(p=>p.id!=='synthetic-post')]){
    let resolve;const c=client({blocked:true,invoke:()=>new Promise(r=>resolve=r)});c.context.cloudAutoSyncReady=true;const post=setupPost(c),pending=c.h.requestLoungeAI(post);change(c);const snapshot=plain(c.context.state),writes=c.writes;resolve({data:{ok:true,comments:good}});assert.equal(await pending,false);assert.equal(c.writes,writes);assert.deepEqual(plain(c.context.state),snapshot);
  }
  const rollback=client({blocked:true});rollback.context.cloudAutoSyncReady=true;const draft=setupPost(rollback),snapshot=plain(rollback.context.state);rollback.fail();assert.equal(await rollback.h.requestLoungeAI(draft),false);assert.equal(rollback.calls.length,0);assert.deepEqual(plain(rollback.context.state),snapshot);
});
test('client review publish hook, unknown fields preserved, no secrets/storage/DOM additions',async()=>{
  const c=client({blocked:true});c.context.cloudAutoSyncReady=true;const post=setupPost(c,{draft:true});
  assert.equal(c.h.draftAction('post',post.id,'publish'),true);await flush();assert.equal(c.calls[0].mode,'thread');
  assert.equal(c.h.commentFields({ai:true,unknown:'kept'}).ai,true);
  const after=read('hani-board.js');
  assert.doesNotMatch(after,/localStorage\.(?:setItem|removeItem|clear)\(|\.clear\(/);
  const ids=[...after.matchAll(/\bid=["']([\w-]+)["']/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
  assert.doesNotMatch(after,/OPENAI_API_KEY|server-only-fixture|api\.openai\.com|service_role/);
  const normalizer=read('hani-main.js');assert.match(normalizer,/boardComments:Array\.isArray\(d\?\.boardComments\)\?d\.boardComments:\[\]/);
});
test('client old/partially visible threads never stall or backfill; in-flight queue and stale AI stay protected',async()=>{
  const c=client({blocked:true});c.context.cloudAutoSyncReady=true;
  const post=setupPost(c),rows=c.context.state.boardComments;assert.ok(rows.length>1);
  rows[0]={...rows[0],pending:false};
  let result=c.h.materialize(c.context.state.boardPosts,rows,Date.now()+180*60000);
  assert.ok(result.comments.every(r=>!r.pending),'visible template thread continues');
  const old=setupPost(c,{createdAt:'2026-01-01T00:00:00Z',scheduledAt:'2026-01-01T00:00:00Z'});
  result=c.h.materialize(c.context.state.boardPosts,c.context.state.boardComments,Date.now());assert.ok(result.comments.every(r=>!r.pending),'old posts never held');
  c.h.refreshLiving(Date.now());await flush();assert.ok(c.calls.every(r=>r.post.id!==old.id),'no historic backfill');
  let resolve;const pendingClient=client({blocked:true,invoke:()=>new Promise(r=>resolve=r)});pendingClient.context.cloudAutoSyncReady=true;const p=setupPost(pendingClient);
  const request=pendingClient.h.requestLoungeAI(p);
  result=pendingClient.h.materialize(pendingClient.context.state.boardPosts,pendingClient.context.state.boardComments,Date.now()+180*60000,true);assert.ok(result.comments.every(r=>r.pending),'no templates while request pending');
  resolve({data:{ok:true,comments:good}});await request;
  pendingClient.context.state.boardPosts.find(r=>r.id===p.id).body='변경된 글';
  result=pendingClient.h.materialize(pendingClient.context.state.boardPosts,pendingClient.context.state.boardComments,Date.now()+180*60000);
  assert.ok(result.comments.every(r=>r.disposition==='stale'),'queued AI is retired after source edit');
});
test('client persisted quota survives reload/KST rollover and timeout leaves fallback usable',async()=>{
  const c=client({blocked:true});c.context.cloudAutoSyncReady=true;let post=setupPost(c);
  c.context.state.boardPosts[0].loungeAI={owner:'owner',day:c.h.dayKey(Date.now()),count:29};
  assert.equal(await c.h.requestLoungeAI(post),true);assert.equal(c.h.boardSettings().loungeAI.count,30);
  const saved=plain(c.context.state),reload=client({blocked:true});reload.context.cloudAutoSyncReady=true;reload.context.state=saved;
  post=reload.context.state.boardPosts.find(p=>p.id==='synthetic-post');assert.equal(await reload.h.requestLoungeAI({...post,id:'another'}),false);assert.equal(reload.calls.length,0);
  reload.h.boardSettings().loungeAI.day=reload.h.dayKey(Date.now()-86400000);
  reload.context.state.boardPosts=reload.context.state.boardPosts.map(p=>p.id===post.id?{...p,aiThreadRequested:false}:p);
  reload.context.state.boardComments=[];assert.equal(await reload.h.requestLoungeAI(reload.context.state.boardPosts.find(p=>p.id===post.id)),true);assert.equal(reload.h.boardSettings().loungeAI.count,1);
  const timeout=client({blocked:true,invoke:()=>new Promise(()=>{})});timeout.context.cloudAutoSyncReady=true;const p=setupPost(timeout),before=plain(timeout.context.state.boardComments);
  timeout.context.setTimeout=cb=>{queueMicrotask(cb);return 0};timeout.context.clearTimeout=()=>{};
  assert.equal(await timeout.h.requestLoungeAI(p),false);assert.deepEqual(plain(timeout.context.state.boardComments),before);assert.equal(timeout.h.loungeRequests.length,0);
});
