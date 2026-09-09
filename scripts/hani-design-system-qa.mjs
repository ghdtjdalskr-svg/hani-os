// Run with Node. Tests the actual production calculation without loading browser data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const start=source.indexOf('function homeQuizMetrics(){'),end=source.indexOf('\nfunction renderLifeMarket()',start);
assert(start>=0&&end>start,'canonical quiz calculation must exist');
function metrics(state){const before=JSON.stringify(state),context=vm.createContext({state,n:value=>Number(value)||0});vm.runInContext(source.slice(start,end),context);const result=vm.runInContext('homeQuizMetrics()',context);assert.equal(JSON.stringify(state),before,'display calculation must not mutate records');return result}
assert.equal(metrics({}).rate,null,'no submissions must not be displayed as a zero score');
const weighted=metrics({learningQuizzes:[{status:'completed',total:10,correctCount:8},{status:'completed',total:20,correctCount:10},{status:'draft',total:100,correctCount:100}]});
assert.equal(weighted.rate,60,'weight by question count; exclude unfinished submissions');
assert.equal(weighted.pending,1);assert.equal(weighted.wrong,12);
const fallback=metrics({learningQuizzes:[{status:'completed',total:20,correctCount:null,score:75}]});
assert.equal(fallback.rate,75,'a null correct count falls back to the recorded score');
const zero=metrics({learningQuizzes:[{status:'completed',total:10,correctCount:0,score:100}]});
assert.equal(zero.rate,0,'an explicit zero correct count is not missing data');
console.log('PASS: empty, weighted, unfinished, null fallback, explicit zero, immutable records');
