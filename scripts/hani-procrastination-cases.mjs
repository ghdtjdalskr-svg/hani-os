// Portable synthetic cases shared by Node and the isolated V8 verification.
export function makeBoardFixture() {
  return {
    exercise:[{date:'2026-11-08',steps:3000}],
    body:[{date:'2026-11-06',weight:70}],
    learningQuizzes:[{status:'pending',scheduledDate:'2026-10-30',questions:[{text:'가짜 문제'}]}],
    investmentBrokerSnapshots:[{mode:'actual',status:'confirmed',updatedAt:'2026-09-01T00:00:00Z'}],
    ledgerMonths:[{items:[{detail:'가짜 항목',amount:1}],updatedAt:'2026-08-01T00:00:00Z'}],
    wishlistItems:[{name:'가짜 후보',updatedAt:'2026-11-08T00:00:00Z'}],
    diaries:[{date:'2026-11-08',content:'가짜 화면 검증용 한 줄'}]
  };
}
export function runBoardCases(api, assert) {
  let checks=0;
  const eq=(a,b,message)=>{assert.equal(a,b,message);checks++};
  const ok=(v,message)=>{assert.ok(v,message);checks++};
  const now='2026-11-08T03:00:00Z';
  eq(api.elapsed('2026-11-07',now),1,'KST date only');
  eq(api.elapsed('2026-11-07T14:59:59Z',now),1,'before KST midnight');
  eq(api.elapsed('2026-11-07T15:00:00Z',now),0,'at KST midnight');
  eq(api.elapsed('2026-11-08T00:00:00+09:00',now),0,'explicit KST zone');
  eq(api.elapsed('2026-11-08T00:00:00-05:00','2026-11-08T06:00:00Z'),0,'other explicit zone');
  eq(api.elapsed('2026-10-31','2026-11-01'),1,'month rollover');
  eq(api.elapsed('2025-12-31','2026-01-01'),1,'year rollover');
  eq(api.elapsed('2024-02-29','2024-03-01'),1,'leap day');
  for(const value of [null,undefined,{},[],1,true,'','2026-02-29','2026-02-30','2026-13-01','2026-11-08T10:00:00','broken','2026-11-09']) eq(api.elapsed(value,now),null,'invalid/future date');
  for(const bounds of [[1,7,14,30],[7,14,30,60],[31,45,60,90]]) {
    eq(api.stage(0,bounds),0);
    bounds.forEach((bound,index)=>{eq(api.stage(bound-1,bounds),index,'lower boundary');eq(api.stage(bound,bounds),index+1,'inclusive boundary')});
    eq(api.stage(1000,bounds),4);
  }
  for(const value of [null,NaN,Infinity,-1,0.5,'2'])eq(api.stage(value),null);
  for(const input of [undefined,null,[],0,'bad',{}, {body:'bad',exercise:{},learningQuizzes:[null,3],investmentBrokerSnapshots:[false],ledgerMonths:'bad',wishlistItems:[null],diaries:[null]}]) {
    const model=api.project(input,now);eq(model.length,7);ok(model.every(r=>r.level===null&&r.days===null),'empty/corrupt records never fabricate overdue age');
  }
  const source=makeBoardFixture(),before=JSON.stringify(source),model=api.project(source,now),by=id=>model.find(r=>r.id===id);
  eq(model.map(r=>r.level).slice(0,5).join(','),'0,1,2,3,4','all five stages from real input paths');
  const expected={steps:0,weight:2,quiz:9,assets:68,ledger:99,wishlist:0,diary:0};
  for(const row of model){eq(row.days,expected[row.id],'per-item elapsed day');ok(row.speech.length>5);ok(!('value' in row)&&!('weight' in row)&&!('amount' in row),'sensitive values excluded')}
  for(const row of model)for(const [index,bound] of row.bounds.entries())for(const [age,level] of [[bound-1,index],[bound,index+1]]){
    const day=new Date(Date.parse('2026-11-08T00:00:00Z')-age*86400000).toISOString().slice(0,10),fixture=makeBoardFixture();
    if(row.id==='steps')fixture.exercise=[{date:day,steps:1}];
    if(row.id==='weight')fixture.body=[{date:day,weight:70}];
    if(row.id==='quiz')fixture.learningQuizzes=[{status:'pending',scheduledDate:day,questions:[{}]}];
    if(row.id==='assets')fixture.investmentBrokerSnapshots[0].updatedAt=day;
    if(row.id==='ledger')fixture.ledgerMonths[0].updatedAt=day;
    if(row.id==='wishlist')fixture.wishlistItems[0].updatedAt=day;
    if(row.id==='diary')fixture.diaries=[{date:day,content:'한 줄'}];
    eq(api.project(fixture,now).find(item=>item.id===row.id).level,level,'actual per-item boundary '+row.id);
  }
  eq(JSON.stringify(source),before,'projection cannot mutate canonical data');
  const noise=makeBoardFixture();noise.body.push({date:'2026-11-08',weight:0},{date:'2026-11-09',weight:1},{date:'2026-11-08',weight:'broken'});noise.exercise=[{date:'2026-11-08',steps:0},{date:'2026-11-07',steps:100},{date:'2026-11-08',steps:true}];
  const noisy=api.project(noise,now);eq(noisy[0].days,1,'ambiguous zero/boolean steps do not imply entry');eq(noisy[1].days,2,'invalid values and future rows excluded');
  noise.investmentBrokerSnapshots.push({status:'draft',mode:'actual',updatedAt:now},{status:'confirmed',mode:'practice',updatedAt:now});
  eq(api.project(noise,now).find(r=>r.id==='assets').days,68,'exclude asset drafts/practice');
  for(const row of model){
    const fresh=makeBoardFixture();
    if(row.id==='steps')fresh.exercise=[{date:'2026-11-08',steps:1}];
    if(row.id==='weight')fresh.body=[{date:'2026-11-08',weight:70}];
    if(row.id==='quiz')fresh.learningQuizzes.push({status:'completed',completedAt:now,questions:[{}]});
    if(row.id==='assets')fresh.investmentBrokerSnapshots[0].updatedAt=now;
    if(row.id==='ledger')fresh.ledgerMonths[0].updatedAt=now;
    if(row.id==='wishlist')fresh.wishlistItems[0].updatedAt=now;
    if(row.id==='diary')fresh.diaries=[{date:'2026-11-08',content:'한 줄'}];
    const updated=api.project(fresh,now).find(r=>r.id===row.id);eq(updated.level,0,'completed today resets each item');ok(updated.speech.includes('드디어! 고마워요♡'),'gratitude on completion');
  }
  const done=api.project({learningQuizzes:[{status:'completed',completedAt:'2026-10-01'}]},now).find(r=>r.id==='quiz');eq(done.level,0,'no pending quiz is not overdue');eq(done.days,0);
  const future=api.project({learningQuizzes:[{status:'pending',scheduledDate:'2026-11-09',questions:[{}]}]},now).find(r=>r.id==='quiz');eq(future.pending,0,'future quiz excluded');eq(future.level,null);
  const undated=api.project({ledgerMonths:[{month:'2026-10',items:[{}]}],wishlistItems:[{name:'제목만 있음'}]},now);eq(undated.find(r=>r.id==='ledger').days,null,'month is not an invented completion date');eq(undated.find(r=>r.id==='wishlist').days,null);
  eq(by('steps').owner,'naeun');eq(by('quiz').owner,'hina');eq(by('assets').owner,'jieun');eq(by('wishlist').owner,'haru');eq(by('diary').owner,'minji');
  return checks;
}

export function runRenderCases(source, assert, evaluate) {
  let mounts=0,reads=0,writes=0;
  const calls=[],cards=new Map(),count={textContent:''};
  const node=()=>({textContent:'',dataset:{},onclick:null});
  const root={children:[],querySelector(selector){return cards.get(selector.match(/data-pb-card="([^"]+)"/)[1])}};
  Object.defineProperty(root,'innerHTML',{set(html){
    mounts++;root.children=[];
    for(const match of html.matchAll(/<article class="pb-card" data-pb-card="([^"]+)">/g)){
      const nodes=new Map(),card={dataset:{},querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)}};
      cards.set(match[1],card);root.children.push(card);
    }
  }});
  const document={body:{dataset:{view:'home'}},getElementById(id){reads++;return id==='procrastinationBoard'?root:id==='procrastinationCount'?count:null}};
  const window={},state=makeBoardFixture();
  const FixedDate=class extends Date{constructor(...args){super(...(args.length?args:['2026-11-08T03:00:00Z']))}static now(){return Date.parse('2026-11-08T03:00:00Z')}};
  const deny=()=>{writes++;throw new Error('unexpected side effect')};
  const storage={getItem:deny,setItem:deny,removeItem:deny,clear:deny};
  evaluate(source,{window,document,state,Date:FixedDate,showView:route=>calls.push(route),localStorage:storage,sessionStorage:storage,fetch:deny,setTimeout:deny,setInterval:deny});
  const api=window.HaniProcrastination,before=JSON.stringify(state);
  api.render(state);assert.equal(root.children.length,7);assert.equal(mounts,1);assert.equal(count.textContent,'4개가 기다리는 중');
  const first=cards.get('weight');assert.equal(first.dataset.level,'1');
  for(const row of api.project(state,'2026-11-08'))cards.get(row.id).querySelector('[data-pb-go]').onclick();
  assert.equal(calls.join(','),'exercise,diet,study,investmentIntake,ledger,wishlist,diary');
  assert.equal(JSON.stringify(state),before,'render is read-only');
  state.body.push({date:'2026-11-08',weight:70});api.render(state);
  assert.equal(mounts,1,'persistent slots are reused');assert.equal(cards.get('weight'),first,'card identity preserved');assert.equal(first.dataset.level,'0');
  assert.ok(first.querySelector('.pb-speech').textContent.includes('드디어! 고마워요♡'));
  api.render({});assert.ok(root.children.every(card=>card.dataset.level==='unknown'));
  assert.equal(writes,0,'no storage read/write, network or timers');assert.ok(reads>0);
  return 13;
}
