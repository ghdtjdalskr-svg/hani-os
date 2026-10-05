import core from './month-core.generated.mjs';
import {EXTRA_DEFINITIONS,EXTRA_ADAPTERS,periodMonths,aggregatePeriod,resolvePeriodGoal,goalProgress} from './period-goal.mjs';

// Shared read-only projection. Report callers can consume these same numeric facts.
export function projectGoalPeriod({source,canonical,asOf,evaluationAt,period,metricIds}){
 const definitions=[...core.DEFAULT_REGISTRY,...EXTRA_DEFINITIONS].filter(d=>metricIds.includes(d.metric_id));
 const rows=periodMonths(period).flatMap(month=>core.calculateMonth(source,{month,asOf,calculatedAt:evaluationAt,
  registry:definitions,adapters:{...core.SOURCE_ADAPTERS,...EXTRA_ADAPTERS},canonical,
  sourceContext:Object.fromEntries(definitions.map(d=>[d.source,{ready:Array.isArray(source[d.source])&&
   (d.source!=='books'||source.books.some(row=>row.status==='read'&&String(row.readDate||row.completedDate||'').startsWith(month))),complete:false}]))}));
 return definitions.map(definition=>{
  const actual=aggregatePeriod(rows,definition,period,{asOf});
  const goal=resolvePeriodGoal(source.goalRegistry||[],definition,period,{asOf,evaluationAt});
  return {definition,actual,goal,progress:goalProgress(actual,goal,definition)};
 });
}
