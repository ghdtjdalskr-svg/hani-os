import {guidancePreview} from './data-hub/guidance-preview.mjs';

const reportNames={...names,media_watched_count:'시청 작품 수'};
const reportUnits={...units,title:'편'};
const reportPeriods={quarter:{type:'quarter',year:Number(clock().slice(0,4)),quarter:Math.ceil(Number(clock().slice(5,7))/3)},annual:{type:'annual',year:Number(clock().slice(0,4))}};
let reportRendering=false;
function reportRead(requestedPeriod){
 const context=goalPeriodReadContext();
 return context?projectGoalPeriod({...context,period:requestedPeriod,metricIds:Object.keys(reportNames)}):null;
}
function reportCards(facts){
 return facts.map(({definition:d,actual:a,progress:p})=>`<article class="card"><h4>${escape(reportNames[d.metric_id])}</h4><p>실적 <b>${number(a.value)}</b> ${escape(reportUnits[d.unit]||d.unit)}</p><p>목표 <b>${number(p.target)}</b> ${escape(reportUnits[d.unit]||d.unit)}${p.semantics==='monthly_budget'?' / 월':''}</p><p>${escape(comparison(p))}</p><p class="sub">${a.value===null?'기록 없음':'일부 기록 기준'} · ${escape(a.period_start)} ~ ${escape(a.period_end)}</p>${a.months_missing.length?`<p class="sub">기록 미확인 월: ${escape(a.months_missing.join(', '))}</p>`:''}</article>`).join('');
}
function goalDraftFromGuidance(item,value){
 if(item.action==='REVIEW')throw Error('기존 목표 이력을 먼저 확인해 주세요.');
 const n=Number(value);if(!Number.isFinite(n)||n<=0||item.unit==='%'&&n>100||item.metric_id==='media_watched_count'&&!Number.isInteger(n))throw Error('목표값을 확인해 주세요.');
 showView('settings');renderGoalRegistry();
 const form=document.getElementById('goalRegistryForm'),set=(name,value)=>{const el=form?.elements.namedItem(name);if(!el)throw Error('목표 입력 화면을 찾지 못했습니다.');el.value=String(value);return el;};
 const metric=set('metric_id',item.metric_id);if(metric.value!==item.metric_id)throw Error('이 목표 분야의 등록 기능은 다음 배포를 기다립니다.');
 set('goal_type',item.period.type);set('year',item.period.year);set('quarter',item.period.quarter||1);
 set('year',item.period.year).dispatchEvent(new Event('change',{bubbles:true}));
 set('value',n);form.dispatchEvent(new Event('change',{bubbles:true}));
 form.scrollIntoView({block:'center'});toast('목표 입력칸에 옮겼습니다. Preview 확인 후 승인해 주세요.');
}
function renderReportProgress(){
 if(reportRendering)return;reportRendering=true;
 try{
 for(const type of ['quarter','annual']){
  const host=document.getElementById(type==='quarter'?'quarterGoalReport':'annualGoalReport');if(!host)continue;
  const p=reportPeriods[type];let facts=null;try{facts=reportRead(p)}catch{}
  const controls=`<div class="form-grid"><label class="field">조회 연도<input data-report-year type="number" min="2000" max="2100" value="${p.year}"></label>${type==='quarter'?`<label class="field">조회 분기<select data-report-quarter>${[1,2,3,4].map(q=>`<option value="${q}" ${p.quarter===q?'selected':''}>${q}분기</option>`).join('')}</select></label>`:''}</div>`;
  let content='<p role="status">원본 검증 대기 · 목표와 실적을 표시하지 않습니다.</p>';
  if(facts){
   let draft=[];try{draft=guidancePreview(facts,p)}catch{}
   content=`<p class="sub">설정의 기간 진행과 동일한 계산 결과입니다. 미확인 월을 제외한 참고 실적이며 확정 결산이 아닙니다.</p><div class="goal-progress-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px">${reportCards(facts)}</div><h4>다음 기간 목표 검토</h4><p class="sub">기존 목표를 참고값으로 제안합니다. 값 선택만으로 저장되지 않습니다. 목표 관리에서 Preview와 승인을 거쳐 주세요.</p><div class="form-grid">${draft.map((d,i)=>`<div class="card"><h4>${escape(reportNames[d.metric_id])} · ${d.period.year}년 ${d.period.quarter?d.period.quarter+'분기':'연간'}</h4><p>${escape(d.reason)}</p><label class="field">검토할 목표 (${escape(reportUnits[d.unit]||d.unit)})<input data-guidance-value="${i}" type="number" min="0" step="${d.metric_id==='media_watched_count'?'1':'any'}" value="${d.value??''}" ${d.action==='REVIEW'?'disabled':''}></label><button type="button" class="btn" data-guidance-use="${i}" ${d.action==='REVIEW'?'disabled':''}>목표 입력칸으로</button></div>`).join('')}</div>`;
   host._guidance=draft;host._factsSignature=JSON.stringify(facts);
  }else {host._guidance=[];host._factsSignature='';}
  host.innerHTML=controls+content;
  host.querySelectorAll('[data-report-year],[data-report-quarter]').forEach(el=>el.onchange=()=>{const year=Number(host.querySelector('[data-report-year]').value);if(!Number.isInteger(year)||year<2000||year>2100){renderReportProgress();return}reportPeriods[type]={type,year,...(type==='quarter'?{quarter:Number(host.querySelector('[data-report-quarter]').value)}:{})};renderReportProgress()});
  host.querySelectorAll('[data-guidance-use]').forEach(button=>button.onclick=()=>{
   try{const i=Number(button.dataset.guidanceUse),draft=host._guidance[i],signature=host._factsSignature,value=host.querySelector(`[data-guidance-value="${i}"]`).value,fresh=reportRead(reportPeriods[type]);if(!fresh||JSON.stringify(fresh)!==signature)throw Error('원본 또는 목표가 바뀌었습니다. 다시 확인해 주세요.');goalDraftFromGuidance(draft,value)}catch(e){toast(e.message);renderReportProgress()}
  });
 }
 }finally{reportRendering=false;}
}
window.HANI_GOAL_PROGRESS=Object.freeze({render:()=>{render();renderReportProgress()},read:reportRead,renderReport:renderReportProgress,renderMonthly:renderCommonMonthlyReport,suggestMonthlyBudget});
renderReportProgress();
function renderCommonMonthlyReport(month){
 const match=/^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);if(!match)return false;
 let facts=null;try{facts=reportRead({type:'month',year:Number(match[1]),month:Number(match[2])})}catch{}
 const kpis=document.getElementById('monthlyReportKpis'),domains=document.getElementById('monthlyReportDomains');if(!kpis||!domains)return false;
 if(!facts){kpis.innerHTML='';domains.innerHTML='<p role="status">원본 검증 대기 · 새 보고서 계산을 표시하지 않습니다.</p>';document.getElementById('monthlyReportInsightTitle').textContent='원본 검증 대기';document.getElementById('monthlyReportInsight').textContent='데이터 연동에서 원본 검증을 확인해 주세요.';return 'BLOCKED';}
 const meta={investment_total_krw:['finance','FINANCE','투자'],spending_jispi_krw:['money','MONEY','소비'],body_weight_kg:['health','HEALTH','신체'],steps_daily_average:['activity','ACTIVITY','활동'],books_completed_count:['culture','CULTURE','독서'],quiz_accuracy_percent:['learning','LEARNING','학습'],body_bmi:['health','HEALTH','BMI'],body_fat_percent:['health','HEALTH','체지방률'],media_watched_count:['culture','CULTURE','시청']};
 kpis.innerHTML=facts.slice(0,6).map(({definition:d,actual:a})=>`<div class="card monthly-report-kpi"><span>${escape(reportNames[d.metric_id])}</span><strong>${a.value===null?'기록 없음':number(a.value)+' '+escape(reportUnits[d.unit]||d.unit)}</strong><small>공통 계산 · 일부 기록 기준</small></div>`).join('');
 domains.innerHTML=facts.map(({definition:d,actual:a})=>{const [tone,eyebrow,title]=meta[d.metric_id];return monthlyReportDomainCard({tone,eyebrow,title,empty:a.value===null,headline:a.value===null?'확인된 기록이 없어요':`${number(a.value)} ${reportUnits[d.unit]||d.unit}`,comment:'Data Hub 및 기간 보고서와 같은 원본·집계 기준으로 확인했습니다. 기록의 완전성이 확인되지 않아 확정 결산으로 판단하지 않습니다.',basis:`${a.period_start} ~ ${a.period_end}. ${d.kind==='average'?'양수 걸음 기록일의 가중 평균.':d.kind==='ratio'?'확인된 정답 수 / 문항 수.':d.kind==='point_in_time'?'유효한 최근 관측값.':'유효한 완료 기록 합계.'} 미확인 기록을 0으로 채우지 않습니다.`,metrics:[['실적',a.value===null?'기록 없음':`${number(a.value)} ${reportUnits[d.unit]||d.unit}`],['목표 기준','월간 목표를 임의 생성하지 않음']]})}).join('');
 document.getElementById('monthlyReportInsightTitle').textContent=month+' · 공통 기준 월간 실적';document.getElementById('monthlyReportInsight').textContent='분기·연간 목표 비교는 해당 보고서 탭에서 확인합니다. 기존 보관 보고서는 생성 당시 내용으로 유지됩니다.';return true;
}
