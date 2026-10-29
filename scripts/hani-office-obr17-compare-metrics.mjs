// Diagnostic only: identical scheduling inputs, independent process per sample.
// Does not replace the canonical obr16 metrics gate or change its thresholds.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
const [mode,run]=process.argv.slice(2);assert.ok(['base','patched'].includes(mode));assert.ok(['1','2','3'].includes(run));
const base=fs.readFileSync('artifacts/office-behavior/obr17-base.txt','utf8'),current=fs.readFileSync('hani-office-live.js','utf8'),marker='/* Read-only Living Office.';
assert.equal(base.slice(0,base.indexOf(marker)),current.slice(0,current.indexOf(marker)));
const {scene}=loadScene({transform:source=>mode==='base'?base:source}),s=scene.scheduler,day='2026-10-22',o={chairmanPresent:true,chairmanSince:at(day,32400).getTime(),chairmanArrivalAt:at(day,32400).getTime()};
const start=performance.now(),formal=s.plan(day,o),outings=s.blockPlan(day,0,formal,o),cold=performance.now()-start,begin=performance.now();
for(let i=0;i<1000;i++)s.snapshot(at(day,50400+i),o);
const result={node:process.version,mode,run:Number(run),sourceSha256:createHash('sha256').update(mode==='base'?base:current).digest('hex'),cold,warm:(performance.now()-begin)/1000,reports:outings.filter(e=>e.report).length};
fs.writeFileSync(`artifacts/office-behavior/obr17-compare-${mode}-${run}.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
