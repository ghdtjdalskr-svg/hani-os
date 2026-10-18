// Synthetic records only. Shared by the Node regression and optional browser QA.
import {readFileSync} from 'node:fs';
export const main=readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
export function between(start,end){
  const a=main.indexOf(start),b=main.indexOf(end,a);
  if(a<0||b<=a)throw Error('CODEMAP_MISS: '+start);
  return main.slice(a,b);
}
export const bundle=between('// BEGIN GENERATED HANI DATA HUB','// END GENERATED HANI DATA HUB');
export const presentationCode=between('function ledgerJispiStatus(','\nfunction ledgerPrev(')+
  between('function lifeDirection(','\nfunction homeQuizMetrics(')+
  between('function dataHubLifeCardPresentation(','\nfunction dataHubRenderDashboard(');
export const rendererCode=between('function dataHubRenderDashboard(','\n// Read-only period projection;');
export const source={
  investmentBrokerSnapshots:[
    {mode:'actual',status:'confirmed',period:'2026-08',snapshotDate:'2026-08-31',total:100000000},
    {mode:'actual',status:'confirmed',period:'2026-09',snapshotDate:'2026-09-30',total:120000000}],
  body:[{date:'2026-08-20',weight:100},{date:'2026-09-20',weight:98}],
  books:[{id:'a',status:'read',readDate:'2026-08-20'},
    {id:'b',status:'read',readDate:'2026-09-20'},{id:'c',status:'read',readDate:'2026-09-21'}],
  exercise:[{date:'2026-08-20',steps:5000},{date:'2026-09-20',steps:6000}],
  ledgerMonths:[{month:'2026-08',items:[{date:'2026-08-10',category:'variable',amount:100000}]},
    {month:'2026-09',items:[{date:'2026-09-10',category:'variable',amount:130000}]}],
  learningQuizzes:[{status:'completed',completedAt:'2026-08-20T00:00:00Z',total:10,correctCount:6},
    {status:'completed',completedAt:'2026-09-20T00:00:00Z',total:10,correctCount:8}]
};
export const goals=[{metric_id:'spending_jispi_krw',goal_id:'fixture-budget',revision:1,
  goal_type:'quarter',year:2026,quarter:3,status:'active',unit:'KRW',semantics:'monthly_budget',
  value:100000,effective_from:'2026-07-01',created_at:'2026-07-01T00:00:00Z'}];
// Exact rendered expectations shared by Node and browser; no real user records.
export const expectedCards={
  hasdaq:{value:'120,000,000원',change:'▲ +20,000,000원 (+20%)',tone:'up',market:'📈 상승장'},
  ne100:{value:'98kg',change:'▼ -2kg (-2%)',tone:'up',market:'📈 상승장'},
  hinaJones:{value:'2권',change:'▲ +1권 (+100%)',tone:'up',market:'📈 상승장'},
  harukei:{value:'6,000보',change:'▲ +1,000보 (+20%)',tone:'up',market:'📈 상승장'},
  jispi:{value:'130,000원',change:'▲ +30,000원 (+30%)',tone:'down',market:'🛑 지출 서킷브레이커'},
  hinkei:{value:'80%',change:'▲ +20%p (+33.33%)',tone:'up',market:'📈 상승장'}
};
export function makeRuntime(api,{records=structuredClone(source),targets=goals,onChange=()=>{}}={}){
  const binding={userId:'fixture',sourceOwnerId:'fixture',sourceOwnerVerified:true,
    datasetId:'fixture',projectRef:'fixture',sessionEpoch:'1'};
  return api.createDashboardRuntime({getSource:()=>records,getContext:()=>binding,getBinding:()=>binding,
    verify:async()=>({status:'VERIFIED'}),getMonth:()=> '2026-09',clock:()=> '2026-10-18T03:00:00Z',
    getGoals:()=>targets,canonical:{version:'fixture',brokerTotal:r=>r.total,
      ledgerSpending:r=>r.items.reduce((sum,item)=>sum+item.amount,0)},onChange,
    storeFactory:()=>({invalidate(){},async activate(){throw Error('Isolated memory fixture')}})});
}
