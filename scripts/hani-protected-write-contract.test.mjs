import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';
import {evaluateProtectedWriteContract} from './hani-protected-write-contract.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),h=hash('synthetic'),base='a'.repeat(40),candidate='b'.repeat(40);
const tests=Object.entries({protected_runtime:28,backup_runtime:11,access_ui:6,transaction_runtime:1,owner_handlers:2,storage_gate_negative:19}).map(([id,cases])=>({id,cases,status:'PASS',test_sha256:h,output_sha256:h}));
const evidence={version:1,status:'PASS',base_sha:base,candidate_sha:candidate,runtime_sha256:h,baseline_runtime_sha256:h,package_sha256:h,tests};
const policy={version:1,approval:'OWNER_REVIEWED',approval_id:'synthetic-only',base_sha:base,source_candidate_sha:candidate,runtime_sha256:h,baseline_runtime_sha256:h,package_sha256:h,evidence_sha256:hash(JSON.stringify(evidence)),expires_at:'2099-01-01T00:00:00Z'};
const input={policy,evidence,evidenceHash:policy.evidence_sha256,baselineSha:base,candidateSha:candidate,runtimeHash:h,baselineRuntimeHash:h,packageHash:h,now:Date.now(),surface:{storage_key:'hani_os_life_v23',internal_version:'2.9.15-safe-baseline-bootstrap',writes:2,removes:1,clears:0,cloud_calls:6}};
const server=fs.readFileSync(new URL('../supabase/functions/hani-deploy-bridge/index.ts',import.meta.url),'utf8');
const shared=server.match(/\/\/ HANI_PROTECTED_CONTRACT_START\r?\n([\s\S]*?)\/\/ HANI_PROTECTED_CONTRACT_END/)[1];
const local=fs.readFileSync(new URL('./hani-protected-write-contract.mjs',import.meta.url),'utf8').slice(fs.readFileSync(new URL('./hani-protected-write-contract.mjs',import.meta.url),'utf8').indexOf('export function')).replace('export function','function').replaceAll('\r\n','\n').trim();
assert.equal(stripTypeScriptTypes(shared).replaceAll('\r\n','\n').replace('input     )','input)').trim(),local);
const serverEvaluate=new Function(stripTypeScriptTypes(shared)+';return evaluateProtectedWriteContract')();
let cases=0;
for(const check of [evaluateProtectedWriteContract,serverEvaluate]){
 assert.equal(check(input).ok,true);assert.equal(check({...input,candidateSha:''}).ok,true,'server transfer keeps exact runtime and package binding');
 const negative=[['missing policy',x=>x.policy=null],['unreviewed',x=>x.policy.approval='PENDING'],['expired',x=>x.policy.expires_at='2000-01-01'],['base drift',x=>x.baselineSha='c'.repeat(40)],['candidate drift',x=>x.candidateSha='c'.repeat(40)],['runtime mutation',x=>x.runtimeHash=hash('lock/rollback removed')],['baseline mutation',x=>x.baselineRuntimeHash=hash('drift')],['asset/package mutation',x=>x.packageHash=hash('asset changed')],['evidence tamper',x=>x.evidenceHash=hash('fake')],['failed execution',x=>x.evidence.tests[0].status='FAIL'],['missing execution',x=>x.evidence.tests.pop()],['duplicate execution',x=>x.evidence.tests.push(x.evidence.tests[0])],['low coverage',x=>x.evidence.tests[0].cases=1],['protected key',x=>x.surface.storage_key='changed'],['internal version',x=>x.surface.internal_version='changed'],['write bypass',x=>x.surface.writes=3],['remove bypass',x=>x.surface.removes=2],['clear original',x=>x.surface.clears=1],['cloud query change',x=>x.surface.cloud_calls=7]];
 for(const [name,mutate] of negative){const changed=structuredClone(input);mutate(changed);assert.equal(check(changed).ok,false,name);if(check===evaluateProtectedWriteContract)cases++;}
 assert.equal(check({}).ok,false);
}
console.log(`PASS ${cases} negative storage gate cases; Node/server contract identical; synthetic approval only, no actual policy configured.`);
