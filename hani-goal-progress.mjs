import {projectGoalPeriod} from './data-hub/goal-period-view.mjs';
const names={investment_total_krw:'투자자산',body_weight_kg:'체중',books_completed_count:'완독',steps_daily_average:'일평균 걸음',spending_jispi_krw:'월 지출 예산',quiz_accuracy_percent:'퀴즈 정답률',body_bmi:'BMI',body_fat_percent:'체지방률'};
const units={KRW:'원',book:'권','steps/day':'보/일'};
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>Number.isFinite(value)?value.toLocaleString('ko-KR',{maximumFractionDigits:2}):'—';
const clock=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
let period={type:'quarter',year:Number(clock().slice(0,4)),quarter:Math.ceil(Number(clock().slice(5,7))/3)},rendering=false;
function comparison(progress){
 if(progress.target===null)return progress.goal_status==='NO_GOAL'?'해당 기간 목표 미설정':'목표 이력 확인 필요';
 if(progress.actual===null)return '실적 기록 없음';
 if(progress.semantics==='point_target')return `목표 대비 ${progress.gap>0?'+':''}${number(progress.gap)}`;
 if(progress.semantics==='rate')return `목표 대비 ${number(progress.delta_pp)}%p`;
 if(progress.semantics==='monthly_budget')return `예산 사용률 ${number(progress.usage_rate)}% · 잔여 ${number(progress.remaining)}원`;
 return `달성률 ${number(progress.achievement_rate)}%${progress.pace?` · 현재 속도 예상 ${number(progress.pace.projected)}`:''}`;
}
function render(){
 const host=document.getElementById('goalProgressContent');if(!host||rendering)return;
 rendering=true;
 try{
  const context=goalPeriodReadContext();
  const controls=`<div class="form-grid"><label class="field">조회 기간<select id="goalProgressType"><option value="quarter" ${period.type==='quarter'?'selected':''}>분기</option><option value="annual" ${period.type==='annual'?'selected':''}>연간</option></select></label><label class="field">조회 연도<input id="goalProgressYear" type="number" min="2000" max="2100" value="${period.year}"></label><label class="field" ${period.type==='annual'?'hidden style="display:none"':''}>조회 분기<select id="goalProgressQuarter">${[1,2,3,4].map(q=>`<option value="${q}" ${q===period.quarter?'selected':''}>${q}분기</option>`).join('')}</select></label></div>`;
  let body='<p role="status">원본 검증 대기 · 실적과 목표 비교를 표시하지 않습니다. 데이터 연동의 원본 검증을 먼저 확인해 주세요.</p>';
  if(context){
   const facts=projectGoalPeriod({...context,period,metricIds:Object.keys(names)});
   body='<p class="sub">일부 기록 기준의 참고 실적입니다. 기록 완전성을 확인할 수 없어 확정 결산으로 표시하지 않습니다. 가계부는 결산월 18일~17일 기준이며, 월 예산은 실적을 비교한 월 수에 맞춰 비교합니다.</p><div class="goal-progress-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px">'+facts.map(({definition:d,actual:a,progress:p})=>`<article class="card"><h4>${escape(names[d.metric_id])}</h4><p>실적 <b>${number(a.value)}</b> ${escape(units[d.unit]||d.unit)}</p><p>목표 <b>${number(p.target)}</b> ${escape(units[d.unit]||d.unit)}${p.semantics==='monthly_budget'?' / 월':''}</p><p>${escape(comparison(p))}</p><p class="sub">${a.status==='NO_DATA'?'기록 없음':a.status==='FUTURE_PERIOD'?'시작 전':'일부 기록'} · ${escape(a.period_start)} ~ ${escape(a.period_end)}</p>${a.months_missing.length?`<p class="sub">기록 미확인 월: ${escape(a.months_missing.join(', '))}</p>`:''}${a.months_not_started?.length?`<p class="sub">아직 시작하지 않은 월: ${escape(a.months_not_started.join(', '))}</p>`:''}</article>`).join('')+'</div>';
  }
  host.innerHTML=controls+body;
  host.querySelectorAll('select,input').forEach(el=>el.addEventListener('change',()=>{
   const year=Number(host.querySelector('#goalProgressYear').value);
   if(!Number.isInteger(year)||year<2000||year>2100){host.querySelector('#goalProgressYear').value=period.year;return;}
   period={type:host.querySelector('#goalProgressType').value,year,quarter:Number(host.querySelector('#goalProgressQuarter').value)};render();
  }));
 }catch{host.textContent='목표 진행을 계산하지 못했습니다. 원본과 목표 이력을 확인해 주세요.';}
 finally{rendering=false;}
}
// Report consumers use the same verified projection; failure never returns facts.
function read(requestedPeriod){
 const context=goalPeriodReadContext();
 return context?projectGoalPeriod({...context,period:requestedPeriod,metricIds:Object.keys(names)}):null;
}
window.HANI_GOAL_PROGRESS=Object.freeze({render,read});
render();
