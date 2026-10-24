// Test-only input adapter. No subprocess/browser/production change. Each read-only
// git-show input is served from git-archive bytes verified against git ls-tree OIDs.
// Original test bodies and their assertions execute unchanged.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
const root=new URL('./',import.meta.url),inputs=new Map(),manifest=[];
for(const entry of JSON.parse(fs.readFileSync(new URL('snapshot-plan.json',root),'utf8'))){
 const trees=fs.readFileSync(new URL(entry.dir+'.tree',root),'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/);
 const commit=fs.readFileSync(new URL(entry.dir+'.commit',root),'utf8').replace(/^\uFEFF/,'').trim();assert.match(commit,/^[a-f0-9]{40}$/);
 for(const file of entry.files){
  const row=trees.find(row=>row.endsWith('\t'+file));assert.ok(row,entry.ref+':'+file+' git tree row');
  const oid=row.split(/\s+/)[2],bytes=fs.readFileSync(new URL(entry.dir+'/'+file,root));
  const actual=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');assert.equal(actual,oid,file+' archive bytes must match Git object');
  inputs.set(entry.ref+':'+file,bytes);
  manifest.push({ref:entry.ref,commit,file,blob:oid,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
}
fs.writeFileSync(new URL('snapshot-manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
childProcess.execFileSync=(command,args,options)=>{
 assert.ok(/(?:^|[/\\])git(?:\.exe)?$/i.test(command),'snapshot adapter allows git only');
 assert.equal(args.length,2);assert.equal(args[0],'show');assert.equal(options.encoding,'utf8');
 assert.ok(inputs.has(args[1]),'not a fixed exported Git input: '+args[1]);
 return inputs.get(args[1]).toString('utf8');
};
syncBuiltinESMExports();
console.log('TEST INPUT ADAPTER: '+manifest.length+' Git blobs verified; archived fixed refs replace EPERM git-show subprocess only. Browser NOT RUN.');
