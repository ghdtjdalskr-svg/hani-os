import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const block=source.slice(source.indexOf('let monthlyReportMonth='),source.indexOf('\nfunction renderAll()',source.indexOf('let monthlyReportMonth=')));
const ledger=source.slice(source.indexOf('function ledgerCalc('),source.indexOf('const LEDGER_CATEGORY_LABELS='));
const settlement=source.match(/function ledgerSettlementPeriod\(month\)\{[^\n]+/)[0];
const state={
  goals:{investment:1},tasks:[{date:'2026-09-01'}],campusSemesters:[{}],
  exercise:[{date:'2026-09-01',steps:8000,distance:6},{date:'2026-09-02',steps:12000,distance:9,updatedAt:'2026-09-02T02:00:00Z'},{date:'2026-09-02',steps:9000,updatedAt:'2026-09-02T01:00:00Z'},{date:'2026-09-03',steps:0,strength:true},{date:'2026-09-04',steps:-50},{date:'2026-09-31',steps:999},{date:'2026-09-30',steps:999}],
  body:[{date:'2026-09-02',weight:101},{date:'2026-09-02',weight:100},{date:'2026-09-03',weight:99.5},{date:'2026-09-04',weight:0},{date:'2026-09-05',weight:'invalid'}],
  books:[{status:'read',completedDate:'2026-09-01'},{status:'read',readDate:'2026-09-02'},{status:'read',completedDate:'2026-09-03',readDate:'2026-08-03'},{status:'reading',completedDate:'2026-09-01'}],
  movies:[{status:'watched',watchedDate:'2026-09-04',title:'시리즈',review:'시즌 1 · 12화까지'},{status:'watched',watchedDate:'2026-09-05',title:'시리즈',review:'시즌 2 · 24화까지'}],
  learningQuizzes:[{status:'completed',completedAt:'2026-08-31T15:00:00Z',total:10,correctCount:10},{status:'completed',completedAt:'2026-09-01T01:00:00+09:00',total:30,correctCount:15},{status:'completed',completedAt:'2026-08-31T14:59:59Z',total:20,correctCount:20},{status:'completed',total:20,correctCount:20},{status:'completed',completedAt:'2026-09-02T01:00:00Z',total:20,correctCount:null},{status:'pending',completedAt:'2026-09-02T01:00:00Z'}],
  investmentBrokerSnapshots:[{mode:'actual',status:'confirmed',period:'2026-09',snapshotDate:'2026-09-20',total:100},{mode:'actual',status:'confirmed',period:'2026-09',snapshotDate:'2026-09-30',total:999},{mode:'plan',status:'confirmed',period:'2026-09',snapshotDate:'2026-09-21',total:999}],
  ledgerMonths:[{month:'2026-09',items:[{date:'2026-09-01',category:'fixed',amount:100,reimbursement:10},{date:'2026-09-02',category:'finance',amount:500},{date:'2026-09-30',category:'variable',amount:999}]}]
};
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x)}return x};
freeze(state);
const elements=new Map();
const context=vm.createContext({state,n:x=>Number(x)||0,brokerCalc:x=>({total:x.total}),ledgerFind:month=>state.ledgerMonths.find(x=>x.month===month),ratingValue:x=>x==null?null:Number(x),won:x=>`${x}원`,num:x=>String(x),esc:x=>String(x),ledgerMonthLabel:x=>x,$:id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id)}});
vm.runInContext(ledger+settlement+'\n'+block,context);
const run=expression=>vm.runInContext(expression,context);
assert.equal(run('monthlyReportDate("2026-02-29")'),'');
assert.equal(run('monthlyReportDate("2024-02-29")'),'2024-02-29');
assert.equal(run('monthlyReportPrevMonth("2026-01")'),'2025-12');
assert.equal(run('monthlyReportPrevMonth("2026-13")'),'');
assert.equal(run('monthlyReportKoreaDate("2026-08-31T15:00:00Z")'),'2026-09-01');
assert.equal(run('monthlyReportKoreaDate("2026-09-01T00:00:00")'),'');
const before=JSON.stringify(state),r=run('monthlyReportSnapshot("2026-09","2026-09-27")');
assert.equal(r.totalSteps,20000);assert.equal(r.stepDays.length,2);assert.equal(r.exercise.length,4);assert.equal(r.totalDistance,15);
assert.equal(r.body.length,2);assert.equal(r.firstBody.weight,100);assert.equal(r.lastBody.weight,99.5);assert.equal(r.duplicateDays,2);
assert.equal(r.books.length,2);assert.equal(r.movies.length,2);
assert.equal(r.quizzes.length,3);assert.equal(r.scoredQuizzes.length,2);assert.equal(r.quizCorrect,25);assert.equal(r.quizTotal,40);assert.equal(r.quizCorrect/r.quizTotal*100,62.5);
assert.equal(r.investmentCalc.total,100);assert.equal(r.ledgerSummary.jispiT,90);assert.equal(r.ledgerPeriod.periodStart,'2026-08-18');assert.equal(r.ledgerPeriod.periodEnd,'2026-09-17');
assert.equal(run('monthlyReportSnapshot("2026-10","2026-09-27").recordCount'),0);
assert.equal(run('monthlyReportSnapshot("2026-13","2026-09-27").recordCount'),0);
// Render against a fixed cutoff while preserving the production implementation.
run('const reportOriginalSnapshot=monthlyReportSnapshot;monthlyReportSnapshot=month=>reportOriginalSnapshot(month,"2026-09-27");monthlyReportMonth="2026-09";renderMonthlyReport()');
const html=[...elements.values()].map(x=>x.innerHTML||x.textContent||'').join('\n');
for(const label of ['62.5%','시청 기록 2건','첫 측정 대비','10,000보','당시 목표 미보관','2026-08-18 ~ 2026-09-17'])assert(html.includes(label),label);
assert(!html.includes('10000.0%'));assert(!html.includes('월초 대비'));
assert.equal(JSON.stringify(state),before,'snapshot/render must not mutate any source record');
context.state=freeze({exercise:[{date:'2026-09-03',steps:0,strength:true}],body:[],books:[],movies:[],learningQuizzes:[]});
run('renderMonthlyReport()');
assert(elements.get('monthlyReportDomains').innerHTML.includes('걸음 기록 없음'),'strength-only activity must not imply observed zero steps');
assert.equal(run('monthlyReportKoreaDate(null)'),'');
console.log('PASS: strict dates, KST boundary, future exclusion, daily dedup, positive-step average, media input units, book compatibility/conflict, weighted quiz accuracy, historical target isolation, settlement basis, renderer, immutable state');
