import {periodMonths} from './period-goal.mjs';

// A review aid only: never changes a target or derives a health recommendation.
export function nextGuidancePeriod(period) {
 periodMonths(period);
 const next=period.type==='annual'?{type:'annual',year:period.year+1}:
  period.type==='quarter'?{type:'quarter',year:period.year+(period.quarter===4?1:0),quarter:period.quarter===4?1:period.quarter+1}:null;
 if(!next||next.year>2100)throw new TypeError('Unsupported next goal period');
 return next;
}
export function guidancePreview(facts,period) {
 const next=nextGuidancePeriod(period);
 return facts.map(({definition,actual,progress})=>Object.freeze({metric_id:definition.metric_id,unit:definition.unit,
  period:Object.freeze({...next}),value:progress.goal_status==='RESOLVED'?progress.target:null,
  action:progress.goal_status==='RESOLVED'?'KEEP':progress.goal_status==='NO_GOAL'?'SET':'REVIEW',
  reason:progress.goal_status==='CONFLICT'?'목표 이력이 겹쳐 먼저 확인이 필요합니다.':
   progress.target===null?'다음 기간 목표값을 직접 정해 주세요.':
   actual.value===null?'실적 기록이 없어 기존 목표를 참고값으로만 유지합니다.':
   '기존 목표를 참고값으로 제안합니다. 실적과 생활 여건을 검토해 수정해 주세요.',
  partial:actual.status!=='CONFIRMED'}));
}
