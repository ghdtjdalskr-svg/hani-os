// Local evidence only. Capture is explicit and must run before the runtime patch.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {gzipSync} from 'node:zlib';
import inspector from 'node:inspector';
import {performance} from 'node:perf_hooks';
import {loadScene,root,at} from './hani-office-lively-fixture.mjs';
const args=process.argv.slice(2),output=args.includes('-o')?args[args.indexOf('-o')+1]:'artifacts/office-behavior/obr6-measure.json';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const source=fs.readFileSync(new URL('hani-office-live.js',root));
const cases=[
 {label:'평일',day:'2026-10-22',seconds:32400,options:{}},
 {label:'주말',day:'2026-10-24',seconds:45000,options:{}},
 {label:'심야',day:'2026-10-23',seconds:6000,options:{presentIds:['seoyun','dohyun','serin','yuri','arin','hina','yuna','minji']}}
];
if(args.includes('--capture')){
 const records=cases.map(c=>{const {scene}=loadScene(),s=scene.scheduler,formal=s.plan(c.day,c.options),outings=s.blockPlan(c.day,0,formal,c.options);
  return {...c,formal,outings,snapshot:s.snapshot(at(c.day,c.seconds),c.options)};
 });
 const bytes=Buffer.from(JSON.stringify({base:'d5642fc1a92b7afff2d61b5845535d47d44994a2',sourceSha256:hash(source),records}));
 const fixture=new URL('scripts/fixtures/office-obr6-plans.json.gz',root);
 if(fs.existsSync(fixture))throw Error('Refusing to overwrite pre-patch plans');
 fs.writeFileSync(fixture,gzipSync(bytes));
 console.log('수정 전 계획 고정',records.map(r=>({day:r.day,formal:r.formal.length,outings:r.outings.length})),hash(bytes));
}else{
 const {scene}=loadScene(),s=scene.scheduler,session=new inspector.Session();
 const post=method=>new Promise((resolve,reject)=>session.post(method,(e,r)=>e?reject(e):resolve(r)));
 if(args.includes('--profile')){session.connect();await post('Profiler.enable');await post('Profiler.start')}
 const begin=performance.now(),formal=s.plan('2026-10-22'),formalMs=performance.now()-begin;
 const outings=s.blockPlan('2026-10-22',0,formal),firstMs=performance.now()-begin;
 if(args.includes('--profile')){const {profile}=await post('Profiler.stop');session.disconnect();fs.writeFileSync(output+'.cpuprofile',JSON.stringify(profile))}
 const warm=performance.now();for(let i=0;i<1000;i++)s.snapshot(at('2026-10-22',50400+i));const warmMs=(performance.now()-warm)/1000;
 const result={sourceSha256:hash(source),node:process.version,formalMs,outingMs:firstMs-formalMs,firstMs,warmMs,formal:formal.length,outings:outings.length};
 fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}
