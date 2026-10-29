import fs from 'node:fs';
import inspector from 'node:inspector';
import {promisify} from 'node:util';
import {performance} from 'node:perf_hooks';
import {loadScene} from './hani-office-lively-fixture.mjs';
const {scene}=loadScene(),s=scene.scheduler,session=new inspector.Session();session.connect();const post=promisify(session.post.bind(session));
await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:100});await post('Profiler.start');
const begin=performance.now(),o={chairmanPresent:true},f=s.plan('2026-10-22',o),middle=performance.now(),out=s.blockPlan('2026-10-22',0,f,o),end=performance.now();
const {profile}=await post('Profiler.stop');session.disconnect();
fs.writeFileSync('artifacts/office-behavior/obr15-profile.cpuprofile',JSON.stringify(profile));
const sums=new Map();for(const node of profile.nodes){const key=node.callFrame.functionName+' @'+node.callFrame.lineNumber;sums.set(key,(sums.get(key)||0)+(node.hitCount||0));}
console.log({formalMs:middle-begin,outingsMs:end-middle,formal:f.length,outings:out.length,top:[...sums].sort((a,b)=>b[1]-a[1]).slice(0,25)});
