// Development fixture only. No real account, token, Cloud fetch or operational source.
window.addEventListener('load',async()=>{
  const OriginalDate=Date;
  window.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:['2026-10-03T03:00:00Z']))}static now(){return new OriginalDate('2026-10-03T03:00:00Z').getTime()}};
  state={...freshState(),investmentBrokerSnapshots:['09','10'].map((m,i)=>({id:'demo-'+m,mode:'actual',status:'confirmed',recordType:'account',period:'2026-'+m,snapshotDate:'2026-'+m+'-02',
    accounts:[{enabled:true,accountName:'합성 예시 계좌',estimatedAssets:1000000+i*100000,totalEvaluation:null,totalPurchase:null,totalPnl:null,totalReturn:null,holdings:[]}]})),
    body:[{id:'demo-weight-09',date:'2026-09-30',weight:100},{id:'demo-weight-10',date:'2026-10-02',weight:99}],
    books:[{id:'demo-book-09',status:'read',readDate:'2026-09-01',title:'예시 도서'},{id:'demo-book-10',status:'read',readDate:'2026-10-01',title:'예시 도서'}],
    exercise:[{id:'demo-steps-1',date:'2026-10-01',steps:8000},{id:'demo-steps-2',date:'2026-10-02',steps:12000},{id:'demo-steps-0',date:'2026-10-03',steps:0}],
    ledgerMonths:[{id:'demo-ledger',month:'2026-10',periodStart:'2026-09-18',periodEnd:'2026-10-17',items:[{date:'2026-09-20',category:'variable',amount:500000}]}],
    learningQuizzes:[{id:'demo-quiz-1',status:'completed',completedAt:'2026-10-01T00:00:00Z',total:10,correctCount:10},
      {id:'demo-quiz-2',status:'completed',completedAt:'2026-10-02T00:00:00Z',total:30,correctCount:15}]};
  cloudUser={id:'synthetic-preview-owner',email:'preview@example.invalid'};
  cloudClient={auth:{getUser:async()=>({data:{user:{id:cloudUser.id}},error:null})},from:()=>({select:()=>({eq:()=>({limit:async()=>({data:[{user_id:cloudUser.id,state:structuredClone(state),revision:1}],error:null})})})})};
  document.querySelector('#loginGate').hidden=true;document.querySelector('#loginGate').style.display='none';
  document.querySelector('#app').classList.remove('login-locked');document.querySelector('#app').setAttribute('aria-hidden','false');
  renderAll();showView('home');await dataHubRefresh();
  document.querySelector('#lastSavedLabel').textContent='합성 데이터 미리보기 · 운영 Local/Cloud 연결 없음';
  const note=document.createElement('p');note.className='sub';note.textContent='개발 미리보기 · 아래 수치는 합성 예시입니다. 원본 저장·복원·동기화·배포는 수행하지 않습니다.';
  document.querySelector('#dataHubStatus').parentElement.before(note);
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.matches('[data-life-index],[data-view],[data-go],#dataHubRefresh,#sideToggle,#theme,[data-finish],[data-season]'))return;
    if(button.closest('#haniContextRemote')&&button.getAttribute('aria-label')?.includes('접기'))return;
    event.preventDefault();event.stopImmediatePropagation();
  },true);
});
