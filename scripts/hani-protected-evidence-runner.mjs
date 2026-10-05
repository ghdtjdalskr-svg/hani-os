import fs from 'node:fs';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {sha256,canonicalPackageHash,modularRuntimeText} from './hani-one-pass-rules.mjs';
const root=path.resolve(import.meta.dirname,'..'),args=process.argv.slice(2),option=n=>{const i=args.indexOf(n);return i<0?'':args[i+1]};
const packagePath=option('--package'),playwright=option('--playwright'),browser=option('--browser');
if(!packagePath||!playwright||!browser)throw Error('Require --package --playwright --browser');
const git=(argv,binary=false)=>execFileSync('git',argv,{cwd:root,encoding:binary?null:'utf8',maxBuffer:40*1024*1024});
const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8')),candidate=git(['rev-parse','HEAD']).trim();
if(candidate!==pkg.candidate_sha||git(['rev-parse','origin/main']).trim()!==pkg.base_main_sha)throw Error('Frozen candidate/base drift');
if(canonicalPackageHash(pkg.files).package_sha256!==pkg.package_sha256)throw Error('Package integrity failure');
const evidenceRoot=path.join(root,'qa-evidence'),frozen=path.join(evidenceRoot,'frozen-'+candidate.slice(0,12));fs.mkdirSync(frozen,{recursive:true});
const put=(file,bytes)=>{const target=path.resolve(frozen,file);if(!target.startsWith(frozen+path.sep))throw Error('Unsafe path');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes)};
for(const file of pkg.files){const bytes=file.encoding==='base64'?Buffer.from(file.content,'base64'):Buffer.from(file.content,'utf8');if(!git(['show',candidate+':'+file.path],true).equals(bytes))throw Error('Entry differs from frozen commit: '+file.path);put(file.path,bytes)}
const helpers=git(['ls-tree','-r','--name-only',candidate,'scripts','dev-center','supabase/functions/hani-deploy-bridge','supabase/functions/hani-learning-quiz']).trim().split('\n').filter(p=>/\.(?:mjs|json|ts)$/.test(p));
for(const file of helpers)put(file,git(['show',candidate+':'+file],true));
const map=new Map(pkg.files.filter(f=>/\.(?:html|js|css)$/i.test(f.path)).map(f=>[f.path,f.encoding==='base64'?Buffer.from(f.content,'base64').toString('utf8'):f.content]));
const baselineMap=new Map([...map.keys()].map(file=>[file,git(['show',pkg.base_main_sha+':'+file])])),runtimeHash=sha256(modularRuntimeText(map));
const tests=[];
const plan=[['protected_runtime','hani-quality-data-runtime.test.mjs',28,true],['backup_runtime','hani-backup-history-runtime.test.mjs',11,true],['access_ui','hani-access-ui.test.mjs',6,true],['transaction_runtime','hani-transaction-runtime.test.mjs',1,true],['owner_handlers','hani-server-owner-access.test.mjs',2,false],['storage_gate_negative','hani-protected-write-contract.test.mjs',19,false],['storage_gate_integration','hani-protected-gate-integration.test.mjs',12,false]];
for(const [id,file,minimum,usesBrowser] of plan){
 const result=spawnSync(process.execPath,[path.join(frozen,'scripts',file),...(usesBrowser?[playwright,browser]:[])],{cwd:frozen,encoding:'utf8',maxBuffer:3*1024*1024,timeout:180000});
 const output=(result.stdout||'')+(result.stderr||'');fs.writeFileSync(path.join(evidenceRoot,id+'.log'),output);
 const matched=(result.stdout||'').match(/PASS (\d+) /),cases=matched?Number(matched[1]):id==='owner_handlers'?(result.stdout.match(/^PASS hani-/gm)||[]).length:id==='transaction_runtime'&&result.stdout.startsWith('PASS actual transaction handler')?1:0;
 const ok=result.status===0&&cases>=minimum;
 tests.push({id,status:ok?'PASS':'FAIL',cases,test_sha256:sha256(git(['show',candidate+':scripts/'+file],true)),output_sha256:sha256(output)});
 console.log(id+': '+(ok?'PASS':'FAIL')+' / '+cases);
 if(!ok)break;
}
const reviewed_files={};for(const file of git(['diff','--name-only',pkg.base_main_sha,candidate]).trim().split('\n').filter(Boolean)){try{reviewed_files[file]=sha256(git(['show',candidate+':'+file],true))}catch(_){throw Error('Deleted file requires separate review: '+file)}}
const finalPackageHash=canonicalPackageHash(pkg.files).package_sha256;
if(candidate!==git(['rev-parse','HEAD']).trim()||pkg.base_main_sha!==git(['rev-parse','origin/main']).trim()||pkg.package_sha256!==finalPackageHash)throw Error('Identity changed during execution');
const evidence={version:1,status:tests.length===plan.length&&tests.every(x=>x.status==='PASS')?'PASS':'FAIL',base_sha:pkg.base_main_sha,candidate_sha:candidate,runtime_sha256:runtimeHash,baseline_runtime_sha256:sha256(modularRuntimeText(baselineMap)),package_sha256:pkg.package_sha256,generated_at:new Date().toISOString(),environment:'frozen committed bytes / isolated Edge / external requests blocked',tests,reviewed_files};
const evidenceText=JSON.stringify(evidence);fs.writeFileSync(path.join(evidenceRoot,'protected-write-evidence.json'),evidenceText);
const policy={version:1,approval:'PENDING_REVIEW',approval_id:'',base_sha:pkg.base_main_sha,source_candidate_sha:candidate,runtime_sha256:runtimeHash,baseline_runtime_sha256:evidence.baseline_runtime_sha256,package_sha256:pkg.package_sha256,evidence_sha256:sha256(evidenceText),expires_at:''};
fs.writeFileSync(path.join(evidenceRoot,'protected-write-policy-template.json'),JSON.stringify(policy,null,2));
console.log('Evidence '+evidence.status+'. Policy remains PENDING_REVIEW; no server settings changed.');if(evidence.status!=='PASS')process.exitCode=1;
