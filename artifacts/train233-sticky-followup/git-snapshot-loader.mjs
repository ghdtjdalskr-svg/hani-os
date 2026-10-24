// Fixed, read-only Git inputs only. No application or browser behavior is replaced.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
const previous=new URL('../train233-three-failures/',import.meta.url),root=new URL('./',import.meta.url);
const entries=JSON.parse(fs.readFileSync(new URL('snapshot-plan.json',previous),'utf8')).map(entry=>({...entry,root:previous}));
entries.push({ref:'18916a02c82e1ff06e7598b8b2b94166b2010080',dir:'base',files:['hani-design-system.css'],root:new URL('../train233-two-failures/',import.meta.url)});
entries.push({ref:'c026b630a94802415c1c868fba2d5ea0dadf05b6',dir:'base',files:['hani-context-remote.css'],root});
const inputs=new Map(),manifest=[];
for(const entry of entries){
 const trees=fs.readFileSync(new URL(entry.dir+'.tree',entry.root),'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/);
 const commit=fs.readFileSync(new URL(entry.dir+'.commit',entry.root),'utf8').replace(/^\uFEFF/,'').trim();assert.match(commit,/^[a-f0-9]{40}$/);
 for(const file of entry.files){
  const row=trees.find(row=>row.endsWith('\t'+file));assert.ok(row,entry.ref+':'+file);
  const oid=row.split(/\s+/)[2],bytes=fs.readFileSync(new URL(entry.dir+'/'+file,entry.root));
  assert.equal(crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),oid,'Git blob identity');
  inputs.set(entry.ref+':'+file,bytes);manifest.push({ref:entry.ref,commit,file,blob:oid,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
}
fs.writeFileSync(new URL('snapshot-manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
childProcess.execFileSync=(command,args,options)=>{
 assert.match(command,/(?:^|[/\\])git(?:\.exe)?$/i);assert.deepEqual(args.slice(0,1),['show']);assert.equal(args.length,2);assert.equal(options.encoding,'utf8');
 assert.ok(inputs.has(args[1]),'not a fixed exported Git input: '+args[1]);return inputs.get(args[1]).toString('utf8');
};
syncBuiltinESMExports();
console.log('TEST INPUT ADAPTER: '+manifest.length+' Git blobs verified; original assertions run, browser NOT RUN.');
