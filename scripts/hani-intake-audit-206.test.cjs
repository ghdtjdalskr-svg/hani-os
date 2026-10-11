const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),main=fs.readFileSync(path.join(root,'hani-main.js'),'utf8');
const source=fs.readFileSync(path.join(root,'hani-yuna-helpdesk.js'),'utf8');
const functions=['intakeText','intakeNormText','intakeDate','intakeNumber','intakeRating','intakeKv','intakePick','intakeFirstContentLine','intakeDayOffset','intakeDateFromWeekday','intakeNaturalRating','intakeNaturalReview','intakeNaturalAuthor','intakeNaturalDate','intakeNaturalMovie','intakeReadingToday','intakeNaturalBook','intakeBuildOne','intakeDuplicateInfo','intakeBlockerInfo','intakeApplyRow'];
const input={value:'',style:{},classList:{add(){},remove(){}},focus(){},blur(){},scrollHeight:30};
const state=()=>({tasks:[],books:[],movies:[],travelWishlist:[],diaries:[]});
let commits=0,writes=0,renders=[],id=0;
const ctx={window:{},document:{getElementById(){return null}},Date,Intl,structuredClone,console,setTimeout,clearTimeout,requestAnimationFrame:fn=>fn(),state:state(),today:()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date()),normalizeDateFlexDate:x=>x,uid:()=>String(++id),normalizeTravelWish:x=>x,commit(){commits++;writes++;return true},renderAll(){},agentApi(){throw Error('Local parsing must not call AI')}};
vm.createContext(ctx);
for(const name of functions){const start=main.indexOf(`function ${name}(`);assert.ok(start>=0,name);const rest=main.slice(start),next=rest.search(/\r?\nfunction /);vm.runInContext(next<0?rest:rest.slice(0,next),ctx)}
vm.runInContext(source.replace('window.HANI_YUNA_HELPDESK=',`window.audit={submitText,saveApproved,clearAll,bounded,processText,chooseCategory,get:()=>model,set:value=>{invalidateSend();model=value},setRoot:value=>root=value,replaceRender:fn=>{render=fn;renderConversation=fn;persist=()=>{}},failReply};window.HANI_YUNA_HELPDESK=`),ctx);
const a=ctx.window.audit,api=ctx.window.HANI_YUNA_HELPDESK;
assert.equal(api.visionDraft({financial_detected:true,extracted_text:'계좌 잔액'},'사진 확인').route,'investmentIntake');
a.setRoot({querySelector:()=>input});a.replaceRender(()=>renders.push({messages:structuredClone(a.get().messages),input:input.value}));
const reset=(category='auto')=>{a.clearAll();a.get().category=category;renders=[];input.value=''};
const send=async text=>{input.value=text;a.submitText();const pending=a.get();assert.equal(pending.messages.at(-2).role,'user');assert.equal(pending.messages.at(-1).text,'확인 중…');assert.equal(input.value,'');assert.ok(renders.some(r=>r.messages.at(-1)?.role==='user'&&r.input===text),'append renders before input clears');await new Promise(resolve=>setTimeout(resolve,65));assert.ok(a.get().messages.at(-1).role==='yuna');assert.ok(!a.get().messages.some(m=>m.typing))};
const cases=[
 ['task','내일 3시 치과 예약','tasks','text','내일 3시 치과 예약'],
 ['book','김대식의 인간 vs 기계 책을 봤어','books','title','인간 vs 기계'],
 ['book','사피엔스 읽는 중','books','title','사피엔스'],
 ['movie','케이팝 데몬 헌터스 봤어 별점 5','movies','title','케이팝 데몬 헌터스'],
 ['travelWish','성수동 카페 어니언 다녀왔어','travelWishlist','destination','어니언'],
 ['diary','오늘 5km 뛰었어','diaries','content','오늘 5km 뛰었어'],
];
(async()=>{
 for(const [kind,text,collection,field,expected] of cases){reset(kind);const before=writes;await send(text);assert.equal(writes,before);if(a.get().draft.missing.length)await send('오늘');assert.equal(a.get().draft.missing.length,0);const draft=a.get().draft;assert.equal(draft.target,kind);assert.equal(draft.data[field],expected);if(kind==='movie')assert.equal(draft.data.rating,5);if(kind==='travelWish')assert.equal(draft.entities.location,'성수동');if(text.startsWith('김대식'))assert.equal(draft.data.author,'김대식');if(text.startsWith('사피엔스'))assert.equal(draft.data.status,'wish');const messages=a.get().messages.length;a.saveApproved();assert.equal(writes,before+1);assert.equal(ctx.state[collection].at(-1)[field],expected);assert.equal(a.get().messages.length,messages+1);assert.match(a.get().messages.at(-1).text,/저장했어요/);assert.equal(a.get().draft,null)}
 reset();await send('내일 우산 챙기기');assert.equal(a.get().draft.target,'task');
 // Selecting a different chip cannot hydrate a missing field in the old draft.
 reset('movie');await send('제목 없는 영화 봤어');assert.ok(a.get().draft.missing.length);a.chooseCategory('travelWish');assert.equal(a.get().draft,null);await send('성수동 카페 어니언 다녀왔어');assert.equal(a.get().draft.target,'travelWish');assert.equal(a.get().draft.data.destination,'어니언');
 // Empty send gives feedback and never appends or writes.
 reset();a.submitText();assert.equal(a.get().messages.length,0);assert.match(input.placeholder,/입력/);
 // Concurrent send is ignored; reset invalidates pending work.
 input.value='내일 중복 전송 확인';a.submitText();a.submitText();assert.equal(a.get().messages.filter(m=>m.role==='user').length,1);a.clearAll();await new Promise(r=>setTimeout(r,65));assert.equal(a.get().messages.length,0);
 // Local parser exceptions preserve the request and retry without another user bubble.
 reset('book');const natural=ctx.intakeNaturalBook;ctx.intakeNaturalBook=()=>{throw Error('parse failed')};input.value='오류 테스트 읽는 중';a.submitText();await new Promise(r=>setTimeout(r,65));assert.equal(a.get().messages.at(-1).error,true);const retry=a.get().retry;ctx.intakeNaturalBook=natural;a.submitText(retry);await new Promise(r=>setTimeout(r,65));assert.equal(a.get().messages.filter(m=>m.role==='user').length,1);assert.equal(a.get().draft.data.title,'오류 테스트');
 // Save failure uses the existing rollback and explicit retry, without partial state.
 const before=structuredClone(ctx.state),commit=ctx.commit;ctx.commit=()=>false;a.saveApproved();assert.deepEqual(ctx.state,before);assert.equal(a.get().retry.kind,'save');ctx.commit=commit;a.saveApproved();assert.match(a.get().messages.at(-1).text,/저장했어요/);
 // Duplicate is visible and cannot write twice.
 reset('book');await send('오류 테스트 읽는 중');const beforeDuplicate=writes;a.saveApproved();assert.equal(writes,beforeDuplicate);assert.match(a.get().messages.at(-1).text,/중복 저장하지/);
 // Image/session failure remains retryable; hung promises are bounded.
 reset();a.get().image={name:'image.png'};ctx.intakeImageToDataUrl=async()=> 'data:image/png;base64,test';input.value='사진 확인';a.submitText();await new Promise(r=>setTimeout(r,65));assert.equal(a.get().messages.at(-1).error,true);assert.equal(a.get().image.name,'image.png');
 await assert.rejects(a.bounded(()=>new Promise(()=>{}),10),/초과/);
 // A late AI completion cannot repopulate a reset thread.
 let resolveAI;ctx.agentObj=x=>x;ctx.agentApi=()=>new Promise(r=>resolveAI=r);a.submitText(a.get().retry);await new Promise(r=>setTimeout(r,55));a.clearAll();resolveAI({extraction:{confidence:.99,target_hint:'movie',structured_json:JSON.stringify([{target:'movie',data:{title:'늦은 영화',watchedDate:'2026-10-11'}}])}});await new Promise(r=>setTimeout(r,10));assert.equal(a.get().messages.length,0);assert.equal(a.get().draft,null);
 console.log(`PASS: 6 chip parser/conversation/save flows, free text, empty/busy/reset, local failure retry, save rollback/duplicate, AI failure/timeout/stale reply; ${commits} existing commits`);
})().catch(e=>{console.error(e);process.exitCode=1});
