const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {source,loadInputHelpers,assignments,functionCode}=require('./qa-1st-test-support.cjs');
function harness(){
  const elements=new Map(),alerts=[],scope={querySelectorAll:()=>[]};
  const get=id=>{if(!elements.has(id))elements.set(id,{id,value:'',checked:false,disabled:false,files:[],dataset:{},attrs:{},listeners:{},closest:()=>scope,setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},addEventListener(k,fn){this.listeners[k]=fn},focus(){this.focused=true},getBoundingClientRect:()=>({})});return elements.get(id)};
  const context=vm.createContext({console,Date,structuredClone,Set,Promise,window:{},document:{querySelectorAll:()=>[],getElementById:get},$:get,alert:m=>alerts.push(m),state:{exercise:[],books:[],movies:[]},uid:()=>String(Math.random()),renderAll(){},resetBookForm(){},resetMovieForm(){},commit:()=>true,ratingValue:v=>v?Number(v):null,compressImage:async()=>'',movieContentType:v=>v,n:v=>Number(v)||0});
  loadInputHelpers(context);return {context,get,scope,alerts,elements,run:code=>vm.runInContext(code,context)};
}
test('C1 Korean units, strict entire token, no accidental partial numbers',()=>{
  const h=harness();for(const [input,value] of [['1만',10000],['1천',1000],['1.5만',15000],['2억 3천만 원',230000000],['1만 5천',15000],['1천2백34원',1234],['-2.3%',-2.3],['0원',0],['1,000',1000],['',null],['금액 1만?',null],['1만abc',null],['3..2',null],['1만2만',null]])assert.equal(h.context.parseKoreanNumber(input),value,input);
  // Actual asset ingress and main intake parser, rather than only the new helper.
  h.context.document.getElementById=()=>null;h.run(fs.readFileSync(path.join(__dirname,'../hani-asset-update-v1.js'),'utf8'));
  assert.equal(h.context.window.HANI_ASSET_UPDATE_V1.normalize({total_assets:'1만'}).assets,10000);
  h.run(source.match(/^function intakeNumber\(v\).*$/m)[0]);assert.equal(h.context.intakeNumber('1.5만'),15000);
});
test('C1 rating retains full score and asks for scale, then previews explicit conversion',()=>{
  const h=harness(),r=h.context.parseRatingInput('10점');assert.equal(r.value,10);assert.equal(r.scale,null);assert.equal(r.needsScale,true);
  const exact=h.context.parseRatingInput('10점 만점에 10점');assert.equal(exact.value,10);assert.equal(exact.scale,10);assert.equal(exact.valid,true);
  assert.equal(h.context.parseRatingInput('4.75점').value,4.75);assert.equal(h.context.ratingForExistingScale('100점 만점에 70점',null),null);
  h.context.document.getElementById=()=>null;h.run(fs.readFileSync(path.join(__dirname,'../hani-yuna-helpdesk.js'),'utf8'));
  const api=h.context.window.HANI_YUNA_HELPDESK;
  for(const hint of ['book','movie']){const draft=api.parse('오늘 테스트 '+(hint==='book'?'책 읽었어':'영화 봤어')+' 10점',hint);assert.equal(draft.data.rating,null);assert.ok(draft.missing.includes('rating'));api.hydrateMissing(draft,'10점 만점');assert.equal(draft.data.rating,5);assert.equal(draft.entities.ratingInput.value,10);assert.equal(draft.entities.ratingInput.scale,10);assert.ok(!draft.missing.includes('rating'));}
  const corrected=api.parse('오늘 테스트 영화 봤어 10점','movie');api.hydrateMissing(corrected,'4.5점');assert.ok(corrected.missing.includes('rating'));api.hydrateMissing(corrected,'5점 만점');assert.equal(corrected.data.rating,4.5);assert.equal(corrected.entities.ratingInput.value,4.5);
});
test('C2 shared date validator rejects impossible nested dates and reversed ranges',()=>{
  const h=harness();for(const value of [{date:'2026-02-31'},{due:'2026-02-29'},{rows:[{visitDate:'2026-04-31'}]},{startDate:'2026-10-25',endDate:'2026-10-24'},{periodStart:'2026-10-18',periodEnd:'2026-10-17'},{examDate:'2026-11-01',resultDate:'2026-10-31'},{date:'2026-10-24T25:00'}])assert.ok(h.context.validateEntryDates(value),JSON.stringify(value));
  for(const value of [{date:'2028-02-29'},{due:''},{startDate:'2026-10-24',endDate:'2026-10-24'},{date:'2026-10'},{date:'2026-10-24T23:59'}])assert.equal(h.context.validateEntryDates(value),'',JSON.stringify(value));
});
test('C2 every guarded main save owner blocks before its first mutation, including programmatic invocation',()=>{
  const rows=assignments().filter(row=>row.code.startsWith('saveEntry('));for(const id of ['addTask','addBody','addExercise','saveBook','saveMovie','certificateSave','travelTripSave','campusEventSave','brokerSaveDraft','brokerConfirm','monthlySaveDraft','monthlyConfirm'])assert.ok(rows.some(row=>row.id===id),'unguarded save '+id);
  for(const row of rows){const h=harness(),date=h.get('testDate');date.type='text';date.dataset.dateKind='date';date.value='2026-02-31';h.scope.querySelectorAll=()=>[date];h.context.commit=()=>assert.fail('save reached '+row.id);h.run(row.code)();assert.ok(h.alerts.length,row.id);assert.equal(date.focused,true,row.id);assert.equal(h.get(row.id).disabled,false);}
  const h=harness(),start=h.get('travelTripStart'),end=h.get('travelTripEnd');for(const x of [start,end]){x.type='date';x.dataset.dateKind='date';}start.value='2026-10-25';end.value='2026-10-24';h.scope.querySelectorAll=()=>[start,end];assert.equal(h.context.validateSaveDateScope(h.get('travelTripSave')),false);
});
test('C3 same-day form shows existing fields, merges edits, keeps blanks, accepts explicit zero, rolls back failed save',()=>{
  const h=harness();h.context.state.exercise=[{id:'existing',date:'2026-10-24',steps:8000,distance:6,strength:true,note:'기존 메모'}];h.get('exerciseDate').value='2026-10-24';
  const a=source.indexOf('const exerciseChanged='),b=source.indexOf('\nconst TOPIC_COLORS=',a);h.run(source.slice(a,b));h.context.loadExerciseDate();
  assert.equal(h.get('exerciseDistance').value,6);assert.equal(h.get('exerciseNote').value,'기존 메모');
  const input=(id,value)=>{h.get(id).value=value;h.get(id).listeners.input()};input('exerciseSteps','9000');input('exerciseDistance','');input('exerciseNote','');h.get('addExercise').onclick();
  let row=h.context.state.exercise[0];assert.equal(row.steps,9000);assert.equal(row.distance,6);assert.equal(row.note,'기존 메모');assert.equal(row.id,'existing');assert.equal(row.strength,true);
  input('exerciseDistance','0');h.get('addExercise').onclick();assert.equal(row.distance,0);
  input('exerciseSteps','bad');h.get('addExercise').onclick();assert.equal(row.steps,9000);assert.ok(h.alerts.length);
  input('exerciseSteps','1234');h.context.commit=()=>false;h.get('addExercise').onclick();assert.equal(row.steps,9000);assert.equal(h.get('exerciseSteps').value,'1234');
});
test('C4 real book/movie asynchronous save ignores re-entry and releases after resolution',async()=>{
  for(const [button,title,cover,array] of [['saveBook','bookTitle','bookCover','books'],['saveMovie','movieTitle','moviePoster','movies']]){
    const h=harness();let resolve,writes=0;h.context.compressImage=()=>new Promise(r=>resolve=r);h.context.commit=()=>{writes++;return true};h.get(title).value='테스트';h.get(cover).files=[{}];h.get(button==='saveBook'?'bookStatus':'movieStatus').value='wish';
    const handler=h.run(assignments().find(row=>row.id===button).code),pending=handler();assert.equal(h.get(button).disabled,true);assert.equal(h.get(button).attrs['aria-busy'],'true');assert.equal(handler(),undefined);assert.equal(writes,0);resolve('image');await pending;assert.equal(writes,1);assert.equal(h.context.state[array].length,1);assert.equal(h.get(button).disabled,false);assert.equal(h.get(button).attrs['aria-busy'],undefined);
  }
});
test('C4 rejected/failed async save releases lock and supports retry',async()=>{
  const h=harness(),button=h.get('saveTest');let reject,calls=0;const handler=h.context.saveEntry(button,()=>{calls++;return new Promise((_,r)=>reject=r)});const pending=handler();handler();reject(Error('test rejection'));await assert.rejects(pending,/test rejection/);assert.equal(button.disabled,false);const retry=handler();assert.equal(calls,2);reject(Error('retry'));await assert.rejects(retry);assert.equal(button.disabled,false);
});
test('C4 replacing a pending button cannot bypass the guard',async()=>{
  const h=harness(),button=h.get('saveTest');let resolve,writes=0;const first=h.context.saveEntry(button,()=>{writes++;return new Promise(r=>resolve=r)}),pending=first();h.elements.delete('saveTest');const replacement=h.get('saveTest'),second=h.context.saveEntry(replacement,()=>writes++);assert.equal(replacement.disabled,true);second();assert.equal(writes,1);resolve();await pending;assert.equal(replacement.disabled,false);second();assert.equal(writes,2);
});
test('C2 study project/date editor and direct intake save reject dates before mutation',()=>{
  const h=harness(),study=fs.readFileSync(path.join(__dirname,'../hani-study-v02984.js'),'utf8'),committee=fs.readFileSync(path.join(__dirname,'../hani-investment-committee.js'),'utf8');
  // Nested function declarations remain executable in isolation, using the actual owner source.
  const extract=(text,name)=>{const start=text.indexOf('function '+name+'('),next=text.indexOf('\n  function ',start+1);return text.slice(start,next);};
  h.run(extract(study,'persistNewProject'));assert.equal(h.context.persistNewProject({examDate:'2026-02-31'}),false);
  h.run(extract(study,'persistProjectUpdate'));assert.equal(h.context.persistProjectUpdate({}, {examDate:'2026-02-31'}),false);
  const vmC=vm.createContext({module:{exports:{}},require,validateEntryDates:h.context.validateEntryDates});vm.runInContext(committee,vmC);assert.throws(()=>vmC.module.exports.inputDate('2026-02-31'),/날짜/);assert.equal(vmC.module.exports.inputDate('2026.10.24 10:30'),'2026-10-24T01:30:00.000Z');
  h.run(functionCode('intakeApplyRow'));assert.throws(()=>h.context.intakeApplyRow({target:'task',data:{due:'2026-02-31'}}),/날짜/);
});
test('B actual asset and deployment renderers distinguish unknown/zero and none/awaiting approval',()=>{
  const h=harness();Object.assign(h.context,{esc:String,n:v=>Number(v)||0,won:v=>v+'원',signedWon:v=>v+'원',calculate:()=>({total:0,totalMarket:0,totalCash:0,pnl:0}),officialBrokerLatest:()=>null});h.context.state.accounts=[];h.context.state.transactions=[];
  h.run(functionCode('investmentAmountKnown')+'\n'+functionCode('renderAssets'));h.context.renderAssets();assert.match(h.get('assetStats').innerHTML,/미확인 금액/);assert.doesNotMatch(h.get('assetStats').innerHTML,/>0원</);
  h.context.officialBrokerLatest=()=>({period:'2026-10'});h.context.brokerCalc=()=>({total:0,evaluation:0,cashLike:0,pnl:0,accounts:[]});h.context.renderAssets();assert.match(h.get('assetStats').innerHTML,/>0원</);assert.doesNotMatch(h.get('assetStats').innerHTML,/미확인/);
  h.context.deployRuntime={health:{github_reachable:true,main_sha:'test'},pending:{pending:false}};h.run(functionCode('deployExecutiveRender'));h.context.deployExecutiveRender();assert.equal(h.get('deployExecutiveState').textContent,'후보 없음');h.context.deployRuntime.stage={ready_for_approval:true,candidate_version:'test'};h.context.deployRuntime.qa={state:'HINA_QA_PASS'};h.context.deployExecutiveRender();assert.equal(h.get('deployExecutiveState').textContent,'대표 승인 대기');
});
